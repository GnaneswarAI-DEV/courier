from __future__ import annotations

from pydantic import BaseModel

from app.models.enums import ParcelStatus
from app.schemas.parcel import ParcelOut


class StatusCount(BaseModel):
    status: ParcelStatus
    count: int


class DashboardSummary(BaseModel):
    total_parcels: int
    active_parcels: int
    delivered_parcels: int
    cancelled_parcels: int
    awaiting_pickup: int
    created_last_7_days: int
    delivered_last_7_days: int
    total_weight_kg: float
    active_drivers: int
    on_time_delivery_rate: float | None
    status_breakdown: list[StatusCount]
    recent_parcels: list[ParcelOut]
