from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ParcelStatus
from app.utils.time import utcnow

if TYPE_CHECKING:
    from app.models.parcel import Parcel


class TrackingLog(Base):
    """Immutable shipment event written whenever a parcel changes status."""

    __tablename__ = "tracking_logs"
    __table_args__ = (Index("ix_tracking_logs_parcel_time", "tracking_number", "updated_at"),)

    log_id: Mapped[int] = mapped_column(
    BigInteger, primary_key=True, autoincrement=True
)
    tracking_number: Mapped[str] = mapped_column(
        ForeignKey("parcels.tracking_number", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[ParcelStatus] = mapped_column(
        Enum(ParcelStatus, native_enum=False, length=20, validate_strings=True), nullable=False
    )
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_by: Mapped[int | None] = mapped_column(
    BigInteger, ForeignKey("users.user_id"), nullable=True
)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)

    parcel: Mapped[Parcel] = relationship(back_populates="logs")

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<TrackingLog {self.log_id} {self.tracking_number} {self.status}>"
