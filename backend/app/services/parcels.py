"""Shipment business logic: creation, assignment and status transitions.

Every state change is written inside one transaction: the parcel row is updated
and a tracking event is inserted in the same commit, so history can never
disagree with the current status.
"""

from __future__ import annotations

import secrets
from datetime import date

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.exceptions.errors import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
    PermissionDeniedError,
)
from app.models.enums import ParcelStatus, UserRole, can_transition
from app.models.parcel import Parcel
from app.models.tracking_log import TrackingLog
from app.models.user import User
from app.repositories.parcels import ParcelRepository
from app.repositories.tracking import TrackingRepository
from app.repositories.users import UserRepository
from app.schemas.parcel import (
    ParcelCreate,
    ParcelUpdate,
    PublicTrackingParcel,
    StatusUpdate,
    TrackingEventOut,
)
from app.utils.address import city_of
from app.utils.time import today_utc, utcnow

logger = get_logger(__name__)

_TRACKING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I look-alikes


class ParcelService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.parcels = ParcelRepository(db)
        self.tracking = TrackingRepository(db)
        self.users = UserRepository(db)

    # --------------------------------------------------------------- helpers
    def _generate_tracking_number(self) -> str:
        for _ in range(20):
            suffix = "".join(secrets.choice(_TRACKING_ALPHABET) for _ in range(8))
            candidate = f"CPT-{suffix}"
            if not self.parcels.exists(candidate):
                return candidate
        raise ConflictError("Could not allocate a tracking number, please retry")

    @staticmethod
    def _validate_estimated_delivery(value: date | None) -> None:
        if value is not None and value < today_utc():
            raise BusinessRuleError("Estimated delivery date cannot be in the past")

    def _load_authorised(self, tracking_number: str, user: User) -> Parcel:
        parcel = self.parcels.get(tracking_number, with_logs=True)
        # Unknown and unauthorised identifiers share a 404 so parcel existence
        # cannot be probed by outsiders.
        if parcel is None or not self.parcels.can_access(parcel, user):
            raise NotFoundError("Parcel not found")
        return parcel

    # ---------------------------------------------------------------- reads
    def list_for(
        self,
        user: User,
        *,
        status: ParcelStatus | None,
        query: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Parcel], int]:
        items, total = self.parcels.list_scoped(
            user, status=status, query=query, page=page, page_size=page_size
        )
        return list(items), total

    def get_for(self, tracking_number: str, user: User) -> Parcel:
        return self._load_authorised(tracking_number, user)

    def public_tracking(self, tracking_number: str) -> PublicTrackingParcel:
        parcel = self.parcels.get(tracking_number, with_logs=True)
        if parcel is None:
            raise NotFoundError("No shipment found for this tracking number")
        events = [
            TrackingEventOut.model_validate(log)
            for log in sorted(parcel.logs, key=lambda log: (log.updated_at, log.log_id))
        ]
        return PublicTrackingParcel(
            tracking_number=parcel.tracking_number,
            status=parcel.status,
            weight=float(parcel.weight),
            pickup_city=city_of(parcel.pickup_address),
            delivery_city=city_of(parcel.delivery_address),
            estimated_delivery=parcel.estimated_delivery,
            created_at=parcel.created_at,
            updated_at=parcel.updated_at,
            delivered_at=parcel.delivered_at,
            sender_name=parcel.sender.name if parcel.sender else "Sender",
            receiver_name=parcel.receiver.name if parcel.receiver else "Receiver",
            events=events,
        )

    # --------------------------------------------------------------- writes
    def create(self, payload: ParcelCreate, sender: User) -> Parcel:
        receiver = self.users.get_by_email(str(payload.receiver_email))
        if receiver is None:
            raise NotFoundError(
                "No registered account matches the receiver email. Ask them to sign up first."
            )
        if receiver.user_id == sender.user_id:
            raise BusinessRuleError("Sender and receiver cannot be the same account")
        if not receiver.is_active:
            raise BusinessRuleError("The receiver account is disabled")

        self._validate_estimated_delivery(payload.estimated_delivery)

        parcel = Parcel(
            tracking_number=self._generate_tracking_number(),
            sender_id=sender.user_id,
            receiver_id=receiver.user_id,
            weight=self.parcels.weight_decimal(payload.weight),
            pickup_address=payload.pickup_address.strip(),
            delivery_address=payload.delivery_address.strip(),
            status=ParcelStatus.CREATED,
            estimated_delivery=payload.estimated_delivery,
        )
        try:
            self.parcels.create(parcel)
            self.tracking.add(
                TrackingLog(
                    tracking_number=parcel.tracking_number,
                    status=ParcelStatus.CREATED,
                    location=city_of(parcel.pickup_address),
                    remarks=payload.notes or "Shipment registered and awaiting pickup",
                    created_by=sender.user_id,
                )
            )
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        self.db.refresh(parcel)
        logger.info("Parcel %s created by user %s", parcel.tracking_number, sender.user_id)
        return parcel

    def update(self, tracking_number: str, payload: ParcelUpdate, actor: User) -> Parcel:
        parcel = self._load_authorised(tracking_number, actor)
        if actor.role not in (UserRole.ADMIN, UserRole.CUSTOMER):
            raise PermissionDeniedError("Drivers cannot edit shipment details")
        if actor.role == UserRole.CUSTOMER and parcel.sender_id != actor.user_id:
            raise PermissionDeniedError("Only the sender can edit this shipment")
        if parcel.status != ParcelStatus.CREATED:
            raise BusinessRuleError("Shipment details can only be edited before pickup")

        data = payload.model_dump(exclude_unset=True)
        if "estimated_delivery" in data and data["estimated_delivery"] is not None:
            self._validate_estimated_delivery(data["estimated_delivery"])
            parcel.estimated_delivery = data["estimated_delivery"]
        elif "estimated_delivery" in data:
            parcel.estimated_delivery = None

        if data.get("weight") is not None:
            parcel.weight = self.parcels.weight_decimal(data["weight"])
        if data.get("pickup_address"):
            parcel.pickup_address = data["pickup_address"].strip()
        if data.get("delivery_address"):
            parcel.delivery_address = data["delivery_address"].strip()
        if parcel.pickup_address.lower() == parcel.delivery_address.lower():
            raise BusinessRuleError("Pickup and delivery addresses must differ")

        parcel.updated_at = utcnow()
        self.db.add(parcel)
        self.db.commit()
        self.db.refresh(parcel)
        return parcel

    def assign_driver(self, tracking_number: str, driver_id: int) -> Parcel:
        parcel = self.parcels.get(tracking_number, with_logs=True)
        if parcel is None:
            raise NotFoundError("Parcel not found")
        if parcel.is_terminal:
            raise BusinessRuleError("Completed shipments cannot be reassigned")

        driver = self.users.get(driver_id)
        if driver is None or driver.role != UserRole.DRIVER:
            raise BusinessRuleError("Selected user is not a driver")
        if not driver.is_active:
            raise BusinessRuleError("Selected driver account is disabled")

        parcel.driver_id = driver.user_id
        parcel.updated_at = utcnow()
        self.db.add(parcel)
        self.db.commit()
        self.db.refresh(parcel)
        logger.info("Parcel %s assigned to driver %s", tracking_number, driver.user_id)
        return parcel

    def change_status(self, tracking_number: str, payload: StatusUpdate, actor: User) -> Parcel:
        parcel = self._load_authorised(tracking_number, actor)

        if parcel.status == payload.status:
            pretty = payload.status.value.replace("_", " ").lower()
            raise BusinessRuleError(f"Shipment is already {pretty}")
        if not can_transition(parcel.status, payload.status):
            raise BusinessRuleError(
                f"Cannot move a shipment from {parcel.status.value} to {payload.status.value}"
            )

        if actor.role == UserRole.DRIVER:
            if parcel.driver_id != actor.user_id:
                raise PermissionDeniedError("This shipment is not assigned to you")
            if payload.status == ParcelStatus.CANCELLED:
                raise PermissionDeniedError("Drivers cannot cancel shipments")
        elif actor.role == UserRole.CUSTOMER:
            is_sender = parcel.sender_id == actor.user_id
            if not (is_sender and payload.status == ParcelStatus.CANCELLED):
                raise PermissionDeniedError(
                    "Customers can only cancel their own shipments before pickup"
                )

        now = utcnow()
        try:
            parcel.status = payload.status
            parcel.updated_at = now
            if payload.status == ParcelStatus.DELIVERED:
                parcel.delivered_at = now
            self.db.add(parcel)
            self.tracking.add(
                TrackingLog(
                    tracking_number=parcel.tracking_number,
                    status=payload.status,
                    location=payload.location.strip(),
                    remarks=payload.remarks.strip() if payload.remarks else None,
                    created_by=actor.user_id,
                    updated_at=now,
                )
            )
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        self.db.refresh(parcel)
        logger.info(
            "Parcel %s moved %s by user %s", tracking_number, payload.status.value, actor.user_id
        )
        return parcel

    def delete(self, tracking_number: str) -> None:
        parcel = self.parcels.get(tracking_number)
        if parcel is None:
            raise NotFoundError("Parcel not found")
        self.parcels.delete(parcel)
        self.db.commit()
