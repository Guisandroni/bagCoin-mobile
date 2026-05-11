"""Unit tests for response formatting helpers."""

import random
from datetime import date, datetime

from app.agents import responses as resp


def test_period_label_translates_known_periods():
    assert resp.period_label("daily") == "Diário"
    assert resp.period_label("weekly") == "Semanal"
    assert resp.period_label("monthly") == "Mensal"
    assert resp.period_label("yearly") == "Anual"


def test_period_label_keeps_unknown_period():
    assert resp.period_label("biweekly") == "biweekly"


def test_fmt_deadline_accepts_iso_with_timezone():
    assert resp._fmt_deadline("2025-10-01T00:00:00+00:00") == "outubro/2025"


def test_fmt_deadline_accepts_date_objects():
    assert resp._fmt_deadline(date(2026, 10, 1)) == "outubro/2026"
    assert resp._fmt_deadline(datetime(2026, 1, 15, 12, 0)) == "janeiro/2026"


def test_budget_list_uses_period_label():
    result = resp.budget_list([
        {
            "name": "Alimentação",
            "period": "monthly",
            "total_spent": 120,
            "total_limit": 500,
            "percentage": 24,
        }
    ])

    assert "(Mensal)" in result
    assert "monthly" not in result


def test_goal_created_uses_deadline_label():
    result = resp.goal_created("Viagem", 10_000, "2026-10-01T00:00:00+00:00")

    assert "outubro/2026" in result
    assert "2026-10-01T00:00:00+00:00" not in result


def test_transaction_registered_varies_without_duplicated_description():
    random.seed(0)
    result = resp.transaction_registered("EXPENSE", 50, "Alimentação", "Mercado")

    assert "R$ 50.00" in result
    assert "Alimentação" in result
    assert "Mercado" in result
    assert "Descrição:" not in result
