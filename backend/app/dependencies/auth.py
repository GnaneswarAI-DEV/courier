"""Authentication / authorization dependencies."""

from __future__ import annotations

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import TokenError, decode_access_token
from app.db.session import get_db
from app.exceptions.errors import AuthenticationError, PermissionDeniedError
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.users import UserRepository

bearer_scheme = HTTPBearer(auto_error=False, description="JWT access token")

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)] = None,
) -> User:
    if credentials is None or not credentials.credentials:
        raise AuthenticationError("Authentication credentials were not provided")

    try:
        payload = decode_access_token(credentials.credentials)
    except TokenError as exc:
        raise AuthenticationError(str(exc)) from exc

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id.isdigit():
        raise AuthenticationError("Invalid authentication token")

    user = UserRepository(db).get(int(user_id))
    if user is None:
        raise AuthenticationError("Account no longer exists")
    if not user.is_active:
        raise AuthenticationError("Account is disabled")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: UserRole) -> Callable[[User], User]:
    allowed = set(roles)

    def dependency(user: CurrentUser) -> User:
        if user.role not in allowed:
            raise PermissionDeniedError("You do not have permission to perform this action")
        return user

    return dependency


AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]
