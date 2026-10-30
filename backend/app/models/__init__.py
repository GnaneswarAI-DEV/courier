"""Import every model so SQLAlchemy's registry and Alembic autogenerate see them."""

from app.models.enums import (
    ACTIVE_STATUSES,
    STATUS_TRANSITIONS,
    ParcelStatus,
    UserRole,
    can_transition,
)
from app.models.parcel import Parcel
from app.models.tracking_log import TrackingLog
from app.models.user import User

__all__ = [
    "ACTIVE_STATUSES",
    "STATUS_TRANSITIONS",
    "Parcel",
    "ParcelStatus",
    "TrackingLog",
    "User",
    "UserRole",
    "can_transition",
]
