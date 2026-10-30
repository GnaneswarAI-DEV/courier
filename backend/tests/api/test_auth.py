from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import PASSWORD

REGISTER = {
    "name": "Asha Verma",
    "email": "asha@example.com",
    "phone": "+91 9876543210",
    "password": "StrongPass1",
}


def test_register_creates_customer_and_returns_token(client: TestClient) -> None:
    response = client.post("/api/v1/auth/register", json=REGISTER)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["role"] == "customer"
    assert body["user"]["email"] == "asha@example.com"
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_register_rejects_duplicate_email(client: TestClient) -> None:
    assert client.post("/api/v1/auth/register", json=REGISTER).status_code == 201
    duplicate = {**REGISTER, "email": "ASHA@example.com"}
    response = client.post("/api/v1/auth/register", json=duplicate)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "conflict"


def test_register_rejects_weak_password(client: TestClient) -> None:
    response = client.post("/api/v1/auth/register", json={**REGISTER, "password": "short"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_login_returns_token_and_rejects_bad_password(client: TestClient) -> None:
    client.post("/api/v1/auth/register", json=REGISTER)
    ok = client.post(
        "/api/v1/auth/login", json={"email": REGISTER["email"], "password": REGISTER["password"]}
    )
    assert ok.status_code == 200
    assert ok.json()["user"]["name"] == "Asha Verma"

    bad = client.post(
        "/api/v1/auth/login", json={"email": REGISTER["email"], "password": "WrongPass1"}
    )
    assert bad.status_code == 401
    assert bad.json()["error"]["code"] == "unauthenticated"


def test_login_unknown_email_is_401(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login", json={"email": "ghost@example.com", "password": "Whatever1"}
    )
    assert response.status_code == 401


def test_me_requires_authentication(client: TestClient) -> None:
    assert client.get("/api/v1/auth/me").status_code == 401
    assert (
        client.get("/api/v1/auth/me", headers={"Authorization": "Bearer nope"}).status_code == 401
    )


def test_me_returns_current_user(client: TestClient, make_user, auth_headers) -> None:
    user = make_user(email="me@example.com")
    response = client.get("/api/v1/auth/me", headers=auth_headers(user))
    assert response.status_code == 200
    assert response.json()["user_id"] == user.user_id


def test_change_password_invalidates_old_password(
    client: TestClient, make_user, auth_headers
) -> None:
    user = make_user(email="changer@example.com")
    response = client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers(user),
        json={"current_password": PASSWORD, "new_password": "BrandNewPass9"},
    )
    assert response.status_code == 200
    old = client.post(
        "/api/v1/auth/login", json={"email": "changer@example.com", "password": PASSWORD}
    )
    assert old.status_code == 401
    new = client.post(
        "/api/v1/auth/login",
        json={"email": "changer@example.com", "password": "BrandNewPass9"},
    )
    assert new.status_code == 200


def test_change_password_requires_correct_current_password(
    client: TestClient, make_user, auth_headers
) -> None:
    user = make_user(email="guarded@example.com")
    response = client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers(user),
        json={"current_password": "NotMyPassword1", "new_password": "BrandNewPass9"},
    )
    assert response.status_code == 403


def test_disabled_account_cannot_login(client: TestClient, make_user) -> None:
    make_user(email="disabled@example.com", is_active=False)
    response = client.post(
        "/api/v1/auth/login", json={"email": "disabled@example.com", "password": PASSWORD}
    )
    assert response.status_code == 401


def test_security_headers_and_request_id_are_present(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-Request-ID"]
