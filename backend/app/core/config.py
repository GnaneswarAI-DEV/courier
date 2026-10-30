"""Application settings loaded from the environment.

Every value can be overridden with an environment variable (see .env.example).
In production the critical ones (SECRET_KEY, DATABASE_URL) are required and the
app refuses to start without them instead of silently using insecure defaults.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["development", "testing", "production"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )

    # --- application ---
    app_name: str = "Courier Parcel Tracking API"
    environment: Environment = "development"
    debug: bool = False
    log_level: str = "INFO"

    # --- security ---
    secret_key: str = "dev-only-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8

    # --- database ---
    database_url: str = "sqlite+pysqlite:///./courier_dev.db"
    db_echo: bool = False
    db_pool_size: int = 5
    db_pool_recycle: int = 280
    # Path to a CA certificate (e.g. Aiven's ca.pem) for TLS to MySQL.
    db_ssl_ca: str | None = None

    # --- cors (comma separated list in env) ---
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    # --- bootstrap administrator ---
    bootstrap_admin_email: str | None = None
    bootstrap_admin_password: str | None = None
    bootstrap_admin_name: str = "System Administrator"

    # --- rate limiting for public endpoints (requests / minute / ip) ---
    public_rate_limit_per_minute: int = 60

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def _validate_production(self) -> Settings:
        if self.environment == "production":
            weak = {"dev-only-insecure-secret-change-me", "", "changeme"}
            if self.secret_key in weak or len(self.secret_key) < 32:
                raise ValueError(
                    "SECRET_KEY must be set to a random value of at least "
                    "32 characters in production"
                )
            if self.database_url.startswith("sqlite"):
                raise ValueError("SQLite is not a supported production database; set DATABASE_URL")
        return self

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
