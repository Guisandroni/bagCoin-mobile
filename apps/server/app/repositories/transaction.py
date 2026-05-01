"""Transaction repository (PostgreSQL async).

Handles financial transaction records for BagCoin users.
"""
from datetime import datetime
from typing import Any

from sqlalchemy import select, func, delete as sql_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.transaction import Transaction
from app.db.models.category import Category
from app.db.models.enums import TransactionType


async def get_by_id(db: AsyncSession, transaction_id: int) -> Transaction | None:
    """Get transaction by ID."""
    return await db.get(Transaction, transaction_id)


async def get_multi_by_user(
    db: AsyncSession,
    user_id: int,
    *,
    skip: int = 0,
    limit: int = 50,
    type_filter: str | None = None,
    category_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> list[Transaction]:
    """Get transactions for a user with optional filters."""
    query = select(Transaction).where(Transaction.user_id == user_id)

    if type_filter:
        query = query.where(Transaction.type == type_filter)
    if category_id is not None:
        query = query.where(Transaction.category_id == category_id)
    if date_from:
        query = query.where(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.where(Transaction.transaction_date <= date_to)

    query = query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_by_user_and_id(db: AsyncSession, user_id: int, transaction_id: int) -> Transaction | None:
    """Get a transaction by user ID and transaction ID."""
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    *,
    user_id: int,
    type_: str,
    amount: float,
    currency: str = "BRL",
    category_id: int | None = None,
    description: str | None = None,
    source_format: str = "text",
    transaction_date: datetime | None = None,
    confidence_score: float = 1.0,
    raw_input: str | None = None,
) -> Transaction:
    """Create a new transaction."""
    transaction = Transaction(
        user_id=user_id,
        type=type_,
        amount=amount,
        currency=currency,
        category_id=category_id,
        description=description,
        source_format=source_format,
        transaction_date=transaction_date or datetime.utcnow(),
        confidence_score=confidence_score,
        raw_input=raw_input,
    )
    db.add(transaction)
    await db.flush()
    await db.refresh(transaction)
    return transaction


async def update(
    db: AsyncSession,
    *,
    db_transaction: Transaction,
    update_data: dict[str, Any],
) -> Transaction:
    """Update a transaction."""
    for field, value in update_data.items():
        setattr(db_transaction, field, value)

    db.add(db_transaction)
    await db.flush()
    await db.refresh(db_transaction)
    return db_transaction


async def delete(db: AsyncSession, transaction_id: int) -> Transaction | None:
    """Delete a transaction by ID."""
    transaction = await get_by_id(db, transaction_id)
    if transaction:
        await db.delete(transaction)
        await db.flush()
    return transaction


async def delete_by_user_and_id(db: AsyncSession, user_id: int, transaction_id: int) -> bool:
    """Delete a transaction by user and transaction ID. Returns True if deleted."""
    result = await db.execute(
        sql_delete(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        )
    )
    await db.flush()
    return result.rowcount > 0


async def get_summary(
    db: AsyncSession,
    user_id: int,
    *,
    type_: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> float:
    """Get sum of transaction amounts with optional filters."""
    query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.user_id == user_id
    )
    if type_:
        query = query.where(Transaction.type == type_)
    if date_from:
        query = query.where(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.where(Transaction.transaction_date <= date_to)

    result = await db.execute(query)
    return float(result.scalar() or 0)


async def get_category_totals(
    db: AsyncSession,
    user_id: int,
    *,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = 10,
) -> list[dict]:
    """Get expense totals grouped by category."""
    query = (
        select(
            Category.name,
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .join(Category, Transaction.category_id == Category.id, isouter=True)
        .where(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE.value,
        )
    )
    if date_from:
        query = query.where(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.where(Transaction.transaction_date <= date_to)

    query = query.group_by(Category.name).order_by(func.sum(Transaction.amount).desc()).limit(limit)
    result = await db.execute(query)
    return [
        {"name": row.name, "total": float(row.total), "count": row.count}
        for row in result.all()
    ]


async def check_duplicate(
    db: AsyncSession,
    user_id: int,
    amount: float,
    description: str,
    transaction_date: datetime,
) -> Transaction | None:
    """Check if a transaction already exists (duplicate detection)."""
    result = await db.execute(
        select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.amount == amount,
            Transaction.description == description,
            Transaction.transaction_date == transaction_date,
        )
    )
    return result.scalar_one_or_none()
