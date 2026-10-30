from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import ParcelStatus, UserRole
from app.models.parcel import Parcel
from app.models.tracking_log import TrackingLog
from app.models.user import User


class ParcelRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ---------------------------------------------------------------- reads
    def get(self, tracking_number: str, *, with_logs: bool = False) -> Parcel | None:
        stmt = select(Parcel).where(Parcel.tracking_number == tracking_number.upper())
        if with_logs:
            stmt = stmt.options(selectinload(Parcel.logs))
        return self.db.scalar(stmt)

    def exists(self, tracking_number: str) -> bool:
        return bool(
            self.db.scalar(
                select(func.count())
                .select_from(Parcel)
                .where(Parcel.tracking_number == tracking_number.upper())
            )
        )

    @staticmethod
    def scope_filters(user: User) -> list[Any]:
        """Row-level visibility rules applied to every parcel query."""
        if user.role == UserRole.ADMIN:
            return []
        if user.role == UserRole.DRIVER:
            return [Parcel.driver_id == user.user_id]
        return [or_(Parcel.sender_id == user.user_id, Parcel.receiver_id == user.user_id)]

    def can_access(self, parcel: Parcel, user: User) -> bool:
        if user.role == UserRole.ADMIN:
            return True
        if user.role == UserRole.DRIVER:
            return parcel.driver_id == user.user_id
        return user.user_id in (parcel.sender_id, parcel.receiver_id)

    def list_scoped(
        self,
        user: User,
        *,
        status: ParcelStatus | None = None,
        query: str | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[Sequence[Parcel], int]:
        stmt: Select = select(Parcel).options(selectinload(Parcel.logs))
        filters = self.scope_filters(user)
        if status is not None:
            filters.append(Parcel.status == status)
        if query:
            like = f"%{query.strip()}%"
            filters.append(
                or_(
                    Parcel.tracking_number.ilike(like),
                    Parcel.pickup_address.ilike(like),
                    Parcel.delivery_address.ilike(like),
                    Parcel.sender.has(User.name.ilike(like)),
                    Parcel.receiver.has(User.name.ilike(like)),
                )
            )
        if filters:
            stmt = stmt.where(and_(*filters))

        count_stmt = select(func.count()).select_from(Parcel)
        if filters:
            count_stmt = count_stmt.where(and_(*filters))
        total = int(self.db.scalar(count_stmt) or 0)

        stmt = (
            stmt.order_by(Parcel.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(self.db.scalars(stmt).unique().all()), total

    def recent(self, user: User, limit: int = 5) -> list[Parcel]:
        stmt = select(Parcel).where(*self.scope_filters(user))
        stmt = stmt.order_by(Parcel.created_at.desc()).limit(limit)
        return list(self.db.scalars(stmt).unique().all())

    # ------------------------------------------------------------- aggregates
    def count_by_status(self, user: User) -> dict[ParcelStatus, int]:
        stmt = (
            select(Parcel.status, func.count())
            .where(*self.scope_filters(user))
            .group_by(Parcel.status)
        )
        return {ParcelStatus(row[0]): int(row[1]) for row in self.db.execute(stmt).all()}

    def total_weight(self, user: User) -> float:
        stmt = select(func.coalesce(func.sum(Parcel.weight), 0)).where(*self.scope_filters(user))
        return float(self.db.scalar(stmt) or 0)

    def count_created_since(self, user: User, since: datetime) -> int:
        stmt = (
            select(func.count())
            .select_from(Parcel)
            .where(*self.scope_filters(user), Parcel.created_at >= since)
        )
        return int(self.db.scalar(stmt) or 0)

    def count_delivered_since(self, user: User, since: datetime) -> int:
        stmt = (
            select(func.count())
            .select_from(Parcel)
            .where(
                *self.scope_filters(user),
                Parcel.status == ParcelStatus.DELIVERED,
                Parcel.delivered_at.is_not(None),
                Parcel.delivered_at >= since,
            )
        )
        return int(self.db.scalar(stmt) or 0)

    def on_time_stats(self, user: User) -> tuple[int, int]:
        """Returns (delivered_with_due_date, delivered_on_or_before_due_date)."""
        base = [
            *self.scope_filters(user),
            Parcel.status == ParcelStatus.DELIVERED,
            Parcel.delivered_at.is_not(None),
            Parcel.estimated_delivery.is_not(None),
        ]
        total = int(self.db.scalar(select(func.count()).select_from(Parcel).where(*base)) or 0)
        on_time = int(
            self.db.scalar(
                select(func.count())
                .select_from(Parcel)
                .where(*base, func.date(Parcel.delivered_at) <= Parcel.estimated_delivery)
            )
            or 0
        )
        return total, on_time

    def rows_since(
        self, user: User, since: datetime
    ) -> list[tuple[datetime, datetime | None, ParcelStatus, str, str]]:
        stmt = select(
            Parcel.created_at,
            Parcel.delivered_at,
            Parcel.status,
            Parcel.pickup_address,
            Parcel.delivery_address,
        ).where(*self.scope_filters(user), Parcel.created_at >= since)
        return [
            (row[0], row[1], ParcelStatus(row[2]), row[3], row[4])
            for row in self.db.execute(stmt).all()
        ]

    def delivery_hours(self, user: User) -> float | None:
        rows = self.db.execute(
            select(Parcel.created_at, Parcel.delivered_at)
            .where(
                *self.scope_filters(user),
                Parcel.delivered_at.is_not(None),
                Parcel.status == ParcelStatus.DELIVERED,
            )
            .limit(500)
        ).all()
        durations = [
            (delivered - created).total_seconds() / 3600 for created, delivered in rows if delivered
        ]
        if not durations:
            return None
        return round(sum(durations) / len(durations), 2)

    # ---------------------------------------------------------------- writes
    def create(self, parcel: Parcel) -> Parcel:
        self.db.add(parcel)
        self.db.flush()
        return parcel

    def add_log(self, log: TrackingLog) -> TrackingLog:
        self.db.add(log)
        return log

    def delete(self, parcel: Parcel) -> None:
        self.db.delete(parcel)

    def has_parcels_for_user(self, user_id: int) -> bool:
        return bool(
            self.db.scalar(
                select(func.count())
                .select_from(Parcel)
                .where(
                    or_(
                        Parcel.sender_id == user_id,
                        Parcel.receiver_id == user_id,
                        Parcel.driver_id == user_id,
                    )
                )
            )
        )

    def weight_decimal(self, value: float) -> Decimal:
        return Decimal(str(round(value, 2)))
