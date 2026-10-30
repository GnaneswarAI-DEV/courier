"""Shared pytest fixtures for the Courier Parcel Tracking project.

This conftest sets up the testing environment (ENVIRONMENT=testing, in-memory SQLite)
before the app and its dependencies are imported. It is placed at the project root
so that test files at any depth can import from it directly.
"""

from __future__ import annotations

import os

os.environ["ENVIRONMENT"] = "testing"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-tests"
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["PUBLIC_RATE_LIMIT_PER_MINUTE"] = "1000000"
os.environ.pop("BOOTSTRAP_ADMIN_EMAIL", None)
os.environ.pop("BOOTSTRAP_ADMIN_PASSWORD", None)

from collections.abc import Callable, Iterator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import app.models  # noqa: E402,F401
from app.core.security import create_access_token, hash_password  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.enums import UserRole  # noqa: E402
from app.models.user import User  # noqa: E402

PASSWORD = "Password123"


@pytest.fixture()
def engine() -> Iterator:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def db(engine) -> Iterator[Session]:
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(engine) -> Iterator[TestClient]:
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db() -> Iterator[Session]:
        session = factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def make_user(db: Session) -> Callable[..., User]:
    def _make(
        role: UserRole = UserRole.CUSTOMER,
        email: str | None = None,
        name: str = "Test User",
        password: str = PASSWORD,
        is_active: bool = True,
        phone: str | None = "+91 9000000000",
    ) -> User:
        nonlocal_counter = _make.counter
        _make.counter += 1  # type: ignore[attr-defined]
        user = User(
            name=name,
            email=email or f"user{nonlocal_counter}@example.com",
            phone=phone,
            password_hash=hash_password(password),
            role=role,
            is_active=is_active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    _make.counter = 0  # type: ignore[attr-defined]
    return _make


@pytest.fixture()
def auth_headers() -> Callable[[User], dict[str, str]]:
    def _headers(user: User) -> dict[str, str]:
        token = create_access_token(subject=user.user_id, role=user.role.value)
        return {"Authorization": f"Bearer {token}"}

    return _headers


@pytest.fixture()
def admin(make_user: Callable[..., User]) -> User:
    return make_user(role=UserRole.ADMIN, email="admin@example.com", name="Admin")


@pytest.fixture()
def driver(make_user: Callable[..., User]) -> User:
    return make_user(role=UserRole.DRIVER, email="driver@example.com", name="Driver Dan")


@pytest.fixture()
def customer(make_user: Callable[..., User]) -> User:
    return make_user(role=UserRole.CUSTOMER, email="customer@example.com", name="Customer Cat")


@pytest.fixture()
def receiver(make_user: Callable[..., User]) -> User:
    return make_user(role=UserRole.CUSTOMER, email="receiver@example.com", name="Receiver Rae")


def parcel_payload(receiver_email: str = "receiver@example.com", **overrides) -> dict:
    payload = {
        "receiver_email": receiver_email,
        "weight": 2.5,
        "pickup_address": "12 MG Road, Bengaluru, Karnataka 560001",
        "delivery_address": "45 Park Street, Kolkata, West Bengal 700016",
    }
    payload.update(overrides)
    return payload