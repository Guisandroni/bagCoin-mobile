"""REST service for Budget operations (web frontend, async)."""

from datetime import date, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.models.budget import Budget
from app.db.models.category import Category
from app.db.models.transaction import Transaction
from app.db.models.user import User
from app.repositories import budget as budget_repo
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.services.category_rest import get_or_create_category_for_user, get_or_create_phone_profile


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


async def _calculate_spent(db: AsyncSession, budget: Budget) -> float:
    """Calculate how much has been spent in the budget period."""
    date_from = _period_start(budget.period)
    if not date_from or not budget.category_id:
        return 0.0

    result = await db.execute(
        select(func.coalesce(func.sum(func.abs(Transaction.amount)), 0)).where(
            Transaction.type == "EXPENSE",
            Transaction.user_uuid == budget.user_uuid,
            Transaction.category_id == budget.category_id,
            Transaction.transaction_date >= date_from,
        )
    )
    return float(result.scalar() or 0)


def _budget_progress_payload(budget: Budget, spent: float) -> dict[str, float]:
    """Normalize budget progress values for current and legacy transaction rows."""
    total_limit = abs(float(budget.total_limit or 0))
    total_spent = abs(float(spent or 0))
    total_remaining = total_limit - total_spent
    percentage = round((total_spent / total_limit) * 100, 1) if total_limit > 0 else 0
    return {
        "total_limit": total_limit,
        "total_spent": total_spent,
        "total_remaining": total_remaining,
        "percentage": percentage,
    }


async def list_budgets(
    db: AsyncSession,
    user_uuid: UUID,
) -> list[dict[str, Any]]:
    """List budgets for a user with progress calculations."""
    budgets = await budget_repo.get_budgets_by_user(db, user_uuid=user_uuid)
    result = []
    for budget in budgets:
        spent = await _calculate_spent(db, budget)
        progress = _budget_progress_payload(budget, spent)
        cat_name = budget.category.name if budget.category else budget.name
        result.append(
            {
                "id": budget.id,
                "name": budget.name,
                "category_id": budget.category_id,
                "category_name": cat_name,
                **progress,
                "period": budget.period,
                "budget_type": budget.budget_type,
                "created_at": budget.created_at,
                "updated_at": budget.updated_at,
            }
        )
    return result


async def create_budget(
    db: AsyncSession,
    user_uuid: UUID,
    data: BudgetCreate,
) -> dict[str, Any]:
    """Create a new budget for the authenticated user."""
    category = await _resolve_budget_category(db, user_uuid, data)
    budget_type = data.budget_type or ("category" if category else "general")
    name = category.name if category else data.name
    budget = await budget_repo.create_budget(
        db,
        user_uuid=user_uuid,
        name=name,
        period=data.period,
        total_limit=data.total_limit,
        category_id=category.id if category else None,
        budget_type=budget_type,
    )
    return await get_budget(db, budget.id, user_uuid)


async def _resolve_budget_category(
    db: AsyncSession,
    user_uuid: UUID,
    data: BudgetCreate,
) -> Category | None:
    if data.category_id:
        result = await db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError(message="Category not found", details={"id": data.category_id})
        phone_user = await get_or_create_phone_profile(db, user)
        result = await db.execute(
            select(Category).where(
                Category.id == data.category_id,
                Category.user_id == phone_user.id,
            )
        )
        category = result.scalar_one_or_none()
        if not category:
            raise NotFoundError(message="Category not found", details={"id": data.category_id})
        return category

    return await get_or_create_category_for_user(db, user_uuid, data.category_name or data.name)


async def _resolve_budget_category_update(
    db: AsyncSession,
    user_uuid: UUID,
    category_id: int | None,
    category_name: str | None,
) -> Category | None:
    if category_id:
        result = await db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError(message="Category not found", details={"id": category_id})
        phone_user = await get_or_create_phone_profile(db, user)
        result = await db.execute(
            select(Category).where(Category.id == category_id, Category.user_id == phone_user.id)
        )
        category = result.scalar_one_or_none()
        if not category:
            raise NotFoundError(message="Category not found", details={"id": category_id})
        return category
    if category_name:
        return await get_or_create_category_for_user(db, user_uuid, category_name)
    return None


async def get_budget(db: AsyncSession, budget_id: int, user_uuid: UUID) -> dict[str, Any]:
    """Get a budget by ID with progress."""
    budget = await budget_repo.get_budget_by_id(db, budget_id)
    if not budget or str(budget.user_uuid) != str(user_uuid):
        raise NotFoundError(message="Budget not found", details={"id": budget_id})
    spent = await _calculate_spent(db, budget)
    progress = _budget_progress_payload(budget, spent)
    cat_name = budget.category.name if budget.category else budget.name
    return {
        "id": budget.id,
        "name": budget.name,
        "category_id": budget.category_id,
        "category_name": cat_name,
        **progress,
        "period": budget.period,
        "budget_type": budget.budget_type,
        "created_at": budget.created_at,
        "updated_at": budget.updated_at,
    }


async def update_budget(
    db: AsyncSession,
    budget_id: int,
    user_uuid: UUID,
    data: BudgetUpdate,
) -> dict[str, Any]:
    """Update a budget."""
    budget = await budget_repo.get_budget_by_id(db, budget_id)
    if not budget or str(budget.user_uuid) != str(user_uuid):
        raise NotFoundError(message="Budget not found", details={"id": budget_id})
    update_data = data.model_dump(exclude_unset=True)
    category = await _resolve_budget_category_update(
        db,
        user_uuid,
        update_data.pop("category_id", None),
        update_data.pop("category_name", None),
    )
    if category:
        update_data["category_id"] = category.id
        update_data["name"] = category.name
        update_data.setdefault("budget_type", "category")
    await budget_repo.update_budget(db, db_budget=budget, update_data=update_data)
    return await get_budget(db, budget_id, user_uuid)


async def delete_budget(db: AsyncSession, budget_id: int, user_uuid: UUID) -> None:
    """Delete a budget."""
    budget = await budget_repo.get_budget_by_id(db, budget_id)
    if not budget or str(budget.user_uuid) != str(user_uuid):
        raise NotFoundError(message="Budget not found", details={"id": budget_id})
    await budget_repo.delete_budget(db, budget_id)


async def get_budget_alerts(
    db: AsyncSession,
    user_uuid: UUID,
) -> list[dict[str, Any]]:
    """Get budget alerts (near or over limit)."""
    alerts = []
    budgets = await list_budgets(db, user_uuid)
    for budget in budgets:
        pct = budget["percentage"]
        if pct >= 100:
            alerts.append(
                {
                    "type": "budget_exceeded",
                    "severity": "high",
                    "budget_name": budget["name"],
                    "message": (
                        f"Orçamento de {budget['name']} estourado! "
                        f"R$ {budget['total_spent']:,.2f} usado de R$ {budget['total_limit']:,.2f} ({pct}%)"
                    ),
                }
            )
        elif pct >= 80:
            alerts.append(
                {
                    "type": "budget_warning",
                    "severity": "medium",
                    "budget_name": budget["name"],
                    "message": (
                        f"Atenção: orçamento de {budget['name']} está em {pct}% "
                        f"(R$ {budget['total_spent']:,.2f} de R$ {budget['total_limit']:,.2f})"
                    ),
                }
            )
    return alerts
