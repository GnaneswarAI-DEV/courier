from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.dependencies.auth import AdminUser, DbSession
from app.schemas.reports import ReportsOverview
from app.services.reports import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get(
    "/overview",
    response_model=ReportsOverview,
    summary="Throughput, routes and delivery metrics (admin only)",
)
def overview(
    user: AdminUser,
    db: DbSession,
    days: Annotated[int, Query(ge=7, le=90)] = 30,
) -> ReportsOverview:
    return ReportService(db).overview(user, days=days)
