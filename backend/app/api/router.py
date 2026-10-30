from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, dashboard, parcels, reports, tracking, users

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(parcels.router)
api_router.include_router(tracking.router)
api_router.include_router(users.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
