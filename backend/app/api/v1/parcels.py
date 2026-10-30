from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query, status

from app.dependencies.auth import AdminUser, CurrentUser, DbSession
from app.models.enums import ParcelStatus
from app.schemas.common import Message, Page
from app.schemas.parcel import (
    AssignDriver,
    ParcelCreate,
    ParcelDetail,
    ParcelOut,
    ParcelUpdate,
    StatusUpdate,
)
from app.services.parcels import ParcelService

router = APIRouter(prefix="/parcels", tags=["Parcels"])


@router.post(
    "",
    response_model=ParcelDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Book a new shipment",
)
def create_parcel(payload: ParcelCreate, user: CurrentUser, db: DbSession) -> ParcelDetail:
    parcel = ParcelService(db).create(payload, user)
    return ParcelDetail.model_validate(parcel)


@router.get("", response_model=Page[ParcelOut], summary="List shipments visible to you")
def list_parcels(
    user: CurrentUser,
    db: DbSession,
    parcel_status: Annotated[ParcelStatus | None, Query(alias="status")] = None,
    q: Annotated[str | None, Query(min_length=1, max_length=80)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 10,
) -> Page[ParcelOut]:
    items, total = ParcelService(db).list_for(
        user, status=parcel_status, query=q, page=page, page_size=page_size
    )
    return Page[ParcelOut](
        items=[ParcelOut.model_validate(parcel) for parcel in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{tracking_number}", response_model=ParcelDetail, summary="Shipment detail")
def get_parcel(tracking_number: str, user: CurrentUser, db: DbSession) -> ParcelDetail:
    return ParcelDetail.model_validate(ParcelService(db).get_for(tracking_number, user))


@router.patch("/{tracking_number}", response_model=ParcelOut, summary="Edit shipment details")
def update_parcel(
    tracking_number: str, payload: ParcelUpdate, user: CurrentUser, db: DbSession
) -> ParcelOut:
    return ParcelOut.model_validate(ParcelService(db).update(tracking_number, payload, user))


@router.post(
    "/{tracking_number}/assign",
    response_model=ParcelDetail,
    summary="Assign a driver (admin only)",
)
def assign_driver(
    tracking_number: str, payload: AssignDriver, _: AdminUser, db: DbSession
) -> ParcelDetail:
    return ParcelDetail.model_validate(
        ParcelService(db).assign_driver(tracking_number, payload.driver_id)
    )


@router.post(
    "/{tracking_number}/status",
    response_model=ParcelDetail,
    summary="Advance the shipment status and append a tracking event",
)
def update_status(
    tracking_number: str, payload: StatusUpdate, user: CurrentUser, db: DbSession
) -> ParcelDetail:
    return ParcelDetail.model_validate(
        ParcelService(db).change_status(tracking_number, payload, user)
    )


@router.delete(
    "/{tracking_number}",
    response_model=Message,
    summary="Delete a shipment and its history (admin only)",
)
def delete_parcel(tracking_number: str, _: AdminUser, db: DbSession) -> Message:
    ParcelService(db).delete(tracking_number)
    return Message(detail="Shipment deleted")
