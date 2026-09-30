def main() -> None:
    """`uv run pragmalab-server` – starts the API on HOST:PORT from server/.env (default http://127.0.0.1:8000)."""
    import uvicorn

    from pragmalab_server.config import settings

    uvicorn.run("pragmalab_server.app:app", host=settings.host, port=settings.port, reload=settings.reload)
