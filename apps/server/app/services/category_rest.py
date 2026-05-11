"""REST helpers for web-authenticated BagCoin categories."""

from typing import Any
from uuid import UUID

from sqlalchemy import case, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.core.financial_categories import (
    DEFAULT_FINANCIAL_CATEGORIES,
    category_color,
    category_emoji,
    category_type,
    default_category_names,
    normalize_category_key,
    resolve_default_category_name,
)
from app.db.models.budget import Budget
from app.db.models.category import Category
from app.db.models.phone_user import PhoneUser
from app.db.models.transaction import Transaction
from app.db.models.user import User


def _category_response(category: Category, *, can_delete: bool | None = None) -> dict[str, Any]:
    is_user_created = not category.is_default
    resolved_can_delete = is_user_created if can_delete is None else can_delete
    return {
        "id": category.id,
        "name": category.name,
        "color": category_color(category.name),
        "emoji": category_emoji(category.name),
        "type": category_type(category.name),
        "is_default": category.is_default,
        "is_user_created": is_user_created,
        "can_delete": resolved_can_delete,
        "created_at": category.created_at,
        "updated_at": category.updated_at,
    }


def _default_category_response(index: int, name: str) -> dict[str, Any]:
    return {
        "id": -(index + 1),
        "name": name,
        "color": category_color(name),
        "emoji": category_emoji(name),
        "type": category_type(name),
        "is_default": True,
        "is_user_created": False,
        "can_delete": False,
        "created_at": None,
        "updated_at": None,
    }


def fallback_default_categories() -> list[dict[str, Any]]:
    """Return the shared taxonomy without touching the database."""
    return [
        _default_category_response(index, definition.name)
        for index, definition in enumerate(DEFAULT_FINANCIAL_CATEGORIES)
    ]


def _same_category_name(left: str, right: str) -> bool:
    return normalize_category_key(left) == normalize_category_key(right)


def _is_default_category_name(name: str) -> bool:
    normalized = normalize_category_key(name)
    return any(normalize_category_key(default) == normalized for default in default_category_names())


async def _category_is_used(db: AsyncSession, category: Category) -> bool:
    tx_id = (
        await db.execute(select(Transaction.id).where(Transaction.category_id == category.id).limit(1))
    ).scalar_one_or_none()
    if tx_id:
        return True
    budget_id = (
        await db.execute(select(Budget.id).where(Budget.category_id == category.id).limit(1))
    ).scalar_one_or_none()
    return bool(budget_id)


async def get_or_create_phone_profile(db: AsyncSession, user: User) -> PhoneUser:
    """Return the phone profile that owns category rows for a web user."""
    phone_number = user.phone_number or f"web:{user.id}"
    result = await db.execute(
        select(PhoneUser)
        .where(PhoneUser.merged_into_user_id == user.id)
        .order_by(
            case((PhoneUser.phone_number == phone_number, 0), else_=1),
            case((PhoneUser.platform == "web", 0), else_=1),
            PhoneUser.updated_at.desc(),
            PhoneUser.id.asc(),
        )
        .limit(1)
    )
    phone_user = result.scalar_one_or_none()
    if phone_user:
        return phone_user

    result = await db.execute(select(PhoneUser).where(PhoneUser.phone_number == phone_number))
    phone_user = result.scalar_one_or_none()
    if phone_user:
        phone_user.merged_into_user_id = user.id
        await db.flush()
        return phone_user

    phone_user = PhoneUser(
        phone_number=phone_number,
        name=user.full_name or user.email,
        platform="web",
        merged_into_user_id=user.id,
    )
    db.add(phone_user)
    await db.flush()
    await db.refresh(phone_user)
    return phone_user


async def ensure_default_categories_for_user(db: AsyncSession, user: User) -> list[Category]:
    phone_user = await get_or_create_phone_profile(db, user)
    result = await db.execute(select(Category).where(Category.user_id == phone_user.id))
    existing = {normalize_category_key(category.name): category for category in result.scalars().all()}
    categories = list(existing.values())

    for definition in DEFAULT_FINANCIAL_CATEGORIES:
        key = normalize_category_key(definition.name)
        if key in existing:
            existing[key].is_default = True
            continue
        category = Category(user_id=phone_user.id, name=definition.name, is_default=True)
        db.add(category)
        categories.append(category)

    await db.flush()
    return categories


async def list_categories_for_user(db: AsyncSession, user: User) -> list[dict[str, Any]]:
    await ensure_default_categories_for_user(db, user)
    phone_user = await get_or_create_phone_profile(db, user)
    result = await db.execute(
        select(Category).where(Category.user_id == phone_user.id).order_by(Category.name.asc())
    )
    response = []
    for category in result.scalars().all():
        can_delete = (not category.is_default) and not await _category_is_used(db, category)
        response.append(_category_response(category, can_delete=can_delete))
    return response


async def get_or_create_category_for_user(
    db: AsyncSession,
    user_uuid: UUID,
    name: str | None,
) -> Category | None:
    if not name or not name.strip():
        return None

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user:
        return None

    phone_user = await get_or_create_phone_profile(db, user)
    clean_name = resolve_default_category_name(name)
    result = await db.execute(select(Category).where(Category.user_id == phone_user.id))
    for category in result.scalars().all():
        if _same_category_name(category.name, clean_name):
            return category

    category = Category(
        user_id=phone_user.id,
        name=clean_name,
        is_default=_is_default_category_name(clean_name),
    )
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return category


async def create_category_for_user(db: AsyncSession, user: User, name: str) -> dict[str, Any] | None:
    phone_user = await get_or_create_phone_profile(db, user)
    clean_name = resolve_default_category_name(name)
    result = await db.execute(select(Category).where(Category.user_id == phone_user.id))
    if any(_same_category_name(category.name, clean_name) for category in result.scalars().all()):
        return None
    if _is_default_category_name(clean_name):
        return None

    category = Category(
        user_id=phone_user.id,
        name=clean_name,
        is_default=False,
    )
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return _category_response(category, can_delete=not category.is_default)


async def update_category_for_user(
    db: AsyncSession,
    user: User,
    category_id: int,
    name: str,
) -> dict[str, Any]:
    phone_user = await get_or_create_phone_profile(db, user)
    clean_name = resolve_default_category_name(name)
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == phone_user.id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise NotFoundError(message="Category not found", details={"id": category_id})
    if category.is_default:
        raise ValidationError(message="Categorias padrão do sistema não podem ser editadas.")
    if _is_default_category_name(clean_name):
        raise ValidationError(message="Use uma categoria personalizada; categorias padrão já existem.")

    duplicate = await db.execute(select(Category).where(Category.user_id == phone_user.id))
    if any(
        _same_category_name(item.name, clean_name) and item.id != category_id
        for item in duplicate.scalars().all()
    ):
        raise ValidationError(message=f"Category '{clean_name}' already exists")

    category.name = clean_name
    await db.flush()
    await db.refresh(category)
    can_delete = (not category.is_default) and not await _category_is_used(db, category)
    return _category_response(category, can_delete=can_delete)


async def delete_category_for_user(db: AsyncSession, user: User, category_id: int) -> None:
    phone_user = await get_or_create_phone_profile(db, user)
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == phone_user.id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise NotFoundError(message="Category not found", details={"id": category_id})
    if category.is_default:
        raise ValidationError(message="Categorias padrão do sistema não podem ser excluídas.")

    if await _category_is_used(db, category):
        raise ValidationError(message="Categoria em uso. Remova transações/orçamentos antes de excluir.")

    await db.delete(category)
    await db.flush()
