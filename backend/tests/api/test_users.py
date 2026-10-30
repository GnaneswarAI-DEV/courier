from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import PASSWORD, parcel_payload


def test_customer_cannot_list_users(client: TestClient, auth_headers, customer) -> None:
    assert client.get("/api/v1/users", headers=auth_headers(customer)).status_code == 403


def test_anonymous_cannot_list_users(client: TestClient) -> None:
    assert client.get("/api/v1/users").status_code == 401


def test_admin_creates_driver_and_driver_can_login(client: TestClient, auth_headers, admin) -> None:
    payload = {
        "name": "Ravi Driver",
        "email": "ravi.driver@example.com",
        "password": "DriverPass1",
        "role": "driver",
        "phone": "+91 9812345678",
    }
    created = client.post("/api/v1/users", json=payload, headers=auth_headers(admin))
    assert created.status_code == 201, created.text
    assert created.json()["role"] == "driver"

    login = client.post(
        "/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]}
    )
    assert login.status_code == 200

    drivers = client.get("/api/v1/users/drivers", headers=auth_headers(admin))
    assert drivers.status_code == 200
    assert [d["email"] for d in drivers.json()] == ["ravi.driver@example.com"]


def test_admin_cannot_create_duplicate_account(
    client: TestClient, auth_headers, admin, customer
) -> None:
    response = client.post(
        "/api/v1/users",
        json={
            "name": "Copy Cat",
            "email": customer.email,
            "password": "Password123",
            "role": "customer",
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 409


def test_admin_cannot_delete_own_account(client: TestClient, auth_headers, admin) -> None:
    response = client.delete(f"/api/v1/users/{admin.user_id}", headers=auth_headers(admin))
    assert response.status_code == 422


def test_deactivated_user_cannot_login(client: TestClient, auth_headers, admin, receiver) -> None:
    response = client.post(
        f"/api/v1/users/{receiver.user_id}/deactivate", headers=auth_headers(admin)
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    login = client.post("/api/v1/auth/login", json={"email": receiver.email, "password": PASSWORD})
    assert login.status_code == 401


def test_user_referenced_by_parcels_cannot_be_deleted(
    client: TestClient, auth_headers, admin, customer, receiver
) -> None:
    client.post(
        "/api/v1/parcels", json=parcel_payload(receiver.email), headers=auth_headers(customer)
    )
    response = client.delete(f"/api/v1/users/{receiver.user_id}", headers=auth_headers(admin))
    assert response.status_code == 409


def test_admin_can_promote_and_demote_role(
    client: TestClient, auth_headers, admin, receiver
) -> None:
    promote = client.patch(
        f"/api/v1/users/{receiver.user_id}",
        json={"role": "driver"},
        headers=auth_headers(admin),
    )
    assert promote.status_code == 200
    assert promote.json()["role"] == "driver"
