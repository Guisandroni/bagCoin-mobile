"""REST service for Report operations (web frontend, async)."""

import logging
import os
from datetime import datetime, timedelta
from uuid import UUID

from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.models.transaction import Transaction
from app.repositories import report as report_repo
from app.services.pdf_generator import generate_financial_report

logger = logging.getLogger(__name__)


async def list_reports(
    db: AsyncSession,
    user_uuid: UUID,
    *,
    skip: int = 0,
    limit: int = 20,
) -> list[dict]:
    """List reports for a user."""
    reports = await report_repo.get_reports_by_user(
        db, user_uuid=user_uuid, skip=skip, limit=limit
    )
    result = []
    for r in reports:
        result.append(
            {
                "id": r.id,
                "period_start": r.period_start.isoformat() if r.period_start else None,
                "period_end": r.period_end.isoformat() if r.period_end else None,
                "file_url": r.file_url,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
        )
    return result


async def get_report_download(db: AsyncSession, report_id: int, user_uuid: UUID) -> FileResponse:
    """Get a report PDF file for download."""
    report = await report_repo.get_report_by_id(db, report_id)
    if not report or str(report.user_uuid) != str(user_uuid):
        raise NotFoundError(message="Report not found", details={"id": report_id})
    if not report.file_url or not os.path.exists(report.file_url):
        raise NotFoundError(message="Report file not found")
    filename = os.path.basename(report.file_url)
    return FileResponse(
        path=report.file_url,
        media_type="application/pdf",
        filename=filename,
    )


async def delete_report(db: AsyncSession, report_id: int, user_uuid: UUID) -> None:
    """Delete a report."""
    report = await report_repo.get_report_by_id(db, report_id)
    if not report or str(report.user_uuid) != str(user_uuid):
        raise NotFoundError(message="Report not found", details={"id": report_id})
    await report_repo.delete_report(db, report_id)


async def generate_report_for_web_user(
    db: AsyncSession,
    user_uuid: UUID,
    *,
    month: int,
    year: int,
    report_type: str = "monthly",
) -> dict:
    """Generate a financial report for a web-authenticated user.

    Queries transactions linked to the user_uuid directly,
    generates a PDF, and saves the report record.
    """
    from sqlalchemy import select as sa_select

    # Determine period start/end
    period_start = datetime(year, month, 1)
    # Last day of the month
    if month == 12:
        period_end = datetime(year, 12, 31, 23, 59, 59)
    else:
        period_end = datetime(year, month + 1, 1) - timedelta(seconds=1)

    # Fetch user name
    from app.db.models.user import User as UserModel

    user_result = await db.execute(
        sa_select(UserModel).where(UserModel.id == user_uuid)
    )
    web_user = user_result.scalar_one_or_none()
    user_name = web_user.full_name or web_user.email or str(user_uuid) if web_user else str(user_uuid)

    # Fetch transactions for this user_uuid in the period
    tx_result = await db.execute(
        sa_select(Transaction)
        .where(
            Transaction.user_uuid == user_uuid,
            Transaction.transaction_date >= period_start,
            Transaction.transaction_date <= period_end,
        )
        .order_by(Transaction.transaction_date.desc())
    )
    transactions = list(tx_result.scalars().all())

    # Calculate totals
    total_income = sum(t.amount for t in transactions if str(t.type) == "INCOME")
    total_expense = sum(t.amount for t in transactions if str(t.type) == "EXPENSE")

    # Group by category
    category_totals: dict[str, float] = {}
    for t in transactions:
        if str(t.type) == "EXPENSE":
            cat_name = t.category.name if t.category else "Outros"
            category_totals[cat_name] = category_totals.get(cat_name, 0) + t.amount

    categories_summary = [
        {"name": name, "total": total}
        for name, total in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    ]

    # Format transactions
    tx_formatted = [
        {
            "date": t.transaction_date.strftime("%d/%m/%Y"),
            "type": str(t.type),
            "category": t.category.name if t.category else "Outros",
            "description": t.description or "-",
            "amount": t.amount,
        }
        for t in transactions
    ]

    # Budget info - fetch from Budget model by user_uuid
    from app.db.models.budget import Budget as BudgetModel

    budget_result = await db.execute(
        sa_select(BudgetModel)
        .where(BudgetModel.user_uuid == user_uuid)
        .order_by(BudgetModel.created_at.desc())
        .limit(1)
    )
    budget = budget_result.scalar_one_or_none()

    budget_info = None
    if budget:
        budget_info = {
            "limit": budget.total_limit,
            "spent": total_expense,
            "name": budget.name,
        }

    # Goals
    from app.db.models.enums import GoalStatus
    from app.db.models.goal import Goal as GoalModel

    goals_result = await db.execute(
        sa_select(GoalModel)
        .where(GoalModel.user_uuid == user_uuid, GoalModel.status == GoalStatus.ACTIVE.value)
    )
    goals = list(goals_result.scalars().all())

    goals_info = [
        {"title": g.title, "target": g.target_amount, "current": g.current_amount}
        for g in goals
    ]

    # Generate PDF
    report_path = generate_financial_report(
        user_name=user_name,
        period_start=period_start.strftime("%d/%m/%Y"),
        period_end=period_end.strftime("%d/%m/%Y"),
        transactions=tx_formatted,
        categories_summary=categories_summary,
        total_income=total_income,
        total_expense=total_expense,
        budget_info=budget_info,
        goals_info=goals_info,
    )

    # Save report record
    report = await report_repo.create_report(
        db,
        user_id=0,  # web users don't have phone_user id
        user_uuid=user_uuid,
        period_start=period_start,
        period_end=period_end,
        file_url=report_path,
    )

    return {
        "id": report.id,
        "period_start": report.period_start.isoformat() if report.period_start else None,
        "period_end": report.period_end.isoformat() if report.period_end else None,
        "file_url": report.file_url,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "summary": {
            "total_income": total_income,
            "total_expense": total_expense,
            "balance": total_income - total_expense,
            "transaction_count": len(transactions),
        },
    }
