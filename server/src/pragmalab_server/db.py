"""SQLite storage: users, sessions, classes, email codes and the synced key-value data."""

import sqlite3
import threading
from contextlib import contextmanager

from pragmalab_server.config import settings

settings.database_path.parent.mkdir(parents=True, exist_ok=True)
_db = sqlite3.connect(settings.database_path, check_same_thread=False)
_db.row_factory = sqlite3.Row
_db.execute("PRAGMA journal_mode=WAL")
_db.execute("PRAGMA foreign_keys=ON")
_lock = threading.RLock()

_db.executescript(
    """
    CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY COLLATE NOCASE,  -- teacher email or 6-digit student ID
        name          TEXT NOT NULL,
        role          TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
        grade         INTEGER,                          -- students: school class 0–11
        age_group     TEXT,                             -- "Class 4–6", "Adults" …
        school        TEXT,
        password_hash TEXT,                             -- scrypt
        legacy_hash   TEXT,                             -- old browser-made SHA-256, upgraded on next sign-in
        created_at    TEXT NOT NULL,
        verified_at   TEXT,                             -- teachers: first confirmed email code
        joined_at     TEXT,
        last_seen     TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL COLLATE NOCASE REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        created_at REAL NOT NULL,
        expires_at REAL NOT NULL,
        verified   INTEGER NOT NULL DEFAULT 0            -- teachers: email code entered for this sign-in
    );
    CREATE TABLE IF NOT EXISTS codes (
        user_id    TEXT PRIMARY KEY COLLATE NOCASE REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        code_hash  TEXT NOT NULL,
        expires_at REAL NOT NULL,
        sent_at    REAL NOT NULL,
        attempts   INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS classes (
        code       TEXT PRIMARY KEY,
        teacher_id TEXT NOT NULL UNIQUE COLLATE NOCASE REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS members (
        student_id TEXT PRIMARY KEY COLLATE NOCASE REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        class_code TEXT NOT NULL REFERENCES classes(code) ON DELETE CASCADE,
        joined_at  TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS kv (
        key        TEXT PRIMARY KEY,
        value      TEXT,          -- NULL = deleted (kept so other devices learn about it)
        version    INTEGER NOT NULL,
        updated_at REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS kv_version ON kv(version);
    -- one version counter for everything; "meta" remembers when people / presence last changed
    CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY CHECK (id = 1), value INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS meta (name TEXT PRIMARY KEY, version INTEGER NOT NULL);
    """
)
_db.execute("INSERT OR IGNORE INTO counter(id, value) SELECT 1, COALESCE(MAX(version), 0) FROM kv")
_db.commit()


@contextmanager
def tx():
    """One locked transaction."""
    with _lock:
        try:
            yield _db
            _db.commit()
        except BaseException:
            _db.rollback()
            raise


def query(sql: str, args: tuple = ()) -> list[sqlite3.Row]:
    with _lock:
        return _db.execute(sql, args).fetchall()


def one(sql: str, args: tuple = ()) -> sqlite3.Row | None:
    with _lock:
        return _db.execute(sql, args).fetchone()


def next_version(db: sqlite3.Connection) -> int:
    db.execute("UPDATE counter SET value = value + 1 WHERE id = 1")
    return int(db.execute("SELECT value FROM counter WHERE id = 1").fetchone()[0])


def current_version() -> int:
    row = one("SELECT value FROM counter WHERE id = 1")
    return int(row[0]) if row else 0


def bump(db: sqlite3.Connection, name: str) -> int:
    """Marks a kind of data ("people", "presence") as changed, so clients pull it again."""
    v = next_version(db)
    db.execute("INSERT INTO meta(name, version) VALUES(?, ?) ON CONFLICT(name) DO UPDATE SET version = excluded.version", (name, v))
    return v


def meta_version(name: str) -> int:
    row = one("SELECT version FROM meta WHERE name = ?", (name,))
    return int(row[0]) if row else 0
