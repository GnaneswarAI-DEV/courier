from __future__ import annotations

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import UserRole

PHONE_RE = re.compile(r"^[0-9+\-\s()]{7,20}$")
PASSWORD_MIN = 8


def validate_password_strength(value: str) -> str:
    if len(value) < PASSWORD_MIN:
        raise ValueError(f"Password must be at least {PASSWORD_MIN} characters")
    if value.isdigit() or value.isalpha():
        raise ValueError("Password must contain both letters and numbers")
    return value


class UserBrief(BaseModel):
    """Minimal public representation embedded in parcel payloads."""

    model_config = ConfigDict(from_attributes=True)

    user_id: int
    name: str
    role: UserRole


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    name: str
    email: EmailStr
    phone: str | None = None
    role: UserRole
    is_active: bool
    created_at: datetime


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = None
    password: str

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("phone")
    @classmethod
    def _check_phone(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        value = value.strip()
        if not PHONE_RE.match(value):
            raise ValueError("Phone number format is invalid")
        return value

    @field_validator("password")
    @classmethod
    def _check_password(cls, value: str) -> str:
        return validate_password_strength(value)


class UserAdminCreate(UserCreate):
    role: UserRole = UserRole.CUSTOMER


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
