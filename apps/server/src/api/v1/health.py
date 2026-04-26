from typing import Annotated
from fastapi import APIRouter, Request
from pydantic import BaseModel
from slowapi.util import get_remote_address
from ...core.database import engine
from ...core.metrics import metrics_response
from ...config import settings
import redis as redis_lib
import httpx

router = APIRouter(tags=["system"])


class HealthCheckResponse(BaseModel):
    server: str
    database: str
    redis: str
    whatsapp_bridge: str


@router.get("/health", response_model=HealthCheckResponse)
async def health_check(request: Request):
    checks = {
        "server": "ok",
        "database": "unknown",
        "redis": "unknown",
        "whatsapp_bridge": "unknown",
    }

    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {e!s}"

    try:
        r = redis_lib.from_url(settings.REDIS_URL, socket_timeout=2)
        r.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {e!s}"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.WHATSAPP_BRIDGE_URL}/health",
                timeout=5.0,
            )
            checks["whatsapp_bridge"] = (
                "ok" if resp.status_code == 200 else f"error: status {resp.status_code}"
            )
    except Exception as e:
        checks["whatsapp_bridge"] = f"error: {e!s}"

    return HealthCheckResponse(**checks)


@router.get("/metrics")
async def metrics_endpoint():
    data, content_type = metrics_response()
    return data
