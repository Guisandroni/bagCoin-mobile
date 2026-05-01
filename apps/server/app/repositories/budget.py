"""Budget and BudgetItem repositories (PostgreSQL async).

Handles spending plans and per-category limits for BagCoin users.
"""

from datetime import date, datetime, timedelta
from typing import Any

from sqlalchemy import delete as sql_delete
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.budget import Budget, BudgetItem
from app.db.models.transaction import Transaction

# =====================================================================
# BudgetItemRepository
# =====================================================================


async def get_budget_item_by_id(db: AsyncSession, item_id: int) -> BudgetItem | None:
    """Get budget item by ID."""
    return await db.get(BudgetItem, item_id)


async def get_budget_items_by_budget(db: AsyncSession, budget_id: int) -> list[BudgetItem]:
    """Get all items for a budget."""
    result = await db.execute(select(BudgetItem).where(BudgetItem.budget_id == budget_id))
    return list(result.scalars().all())


async def create_budget_item(
    db: AsyncSession,
    *,
    budget_id: int,
    category_id: int | None = None,
    limit_amount: float,
) -> BudgetItem:
    """Create a new budget item."""
    item = BudgetItem(
        budget_id=budget_id,
        category_id=category_id,
        limit_amount=limit_amount,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def update_budget_item(
    db: AsyncSession,
    *,
    db_item: BudgetItem,
    update_data: dict[str, Any],
) -> BudgetItem:
    """Update a budget item."""
    for field, value in update_data.items():
        setattr(db_item, field, value)
    db.add(db_item)
    await db.flush()
    await db.refresh(db_item)
    return db_item


# =====================================================================
# BudgetRepository
# =====================================================================


async def get_by_id(db: AsyncSession, budget_id: int) -> Budget | None:
    """Get budget by ID."""
    return await db.get(Budget, budget_id)


async def get_multi_by_user(db: AsyncSession, user_id: int) -> list[Budget]:
    """Get all budgets for a user."""
    result = await db.execute(
        select(Budget).where(Budget.user_id == user_id).order_by(Budget.created_at.desc())
    )
    return list(result.scalars().all())


async def get_by_user_and_name(db: AsyncSession, user_id: int, name: str) -> Budget | None:
    """Get a budget by user and name (case-insensitive)."""
    result = await db.execute(
        select(Budget).where(
            Budget.user_id == user_id,
            Budget.name.ilike(f"%{name}%"),
        )
    )
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    *,
    user_id: int,
    category_id: int,
    name: str,
    period: str = "monthly",
    total_limit: float = 0.0,
) -> Budget:
    """Create a new budget."""
    budget = Budget(
        user_id=user_id,
        category_id=category_id,
        name=name,
        period=period,
        total_limit=total_limit,
    )
    db.add(budget)
    await db.flush()
    await db.refresh(budget)
    return budget


async def update(
    db: AsyncSession,
    *,
    db_budget: Budget,
    update_data: dict[str, Any],
) -> Budget:
    """Update a budget."""
    for field, value in update_data.items():
        setattr(db_budget, field, value)
    db.add(db_budget)
    await db.flush()
    await db.refresh(db_budget)
    return db_budget


async def delete(db: AsyncSession, budget_id: int) -> Budget | None:
    """Delete a budget by ID."""
    budget = await get_by_id(db, budget_id)
    if budget:
        await db.delete(budget)
        await db.flush()
    return budget


async def delete_all_by_user(db: AsyncSession, user_id: int) -> int:
    """Delete all budgets for a user. Returns count of deleted rows."""
    result = await db.execute(sql_delete(Budget).where(Budget.user_id == user_id))
    await db.flush()
    return result.rowcount


async def calculate_spent(
    db: AsyncSession,
    budget_id: int,
    user_id: int,
    period: str,
) -> float:
    """Calculate how much has been spent in the budget period for the budget's category."""
    date_from = _period_start(period)
    if not date_from:
        return 0.0

    budget = await get_by_id(db, budget_id)
    if not budget or not budget.category_id:
        return 0.0

    result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.type == "EXPENSE",
            Transaction.user_id == user_id,
            Transaction.category_id == budget.category_id,
            Transaction.transaction_date >= date_from,
        )
    )
    return float(result.scalar() or 0)


def _period_start(period: str) -> datetime | None:
    """Return the start date of the period."""
    today = date.today()
    if period == "daily":
        return datetime.combine(today, datetime.min.time())
    elif period == "weekly":
        week_ago = today - timedelta(days=today.weekday())
        return datetime.combine(week_ago, datetime.min.time())
    elif period == "monthly":
        return datetime.combine(today.replace(day=1), datetime.min.time())
    elif period == "yearly":
        return datetime.combine(today.replace(month=1, day=1), datetime.min.time())
    return None
