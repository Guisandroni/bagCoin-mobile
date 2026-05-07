"""Report repository (PostgreSQL async).

Contains database operations for Report entities.
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.report import Report


async def get_report_by_id(db: AsyncSession, report_id: int) -> Report | None:
    """Get report by ID."""
    return await db.get(Report, report_id)


async def get_reports_by_user(
    db: AsyncSession,
    user_uuid: UUID | None = None,
    *,
    skip: int = 0,
    limit: int = 50,
) -> list[Report]:
    """Get reports for a user with pagination."""
    query = select(Report)
    if user_uuid:
        query = query.where(Report.user_uuid == user_uuid)
    query = query.order_by(Report.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def count_reports(
    db: AsyncSession,
    user_uuid: UUID | None = None,
) -> int:
    """Count reports for a user."""
    query = select(func.count(Report.id))
    if user_uuid:
        query = query.where(Report.user_uuid == user_uuid)
    result = await db.execute(query)
    return result.scalar() or 0


async def create_report(
    db: AsyncSession,
    *,
    user_id: int | None = None,
    user_uuid: UUID | None = None,
    period_start,
    period_end,
    file_url: str | None = None,
) -> Report:
    """Create a new report."""
    report = Report(
        user_id=user_id,
        user_uuid=user_uuid,
        period_start=period_start,
        period_end=period_end,
        file_url=file_url,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


async def delete_report(db: AsyncSession, report_id: int) -> bool:
    """Delete a report by ID."""
    report = await get_report_by_id(db, report_id)
    if report:
        await db.delete(report)
        await db.flush()
        return True
    return False
