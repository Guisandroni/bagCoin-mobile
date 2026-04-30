import logging
import json
import re
from typing import Dict, Any, Optional
from datetime import datetime, date
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser
from app.services.llm_service import get_llm
from app.database import SessionLocal
from app.agents.persistence import get_or_create_user
from app.models.models import Conversation

logger = logging.getLogger(__name__)

# Schemas de cada wizard (campos obrigatórios)
WIZARD_SCHEMAS = {
    "create_budget": {
        "fields": ["name", "total_limit", "period"],
        "defaults": {"period": "monthly"},
        "labels": {
            "name": "categoria/nome do orçamento",
            "total_limit": "limite mensal (valor em R$)",
            "period": "período (mensal, semanal, anual)"
        },
        "examples": [
            "alimentação, 3000, mensal",
            "transporte 800",
            "lazer R$ 500"
        ]
    },
    "create_goal": {
        "fields": ["title", "target_amount"],
        "optional": ["deadline"],
        "defaults": {},
        "labels": {
            "title": "objetivo da meta",
            "target_amount": "valor total (em R$)",
            "deadline": "prazo (opcional, ex: 12/2026)"
        },
        "examples": [
            "viagem, 10000, 12/2026",
            "bike 1200",
            "emergência R$ 5000 até 06/2027"
        ]
    },
    "update_goal": {
        "fields": ["goal_identifier", "amount"],
        "defaults": {},
        "labels": {
            "goal_identifier": "qual meta (nome ou número)",
            "amount": "quanto quer adicionar (em R$)"
        },
        "examples": [
            "bike, 200",
            "viagem 500",
            "meta 1 R$ 300"
        ]
    },
    "contribute_goal": {
        "fields": ["goal_identifier", "amount"],
        "defaults": {},
        "labels": {
            "goal_identifier": "qual meta (nome ou número)",
            "amount": "quanto quer adicionar (em R$)"
        },
        "examples": [
            "viagem, 200",
            "bike 500",
            "reserva R$ 300"
        ]
    }
}


def _get_conversation(phone_number: str) -> Optional[Conversation]:
    """Busca a conversa mais recente do usuário."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        conv = db.query(Conversation).filter(
            Conversation.user_id == user.id
        ).order_by(Conversation.updated_at.desc()).first()
        return conv
    finally:
        db.close()


def _save_wizard_state(phone_number: str, wizard_state: Dict[str, Any]):
    """Salva estado do wizard na conversa."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        conv = db.query(Conversation).filter(
            Conversation.user_id == user.id
        ).order_by(Conversation.updated_at.desc()).first()

        if not conv:
            conv = Conversation(user_id=user.id, channel="whatsapp")
            db.add(conv)

        from sqlalchemy.orm.attributes import flag_modified
        context = dict(conv.context_json or {})
        context["wizard"] = wizard_state
        conv.context_json = context
        flag_modified(conv, "context_json")
        conv.updated_at = datetime.utcnow()
        db.commit()
        logger.info(f"Wizard state salvo para {phone_number}: {wizard_state.get('status')}")
    except Exception as e:
        logger.error(f"Erro ao salvar wizard state: {e}")
        db.rollback()
    finally:
        db.close()


def _load_wizard_state(phone_number: str) -> Optional[Dict[str, Any]]:
    """Carrega estado do wizard da conversa."""
    conv = _get_conversation(phone_number)
    if conv and conv.context_json:
        wizard = conv.context_json.get("wizard")
        if wizard:
            # Verifica timeout (10 minutos)
            last_update = wizard.get("updated_at")
            if last_update:
                try:
                    last = datetime.fromisoformat(last_update)
                    if (datetime.utcnow() - last).total_seconds() > 600:
                        logger.info(f"Wizard expirado para {phone_number}")
                        return None
                except:
                    pass
            return wizard
    return None


def _clear_wizard_state(phone_number: str):
    """Limpa estado do wizard."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        conv = db.query(Conversation).filter(
            Conversation.user_id == user.id
        ).order_by(Conversation.updated_at.desc()).first()

        if conv and conv.context_json:
            from sqlalchemy.orm.attributes import flag_modified
            context = dict(conv.context_json)
            context.pop("wizard", None)
            conv.context_json = context
            flag_modified(conv, "context_json")
            db.commit()
            logger.info(f"Wizard state limpo para {phone_number}")
    except Exception as e:
        logger.error(f"Erro ao limpar wizard state: {e}")
        db.rollback()
    finally:
        db.close()


def _is_wizard_intent(intent: str) -> bool:
    """Verifica se a intenção é gerenciada pelo wizard."""
    return intent in ["create_budget", "create_goal", "update_goal", "contribute_goal"]


def _parse_value(value_str: str) -> Optional[float]:
    """Extrai valor numérico de uma string."""
    if not value_str:
        return None
    # Remove R$, pontos de milhar, converte vírgula decimal
    cleaned = re.sub(r'R?\$?\s*', '', str(value_str))
    cleaned = cleaned.replace('.', '').replace(',', '.')
    # Se ficou com múltiplos pontos, o último é decimal
    if cleaned.count('.') > 1:
        parts = cleaned.split('.')
        cleaned = ''.join(parts[:-1]) + '.' + parts[-1]
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_deadline(date_str: str) -> Optional[str]:
    """Parseia data no formato MM/YYYY ou DD/MM/YYYY."""
    if not date_str:
        return None
    # MM/YYYY
    m = re.match(r'(\d{1,2})/(\d{4})', str(date_str))
    if m:
        return f"01/{m.group(1)}/{m.group(2)}"
    # DD/MM/YYYY
    m = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})', str(date_str))
    if m:
        return f"{m.group(1)}/{m.group(2)}/{m.group(3)}"
    return None


def wizard_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Nó de wizard multi-turno com LLM.

    Gerencia diálogos para criar orçamentos, metas, etc.
    - Se dados completos na primeira mensagem: executa direto (single-turn)
    - Se dados parciais: confirma antes de executar
    - Se sem dados: entra em modo de coleta multi-turno
    """
    import time
    start_time = time.time()

    message = state.get("message", "")
    phone_number = state.get("phone_number", "")
    intent = state.get("intent", "")
    llm = get_llm(temperature=0.2)
    llm_init_ms = (time.time() - start_time) * 1000

    # 1. Verifica se há wizard em andamento
    wizard_state = _load_wizard_state(phone_number)

    if wizard_state:
        # Continua wizard existente
        wizard_type = wizard_state.get("type", "")
        logger.info(f"Wizard em andamento para {phone_number}: {wizard_type}")
    elif _is_wizard_intent(intent):
        # Inicia novo wizard
        wizard_type = intent.value if hasattr(intent, 'value') else str(intent)
        if wizard_type not in WIZARD_SCHEMAS:
            wizard_type = "create_goal"  # fallback
        wizard_state = {
            "type": wizard_type,
            "status": "collecting",
            "collected": {},
            "missing": WIZARD_SCHEMAS[wizard_type]["fields"].copy(),
            "updated_at": datetime.utcnow().isoformat()
        }
        # Aplica defaults
        for field, default in WIZARD_SCHEMAS[wizard_type].get("defaults", {}).items():
            if field in wizard_state["missing"]:
                wizard_state["collected"][field] = default
                wizard_state["missing"].remove(field)
        logger.info(f"Novo wizard iniciado para {phone_number}: {wizard_type}")

        # Tenta extrair dados da mensagem inicial
        # Só chama LLM se a mensagem parece conter dados (números, valores, etc.)
        msg_has_data = bool(re.search(r'\d', message)) or any(w in message.lower() for w in ["r$", "reais", "para", "de", "até", "ate"])
        if llm and msg_has_data:
            extracted = _extract_fields_with_llm(
                llm, message, wizard_type, wizard_state["missing"],
                WIZARD_SCHEMAS[wizard_type]["labels"]
            )
        else:
            extracted = _extract_fields_simple(message, wizard_type, wizard_state["missing"])

        # Mescla dados extraídos
        for field, value in extracted.items():
            if field in wizard_state["missing"] and value is not None:
                wizard_state["collected"][field] = value
                wizard_state["missing"].remove(field)

        # Se conseguiu TODOS os dados na primeira mensagem, executa direto
        if not wizard_state["missing"]:
            logger.info(f"Wizard {wizard_type}: todos os dados coletados na primeira mensagem. Executando direto.")
            return _handle_executing(state, wizard_state, phone_number)

        # Se conseguiu ALGUNS dados, vai para confirmação/coleta
        if wizard_state["collected"]:
            wizard_state["status"] = "collecting"
            _save_wizard_state(phone_number, wizard_state)
            return _handle_collecting(state, wizard_state, message, phone_number, llm)

        # Se não conseguiu nenhum dado, inicia coleta
        _save_wizard_state(phone_number, wizard_state)
        return _handle_collecting(state, wizard_state, message, phone_number, llm)
    else:
        # Não é wizard, passa direto
        return state

    # 2. Se estamos coletando dados, usa LLM para interpretar a mensagem
    if wizard_state["status"] == "collecting":
        result = _handle_collecting(state, wizard_state, message, phone_number, llm)
        total_ms = (time.time() - start_time) * 1000
        logger.info(f"[wizard_node] collecting total: {total_ms:.0f}ms (llm_init={llm_init_ms:.0f}ms)")
        return result

    # 3. Se estamos confirmando, verifica resposta do usuário
    if wizard_state["status"] == "confirming":
        result = _handle_confirming(state, wizard_state, message, phone_number, llm)
        total_ms = (time.time() - start_time) * 1000
        logger.info(f"[wizard_node] confirming total: {total_ms:.0f}ms (llm_init={llm_init_ms:.0f}ms)")
        return result

    # 4. Se estamos executando, executa a ação
    if wizard_state["status"] == "executing":
        result = _handle_executing(state, wizard_state, phone_number)
        total_ms = (time.time() - start_time) * 1000
        logger.info(f"[wizard_node] executing total: {total_ms:.0f}ms (llm_init={llm_init_ms:.0f}ms)")
        return result

    total_ms = (time.time() - start_time) * 1000
    logger.info(f"[wizard_node] no-op total: {total_ms:.0f}ms (llm_init={llm_init_ms:.0f}ms)")
    return state


def _handle_collecting(state: Dict[str, Any], wizard: Dict[str, Any],
                       message: str, phone_number: str, llm: Any) -> Dict[str, Any]:
    """Processa mensagem do usuário durante fase de coleta."""
    wizard_type = wizard["type"]
    schema = WIZARD_SCHEMAS[wizard_type]
    fields = schema["fields"]
    labels = schema["labels"]
    examples = schema["examples"]

    # Verifica cancelamento em qualquer fase
    msg_lower = message.lower().strip()
    cancel_words = ["não", "nao", "no", "cancelar", "cancela", "esquece", "errado", "desistir"]
    if any(w in msg_lower for w in cancel_words):
        _clear_wizard_state(phone_number)
        state["response"] = "Cancelado. Se quiser tentar de novo, é só mandar 'criar orçamento' ou 'criar meta'."
        return state

    # Se é a primeira interação e não há dados reais (só defaults), apresenta o wizard
    has_real_data = any(
        field not in schema.get("defaults", {})
        for field in wizard.get("collected", {}).keys()
    )
    # Detecta se a mensagem é apenas o comando (ex: "criar orçamento") sem dados
    msg_words = message.lower().split()
    is_just_command = len(msg_words) <= 3 and any(w in message.lower() for w in ["criar", "crie", "novo", "nova", "quero"])
    if not has_real_data and is_just_command:
        # Primeira mensagem só com "criar orçamento" - explica o que precisa
        missing_labels = [labels[f] for f in wizard["missing"]]
        type_name = {
                "create_budget": "orçamento",
                "create_goal": "meta",
                "update_goal": "atualização de meta",
                "contribute_goal": "contribuição para meta"
            }.get(wizard_type, wizard_type.replace('_', ' '))
        response = (
            f"Vamos criar seu {type_name}!\n\n"
            f"Preciso das seguintes informações:\n"
        )
        for i, label in enumerate(missing_labels, 1):
            response += f"{i}. {label}\n"
        response += (
            f"\nExemplos de como responder:\n"
            f"- {examples[0]}\n"
        )
        if len(examples) > 1:
            response += f"- {examples[1]}\n"

        state["response"] = response
        wizard["updated_at"] = datetime.utcnow().isoformat()
        _save_wizard_state(phone_number, wizard)
        return state

    # Usa LLM para extrair dados da mensagem
    # Só chama LLM se a mensagem parece conter dados
    msg_has_data = bool(re.search(r'\d', message)) or any(w in message.lower() for w in ["r$", "reais", "para", "de", "até", "ate"])
    if llm and msg_has_data:
        extracted = _extract_fields_with_llm(
            llm, message, wizard_type, wizard["missing"], labels
        )
    else:
        # Fallback sem LLM - parse simples
        extracted = _extract_fields_simple(message, wizard_type, wizard["missing"])

    # Mescla dados extraídos
    for field, value in extracted.items():
        if field in wizard["missing"] and value is not None:
            wizard["collected"][field] = value
            wizard["missing"].remove(field)
            logger.info(f"Wizard {wizard_type}: campo '{field}' = {value}")

    # Verifica se ainda faltam campos
    if wizard["missing"]:
        missing_labels = [labels[f] for f in wizard["missing"]]
        collected_summary = _format_collected(wizard["collected"], labels)

        response = ""
        if collected_summary:
            response += f"Já tenho:\n{collected_summary}\n\n"

        response += f"Ainda preciso de:\n"
        for label in missing_labels:
            response += f"- {label}\n"

        state["response"] = response
        wizard["updated_at"] = datetime.utcnow().isoformat()
        _save_wizard_state(phone_number, wizard)
        return state

    # Todos os campos coletados - vai para confirmação
    wizard["status"] = "confirming"
    return _handle_confirming(state, wizard, message, phone_number, llm)


def _handle_confirming(state: Dict[str, Any], wizard: Dict[str, Any],
                       message: str, phone_number: str, llm: Any) -> Dict[str, Any]:
    """Pede confirmação antes de executar."""
    wizard_type = wizard["type"]

    # Se o usuário confirmou
    msg_lower = message.lower().strip()
    confirm_words = ["sim", "yes", "confirmar", "ok", "tá bom", "pode criar", "pode", "criar", "confirmo"]
    cancel_words = ["não", "nao", "no", "cancelar", "cancela", "esquece", "errado"]

    if any(w in msg_lower for w in confirm_words):
        wizard["status"] = "executing"
        return _handle_executing(state, wizard, phone_number)

    if any(w in msg_lower for w in cancel_words):
        _clear_wizard_state(phone_number)
        state["response"] = "Cancelado. Se quiser tentar de novo, é só mandar 'criar orçamento' ou 'criar meta'."
        return state

    # Se o usuário quer corrigir algum campo
    if any(w in msg_lower for w in ["mudar", "alterar", "trocar", "corrigir", "nao é", "não é"]):
        wizard["status"] = "collecting"
        # Tenta identificar qual campo corrigir
        if llm:
            correction = _extract_correction_with_llm(llm, message, wizard["collected"])
            if correction:
                for field, value in correction.items():
                    wizard["collected"][field] = value
                    if field in wizard["missing"]:
                        wizard["missing"].remove(field)
        return _handle_collecting(state, wizard, message, phone_number, llm)

    # Resumo para confirmação
    summary = _format_confirmation(wizard)
    state["response"] = (
        f"{summary}\n\n"
        f"Confirma?\n"
        f"Responda 'sim' para criar ou me diga o que quer alterar."
    )
    wizard["updated_at"] = datetime.utcnow().isoformat()
    _save_wizard_state(phone_number, wizard)
    return state


def _find_goal(goals: list, identifier: str) -> dict | None:
    """Encontra meta por nome ou índice."""
    if not identifier:
        return goals[0] if len(goals) == 1 else None
    for g in goals:
        if identifier.lower() in g["title"].lower():
            return g
    try:
        idx = int(identifier) - 1
        if 0 <= idx < len(goals):
            return goals[idx]
    except ValueError:
        pass
    return None


def _handle_executing(state: Dict[str, Any], wizard: Dict[str, Any],
                      phone_number: str) -> Dict[str, Any]:
    """Executa a ação do wizard."""
    wizard_type = wizard["type"]
    collected = wizard["collected"]

    try:
        if wizard_type == "create_budget":
            from app.services.budget_service import create_budget
            budget = create_budget(
                phone_number=phone_number,
                name=collected.get("name", "Geral"),
                total_limit=_parse_value(collected.get("total_limit", 0)) or 0,
                period=collected.get("period", "monthly")
            )
            state["budget_data"] = budget
            from app.agents import responses as resp
            state["response"] = resp.budget_created(budget['name'], budget['total_limit'], budget['period'])

        elif wizard_type == "create_goal":
            from app.services.budget_service import create_goal
            deadline_str = collected.get("deadline")
            deadline = None
            if deadline_str:
                parsed = _parse_deadline(deadline_str)
                if parsed:
                    try:
                        deadline = datetime.strptime(parsed, "%d/%m/%Y").date()
                    except:
                        pass
            goal = create_goal(
                phone_number=phone_number,
                title=collected.get("title", "Reserva"),
                target_amount=_parse_value(collected.get("target_amount", 0)) or 0,
                deadline=deadline
            )
            state["goal_data"] = goal
            from app.agents import responses as resp
            state["response"] = resp.goal_created(goal['title'], goal['target_amount'], goal.get('deadline'))

        elif wizard_type in ("update_goal", "contribute_goal"):
            from app.services.budget_service import update_goal_progress, get_goals
            goals = get_goals(phone_number)
            identifier = collected.get("goal_identifier", "")
            amount = _parse_value(collected.get("amount", 0))
            target_goal = _find_goal(goals, identifier)

            if target_goal and amount:
                result = update_goal_progress(phone_number, target_goal["id"], amount)
                action = "atualizada" if wizard_type == "update_goal" else "registrada"
                state["response"] = (
                    f"Meta {action}!\n\n"
                    f"Meta: {result['title']}\n"
                    f"Adicionado: R$ {amount:,.2f}\n"
                    f"Progresso: R$ {result['current_amount']:,.2f} / R$ {result['target_amount']:,.2f} ({result['percentage']}%)"
                )
            else:
                goals_list = "\n".join([f"{i+1}. {g['title']} (R$ {g['target_amount']:,.2f})" for i, g in enumerate(goals)])
                state["response"] = (
                    f"Não encontrei a meta '{identifier}'.\n"
                    f"Suas metas atuais:\n{goals_list}" if goals else "Você não tem metas ainda."
                )

        _clear_wizard_state(phone_number)
        logger.info(f"Wizard {wizard_type} executado com sucesso para {phone_number}")

    except Exception as e:
        logger.error(f"Erro ao executar wizard {wizard_type}: {e}")
        state["error"] = f"Erro ao executar: {str(e)}"
        _clear_wizard_state(phone_number)

    return state


def _extract_fields_with_llm(llm: Any, message: str, wizard_type: str,
                             missing_fields: list, labels: dict) -> Dict[str, Any]:
    """Usa LLM para extrair campos da mensagem do usuário."""
    schema = WIZARD_SCHEMAS[wizard_type]
    fields_str = ", ".join([labels[f] for f in missing_fields])

    # Mapeia nomes de campos para o LLM
    field_examples = {
        "create_budget": '{"name": "alimentação", "total_limit": 3000, "period": "monthly"}',
        "create_goal": '{"title": "viagem", "target_amount": 10000, "deadline": "12/2026"}',
        "update_goal": '{"goal_identifier": "bike", "amount": 500}',
        "contribute_goal": '{"goal_identifier": "bike", "amount": 500}'
    }

    system_prompt = f"""Você é um assistente que extrai dados de mensagens curtas em português.
O usuário está preenchendo um formulário de {wizard_type.replace('_', ' ')}.

Extraia APENAS os campos presentes na mensagem do usuário.
Responda SEMPRE em JSON no formato: {field_examples.get(wizard_type, '{}')}

Regras:
- Se um campo não estiver na mensagem, omita do JSON (não use null)
- total_limit, target_amount, amount: números apenas (ex: 3000, 10000.50)
- deadline: string no formato "MM/YYYY" ou "DD/MM/YYYY"
- name/title: string, sem incluir o valor monetário
- period: "monthly", "weekly", "daily" ou "yearly"
- goal_identifier: nome da meta ou número dela

Exemplos de extração:
Mensagem: "Orçamento de R$ 3000 para alimentação mensal"
→ {{"name": "alimentação", "total_limit": 3000, "period": "monthly"}}

Mensagem: "Meta de R$ 10000 para viagem até 12/2026"
→ {{"title": "viagem", "target_amount": 10000, "deadline": "12/2026"}}

Mensagem: "guardar 500 na meta bike"
→ {{"goal_identifier": "bike", "amount": 500}}
"""

    try:
        from app.services.llm_service import timed_invoke
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Mensagem: {message}")
        ]
        response, latency_ms = timed_invoke(llm, messages, operation="wizard_extract_fields")
        content = response.content.strip()
        # Tenta extrair JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        result = json.loads(content)
        logger.info(f"[wizard] LLM extraiu campos em {latency_ms:.0f}ms: {result}")
        return result
    except Exception as e:
        logger.warning(f"[wizard] LLM falhou ao extrair campos: {e}")
        return {}


def _extract_fields_simple(message: str, wizard_type: str, missing_fields: list) -> Dict[str, Any]:
    """Fallback sem LLM para extração de campos."""
    result = {}
    msg_lower = message.lower()

    # Se a mensagem é apenas um comando, não extrai nada
    command_words = ["criar", "crie", "novo", "nova", "quero", "fazer", "definir"]
    msg_words = message.lower().split()
    is_just_command = len(msg_words) <= 3 and any(w in msg_words for w in command_words)
    if is_just_command:
        return result

    # Tenta extrair valor numérico
    if any(f in missing_fields for f in ["total_limit", "target_amount", "amount"]):
        value_match = re.search(r'R?\$?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{1,2}|\d+(?:[.,]\d{1,2})?)', message)
        if value_match:
            val = _parse_value(value_match.group(1))
            if val is not None:
                for field in ["total_limit", "target_amount", "amount"]:
                    if field in missing_fields:
                        result[field] = val
                        break

    # Tenta extrair deadline
    if "deadline" in missing_fields:
        deadline = _parse_deadline(message)
        if deadline:
            result["deadline"] = deadline

    # Tenta extrair nome/título (texto restante sem números)
    if "name" in missing_fields or "title" in missing_fields:
        # Remove valores monetários e datas
        text_only = re.sub(r'R?\$?\s*\d{1,3}(?:[.,]\d{3})*[.,]?\d*', '', message)
        text_only = re.sub(r'\d{1,2}/\d{1,2}/\d{4}|\d{1,2}/\d{4}', '', text_only)
        text_only = re.sub(r'\b(mensal|semanal|anual|diario|diário)\b', '', text_only, flags=re.I)
        text_only = text_only.strip(' ,.;:-')
        if text_only and len(text_only) > 1:
            field = "name" if "name" in missing_fields else "title"
            result[field] = text_only.strip()

    # Tenta extrair period
    if "period" in missing_fields:
        if any(w in msg_lower for w in ["semana", "semanal"]):
            result["period"] = "weekly"
        elif any(w in msg_lower for w in ["dia", "diario", "diário"]):
            result["period"] = "daily"
        elif any(w in msg_lower for w in ["ano", "anual"]):
            result["period"] = "yearly"

    return result


def _extract_correction_with_llm(llm: Any, message: str, collected: dict) -> Dict[str, Any]:
    """Usa LLM para identificar correções em campos já coletados."""
    system_prompt = """O usuário quer corrigir um campo. Identifique qual campo e novo valor.
Responda em JSON: {"field_name": "novo_valor"}
Exemplo: "muda para 4000" → {"total_limit": 4000}
"não é viagem, é bike" → {"title": "bike"}
"""
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Dados atuais: {json.dumps(collected)}\nMensagem: {message}")
        ])
        content = response.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        return json.loads(content)
    except:
        return {}


def _format_collected(collected: dict, labels: dict) -> str:
    """Formata dados já coletados para exibição."""
    lines = []
    for field, value in collected.items():
        label = labels.get(field, field)
        if field in ["total_limit", "target_amount", "amount"] and value:
            lines.append(f"- {label}: R$ {float(value):,.2f}")
        else:
            lines.append(f"- {label}: {value}")
    return "\n".join(lines)


def _format_confirmation(wizard: dict) -> str:
    """Formata resumo para confirmação."""
    wizard_type = wizard["type"]
    collected = wizard["collected"]

    if wizard_type == "create_budget":
        name = collected.get("name", "")
        limit = collected.get("total_limit", 0)
        period = collected.get("period", "monthly")
        return (
            f"Resumo do Orçamento:\n\n"
            f"Categoria: {name}\n"
            f"Limite: R$ {float(limit):,.2f}\n"
            f"Período: {_period_label(period)}"
        )

    elif wizard_type == "create_goal":
        title = collected.get("title", "")
        target = collected.get("target_amount", 0)
        deadline = collected.get("deadline", "")
        deadline_text = f"\nPrazo: {deadline}" if deadline else ""
        return (
            f"Resumo da Meta:\n\n"
            f"Objetivo: {title}\n"
            f"Valor: R$ {float(target):,.2f}"
            f"{deadline_text}"
        )

    elif wizard_type in ("update_goal", "contribute_goal"):
        identifier = collected.get("goal_identifier", "")
        amount = collected.get("amount", 0)
        label = "Atualizar Meta" if wizard_type == "update_goal" else "Contribuir para Meta"
        return (
            f"{label}:\n\n"
            f"Meta: {identifier}\n"
            f"Adicionar: R$ {float(amount):,.2f}"
        )

    return ""


def _period_label(period: str) -> str:
    return {
        "daily": "Diário",
        "weekly": "Semanal",
        "monthly": "Mensal",
        "yearly": "Anual"
    }.get(period, "Mensal")
