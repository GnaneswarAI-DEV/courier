from __future__ import annotations

from fastapi import APIRouter

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.dashboard import DashboardSummary
from app.services.dashboard import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary, summary="Role-scoped metrics")
def summary(user: CurrentUser, db: DbSession) -> DashboardSummary:
    return DashboardService(db).summary(user)
