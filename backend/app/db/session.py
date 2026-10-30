"""Engine and session factory.

Development and tests may use SQLite; production must use MySQL (enforced in
``Settings``). Pool settings are only applied to server-backed databases.
"""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings


def build_engine(url: str | None = None, *, echo: bool | None = None) -> Engine:
    url = url or settings.database_url
    kwargs: dict[str, Any] = {
        "pool_pre_ping": True,
        "echo": settings.db_echo if echo is None else echo,
    }

    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
        if ":memory:" in url:
            kwargs["poolclass"] = StaticPool
    else:
        kwargs.update(
            pool_size=settings.db_pool_size,
            max_overflow=10,
            pool_recycle=settings.db_pool_recycle,
        )
        if settings.db_ssl_ca:
            # Aiven (and most managed MySQL) requires TLS. Point DB_SSL_CA at the
            # downloaded ca.pem instead of disabling verification.
            kwargs["connect_args"] = {"ssl": {"ca": settings.db_ssl_ca}}
    return create_engine(url, **kwargs)


engine: Engine = build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
