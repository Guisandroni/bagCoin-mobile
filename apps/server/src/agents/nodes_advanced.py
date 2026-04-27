import json
import re
from datetime import date, datetime, timedelta
from typing import Dict, Any, List, Optional
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from sqlmodel import Session, select
from ..core.database import engine
from ..models.user import User
from ..models.transaction import Transaction
from ..models.budget import Budget
from ..models.budget_category import BudgetCategory
from ..models.fund import Fund
from ..models.fund_contribution import FundContribution
from ..models.reminder import Reminder
from ..models.shopping_list import ShoppingList
from ..models.shopping_item import ShoppingItem
from ..models.subscription import Subscription
from ..models.custom_category import CustomCategory
from ..repositories.budget_repository import BudgetRepository
from ..repositories.fund_repository import FundRepository
from ..repositories.reminder_repository import ReminderRepository
from ..repositories.shopping_repository import ShoppingRepository
from ..repositories.subscription_repository import SubscriptionRepository
from ..repositories.custom_category_repository import CustomCategoryRepository
from .state import AgentState
from .categories import CATEGORIES


def _get_month_name(month_num: int) -> str:
    months = [
        "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ]
    return months[month_num - 1]


def _parse_month(text: str) -> Optional[int]:
    text_lower = text.lower().strip()
    months = {
        "janeiro": 1, "fevereiro": 2, "marco": 3, "abril": 4, "maio": 5, "junho": 6,
        "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12,
        "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
        "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12,
    }
    # Check for "este mes", "mes passado", "proximo mes"
    if any(k in text_lower for k in ["este mes", "esse mes", "mes atual", "agora"]):
        return date.today().month
    if any(k in text_lower for k in ["mes passado", "mes anterior", "ultimo mes"]):
        prev = date.today().month - 1
        return 12 if prev == 0 else prev
    if any(k in text_lower for k in ["proximo mes", "mes que vem"]):
        nxt = date.today().month + 1
        return 1 if nxt == 13 else nxt
    for name, num in months.items():
        if name in text_lower:
            return num
    # Check for numeric month
    m = re.search(r'\b(0?[1-9]|1[0-2])\b', text_lower)
    if m:
        return int(m.group(1))
    return None


def budget_node(state: AgentState) -> Dict[str, Any]:
    """Handle budget creation and queries."""
    last_message = state["messages"][-1].content
    user_id = state.get("user_id")
    text_lower = last_message.lower()

    with Session(engine) as session:
        budget_repo = BudgetRepository(session)

        # 1. Check if we're awaiting month for a pending budget
        if state.get("awaiting_budget_month") and state.get("pending_budget_category"):
            month = _parse_month(last_message)
            if month is None:
                return {
                    "messages": [AIMessage(content="Não entendi o mês. Pode dizer algo como 'abril', 'maio' ou 'este mês'?")],
                    "awaiting_budget_month": True,
                }
            year = date.today().year
            category = state["pending_budget_category"]
            amount = state["pending_budget_amount"]

            budget = budget_repo.get_or_create(user_id, year, month)
            existing = budget_repo.get_category(budget.id, category)
            if existing:
                existing.budgeted_amount = amount
                session.add(existing)
            else:
                bc = BudgetCategory(
                    budget_id=budget.id,
                    category_name=category,
                    budgeted_amount=amount,
                    spent_amount=0.0
                )
                budget_repo.add_category(bc)

            month_name = _get_month_name(month)
            return {
                "messages": [AIMessage(content=f"✅ Orçamento de R${amount:,.2f} para a categoria {category} em {month_name} foi criado!")],
                "awaiting_budget_month": False,
                "pending_budget_category": None,
                "pending_budget_amount": None,
            }

        # 2. Query existing budget status
        if any(k in text_lower for k in ["como esta", "status", "quanto resta", "quanto ja gastei do orcamento"]):
            month = _parse_month(last_message) or date.today().month
            year = date.today().year
            budget = budget_repo.get_by_user_and_period(user_id, year, month)
            if not budget or not budget.budget_categories:
                month_name = _get_month_name(month)
                return {"messages": [AIMessage(content=f"Você ainda não definiu nenhum orçamento para {month_name}.")]}

            lines = [f"*Orçamentos de {_get_month_name(month)}/{year}:*\n"]
            for bc in budget.budget_categories:
                remaining = bc.budgeted_amount - bc.spent_amount
                emoji = "🟢" if remaining > bc.budgeted_amount * 0.3 else ("🟡" if remaining > 0 else "🔴")
                lines.append(f"{emoji} *{bc.category_name}:*")
                lines.append(f"   Total orçado: R${bc.budgeted_amount:,.2f}")
                lines.append(f"   Gasto até agora: R${bc.spent_amount:,.2f}")
                lines.append(f"   Restam: R${remaining:,.2f}\n")
            return {"messages": [AIMessage(content="\n".join(lines))]}

        # 3. Create new budget - extract category and amount
        # Pattern: "definir 10000 para alimentacao" or "orcamento 5000 transporte"
        amount_match = re.search(r'(?:definir|orcamento|orcar)\s*(?:de\s*)?R?\$?\s*([\d.,]+)\s*(?:reais?\s*)?(?:para\s*)?([\w\s]+)?', text_lower)
        if not amount_match:
            amount_match = re.search(r'([\d.,]+)\s*(?:reais?\s*)?(?:para\s*)?([\w\s]+)?', text_lower)

        if amount_match:
            amount_str = amount_match.group(1).replace('.', '').replace(',', '.')
            try:
                amount = float(amount_str)
            except ValueError:
                amount = 0
            category = amount_match.group(2).strip() if amount_match.group(2) else None

            # If no category in the message, try to find one
            if not category:
                for cat in CATEGORIES:
                    if cat.lower() in text_lower:
                        category = cat
                        break
                if not category:
                    return {
                        "messages": [AIMessage(content="Para qual categoria você gostaria de definir esse orçamento? (Ex: Alimentação, Transporte, Lazer)")],
                        "awaiting_budget_month": False,
                        "pending_budget_category": None,
                        "pending_budget_amount": amount,
                    }

            # Ask for month
            month = _parse_month(last_message)
            if month is None:
                return {
                    "messages": [AIMessage(content=f"Certo! E para qual mês você gostaria de definir esse orçamento de R${amount:,.2f} para {category}?")],
                    "awaiting_budget_month": True,
                    "pending_budget_category": category,
                    "pending_budget_amount": amount,
                }

            year = date.today().year
            budget = budget_repo.get_or_create(user_id, year, month)
            bc = BudgetCategory(
                budget_id=budget.id,
                category_name=category,
                budgeted_amount=amount,
                spent_amount=0.0
            )
            budget_repo.add_category(bc)
            month_name = _get_month_name(month)
            return {
                "messages": [AIMessage(content=f"✅ Orçamento de R${amount:,.2f} para a categoria {category} em {month_name} foi criado!")]
            }

    return {"messages": [AIMessage(content="Não entendi. Você quer criar um orçamento ou consultar um existente?")]}


def fund_node(state: AgentState) -> Dict[str, Any]:
    """Handle fund/goal creation and queries."""
    last_message = state["messages"][-1].content
    user_id = state.get("user_id")
    text_lower = last_message.lower()

    with Session(engine) as session:
        fund_repo = FundRepository(session)

        # List funds
        if any(k in text_lower for k in ["listar fundos", "meus fundos", "quais fundos", "ver fundos"]):
            funds = fund_repo.get_by_user(user_id)
            if not funds:
                return {"messages": [AIMessage(content="Você ainda não criou nenhum fundo. Quer criar um agora?")]}
            lines = ["*Seus Fundos:*\n"]
            for f in funds:
                progress = (f.current_amount / f.target_amount * 100) if f.target_amount else 0
                lines.append(f"💰 *{f.name}* ({f.fund_type})")
                lines.append(f"   Valor atual: R${f.current_amount:,.2f}")
                if f.target_amount:
                    lines.append(f"   Meta: R${f.target_amount:,.2f} ({progress:.0f}%)")
                lines.append("")
            return {"messages": [AIMessage(content="\n".join(lines))]}

        # Create fund
        if any(k in text_lower for k in ["criar fundo", "novo fundo", "fundos para", "fundo de"]):
            # Extract name after keywords
            name_match = re.search(r'(?:criar fundo|novo fundo|fundos para|fundo de)\s+(.+)', last_message, re.IGNORECASE)
            name = name_match.group(1).strip() if name_match else None
            if not name:
                return {"messages": [AIMessage(content="Qual nome você gostaria de dar ao fundo? (Ex: 'Viagem para a Disney', 'Reserva de Emergência')")]}

            fund = Fund(user_id=user_id, name=name)
            fund_repo.create(fund)
            return {
                "messages": [AIMessage(content=f"✅ Fundo *{name}* criado!\n\nVocê pode adicionar valores a ele a qualquer tempo dizendo 'adicionar 500 ao fundo {name}'.")]
            }

        # Add contribution
        contrib_match = re.search(r'(?:adicionar|depositar|colocar)\s*R?\$?\s*([\d.,]+)\s*(?:no|ao|para o)\s*fundo\s+(.+)', text_lower)
        if contrib_match:
            amount_str = contrib_match.group(1).replace('.', '').replace(',', '.')
            amount = float(amount_str)
            fund_name = contrib_match.group(2).strip()

            funds = fund_repo.get_by_user(user_id)
            target_fund = None
            for f in funds:
                if f.name.lower() in fund_name or fund_name in f.name.lower():
                    target_fund = f
                    break

            if not target_fund:
                return {"messages": [AIMessage(content=f"Não encontrei um fundo chamado '{fund_name}'. Quer criar um?")]}

            contribution = FundContribution(fund_id=target_fund.id, amount=amount)
            fund_repo.add_contribution(contribution)
            return {
                "messages": [AIMessage(content=f"✅ R${amount:,.2f} adicionados ao fundo *{target_fund.name}*!\nTotal do fundo: R${target_fund.current_amount:,.2f}")]
            }

    return {"messages": [AIMessage(content="Posso te ajudar a criar fundos, adicionar valores ou consultar seus fundos existentes. O que você precisa?")]}


def reminder_node(state: AgentState) -> Dict[str, Any]:
    """Handle reminder creation and queries."""
    last_message = state["messages"][-1].content
    user_id = state.get("user_id")
    text_lower = last_message.lower()

    with Session(engine) as session:
        reminder_repo = ReminderRepository(session)

        # List reminders
        if any(k in text_lower for k in ["meus lembretes", "lista de lembretes", "ver lembretes", "proximos vencimentos"]):
            reminders = reminder_repo.get_upcoming(user_id, days=30)
            if not reminders:
                return {"messages": [AIMessage(content="Você não tem lembretes ativos nos próximos 30 dias.")]}
            lines = ["*Lembretes próximos:*\n"]
            for r in reminders:
                emoji = "🔔"
                if r.amount:
                    lines.append(f"{emoji} *{r.title}* - {r.due_date.strftime('%d/%m/%Y')} (R${r.amount:,.2f})")
                else:
                    lines.append(f"{emoji} *{r.title}* - {r.due_date.strftime('%d/%m/%Y')}")
                if r.description:
                    lines.append(f"   {r.description}")
            return {"messages": [AIMessage(content="\n".join(lines))]}

        # Create reminder
        if any(k in text_lower for k in ["me lembra", "lembrar de", "criar lembrete", "adicionar lembrete"]):
            # Extract amount if present
            amount_match = re.search(r'R?\$?\s*([\d.,]+)', last_message)
            amount = None
            if amount_match:
                amount_str = amount_match.group(1).replace('.', '').replace(',', '.')
                try:
                    amount = float(amount_str)
                except ValueError:
                    amount = None

            # Extract date
            date_patterns = [
                r'(?:dia|vencimento|data)\s*(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?',
                r'(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?',
            ]
            due_date = None
            for pattern in date_patterns:
                m = re.search(pattern, last_message)
                if m:
                    day, month, year = m.groups()
                    year = int(year) if year else date.today().year
                    if year < 100:
                        year += 2000
                    try:
                        due_date = date(year, int(month), int(day))
                    except ValueError:
                        continue
                    break

            if not due_date:
                # Try "dia 10", "dia 25"
                m = re.search(r'(?:dia\s+|vencimento\s+)(\d{1,2})\b', last_message)
                if m:
                    day = int(m.group(1))
                    month = date.today().month
                    year = date.today().year
                    if day < date.today().day:
                        month += 1
                        if month > 12:
                            month = 1
                            year += 1
                    try:
                        due_date = date(year, month, day)
                    except ValueError:
                        pass

            if not due_date:
                return {"messages": [AIMessage(content="Para quando é esse lembrete? Me diga a data (ex: 'dia 10', '25/04').")]}

            # Extract title - everything between "me lembra de" and date/amount
            title = last_message
            for pattern in [r'(?i)(?:me lembra de|lembrar de|criar lembrete|adicionar lembrete)\s+(.+?)(?:\s+dia|\s+R\$|\s+\d{1,2}[\/\-])',
                           r'(?i)(?:me lembra de|lembrar de)\s+(.+)']:
                m = re.search(pattern, title)
                if m:
                    title = m.group(1).strip()
                    break

            reminder = Reminder(
                user_id=user_id,
                title=title,
                due_date=due_date,
                amount=amount,
            )
            reminder_repo.create(reminder)
            return {
                "messages": [AIMessage(content=f"✅ Lembrete criado: *{title}* para {due_date.strftime('%d/%m/%Y')}" + (f" (R${amount:,.2f})" if amount else ""))]
            }

    return {"messages": [AIMessage(content="Posso criar lembretes para contas a pagar ou receber. Me diga o que e quando. Ex: 'me lembra de pagar a luz dia 10'.")]}


def shopping_list_node(state: AgentState) -> Dict[str, Any]:
    """Handle shopping list management."""
    last_message = state["messages"][-1].content
    user_id = state.get("user_id")
    text_lower = last_message.lower()

    with Session(engine) as session:
        shop_repo = ShoppingRepository(session)

        # Show list
        if any(k in text_lower for k in ["ver lista", "mostrar lista", "minha lista", "lista de compras", "o que tem na lista"]):
            sl = shop_repo.get_or_create_list(user_id)
            items = shop_repo.get_items(sl.id)
            if not items:
                return {"messages": [AIMessage(content="Sua lista de compras está vazia! Me diga 'anota leite, pão' para adicionar itens.")]}
            lines = ["*Lista de Compras:*\n"]
            for item in items:
                lines.append(f"• {item.name}" + (f" ({item.quantity})" if item.quantity else ""))
            return {"messages": [AIMessage(content="\n".join(lines))]}

        # Add items
        if any(k in text_lower for k in ["anota", "adicionar", "colocar na lista", "incluir na lista"]):
            # Extract items after keyword
            items_text = last_message
            for keyword in ["anota", "adicionar", "colocar na lista", "incluir na lista"]:
                if keyword in text_lower:
                    items_text = last_message.split(keyword, 1)[-1].strip()
                    break

            # Split by commas or "e"
            items_raw = re.split(r',|\be\b', items_text)
            items_raw = [i.strip() for i in items_raw if i.strip()]

            if not items_raw:
                return {"messages": [AIMessage(content="O que você quer anotar na lista? Ex: 'anota leite, pão, ovos'")]}

            sl = shop_repo.get_or_create_list(user_id)
            added = []
            for item_name in items_raw:
                item = ShoppingItem(shopping_list_id=sl.id, name=item_name)
                shop_repo.add_item(item)
                added.append(item_name)

            return {
                "messages": [AIMessage(content=f"✅ Adicionei à sua lista: {', '.join(added)}")]
            }

    return {"messages": [AIMessage(content="Posso gerenciar sua lista de compras. Diga 'anota leite, pão' ou 'ver lista'.")]}


def subscription_node(state: AgentState) -> Dict[str, Any]:
    """Handle subscription/fixed expense management."""
    last_message = state["messages"][-1].content
    user_id = state.get("user_id")
    text_lower = last_message.lower()

    with Session(engine) as session:
        sub_repo = SubscriptionRepository(session)

        # List subscriptions
        if any(k in text_lower for k in ["minhas assinaturas", "gastos fixos", "assinaturas ativas", "contas fixas"]):
            subs = sub_repo.get_by_user(user_id)
            if not subs:
                return {"messages": [AIMessage(content="Você ainda não registrou nenhuma assinatura ou gasto fixo.")]}
            lines = ["*Assinaturas e Gastos Fixos:*\n"]
            for s in subs:
                lines.append(f"📌 *{s.name}* - R${s.amount:,.2f}/{s.frequency}")
                lines.append(f"   Próximo vencimento: {s.next_due_date.strftime('%d/%m/%Y')}")
                lines.append("")
            return {"messages": [AIMessage(content="\n".join(lines))]}

        # Create subscription
        if any(k in text_lower for k in ["nova assinatura", "novo gasto fixo", "adicionar assinatura"]):
            amount_match = re.search(r'R?\$?\s*([\d.,]+)', last_message)
            if not amount_match:
                return {"messages": [AIMessage(content="Qual o valor da assinatura? Ex: 'Netflix 39,90 mensal'")]}
            amount_str = amount_match.group(1).replace('.', '').replace(',', '.')
            amount = float(amount_str)

            # Try to extract name (everything before amount)
            name = "Assinatura"
            before_amount = last_message[:last_message.find(amount_match.group(0))].strip()
            if before_amount:
                name = before_amount.split()[-1] if len(before_amount.split()) <= 3 else " ".join(before_amount.split()[-3:])

            frequency = "mensal"
            if "anual" in text_lower:
                frequency = "anual"
            elif "semanal" in text_lower:
                frequency = "semanal"

            sub = Subscription(
                user_id=user_id,
                name=name,
                amount=amount,
                category="Assinaturas",
                frequency=frequency,
                next_due_date=date.today() + timedelta(days=30)
            )
            sub_repo.create(sub)
            return {
                "messages": [AIMessage(content=f"✅ Assinatura *{name}* de R${amount:,.2f} ({frequency}) registrada!")]
            }

    return {"messages": [AIMessage(content="Posso gerenciar suas assinaturas e gastos fixos. O que você precisa?")]}


def custom_category_node(state: AgentState) -> Dict[str, Any]:
    """Handle custom category management."""
    last_message = state["messages"][-1].content
    user_id = state.get("user_id")
    text_lower = last_message.lower()

    with Session(engine) as session:
        cat_repo = CustomCategoryRepository(session)

        if any(k in text_lower for k in ["minhas categorias", "categorias personalizadas", "listar categorias"]):
            cats = cat_repo.get_by_user(user_id)
            if not cats:
                return {"messages": [AIMessage(content="Você ainda não criou categorias personalizadas.")]}
            lines = ["*Suas Categorias Personalizadas:*\n"]
            for c in cats:
                lines.append(f"• {c.name} ({'despesa' if c.category_type == 'expense' else 'receita'})")
            return {"messages": [AIMessage(content="\n".join(lines))]}

        if any(k in text_lower for k in ["nova categoria", "criar categoria", "adicionar categoria"]):
            # Extract name
            name_match = re.search(r'(?:nova categoria|criar categoria|adicionar categoria)\s+(.+)', last_message, re.IGNORECASE)
            name = name_match.group(1).strip() if name_match else None
            if not name:
                return {"messages": [AIMessage(content="Qual o nome da nova categoria? Ex: 'nova categoria Academia'")]}

            cat_type = "income" if any(k in text_lower for k in ["receita", "entrada"]) else "expense"
            cat = CustomCategory(user_id=user_id, name=name, category_type=cat_type)
            cat_repo.create(cat)
            return {
                "messages": [AIMessage(content=f"✅ Categoria *{name}* ({'receita' if cat_type == 'income' else 'despesa'}) criada!")]
            }

    return {"messages": [AIMessage(content="Posso criar categorias personalizadas para organizar melhor suas finanças.")]}
