"""Users, classes and "who can see whom" (a user's circle)."""

import sqlite3
from datetime import UTC, datetime

from pragmalab_server import db
from pragmalab_server.security import new_class_code


def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def get_user(user_id: str) -> sqlite3.Row | None:
    return db.one("SELECT * FROM users WHERE id = ?", (user_id.strip(),))


def public_user(u: sqlite3.Row) -> dict:
    """What other people (and the browser) may know about an account – never the password."""
    out: dict = {"email": u["id"], "name": u["name"], "role": u["role"], "createdAt": u["created_at"]}
    if u["grade"] is not None:
        out["grade"] = u["grade"]
    if u["age_group"]:
        out["ageGroup"] = u["age_group"]
    if u["school"]:
        out["school"] = u["school"]
    if u["verified_at"]:
        out["verifiedAt"] = u["verified_at"]
    return out


def class_of_teacher(teacher_id: str) -> sqlite3.Row | None:
    return db.one("SELECT * FROM classes WHERE teacher_id = ?", (teacher_id,))


def class_of_student(student_id: str) -> sqlite3.Row | None:
    return db.one("SELECT c.* FROM classes c JOIN members m ON m.class_code = c.code WHERE m.student_id = ?", (student_id,))


def ensure_class(conn: sqlite3.Connection, teacher_id: str) -> str:
    """The teacher's class code (made the first time it's needed)."""
    row = conn.execute("SELECT code FROM classes WHERE teacher_id = ?", (teacher_id,)).fetchone()
    if row:
        return row["code"]
    code = new_class_code()
    while conn.execute("SELECT 1 FROM classes WHERE code = ?", (code,)).fetchone():
        code = new_class_code()
    conn.execute("INSERT INTO classes(code, teacher_id, created_at) VALUES(?, ?, ?)", (code, teacher_id, now_iso()))
    db.bump(conn, "people")
    return code


def room_of(user: sqlite3.Row) -> sqlite3.Row | None:
    return class_of_teacher(user["id"]) if user["role"] == "teacher" else class_of_student(user["id"])


def circle(user: sqlite3.Row) -> list[str]:
    """Everyone whose data this user may see: themselves, their class (teacher + students)."""
    ids = {user["id"].lower(): user["id"]}
    room = room_of(user)
    if room:
        ids.setdefault(room["teacher_id"].lower(), room["teacher_id"])
        for r in db.query("SELECT student_id FROM members WHERE class_code = ?", (room["code"],)):
            ids.setdefault(r["student_id"].lower(), r["student_id"])
    return list(ids.values())


def is_my_student(teacher: sqlite3.Row, student_id: str) -> bool:
    if teacher["role"] != "teacher":
        return False
    return bool(
        db.one(
            "SELECT 1 FROM members m JOIN classes c ON c.code = m.class_code WHERE c.teacher_id = ? AND m.student_id = ?",
            (teacher["id"], student_id),
        )
    )
