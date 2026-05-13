"""Transaction REST service for web frontend.

Handles transactions linked to authenticated users (UUID-based).
"""

import contextlib
import csv
import io
from datetime import datetime, UTC
from typing import Literal
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.db.models.category import Category
from app.db.models.transaction import Transaction
from app.db.models.user import User
from app.schemas.transaction import (
    TransactionListResponse,
    TransactionRestCreate,
    TransactionRestResponse,
    TransactionRestUpdate,
    TransactionSummaryResponse,
)
from app.services.category_rest import get_or_create_category_for_user, get_or_create_phone_profile
from app.services.recurring_transactions import create_recurring_transaction, next_run_from

CATEGORY_COLORS: dict[str, str] = {
    "Alimentação": "#ff6b35",
    "Transporte": "#0052ff",
    "Moradia": "#7c3aed",
    "Saúde": "#00c853",
    "Lazer": "#ffab00",
    "Educação": "#2196f3",
    "Salário": "#00c853",
    "Compras": "#ff4081",
    "Investimentos": "#ffab00",
    "Outros": "#607d8b",
    "Renda Extra": "#00bcd4",
}


def _transaction_type(tx: Transaction) -> Literal["EXPENSE", "INCOME"]:
    value = str(getattr(tx.type, "value", tx.type))
    return "INCOME" if value == "INCOME" else "EXPENSE"


def _transaction_amount(tx: Transaction) -> float:
    return abs(float(tx.amount or 0))


def _transaction_category_name(tx: Transaction) -> str:
    category = getattr(tx, "category", None)
    name = getattr(category, "name", None)
    return name if isinstance(name, str) and name else "Outros"


def _transaction_category_id(tx: Transaction) -> int | None:
    category_id = getattr(tx, "category_id", None)
    return category_id if isinstance(category_id, int) else None


def _transaction_recurrence_frequency(tx: Transaction) -> Literal["weekly", "monthly", "yearly"] | None:
    recurring_id = getattr(tx, "recurring_transaction_id", None)
    if not isinstance(recurring_id, int):
        return None
    recurring = getattr(tx, "recurring_transaction", None)
    frequency = getattr(recurring, "frequency", None)
    return frequency if frequency in ("weekly", "monthly", "yearly") else None


def _format_transaction_date_pt_br(tx: Transaction) -> str:
    if not tx.transaction_date:
        return ""

    months = [
        "jan",
        "fev",
        "mar",
        "abr",
        "mai",
        "jun",
        "jul",
        "ago",
        "set",
        "out",
        "nov",
        "dez",
    ]
    return f"{tx.transaction_date.day:02d} {months[tx.transaction_date.month - 1]}"


def _to_frontend_response(tx: Transaction) -> TransactionRestResponse:
    category_name = _transaction_category_name(tx)
    recurrence_frequency = _transaction_recurrence_frequency(tx)
    recurring_id = getattr(tx, "recurring_transaction_id", None)
    return TransactionRestResponse(
        id=str(tx.id),
        type=_transaction_type(tx),
        name=tx.description or "Sem descrição",
        category=category_name,
        category_id=_transaction_category_id(tx),
        category_name=category_name,
        amount=_transaction_amount(tx),
        date=_format_transaction_date_pt_br(tx),
        transaction_date=tx.transaction_date.date().isoformat() if tx.transaction_date else None,
        source=tx.source_format if tx.source_format != "text" else "manual",
        status="confirmed" if tx.confidence_score >= 0.7 else "pending",
        is_recurring=isinstance(recurring_id, int),
        recurrence_frequency=recurrence_frequency,
        created_at=tx.created_at,
        updated_at=tx.updated_at,
    )


class TransactionRestService:
    """Service for transaction REST API (web frontend)."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_for_user(
        self,
        user_uuid: UUID,
        *,
        skip: int = 0,
        limit: int = 50,
        type_filter: str | None = None,
        search: str | None = None,
    ) -> TransactionListResponse:
        """List transactions for a user with optional filters."""
        query = (
            select(Transaction).options(
                selectinload(Transaction.category),
                selectinload(Transaction.recurring_transaction),
            ).where(Transaction.user_uuid == user_uuid)
        )

        if type_filter and type_filter in ("EXPENSE", "INCOME"):
            query = query.where(Transaction.type == type_filter)
        if search:
            query = query.where(Transaction.description.ilike(f"%{search}%"))

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        query = query.order_by(Transaction.transaction_date.desc().nulls_last())
        query = query.offset(skip).limit(limit)

        result = await self.db.execute(query)
        transactions = result.scalars().all()

        items = [_to_frontend_response(tx) for tx in transactions]
        return TransactionListResponse(items=items, total=total)

    async def get_for_user(self, transaction_id: int, user_uuid: UUID) -> Transaction:
        """Get a transaction by ID, verifying ownership."""
        result = await self.db.execute(
            select(Transaction).options(
                selectinload(Transaction.category),
                selectinload(Transaction.recurring_transaction),
            ).where(and_(Transaction.id == transaction_id, Transaction.user_uuid == user_uuid)
            )
        )
        tx = result.scalar_one_or_none()
        if not tx:
            raise NotFoundError(message="Transaction not found", details={"id": transaction_id})
        return tx

    async def create_for_user(
        self, user_uuid: UUID, data: TransactionRestCreate
    ) -> TransactionRestResponse:
        """Create a new transaction for the authenticated user."""
        tx_date = None
        if data.transaction_date:
            try:
                tx_date = datetime.strptime(data.transaction_date, "%Y-%m-%d")
            except ValueError:
                tx_date = datetime.now(UTC)

        category_id = None
        if data.category_id:
            category_id = (await self._get_user_category(user_uuid, data.category_id)).id
        elif data.category_name:
            category = await get_or_create_category_for_user(self.db, user_uuid, data.category_name)
            category_id = category.id if category else None

        transaction = Transaction(
            user_uuid=user_uuid,
            type=data.type,
            amount=abs(data.amount),
            description=data.description,
            category_id=category_id,
            source_format=data.source,
            confidence_score=1.0 if data.status == "confirmed" else 0.5,
            transaction_date=tx_date or datetime.now(UTC),
        )
        self.db.add(transaction)
        await self.db.flush()
        await self.db.refresh(transaction)
        if data.is_recurring:
            recurring = await create_recurring_transaction(
                self.db,
                user_uuid=user_uuid,
                type=data.type,
                amount=data.amount,
                category_id=category_id,
                description=data.description,
                frequency=data.recurrence_frequency or "monthly",
                start_date=transaction.transaction_date or datetime.now(UTC),
            )
            transaction.recurring_transaction_id = recurring.id
            await self.db.flush()
        loaded_transaction = await self.get_for_user(transaction.id, user_uuid)
        return _to_frontend_response(loaded_transaction)

    async def _get_user_category(self, user_uuid: UUID, category_id: int) -> Category:
        user_result = await self.db.execute(select(User).where(User.id == user_uuid))
        user = user_result.scalar_one_or_none()
        phone_user = await get_or_create_phone_profile(self.db, user) if user else None
        owner_id = phone_user.id if phone_user else -1
        result = await self.db.execute(
            select(Category).where(
                Category.id == category_id,
                Category.user_id == owner_id,
            )
        )
        category = result.scalar_one_or_none()
        if not category:
            raise NotFoundError(message="Category not found", details={"id": category_id})
        return category

    async def update_for_user(
        self, transaction_id: int, user_uuid: UUID, data: TransactionRestUpdate
    ) -> TransactionRestResponse:
        """Update a transaction."""
        transaction = await self.get_for_user(transaction_id, user_uuid)

        update_data = data.model_dump(exclude_unset=True)
        if update_data.get("type"):
            transaction.type = update_data["type"]
        if update_data.get("amount"):
            transaction.amount = abs(update_data["amount"])
        if update_data.get("description"):
            transaction.description = update_data["description"]
        if update_data.get("category_id"):
            category = await self._get_user_category(user_uuid, update_data["category_id"])
            transaction.category_id = category.id
        elif "category_name" in update_data:
            category = await get_or_create_category_for_user(
                self.db, user_uuid, update_data.get("category_name")
            )
            transaction.category_id = category.id if category else None
        if "status" in update_data:
            transaction.confidence_score = 1.0 if update_data["status"] == "confirmed" else 0.5
        if update_data.get("transaction_date"):
            with contextlib.suppress(ValueError):
                transaction.transaction_date = datetime.strptime(
                    update_data["transaction_date"], "%Y-%m-%d"
                )
        if "is_recurring" in update_data:
            if update_data["is_recurring"]:
                frequency = update_data.get("recurrence_frequency") or "monthly"
                if transaction.recurring_transaction:
                    transaction.recurring_transaction.type = transaction.type
                    transaction.recurring_transaction.amount = abs(transaction.amount)
                    transaction.recurring_transaction.category_id = transaction.category_id
                    transaction.recurring_transaction.description = transaction.description or "Sem descrição"
                    transaction.recurring_transaction.frequency = frequency
                    transaction.recurring_transaction.next_run_at = next_run_from(
                        transaction.transaction_date or datetime.now(UTC),
                        frequency,
                    )
                    transaction.recurring_transaction.active = True
                    self.db.add(transaction.recurring_transaction)
                else:
                    recurring = await create_recurring_transaction(
                        self.db,
                        user_uuid=user_uuid,
                        type=transaction.type,
                        amount=abs(transaction.amount),
                        category_id=transaction.category_id,
                        description=transaction.description or "Sem descrição",
                        frequency=frequency,
                        start_date=transaction.transaction_date or datetime.now(UTC),
                    )
                    transaction.recurring_transaction_id = recurring.id
            else:
                if transaction.recurring_transaction:
                    transaction.recurring_transaction.active = False
                    self.db.add(transaction.recurring_transaction)
                transaction.recurring_transaction_id = None

        self.db.add(transaction)
        await self.db.flush()
        await self.db.refresh(transaction)
        loaded_transaction = await self.get_for_user(transaction.id, user_uuid)
        return _to_frontend_response(loaded_transaction)

    async def delete_for_user(self, transaction_id: int, user_uuid: UUID) -> None:
        """Delete a transaction."""
        transaction = await self.get_for_user(transaction_id, user_uuid)
        await self.db.delete(transaction)
        await self.db.flush()

    async def get_summary(self, user_uuid: UUID) -> TransactionSummaryResponse:
        """Get dashboard summary for a user."""
        result = await self.db.execute(
            select(Transaction)
            .options(
                selectinload(Transaction.category),
                selectinload(Transaction.recurring_transaction),
            )
            .where(Transaction.user_uuid == user_uuid)
        )
        transactions = result.scalars().all()

        total_income = sum(
            _transaction_amount(tx) for tx in transactions if _transaction_type(tx) == "INCOME"
        )
        total_expenses = sum(
            _transaction_amount(tx) for tx in transactions if _transaction_type(tx) == "EXPENSE"
        )
        balance = total_income - total_expenses

        # Category breakdown
        cat_map: dict[str, float] = {}
        for tx in transactions:
            if _transaction_type(tx) == "EXPENSE":
                cat = _transaction_category_name(tx)
                cat_map[cat] = cat_map.get(cat, 0) + _transaction_amount(tx)

        categories = [
            {"name": name, "amount": amt, "color": CATEGORY_COLORS.get(name, "#607d8b")}
            for name, amt in sorted(cat_map.items(), key=lambda x: -x[1])
        ]

        recent = sorted(
            transactions, key=lambda t: t.transaction_date or datetime.min, reverse=True
        )[:10]
        recent_responses = [_to_frontend_response(tx) for tx in recent]

        return TransactionSummaryResponse(
            balance=balance,
            total_income=total_income,
            total_expenses=total_expenses,
            transaction_count=len(transactions),
            categories=categories,
            recent_transactions=recent_responses,
        )

    async def export_csv_for_user(self, user_uuid: UUID) -> str:
        """Export all user transactions as CSV."""
        result = await self.db.execute(
            select(Transaction).options(
                selectinload(Transaction.category),
                selectinload(Transaction.recurring_transaction),
            ).where(Transaction.user_uuid == user_uuid).order_by(Transaction.transaction_date.desc().nulls_last())
        )
        transactions = result.scalars().all()

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            [
                "id",
                "tipo",
                "descricao",
                "categoria",
                "valor",
                "data",
                "origem",
                "status",
                "recorrente",
                "frequencia_recorrencia",
            ]
        )
        for tx in transactions:
            writer.writerow(
                [
                    tx.id,
                    _transaction_type(tx),
                    tx.description or "",
                    _transaction_category_name(tx),
                    f"{_transaction_amount(tx):.2f}",
                    tx.transaction_date.date().isoformat() if tx.transaction_date else "",
                    tx.source_format,
                    "confirmed" if tx.confidence_score >= 0.7 else "pending",
                    "true" if isinstance(getattr(tx, "recurring_transaction_id", None), int) else "false",
                    _transaction_recurrence_frequency(tx) or "",
                ]
            )

        return buffer.getvalue()
