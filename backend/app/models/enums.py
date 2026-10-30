"""Domain enumerations shared by models, schemas and services."""

from __future__ import annotations

from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "admin"
    DRIVER = "driver"
    CUSTOMER = "customer"


class ParcelStatus(StrEnum):
    CREATED = "CREATED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


#: Allowed transitions. A shipment can only move along these edges, which is
#: validated server-side before any row is written.
STATUS_TRANSITIONS: dict[ParcelStatus, frozenset[ParcelStatus]] = {
    ParcelStatus.CREATED: frozenset({ParcelStatus.PICKED_UP, ParcelStatus.CANCELLED}),
    ParcelStatus.PICKED_UP: frozenset({ParcelStatus.IN_TRANSIT, ParcelStatus.CANCELLED}),
    ParcelStatus.IN_TRANSIT: frozenset({ParcelStatus.OUT_FOR_DELIVERY, ParcelStatus.FAILED}),
    ParcelStatus.OUT_FOR_DELIVERY: frozenset({ParcelStatus.DELIVERED, ParcelStatus.FAILED}),
    ParcelStatus.FAILED: frozenset({ParcelStatus.IN_TRANSIT, ParcelStatus.CANCELLED}),
    ParcelStatus.DELIVERED: frozenset(),
    ParcelStatus.CANCELLED: frozenset(),
}

TERMINAL_STATUSES = frozenset({ParcelStatus.DELIVERED, ParcelStatus.CANCELLED})
ACTIVE_STATUSES = frozenset(
    {
        ParcelStatus.CREATED,
        ParcelStatus.PICKED_UP,
        ParcelStatus.IN_TRANSIT,
        ParcelStatus.OUT_FOR_DELIVERY,
        ParcelStatus.FAILED,
    }
)


def can_transition(current: ParcelStatus, target: ParcelStatus) -> bool:
    return target in STATUS_TRANSITIONS.get(current, frozenset())
