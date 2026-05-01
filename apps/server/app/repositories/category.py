"""Category repository (PostgreSQL async).

Handles transaction categories for BagCoin users.
"""
from typing import Any

from sqlalchemy import select, delete as sql_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.category import Category


async def get_by_id(db: AsyncSession, category_id: int) -> Category | None:
    """Get category by ID."""
    return await db.get(Category, category_id)


async def get_by_name(db: AsyncSession, user_id: int, name: str) -> Category | None:
    """Get category by name for a specific user (case-insensitive)."""
    result = await db.execute(
        select(Category).where(
            Category.user_id == user_id,
            Category.name.ilike(name),
        )
    )
    return result.scalar_one_or_none()


async def get_multi_by_user(
    db: AsyncSession,
    user_id: int,
    *,
    skip: int = 0,
    limit: int = 100,
) -> list[Category]:
    """Get all categories for a user."""
    result = await db.execute(
        select(Category)
        .where(Category.user_id == user_id)
        .order_by(Category.is_default, Category.name)
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    *,
    user_id: int,
    name: str,
    parent_category_id: int | None = None,
    is_default: bool = False,
) -> Category:
    """Create a new category for a user."""
    category = Category(
        user_id=user_id,
        name=name,
        parent_category_id=parent_category_id,
        is_default=is_default,
    )
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return category


async def get_or_create(
    db: AsyncSession,
    *,
    user_id: int,
    name: str,
    is_default: bool | None = None,
) -> Category:
    """Get existing category by name or create a new one."""
    existing = await get_by_name(db, user_id, name)
    if existing:
        return existing

    if is_default is None:
        default_names = [
            "Alimentação", "Transporte", "Moradia", "Lazer",
            "Saúde", "Educação", "Outros",
        ]
        is_default = name in default_names

    return await create(db, user_id=user_id, name=name, is_default=is_default)


async def update(
    db: AsyncSession,
    *,
    db_category: Category,
    update_data: dict[str, Any],
) -> Category:
    """Update a category."""
    for field, value in update_data.items():
        setattr(db_category, field, value)

    db.add(db_category)
    await db.flush()
    await db.refresh(db_category)
    return db_category


async def delete(db: AsyncSession, category_id: int) -> Category | None:
    """Delete a category by ID."""
    category = await get_by_id(db, category_id)
    if category:
        await db.delete(category)
        await db.flush()
    return category


async def delete_by_user_and_name(db: AsyncSession, user_id: int, name: str) -> bool:
    """Delete a category by user and name. Returns True if deleted."""
    result = await db.execute(
        sql_delete(Category).where(
            Category.user_id == user_id,
            Category.name.ilike(name),
            Category.is_default == False,  # noqa: E712
        )
    )
    await db.flush()
    return result.rowcount > 0
