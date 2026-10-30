from __future__ import annotations

from datetime import datetime
from sqlalchemy import BigInteger, Boolean, DateTime, Enum, String

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import UserRole
from app.utils.time import utcnow


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(
    BigInteger, primary_key=True, autoincrement=True
)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, length=20, validate_strings=True),
        nullable=False,
        default=UserRole.CUSTOMER,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)

    sent_parcels: Mapped[list[Parcel]] = relationship(  # noqa: F821
        back_populates="sender", foreign_keys="Parcel.sender_id", lazy="raise"
    )
    received_parcels: Mapped[list[Parcel]] = relationship(  # noqa: F821
        back_populates="receiver", foreign_keys="Parcel.receiver_id", lazy="raise"
    )

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def is_driver(self) -> bool:
        return self.role == UserRole.DRIVER

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<User {self.user_id} {self.email} {self.role}>"
