"""Campus Customs shop API.

Run from backend/:  uvicorn main:app --reload --port 8000
Open API docs:      http://127.0.0.1:8000/docs
Frontend (Vite):    http://127.0.0.1:5173

Problem 3: serves products, stock, and product images from data/campus_customs.db.
Problem 4: create account and log in (hashing lives in auth.py).
Problem 5: /api/chat runs the PydanticAI agent (agent.py, tools.py, models.py,
prompts/prompt.md).
Problem 8: logged-in chats are saved and reloaded (memory.py); the agent knows
the customer and the page they're on.
Problem 5 grows this into the PydanticAI agent backend.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
import sqlite3
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import asyncio

import audit
import bag
import memory
import nudges
import safety
import tools
from agent import MAX_HISTORY, run_chat
from auth import DUMMY_HASH, hash_password, make_token, read_token, verify_password
from models import AddToBagRequest, BagView, ChatReply, ChatRequest, Customer, SavedMessage, WelcomeBack

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "campus_customs.db"
IMAGES_DIR = DATA_DIR / "products"
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent.parent / ".env")  # MGT409/.env holds the Portkey key

SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"]

app = FastAPI(title="Campus Customs", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Only the photo folder is public, never the database file.
app.mount("/media/products", StaticFiles(directory=IMAGES_DIR), name="product-images")


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


class SizeStock(BaseModel):
    size: str
    quantity: int


class Product(BaseModel):
    product_id: str
    name: str
    garment_type: str
    category: str  # simple shopper group, e.g. "hoodie" (Problem 10 filters)
    description: str
    colors: list[str]
    search_tags: list[str]
    price: float
    image_url: str
    total_stock: int
    sizes_in_stock: list[str]  # Problem 10: shown on product cards on hover


class ProductDetail(Product):
    inventory: list[SizeStock]


def row_to_product(row: dict) -> dict:
    stock = tools.stock_for(row["product_id"])
    return {
        "product_id": row["product_id"],
        "name": row["name"],
        "garment_type": row["garment_type"],
        "category": tools.category_for(row["garment_type"]),
        "description": row["description"],
        "colors": json.loads(row["colors"]),
        "search_tags": json.loads(row["search_tags"]),
        "price": row["price"],
        # image_file_path is "products/<file>.jpg", served under /media/
        "image_url": f"/media/{row['image_file_path']}",
        "total_stock": sum(stock.values()),
        "sizes_in_stock": sorted((s for s, q in stock.items() if q > 0),
                                 key=lambda s: SIZE_ORDER.index(s) if s in SIZE_ORDER else 99),
    }


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "database": DB_PATH.exists()}


# Products come from tools.py's in-memory catalogue (Problem 9), which also
# fills in the 3 placeholder products, so the site and the agent agree.
@app.get("/api/products", response_model=list[Product])
def list_products() -> list[dict]:
    return [row_to_product(r) for r in tools.all_products()]


@app.get("/api/products/{product_id}", response_model=ProductDetail)
def get_product(product_id: str) -> dict:
    row = tools.product_row(product_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Product not found")
    product = row_to_product(row)
    product["inventory"] = sorted(
        ({"size": size, "quantity": qty} for size, qty in tools.stock_for(product_id).items()),
        key=lambda s: SIZE_ORDER.index(s["size"]) if s["size"] in SIZE_ORDER else 99,
    )
    return product


# --- Accounts (Problem 4) ---------------------------------------------------

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD = 8
PASSWORD_MAX_AGE_DAYS = 365  # Problem 12: passwords must be refreshed once a year


def _ensure_password_column() -> None:
    """Add users.password_changed_at if this database doesn't have it yet (one-time, additive)."""
    with connect() as conn:
        cols = {r["name"] for r in conn.execute("PRAGMA table_info(users)")}
        if "password_changed_at" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN password_changed_at TEXT")


_ensure_password_column()


def password_age_days(row: sqlite3.Row) -> int:
    """Days since the password was set. Accounts that predate the column count from created_at."""
    set_at = row["password_changed_at"] or row["created_at"]
    then = datetime.fromisoformat(set_at.replace(" ", "T")).replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - then).days


class SignupRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    email: str = Field(max_length=254)
    password: str = Field(max_length=200)
    confirm_password: str | None = None


class LoginRequest(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=200)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(max_length=200)
    new_password: str = Field(max_length=200)
    confirm_password: str = Field(max_length=200)


class User(BaseModel):
    """What the site sees about a user. Never includes the password hash."""
    id: int
    first_name: str
    last_name: str
    name: str
    email: str
    password_expired: bool = False  # True once the password is over a year old
    password_days_left: int = PASSWORD_MAX_AGE_DAYS


class AuthResponse(BaseModel):
    token: str
    user: User


def row_to_user(row: sqlite3.Row) -> User:
    first = row["first_name"] or row["name"].split(" ")[0]
    last = row["last_name"] or " ".join(row["name"].split(" ")[1:])
    age = password_age_days(row)
    return User(
        id=row["id"], first_name=first, last_name=last, name=row["name"], email=row["email"],
        password_expired=age >= PASSWORD_MAX_AGE_DAYS,
        password_days_left=max(PASSWORD_MAX_AGE_DAYS - age, 0),
    )


def clean_email(email: str) -> str:
    return email.strip().lower()


@app.post("/api/auth/signup", response_model=AuthResponse, status_code=201)
def signup(req: SignupRequest) -> AuthResponse:
    first, last, email = req.first_name.strip(), req.last_name.strip(), clean_email(req.email)
    if not first or not last:
        raise HTTPException(400, "Please enter your first and last name.")
    if not EMAIL_RE.match(email):
        raise HTTPException(400, "Please enter a valid email address.")
    if len(req.password) < MIN_PASSWORD:
        raise HTTPException(400, f"Password must be at least {MIN_PASSWORD} characters.")
    if req.confirm_password is not None and req.confirm_password != req.password:
        raise HTTPException(400, "Passwords do not match.")
    with connect() as conn:
        if conn.execute("SELECT 1 FROM users WHERE lower(email) = ?", (email,)).fetchone():
            raise HTTPException(409, "An account with that email already exists. Try logging in.")
        cur = conn.execute(
            "INSERT INTO users (name, email, password_hash, first_name, last_name, password_changed_at) "
            "VALUES (?, ?, ?, ?, ?, datetime('now'))",
            (f"{first} {last}", email, hash_password(req.password), first, last),
        )
        row = conn.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    return AuthResponse(token=make_token(row["id"]), user=row_to_user(row))


@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: LoginRequest) -> AuthResponse:
    with connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE lower(email) = ?", (clean_email(req.email),)).fetchone()
    # Always run one hash, so a wrong email and a wrong password take the same time.
    ok = verify_password(req.password, row["password_hash"] if row else DUMMY_HASH)
    if not row or not ok:
        raise HTTPException(401, "Email or password is incorrect.")
    return AuthResponse(token=make_token(row["id"]), user=row_to_user(row))


@app.post("/api/auth/change-password", response_model=AuthResponse)
def change_password(req: ChangePasswordRequest, authorization: str | None = Header(default=None)) -> AuthResponse:
    """Problem 12: change password (required once it's a year old). Needs the current password."""
    user = current_user(authorization)
    if user is None:
        raise HTTPException(401, "Please log in again.")
    with connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user.id,)).fetchone()
        if not verify_password(req.current_password, row["password_hash"]):
            raise HTTPException(400, "Your current password is incorrect.")
        if len(req.new_password) < MIN_PASSWORD:
            raise HTTPException(400, f"New password must be at least {MIN_PASSWORD} characters.")
        if req.new_password != req.confirm_password:
            raise HTTPException(400, "New passwords do not match.")
        if verify_password(req.new_password, row["password_hash"]):
            raise HTTPException(400, "Please choose a password you haven't just used.")
        conn.execute(
            "UPDATE users SET password_hash = ?, password_changed_at = datetime('now') WHERE id = ?",
            (hash_password(req.new_password), user.id),
        )
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user.id,)).fetchone()
    return AuthResponse(token=make_token(row["id"]), user=row_to_user(row))


def current_user(authorization: str | None) -> User | None:
    """Read 'Authorization: Bearer <token>' and look up that user."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    user_id = read_token(authorization.removeprefix("Bearer ").strip())
    if user_id is None:
        return None
    with connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return row_to_user(row) if row else None


@app.get("/api/auth/me", response_model=User)
def me(authorization: str | None = Header(default=None)) -> User:
    user = current_user(authorization)
    if user is None:
        raise HTTPException(401, "Not logged in.")
    return user


rate_limiter = safety.RateLimiter(limit=15, window=60)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@app.post("/api/chat", response_model=ChatReply)
async def chat(req: ChatRequest, request: Request, authorization: str | None = Header(default=None)) -> ChatReply:
    """A message from the website's chat widget -> a reply from the agent.

    Logged in: the agent gets the customer's name and email, its memory comes
    from the database, and both messages are saved. Guest: the browser's
    history is used and nothing is saved.
    """
    user = current_user(authorization)
    who = f"user#{user.id}" if user else "guest"  # the audit trail never stores emails
    if user and user.password_expired:
        raise HTTPException(403, "Your password is over a year old. Please update it to keep chatting.")

    # Safety (Problem 12): rate limit, then block sensitive data before the AI sees it.
    if not rate_limiter.allow(who if user else f"ip:{request.client.host if request.client else '?'}"):
        audit.append({"time": _now(), "who": who, "message": "(not read)", "stop_reason": "rate_limited", "steps": []})
        raise HTTPException(429, "You're sending messages very quickly. Give it a few seconds and try again.")
    screened = safety.screen_input(req.message)
    if screened.blocked:
        reply = safety.blocked_reply(screened.found)
        audit.append({"time": _now(), "who": who, "page": req.page.path if req.page else None,
                      "message": audit.short(screened.redacted, 300), "stop_reason": "blocked_input",
                      "safety_flags": [f"blocked:{f}" for f in screened.found], "steps": [], "model_calls": 0})
        if user:
            memory.save_turn(user.id, screened.redacted, reply, [])
        return ChatReply(reply=reply)

    if user:
        customer = Customer(first_name=user.first_name, last_name=user.last_name, email=user.email)
        history = memory.recent_turns(user.id, MAX_HISTORY)
    else:
        customer, history = None, req.history
    result = await run_chat(req.message, history, customer, req.page, who)
    if user:
        shown = [p.product_id for p in result.products]
        # Asked on a product page with no cards shown? Remember that product, so
        # "welcome back" (Problem 9) knows what they were looking at.
        if not shown and req.page and req.page.product_id and tools.product_row(req.page.product_id):
            shown = [req.page.product_id]
        memory.save_turn(user.id, req.message, result.reply, shown)
    return result


@app.get("/api/chat/history", response_model=list[SavedMessage])
def chat_history(authorization: str | None = Header(default=None)) -> list[SavedMessage]:
    """The logged-in customer's saved chat, oldest first, to redraw the chat panel."""
    user = current_user(authorization)
    if user is None:
        raise HTTPException(401, "Log in to see saved chats.")
    return memory.load_history(user.id)


@app.get("/api/chat/welcome", response_model=WelcomeBack)
def chat_welcome(authorization: str | None = Header(default=None)) -> WelcomeBack:
    """Problem 9: "Welcome back, <name>! Last time you were looking at..." for the chat panel."""
    user = current_user(authorization)
    if user is None:
        raise HTTPException(401, "Log in first.")
    return memory.welcome_back(user.id, user.first_name)


@app.delete("/api/chat/history")
def clear_chat_history(authorization: str | None = Header(default=None)) -> dict:
    """Let a customer wipe their own saved chat."""
    user = current_user(authorization)
    if user is None:
        raise HTTPException(401, "Log in first.")
    return {"deleted": memory.clear_history(user.id)}


# --- Bag and "you left this behind" nudges ----------------------------------

bag.ensure_tables()


def _require_user(authorization: str | None) -> User:
    user = current_user(authorization)
    if user is None:
        raise HTTPException(401, "Log in to use your bag.")
    return user


@app.get("/api/bag", response_model=BagView)
def get_bag(authorization: str | None = Header(default=None)) -> BagView:
    return bag.view(_require_user(authorization).id)


@app.post("/api/bag", response_model=BagView)
def add_to_bag(req: AddToBagRequest, authorization: str | None = Header(default=None)) -> BagView:
    user = _require_user(authorization)
    error = bag.add(user.id, req.product_id, req.size, req.quantity)
    if error:
        raise HTTPException(400, error)
    return bag.view(user.id)


@app.delete("/api/bag/{item_id}", response_model=BagView)
def remove_from_bag(item_id: int, authorization: str | None = Header(default=None)) -> BagView:
    user = _require_user(authorization)
    bag.remove(user.id, item_id)
    return bag.view(user.id)


@app.post("/api/bag/reminders", response_model=BagView)
def bag_reminders(on: bool, authorization: str | None = Header(default=None)) -> BagView:
    user = _require_user(authorization)
    bag.set_reminders(user.id, on)
    return bag.view(user.id)


@app.get("/api/email/unsubscribe", response_class=HTMLResponse)
def unsubscribe(u: int, t: str) -> str:
    """One-click unsubscribe from the link in a reminder email (signed, so links can't be forged)."""
    if not nudges.check_unsubscribe(u, t):
        raise HTTPException(400, "This unsubscribe link isn't valid.")
    bag.set_reminders(u, False)
    return ("<!doctype html><title>Unsubscribed</title><body style='font:16px Arial;padding:40px'>"
            "<h1 style='font-family:Georgia'>You're unsubscribed.</h1>"
            "<p>You won't get bag reminders from Campus Customs anymore. Your bag is still saved.</p>"
            f"<p><a href='{nudges.SITE_URL}/bag'>Back to your bag</a></p></body>")


async def _nudge_loop() -> None:
    """Checks for abandoned bags every 30 minutes while the server runs (a daily cron would also work)."""
    while True:
        try:
            sent = await asyncio.to_thread(nudges.run)
            for n in sent:
                audit.append({"time": _now(), "who": f"user#{n['id']}", "stop_reason": "bag_nudge_written",
                              "message": n["subject"], "steps": [], "file": n.get("file")})
        except Exception:
            logging.getLogger("campus_customs").exception("Nudge run failed")
        await asyncio.sleep(30 * 60)


@app.on_event("startup")
async def _start_nudges() -> None:
    asyncio.create_task(_nudge_loop())
