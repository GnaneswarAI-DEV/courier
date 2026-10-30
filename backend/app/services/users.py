from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.exceptions.errors import BusinessRuleError, ConflictError, NotFoundError
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.parcels import ParcelRepository
from app.repositories.users import UserRepository
from app.schemas.user import UserAdminCreate, UserUpdate


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.parcels = ParcelRepository(db)

    def get(self, user_id: int) -> User:
        user = self.users.get(user_id)
        if user is None:
            raise NotFoundError("User not found")
        return user

    def list(
        self,
        *,
        role: UserRole | None,
        query: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[User], int]:
        return self.users.list(role=role, query=query, page=page, page_size=page_size)

    def drivers(self) -> list[User]:
        users, _ = self.users.list(role=UserRole.DRIVER, active_only=True, page=1, page_size=100)
        return users

    def create(self, payload: UserAdminCreate) -> User:
        email = payload.email.lower().strip()
        if self.users.email_taken(email):
            raise ConflictError("An account with this email already exists")
        user = User(
            name=payload.name.strip(),
            email=email,
            phone=payload.phone,
            password_hash=hash_password(payload.password),
            role=payload.role,
            is_active=True,
        )
        self.users.create(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user_id: int, payload: UserUpdate, actor: User) -> User:
        user = self.get(user_id)
        data = payload.model_dump(exclude_unset=True)

        if user_id == actor.user_id and data.get("role") not in (None, actor.role):
            raise BusinessRuleError("You cannot change your own role")
        if user_id == actor.user_id and data.get("is_active") is False:
            raise BusinessRuleError("You cannot deactivate your own account")
        new_role = data.get("role")
        if (
            new_role is not None
            and user.role == UserRole.ADMIN
            and new_role != UserRole.ADMIN
            and self._admin_count() <= 1
        ):
            raise BusinessRuleError("At least one administrator account must remain")

        for field, value in data.items():
            if value is not None:
                setattr(user, field, value)
        if data.get("phone") is None and "phone" in data:
            user.phone = None

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def deactivate(self, user_id: int, actor: User) -> User:
        if user_id == actor.user_id:
            raise BusinessRuleError("You cannot deactivate your own account")
        user = self.get(user_id)
        if user.role == UserRole.ADMIN and self._admin_count() <= 1:
            raise BusinessRuleError("At least one administrator account must remain")
        user.is_active = False
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user_id: int, actor: User) -> None:
        if user_id == actor.user_id:
            raise BusinessRuleError("You cannot delete your own account")
        user = self.get(user_id)
        if user.role == UserRole.ADMIN and self._admin_count() <= 1:
            raise BusinessRuleError("At least one administrator account must remain")
        if self.parcels.has_parcels_for_user(user_id):
            raise ConflictError(
                "This user is referenced by existing parcels; deactivate the account instead"
            )
        self.users.delete(user)
        self.db.commit()

    def _admin_count(self) -> int:
        return int(
            self.db.scalar(
                select(func.count()).select_from(User).where(User.role == UserRole.ADMIN)
            )
            or 0
        )
