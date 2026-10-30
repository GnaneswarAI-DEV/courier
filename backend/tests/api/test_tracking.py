from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import parcel_payload


def _make_parcel(client: TestClient, headers: dict[str, str], receiver_email: str) -> dict:
    response = client.post("/api/v1/parcels", json=parcel_payload(receiver_email), headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_public_tracking_returns_redacted_shipment(
    client: TestClient, auth_headers, customer, receiver
) -> None:
    parcel = _make_parcel(client, auth_headers(customer), receiver.email)
    response = client.get(f"/api/v1/tracking/{parcel['tracking_number']}")
    assert response.status_code == 200
    body = response.json()

    assert body["status"] == "CREATED"
    assert body["pickup_city"] == "Bengaluru"
    assert body["delivery_city"] == "Kolkata"
    assert body["sender_name"] == "Customer Cat"
    assert len(body["events"]) == 1

    # Full street addresses and identifiers must never be exposed anonymously.
    serialized = str(body)
    assert "MG Road" not in serialized
    assert "Park Street" not in serialized
    assert "customer@example.com" not in serialized
    assert "receiver@example.com" not in serialized
    assert "sender_id" not in serialized
    assert "driver" not in serialized


def test_public_tracking_is_case_insensitive(
    client: TestClient, auth_headers, customer, receiver
) -> None:
    parcel = _make_parcel(client, auth_headers(customer), receiver.email)
    lower = parcel["tracking_number"].lower()
    assert client.get(f"/api/v1/tracking/{lower}").status_code == 200


def test_unknown_tracking_number_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/tracking/CPT-ZZZZZZZZ")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_tracking_number_validation_rejects_garbage(client: TestClient) -> None:
    assert client.get("/api/v1/tracking/%20bad%20id").status_code == 422
