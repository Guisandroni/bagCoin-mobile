from fastapi import APIRouter
from .health import router as health_router
from .users import router as users_router
from .auth import router as auth_router
from .transactions import router as transactions_router
from .budgets import router as budgets_router
from .funds import router as funds_router
from .subscriptions import router as subscriptions_router
from .reminders import router as reminders_router
from .categories import router as categories_router
from .webhooks import router as webhooks_router

router = APIRouter(prefix="/api/v1")
router.include_router(health_router)
router.include_router(users_router)
router.include_router(auth_router)
router.include_router(transactions_router)
router.include_router(budgets_router)
router.include_router(funds_router)
router.include_router(subscriptions_router)
router.include_router(reminders_router)
router.include_router(categories_router)
router.include_router(webhooks_router)
