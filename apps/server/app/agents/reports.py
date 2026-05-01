"""Reports agent — generates financial PDF reports for BagCoin.

Uses sync_session_maker for database access.
"""
import logging
from typing import Any
from datetime import datetime, timedelta

from app.db.session import sync_session_maker
from app.db.models.transaction import Transaction
from app.db.models.budget import Budget
from app.db.models.goal import Goal
from app.db.models.enums import GoalStatus
from app.services.pdf_generator import generate_financial_report
from app.agents.persistence import get_or_create_user

logger = logging.getLogger(__name__)


def _get_period_from_message(message: str) -> tuple:
    """Extrai período de início e fim baseado na mensagem do usuário."""
    today = datetime.utcnow()
    msg_lower = message.lower()

    # Hoje
    if any(p in msg_lower for p in ["hoje"]):
        period_start = today.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = today
        return period_start, period_end, "hoje"

    # Ontem
    if any(p in msg_lower for p in ["ontem"]):
        yesterday = today - timedelta(days=1)
        period_start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = yesterday.replace(hour=23, minute=59, second=59)
        return period_start, period_end, "ontem"

    # Esta semana / últimos 7 dias
    if any(p in msg_lower for p in ["esta semana", "essa semana", "últimos 7 dias", "ultimos 7 dias", "semana"]):
        period_start = today - timedelta(days=7)
        period_end = today
        return period_start, period_end, "últimos 7 dias"

    # Últimos 30 dias
    if any(p in msg_lower for p in ["últimos 30 dias", "ultimos 30 dias"]):
        period_start = today - timedelta(days=30)
        period_end = today
        return period_start, period_end, "últimos 30 dias"

    # Mês passado
    if any(p in msg_lower for p in ["mês passado", "mes passado", "último mês", "ultimo mes"]):
        if today.month == 1:
            period_start = today.replace(year=today.year-1, month=12, day=1, hour=0, minute=0, second=0)
            period_end = today.replace(year=today.year-1, month=12, day=31, hour=23, minute=59, second=59)
        else:
            period_start = today.replace(month=today.month-1, day=1, hour=0, minute=0, second=0)
            # Último dia do mês anterior
            prev_month_end = today.replace(day=1) - timedelta(days=1)
            period_end = prev_month_end.replace(hour=23, minute=59, second=59)
        return period_start, period_end, "mês passado"

    # Este mês (padrão se mencionar "mês" sem especificar)
    if any(p in msg_lower for p in ["este mês", "esse mês", "mês atual", "mes atual", "mês"]):
        period_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_end = today
        return period_start, period_end, "este mês"

    # Este ano
    if any(p in msg_lower for p in ["este ano", "esse ano", "ano atual"]):
        period_start = today.replace(month=1, day=1, hour=0, minute=0, second=0)
        period_end = today
        return period_start, period_end, "este ano"

    # Padrão: mês atual
    period_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    period_end = today
    return period_start, period_end, "este mês"


def generate_report(state: dict[str, Any]) -> dict[str, Any]:
    """Gera relatório financeiro em PDF."""
    db = sync_session_maker()
    try:
        phone_number = state.get("phone_number")
        user = get_or_create_user(phone_number, db)
        message = state.get("message", "")

        # Extrai período da mensagem
        period_start, period_end, period_label = _get_period_from_message(message)

        # Busca transações do período
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user.id,
            Transaction.transaction_date >= period_start,
            Transaction.transaction_date <= period_end
        ).order_by(Transaction.transaction_date.desc()).all()

        # Calcula totais
        total_income = sum(t.amount for t in transactions if t.type.value == "INCOME")
        total_expense = sum(t.amount for t in transactions if t.type.value == "EXPENSE")

        # Agrupa por categoria
        category_totals = {}
        for t in transactions:
            if t.type.value == "EXPENSE":
                cat_name = t.category.name if t.category else "Outros"
                category_totals[cat_name] = category_totals.get(cat_name, 0) + t.amount

        categories_summary = [
            {"name": name, "total": total}
            for name, total in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        ]

        # Formata transações para o PDF
        tx_formatted = [
            {
                "date": t.transaction_date.strftime("%d/%m/%Y"),
                "type": t.type.value,
                "category": t.category.name if t.category else "Outros",
                "description": t.description or "-",
                "amount": t.amount
            }
            for t in transactions
        ]

        # Busca orçamento ativo
        budget = db.query(Budget).filter(
            Budget.user_id == user.id
        ).order_by(Budget.created_at.desc()).first()

        budget_info = None
        if budget:
            budget_expenses = sum(t.amount for t in transactions if t.type.value == "EXPENSE")
            budget_info = {
                "limit": budget.total_limit,
                "spent": budget_expenses,
                "name": budget.name
            }

        # Busca metas
        goals = db.query(Goal).filter(
            Goal.user_id == user.id,
            Goal.status == GoalStatus.ACTIVE.value
        ).all()

        goals_info = [
            {"title": g.title, "target": g.target_amount, "current": g.current_amount}
            for g in goals
        ]

        # Gera PDF
        report_path = generate_financial_report(
            user_name=user.name or user.phone_number,
            period_start=period_start.strftime("%d/%m/%Y"),
            period_end=period_end.strftime("%d/%m/%Y"),
            transactions=tx_formatted,
            categories_summary=categories_summary,
            total_income=total_income,
            total_expense=total_expense,
            budget_info=budget_info,
            goals_info=goals_info
        )

        # Gera CSV também
        csv_path = report_path.replace(".pdf", ".csv")
        try:
            import csv as csv_module
            with open(csv_path, "w", newline="", encoding="utf-8") as f:
                writer = csv_module.writer(f)
                writer.writerow(["Data", "Tipo", "Categoria", "Descrição", "Valor"])
                for tx in tx_formatted:
                    writer.writerow([
                        tx["date"],
                        "Receita" if tx["type"] == "INCOME" else "Gasto",
                        tx["category"],
                        tx["description"],
                        f"R$ {tx['amount']:,.2f}"
                    ])
                writer.writerow([])
                writer.writerow(["Resumo", "", "", "", ""])
                writer.writerow(["Receitas", "", "", "", f"R$ {total_income:,.2f}"])
                writer.writerow(["Despesas", "", "", "", f"R$ {total_expense:,.2f}"])
                writer.writerow(["Saldo", "", "", "", f"R$ {(total_income - total_expense):,.2f}"])
            logger.info(f"CSV gerado: {csv_path}")
        except Exception as csv_err:
            logger.warning(f"Erro ao gerar CSV: {csv_err}")

        state["report_path"] = report_path
        state["report_summary"] = (
            f"Relatório Financeiro\n"
            f"Período: {period_start.strftime('%d/%m/%Y')} a {period_end.strftime('%d/%m/%Y')} ({period_label})\n\n"
            f"Receitas: R$ {total_income:,.2f}\n"
            f"Despesas: R$ {total_expense:,.2f}\n"
            f"Saldo: R$ {(total_income - total_expense):,.2f}\n\n"
            f"PDF e CSV gerados com sucesso!"
        )

        logger.info(f"Relatório gerado: {report_path}")

    except Exception as e:
        logger.error(f"Erro ao gerar relatório: {e}")
        state["error"] = f"Erro ao gerar relatório: {str(e)}"
    finally:
        db.close()

    return state
