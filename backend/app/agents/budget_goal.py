"""Budget and Goal agent nodes for BagCoin orchestrator.

These are individual nodes (functions) that handle budget/goal CRUD
and alerts, called from the LangGraph orchestrator.
Uses LLM for all data extraction — no fragile keyword rules.
"""
import logging
import re
from typing import Any
from datetime import datetime, date

from langchain_core.messages import HumanMessage, SystemMessage

from app.services.llm_service import get_llm, timed_invoke
from app.services.budget_service import (
    create_budget, get_budgets, create_goal, get_goals,
    check_budget_alerts, check_goal_alerts,
    delete_budget_by_name, update_budget_limit,
    delete_goal, update_goal, update_goal_progress,
    delete_all_budgets, set_financial_alerts_enabled,
)
from app.agents import responses as resp
from app.db.models.phone_conversation import PhoneConversation
from app.db.session import sync_session_maker
from app.agents.persistence import get_or_create_user

logger = logging.getLogger(__name__)


def _extract_with_llm(message: str, extraction_type: str) -> dict[str, Any]:
    """Use LLM to extract structured data from a user message.

    extraction_type: 'budget', 'goal', 'contribute', 'delete_budget', 'update_budget', 'update_goal'
    Returns dict with extracted fields.
    """
    prompts = {
        "budget": """Extraia dados de orçamento da mensagem.
Retorne APENAS JSON: {"name": "categoria", "total_limit": 3000.0, "period": "monthly"}
- name: a categoria/nome do orçamento (ex: alimentação, transporte)
- total_limit: valor numérico (número, sem R$)
- period: "monthly", "weekly", "daily" ou "yearly" (padrão: "monthly")
Se um campo não estiver na mensagem, omita do JSON.""",

        "goal": """Extraia dados de meta financeira da mensagem.
Retorne APENAS JSON: {"title": "viagem", "target_amount": 10000.0, "deadline": "12/2026"}
- title: o objetivo da meta
- target_amount: valor numérico
- deadline: prazo opcional no formato "MM/YYYY" ou "DD/MM/YYYY"
Se um campo não estiver na mensagem, omita do JSON.""",

        "contribute": """Extraia dados de contribuição para meta.
Retorne APENAS JSON: {"goal_identifier": "viagem", "amount": 500.0}
- goal_identifier: nome da meta ou número (ex: "viagem", "meta 1", "bike")
- amount: valor a adicionar
Se um campo não estiver na mensagem, omita do JSON.""",

        "delete_budget": """Extraia qual orçamento excluir.
Retorne APENAS JSON: {"name": "alimentação"} ou {"all": true} para excluir todos.
Se a mensagem disser "todos", "todas" ou "tudo", retorne {"all": true}.""",

        "update_budget": """Extraia dados para atualizar orçamento.
Retorne APENAS JSON: {"name": "alimentação", "total_limit": 4000.0}
- name: nome do orçamento a atualizar
- total_limit: novo valor do limite
Se um campo não estiver na mensagem, omita do JSON.""",

        "update_goal": """Extraia dados para atualizar meta.
Retorne APENAS JSON: {"goal_identifier": "viagem", "new_target": 12000.0, "new_title": null, "deadline": "06/2027"}
- goal_identifier: nome da meta
- new_target: novo valor total (opcional)
- new_title: novo nome (opcional)
- deadline: novo prazo (opcional, formato "MM/YYYY")
Se um campo não estiver na mensagem ou não houver alteração, omita do JSON.""",
    }

    system_prompt = prompts.get(extraction_type, prompts["budget"])
    llm = get_llm(temperature=0.1)

    if not llm:
        return {}

    try:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Mensagem do usuário: {message}"),
        ]
        response, latency_ms = timed_invoke(llm, messages, operation=f"extract_{extraction_type}")
        content = response.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        import json
        result = json.loads(content)
        logger.info(f"[extract_{extraction_type}] LLM extraiu em {latency_ms:.0f}ms: {result}")
        return result
    except Exception as e:
        logger.warning(f"[extract_{extraction_type}] LLM falhou: {e}")
        return {}


def _extract_number(text: str) -> float | None:
    """Extract the first numeric value from the message."""
    match = re.search(r"R?\$?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{1,2}|\d+(?:[.,]\d{1,2})?)", text)
    if match:
        s = match.group(1).replace(".", "").replace(",", ".")
        if s.count(".") > 1:
            parts = s.split(".")
            s = "".join(parts[:-1]) + "." + parts[-1]
        try:
            return float(s)
        except ValueError:
            pass
    return None


def _parse_budget_result(result: dict) -> dict:
    """Convert LLM extraction result to standard budget format."""
    data = {}
    if "name" in result:
        data["name"] = str(result["name"]).capitalize()
    if "total_limit" in result:
        try:
            data["total_limit"] = float(result["total_limit"])
        except (ValueError, TypeError):
            pass
    if "period" in result:
        data["period"] = result["period"]
    return data


def _parse_goal_result(result: dict) -> dict:
    """Convert LLM extraction result to standard goal format."""
    data = {}
    if "title" in result:
        data["title"] = str(result["title"]).capitalize()
    if "target_amount" in result:
        try:
            data["target_amount"] = float(result["target_amount"])
        except (ValueError, TypeError):
            pass
    if "deadline" in result:
        data["deadline"] = str(result["deadline"])
    return data


# =====================================================================
# Orchestrator Nodes
# =====================================================================


def create_budget_node(state: dict[str, Any]) -> dict[str, Any]:
    """Create budget node (single-turn, not wizard)."""
    message = state.get("message", "")
    phone_number = state.get("phone_number", "")

    try:
        extracted = _extract_with_llm(message, "budget")
        amount = extracted.get("total_limit") or _extract_number(message)
        if amount is None:
            state["error"] = "Não consegui identificar o valor do orçamento. Pode repetir com o valor? Ex: 'Orçamento de R$ 3000 para alimentação'"
            return state

        period = extracted.get("period", "monthly")
        name = extracted.get("name", "Geral")

        budget = create_budget(
            phone_number=phone_number,
            name=name,
            total_limit=float(amount),
            period=period,
        )

        state["budget_data"] = budget
        state["response"] = resp.budget_created(budget["name"], budget["total_limit"], budget["period"])
        logger.info(f"Budget created: {budget['id']} — {budget['name']}")

    except Exception as e:
        logger.error(f"Error creating budget: {e}")
        state["error"] = f"Erro ao criar orçamento: {str(e)}"

    return state


def create_goal_node(state: dict[str, Any]) -> dict[str, Any]:
    """Create goal node (single-turn, not wizard)."""
    message = state.get("message", "")
    phone_number = state.get("phone_number", "")

    try:
        extracted = _extract_with_llm(message, "goal")
        amount = extracted.get("target_amount") or _extract_number(message)
        if amount is None:
            state["error"] = "Não consegui identificar o valor da meta. Pode repetir? Ex: 'Meta de R$ 10000 para viagem'"
            return state

        title = extracted.get("title", "Reserva")
        deadline = extracted.get("deadline")
        deadline_date = None
        if deadline:
            try:
                m = re.search(r"(\d{1,2})/(\d{4})", str(deadline))
                if m:
                    from datetime import date
                    deadline_date = date(int(m.group(2)), int(m.group(1)), 1)
            except Exception:
                pass

        goal = create_goal(
            phone_number=phone_number,
            title=title,
            target_amount=float(amount),
            deadline=deadline_date,
        )

        state["goal_data"] = goal
        state["response"] = resp.goal_created(goal["title"], goal["target_amount"], goal.get("deadline"))
        logger.info(f"Goal created: {goal['id']} — {goal['title']}")

    except Exception as e:
        logger.error(f"Error creating goal: {e}")
        state["error"] = f"Erro ao criar meta: {str(e)}"

    return state


def check_alerts_node(state: dict[str, Any]) -> dict[str, Any]:
    """Check alerts node — called after expense registration.

    Filters alerts for budgets matching transaction category.
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
        logger.error(f"Error checking alerts: {e}")
        state["alerts"] = []

    return state


def query_budgets_node(state: dict[str, Any]) -> dict[str, Any]:
    """Query budgets/goals node — LLM entende o contexto."""
    message = state.get("message", "")
    phone_number = state.get("phone_number", "")
    msg_lower = message.lower()

    try:
        # Usa LLM para entender se quer orçamentos, metas ou ambos
        llm = get_llm(temperature=0.1)
        wants_budgets = True
        wants_goals = True

        if llm:
            prompt = """Determine o que o usuário quer consultar.
Responda APENAS JSON: {"budgets": true/false, "goals": true/false}
Exemplos:
"Meus orçamentos" → {"budgets": true, "goals": false}
"Minhas metas" → {"budgets": false, "goals": true}
"Quero ver tudo" → {"budgets": true, "goals": true}
"Mostra meus limites" → {"budgets": true, "goals": false}
"Qual minha meta viagem" → {"budgets": false, "goals": true}"""
            try:
                msgs = [SystemMessage(content=prompt), HumanMessage(content=message)]
                r, _ = timed_invoke(llm, msgs, operation="query_type")
                import json
                result = json.loads(r.content.strip().replace("```json", "").replace("```", "").strip())
                wants_budgets = result.get("budgets", True)
                wants_goals = result.get("goals", True)
            except Exception:
                # Fallback: se mencionar orçamento, mostra orçamentos
                wants_budgets = any(w in msg_lower for w in ["orcamento", "orcamentos", "budget", "limite"])
                wants_goals = any(w in msg_lower for w in ["meta", "metas", "objetivo", "objetivos", "goal"])

        response_parts = []
        if wants_budgets:
            budgets = get_budgets(phone_number)
            response_parts.append(resp.budget_list(budgets))
        if wants_goals:
            goals = get_goals(phone_number)
            response_parts.append(resp.goal_list(goals))

        if response_parts:
            state["response"] = "\n\n".join([p for p in response_parts if p.strip()])
        else:
            state["response"] = "Posso mostrar seus orçamentos ou metas. O que deseja ver?"

    except Exception as e:
        logger.error(f"Error querying budgets/goals: {e}")
        state["error"] = f"Erro ao buscar dados: {str(e)}"

    return state


def delete_budget_node(state: dict[str, Any]) -> dict[str, Any]:
    """Delete budget node — suporta exclusão por nome ou todos."""
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    try:
        extracted = _extract_with_llm(message, "delete_budget")
        if extracted.get("all"):
            count = delete_all_budgets(phone_number)
            if count > 0:
                state["response"] = f"Pronto. {count} orçamento(s) removido(s)."
            else:
                state["response"] = "Você não tinha nenhum orçamento para remover."
        else:
            name = extracted.get("name")
            if not name:
                budgets = get_budgets(phone_number)
                if budgets:
                    state["response"] = "Qual orçamento você quer excluir? " + ", ".join([b["name"] for b in budgets])
                else:
                    state["response"] = "Você não tem orçamentos para excluir."
                return state
            count = delete_budget_by_name(phone_number, name)
            if count > 0:
                state["response"] = f"Orçamento '{name}' removido."
            else:
                state["response"] = f"Não encontrei um orçamento chamado '{name}'."
    except Exception as e:
        logger.error(f"Error deleting budgets: {e}")
        state["error"] = f"Erro ao excluir orçamentos: {str(e)}"
    return state


def toggle_alerts_node(state: dict[str, Any]) -> dict[str, Any]:
    """Toggle alerts node — persists in user preferences."""
    phone_number = state.get("phone_number", "")
    msg_lower = state.get("message", "").lower()
    try:
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
        logger.error(f"Error persisting alert preference: {e}")
        state["error"] = "Não consegui atualizar suas preferências de alerta. Tente novamente."
    return state


def update_budget_node(state: dict[str, Any]) -> dict[str, Any]:
    """Update budget node (limit)."""
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    try:
        extracted = _extract_with_llm(message, "update_budget")
        amount = extracted.get("total_limit")
        name = extracted.get("name")
        if not name:
            budgets = get_budgets(phone_number)
            if len(budgets) == 1:
                name = budgets[0]["name"]
            else:
                state["response"] = "Qual orçamento quer atualizar? " + ", ".join([b["name"] for b in budgets])
                return state
        if amount is None:
            state["response"] = "Qual o novo limite? Ex: 'mudar orçamento de alimentação para 4000'"
            return state
        result = update_budget_limit(phone_number, name, float(amount))
        if result:
            state["response"] = resp.budget_created(result["name"], result["total_limit"], result["period"], updated=True)
        else:
            state["response"] = f"Não encontrei o orçamento '{name}'."
    except Exception as e:
        logger.error(f"Error updating budget: {e}")
        state["error"] = f"Erro ao atualizar orçamento: {str(e)}"
    return state


def contribute_goal_node(state: dict[str, Any]) -> dict[str, Any]:
    """Contribute to goal node ('guardei X para Y')."""
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    try:
        extracted = _extract_with_llm(message, "contribute")
        amount = extracted.get("amount") or _extract_number(message)
        if amount is None:
            state["response"] = "Qual valor quer adicionar à meta? Ex: 'guardei 200 na meta viagem'"
            return state
        goals = get_goals(phone_number)
        if not goals:
            state["response"] = "Você ainda não tem metas. Para criar uma, mande algo como: 'Meta de R$ 5000 para viagem'"
            return state
        identifier = extracted.get("goal_identifier", "")
        target_goal = None
        for g in goals:
            if identifier.lower() in g["title"].lower():
                target_goal = g
                break
        if not target_goal and identifier:
            try:
                idx = int(identifier) - 1
                if 0 <= idx < len(goals):
                    target_goal = goals[idx]
            except ValueError:
                pass
        if not target_goal:
            if len(goals) == 1:
                target_goal = goals[0]
            else:
                state["response"] = (
                    "Não entendi qual meta. Suas metas:\n"
                    + "\n".join([f"• {i+1}. {g['title']} (R$ {g['target_amount']:,.2f})" for i, g in enumerate(goals)])
                    + "\n\nQual delas quer atualizar?"
                )
                return state
        result = update_goal_progress(phone_number, target_goal["id"], float(amount))
        progress_bar = _progress_bar(result["percentage"])
        state["response"] = (
            f"✨ Guardado na meta **{result['title']}**!\n\n"
            f"Adicionado: R$ {float(amount):,.2f}\n"
            f"Progresso: R$ {result['current_amount']:,.2f} / R$ {result['target_amount']:,.2f}\n"
            f"{progress_bar} {result['percentage']}%"
        )
        if result.get("status") == "completed":
            state["response"] += "\n\n🎉 **Meta concluída!** Parabéns!"
    except Exception as e:
        logger.error(f"Error contributing to goal: {e}")
        state["error"] = f"Erro ao atualizar meta: {str(e)}"
    return state


def _progress_bar(percentage: float, width: int = 10) -> str:
    """Generate a simple progress bar string."""
    filled = min(int(percentage / 100 * width), width)
    empty = width - filled
    return "█" * filled + "░" * empty


def delete_goal_node(state: dict[str, Any]) -> dict[str, Any]:
    """Delete goal node."""
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    try:
        extracted = _extract_with_llm(message, "contribute")  # reuse contribute prompt
        identifier = extracted.get("goal_identifier", "")
        if delete_goal(phone_number, identifier):
            state["response"] = f"✅ Meta '{identifier}' removida."
        else:
            goals = get_goals(phone_number)
            if not goals:
                state["response"] = "Você não tem metas para remover."
            else:
                state["response"] = (
                    f"Não encontrei a meta '{identifier}'. Suas metas:\n"
                    + "\n".join([f"• {i+1}. {g['title']} (R$ {g['target_amount']:,.2f})" for i, g in enumerate(goals)])
                )
    except Exception as e:
        logger.error(f"Error deleting goal: {e}")
        state["error"] = f"Erro ao excluir meta: {str(e)}"
    return state


def update_goal_node(state: dict[str, Any]) -> dict[str, Any]:
    """Update goal node (title, value, deadline)."""
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    try:
        extracted = _extract_with_llm(message, "update_goal")
        identifier = extracted.get("goal_identifier", "")
        if not identifier:
            goals = get_goals(phone_number)
            if goals:
                state["response"] = "Qual meta você quer atualizar?\n" + "\n".join([f"• {i+1}. {g['title']}" for i, g in enumerate(goals)])
            else:
                state["response"] = "Você não tem metas para atualizar."
            return state
        amount = extracted.get("new_target") or _extract_number(message)
        title = extracted.get("new_title")
        deadline = extracted.get("deadline")
        deadline_date = None
        if deadline:
            try:
                m = re.search(r"(\d{1,2})/(\d{4})", str(deadline))
                if m:
                    deadline_date = date(int(m.group(2)), int(m.group(1)), 1)
            except Exception:
                pass
        result = update_goal(phone_number, identifier, new_target=float(amount) if amount else None, new_title=title, new_deadline=deadline_date)
        if result:
            progress_bar = _progress_bar(result["percentage"])
            dl = f" | Prazo: {result['deadline'][:10]}" if result.get("deadline") else ""
            state["response"] = (
                f"✅ Meta atualizada!\n\n"
                f"**{result['title']}**\n"
                f"Valor: R$ {result['target_amount']:,.2f}\n"
                f"{progress_bar} {result['percentage']}%{dl}"
            )
        else:
            goals = get_goals(phone_number)
            state["response"] = (
                f"Não encontrei a meta. Suas metas:\n"
                + "\n".join([f"• {i+1}. {g['title']}" for i, g in enumerate(goals)])
            )
    except Exception as e:
        logger.error(f"Error updating goal: {e}")
        state["error"] = f"Erro ao atualizar meta: {str(e)}"
    return state


def delete_transaction_node(state: dict[str, Any]) -> dict[str, Any]:
    """Delete transaction node."""
    from app.agents.persistence import get_or_create_user, delete_transaction_by_id
    from app.db.session import sync_session_maker
    from app.db.models.transaction import Transaction

    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        conv = db.query(PhoneConversation).filter(
            PhoneConversation.user_id == user.id,
        ).order_by(PhoneConversation.updated_at.desc()).first()
        tx_id = None
        if conv and conv.context_json:
            tx_id = conv.context_json.get("last_transaction_id")
        amount_match = re.search(r"\d+", message)
        if amount_match:
            explicit_id = int(amount_match.group())
            tx_check = db.query(Transaction).filter(
                Transaction.id == explicit_id,
                Transaction.user_id == user.id,
            ).first()
            if tx_check:
                tx_id = explicit_id
        if not tx_id:
            last_tx = db.query(Transaction).filter(
                Transaction.user_id == user.id,
            ).order_by(Transaction.transaction_date.desc()).first()
            if last_tx:
                tx_id = last_tx.id
        if tx_id:
            if delete_transaction_by_id(phone_number, tx_id):
                state["response"] = "Transação removida."
            else:
                state["response"] = "Não encontrei a transação para remover."
        else:
            state["response"] = "Não encontrei transações para remover."
    except Exception as e:
        logger.error(f"Error deleting transaction: {e}")
        state["error"] = f"Erro ao excluir transação: {str(e)}"
    finally:
        db.close()
    return state


def update_transaction_node(state: dict[str, Any]) -> dict[str, Any]:
    """Update transaction node (correct value, description, or category)."""
    from app.agents.persistence import get_or_create_user, update_transaction
    from app.db.session import sync_session_maker
    from app.db.models.transaction import Transaction

    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        conv = db.query(PhoneConversation).filter(
            PhoneConversation.user_id == user.id,
        ).order_by(PhoneConversation.updated_at.desc()).first()
        tx_id = None
        if conv and conv.context_json:
            tx_id = conv.context_json.get("last_transaction_id")
        amount = _extract_number(message)
        desc = None
        desc_patterns = [
            r"(?:para|em|no|na|de)\s+(.+?)$",
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
                    + (f" — {result['description']}" if result.get("description") else "")
                    + (f" ({result['category']})" if result.get("category") else "")
                )
            else:
                state["response"] = "Não encontrei a transação para atualizar."
        else:
            state["response"] = "Não encontrei transações recentes para atualizar."
    except Exception as e:
        logger.error(f"Error updating transaction: {e}")
        state["error"] = f"Erro ao atualizar transação: {str(e)}"
    finally:
        db.close()
    return state
