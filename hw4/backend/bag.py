"""Shopping bag for logged-in customers (abandoned-bag nudge feature).

The site has no online checkout: the bag is a saved list that shoppers bring
to the store. Items left in a bag for a day trigger a "You left this behind"
email (see nudges.py).

Tables are created on first use (additive; the data pack's tables are untouched):
    bag_items(id, user_id, product_id, size, quantity, added_at, updated_at)
    nudge_emails(id, user_id, bag_updated_at, created_at, file)
    email_prefs(user_id, nudges_off, updated_at)
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

import tools
from models import BagItem, BagView

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "campus_customs.db"
MAX_QTY = 10


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_tables() -> None:
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS bag_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                product_id TEXT NOT NULL REFERENCES catalogue(product_id),
                size TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                added_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE (user_id, product_id, size)
            );
            CREATE TABLE IF NOT EXISTS nudge_emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                bag_updated_at TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                file TEXT
            );
            CREATE TABLE IF NOT EXISTS email_prefs (
                user_id INTEGER PRIMARY KEY REFERENCES users(id),
                nudges_off INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            """
        )


def view(user_id: int) -> BagView:
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, product_id, size, quantity FROM bag_items WHERE user_id = ? ORDER BY added_at, id", (user_id,)
        ).fetchall()
        off = conn.execute("SELECT nudges_off FROM email_prefs WHERE user_id = ?", (user_id,)).fetchone()
    items = []
    for r in rows:
        p = tools.product_row(r["product_id"])
        if not p:
            continue  # product no longer in the catalogue
        left = tools.stock_for(r["product_id"]).get(r["size"], 0)
        items.append(BagItem(
            id=r["id"], product_id=r["product_id"], name=p["name"], size=r["size"], quantity=r["quantity"],
            price=p["price"], image_url=f"/media/{p['image_file_path']}", in_stock=left, available=left >= r["quantity"],
        ))
    return BagView(
        items=items,
        count=sum(i.quantity for i in items),
        subtotal=round(sum(i.price * i.quantity for i in items), 2),
        reminders_on=not (off and off["nudges_off"]),
    )


def add(user_id: int, product_id: str, size: str, quantity: int = 1) -> str | None:
    """Add (or top up) an item. Returns an error message, or None if it worked."""
    if not tools.product_row(product_id):
        return "That product isn't in our catalogue."
    size = tools.normalize_size(size) or ""
    left = tools.stock_for(product_id).get(size)
    if left is None:
        return "We don't carry that size for this item."
    if left <= 0:
        return f"Sorry, {size} is sold out."
    with connect() as conn:
        row = conn.execute(
            "SELECT quantity FROM bag_items WHERE user_id = ? AND product_id = ? AND size = ?", (user_id, product_id, size)
        ).fetchone()
        new_qty = min((row["quantity"] if row else 0) + quantity, left, MAX_QTY)
        conn.execute(
            """INSERT INTO bag_items (user_id, product_id, size, quantity) VALUES (?, ?, ?, ?)
               ON CONFLICT (user_id, product_id, size)
               DO UPDATE SET quantity = excluded.quantity, updated_at = datetime('now')""",
            (user_id, product_id, size, new_qty),
        )
    return None


def remove(user_id: int, item_id: int) -> None:
    with connect() as conn:
        conn.execute("DELETE FROM bag_items WHERE id = ? AND user_id = ?", (item_id, user_id))


def set_reminders(user_id: int, on: bool) -> None:
    with connect() as conn:
        conn.execute(
            """INSERT INTO email_prefs (user_id, nudges_off) VALUES (?, ?)
               ON CONFLICT (user_id) DO UPDATE SET nudges_off = excluded.nudges_off, updated_at = datetime('now')""",
            (user_id, 0 if on else 1),
        )
