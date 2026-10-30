from __future__ import annotations

import pytest

from app.core.security import (
    TokenError,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.enums import ParcelStatus, can_transition
from app.utils.address import city_of


def test_password_hash_is_salted_and_verifiable() -> None:
    first = hash_password("Password123")
    second = hash_password("Password123")
    assert first != second, "Argon2 hashes must use a random salt"
    assert first.startswith("$argon2id$")
    assert verify_password("Password123", first)
    assert not verify_password("Password124", first)


def test_verify_password_handles_malformed_hash() -> None:
    assert verify_password("anything", "not-a-valid-hash") is False


def test_access_token_round_trip() -> None:
    token = create_access_token(subject=42, role="admin")
    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"


def test_expired_token_is_rejected() -> None:
    token = create_access_token(subject=1, role="customer", expires_minutes=-1)
    with pytest.raises(TokenError):
        decode_access_token(token)


def test_tampered_token_is_rejected() -> None:
    token = create_access_token(subject=1, role="customer")
    with pytest.raises(TokenError):
        decode_access_token(token[:-3] + "abc")


@pytest.mark.parametrize(
    ("current", "target", "allowed"),
    [
        (ParcelStatus.CREATED, ParcelStatus.PICKED_UP, True),
        (ParcelStatus.CREATED, ParcelStatus.DELIVERED, False),
        (ParcelStatus.PICKED_UP, ParcelStatus.IN_TRANSIT, True),
        (ParcelStatus.IN_TRANSIT, ParcelStatus.OUT_FOR_DELIVERY, True),
        (ParcelStatus.OUT_FOR_DELIVERY, ParcelStatus.DELIVERED, True),
        (ParcelStatus.OUT_FOR_DELIVERY, ParcelStatus.CANCELLED, False),
        (ParcelStatus.DELIVERED, ParcelStatus.IN_TRANSIT, False),
        (ParcelStatus.CANCELLED, ParcelStatus.CREATED, False),
        (ParcelStatus.FAILED, ParcelStatus.IN_TRANSIT, True),
    ],
)
def test_status_state_machine(current: ParcelStatus, target: ParcelStatus, allowed: bool) -> None:
    assert can_transition(current, target) is allowed


@pytest.mark.parametrize(
    ("address", "city"),
    [
        ("12 MG Road, Bengaluru, Karnataka 560001", "Bengaluru"),
        ("12 MG Road, Bengaluru", "Bengaluru"),
        ("Remote Village", "Remote Village"),
    ],
)
def test_city_extraction(address: str, city: str) -> None:
    assert city_of(address) == city
