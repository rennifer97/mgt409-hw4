"""Abandoned-bag nudges: "You left this behind" emails.

A logged-in shopper who leaves items in their bag and doesn't touch it for
NUDGE_AFTER_HOURS (24 by default, i.e. the next day) gets one reminder email
with photos, sizes, current prices, honest stock notes, links back to the
products and the bag, and an unsubscribe link. Each bag change is nudged at
most once, and shoppers who unsubscribed are skipped.

Sending: emails are written to output/outbox/ as HTML files you can open
(nothing is sent to a real inbox). To really send, swap OutboxSender for an
email service sender with the same .send() method.

Runs automatically every 30 minutes inside the backend (main.py), or by hand:
    cd backend && python nudges.py            # send any due nudges
    python nudges.py --hours 0 --dry-run      # list who would get one right now
"""

from __future__ import annotations

import argparse
import html
import os
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

import bag
from auth import _sign

ROOT = Path(__file__).resolve().parent.parent
# Same .env files as the server, so unsubscribe links are signed with the same SESSION_SECRET
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent.parent / ".env")
OUTBOX = ROOT / "output" / "outbox"
NUDGE_AFTER_HOURS = 24
SITE_URL = os.getenv("SITE_URL", "http://localhost:5173")  # links and images in emails must be absolute


def unsubscribe_link(user_id: int) -> str:
    payload = f"unsub.{user_id}"
    return f"{SITE_URL}/api/email/unsubscribe?u={user_id}&t={_sign(payload)}"


def check_unsubscribe(user_id: int, token: str) -> bool:
    import hmac
    return hmac.compare_digest(_sign(f"unsub.{user_id}"), token)


def due(hours: float = NUDGE_AFTER_HOURS) -> list[dict]:
    """Shoppers whose bag hasn't changed for `hours`, who haven't been nudged for it, and haven't opted out."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")
    with bag.connect() as conn:
        rows = conn.execute(
            """
            WITH last AS (SELECT user_id, MAX(updated_at) AS last_change FROM bag_items GROUP BY user_id)
            SELECT u.id, u.email, coalesce(u.first_name, u.name) AS first_name, last.last_change
            FROM last JOIN users u ON u.id = last.user_id
            LEFT JOIN email_prefs p ON p.user_id = u.id
            WHERE coalesce(p.nudges_off, 0) = 0
              AND last.last_change <= ?
              AND NOT EXISTS (SELECT 1 FROM nudge_emails n WHERE n.user_id = u.id AND n.bag_updated_at = last.last_change)
            """,
            (cutoff,),
        ).fetchall()
    return [dict(r) for r in rows]


def render(first_name: str, user_id: int) -> tuple[str, str]:
    """Returns (subject, html body) built from the live bag: current prices and stock."""
    view = bag.view(user_id)
    e = html.escape
    rows = []
    for it in view.items:
        if it.in_stock == 0:
            note = f'<span style="color:#9b2c1f">Sold out in {e(it.size)} since you saved it</span>'
        elif it.in_stock <= 5:
            note = f'<span style="color:#9b2c1f">Only {it.in_stock} left in {e(it.size)}</span>'
        else:
            note = f"Still in stock in {e(it.size)}"
        link = f"{SITE_URL}/products/{it.product_id}"
        rows.append(f"""
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e6e1d8;width:120px">
            <a href="{link}"><img src="{SITE_URL}{it.image_url}" width="110" height="110" alt="{e(it.name)}"
              style="display:block;width:110px;height:110px;object-fit:cover;background:#f6f3ee;border:0"></a>
          </td>
          <td style="padding:12px 0 12px 16px;border-bottom:1px solid #e6e1d8;font:15px/1.45 Arial,sans-serif;color:#15181d">
            <a href="{link}" style="color:#15181d;font-weight:bold;text-decoration:none">{e(it.name)}</a><br>
            Size {e(it.size)} · Qty {it.quantity} · ${it.price:.2f}<br>
            <span style="font-size:13px;color:#5b616b">{note}</span>
          </td>
        </tr>""")
    n = len(view.items)
    subject = f"{first_name}, you left {'this' if n == 1 else 'these'} behind"
    body = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>{e(subject)}</title></head>
<body style="margin:0;background:#f6f3ee">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff">
    <tr><td style="background:#0b1f3a;padding:22px;text-align:center;font:600 22px Georgia,serif;letter-spacing:3px;color:#ffffff">CAMPUS CUSTOMS</td></tr>
    <tr><td style="padding:32px 32px 8px;font:500 30px/1.2 Georgia,serif;color:#15181d">You left {'this' if n == 1 else 'these'} behind, {e(first_name)}.</td></tr>
    <tr><td style="padding:0 32px 8px;font:15px/1.6 Arial,sans-serif;color:#5b616b">
      Your bag is saved and waiting. Show it at 57 Broadway (a few steps from Old Campus) and we'll have your sizes ready.
    </td></tr>
    <tr><td style="padding:8px 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">{''.join(rows)}</table></td></tr>
    <tr><td style="padding:8px 32px 4px;font:15px Arial,sans-serif;color:#15181d">Bag total: <b>${view.subtotal:.2f}</b></td></tr>
    <tr><td style="padding:20px 32px 32px">
      <a href="{SITE_URL}/bag" style="display:inline-block;background:#15181d;color:#ffffff;padding:14px 26px;font:bold 13px Arial,sans-serif;letter-spacing:2px;text-decoration:none">VIEW YOUR BAG</a>
    </td></tr>
    <tr><td style="padding:18px 32px;background:#f6f3ee;font:12px/1.6 Arial,sans-serif;color:#5b616b">
      Campus Customs · 57 Broadway, New Haven, CT 06511<br>
      You're getting this because you saved items to your bag. Prices and stock are live as of this email.
      We never ask for card numbers or passwords by email.<br>
      <a href="{unsubscribe_link(user_id)}" style="color:#5b616b">Unsubscribe from bag reminders</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>"""
    return subject, body


class OutboxSender:
    """Writes each email to output/outbox/ instead of sending it (no real inboxes are contacted)."""

    def send(self, to: str, subject: str, body: str, user_id: int) -> Path:
        OUTBOX.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        path = OUTBOX / f"{stamp}_user{user_id}.html"
        banner = (
            '<div style="font:13px Arial,sans-serif;background:#fff4e5;color:#5c3b00;padding:10px 14px;border-bottom:1px solid #e6c48a">'
            f"<b>Outbox preview (not sent)</b> · To: {html.escape(to)} · Subject: {html.escape(subject)}</div>"
        )
        path.write_text(body.replace("<body style=\"margin:0;background:#f6f3ee\">", "<body style=\"margin:0;background:#f6f3ee\">" + banner, 1), encoding="utf-8")
        return path


def run(hours: float = NUDGE_AFTER_HOURS, dry_run: bool = False, sender: OutboxSender | None = None) -> list[dict]:
    bag.ensure_tables()
    sender = sender or OutboxSender()
    sent = []
    for d in due(hours):
        subject, body = render(d["first_name"], d["id"])
        if dry_run:
            sent.append({**d, "subject": subject})
            continue
        path = sender.send(d["email"], subject, body, d["id"])
        with bag.connect() as conn:
            conn.execute(
                "INSERT INTO nudge_emails (user_id, bag_updated_at, file) VALUES (?, ?, ?)",
                (d["id"], d["last_change"], str(path.relative_to(ROOT))),
            )
        sent.append({**d, "subject": subject, "file": str(path.relative_to(ROOT))})
    return sent


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Send 'you left this behind' bag reminders.")
    ap.add_argument("--hours", type=float, default=NUDGE_AFTER_HOURS, help="idle time before a nudge (default 24)")
    ap.add_argument("--dry-run", action="store_true", help="list who is due without writing emails")
    args = ap.parse_args()
    results = run(args.hours, args.dry_run)
    if not results:
        print("No bags due for a reminder.")
    for r in results:
        print(f"user#{r['id']} ({r['email']}): {r['subject']}" + (f" -> {r['file']}" if r.get("file") else " [dry run]"))
