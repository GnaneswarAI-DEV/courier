from __future__ import annotations

from collections import Counter
from datetime import timedelta

from sqlalchemy.orm import Session

from app.models.enums import ParcelStatus
from app.models.user import User
from app.repositories.parcels import ParcelRepository
from app.schemas.reports import DailyThroughput, ReportsOverview, RouteStat
from app.utils.address import city_of
from app.utils.time import utcnow


class ReportService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.parcels = ParcelRepository(db)

    def overview(self, user: User, days: int = 30) -> ReportsOverview:
        days = max(7, min(days, 90))
        start = (utcnow() - timedelta(days=days - 1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        rows = self.parcels.rows_since(user, start)

        created: Counter = Counter()
        delivered: Counter = Counter()
        statuses: Counter = Counter()
        routes: Counter = Counter()

        for created_at, delivered_at, status, pickup, delivery in rows:
            created[created_at.date()] += 1
            statuses[status.value] += 1
            if delivered_at is not None and delivered_at >= start:
                delivered[delivered_at.date()] += 1
            routes[f"{city_of(pickup)} → {city_of(delivery)}"] += 1

        today = utcnow().date()
        throughput = [
            DailyThroughput(
                day=today - timedelta(days=offset),
                created=created.get(today - timedelta(days=offset), 0),
                delivered=delivered.get(today - timedelta(days=offset), 0),
            )
            for offset in range(days - 1, -1, -1)
        ]

        return ReportsOverview(
            range_days=days,
            throughput=throughput,
            status_distribution=[
                {"status": status.value, "count": statuses.get(status.value, 0)}
                for status in ParcelStatus
            ],
            average_delivery_hours=self.parcels.delivery_hours(user),
            top_routes=[
                RouteStat(route=route, count=count) for route, count in routes.most_common(5)
            ],
            total_parcels_in_range=len(rows),
        )
