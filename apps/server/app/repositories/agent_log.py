"""AgentLog repository (PostgreSQL async).

Audit trail for BagCoin agent invocations.
"""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.agent_log import AgentLog


async def get_by_id(db: AsyncSession, log_id: int) -> AgentLog | None:
    """Get agent log by ID."""
    return await db.get(AgentLog, log_id)


async def get_multi_by_user(
    db: AsyncSession,
    user_id: int,
    *,
    skip: int = 0,
    limit: int = 50,
) -> list[AgentLog]:
    """Get agent logs for a user, ordered by creation date desc."""
    result = await db.execute(
        select(AgentLog)
        .where(AgentLog.user_id == user_id)
        .order_by(AgentLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    *,
    user_id: int,
    agent_name: str,
    request_payload: dict | None = None,
    response_payload: dict | None = None,
    status: str = "success",
) -> AgentLog:
    """Create a new agent log entry."""
    log = AgentLog(
        user_id=user_id,
        agent_name=agent_name,
        request_payload=request_payload or {},
        response_payload=response_payload or {},
        status=status,
    )
    db.add(log)
    await db.flush()
    await db.refresh(log)
    return log


async def update(
    db: AsyncSession,
    *,
    db_log: AgentLog,
    update_data: dict[str, Any],
) -> AgentLog:
    """Update an agent log."""
    for field, value in update_data.items():
        setattr(db_log, field, value)
    db.add(db_log)
    await db.flush()
    await db.refresh(db_log)
    return db_log
