"""PhoneUser repository (PostgreSQL async).

Handles BagCoin users identified by phone number.
"""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.enums import UserStatus
from app.db.models.phone_user import PhoneUser


async def get_by_id(db: AsyncSession, user_id: int) -> PhoneUser | None:
    """Get phone user by ID."""
    return await db.get(PhoneUser, user_id)


async def get_by_phone_number(db: AsyncSession, phone_number: str) -> PhoneUser | None:
    """Get phone user by phone number."""
    result = await db.execute(select(PhoneUser).where(PhoneUser.phone_number == phone_number))
    return result.scalar_one_or_none()


async def get_or_create(
    db: AsyncSession,
    *,
    phone_number: str,
    name: str | None = None,
) -> PhoneUser:
    """Get existing user by phone number or create a new one.

    Returns existing user if found, otherwise creates a new one
    with default preferences.
    """
    existing = await get_by_phone_number(db, phone_number)
    if existing:
        return existing

    user = PhoneUser(
        phone_number=phone_number,
        name=name,
        status=UserStatus.ACTIVE.value,
        preferences={"language": "pt-BR", "currency": "BRL"},
        financial_profile={},
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def create(
    db: AsyncSession,
    *,
    phone_number: str,
    name: str | None = None,
    status: str | None = None,
    preferences: dict | None = None,
    financial_profile: dict | None = None,
) -> PhoneUser:
    """Create a new phone user."""
    user = PhoneUser(
        phone_number=phone_number,
        name=name,
        status=status or UserStatus.ACTIVE.value,
        preferences=preferences or {"language": "pt-BR", "currency": "BRL"},
        financial_profile=financial_profile or {},
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def update(
    db: AsyncSession,
    *,
    db_user: PhoneUser,
    update_data: dict[str, Any],
) -> PhoneUser:
    """Update a phone user."""
    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.add(db_user)
    await db.flush()
    await db.refresh(db_user)
    return db_user


async def update_preferences(
    db: AsyncSession,
    user_id: int,
    preferences: dict[str, Any],
) -> PhoneUser:
    """Update user preferences (partial merge)."""
    user = await get_by_id(db, user_id)
    if user is None:
        from app.core.exceptions import NotFoundError

        raise NotFoundError(
            message="Phone user not found",
            details={"user_id": user_id},
        )
    current = dict(user.preferences or {})
    current.update(preferences)
    user.preferences = current
    await db.flush()
    await db.refresh(user)
    return user


async def update_financial_profile(
    db: AsyncSession,
    user_id: int,
    profile: dict[str, Any],
) -> PhoneUser:
    """Update user financial profile."""
    user = await get_by_id(db, user_id)
    if user is None:
        from app.core.exceptions import NotFoundError

        raise NotFoundError(
            message="Phone user not found",
            details={"user_id": user_id},
        )
    user.financial_profile = profile
    await db.flush()
    await db.refresh(user)
    return user
