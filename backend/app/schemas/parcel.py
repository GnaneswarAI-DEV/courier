from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models.enums import ParcelStatus
from app.schemas.user import UserBrief

ADDRESS_MAX = 255


class ParcelCreate(BaseModel):
    receiver_email: EmailStr
    weight: float = Field(gt=0, le=1000, description="Weight in kilograms")
    pickup_address: str = Field(min_length=5, max_length=ADDRESS_MAX)
    delivery_address: str = Field(min_length=5, max_length=ADDRESS_MAX)
    estimated_delivery: date | None = None
    notes: str | None = Field(default=None, max_length=300)

    @model_validator(mode="after")
    def _addresses_differ(self) -> ParcelCreate:
        if self.pickup_address.strip().lower() == self.delivery_address.strip().lower():
            raise ValueError("Pickup and delivery addresses must differ")
        return self


class ParcelUpdate(BaseModel):
    weight: float | None = Field(default=None, gt=0, le=1000)
    pickup_address: str | None = Field(default=None, min_length=5, max_length=ADDRESS_MAX)
    delivery_address: str | None = Field(default=None, min_length=5, max_length=ADDRESS_MAX)
    estimated_delivery: date | None = None


class StatusUpdate(BaseModel):
    status: ParcelStatus
    location: str = Field(min_length=2, max_length=ADDRESS_MAX)
    remarks: str | None = Field(default=None, max_length=500)


class AssignDriver(BaseModel):
    driver_id: int = Field(gt=0)


class ParcelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tracking_number: str
    status: ParcelStatus
    weight: float
    pickup_address: str
    delivery_address: str
    estimated_delivery: date | None
    created_at: datetime
    updated_at: datetime
    delivered_at: datetime | None
    sender: UserBrief
    receiver: UserBrief
    driver: UserBrief | None = None


class ParcelDetail(ParcelOut):
    logs: list[TrackingEventOut] = Field(default_factory=list)


class TrackingEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    log_id: int
    status: ParcelStatus
    location: str
    remarks: str | None
    updated_at: datetime


class PublicTrackingParcel(BaseModel):
    """Redacted parcel view used by the anonymous tracking endpoint."""

    tracking_number: str
    status: ParcelStatus
    weight: float
    pickup_city: str
    delivery_city: str
    estimated_delivery: date | None
    created_at: datetime
    updated_at: datetime
    delivered_at: datetime | None
    sender_name: str
    receiver_name: str
    events: list[TrackingEventOut]


class DriverOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    name: str
    email: str


ParcelDetail.model_rebuild()
