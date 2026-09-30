"""LittleReaderLab API server.

  /api/auth/*      accounts, sign-in, teacher email codes      (auth.py)
  /api/classes/*   class codes, joining, removing students     (classes.py)
  /api/presence    "last seen" heartbeat                       (classes.py)
  /api/sync        each user's data, with permissions          (sync.py)
  /api/live/*      Lecture questions – live quizzes (Kahoot-style) (live.py)

Settings come from server/.env (see .env.example). Data lives in one SQLite file (DATABASE_PATH).
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pragmalab_server import db
from pragmalab_server.auth import router as auth_router
from pragmalab_server.classes import router as classes_router
from pragmalab_server.config import settings
from pragmalab_server.live import router as live_router
from pragmalab_server.mailer import email_enabled
from pragmalab_server.migrate import import_legacy
from pragmalab_server.sync import router as sync_router

logging.basicConfig(level=logging.INFO)
import_legacy()

app = FastAPI(title="LittleReaderLab API")
app.include_router(auth_router)
app.include_router(classes_router)
app.include_router(sync_router)
app.include_router(live_router)

# The Vite dev server proxies /api, so CORS only matters when the app is served from another origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/")
def root() -> dict:
    """Opening the server in a browser shows this instead of "Not Found"."""
    return {"name": "LittleReaderLab API", "status": "running", "app": settings.app_url, "health": "/api/health", "docs": "/docs"}


@app.get("/api/health")
def health() -> dict:
    return {
        "ok": True,
        "version": db.current_version(),
        "email": "smtp" if email_enabled() else "codes shown on screen" if settings.show_dev_codes else "off",
    }
