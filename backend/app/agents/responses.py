"""Response templates for BagCoin agents.

Principles:
- Clean, humanized text
- Minimal emoji usage
- WhatsApp-friendly formatting
"""
from typing import Any
from datetime import datetime


def _fmt_date(raw) -> str:
    """Format date/time to short Brazilian format."""
    if isinstance(raw, datetime):
        return raw.strftime("%d/%m")
    if isinstance(raw, str):
        for fmt in ["%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y"]:
            try:
                dt = datetime.strptime(raw.split(".")[0], fmt.split(".")[0])
                return dt.strftime("%d/%m")
            except ValueError:
                continue
    return str(raw) if raw else ""


def greeting(name: str | None = None, greeting_time: str | None = None) -> str:
    prefix = greeting_time or "Oi"
    if name:
        return (
            f"{prefix}, {name}! Sou o BagCoin, seu assistente financeiro.\n\n"
            "O que vamos registrar hoje?"
        )
    return (
        f"{prefix}! Sou o BagCoin, seu assistente financeiro.\n\n"
        "Posso ajudar você a:\n"
        "- Registrar gastos e receitas\n"
        "- Consultar suas transações realizadas\n"
        "- Gerar relatórios em PDF\n"
        "- Definir orçamentos por categoria e metas\n\n"
        "O que vamos fazer hoje?"
    )


def help_menu() -> str:
    return (
        "Como usar o BagCoin:\n\n"
        " Voce pode registrar um gasto:\n"
        "• Gastei R$ 35 no almoço\n"
        "• Mercado 240\n"
        "• Uber 30\n\n"
        " Ou registrar uma receita:\n"
        "• Recebi R$ 5000 de salario\n"
        "• Meu pai me mandou 170\n\n"
        " Voce pode consultar suas transações realizadas:\n"
        "• Quanto gastei hoje?\n"
        "• Gastos por categoria\n"
        "• Qual meu saldo?\n\n"
        " Voce pode definir orçamentos por categoria:\n"
        "• Crie um orçamento de R$ 3000 para a categoria alimentação\n"
        "• Crie um orçamento de R$ 1000 para a categoria transporte\n\n"
        " Voce pode definir metas financeiras:\n"
        "• Crie uma meta de R$ 10000 para a viagem de férias\n"
        "• Crie uma meta de R$ 5000 para a compra de um patinete\n\n"
        " Voce pode consultar suas metas:\n"
        "• Minhas metas\n"
        "• Metas por prazo\n"
        "• Progresso das metas\n"
    )


def transaction_registered(tx_type: str, amount: float, category: str, description: str) -> str:
    tipo = "Gasto" if tx_type == "EXPENSE" else "Receita" if tx_type == "INCOME" else "Transação"
    desc = description or "-"
    return f"{tipo} de R$ {amount:,.2f} em {category} registrado.\n(Descrição: {desc})"


def query_summary(summary: str) -> str:
    """Wrap query summary in clean wrapper."""
    return summary


def report_summary(period_label: str, income: float, expense: float, balance: float) -> str:
    return (
        f"Relatório Financeiro\n"
        f"Período: {period_label}\n\n"
        f"Receitas: R$ {income:,.2f}\n"
        f"Despesas: R$ {expense:,.2f}\n"
        f"Saldo: R$ {balance:,.2f}"
    )


def budget_created(name: str, limit: float, period: str, updated: bool = False) -> str:
    period_label = {"monthly": "Mensal", "weekly": "Semanal", "daily": "Diário", "yearly": "Anual"}.get(period, period)
    verb = "atualizado" if updated else "criado"
    return (
        f"Orçamento {verb}! 📊\n\n"
        f"Categoria: {name}\n"
        f"Limite: R$ {limit:,.2f}\n"
        f"Período: {period_label}\n\n"
        f"Vou te avisar quando chegar em 80% e 100%."
    )


def budget_list(budgets: list[dict[str, Any]]) -> str:
    if not budgets:
        return "Você ainda não tem orçamentos. Para criar um orcamento me envie uma mensagem como: 'Crie um orcamento de 3000 reais para alimentação'"
    lines = ["Seus orçamentos:"]
    for b in budgets:
        status = "Ultrapassado" if b["percentage"] >= 100 else "Atenção" if b["percentage"] >= 80 else "OK"
        lines.append(
            f"\n- {b['name']} ({b['period']})\n"
            f"  R$ {b['total_spent']:,.2f} / R$ {b['total_limit']:,.2f} ({b['percentage']}%)\n"
            f"  Status: {status}"
        )
    return "\n".join(lines)


def goal_list(goals: list[dict[str, Any]]) -> str:
    if not goals:
        return "Você ainda não tem metas. Para criar uma meta me envie uma mensagem como: 'Crie uma meta de 10000 reais para a viagem de férias '"
    lines = ["Suas metas:"]
    for g in goals:
        pct = g.get("percentage", 0)
        deadline = g.get("deadline")
        dl_str = f" | Prazo: {_fmt_date(deadline)}" if deadline else ""
        lines.append(
            f"\n- {g['title']}\n"
            f"  R$ {g['current_amount']:,.2f} / R$ {g['target_amount']:,.2f} ({pct}%){dl_str}"
        )
    return "\n".join(lines)


def goal_created(title: str, target: float, deadline: str | None = None) -> str:
    dl = f"\nPrazo: {_fmt_date(deadline)}" if deadline else ""
    return (
        f"Meta criada!\n\n"
        f"Objetivo: {title}\n"
        f"Valor: R$ {target:,.2f}{dl}\n\n"
        f"Bora começar a guardar!"
    )


def alerts_list(alerts: list[dict[str, Any]]) -> str:
    if not alerts:
        return "Nenhum alerta no momento. Seus orçamentos e metas estão dentro do previsto."
    lines = ["Alertas:"]
    for a in alerts:
        lines.append(f"\n- {a['message']}")
    return "\n".join(lines)


def transaction_list(rows: list[dict[str, Any]], title: str = "Transações") -> str:
    """Format transaction list cleanly."""
    if not rows:
        return "Nenhuma transação encontrada."
    lines = [f"{title}:"]
    for i, row in enumerate(rows, 1):
        amount = row.get("amount") or row.get("valor") or row.get("total") or 0
        desc = row.get("description") or row.get("descricao") or row.get("desc") or "-"
        cat = row.get("category") or row.get("categoria") or ""
        date_val = row.get("transaction_date") or row.get("data") or row.get("date") or ""
        tipo = row.get("type") or row.get("tipo") or "EXPENSE"

        date_str = _fmt_date(date_val)
        prefix = "+" if str(tipo).upper() == "INCOME" else "-"
        cat_part = f" ({cat})" if cat else ""
        date_part = f", {date_str}" if date_str else ""

        lines.append(f"{i}. {prefix}R$ {float(amount):,.2f} — {desc}{cat_part}{date_part}")
    return "\n".join(lines)


def category_list(rows: list[dict[str, Any]]) -> str:
    """Format expense-by-category list."""
    if not rows:
        return "Nenhum gasto encontrado no período."
    lines = ["Gastos por categoria:"]
    for row in rows:
        cat = row.get("categoria") or row.get("category") or row.get("name") or "Outros"
        total = row.get("total") or row.get("amount") or row.get("sum") or 0
        lines.append(f"- {cat}: R$ {float(total):,.2f}")
    return "\n".join(lines)


def import_result(imported: int, skipped: int, errors: list[str]) -> str:
    if errors:
        return (
            f"Importação concluída.\n"
            f"Importados: {imported}\n"
            f"Ignorados: {skipped}\n"
            f"Erros: {len(errors)}\n\n"
            f"Detalhes: {', '.join(errors[:3])}"
        )
    return f"Importação concluída. {imported} transações importadas, {skipped} ignoradas."


def unknown_intent() -> str:
    return (
        "Não entendi muito bem. Posso ajudar com:\n"
        "- Registrar gastos e receitas\n"
        "- Consultar seus dados\n"
        "- Gerar relatórios\n"
        "- Dar dicas financeiras\n\n"
        "Manda 'ajuda' para ver exemplos."
    )


def error_message(error: str) -> str:
    error_lower = error.lower()
    if "invalid input value for enum" in error_lower or "psycopg" in error_lower:
        return "Ops, tive um problema ao buscar seus dados. Pode tentar reformular? Ex: 'Quanto gastei esse mês?'"
    if "não foi possível identificar o valor" in error_lower:
        return "Não consegui identificar o valor. Pode me dizer quanto foi? Ex: 'Gastei R$ 50 no mercado'"
    if "connection" in error_lower or "timeout" in error_lower:
        return "Parece que estou com dificuldades de conexão. Pode tentar de novo em alguns segundos?"
    return "Ops, tive um problema ao processar sua solicitação. Pode tentar de outra forma?"
