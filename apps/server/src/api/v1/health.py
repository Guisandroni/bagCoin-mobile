from fastapi import APIRouter, Request
from pydantic import BaseModel
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
def health_check(request: Request) -> HealthCheckResponse:
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
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(f"{settings.WHATSAPP_BRIDGE_URL}/health")
            checks["whatsapp_bridge"] = (
                "ok" if resp.status_code == 200 else f"error: status {resp.status_code}"
            )
    except Exception as e:
        checks["whatsapp_bridge"] = f"error: {e!s}"

    return HealthCheckResponse(**checks)


@router.get("/metrics", response_model=str)
def metrics_endpoint() -> str:
    data, content_type = metrics_response()
    return data
