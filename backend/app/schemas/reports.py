from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class DailyThroughput(BaseModel):
    day: date
    created: int
    delivered: int


class RouteStat(BaseModel):
    route: str
    count: int


class ReportsOverview(BaseModel):
    range_days: int
    throughput: list[DailyThroughput]
    status_distribution: list[dict[str, int | str]]
    average_delivery_hours: float | None
    top_routes: list[RouteStat]
    total_parcels_in_range: int
