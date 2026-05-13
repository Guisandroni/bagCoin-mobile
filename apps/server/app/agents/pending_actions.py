"""Pending action storage and execution for chat confirmations."""

from __future__ import annotations

import logging
import unicodedata
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from sqlalchemy.orm.attributes import flag_modified

from app.agents import responses as resp
from app.agents.persistence import (
    create_category as persistence_create_category,
    delete_category as persistence_delete_category,
    delete_transaction_by_id,
    get_or_create_user,
    get_user_transactions,
    list_categories as persistence_list_categories,
    rename_category as persistence_rename_category,
    save_transaction,
    update_transaction as persistence_update_transaction,
)
from app.db.models.phone_conversation import PhoneConversation
from app.db.session import sync_session_maker
from app.services.budget_service import (
    create_budget,
    create_goal,
    delete_budget_by_name,
    delete_goal,
    get_goals,
    update_budget_limit,
    update_goal,
    update_goal_progress,
)

logger = logging.getLogger(__name__)

PENDING_KEY = "pending_tool_action"
PENDING_TTL_MINUTES = 15


def _normalize_text(text: str) -> str:
    return unicodedata.normalize("NFKD", text.lower()).encode("ASCII", "ignore").decode("ASCII")


def _get_conversation(phone_number: str):
    db = sync_session_maker()
    user = get_or_create_user(phone_number, db)
    conv = (
        db.query(PhoneConversation)
        .filter(PhoneConversation.user_id == user.id)
        .order_by(PhoneConversation.updated_at.desc())
        .first()
    )
    if not conv:
        conv = PhoneConversation(user_id=user.id, channel="whatsapp", context_json={})
        db.add(conv)
        db.flush()
    return db, conv


def save_pending_action(
    phone_number: str,
    *,
    action: str,
    params: dict[str, Any],
    summary: str,
    channel: str = "whatsapp",
) -> str:
    """Store a pending action and return the confirmation text."""
    db, conv = _get_conversation(phone_number)
    try:
        context = dict(conv.context_json or {})
        context[PENDING_KEY] = {
            "action": action,
            "params": params,
            "summary": summary,
            "channel": channel,
            "status": "pending",
            "created_at": datetime.now(UTC).isoformat(),
        }
        conv.context_json = context
        flag_modified(conv, "context_json")
        db.commit()
        logger.info("[pending_action] created action=%s phone=%s", action, phone_number)
        return f"{summary}\n\nConfirma?"
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def load_pending_action(phone_number: str) -> dict[str, Any] | None:
    db, conv = _get_conversation(phone_number)
    try:
        pending = (conv.context_json or {}).get(PENDING_KEY)
        if not pending or pending.get("status") != "pending":
            return None
        created_raw = pending.get("created_at")
        try:
            created_at = datetime.fromisoformat(str(created_raw).replace("Z", "+00:00"))
        except ValueError:
            created_at = datetime.now(UTC)
        if datetime.now(UTC) - created_at > timedelta(minutes=PENDING_TTL_MINUTES):
            clear_pending_action(phone_number)
            return None
        return dict(pending)
    finally:
        db.close()


def clear_pending_action(phone_number: str) -> None:
    db, conv = _get_conversation(phone_number)
    try:
        context = dict(conv.context_json or {})
        context.pop(PENDING_KEY, None)
        conv.context_json = context
        flag_modified(conv, "context_json")
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def pending_confirmation_decision(message: str) -> Literal["confirm", "cancel"] | None:
    """Interpret short confirmation/cancel messages only after a pending action exists."""
    msg = _normalize_text(message).strip(" .,!?\n\t")
    if msg.startswith(("sim ", "ok ", "pode ")):
        return "confirm"
    confirm_values = {
        "sim",
        "s",
        "ok",
        "pode",
        "confirmo",
        "confirmar",
        "isso",
        "isso mesmo",
        "correto",
        "ta certo",
        "esta certo",
        "manda",
        "sim registre",
        "sim importar",
        "sim importe",
        "registre",
        "importe",
    }
    cancel_values = {
        "nao",
        "n",
        "cancelar",
        "cancela",
        "cancele",
        "deixa",
        "deixa quieto",
        "esquece",
        "errado",
    }
    if msg in confirm_values:
        return "confirm"
    if msg in cancel_values:
        return "cancel"
    return None


def has_pending_confirmation_message(phone_number: str, message: str) -> bool:
    return load_pending_action(phone_number) is not None and pending_confirmation_decision(message) is not None


def handle_pending_confirmation(phone_number: str, message: str) -> str | None:
    pending = load_pending_action(phone_number)
    if not pending:
        return None
    decision = pending_confirmation_decision(message)
    if decision == "cancel":
        clear_pending_action(phone_number)
        return "Combinado, nao executei essa acao."
    if decision != "confirm":
        return None
    try:
        response = execute_pending_action(phone_number, pending)
        clear_pending_action(phone_number)
        return response
    except Exception as exc:
        logger.exception("[pending_action] execution failed")
        clear_pending_action(phone_number)
        return f"Nao consegui executar essa acao: {exc}"


def _money(value: Any) -> str:
    try:
        return f"R$ {float(value):,.2f}"
    except (TypeError, ValueError):
        return "R$ 0,00"


def _parse_date(value: Any):
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(str(value), fmt).date()
        except ValueError:
            continue
    return None


def _find_transaction_id(phone_number: str, description: str | None = None) -> int | None:
    txs = get_user_transactions(phone_number, limit=10)
    if description:
        desc_norm = _normalize_text(description)
        for tx in txs:
            tx_desc = _normalize_text(getattr(tx, "description", "") or "")
            if desc_norm in tx_desc or tx_desc in desc_norm:
                return int(tx.id)
    return int(txs[0].id) if txs else None


def execute_pending_action(phone_number: str, pending: dict[str, Any]) -> str:
    action = pending.get("action")
    params = dict(pending.get("params") or {})

    if action == "register_transaction":
        state = {
            "phone_number": phone_number,
            "source_format": params.get("source_format", "text"),
            "intent": "register_income" if params.get("type") == "INCOME" else "register_expense",
            "extracted_data": params,
        }
        result = save_transaction(state)
        if result.get("error"):
            return str(result["error"])
        if not result.get("transaction_id"):
            return "Nao consegui confirmar a persistencia da transacao no banco. Tente novamente."
        message = resp.transaction_registered(
            params.get("type", "EXPENSE"),
            float(params.get("amount") or 0),
            result.get("category_name") or params.get("category") or "Outros",
            params.get("description") or "",
        )
        if params.get("is_recurring"):
            if result.get("needs_pairing_for_recurring"):
                message += (
                    "\n\nA transacao foi salva, mas nao criei a recorrencia automatica "
                    "porque sua conta web ainda nao esta conectada a este chat."
                )
            elif result.get("recurring_transaction_id"):
                message += "\n\nRecorrencia automatica criada."
            else:
                message += "\n\nA transacao foi salva, mas nao consegui confirmar a recorrencia."
        return message

    if action == "import_document_transactions":
        from app.agents.import_statement import import_parsed_transactions

        transactions = params.get("transactions") or []
        if not transactions:
            return "Não encontrei transações para importar nesse documento."
        result = import_parsed_transactions(
            phone_number,
            transactions,
            source_format="document_import",
        )
        return result["import_summary"].replace("Extrato Importado", "Documento Importado")

    if action == "create_budget":
        budget = create_budget(
            phone_number,
            params["name"],
            float(params["total_limit"]),
            params.get("period", "monthly"),
            "category",
        )
        return resp.budget_created(budget["name"], float(budget["total_limit"]), budget["period"])

    if action == "update_budget":
        result = update_budget_limit(phone_number, params["name"], float(params["total_limit"]))
        if not result:
            return f"Nao encontrei o orcamento '{params['name']}'."
        return resp.budget_created(result["name"], float(result["total_limit"]), result["period"], updated=True)

    if action == "delete_budget":
        count = delete_budget_by_name(phone_number, params["name"])
        return f"Orcamento '{params['name']}' removido." if count else f"Nao encontrei o orcamento '{params['name']}'."

    if action == "create_goal":
        goal = create_goal(
            phone_number,
            params["title"],
            float(params["target_amount"]),
            _parse_date(params.get("deadline")),
        )
        return resp.goal_created(goal["title"], float(goal["target_amount"]), goal.get("deadline"))

    if action == "contribute_goal":
        goals = get_goals(phone_number)
        target = None
        identifier = _normalize_text(params.get("goal_identifier") or "")
        for goal in goals:
            if identifier and identifier in _normalize_text(goal["title"]):
                target = goal
                break
        if not target and len(goals) == 1:
            target = goals[0]
        if not target:
            return "Nao encontrei essa meta. Pode dizer o nome da meta?"
        result = update_goal_progress(phone_number, target["id"], float(params["amount"]))
        return (
            f"Guardado na meta {result['title']}.\n"
            f"Progresso: {_money(result['current_amount'])} / {_money(result['target_amount'])} ({result['percentage']}%)."
        )

    if action == "update_goal":
        result = update_goal(
            phone_number,
            params["goal_identifier"],
            new_target=float(params["target_amount"]) if params.get("target_amount") else None,
            new_title=params.get("title"),
            new_deadline=_parse_date(params.get("deadline")),
        )
        if not result:
            return "Nao encontrei essa meta."
        return f"Meta atualizada: {result['title']} ({_money(result['target_amount'])})."

    if action == "delete_goal":
        ok = delete_goal(phone_number, params["goal_identifier"])
        return "Meta removida." if ok else "Nao encontrei essa meta."

    if action == "update_transaction":
        tx_id = params.get("transaction_id") or _find_transaction_id(phone_number, params.get("description"))
        if not tx_id:
            return "Nao encontrei uma transacao recente para atualizar."
        result = persistence_update_transaction(
            phone_number,
            int(tx_id),
            amount=float(params["amount"]) if params.get("amount") is not None else None,
            description=params.get("new_description"),
            category_name=params.get("category"),
        )
        if not result:
            return "Nao encontrei a transacao para atualizar."
        return f"Transacao atualizada: {_money(result['amount'])} - {result.get('description') or ''}."

    if action == "delete_transaction":
        tx_id = params.get("transaction_id") or _find_transaction_id(phone_number, params.get("description"))
        if not tx_id:
            return "Nao encontrei uma transacao recente para remover."
        return "Transacao removida." if delete_transaction_by_id(phone_number, int(tx_id)) else "Nao encontrei a transacao."

    if action == "create_category":
        created = persistence_create_category(phone_number, params["name"])
        return f"Categoria '{created['name']}' criada." if created else f"A categoria '{params['name']}' ja existe ou e padrao."

    if action == "rename_category":
        ok = persistence_rename_category(phone_number, params["old_name"], params["new_name"])
        return f"Categoria renomeada para '{params['new_name']}'." if ok else "Nao consegui renomear essa categoria."

    if action == "delete_category":
        ok = persistence_delete_category(phone_number, params["name"])
        return f"Categoria '{params['name']}' removida." if ok else "Nao encontrei essa categoria ou ela e padrao."

    if action == "list_categories":
        cats = persistence_list_categories(phone_number)
        names = ", ".join(c["name"] for c in cats)
        return f"Suas categorias: {names}" if names else "Voce ainda nao tem categorias."

    raise ValueError(f"Acao pendente desconhecida: {action}")
