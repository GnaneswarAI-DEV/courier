"""Create demo accounts and shipments. Safe to run more than once.

Usage:
    cd backend
    DATABASE_URL="mysql+pymysql://..." .venv/Scripts/python -m scripts.seed

Accounts created (change the password after a public demo):
    admin@courier.dev    / DemoPass123
    driver@courier.dev   / DemoPass123
    customer@courier.dev / DemoPass123
    rae@courier.dev      / DemoPass123
"""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from sqlalchemy import func, select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.enums import ParcelStatus, UserRole
from app.models.parcel import Parcel
from app.models.tracking_log import TrackingLog
from app.models.user import User
from app.utils.time import utcnow

PASSWORD = "DemoPass123"

USERS = [
    ("Meera Admin", "admin@courier.dev", "+91 9000000001", UserRole.ADMIN),
    ("Dev Driver", "driver@courier.dev", "+91 9000000002", UserRole.DRIVER),
    ("Chandra Customer", "customer@courier.dev", "+91 9000000003", UserRole.CUSTOMER),
    ("Rae Receiver", "rae@courier.dev", "+91 9000000004", UserRole.CUSTOMER),
]

PARCELS = [
    {
        "tracking_number": "CPT-SEED0001",
        "sender": "customer@courier.dev",
        "receiver": "rae@courier.dev",
        "driver": "driver@courier.dev",
        "weight": "2.50",
        "pickup": "12 MG Road, Bengaluru, Karnataka 560001",
        "delivery": "45 Park Street, Kolkata, West Bengal 700016",
        "status": ParcelStatus.DELIVERED,
        "events": [
            (ParcelStatus.CREATED, "Bengaluru", "Shipment registered and awaiting pickup", 6),
            (ParcelStatus.PICKED_UP, "Bengaluru", "Parcel collected from sender", 5),
            (ParcelStatus.IN_TRANSIT, "Nagpur", "Departed Bengaluru hub", 4),
            (ParcelStatus.DELIVERED, "Kolkata", "Delivered to receiver", 3),
        ],
    },
    {
        "tracking_number": "CPT-SEED0002",
        "sender": "customer@courier.dev",
        "receiver": "rae@courier.dev",
        "driver": "driver@courier.dev",
        "weight": "7.75",
        "pickup": "88 Residency Road, Bengaluru, Karnataka 560025",
        "delivery": "21 Anna Salai, Chennai, Tamil Nadu 600002",
        "status": ParcelStatus.IN_TRANSIT,
        "events": [
            (ParcelStatus.CREATED, "Bengaluru", "Shipment registered and awaiting pickup", 2),
            (ParcelStatus.PICKED_UP, "Bengaluru", "Parcel collected from sender", 1),
            (ParcelStatus.IN_TRANSIT, "Vellore", "In transit to Chennai hub", 0),
        ],
    },
    {
        "tracking_number": "CPT-SEED0003",
        "sender": "rae@courier.dev",
        "receiver": "customer@courier.dev",
        "driver": None,
        "weight": "1.20",
        "pickup": "9 Banjara Hills, Hyderabad, Telangana 500034",
        "delivery": "76 Linking Road, Mumbai, Maharashtra 400050",
        "status": ParcelStatus.CREATED,
        "events": [
            (ParcelStatus.CREATED, "Hyderabad", "Shipment registered and awaiting pickup", 1),
        ],
    },
]


def main() -> None:
    # Dev convenience only: production schemas come from Alembic.
    Base.metadata.create_all(bind=engine)
    now = utcnow()
    db = SessionLocal()

    try:
        users: dict[str, User] = {}
        for name, email, phone, role in USERS:
            user = db.scalar(select(User).where(func.lower(User.email) == email))
            if user is None:
                user = User(
                    name=name,
                    email=email,
                    phone=phone,
                    password_hash=hash_password(PASSWORD),
                    role=role,
                    is_active=True,
                )
                db.add(user)
                db.flush()
            users[email] = user

        for spec in PARCELS:
            if db.get(Parcel, spec["tracking_number"]) is not None:
                continue

            sender = users[spec["sender"]]
            receiver = users[spec["receiver"]]
            driver = users[spec["driver"]] if spec["driver"] else None
            created = now - timedelta(days=spec["events"][0][3] or 0.5)
            delivered_at = (
                now - timedelta(days=3) if spec["status"] == ParcelStatus.DELIVERED else None
            )

            parcel = Parcel(
                tracking_number=spec["tracking_number"],
                sender_id=sender.user_id,
                receiver_id=receiver.user_id,
                driver_id=driver.user_id if driver else None,
                weight=Decimal(spec["weight"]),
                pickup_address=spec["pickup"],
                delivery_address=spec["delivery"],
                status=spec["status"],
                estimated_delivery=(created + timedelta(days=4)).date(),
                created_at=created,
                updated_at=now,
                delivered_at=delivered_at,
            )
            db.add(parcel)

            for status, location, remarks, days_ago in spec["events"]:
                db.add(
                    TrackingLog(
                        tracking_number=parcel.tracking_number,
                        status=status,
                        location=location,
                        remarks=remarks,
                        created_by=sender.user_id,
                        updated_at=now - timedelta(days=days_ago),
                    )
                )

        db.commit()
        total_users = db.scalar(select(func.count()).select_from(User)) or 0
        total_parcels = db.scalar(select(func.count()).select_from(Parcel)) or 0
        print(f"Seed complete: {total_users} users, {total_parcels} parcels.")
        print(f"Demo password for every account: {PASSWORD}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
