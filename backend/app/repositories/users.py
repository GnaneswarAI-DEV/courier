from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(func.lower(User.email) == email.lower().strip()))

    def list(
        self,
        *,
        role: UserRole | None = None,
        query: str | None = None,
        active_only: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[User], int]:
        stmt = select(User)
        count_stmt = select(func.count()).select_from(User)

        filters = []
        if role is not None:
            filters.append(User.role == role)
        if active_only:
            filters.append(User.is_active.is_(True))
        if query:
            like = f"%{query.strip()}%"
            filters.append(
                or_(User.name.ilike(like), User.email.ilike(like), User.phone.ilike(like))
            )

        if filters:
            stmt = stmt.where(*filters)
            count_stmt = count_stmt.where(*filters)

        total = int(self.db.scalar(count_stmt) or 0)
        stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        return list(self.db.scalars(stmt).all()), total

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)

    def email_taken(self, email: str, exclude_user_id: int | None = None) -> bool:
        stmt = (
            select(func.count())
            .select_from(User)
            .where(func.lower(User.email) == email.lower().strip())
        )
        if exclude_user_id is not None:
            stmt = stmt.where(User.user_id != exclude_user_id)
        return bool(self.db.scalar(stmt))

    def count_active_drivers(self) -> int:
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(User)
                .where(User.role == UserRole.DRIVER, User.is_active.is_(True))
            )
            or 0
        )
