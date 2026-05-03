"""Transaction REST service for web frontend.

Handles transactions linked to authenticated users (UUID-based).
"""

import contextlib
from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionListResponse,
    TransactionRestCreate,
    TransactionRestResponse,
    TransactionRestUpdate,
    TransactionSummaryResponse,
)

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


def _to_frontend_response(tx: Transaction) -> TransactionRestResponse:
    category_name = tx.description or "Outros"
    return TransactionRestResponse(
        id=str(tx.id),
        name=tx.description or "Sem descrição",
        category=category_name,
        amount=tx.amount if tx.type == "INCOME" else -tx.amount,
        date=tx.transaction_date.strftime("%d %b") if tx.transaction_date else "",
        source=tx.source_format if tx.source_format != "text" else "manual",
        status="confirmed" if tx.confidence_score >= 0.7 else "pending",
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
        query = select(Transaction).where(Transaction.user_uuid == user_uuid)

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
            select(Transaction).where(
                and_(Transaction.id == transaction_id, Transaction.user_uuid == user_uuid)
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
                tx_date = datetime.utcnow()

        transaction = Transaction(
            user_uuid=user_uuid,
            type=data.type,
            amount=data.amount,
            description=data.description,
            source_format=data.source,
            confidence_score=1.0 if data.status == "confirmed" else 0.5,
            transaction_date=tx_date or datetime.utcnow(),
        )
        self.db.add(transaction)
        await self.db.flush()
        await self.db.refresh(transaction)
        return _to_frontend_response(transaction)

    async def update_for_user(
        self, transaction_id: int, user_uuid: UUID, data: TransactionRestUpdate
    ) -> TransactionRestResponse:
        """Update a transaction."""
        transaction = await self.get_for_user(transaction_id, user_uuid)

        update_data = data.model_dump(exclude_unset=True)
        if update_data.get("type"):
            transaction.type = update_data["type"]
        if update_data.get("amount"):
            transaction.amount = update_data["amount"]
        if update_data.get("description"):
            transaction.description = update_data["description"]
        if "status" in update_data:
            transaction.confidence_score = 1.0 if update_data["status"] == "confirmed" else 0.5
        if update_data.get("transaction_date"):
            with contextlib.suppress(ValueError):
                transaction.transaction_date = datetime.strptime(
                    update_data["transaction_date"], "%Y-%m-%d"
                )

        self.db.add(transaction)
        await self.db.flush()
        await self.db.refresh(transaction)
        return _to_frontend_response(transaction)

    async def delete_for_user(self, transaction_id: int, user_uuid: UUID) -> None:
        """Delete a transaction."""
        transaction = await self.get_for_user(transaction_id, user_uuid)
        await self.db.delete(transaction)
        await self.db.flush()

    async def get_summary(self, user_uuid: UUID) -> TransactionSummaryResponse:
        """Get dashboard summary for a user."""
        result = await self.db.execute(
            select(Transaction).where(Transaction.user_uuid == user_uuid)
        )
        transactions = result.scalars().all()

        total_income = sum(tx.amount for tx in transactions if tx.type == "INCOME")
        total_expenses = sum(tx.amount for tx in transactions if tx.type == "EXPENSE")
        balance = total_income - total_expenses

        # Category breakdown
        cat_map: dict[str, float] = {}
        for tx in transactions:
            if tx.type == "EXPENSE":
                cat = tx.description or "Outros"
                cat_map[cat] = cat_map.get(cat, 0) + tx.amount

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
