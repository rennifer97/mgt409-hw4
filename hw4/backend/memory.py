"""Customer memory (Problem 8): saved chat history for logged-in users.

Uses the existing chat_messages table, one row per message:
    id, user_id -> users.id, role ('user' | 'assistant'), content,
    products_json (product cards shown with that reply), created_at
Guests are never saved; their history lives only in the browser tab.
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

import tools
from models import ChatTurn, SavedMessage, WelcomeBack

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "campus_customs.db"
MAX_RELOAD = 60  # messages sent back to the website when a customer returns


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _product_ids(products_json: str | None) -> list[str]:
    """Older rows store full product dicts; newer ones store ids. Accept both."""
    if not products_json:
        return []
    try:
        items = json.loads(products_json)
    except json.JSONDecodeError:
        return []
    return [i["product_id"] if isinstance(i, dict) else str(i) for i in items if i]


def save_turn(user_id: int, user_text: str, reply: str, product_ids: list[str]) -> None:
    """Store the shopper's message and the agent's reply."""
    with connect() as conn:
        conn.execute(
            "INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'user', ?)",
            (user_id, user_text),
        )
        conn.execute(
            "INSERT INTO chat_messages (user_id, role, content, products_json) VALUES (?, 'assistant', ?, ?)",
            (user_id, reply, json.dumps(product_ids) if product_ids else None),
        )


def recent_turns(user_id: int, limit: int) -> list[ChatTurn]:
    """The last `limit` messages, oldest first, for the agent's memory."""
    with connect() as conn:
        rows = conn.execute(
            "SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    return [ChatTurn(role=r["role"], text=r["content"][:4000]) for r in reversed(rows)]


def load_history(user_id: int) -> list[SavedMessage]:
    """Messages to redraw the chat panel, with product cards rebuilt from the catalogue."""
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, role, content, products_json, created_at FROM chat_messages "
            "WHERE user_id = ? ORDER BY id DESC LIMIT ?",
            (user_id, MAX_RELOAD),
        ).fetchall()
    return [
        SavedMessage(
            id=r["id"], role=r["role"], text=r["content"], created_at=r["created_at"],
            products=tools.product_cards(_product_ids(r["products_json"])),
        )
        for r in reversed(rows)
    ]


def clear_history(user_id: int) -> int:
    with connect() as conn:
        return conn.execute("DELETE FROM chat_messages WHERE user_id = ?", (user_id,)).rowcount


def welcome_back(user_id: int, first_name: str) -> WelcomeBack:
    """Problem 9: "pick up where you left off" for a returning customer.

    Finds the most recent reply that showed product cards and the question
    that led to it. Built straight from saved rows, with no AI call, so it's
    instant and costs nothing.
    """
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, role, content, products_json FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT 200",
            (user_id,),
        ).fetchall()
    rows = list(reversed(rows))  # oldest first
    for i in range(len(rows) - 1, -1, -1):
        ids = _product_ids(rows[i]["products_json"]) if rows[i]["role"] == "assistant" else []
        cards = tools.product_cards(ids)
        if not cards:
            continue
        question = next((rows[j]["content"] for j in range(i - 1, -1, -1) if rows[j]["role"] == "user"), "")
        if len(cards) == 1:
            text = (f"Hey {first_name}, welcome back! Last time you were checking out the "
                    f"{cards[0].name}. Want to pick up where you left off?")
        else:
            text = (f"Hey {first_name}, welcome back! Last time you were looking at these "
                    f"({len(cards)} picks). Want to keep browsing them?")
        return WelcomeBack(text=text, topic=question, products=cards)
    return WelcomeBack(text=f"Hey {first_name}, welcome back! What are we shopping for today?")
