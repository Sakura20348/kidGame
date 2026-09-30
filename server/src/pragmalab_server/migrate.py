"""One-time import of data saved by the old, browser-only app (accounts, classes, projects, presence)."""

import json
import logging
import time

from pragmalab_server import db

log = logging.getLogger("pragmalab")
PREFIX = "pragmalab."


def _load(conn, key: str, fallback):
    row = conn.execute("SELECT value FROM kv WHERE key = ?", (key,)).fetchone()
    try:
        return json.loads(row["value"]) if row and row["value"] else fallback
    except ValueError:
        return fallback


def import_legacy() -> None:
    with db.tx() as conn:
        old_keys = [f"{PREFIX}{k}" for k in ("accounts", "classes", "members", "projects")]
        if not conn.execute(f"SELECT 1 FROM kv WHERE key IN ({','.join('?' * len(old_keys))})", old_keys).fetchone():
            return

        accounts = _load(conn, f"{PREFIX}accounts", [])
        seen = {str(m.get("email", "")).lower(): m for m in _load(conn, f"{PREFIX}members", []) if isinstance(m, dict)}
        added = 0
        for a in accounts:
            if not isinstance(a, dict) or not a.get("email") or a.get("role") not in ("student", "teacher"):
                continue
            if conn.execute("SELECT 1 FROM users WHERE id = ?", (a["email"],)).fetchone():
                continue
            m = seen.get(a["email"].lower(), {})
            conn.execute(
                "INSERT INTO users(id, name, role, grade, age_group, school, legacy_hash, created_at, verified_at, joined_at, last_seen) "
                "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    a["email"],
                    a.get("name") or a["email"],
                    a["role"],
                    a.get("grade"),
                    a.get("ageGroup"),
                    a.get("school"),
                    a.get("passwordHash"),  # checked once at the next sign-in, then replaced by a real hash
                    a.get("createdAt") or m.get("joinedAt") or "1970-01-01T00:00:00Z",
                    a.get("verifiedAt"),
                    m.get("joinedAt"),
                    m.get("lastSeen"),
                ),
            )
            added += 1

        classes = 0
        for c in _load(conn, f"{PREFIX}classes", []):
            if not isinstance(c, dict) or not c.get("code") or not c.get("teacher"):
                continue
            if not conn.execute("SELECT 1 FROM users WHERE id = ? AND role = 'teacher'", (c["teacher"],)).fetchone():
                continue
            if conn.execute("SELECT 1 FROM classes WHERE code = ? OR teacher_id = ?", (c["code"], c["teacher"])).fetchone():
                continue
            conn.execute("INSERT INTO classes(code, teacher_id, created_at) VALUES(?, ?, ?)", (c["code"], c["teacher"], c.get("createdAt") or "1970-01-01T00:00:00Z"))
            classes += 1
            for st in c.get("students", []):
                if conn.execute("SELECT 1 FROM users WHERE id = ? AND role = 'student'", (st.get("id", ""),)).fetchone():
                    conn.execute("INSERT OR IGNORE INTO members(student_id, class_code, joined_at) VALUES(?, ?, ?)", (st["id"], c["code"], st.get("joinedAt") or "1970-01-01T00:00:00Z"))

        # projects: one list per teacher
        by_owner: dict[str, list] = {}
        for p in _load(conn, f"{PREFIX}projects", []):
            if isinstance(p, dict):
                by_owner.setdefault(str(p.get("owner") or "~shared"), []).append(p)
        now = time.time()
        for owner, items in by_owner.items():
            conn.execute(
                "INSERT OR REPLACE INTO kv(key, value, version, updated_at) VALUES(?, ?, ?, ?)",
                (f"{PREFIX}projects:{owner}", json.dumps(items, ensure_ascii=False, separators=(",", ":")), db.next_version(conn), now),
            )

        # the server makes these keys per user now
        conn.execute(f"DELETE FROM kv WHERE key IN ({','.join('?' * len(old_keys))})", old_keys)
        db.bump(conn, "people")
        log.warning("Imported %d accounts, %d classes and %d project lists from the old app.", added, classes, len(by_owner))
