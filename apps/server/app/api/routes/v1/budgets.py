"""Budget REST endpoints for web frontend."""

from typing import Any

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DBSession
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.services import budget_rest as budget_service

router = APIRouter(prefix="/bagcoin/budgets", tags=["bagcoin"])


@router.get("")
async def list_budgets(
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """List budgets for the authenticated user with progress."""
    return await budget_service.list_budgets(db, current_user.id)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_budget(
    current_user: CurrentUser,
    db: DBSession,
    body: BudgetCreate,
) -> Any:
    """Create a new budget."""
    try:
        return await budget_service.create_budget(db, current_user.id, body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/alerts")
async def get_budget_alerts(
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """Get budget alerts (near or over limit)."""
    try:
        return await budget_service.get_budget_alerts(db, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{budget_id}")
async def get_budget(
    budget_id: int,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """Get a specific budget with progress."""
    return await budget_service.get_budget(db, budget_id, current_user.id)


@router.patch("/{budget_id}")
async def update_budget(
    budget_id: int,
    current_user: CurrentUser,
    db: DBSession,
    body: BudgetUpdate,
) -> Any:
    """Update a budget."""
    return await budget_service.update_budget(db, budget_id, current_user.id, body)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    """Delete a budget."""
    await budget_service.delete_budget(db, budget_id, current_user.id)
