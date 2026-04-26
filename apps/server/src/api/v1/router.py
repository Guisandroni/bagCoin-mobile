from fastapi import APIRouter
from .health import router as health_router
from .users import router as users_router
from .webhooks import router as webhooks_router

router = APIRouter(prefix="/api/v1")
router.include_router(health_router)
router.include_router(users_router)
router.include_router(webhooks_router)
