"""Time helpers.

Timestamps are stored as *naive UTC* datetimes so MySQL DATETIME, SQLite and
Python comparisons all agree. Never use datetime.utcnow() (deprecated).
"""

from __future__ import annotations

from datetime import UTC, date, datetime


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def today_utc() -> date:
    return utcnow().date()


def to_iso(value: datetime | date | None) -> str | None:
    if value is None:
        return None
    return value.isoformat()
