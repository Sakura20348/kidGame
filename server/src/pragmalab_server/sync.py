"""Keeps each browser's "pragmalab.*" data in step with the server – with permissions.

GET  /api/sync?since=N  -> what changed after version N that this user may see
POST /api/sync          -> save changed keys this user may write; returns the ones it refused

Per-user keys look like "pragmalab.<name>:<owner>". Who may read them:
  - owner only (default): AI chats, settings, game progress…
  - the owner's class (classmates + teacher): scores for the leaderboard (lessons, kids, assignments, avatar, live quizzes)
  - the owner's teacher: submissions, activity, started lessons, downloads, read messages
  - a teacher's students: lessons sent, deleted lessons, test papers, messages (only the ones meant for them)
Only the owner may write, except that a teacher marks students' submissions as seen.

Four keys are made by the server for each user instead of being stored as-is:
  pragmalab.accounts  – public account info of the people in my class
  pragmalab.classes   – my class (code, teacher, students)
  pragmalab.members   – when the people in my class were last seen
  pragmalab.projects  – my own projects (teachers) / my teacher's projects (students)
"""

import json
import sqlite3
import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from pragmalab_server import db
from pragmalab_server.deps import Session, full_session
from pragmalab_server.people import circle, is_my_student, public_user, room_of

router = APIRouter(prefix="/api", tags=["sync"])

PREFIX = "pragmalab."
MAX_KEY = 200
MAX_VALUE = 8_000_000  # characters – uploaded pictures and test papers can be large
SHARED_PROJECTS = "~shared"  # projects from the old app that had no owner (teachers see them)

CLASS_READ = {"lessons", "kids", "assignments", "avatar", "liveResults"}
TEACHER_READ = {"submissions", "activity", "startedLessons", "papersDownloaded", "messagesRead"}
STUDENTS_READ = {"sentLessons", "hiddenLessons", "goneLessons", "papers", "messages"}
VIRTUAL = {"accounts", "classes", "members", "projects"}


class Item(BaseModel):
    key: str = Field(max_length=MAX_KEY)
    value: str | None = None


class SyncIn(BaseModel):
    items: list[Item] = Field(max_length=500)


def _dump(value: object) -> str:
    # same shape as the browser's JSON.stringify, so unchanged data compares equal
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _split(key: str) -> tuple[str, str | None]:
    """"pragmalab.lessons:123456" -> ("lessons", "123456"); "pragmalab.projects" -> ("projects", None)."""
    rest = key[len(PREFIX):]
    if ":" not in rest:
        return rest, None
    name, owner = rest.rsplit(":", 1)
    return name, owner


def _same(a: str, b: str) -> bool:
    return a.lower() == b.lower()


class Viewer:
    """Who is asking, and whom they are connected to."""

    def __init__(self, user: sqlite3.Row):
        self.user = user
        self.id: str = user["id"]
        self.teacher = user["role"] == "teacher"
        self.circle = {c.lower() for c in circle(user)}
        room = room_of(user)
        self.my_teacher = room["teacher_id"].lower() if room and not self.teacher else None

    def can_read(self, name: str, owner: str) -> bool:
        o = owner.lower()
        if o == self.id.lower():
            return name != "projects"  # projects come through the "pragmalab.projects" view
        if o not in self.circle or name == "projects":
            return False
        if name in CLASS_READ:
            return True
        if name in TEACHER_READ:
            return self.teacher  # I'm the owner's teacher (they are in my circle)
        if name in STUDENTS_READ:
            return self.my_teacher == o
        return False

    def can_write(self, name: str, owner: str) -> bool:
        if name == "projects":
            return False
        if _same(owner, self.id):
            return True
        return name == "submissions" and is_my_student(self.user, owner)  # "seen by teacher"


# ------------------------------------------------------------ the server-made keys

def _virtual(v: Viewer, since: int) -> list[Item]:
    people_v = db.meta_version("people")
    out: list[Item] = []
    ids = list(v.circle)
    marks = ",".join("?" * len(ids))
    users = db.query(f"SELECT * FROM users WHERE lower(id) IN ({marks}) ORDER BY created_at", tuple(ids)) if ids else []

    if people_v > since or since == 0:
        out.append(Item(key=f"{PREFIX}accounts", value=_dump([public_user(u) for u in users])))
        room = room_of(v.user)
        classes = []
        if room:
            members = db.query("SELECT student_id, joined_at FROM members WHERE class_code = ? ORDER BY joined_at", (room["code"],))
            classes.append(
                {
                    "code": room["code"],
                    "teacher": room["teacher_id"],
                    "students": [{"id": m["student_id"], "joinedAt": m["joined_at"]} for m in members],
                    "createdAt": room["created_at"],
                }
            )
        out.append(Item(key=f"{PREFIX}classes", value=_dump(classes)))

    if max(db.meta_version("presence"), people_v) > since or since == 0:
        seen = [{"email": u["id"], "joinedAt": u["joined_at"] or u["created_at"], "lastSeen": u["last_seen"]} for u in users if u["last_seen"]]
        out.append(Item(key=f"{PREFIX}members", value=_dump(seen)))

    owners = [v.id, SHARED_PROJECTS] if v.teacher else ([v.my_teacher] if v.my_teacher else [])
    keys = [f"{PREFIX}projects:{o}" for o in owners]
    rows = db.query(f"SELECT key, value, version FROM kv WHERE lower(key) IN ({','.join('?' * len(keys))})", tuple(k.lower() for k in keys)) if keys else []
    if since == 0 or people_v > since or any(r["version"] > since for r in rows):
        projects: list = []
        for r in rows:
            try:
                projects.extend(json.loads(r["value"] or "[]"))
            except ValueError:
                pass
        out.append(Item(key=f"{PREFIX}projects", value=_dump(projects)))
    return out


def _for_viewer(v: Viewer, name: str, owner: str, value: str | None) -> str | None:
    """Students only get the teacher messages written to the whole class or to them."""
    if name == "messages" and value and not _same(owner, v.id):
        try:
            mine = [m for m in json.loads(value) if m.get("to") == "all" or _same(str(m.get("to", "")), v.id)]
            return _dump(mine)
        except (ValueError, AttributeError):
            return None
    return value


# ------------------------------------------------------------ endpoints

@router.get("/sync")
def pull(since: int = 0, s: Session = Depends(full_session)) -> dict:
    v = Viewer(s.user)
    version = db.current_version()
    items: list[Item] = []
    for r in db.query("SELECT key, value FROM kv WHERE version > ? ORDER BY version", (since,)):
        name, owner = _split(r["key"])
        if owner is not None and v.can_read(name, owner):
            items.append(Item(key=r["key"], value=_for_viewer(v, name, owner, r["value"])))
    items.extend(_virtual(v, since))
    return {"version": version, "items": [i.model_dump() for i in items]}


def _upsert(conn: sqlite3.Connection, key: str, value: str | None, now: float) -> None:
    conn.execute(
        "INSERT INTO kv(key, value, version, updated_at) VALUES(?, ?, ?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value, version = excluded.version, updated_at = excluded.updated_at",
        (key, value, db.next_version(conn), now),
    )


@router.post("/sync")
def push(body: SyncIn, s: Session = Depends(full_session)) -> dict:
    v = Viewer(s.user)
    rejected: list[str] = []
    with db.tx() as conn:
        now = time.time()
        for item in body.items:
            if not item.key.startswith(PREFIX):
                raise HTTPException(400, f"Keys must start with {PREFIX!r}")
            if item.value is not None and len(item.value) > MAX_VALUE:
                raise HTTPException(413, f"{item.key} is too large")
            name, owner = _split(item.key)

            if owner is None and name == "projects" and v.teacher:
                # keep only this teacher's own projects
                try:
                    mine = [p for p in json.loads(item.value or "[]") if isinstance(p, dict) and _same(str(p.get("owner", "")), v.id)]
                except ValueError:
                    rejected.append(item.key)
                    continue
                key = f"{PREFIX}projects:{v.id}"
                old = conn.execute("SELECT value FROM kv WHERE key = ?", (key,)).fetchone()
                if not old or old["value"] != _dump(mine):
                    _upsert(conn, key, _dump(mine), now)
                continue

            if owner is None or not v.can_write(name, owner):
                rejected.append(item.key)  # server-made keys, old keys without an owner, other people's data
                continue
            _upsert(conn, item.key, item.value, now)
    return {"version": db.current_version(), "rejected": rejected}
