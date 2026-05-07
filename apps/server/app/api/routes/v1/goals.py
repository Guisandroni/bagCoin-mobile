"""Goal REST endpoints for web frontend."""

from typing import Any

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser, DBSession
from app.schemas.goal import GoalCreate, GoalUpdate
from app.services import goal_rest as goal_service

router = APIRouter(prefix="/bagcoin/goals", tags=["bagcoin"])


@router.get("")
async def list_goals(
    current_user: CurrentUser,
    db: DBSession,
    status: str | None = Query(None, description="Filter by status (active, completed, cancelled)"),
) -> Any:
    """List goals for the authenticated user."""
    return await goal_service.list_goals(db, current_user.id, status=status)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_goal(
    current_user: CurrentUser,
    db: DBSession,
    body: GoalCreate,
) -> Any:
    """Create a new financial goal."""
    try:
        return await goal_service.create_goal(db, current_user.id, body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/alerts")
async def get_goal_alerts(
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """Get goal alerts (completed or close to deadline)."""
    try:
        return await goal_service.get_goal_alerts(db, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{goal_id}")
async def get_goal(
    goal_id: int,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """Get a specific goal."""
    return await goal_service.get_goal(db, goal_id, current_user.id)


@router.patch("/{goal_id}")
async def update_goal(
    goal_id: int,
    current_user: CurrentUser,
    db: DBSession,
    body: GoalUpdate,
) -> Any:
    """Update a goal."""
    return await goal_service.update_goal(db, goal_id, current_user.id, body)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    """Delete a goal."""
    await goal_service.delete_goal(db, goal_id, current_user.id)
