"""Goal repository (PostgreSQL async).

Handles financial savings goals for BagCoin users.
"""

from datetime import date, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.enums import GoalStatus
from app.db.models.goal import Goal


async def get_by_id(db: AsyncSession, goal_id: int) -> Goal | None:
    """Get goal by ID."""
    return await db.get(Goal, goal_id)


async def get_multi_by_user(
    db: AsyncSession,
    user_id: int,
    status: str | None = None,
) -> list[Goal]:
    """Get goals for a user, optionally filtered by status."""
    query = select(Goal).where(Goal.user_id == user_id)
    if status:
        query = query.where(Goal.status == status)
    query = query.order_by(Goal.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    *,
    user_id: int,
    title: str,
    target_amount: float,
    current_amount: float = 0.0,
    deadline: date | None = None,
    status: str | None = None,
) -> Goal:
    """Create a new goal."""
    goal = Goal(
        user_id=user_id,
        title=title,
        target_amount=target_amount,
        current_amount=current_amount,
        deadline=deadline,
        status=status or GoalStatus.ACTIVE.value,
    )
    db.add(goal)
    await db.flush()
    await db.refresh(goal)
    return goal


async def update(
    db: AsyncSession,
    *,
    db_goal: Goal,
    update_data: dict[str, Any],
) -> Goal:
    """Update a goal."""
    for field, value in update_data.items():
        setattr(db_goal, field, value)
    db.add(db_goal)
    await db.flush()
    await db.refresh(db_goal)
    return db_goal


async def update_progress(
    db: AsyncSession,
    goal_id: int,
    user_id: int,
    amount: float,
) -> Goal | None:
    """Add progress to a goal. Returns None if not found."""
    goal = await db.get(Goal, goal_id)
    if not goal or goal.user_id != user_id:
        return None

    goal.current_amount = min(goal.current_amount + amount, goal.target_amount)
    if goal.current_amount >= goal.target_amount:
        goal.status = GoalStatus.COMPLETED.value

    await db.flush()
    await db.refresh(goal)
    return goal


async def delete(db: AsyncSession, goal_id: int) -> Goal | None:
    """Delete a goal by ID."""
    goal = await get_by_id(db, goal_id)
    if goal:
        await db.delete(goal)
        await db.flush()
    return goal


# =====================================================================
# Aliases for REST service compatibility
# =====================================================================


async def get_goal_by_id(db: AsyncSession, goal_id: int) -> Goal | None:
    """Alias for get_by_id - used by REST endpoints."""
    return await get_by_id(db, goal_id)


async def get_goals_by_user(
    db: AsyncSession,
    user_uuid: UUID | None = None,
    *,
    skip: int = 0,
    limit: int = 50,
    status: str | None = None,
) -> list[Goal]:
    """Get goals for a user, supports both user_id (int) and user_uuid (UUID).

    Used by REST endpoints that pass user_uuid.
    """
    from sqlalchemy import or_

    query = select(Goal)
    if user_uuid is not None:
        query = query.where(Goal.user_uuid == user_uuid)
    if status:
        query = query.where(Goal.status == status)
    query = query.order_by(Goal.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def count_goals(
    db: AsyncSession,
    user_uuid: UUID | None = None,
) -> int:
    """Count goals for a user."""
    from sqlalchemy import func

    query = select(func.count(Goal.id))
    if user_uuid:
        query = query.where(Goal.user_uuid == user_uuid)
    result = await db.execute(query)
    return result.scalar() or 0


async def create_goal(
    db: AsyncSession,
    *,
    user_id: int | None = None,
    user_uuid: UUID | None = None,
    title: str,
    target_amount: float,
    current_amount: float = 0.0,
    deadline: datetime | None = None,
    status: str | None = None,
) -> Goal:
    """Create a new goal (supports both user_id and user_uuid)."""
    from datetime import date, datetime

    goal = Goal(
        user_id=user_id,
        user_uuid=user_uuid,
        title=title,
        target_amount=target_amount,
        current_amount=current_amount,
        deadline=deadline,
        status=status or GoalStatus.ACTIVE.value,
    )
    db.add(goal)
    await db.flush()
    await db.refresh(goal)
    return goal


async def update_goal(
    db: AsyncSession,
    *,
    db_goal: Goal,
    update_data: dict[str, Any],
) -> Goal:
    """Alias for update - used by REST endpoints."""
    return await update(db, db_goal=db_goal, update_data=update_data)


async def delete_goal(db: AsyncSession, goal_id: int) -> Goal | None:
    """Alias for delete - used by REST endpoints."""
    return await delete(db, goal_id)
