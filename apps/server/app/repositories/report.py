"""Report repository (PostgreSQL async).

Handles generated financial reports for BagCoin users.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.report import Report


async def get_by_id(db: AsyncSession, report_id: int) -> Report | None:
    """Get report by ID."""
    return await db.get(Report, report_id)


async def get_multi_by_user(
    db: AsyncSession,
    user_id: int,
    *,
    skip: int = 0,
    limit: int = 20,
) -> list[Report]:
    """Get reports for a user, ordered by creation date desc."""
    result = await db.execute(
        select(Report)
        .where(Report.user_id == user_id)
        .order_by(Report.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    *,
    user_id: int,
    period_start: datetime,
    period_end: datetime,
    file_url: str | None = None,
) -> Report:
    """Create a new report record."""
    report = Report(
        user_id=user_id,
        period_start=period_start,
        period_end=period_end,
        file_url=file_url,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


async def update(
    db: AsyncSession,
    *,
    db_report: Report,
    update_data: dict[str, Any],
) -> Report:
    """Update a report."""
    for field, value in update_data.items():
        setattr(db_report, field, value)
    db.add(db_report)
    await db.flush()
    await db.refresh(db_report)
    return db_report


async def delete(db: AsyncSession, report_id: int) -> Report | None:
    """Delete a report by ID."""
    report = await get_by_id(db, report_id)
    if report:
        await db.delete(report)
        await db.flush()
    return report
