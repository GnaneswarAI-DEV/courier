from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.exceptions.handlers import register_exception_handlers
from app.middleware import RateLimitMiddleware, RequestContextMiddleware
from app.services.auth import AuthService

logger = get_logger(__name__)

# Importing models registers them on Base.metadata (needed for create_all in dev).
import app.models  # noqa: E402,F401


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    logger.info("Starting %s (environment=%s)", settings.app_name, settings.environment)

    if not settings.is_production:
        # Convenience for local development and tests. Production schema changes
        # always go through Alembic.
        Base.metadata.create_all(bind=engine)

    if settings.bootstrap_admin_email and settings.bootstrap_admin_password:
        db = SessionLocal()
        try:
            AuthService(db).ensure_bootstrap_admin()
        except Exception:  # pragma: no cover - startup resilience
            db.rollback()
            logger.exception("Could not bootstrap the administrator account")
        finally:
            db.close()

    yield
    logger.info("Shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description=(
            "REST API for courier parcel booking, driver assignment, status workflows "
            "and public tracking."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
        max_age=600,
    )
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(RateLimitMiddleware, limit_per_minute=settings.public_rate_limit_per_minute)

    register_exception_handlers(app)
    app.include_router(api_router)

    @app.get("/", tags=["System"], summary="Service metadata")
    def root() -> dict[str, str]:
        return {
            "service": settings.app_name,
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health",
        }

    @app.get("/health", tags=["System"], summary="Liveness and database connectivity")
    def health() -> dict[str, str]:
        try:
            with SessionLocal() as db:
                db.execute(text("SELECT 1"))
            database = "ok"
        except Exception:
            database = "unavailable"
        return {"status": "ok" if database == "ok" else "degraded", "database": database}

    return app


app = create_app()
