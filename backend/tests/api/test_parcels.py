from __future__ import annotations

import re

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.conftest import parcel_payload

TRACKING_RE = re.compile(r"^CPT-[A-Z2-9]{8}$")


def _create_parcel(client: TestClient, headers: dict[str, str], receiver_email: str) -> dict:
    response = client.post("/api/v1/parcels", json=parcel_payload(receiver_email), headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_parcel_generates_tracking_number_and_first_event(
    client: TestClient, make_user, auth_headers, customer, receiver
) -> None:
    body = _create_parcel(client, auth_headers(customer), receiver.email)
    assert TRACKING_RE.match(body["tracking_number"])
    assert body["status"] == "CREATED"
    assert body["weight"] == 2.5
    assert len(body["logs"]) == 1
    assert body["logs"][0]["status"] == "CREATED"
    assert body["sender"]["user_id"] == customer.user_id
    assert body["receiver"]["user_id"] == receiver.user_id


def test_create_parcel_requires_registered_receiver(
    client: TestClient, auth_headers, customer
) -> None:
    response = client.post(
        "/api/v1/parcels", json=parcel_payload("nobody@example.com"), headers=auth_headers(customer)
    )
    assert response.status_code == 404


def test_sender_cannot_ship_to_self(client: TestClient, auth_headers, customer) -> None:
    response = client.post(
        "/api/v1/parcels", json=parcel_payload(customer.email), headers=auth_headers(customer)
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "business_rule_violation"


def test_create_parcel_rejects_past_estimated_delivery(
    client: TestClient, auth_headers, customer, receiver
) -> None:
    response = client.post(
        "/api/v1/parcels",
        json=parcel_payload(receiver.email, estimated_delivery="2020-01-01"),
        headers=auth_headers(customer),
    )
    assert response.status_code == 422


def test_customer_only_sees_own_parcels(
    client: TestClient, make_user, auth_headers, customer, receiver
) -> None:
    other = make_user(email="other@example.com", name="Other Customer")
    _create_parcel(client, auth_headers(customer), receiver.email)

    own = client.get("/api/v1/parcels", headers=auth_headers(customer))
    assert own.status_code == 200
    assert own.json()["total"] == 1

    theirs = client.get("/api/v1/parcels", headers=auth_headers(other))
    assert theirs.json()["total"] == 0

    received = client.get("/api/v1/parcels", headers=auth_headers(receiver))
    assert received.json()["total"] == 1

    tracker = client.get("/api/v1/parcels", headers=auth_headers(other))
    assert tracker.json()["items"] == []


def test_unrelated_customer_gets_404_on_detail(
    client: TestClient, make_user, auth_headers, customer, receiver
) -> None:
    parcel = _create_parcel(client, auth_headers(customer), receiver.email)
    outsider = make_user(email="outsider@example.com")
    response = client.get(
        f"/api/v1/parcels/{parcel['tracking_number']}", headers=auth_headers(outsider)
    )
    assert response.status_code == 404


def test_missing_tracking_number_returns_404(client: TestClient, auth_headers, admin) -> None:
    response = client.get("/api/v1/parcels/CPT-NOTREAL1", headers=auth_headers(admin))
    assert response.status_code == 404


def test_sender_can_edit_before_pickup_only(
    client: TestClient, auth_headers, customer, receiver
) -> None:
    parcel = _create_parcel(client, auth_headers(customer), receiver.email)
    tn = parcel["tracking_number"]

    edit = client.patch(
        f"/api/v1/parcels/{tn}",
        json={"weight": 4.25, "delivery_address": "9 Residency Road, Bengaluru, Karnataka"},
        headers=auth_headers(customer),
    )
    assert edit.status_code == 200
    assert edit.json()["weight"] == 4.25

    receiver_edit = client.patch(
        f"/api/v1/parcels/{tn}", json={"weight": 9}, headers=auth_headers(receiver)
    )
    assert receiver_edit.status_code == 403


def test_full_lifecycle_with_driver_and_history(
    client: TestClient, auth_headers, customer, receiver, driver, admin
) -> None:
    parcel = _create_parcel(client, auth_headers(customer), receiver.email)
    tn = parcel["tracking_number"]

    assign = client.post(
        f"/api/v1/parcels/{tn}/assign",
        json={"driver_id": driver.user_id},
        headers=auth_headers(admin),
    )
    assert assign.status_code == 200, assign.text
    assert assign.json()["driver"]["user_id"] == driver.user_id

    driver_view = client.get("/api/v1/parcels", headers=auth_headers(driver))
    assert driver_view.json()["total"] == 1

    steps = [
        ("PICKED_UP", "Bengaluru"),
        ("IN_TRANSIT", "Nagpur"),
        ("OUT_FOR_DELIVERY", "Kolkata"),
        ("DELIVERED", "Kolkata"),
    ]
    for status_value, location in steps:
        response = client.post(
            f"/api/v1/parcels/{tn}/status",
            json={"status": status_value, "location": location, "remarks": f"{status_value} scan"},
            headers=auth_headers(driver),
        )
        assert response.status_code == 200, response.text

    detail = client.get(f"/api/v1/parcels/{tn}", headers=auth_headers(customer)).json()
    assert detail["status"] == "DELIVERED"
    assert detail["delivered_at"] is not None
    assert [log["status"] for log in detail["logs"]] == [
        "CREATED",
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
    ]

    # Terminal state cannot move again.
    again = client.post(
        f"/api/v1/parcels/{tn}/status",
        json={"status": "IN_TRANSIT", "location": "Kolkata"},
        headers=auth_headers(admin),
    )
    assert again.status_code == 422


def test_invalid_transition_is_rejected(
    client: TestClient, auth_headers, customer, receiver, admin
) -> None:
    parcel = _create_parcel(client, auth_headers(customer), receiver.email)
    response = client.post(
        f"/api/v1/parcels/{parcel['tracking_number']}/status",
        json={"status": "DELIVERED", "location": "Kolkata"},
        headers=auth_headers(admin),
    )
    assert response.status_code == 422
    assert "Cannot move" in response.json()["error"]["detail"]


def test_driver_cannot_update_unassigned_parcel(
    client: TestClient, make_user, auth_headers, customer, receiver, driver
) -> None:
    parcel = _create_parcel(client, auth_headers(customer), receiver.email)
    response = client.post(
        f"/api/v1/parcels/{parcel['tracking_number']}/status",
        json={"status": "PICKED_UP", "location": "Bengaluru"},
        headers=auth_headers(driver),
    )
    assert response.status_code == 404


def test_driver_cannot_cancel_or_edit(
    client: TestClient, auth_headers, customer, receiver, driver, admin
) -> None:
    parcel = _create_parcel(client, auth_headers(customer), receiver.email)
    tn = parcel["tracking_number"]
    client.post(
        f"/api/v1/parcels/{tn}/assign",
        json={"driver_id": driver.user_id},
        headers=auth_headers(admin),
    )

    cancel = client.post(
        f"/api/v1/parcels/{tn}/status",
        json={"status": "CANCELLED", "location": "Bengaluru"},
        headers=auth_headers(driver),
    )
    assert cancel.status_code == 403

    edit = client.patch(f"/api/v1/parcels/{tn}", json={"weight": 7}, headers=auth_headers(driver))
    assert edit.status_code == 403


def test_customer_can_cancel_own_shipment_before_pickup(
    client: TestClient, auth_headers, customer, receiver
) -> None:
    parcel = _create_parcel(client, auth_headers(customer), receiver.email)
    tn = parcel["tracking_number"]
    cancel = client.post(
        f"/api/v1/parcels/{tn}/status",
        json={"status": "CANCELLED", "location": "Bengaluru", "remarks": "Changed my mind"},
        headers=auth_headers(customer),
    )
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "CANCELLED"


def test_customer_cannot_advance_status(
    client: TestClient, auth_headers, customer, receiver
) -> None:
    parcel = _create_parcel(client, auth_headers(customer), receiver.email)
    response = client.post(
        f"/api/v1/parcels/{parcel['tracking_number']}/status",
        json={"status": "PICKED_UP", "location": "Bengaluru"},
        headers=auth_headers(customer),
    )
    assert response.status_code == 403


def test_assignment_requires_admin_and_a_valid_driver(
    client: TestClient, auth_headers, customer, receiver, driver
) -> None:
    parcel = _create_parcel(client, auth_headers(customer), receiver.email)
    tn = parcel["tracking_number"]

    forbidden = client.post(
        f"/api/v1/parcels/{tn}/assign",
        json={"driver_id": driver.user_id},
        headers=auth_headers(customer),
    )
    assert forbidden.status_code == 403

    not_a_driver = client.post(
        f"/api/v1/parcels/{tn}/assign",
        json={"driver_id": customer.user_id},
        headers=auth_headers(customer),
    )
    assert not_a_driver.status_code == 403


def test_admin_can_delete_parcel_and_history(
    client: TestClient, auth_headers, customer, receiver, admin, db: Session
) -> None:
    parcel = _create_parcel(client, auth_headers(customer), receiver.email)
    tn = parcel["tracking_number"]
    response = client.delete(f"/api/v1/parcels/{tn}", headers=auth_headers(admin))
    assert response.status_code == 200
    assert client.get(f"/api/v1/parcels/{tn}", headers=auth_headers(admin)).status_code == 404

    from app.models.tracking_log import TrackingLog

    remaining = db.query(TrackingLog).filter(TrackingLog.tracking_number == tn).count()
    assert remaining == 0


def test_list_filters_by_status_and_query(
    client: TestClient, auth_headers, customer, receiver
) -> None:
    created = _create_parcel(client, auth_headers(customer), receiver.email)
    filtered = client.get("/api/v1/parcels?status=CANCELLED", headers=auth_headers(customer))
    assert filtered.json()["total"] == 0
    assert filtered.json()["items"] == []

    by_query = client.get(
        f"/api/v1/parcels?q={created['tracking_number']}", headers=auth_headers(customer)
    )
    assert by_query.json()["total"] == 1
