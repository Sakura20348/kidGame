"""Accounts and sign-in.

POST /api/auth/signup       {role, email?, name, password, grade?, ageGroup?, school?} -> {token, user, verified}
POST /api/auth/login        {email, password, role}                                  -> {token, user, verified}
GET  /api/auth/me                                                                    -> {user, verified, classCode}
POST /api/auth/send-code    teachers: email a 6-digit code                           -> {sent, email, devCode?}
POST /api/auth/verify-code  {code}                                                   -> {user, verified}
PATCH /api/auth/me          {name}
POST /api/auth/password     {current, next}
POST /api/auth/email        {email}   (teachers)
POST /api/auth/logout

Students sign in with a 6-digit ID the server gives them; teachers use their email and
confirm every sign-in with a code sent to that email.
"""

import json
import re
import time
from collections import defaultdict, deque
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from pragmalab_server import db
from pragmalab_server.config import settings
from pragmalab_server.deps import Session, any_session
from pragmalab_server.mailer import email_enabled, send_code_email
from pragmalab_server.people import ensure_class, get_user, now_iso, public_user, room_of
from pragmalab_server.security import (
    check_password,
    hash_password,
    legacy_hash,
    new_code,
    new_student_id,
    new_token,
    token_hash,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
STUDENT_ID_RE = re.compile(r"^\d{6}$")
MAX_GRADE = 4  # LittleReaderLab is for Class 0–4
RESEND_AFTER_S = 30
MAX_CODE_TRIES = 5


def band_for_grade(grade: int) -> str:
    """Each class is separate: 2 -> "Class 2"."""
    return f"Class {grade}"


# ------------------------------------------------------------ simple brute-force protection

_attempts: dict[str, deque[float]] = defaultdict(deque)


def _limit(key: str, per_minute: int = 8) -> None:
    q = _attempts[key]
    now = time.time()
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= per_minute:
        raise HTTPException(429, "Too many tries. Please wait a minute and try again.")
    q.append(now)


# ------------------------------------------------------------ helpers

def _start_session(user_id: str, verified: bool) -> str:
    token = new_token()
    with db.tx() as conn:
        now = time.time()
        conn.execute("DELETE FROM sessions WHERE expires_at < ?", (now,))
        conn.execute(
            "INSERT INTO sessions(token_hash, user_id, created_at, expires_at, verified) VALUES(?, ?, ?, ?, ?)",
            (token_hash(token), user_id, now, now + settings.session_days * 86400, int(verified)),
        )
    return token


def _me(user_id: str, verified: bool) -> dict:
    user = get_user(user_id)
    assert user is not None
    room = room_of(user)
    return {"user": public_user(user), "verified": verified or user["role"] == "student", "classCode": room["code"] if room else None}


class SignupIn(BaseModel):
    role: Literal["student", "teacher"]
    email: str | None = Field(default=None, max_length=200)
    name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=6, max_length=200)
    grade: int | None = Field(default=None, ge=0, le=MAX_GRADE)
    ageGroup: str | None = None
    school: str | None = Field(default=None, max_length=120)


class LoginIn(BaseModel):
    email: str = Field(max_length=200)
    password: str = Field(max_length=200)
    role: Literal["student", "teacher"]


# ------------------------------------------------------------ sign up / sign in

@router.post("/signup")
def signup(body: SignupIn) -> dict:
    name = " ".join(body.name.split())
    if body.role == "teacher":
        login = (body.email or "").strip()
        if not EMAIL_RE.match(login):
            raise HTTPException(422, "Enter a valid email address.")
        if get_user(login):
            raise HTTPException(409, "An account with this email already exists. Try signing in.")
        grade, band, school = None, None, (body.school or "").strip() or None
    else:
        # students get a 6-digit ID from the server (children often have no email)
        login = new_student_id()
        while get_user(login):
            login = new_student_id()
        if body.grade is None:
            raise HTTPException(422, "Choose your class (0–4).")
        grade = body.grade
        band = band_for_grade(grade)
        school = None

    now = now_iso()
    with db.tx() as conn:
        conn.execute(
            "INSERT INTO users(id, name, role, grade, age_group, school, password_hash, created_at, joined_at, last_seen) "
            "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (login, name, body.role, grade, band, school, hash_password(body.password), now, now, now),
        )
        if body.role == "teacher":
            ensure_class(conn, login)
        db.bump(conn, "people")
    token = _start_session(login, verified=False)
    return {"token": token, **_me(login, False)}


@router.post("/login")
def login(body: LoginIn) -> dict:
    login_id = body.email.strip()
    _limit(f"login:{login_id.lower()}")
    user = get_user(login_id)
    if not user:
        if STUDENT_ID_RE.match(login_id):
            raise HTTPException(404, "We can’t find a student with this ID. Check the number, or create an account.")
        raise HTTPException(404, "We can’t find an account with this email. Check it, or create an account.")
    if user["role"] != body.role:
        other = "Student" if user["role"] == "student" else "Teacher"
        raise HTTPException(409, f"This account is registered as a {user['role']}. Switch to “{other}” to sign in.")

    ok = check_password(body.password, user["password_hash"])
    upgrade = False
    if not ok and not user["password_hash"]:
        # accounts from the old browser-only app: check their old hash once, then store a real one
        ok = user["legacy_hash"] is None or user["legacy_hash"] == legacy_hash(user["id"], body.password)
        upgrade = ok
    if not ok:
        raise HTTPException(401, "That password isn’t right. Please try again.")
    with db.tx() as conn:
        if upgrade:
            conn.execute("UPDATE users SET password_hash = ?, legacy_hash = NULL WHERE id = ?", (hash_password(body.password), user["id"]))
        if user["role"] == "teacher":
            ensure_class(conn, user["id"])
    token = _start_session(user["id"], verified=False)
    return {"token": token, **_me(user["id"], False)}


@router.get("/me")
def me(s: Session = Depends(any_session)) -> dict:
    return _me(s.user["id"], s.verified)


@router.post("/logout")
def logout(s: Session = Depends(any_session)) -> dict:
    with db.tx() as conn:
        conn.execute("DELETE FROM sessions WHERE token_hash = ?", (s.token_hash,))
    return {"ok": True}


# ------------------------------------------------------------ teacher email codes

@router.post("/send-code")
def send_code(s: Session = Depends(any_session)) -> dict:
    user = s.user
    if user["role"] != "teacher":
        raise HTTPException(400, "Only teachers confirm their email.")
    if s.verified:
        return {"sent": False, "email": user["id"], "verified": True}
    last = db.one("SELECT sent_at FROM codes WHERE user_id = ?", (user["id"],))
    wait = RESEND_AFTER_S - (time.time() - last["sent_at"]) if last else 0
    if wait > 0:
        raise HTTPException(429, f"Please wait {int(wait) + 1} seconds before asking for a new code.")
    code = new_code()
    with db.tx() as conn:
        conn.execute(
            "INSERT INTO codes(user_id, code_hash, expires_at, sent_at, attempts) VALUES(?, ?, ?, ?, 0) "
            "ON CONFLICT(user_id) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, sent_at = excluded.sent_at, attempts = 0",
            (user["id"], token_hash(code), time.time() + settings.code_ttl_minutes * 60, time.time()),
        )
    sent = False
    if email_enabled():
        try:
            send_code_email(user["id"], user["name"], code)
            sent = True
        except Exception as e:  # noqa: BLE001 – tell the teacher instead of failing silently
            if not settings.show_dev_codes:
                raise HTTPException(502, f"We couldn’t send the email ({type(e).__name__}). Please try again later.") from e
    out: dict = {"sent": sent, "email": user["id"], "expiresInMinutes": settings.code_ttl_minutes}
    if settings.show_dev_codes:
        out["devCode"] = code  # development only: no email service, so the page shows the code
    return out


class CodeIn(BaseModel):
    code: str = Field(min_length=6, max_length=6)


@router.post("/verify-code")
def verify_code(body: CodeIn, s: Session = Depends(any_session)) -> dict:
    user = s.user
    row = db.one("SELECT * FROM codes WHERE user_id = ?", (user["id"],))
    if not row or row["expires_at"] < time.time():
        raise HTTPException(410, "This code has expired. Press “Send a new code”.")
    if row["attempts"] >= MAX_CODE_TRIES:
        raise HTTPException(429, "Too many wrong codes. Press “Send a new code”.")
    if token_hash(body.code.strip()) != row["code_hash"]:
        with db.tx() as conn:
            conn.execute("UPDATE codes SET attempts = attempts + 1 WHERE user_id = ?", (user["id"],))
        raise HTTPException(400, "That code isn’t right. Check your email and try again.")
    with db.tx() as conn:
        conn.execute("DELETE FROM codes WHERE user_id = ?", (user["id"],))
        conn.execute("UPDATE sessions SET verified = 1 WHERE token_hash = ?", (s.token_hash,))
        if not user["verified_at"]:
            conn.execute("UPDATE users SET verified_at = ? WHERE id = ?", (now_iso(), user["id"]))
            db.bump(conn, "people")  # the teacher's class is open now
        ensure_class(conn, user["id"])
    return _me(user["id"], True)


# ------------------------------------------------------------ account settings

class MeIn(BaseModel):
    name: str | None = Field(default=None, max_length=80)
    grade: int | None = Field(default=None, ge=0, le=MAX_GRADE)  # students: their class (old accounts choose once)


@router.patch("/me")
def update_me(body: MeIn, s: Session = Depends(any_session)) -> dict:
    with db.tx() as conn:
        if body.name is not None:
            name = " ".join(body.name.split())
            if len(name) < 2:
                raise HTTPException(422, "Your name needs at least 2 letters.")
            conn.execute("UPDATE users SET name = ? WHERE id = ?", (name, s.user["id"]))
        if body.grade is not None:
            if s.user["role"] != "student":
                raise HTTPException(400, "Only students have a class.")
            conn.execute("UPDATE users SET grade = ?, age_group = ? WHERE id = ?", (body.grade, band_for_grade(body.grade), s.user["id"]))
        db.bump(conn, "people")
    return _me(s.user["id"], s.verified)


class PasswordIn(BaseModel):
    current: str = Field(max_length=200)
    next: str = Field(max_length=200)


@router.post("/password")
def change_password(body: PasswordIn, s: Session = Depends(any_session)) -> dict:
    if len(body.next) < 6:
        raise HTTPException(422, "The new password needs at least 6 characters.")
    user = s.user
    ok = check_password(body.current, user["password_hash"]) or (
        not user["password_hash"] and (user["legacy_hash"] is None or user["legacy_hash"] == legacy_hash(user["id"], body.current))
    )
    if not ok:
        raise HTTPException(401, "Your current password isn’t right.")
    with db.tx() as conn:
        conn.execute("UPDATE users SET password_hash = ?, legacy_hash = NULL WHERE id = ?", (hash_password(body.next), user["id"]))
        # sign out everywhere else
        conn.execute("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?", (user["id"], s.token_hash))
    return {"ok": True}


class EmailIn(BaseModel):
    email: str = Field(max_length=200)


@router.post("/email")
def change_email(body: EmailIn, s: Session = Depends(any_session)) -> dict:
    """Teachers: moves the account, class and all saved data to a new email."""
    old = s.user["id"]
    new = body.email.strip()
    if s.user["role"] != "teacher":
        raise HTTPException(400, "Students sign in with their ID, not an email.")
    if not EMAIL_RE.match(new):
        raise HTTPException(422, "Enter a valid email address.")
    if new.lower() == old.lower():
        raise HTTPException(422, "That’s already your email.")
    if get_user(new):
        raise HTTPException(409, "Another account already uses this email.")
    with db.tx() as conn:
        # users.id change cascades to sessions, codes and classes
        conn.execute("UPDATE users SET id = ? WHERE id = ?", (new, old))
        suffix = f":{old.lower()}"
        rows = conn.execute("SELECT key, value FROM kv WHERE lower(key) LIKE ? AND value IS NOT NULL", (f"%{suffix}",)).fetchall()
        now = time.time()
        for r in rows:
            new_key = r["key"][: -len(suffix)] + f":{new}"
            value = r["value"]
            if r["key"].startswith("pragmalab.projects:"):
                try:
                    value = json.dumps([{**p, "owner": new} if str(p.get("owner", "")).lower() == old.lower() else p for p in json.loads(value)])
                except (ValueError, AttributeError):
                    pass
            for key, val in ((r["key"], None), (new_key, value)):
                conn.execute(
                    "INSERT INTO kv(key, value, version, updated_at) VALUES(?, ?, ?, ?) "
                    "ON CONFLICT(key) DO UPDATE SET value = excluded.value, version = excluded.version, updated_at = excluded.updated_at",
                    (key, val, db.next_version(conn), now),
                )
        db.bump(conn, "people")
    return _me(new, s.verified)
