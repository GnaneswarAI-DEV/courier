from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import parcel_payload


def test_dashboard_is_empty_but_valid_for_new_customer(
    client: TestClient, auth_headers, customer
) -> None:
    response = client.get("/api/v1/dashboard/summary", headers=auth_headers(customer))
    assert response.status_code == 200
    body = response.json()
    assert body["total_parcels"] == 0
    assert body["active_parcels"] == 0
    assert body["recent_parcels"] == []
    assert len(body["status_breakdown"]) == 7
    assert body["on_time_delivery_rate"] is None


def test_dashboard_counts_come_from_the_database(
    client: TestClient, auth_headers, customer, receiver, make_user
) -> None:
    outsider = make_user(email="nobody@example.com")
    client.post(
        "/api/v1/parcels", json=parcel_payload(receiver.email), headers=auth_headers(customer)
    )
    client.post(
        "/api/v1/parcels", json=parcel_payload(receiver.email), headers=auth_headers(customer)
    )

    mine = client.get("/api/v1/dashboard/summary", headers=auth_headers(customer)).json()
    assert mine["total_parcels"] == 2
    assert mine["awaiting_pickup"] == 2
    assert mine["total_weight_kg"] == 5.0
    assert mine["active_parcels"] == 2

    # The receiver also sees both shipments (as incoming).
    theirs = client.get("/api/v1/dashboard/summary", headers=auth_headers(receiver)).json()
    assert theirs["total_parcels"] == 2

    unrelated = client.get("/api/v1/dashboard/summary", headers=auth_headers(outsider)).json()
    assert unrelated["total_parcels"] == 0


def test_admin_dashboard_reports_driver_count(
    client: TestClient, auth_headers, admin, driver
) -> None:
    body = client.get("/api/v1/dashboard/summary", headers=auth_headers(admin)).json()
    assert body["active_drivers"] == 1


def test_reports_require_admin(client: TestClient, auth_headers, customer) -> None:
    assert client.get("/api/v1/reports/overview", headers=auth_headers(customer)).status_code == 403


def test_reports_overview_shape(
    client: TestClient, auth_headers, admin, customer, receiver
) -> None:
    client.post(
        "/api/v1/parcels", json=parcel_payload(receiver.email), headers=auth_headers(customer)
    )
    response = client.get("/api/v1/reports/overview?days=14", headers=auth_headers(admin))
    assert response.status_code == 200
    body = response.json()
    assert body["range_days"] == 14
    assert len(body["throughput"]) == 14
    assert body["throughput"][-1]["created"] == 1
    assert body["total_parcels_in_range"] == 1
    assert body["top_routes"][0]["route"] == "Bengaluru → Kolkata"


def test_reports_reject_out_of_range_days(client: TestClient, auth_headers, admin) -> None:
    assert (
        client.get("/api/v1/reports/overview?days=365", headers=auth_headers(admin)).status_code
        == 422
    )
