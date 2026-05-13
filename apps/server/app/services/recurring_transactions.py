"""Recurring transaction helpers."""

from datetime import UTC, datetime
from uuid import UUID

from dateutil.relativedelta import relativedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.recurring_transaction import RecurringTransaction
from app.db.models.transaction import Transaction


def next_run_from(start: datetime, frequency: str) -> datetime:
    """Return the next run date after a transaction date."""
    if start.tzinfo is None:
        start = start.replace(tzinfo=UTC)
    if frequency == "weekly":
        return start + relativedelta(weeks=1)
    if frequency == "yearly":
        return start + relativedelta(years=1)
    return start + relativedelta(months=1)


async def create_recurring_transaction(
    db: AsyncSession,
    *,
    user_uuid: UUID,
    type: str,
    amount: float,
    category_id: int | None,
    description: str,
    frequency: str,
    start_date: datetime,
) -> RecurringTransaction:
    recurring = RecurringTransaction(
        user_uuid=user_uuid,
        type=type,
        amount=abs(amount),
        category_id=category_id,
        description=description,
        frequency=frequency,
        next_run_at=next_run_from(start_date, frequency),
        active=True,
    )
    db.add(recurring)
    await db.flush()
    await db.refresh(recurring)
    return recurring


async def materialize_due_recurring_transactions(
    db: AsyncSession,
    *,
    now: datetime | None = None,
) -> int:
    """Create transactions for due recurring rules and advance their next date."""
    run_at = now or datetime.now(UTC)
    result = await db.execute(
        select(RecurringTransaction).where(
            RecurringTransaction.active.is_(True),
            RecurringTransaction.next_run_at <= run_at,
        )
    )
    created = 0
    for recurring in result.scalars().all():
        transaction = Transaction(
            user_uuid=recurring.user_uuid,
            type=recurring.type,
            amount=abs(recurring.amount),
            category_id=recurring.category_id,
            recurring_transaction_id=recurring.id,
            description=recurring.description,
            source_format="auto",
            confidence_score=1.0,
            transaction_date=recurring.next_run_at,
        )
        db.add(transaction)
        recurring.last_run_at = recurring.next_run_at
        recurring.next_run_at = next_run_from(recurring.next_run_at, recurring.frequency)
        db.add(recurring)
        created += 1
    await db.flush()
    return created
