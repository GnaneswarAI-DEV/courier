from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tracking_log import TrackingLog


class TrackingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_parcel(self, tracking_number: str) -> list[TrackingLog]:
        stmt = (
            select(TrackingLog)
            .where(TrackingLog.tracking_number == tracking_number.upper())
            .order_by(TrackingLog.updated_at.asc(), TrackingLog.log_id.asc())
        )
        return list(self.db.scalars(stmt).all())

    def add(self, log: TrackingLog) -> TrackingLog:
        self.db.add(log)
        return log
