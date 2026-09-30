"""Classes, join codes and presence.

GET    /api/classes/mine                -> my class (teachers: with students)
POST   /api/classes/join     {code}     -> students join a verified teacher's class
DELETE /api/classes/students/{id}       -> teachers remove a student
POST   /api/presence         {away?}    -> "I'm here" heartbeat (last seen)
"""

import re
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from pragmalab_server import db
from pragmalab_server.deps import Session, any_session, full_session
from pragmalab_server.people import get_user, now_iso, public_user, room_of

router = APIRouter(prefix="/api", tags=["classes"])


def _clean_code(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", value.upper())[:6]


@router.get("/classes/mine")
def my_class(s: Session = Depends(full_session)) -> dict:
    room = room_of(s.user)
    if not room:
        return {"class": None}
    students = db.query(
        "SELECT u.*, m.joined_at AS class_joined FROM members m JOIN users u ON u.id = m.student_id WHERE m.class_code = ? ORDER BY u.name",
        (room["code"],),
    )
    teacher = get_user(room["teacher_id"])
    return {
        "class": {
            "code": room["code"],
            "teacher": public_user(teacher) if teacher else {"email": room["teacher_id"]},
            "students": [{**public_user(u), "joinedAt": u["class_joined"], "lastSeen": u["last_seen"]} for u in students],
        }
    }


class JoinIn(BaseModel):
    code: str = Field(max_length=20)


@router.post("/classes/join")
def join(body: JoinIn, s: Session = Depends(any_session)) -> dict:
    if s.user["role"] != "student":
        raise HTTPException(400, "Only students join a class.")
    code = _clean_code(body.code)
    if len(code) != 6:
        raise HTTPException(422, "A class code has 6 letters and numbers.")
    room = db.one("SELECT * FROM classes WHERE code = ?", (code,))
    if not room:
        raise HTTPException(404, "We can’t find a class with this code. Check it with your teacher.")
    teacher = get_user(room["teacher_id"])
    if not teacher or not teacher["verified_at"]:
        raise HTTPException(409, "This class isn’t open yet — your teacher needs to confirm their email first.")
    with db.tx() as conn:
        # one class at a time
        conn.execute(
            "INSERT INTO members(student_id, class_code, joined_at) VALUES(?, ?, ?) "
            "ON CONFLICT(student_id) DO UPDATE SET class_code = excluded.class_code, joined_at = excluded.joined_at",
            (s.user["id"], code, now_iso()),
        )
        db.bump(conn, "people")
    return {"code": code, "teacher": public_user(teacher)}


@router.delete("/classes/students/{student_id}")
def remove_student(student_id: str, s: Session = Depends(full_session)) -> dict:
    if s.user["role"] != "teacher":
        raise HTTPException(403, "Only teachers can remove students.")
    room = room_of(s.user)
    if not room:
        raise HTTPException(404, "You don’t have a class yet.")
    with db.tx() as conn:
        gone = conn.execute("DELETE FROM members WHERE student_id = ? AND class_code = ?", (student_id, room["code"])).rowcount
        if gone:
            db.bump(conn, "people")
    return {"removed": bool(gone)}


class PresenceIn(BaseModel):
    away: bool = False


@router.post("/presence")
def presence(body: PresenceIn, s: Session = Depends(any_session)) -> dict:
    # "away" backdates last seen so the green "online" dot goes off right away
    seen = datetime.now(UTC) - (timedelta(minutes=5) if body.away else timedelta())
    with db.tx() as conn:
        conn.execute("UPDATE users SET last_seen = ? WHERE id = ?", (seen.isoformat(timespec="milliseconds").replace("+00:00", "Z"), s.user["id"]))
        db.bump(conn, "presence")
    return {"ok": True}
