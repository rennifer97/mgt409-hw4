"""Code-level safety guardrails (Problem 12).

The prompt tells the agent the rules; these checks enforce the ones that
matter most even if the model slips:

- screen_input: card numbers, SSNs, and passwords typed into chat are blocked
  before they reach the AI, and redacted before anything is saved or logged.
- RateLimiter: caps messages per shopper per minute (cost and abuse control).
- check_reply: flags any dollar amount in a reply that no tool returned this
  turn (price honesty), removes links to outside websites (trusted sources
  only), and scrubs secrets if one ever appeared in a reply.
"""

from __future__ import annotations

import os
import re
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field

# 13–19 digits, optionally split by spaces or dashes (how people type card numbers)
CARD_RE = re.compile(r"\b(?:\d[ -]?){12,18}\d\b")
SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
PASSWORD_RE = re.compile(r"\b(?:my\s+)?(?:password|passcode|pwd|pin)\s*(?:is|=|:)\s*\S+", re.IGNORECASE)
PRICE_RE = re.compile(r"\$\s?(\d{1,4}(?:,\d{3})*(?:\.\d{1,2})?)")
# Any web link or bare domain the agent might paste (shop pages are linked by the site, not the chat)
LINK_RE = re.compile(r"\bhttps?://\S+|\bwww\.\S+|(?<![@\w.-])\b[\w-]+\.(?:com|net|org|io|co|shop|store)\b(?:/\S*)?", re.IGNORECASE)


def _luhn_ok(digits: str) -> bool:
    """Real card numbers pass the Luhn checksum; random long numbers usually don't."""
    total, double = 0, False
    for ch in reversed(digits):
        d = int(ch)
        if double:
            d = d * 2 - 9 if d * 2 > 9 else d * 2
        total += d
        double = not double
    return total % 10 == 0


@dataclass
class InputCheck:
    redacted: str
    found: list[str] = field(default_factory=list)  # e.g. ["payment_card", "password"]

    @property
    def blocked(self) -> bool:
        return bool(self.found)


def screen_input(text: str) -> InputCheck:
    found: list[str] = []

    def card(m: re.Match) -> str:
        digits = re.sub(r"\D", "", m.group())
        if 13 <= len(digits) <= 19 and _luhn_ok(digits):
            found.append("payment_card")
            return "[card number removed]"
        return m.group()

    out = CARD_RE.sub(card, text)
    if SSN_RE.search(out):
        found.append("ssn")
        out = SSN_RE.sub("[SSN removed]", out)
    if PASSWORD_RE.search(out):
        found.append("password")
        out = PASSWORD_RE.sub("[password removed]", out)
    return InputCheck(redacted=out, found=list(dict.fromkeys(found)))


BLOCKED_REPLY = (
    "For your safety I didn't read that. It looked like it had {what}, so I removed it "
    "and it won't be saved. Please never share that in chat: we can't take payments or "
    "account changes here. I'm happy to help with sizes, stock, and gift ideas, though!"
)
WHAT = {"payment_card": "a card number", "ssn": "a Social Security number", "password": "a password"}


def blocked_reply(found: list[str]) -> str:
    return BLOCKED_REPLY.format(what=" and ".join(WHAT[f] for f in found))


class RateLimiter:
    """Sliding window: at most `limit` messages per `window` seconds per key."""

    def __init__(self, limit: int = 15, window: float = 60.0) -> None:
        self.limit, self.window = limit, window
        self.hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        q = self.hits[key]
        while q and now - q[0] > self.window:
            q.popleft()
        if len(q) >= self.limit:
            return False
        q.append(now)
        return True


SECRET_ENV = ("PORTKEY_API_KEY", "SESSION_SECRET")


def check_reply(reply: str, allowed_prices: set[float]) -> tuple[str, list[str]]:
    """Returns (safe reply, flags). Flags go to the audit trail."""
    flags: list[str] = []
    for name in SECRET_ENV:
        secret = os.getenv(name)
        if secret and len(secret) > 8 and secret in reply:
            reply = reply.replace(secret, "[removed]")
            flags.append(f"secret_scrubbed:{name}")
    links = LINK_RE.findall(reply)
    if links:
        reply = LINK_RE.sub("[link removed]", reply)
        flags.append(f"external_link_removed:{len(links)}")
    for m in PRICE_RE.finditer(reply):
        value = round(float(m.group(1).replace(",", "")), 2)
        if value not in allowed_prices:
            flags.append(f"unverified_price:${value:.2f}")
    return reply, flags
