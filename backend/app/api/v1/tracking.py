from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Path

from app.dependencies.auth import DbSession
from app.schemas.parcel import PublicTrackingParcel
from app.services.parcels import ParcelService

router = APIRouter(prefix="/tracking", tags=["Public tracking"])

TrackingNumber = Annotated[str, Path(min_length=5, max_length=24, pattern=r"^[A-Za-z0-9-]+$")]


@router.get(
    "/{tracking_number}",
    response_model=PublicTrackingParcel,
    summary="Public shipment tracking (no account required)",
    responses={404: {"description": "No shipment with that tracking number"}},
)
def track_public(tracking_number: TrackingNumber, db: DbSession) -> PublicTrackingParcel:
    return ParcelService(db).public_tracking(tracking_number)
