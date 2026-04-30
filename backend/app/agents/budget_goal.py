import logging
import re
import unicodedata
from typing import Dict, Any, Optional
from datetime import datetime, date
from app.services.budget_service import (
    create_budget, get_budgets, create_goal, get_goals,
    check_budget_alerts, check_goal_alerts,
    delete_budget_by_name, update_budget_limit,
    delete_goal, update_goal, update_goal_progress
)
from app.agents import responses as resp
from app.models.models import Conversation

logger = logging.getLogger(__name__)


def _extract_number(text: str) -> float | None:
    """Extrai o primeiro valor numérico da mensagem."""
    match = re.search(r'R?\$?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{1,2}|\d+(?:[.,]\d{1,2})?)', text)
    if match:
        s = match.group(1).replace('.', '').replace(',', '.')
        if s.count('.') > 1:
            parts = s.split('.')
            s = ''.join(parts[:-1]) + '.' + parts[-1]
        try:
            return float(s)
        except ValueError:
            pass
    return None


def _extract_period(text: str) -> str:
    """Extrai período da mensagem."""
    t = text.lower()
    if any(w in t for w in ["semana", "semanal"]):
        return "weekly"
    if any(w in t for w in ["dia", "diario", "diária", "hoje"]):
        return "daily"
    if any(w in t for w in ["ano", "anual"]):
        return "yearly"
    return "monthly"


def _extract_deadline(text: str) -> date | None:
    """Tenta extrair data de deadline."""
    m = re.search(r'(\d{2}/\d{2}/\d{4})', text)
    if m:
        try:
            return datetime.strptime(m.group(1), "%d/%m/%Y").date()
        except ValueError:
            pass
    m = re.search(r'(\d{4}-\d{2}-\d{2})', text)
    if m:
        try:
            return datetime.strptime(m.group(1), "%Y-%m-%d").date()
        except ValueError:
            pass
    return None


def _extract_budget_name(text: str) -> str:
    """Tenta extrair nome do orçamento da mensagem."""
    t = text.lower()
    t_clean = re.sub(r'r?\$\s*\d{1,3}(?:[.,]\d{3})*[.,]?\d*', '', t)
    t_clean = re.sub(r'\s+', ' ', t_clean).strip()

    patterns = [
        r'(?:orcamento|limite|budget)\s+(?:de\s+)?(?:para\s+)?["\']?(.+?)["\']?(?:\s+|$)',
        r'(?:para\s+)["\']?(.+?)["\']?(?:\s+|$)',
    ]
    for pat in patterns:
        m = re.search(pat, t_clean)
        if m:
            name = m.group(1).strip()
            name = re.sub(r'^(de|para)\s+', '', name, flags=re.IGNORECASE)
            if name and len(name) > 1:
                return name.capitalize()

    categories = ["alimentação", "transporte", "moradia", "lazer", "saúde", "educação", "vestuário", "tecnologia", "assinaturas", "pet"]
    for cat in categories:
        if cat in t:
            return cat.capitalize()
    return "Geral"


def _extract_goal_title(text: str) -> str:
    """Tenta extrair título da meta."""
    t = text.lower()
    t_clean = re.sub(r'r?\$\s*\d{1,3}(?:[.,]\d{3})*[.,]?\d*', '', t)
    t_clean = re.sub(r'\s+', ' ', t_clean).strip()

    patterns = [
        r'(?:meta|objetivo|guardar|juntar)\s+(?:de\s+)?(?:para\s+)?["\']?(.+?)["\']?(?:\s+|$)',
        r'(?:para\s+)["\']?(.+?)["\']?(?:\s+|$)',
    ]
    for pat in patterns:
        m = re.search(pat, t_clean)
        if m:
            name = m.group(1).strip()
            name = re.sub(r'^(de|para)\s+', '', name, flags=re.IGNORECASE)
            if name and len(name) > 1:
                return name.capitalize()
    return "Reserva"


# =====================================================================
# Nós do Orquestrador
# =====================================================================

def create_budget_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de criação de orçamento (single-turn, não wizard)."""
    message = state.get("message", "")
    phone_number = state.get("phone_number", "")

    try:
        amount = _extract_number(message)
        if amount is None:
            state["error"] = "Não consegui identificar o valor do orçamento. Pode repetir com o valor? Ex: 'Orçamento de R$ 3000 para alimentação'"
            return state

        period = _extract_period(message)
        name = _extract_budget_name(message)

        budget = create_budget(
            phone_number=phone_number,
            name=name,
            total_limit=amount,
            period=period
        )

        state["budget_data"] = budget
        state["response"] = resp.budget_created(budget['name'], budget['total_limit'], budget['period'])
        logger.info(f"Budget criado: {budget['id']} — {budget['name']}")

    except Exception as e:
        logger.error(f"Erro ao criar budget: {e}")
        state["error"] = f"Erro ao criar orçamento: {str(e)}"

    return state


def create_goal_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de criação de meta financeira (single-turn, não wizard)."""
    message = state.get("message", "")
    phone_number = state.get("phone_number", "")

    try:
        amount = _extract_number(message)
        if amount is None:
            state["error"] = "Não consegui identificar o valor da meta. Pode repetir? Ex: 'Meta de R$ 10000 para viagem'"
            return state

        title = _extract_goal_title(message)
        deadline = _extract_deadline(message)

        goal = create_goal(
            phone_number=phone_number,
            title=title,
            target_amount=amount,
            deadline=deadline
        )

        state["goal_data"] = goal
        state["response"] = resp.goal_created(goal['title'], goal['target_amount'], goal.get('deadline'))
        logger.info(f"Goal criada: {goal['id']} — {goal['title']}")

    except Exception as e:
        logger.error(f"Erro ao criar goal: {e}")
        state["error"] = f"Erro ao criar meta: {str(e)}"

    return state


def check_alerts_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de verificação de alertas — chamado após registro de despesa.
    
    Filtra alertas apenas para budgets cuja categoria bate com a da transação.
    """
    phone_number = state.get("phone_number", "")
    category_id = state.get("category_id")

    try:
        budget_alerts = check_budget_alerts(phone_number)
        if category_id:
            budget_alerts = [a for a in budget_alerts if a.get("budget_name") or a.get("category")]
        goal_alerts = check_goal_alerts(phone_number)
        state["alerts"] = budget_alerts + goal_alerts
    except Exception as e:
        logger.error(f"Erro ao verificar alertas: {e}")
        state["alerts"] = []

    return state


def query_budgets_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de consulta de orçamentos/metas."""
    message = state.get("message", "")
    phone_number = state.get("phone_number", "")
    msg_lower = message.lower()
    import unicodedata
    msg_norm = unicodedata.normalize('NFKD', msg_lower).encode('ASCII', 'ignore').decode('ASCII')

    try:
        if any(w in msg_norm for w in ["orcamento", "orcamentos", "budget", "limite"]):
            budgets = get_budgets(phone_number)
            state["response"] = resp.budget_list(budgets)
            return state

        elif any(w in msg_norm for w in ["meta", "metas", "objetivo", "objetivos", "goal"]):
            goals = get_goals(phone_number)
            state["response"] = resp.goal_list(goals)
            return state

        else:
            state["response"] = "Posso mostrar seus orçamentos ou metas. O que deseja ver?"

    except Exception as e:
        logger.error(f"Erro ao consultar budgets/goals: {e}")
        state["error"] = f"Erro ao buscar dados: {str(e)}"

    return state


def delete_budget_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de exclusão de orçamentos — suporta exclusão por nome ou todos."""
    phone_number = state.get("phone_number", "")
    message = state.get("message", "").lower()
    msg_norm = unicodedata.normalize('NFKD', message).encode('ASCII', 'ignore').decode('ASCII')
    try:
        all_words = ["todos", "todas", "tudo", "excluir todos", "apagar todos"]
        if any(w in msg_norm for w in all_words) or not _extract_budget_name(state.get("message", "")):
            from app.services.budget_service import delete_all_budgets
            count = delete_all_budgets(phone_number)
            if count > 0:
                state["response"] = f"Pronto. {count} orçamento(s) removido(s)."
            else:
                state["response"] = "Você não tinha nenhum orçamento para remover."
        else:
            name = _extract_budget_name(state.get("message", ""))
            count = delete_budget_by_name(phone_number, name)
            if count > 0:
                state["response"] = f"Orçamento '{name}' removido."
            else:
                state["response"] = f"Não encontrei um orçamento chamado '{name}'."
    except Exception as e:
        logger.error(f"Erro ao excluir budgets: {e}")
        state["error"] = f"Erro ao excluir orçamentos: {str(e)}"
    return state


def toggle_alerts_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de ativar/desativar alertas (persistido em user.preferences)."""
    phone_number = state.get("phone_number", "")
    msg_lower = state.get("message", "").lower()
    try:
        from app.services.budget_service import set_financial_alerts_enabled

        disable_words = ["desativar", "desligar", "silenciar", "pausar"]
        if any(w in msg_lower for w in disable_words):
            set_financial_alerts_enabled(phone_number, False)
            state["response"] = (
                "Alertas desativados. Você não receberá mais notificações de orçamento "
                "nem lembretes de metas após registrar gastos."
            )
        else:
            set_financial_alerts_enabled(phone_number, True)
            state["response"] = (
                "Alertas ativados. Vou te avisar quando seus orçamentos atingirem 80% e 100% "
                "e sobre metas com prazo próximo."
            )
    except Exception as e:
        logger.error(f"Erro ao persistir preferência de alertas: {e}")
        state["error"] = "Não consegui atualizar suas preferências de alerta. Tente novamente."
    return state


def update_budget_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de atualização de orçamento (limite)."""
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    try:
        amount = _extract_number(message)
        name = _extract_budget_name(message)
        if not name or name == "Geral":
            budgets = get_budgets(phone_number)
            if len(budgets) == 1:
                name = budgets[0]["name"]
            else:
                state["response"] = "Qual orçamento quer atualizar? " + ", ".join([b["name"] for b in budgets])
                return state
        if amount is None:
            state["response"] = "Qual o novo limite? Ex: 'mudar orçamento de alimentação para 4000'"
            return state
        result = update_budget_limit(phone_number, name, amount)
        if result:
            state["response"] = resp.budget_created(result["name"], result["total_limit"], result["period"])
        else:
            state["response"] = f"Não encontrei o orçamento '{name}'."
    except Exception as e:
        logger.error(f"Erro ao atualizar budget: {e}")
        state["error"] = f"Erro ao atualizar orçamento: {str(e)}"
    return state


def contribute_goal_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de contribuição a meta ('guardei X para Y')."""
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    try:
        amount = _extract_number(message)
        if amount is None:
            state["response"] = "Qual valor quer adicionar à meta? Ex: 'guardei 200 na meta viagem'"
            return state
        goals = get_goals(phone_number)
        if not goals:
            state["response"] = "Você ainda não tem metas. Para criar uma, mande algo como: 'Meta de R$ 5000 para viagem'"
            return state
        title = _extract_goal_title(message)
        target_goal = None
        for g in goals:
            if title.lower() in g["title"].lower():
                target_goal = g
                break
        if not target_goal and title != "Reserva":
            try:
                idx = int(title) - 1
                if 0 <= idx < len(goals):
                    target_goal = goals[idx]
            except ValueError:
                pass
        if not target_goal:
            if len(goals) == 1:
                target_goal = goals[0]
            else:
                state["response"] = (
                    "Não encontrei a meta. Suas metas:\n" +
                    "\n".join([f"{i+1}. {g['title']}" for i, g in enumerate(goals)]) +
                    "\n\nQual delas?"
                )
                return state
        result = update_goal_progress(phone_number, target_goal["id"], amount)
        state["response"] = (
            f"Meta atualizada!\n\n"
            f"Meta: {result['title']}\n"
            f"Adicionado: R$ {amount:,.2f}\n"
            f"Progresso: R$ {result['current_amount']:,.2f} / R$ {result['target_amount']:,.2f} ({result['percentage']}%)"
        )
    except Exception as e:
        logger.error(f"Erro ao contribuir à meta: {e}")
        state["error"] = f"Erro ao atualizar meta: {str(e)}"
    return state


def delete_goal_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de exclusão de meta."""
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    try:
        title = _extract_goal_title(message)
        if delete_goal(phone_number, title):
            state["response"] = f"Meta '{title}' removida."
        else:
            goals = get_goals(phone_number)
            if not goals:
                state["response"] = "Você não tem metas para remover."
            else:
                state["response"] = (
                    f"Não encontrei a meta '{title}'. Suas metas:\n" +
                    "\n".join([f"{i+1}. {g['title']}" for i, g in enumerate(goals)])
                )
    except Exception as e:
        logger.error(f"Erro ao excluir meta: {e}")
        state["error"] = f"Erro ao excluir meta: {str(e)}"
    return state


def update_goal_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de atualização de meta (título, valor, prazo)."""
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    try:
        amount = _extract_number(message)
        title = _extract_goal_title(message)
        deadline = _extract_deadline(message)
        result = update_goal(phone_number, title, new_target=amount, new_title=None, new_deadline=deadline)
        if result:
            dl = f" | Prazo: {result['deadline'][:10]}" if result.get("deadline") else ""
            state["response"] = (
                f"Meta atualizada!\n\n"
                f"Meta: {result['title']}\n"
                f"Valor: R$ {result['target_amount']:,.2f}\n"
                f"Progresso: {result['percentage']}%{dl}"
            )
        else:
            goals = get_goals(phone_number)
            state["response"] = (
                f"Não encontrei a meta. Suas metas:\n" +
                "\n".join([f"{i+1}. {g['title']}" for i, g in enumerate(goals)])
            )
    except Exception as e:
        logger.error(f"Erro ao atualizar meta: {e}")
        state["error"] = f"Erro ao atualizar meta: {str(e)}"
    return state


def delete_transaction_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de exclusão de transação."""
    from app.agents.persistence import get_or_create_user
    from app.database import SessionLocal
    from app.models.models import Transaction
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        conv = db.query(Conversation).filter(
            Conversation.user_id == user.id
        ).order_by(Conversation.updated_at.desc()).first()
        tx_id = None
        if conv and conv.context_json:
            tx_id = conv.context_json.get("last_transaction_id")
        amount_match = re.search(r'\d+', message)
        if amount_match:
            explicit_id = int(amount_match.group())
            tx_check = db.query(Transaction).filter(
                Transaction.id == explicit_id,
                Transaction.user_id == user.id
            ).first()
            if tx_check:
                tx_id = explicit_id
        if not tx_id:
            last_tx = db.query(Transaction).filter(
                Transaction.user_id == user.id
            ).order_by(Transaction.transaction_date.desc()).first()
            if last_tx:
                tx_id = last_tx.id
        if tx_id:
            from app.agents.persistence import delete_transaction_by_id
            if delete_transaction_by_id(phone_number, tx_id):
                state["response"] = "Transação removida."
            else:
                state["response"] = "Não encontrei a transação para remover."
        else:
            state["response"] = "Não encontrei transações para remover."
    except Exception as e:
        logger.error(f"Erro ao deletar transação: {e}")
        state["error"] = f"Erro ao excluir transação: {str(e)}"
    finally:
        db.close()
    return state


def update_transaction_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de atualização de transação (corrigir valor, descrição ou categoria)."""
    from app.agents.persistence import get_or_create_user, update_transaction
    from app.database import SessionLocal
    from app.models.models import Transaction
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        conv = db.query(Conversation).filter(
            Conversation.user_id == user.id
        ).order_by(Conversation.updated_at.desc()).first()
        tx_id = None
        if conv and conv.context_json:
            tx_id = conv.context_json.get("last_transaction_id")
        amount = _extract_number(message)
        amount = amount if amount else None
        desc = None
        desc_patterns = [
            r'(?:para|em|no|na|de)\s+(.+?)$',
        ]
        for p in desc_patterns:
            m = re.search(p, message, re.IGNORECASE)
            if m:
                desc = m.group(1).strip().capitalize()
                break
        category = None
        for cat, words in {
            "Alimentação": ["mercado", "supermercado", "padaria", "feira"],
            "Transporte": ["uber", "gasolina", "ônibus", "metrô"],
            "Moradia": ["aluguel", "condomínio"],
            "Saúde": ["farmácia", "médico", "dentista"],
            "Lazer": ["cinema", "netflix", "spotify"],
        }.items():
            if any(w in message.lower() for w in words):
                category = cat
                break
        if tx_id:
            result = update_transaction(phone_number, tx_id, amount=amount, description=desc, category_name=category)
            if result:
                state["response"] = (
                    f"Transação atualizada!\n"
                    f"Valor: R$ {result['amount']:,.2f}"
                    + (f" — {result['description']}" if result.get('description') else "")
                    + (f" ({result['category']})" if result.get('category') else "")
                )
            else:
                state["response"] = "Não encontrei a transação para atualizar."
        else:
            state["response"] = "Não encontrei uma transação recente para corrigir. Tente enviar a correção logo após registrar."
    except Exception as e:
        logger.error(f"Erro ao atualizar transação: {e}")
        state["error"] = f"Erro ao atualizar transação: {str(e)}"
    finally:
        db.close()
    return state
