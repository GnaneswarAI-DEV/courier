from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import (
    BigInteger, CheckConstraint, Date, DateTime, Enum,
    ForeignKey, Index, Numeric, String
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ParcelStatus
from app.utils.time import utcnow

if TYPE_CHECKING:
    from app.models.tracking_log import TrackingLog
    from app.models.user import User


class Parcel(Base):
    __tablename__ = "parcels"
    __table_args__ = (
        CheckConstraint("weight > 0", name="weight_positive"),
        Index("ix_parcels_sender_status", "sender_id", "status"),
        Index("ix_parcels_receiver_status", "receiver_id", "status"),
        Index("ix_parcels_driver_status", "driver_id", "status"),
    )

    tracking_number: Mapped[str] = mapped_column(String(24), primary_key=True)
    sender_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.user_id"), nullable=False
    )
    receiver_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.user_id"), nullable=False
    )
    driver_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.user_id"), nullable=True
    )
    weight: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    pickup_address: Mapped[str] = mapped_column(String(255), nullable=False)
    delivery_address: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[ParcelStatus] = mapped_column(
        Enum(ParcelStatus, native_enum=False, length=20, validate_strings=True),
        nullable=False,
        default=ParcelStatus.CREATED,
        index=True,
    )
    estimated_delivery: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=utcnow, onupdate=utcnow
    )
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    sender: Mapped[User] = relationship(
        back_populates="sent_parcels", foreign_keys=[sender_id], lazy="joined"
    )
    receiver: Mapped[User] = relationship(
        back_populates="received_parcels", foreign_keys=[receiver_id], lazy="joined"
    )
    driver: Mapped[User | None] = relationship(foreign_keys=[driver_id], lazy="joined")
    logs: Mapped[list[TrackingLog]] = relationship(
        back_populates="parcel",
        cascade="all, delete-orphan",
        order_by="TrackingLog.updated_at",
    )

    @property
    def is_terminal(self) -> bool:
        return self.status in (ParcelStatus.DELIVERED, ParcelStatus.CANCELLED)

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<Parcel {self.tracking_number} {self.status}>"
