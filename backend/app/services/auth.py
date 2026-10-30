from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import create_access_token, hash_password, verify_password
from app.exceptions.errors import AuthenticationError, ConflictError, PermissionDeniedError
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.users import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.user import validate_password_strength

logger = get_logger(__name__)


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def register(self, payload: RegisterRequest) -> User:
        email = payload.email.lower().strip()
        if self.users.email_taken(email):
            raise ConflictError("An account with this email already exists")

        user = User(
            name=payload.name.strip(),
            email=email,
            phone=payload.phone,
            password_hash=hash_password(payload.password),
            role=UserRole.CUSTOMER,
            is_active=True,
        )
        self.users.create(user)
        self.db.commit()
        self.db.refresh(user)
        logger.info("Registered new customer %s", user.user_id)
        return user

    def authenticate(self, payload: LoginRequest) -> tuple[User, str, int]:
        user = self.users.get_by_email(payload.email)
        # Constant-ish behaviour: always run a hash verification to reduce timing leaks.
        if user is None:
            verify_password(payload.password, "$argon2id$v=19$m=65536,t=3,p=4$invalid$invalid")
            raise AuthenticationError("Invalid email or password")
        if not verify_password(payload.password, user.password_hash):
            raise AuthenticationError("Invalid email or password")
        if not user.is_active:
            raise AuthenticationError("This account has been disabled")

        token = create_access_token(subject=user.user_id, role=user.role.value)
        return user, token, settings.access_token_expire_minutes * 60

    def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.password_hash):
            raise PermissionDeniedError("Current password is incorrect")
        validate_password_strength(new_password)
        if current_password == new_password:
            raise ConflictError("New password must differ from the current password")
        user.password_hash = hash_password(new_password)
        self.db.add(user)
        self.db.commit()

    def ensure_bootstrap_admin(self) -> None:
        """Create the configured first administrator once, if it does not exist."""
        email = (settings.bootstrap_admin_email or "").strip().lower()
        password = settings.bootstrap_admin_password or ""
        if not email or not password:
            return
        existing = self.users.get_by_email(email)
        if existing is not None:
            if existing.role != UserRole.ADMIN:
                existing.role = UserRole.ADMIN
                self.db.add(existing)
                self.db.commit()
            return
        admin = User(
            name=settings.bootstrap_admin_name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )
        self.users.create(admin)
        self.db.commit()
        logger.info("Bootstrapped administrator account %s", email)
