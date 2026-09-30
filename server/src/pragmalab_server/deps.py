"""The signed-in user for a request (from the "Authorization: Bearer <token>" header)."""

import sqlite3
import time
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException

from pragmalab_server import db
from pragmalab_server.security import token_hash


@dataclass
class Session:
    user: sqlite3.Row
    token_hash: str
    verified: bool  # teachers: entered their email code for this sign-in


def _session(authorization: str | None = Header(default=None)) -> Session:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Please sign in.")
    th = token_hash(authorization[7:].strip())
    row = db.one("SELECT user_id, expires_at, verified FROM sessions WHERE token_hash = ?", (th,))
    if not row or row["expires_at"] < time.time():
        raise HTTPException(401, "Your sign-in has expired. Please sign in again.")
    user = db.one("SELECT * FROM users WHERE id = ?", (row["user_id"],))
    if not user:
        raise HTTPException(401, "This account no longer exists.")
    return Session(user=user, token_hash=th, verified=bool(row["verified"]) or user["role"] == "student")


def any_session(s: Session = Depends(_session)) -> Session:
    """Signed in (teachers may still need to enter their email code)."""
    return s


def full_session(s: Session = Depends(_session)) -> Session:
    """Signed in and, for teachers, confirmed with the email code."""
    if not s.verified:
        raise HTTPException(403, "Please confirm your email code first.")
    return s
