from __future__ import annotations

from fastapi import APIRouter, status

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.auth import LoginRequest, PasswordChange, RegisterRequest, TokenResponse
from app.schemas.common import Message
from app.schemas.user import UserOut
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a customer account",
)
def register(payload: RegisterRequest, db: DbSession) -> TokenResponse:
    service = AuthService(db)
    user = service.register(payload)
    _, token, expires_in = service.authenticate(
        LoginRequest(email=payload.email, password=payload.password)
    )
    return TokenResponse(
        access_token=token, expires_in=expires_in, user=UserOut.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse, summary="Exchange credentials for a JWT")
def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    service = AuthService(db)
    user, token, expires_in = service.authenticate(payload)
    return TokenResponse(
        access_token=token, expires_in=expires_in, user=UserOut.model_validate(user)
    )


@router.get("/me", response_model=UserOut, summary="Current authenticated profile")
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)


@router.post("/change-password", response_model=Message, summary="Change your password")
def change_password(payload: PasswordChange, user: CurrentUser, db: DbSession) -> Message:
    AuthService(db).change_password(user, payload.current_password, payload.new_password)
    return Message(detail="Password updated successfully")
