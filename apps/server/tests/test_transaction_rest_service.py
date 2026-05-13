"""Tests for web transaction REST service calculations."""

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.transaction_rest import TransactionRestService, _to_frontend_response
from app.services.recurring_transactions import next_run_from
from app.schemas.transaction import TransactionRestUpdate


def _tx(
    *,
    tx_type: str,
    amount: float,
    description: str,
    category: str,
    recurring_transaction_id: int | None = None,
    recurrence_frequency: str | None = None,
):
    now = datetime.now(UTC)
    return SimpleNamespace(
        id=1,
        type=tx_type,
        amount=amount,
        description=description,
        category_id=7,
        category=SimpleNamespace(name=category),
        recurring_transaction_id=recurring_transaction_id,
        recurring_transaction=(
            SimpleNamespace(frequency=recurrence_frequency)
            if recurring_transaction_id
            else None
        ),
        transaction_date=now,
        source_format="manual",
        confidence_score=1.0,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.anyio
async def test_summary_uses_type_and_absolute_amounts_for_legacy_negative_expenses():
    """Income/expense totals use type as truth and abs(amount) for old negative rows."""
    user_id = uuid4()
    rows = [
        _tx(tx_type="INCOME", amount=8500, description="Salário Maio", category="Investimentos"),
        _tx(tx_type="INCOME", amount=3000, description="Freelance Design", category="Investimentos"),
        _tx(tx_type="EXPENSE", amount=-245.8, description="Supermercado", category="Alimentação"),
        _tx(tx_type="EXPENSE", amount=112.8, description="Gasolina", category="Transporte"),
    ]
    result = MagicMock()
    result.scalars.return_value.all.return_value = rows
    db = AsyncMock()
    db.execute = AsyncMock(return_value=result)

    summary = await TransactionRestService(db).get_summary(user_id)

    assert summary.total_income == 11500
    assert summary.total_expenses == pytest.approx(358.6)
    assert summary.balance == pytest.approx(11141.4)
    assert summary.recent_transactions[0].type in {"INCOME", "EXPENSE"}
    assert {item["name"] for item in summary.categories} == {"Alimentação", "Transporte"}


def test_frontend_response_includes_type_category_and_absolute_amount():
    tx = _tx(
        tx_type="EXPENSE",
        amount=-89.9,
        description="Farmácia",
        category="Saúde",
    )

    response = _to_frontend_response(tx)

    assert response.type == "EXPENSE"
    assert response.name == "Farmácia"
    assert response.category == "Saúde"
    assert response.category_id == 7
    assert response.category_name == "Saúde"
    assert response.amount == 89.9


@pytest.mark.anyio
async def test_update_for_user_accepts_existing_category_id():
    user_id = uuid4()
    tx = _tx(
        tx_type="EXPENSE",
        amount=10,
        description="Uber",
        category="Transporte",
    )
    db = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    service = TransactionRestService(db)
    service.get_for_user = AsyncMock(side_effect=[tx, tx])  # type: ignore[method-assign]
    service._get_user_category = AsyncMock(return_value=SimpleNamespace(id=42))  # type: ignore[method-assign]

    response = await service.update_for_user(
        1,
        user_id,
        TransactionRestUpdate(category_id=42, category_name="Transporte"),
    )

    assert tx.category_id == 42
    assert response.category_id == 42
    service._get_user_category.assert_awaited_once_with(user_id, 42)


@pytest.mark.anyio
async def test_update_for_user_creates_recurring_rule_when_enabled(monkeypatch):
    user_id = uuid4()
    tx = _tx(
        tx_type="EXPENSE",
        amount=10,
        description="Netflix",
        category="Assinaturas",
    )
    db = MagicMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    service = TransactionRestService(db)
    service.get_for_user = AsyncMock(side_effect=[tx, tx])  # type: ignore[method-assign]
    async def fake_create_recurring_transaction(*args, **kwargs):
        return SimpleNamespace(id=88, frequency=kwargs["frequency"])

    monkeypatch.setattr(
        "app.services.transaction_rest.create_recurring_transaction",
        fake_create_recurring_transaction,
    )

    response = await service.update_for_user(
        1,
        user_id,
        TransactionRestUpdate(is_recurring=True, recurrence_frequency="yearly"),
    )

    assert tx.recurring_transaction_id is not None
    assert response.is_recurring is True


def test_frontend_response_formats_date_in_pt_br_short_month():
    tx = _tx(
        tx_type="EXPENSE",
        amount=32.5,
        description="Cinema",
        category="Lazer",
    )
    tx.transaction_date = datetime(2026, 5, 7, tzinfo=UTC)

    response = _to_frontend_response(tx)

    assert response.date == "07 mai"
    assert response.transaction_date == "2026-05-07"


def test_frontend_response_includes_recurring_metadata():
    tx = _tx(
        tx_type="EXPENSE",
        amount=120,
        description="Netflix",
        category="Assinaturas",
        recurring_transaction_id=3,
        recurrence_frequency="monthly",
    )

    response = _to_frontend_response(tx)

    assert response.is_recurring is True
    assert response.recurrence_frequency == "monthly"


def test_recurring_next_run_uses_frequency():
    start = datetime(2026, 5, 9, tzinfo=UTC)

    assert next_run_from(start, "weekly").date().isoformat() == "2026-05-16"
    assert next_run_from(start, "monthly").date().isoformat() == "2026-06-09"
    assert next_run_from(start, "yearly").date().isoformat() == "2027-05-09"
