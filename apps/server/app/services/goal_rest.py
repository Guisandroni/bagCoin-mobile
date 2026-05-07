"""REST service for Goal operations (web frontend, async)."""

from datetime import date
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories import goal as goal_repo
from app.schemas.goal import GoalCreate, GoalUpdate


async def list_goals(
    db: AsyncSession,
    user_uuid: UUID,
    status: str | None = None,
) -> list[dict[str, Any]]:
    """List goals for a user."""
    goals = await goal_repo.get_goals_by_user(db, user_uuid=user_uuid, status=status)
    result = []
    for g in goals:
        result.append(
            {
                "id": g.id,
                "title": g.title,
                "target_amount": g.target_amount,
                "current_amount": g.current_amount,
                "deadline": g.deadline.isoformat() if g.deadline else None,
                "percentage": round((g.current_amount / g.target_amount) * 100, 1)
                if g.target_amount > 0
                else 0,
                "status": g.status if hasattr(g.status, "value") else str(g.status),
                "created_at": g.created_at,
                "updated_at": g.updated_at,
            }
        )
    return result


async def create_goal(
    db: AsyncSession,
    user_uuid: UUID,
    data: GoalCreate,
) -> dict[str, Any]:
    """Create a new goal for the authenticated user."""
    goal = await goal_repo.create_goal(
        db,
        user_uuid=user_uuid,
        title=data.title,
        target_amount=data.target_amount,
        current_amount=data.current_amount,
        deadline=data.deadline,
        status=data.status.value if hasattr(data.status, "value") else str(data.status),
    )
    return {
        "id": goal.id,
        "title": goal.title,
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "deadline": goal.deadline.isoformat() if goal.deadline else None,
        "percentage": round((goal.current_amount / goal.target_amount) * 100, 1)
        if goal.target_amount > 0
        else 0,
        "status": goal.status if hasattr(goal.status, "value") else str(goal.status),
        "created_at": goal.created_at,
        "updated_at": goal.updated_at,
    }


async def get_goal(db: AsyncSession, goal_id: int, user_uuid: UUID) -> dict[str, Any]:
    """Get a goal by ID."""
    goal = await goal_repo.get_goal_by_id(db, goal_id)
    if not goal or str(goal.user_uuid) != str(user_uuid):
        raise NotFoundError(message="Goal not found", details={"id": goal_id})
    return {
        "id": goal.id,
        "title": goal.title,
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "deadline": goal.deadline.isoformat() if goal.deadline else None,
        "percentage": round((goal.current_amount / goal.target_amount) * 100, 1)
        if goal.target_amount > 0
        else 0,
        "status": goal.status if hasattr(goal.status, "value") else str(goal.status),
        "created_at": goal.created_at,
        "updated_at": goal.updated_at,
    }


async def update_goal(
    db: AsyncSession,
    goal_id: int,
    user_uuid: UUID,
    data: GoalUpdate,
) -> dict[str, Any]:
    """Update a goal."""
    goal = await goal_repo.get_goal_by_id(db, goal_id)
    if not goal or str(goal.user_uuid) != str(user_uuid):
        raise NotFoundError(message="Goal not found", details={"id": goal_id})
    update_data = data.model_dump(exclude_unset=True)
    await goal_repo.update_goal(db, db_goal=goal, update_data=update_data)
    return await get_goal(db, goal_id, user_uuid)


async def delete_goal(db: AsyncSession, goal_id: int, user_uuid: UUID) -> None:
    """Delete a goal."""
    goal = await goal_repo.get_goal_by_id(db, goal_id)
    if not goal or str(goal.user_uuid) != str(user_uuid):
        raise NotFoundError(message="Goal not found", details={"id": goal_id})
    await goal_repo.delete_goal(db, goal_id)


async def get_goal_alerts(
    db: AsyncSession,
    user_uuid: UUID,
) -> list[dict[str, Any]]:
    """Get goal alerts (completed or close to deadline)."""
    alerts = []
    goals = await list_goals(db, user_uuid)
    today = date.today()
    for goal in goals:
        if goal["percentage"] >= 100:
            alerts.append(
                {
                    "type": "goal_completed",
                    "severity": "info",
                    "goal_title": goal["title"],
                    "message": (
                        f"Parabéns! Meta '{goal['title']}' atingida! "
                        f"R$ {goal['current_amount']:,.2f} de R$ {goal['target_amount']:,.2f}"
                    ),
                }
            )
        elif goal.get("deadline"):
            deadline = date.fromisoformat(goal["deadline"][:10])
            days_left = (deadline - today).days
            if 0 < days_left <= 7 and goal["percentage"] < 100:
                alerts.append(
                    {
                        "type": "goal_deadline",
                        "severity": "medium",
                        "goal_title": goal["title"],
                        "message": (
                            f"Meta '{goal['title']}' vence em {days_left} dias. "
                            f"Progresso: {goal['percentage']}% "
                            f"(R$ {goal['current_amount']:,.2f} de R$ {goal['target_amount']:,.2f})"
                        ),
                    }
                )
    return alerts
