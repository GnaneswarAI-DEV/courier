"""Password hashing and JWT helpers.

Passwords use Argon2id via ``pwdlib`` (the maintained successor of passlib).
Tokens are signed HS256 JWTs carrying the user id, role and a token type so an
access token can never be replayed where a refresh-style token is expected.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any, Literal

import jwt
from pwdlib import PasswordHash

from app.core.config import settings
from app.utils.time import utcnow

_password_hash = PasswordHash.recommended()

TokenType = Literal["access"]
_ISSUER = "courier-parcel-tracking"


class TokenError(Exception):
    """Raised when a JWT is malformed, expired or signed with the wrong key."""


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hash.verify(password, password_hash)
    except Exception:  # malformed hash must not crash the request
        return False


def needs_rehash(password_hash: str) -> bool:
    try:
        return _password_hash.verify_and_update("x", password_hash)[1] is not None
    except Exception:
        return False


def create_access_token(
    *, subject: str | int, role: str, expires_minutes: int | None = None
) -> str:
    expire = utcnow() + timedelta(minutes=expires_minutes or settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "type": "access",
        "iss": _ISSUER,
        "iat": int(utcnow().timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
            issuer=_ISSUER,
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise TokenError("Token has expired") from exc
    except jwt.InvalidTokenError as exc:
        raise TokenError("Invalid authentication token") from exc

    if payload.get("type") != "access":
        raise TokenError("Invalid token type")
    return payload
