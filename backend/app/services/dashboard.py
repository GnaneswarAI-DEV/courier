from __future__ import annotations

from datetime import timedelta

from sqlalchemy.orm import Session

from app.models.enums import ParcelStatus
from app.models.user import User
from app.repositories.parcels import ParcelRepository
from app.repositories.users import UserRepository
from app.schemas.dashboard import DashboardSummary, StatusCount
from app.schemas.parcel import ParcelOut
from app.utils.time import utcnow


class DashboardService:
    """All dashboard numbers come from SQL aggregates, never hard-coded values."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.parcels = ParcelRepository(db)
        self.users = UserRepository(db)

    def summary(self, user: User) -> DashboardSummary:
        counts = self.parcels.count_by_status(user)
        since = utcnow() - timedelta(days=7)
        with_due, on_time = self.parcels.on_time_stats(user)

        breakdown = [
            StatusCount(status=status, count=counts.get(status, 0)) for status in ParcelStatus
        ]

        return DashboardSummary(
            total_parcels=sum(counts.values()),
            active_parcels=sum(counts.get(status, 0) for status in ParcelStatus)
            - counts.get(ParcelStatus.DELIVERED, 0)
            - counts.get(ParcelStatus.CANCELLED, 0),
            delivered_parcels=counts.get(ParcelStatus.DELIVERED, 0),
            cancelled_parcels=counts.get(ParcelStatus.CANCELLED, 0),
            awaiting_pickup=counts.get(ParcelStatus.CREATED, 0),
            created_last_7_days=self.parcels.count_created_since(user, since),
            delivered_last_7_days=self.parcels.count_delivered_since(user, since),
            total_weight_kg=round(self.parcels.total_weight(user), 2),
            active_drivers=self.users.count_active_drivers() if user.role.value == "admin" else 0,
            on_time_delivery_rate=round(on_time / with_due * 100, 1) if with_due else None,
            status_breakdown=breakdown,
            recent_parcels=[ParcelOut.model_validate(p) for p in self.parcels.recent(user, 5)],
        )
