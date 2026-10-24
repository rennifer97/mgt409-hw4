"""Password hashing and login tokens for Campus Customs.

Stored format (matches the seeded users): pbkdf2_sha256$<salt>$<hash>
- PBKDF2-HMAC-SHA256, 120,000 iterations
- salt: random text, used as UTF-8 bytes; a new one only at sign-up
- hash: hex digest

Login never "unhashes" anything. It reads the salt out of the stored string,
hashes the typed password with that same salt and settings, and compares the
two hashes in constant time.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
import time

ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 120_000
TOKEN_TTL_SECONDS = 7 * 24 * 3600  # stay logged in for a week


def _pbkdf2(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), ITERATIONS).hex()


def hash_password(password: str) -> str:
    """Sign-up: make a fresh salt and return the string to store."""
    salt = secrets.token_hex(8)
    return f"{ALGORITHM}${salt}${_pbkdf2(password, salt)}"


def verify_password(password: str, stored: str) -> bool:
    """Login: re-hash with the stored salt and compare in constant time."""
    try:
        algorithm, salt, expected = stored.split("$")
    except ValueError:
        return False
    if algorithm != ALGORITHM:
        return False
    return hmac.compare_digest(_pbkdf2(password, salt), expected)


# Used when the email doesn't exist, so a wrong email takes as long as a wrong
# password and attackers can't tell which emails have accounts.
DUMMY_HASH = hash_password(secrets.token_hex(16))


# --- Login tokens -----------------------------------------------------------
# After login the browser gets a signed token "<user_id>.<expires>.<signature>".
# The signature uses SESSION_SECRET, so a token can't be forged or edited.
# The token never contains the password or its hash.

def _secret() -> bytes:
    secret = os.getenv("SESSION_SECRET")
    if not secret:
        # No secret set: make one for this run (everyone is logged out on restart).
        secret = os.environ.setdefault("SESSION_SECRET", secrets.token_hex(32))
    return secret.encode()


def _sign(payload: str) -> str:
    sig = hmac.new(_secret(), payload.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(sig).decode().rstrip("=")


def make_token(user_id: int) -> str:
    payload = f"{user_id}.{int(time.time()) + TOKEN_TTL_SECONDS}"
    return f"{payload}.{_sign(payload)}"


def read_token(token: str) -> int | None:
    """Return the user id if the token is genuine and not expired."""
    try:
        user_id, expires, sig = token.split(".")
    except ValueError:
        return None
    if not hmac.compare_digest(_sign(f"{user_id}.{expires}"), sig):
        return None
    if not (user_id.isdigit() and expires.isdigit()) or int(expires) < time.time():
        return None
    return int(user_id)
