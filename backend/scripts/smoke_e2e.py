"""End-to-end smoke test against a *running* API.

    python -m scripts.smoke_e2e
    API_BASE_URL=http://127.0.0.1:8000 python -m scripts.smoke_e2e

Exercises the seeded demo accounts. Creates one throwaway shipment and deletes
it again, so it is safe to re-run. Exits non-zero on the first failure.
"""

from __future__ import annotations

import os
import sys
import time

import httpx

BASE = os.environ.get("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "DemoPass123")


def check(label: str, condition: bool, detail: object = "") -> None:
    if condition:
        print(f"  PASS  {label}")
        return
    print(f"  FAIL  {label} -> {detail}")
    raise SystemExit(1)


def main() -> None:
    client = httpx.Client(base_url=BASE, timeout=20)

    print("1. Health and public tracking")
    health = client.get("/health")
    check("health is ok", health.status_code == 200 and health.json()["database"] == "ok", health.text)

    tracked = client.get("/api/v1/tracking/CPT-SEED0002")
    check("public tracking returns the seeded parcel", tracked.status_code == 200, tracked.text)
    payload = tracked.json()
    check("status is IN_TRANSIT", payload["status"] == "IN_TRANSIT", payload["status"])
    check("timeline has events", len(payload["events"]) >= 2, payload["events"])
    check("street address is redacted", "Residency Road" not in tracked.text, "address leaked")
    check("emails are redacted", "@courier.dev" not in tracked.text, "email leaked")

    unknown = client.get("/api/v1/tracking/CPT-NOPE0000")
    check("unknown tracking number is 404", unknown.status_code == 404, unknown.status_code)

    print("2. Authentication")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@courier.dev", "password": DEMO_PASSWORD},
    )
    check("admin can sign in", login.status_code == 200, login.text)
    admin = {"Authorization": f"Bearer {login.json()['access_token']}"}

    bad = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@courier.dev", "password": "wrong-password"},
    )
    check("wrong password is 401", bad.status_code == 401, bad.status_code)
    check("unauthenticated dashboard is 401", client.get("/api/v1/dashboard/summary").status_code == 401)

    print("3. Role-scoped dashboard and admin data")
    summary = client.get("/api/v1/dashboard/summary", headers=admin).json()
    check("dashboard totals are database-backed", summary["total_parcels"] >= 3, summary["total_parcels"])
    check("status breakdown covers all states", len(summary["status_breakdown"]) == 7)

    drivers = client.get("/api/v1/users/drivers", headers=admin)
    check("driver list is available", drivers.status_code == 200 and drivers.json(), drivers.text)
    driver_id = drivers.json()[0]["user_id"]

    print("4. Register a customer and book a parcel")
    email = f"smoke{int(time.time())}@example.com"
    registered = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Smoke Tester",
            "email": email,
            "phone": "+91 9000000099",
            "password": "SmokePass123",
        },
    )
    check("registration succeeds", registered.status_code == 201, registered.text)
    customer = {"Authorization": f"Bearer {registered.json()['access_token']}"}

    created = client.post(
        "/api/v1/parcels",
        json={
            "receiver_email": "rae@courier.dev",
            "weight": 3.4,
            "pickup_address": "12 MG Road, Bengaluru, Karnataka 560001",
            "delivery_address": "45 Park Street, Kolkata, West Bengal 700016",
        },
        headers=customer,
    )
    check("parcel booking succeeds", created.status_code == 201, created.text)
    parcel = created.json()
    tracking_number = parcel["tracking_number"]
    check("tracking number format", tracking_number.startswith("CPT-") and len(tracking_number) == 12, tracking_number)
    check("first timeline event exists", len(parcel["logs"]) == 1, parcel["logs"])

    print("5. Assignment and status workflow")
    assigned = client.post(
        f"/api/v1/parcels/{tracking_number}/assign",
        json={"driver_id": driver_id},
        headers=admin,
    )
    check("admin can assign a driver", assigned.status_code == 200, assigned.text)

    driver_login = client.post(
        "/api/v1/auth/login",
        json={"email": "driver@courier.dev", "password": DEMO_PASSWORD},
    )
    driver = {"Authorization": f"Bearer {driver_login.json()['access_token']}"}

    picked_up = client.post(
        f"/api/v1/parcels/{tracking_number}/status",
        json={"status": "PICKED_UP", "location": "Bengaluru", "remarks": "Collected"},
        headers=driver,
    )
    check("driver can scan pickup", picked_up.status_code == 200, picked_up.text)

    invalid = client.post(
        f"/api/v1/parcels/{tracking_number}/status",
        json={"status": "DELIVERED", "location": "Kolkata"},
        headers=driver,
    )
    check("invalid transition is rejected", invalid.status_code == 422, invalid.text)

    cancel = client.post(
        f"/api/v1/parcels/{tracking_number}/status",
        json={"status": "CANCELLED", "location": "Bengaluru"},
        headers=driver,
    )
    check("driver cannot cancel", cancel.status_code == 403, cancel.text)

    print("6. Authorization boundaries")
    outsider_email = f"outsider{int(time.time())}@example.com"
    outsider = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Outsider",
            "email": outsider_email,
            "password": "OutsiderPass1",
        },
    )
    outsider_headers = {"Authorization": f"Bearer {outsider.json()['access_token']}"}
    hidden = client.get(f"/api/v1/parcels/{tracking_number}", headers=outsider_headers)
    check("unrelated customer cannot read the parcel", hidden.status_code == 404, hidden.status_code)
    check(
        "customer cannot list users",
        client.get("/api/v1/users", headers=customer).status_code == 403,
    )

    print("7. Timeline consistency")
    detail = client.get(f"/api/v1/parcels/{tracking_number}", headers=customer).json()
    statuses = [event["status"] for event in detail["logs"]]
    check("history is ordered", statuses == ["CREATED", "PICKED_UP"], statuses)
    check("parcel status matches last event", detail["status"] == statuses[-1], detail["status"])

    print("8. Cleanup")
    deleted = client.delete(f"/api/v1/parcels/{tracking_number}", headers=admin)
    check("admin can delete the test shipment", deleted.status_code == 200, deleted.text)
    check(
        "deleted parcel is gone",
        client.get(f"/api/v1/parcels/{tracking_number}", headers=admin).status_code == 404,
    )

    print("\nAll end-to-end checks passed.")


if __name__ == "__main__":
    try:
        main()
    except httpx.ConnectError:
        print(f"Could not reach the API at {BASE}. Start it first.")
        sys.exit(1)
