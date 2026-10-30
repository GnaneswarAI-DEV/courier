"""Small in-process rate limiter for abuse-prone anonymous endpoints.

This is a fixed-window limiter scoped to a single worker process. For a
multi-instance deployment put a shared limiter (Redis, API gateway rule) in
front of the API; the per-process guard still absorbs casual scraping.
"""

from __future__ import annotations

import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

PROTECTED_PREFIXES = ("/api/v1/tracking/", "/api/v1/auth/login", "/api/v1/auth/register")


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *, limit_per_minute: int = 60, window_seconds: int = 60) -> None:
        super().__init__(app)
        self.limit = limit_per_minute
        self.window = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def _client_key(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For", "")
        ip = (
            forwarded.split(",")[0].strip()
            if forwarded
            else (request.client.host if request.client else "unknown")
        )
        bucket = "tracking" if request.url.path.startswith("/api/v1/tracking/") else "auth"
        return f"{bucket}:{ip}"

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        if request.method == "GET" and not any(path.startswith(p) for p in PROTECTED_PREFIXES):
            return await call_next(request)
        if not any(path.startswith(p) for p in PROTECTED_PREFIXES):
            return await call_next(request)

        now = time.monotonic()
        key = self._client_key(request)
        hits = [ts for ts in self._hits[key] if now - ts < self.window]
        if len(hits) >= self.limit:
            retry_after = int(self.window - (now - hits[0])) + 1
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "rate_limited",
                        "detail": "Too many requests. Please slow down and try again shortly.",
                    }
                },
                headers={"Retry-After": str(retry_after)},
            )
        hits.append(now)
        self._hits[key] = hits
        return await call_next(request)
