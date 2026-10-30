from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query, status

from app.dependencies.auth import AdminUser, DbSession
from app.models.enums import UserRole
from app.schemas.common import Message, Page
from app.schemas.parcel import DriverOption
from app.schemas.user import UserAdminCreate, UserOut, UserUpdate
from app.services.users import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=Page[UserOut], summary="List accounts (admin only)")
def list_users(
    _: AdminUser,
    db: DbSession,
    role: Annotated[UserRole | None, Query()] = None,
    q: Annotated[str | None, Query(min_length=1, max_length=80)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 20,
) -> Page[UserOut]:
    items, total = UserService(db).list(role=role, query=q, page=page, page_size=page_size)
    return Page[UserOut](
        items=[UserOut.model_validate(user) for user in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create an account with an explicit role (admin only)",
)
def create_user(payload: UserAdminCreate, _: AdminUser, db: DbSession) -> UserOut:
    return UserOut.model_validate(UserService(db).create(payload))


@router.get("/drivers", response_model=list[DriverOption], summary="Active drivers")
def list_drivers(_: AdminUser, db: DbSession) -> list[DriverOption]:
    return [DriverOption.model_validate(driver) for driver in UserService(db).drivers()]


@router.get("/{user_id}", response_model=UserOut, summary="Account detail (admin only)")
def get_user(user_id: int, _: AdminUser, db: DbSession) -> UserOut:
    return UserOut.model_validate(UserService(db).get(user_id))


@router.patch("/{user_id}", response_model=UserOut, summary="Update an account (admin only)")
def update_user(user_id: int, payload: UserUpdate, actor: AdminUser, db: DbSession) -> UserOut:
    return UserOut.model_validate(UserService(db).update(user_id, payload, actor))


@router.post("/{user_id}/deactivate", response_model=UserOut, summary="Disable sign-in")
def deactivate_user(user_id: int, actor: AdminUser, db: DbSession) -> UserOut:
    return UserOut.model_validate(UserService(db).deactivate(user_id, actor))


@router.delete("/{user_id}", response_model=Message, summary="Delete an unused account")
def delete_user(user_id: int, actor: AdminUser, db: DbSession) -> Message:
    UserService(db).delete(user_id, actor)
    return Message(detail="Account deleted")
