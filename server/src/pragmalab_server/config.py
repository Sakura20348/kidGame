"""Settings, read from server/.env (see .env.example)."""

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]  # the server/ folder
load_dotenv(ROOT / ".env")


def _bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    return default if value is None or value.strip() == "" else value.strip().lower() in {"1", "true", "yes", "on"}


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, "") or default)
    except ValueError:
        return default


def _list(name: str, default: str) -> list[str]:
    return [v.strip() for v in (os.environ.get(name) or default).split(",") if v.strip()]


class Settings:
    # server
    host = os.environ.get("HOST", "127.0.0.1")
    port = _int("PORT", 8000)
    reload = _bool("RELOAD", True)
    cors_origins = _list("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173")
    database_path = (ROOT / os.environ.get("DATABASE_PATH", "data/pragmalab.db")).resolve()
    app_url = os.environ.get("APP_URL", "http://localhost:5173")

    # sign-in
    session_days = _int("SESSION_DAYS", 30)
    code_ttl_minutes = _int("CODE_TTL_MINUTES", 10)

    # email (teacher sign-in codes). Without SMTP_HOST, codes are only shown on screen when SHOW_DEV_CODES is on.
    smtp_host = os.environ.get("SMTP_HOST", "")
    smtp_port = _int("SMTP_PORT", 587)
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    smtp_from = os.environ.get("SMTP_FROM", "") or os.environ.get("SMTP_USER", "")
    smtp_starttls = _bool("SMTP_STARTTLS", True)
    show_dev_codes = _bool("SHOW_DEV_CODES", not os.environ.get("SMTP_HOST"))



settings = Settings()
