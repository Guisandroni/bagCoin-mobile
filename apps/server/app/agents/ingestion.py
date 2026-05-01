"""Ingestion agent — intent classification for BagCoin.

Classifies user messages using LLM as primary classifier.
Only fast-path rules kept: wizard state (must be instant).
"""

import logging
import json
import re
import unicodedata
import time
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser

from app.services.llm_service import get_llm, timed_invoke
from app.schemas.enums import IntentType

logger = logging.getLogger(__name__)


def _normalize(text: str) -> str:
    """Remove accents and convert to lowercase."""
    return unicodedata.normalize("NFKD", text.lower()).encode("ASCII", "ignore").decode("ASCII")


def _enrich_system_prompt(phone_number: str) -> str:
    """Build the LLM system prompt with conversation context."""
    history = ""
    try:
        from app.agents.persistence import get_conversation_history
        history = get_conversation_history(phone_number, limit=4)
    except Exception:
        pass

    base = """Você é um classificador de intenções para um chatbot financeiro chamado BagCoin.
Analise a mensagem do usuário e classifique em UMA das categorias abaixo.
Responda APENAS com JSON puro, SEM markdown (sem ```).
Formato: {"intent": "CATEGORIA", "confidence": 0.95}

Categorias disponíveis:
- register_expense: registrar gasto/despesa. Exemplos: "gastei 50 no mercado", "uber 12 reais", "paguei 200 de luz", "Mercado 240", "14 em pão", "pix 340"
- register_income: registrar receita/entrada. Exemplos: "recebi 5000 de salário", "meu pai me mandou 170", "ganhei 100 de freelance"
- query_data: consultar dados financeiros. Exemplos: "quanto gastei esse mês?", "qual meu saldo?", "gastos por categoria", "meu maior gasto", "quanto já gastei"
- generate_report: gerar relatório/PDF. Exemplos: "gerar relatório", "pdf do mês", "resumo mensal em pdf"
- create_budget: criar orçamento. Exemplos: "definir orçamento de 5000", "limite de gastos"
- create_goal: criar meta financeira. Exemplos: "quero guardar 10000", "meta de viagem"
- contribute_goal: contribuir para meta existente. Exemplos: "guardei 500 na meta viagem", "depositei 200 na meta bike", "adicionei 100 para reserva"
- delete_budget: excluir/apagar orçamento. Exemplos: "excluir orçamento", "apagar budget", "remover limite"
- update_budget: atualizar/alterar orçamento. Exemplos: "mudar orçamento de alimentação", "atualizar limite para 4000"
- delete_goal: excluir meta. Exemplos: "excluir meta", "apagar meta viagem"
- update_goal: atualizar meta. Exemplos: "mudar meta de viagem", "alterar valor da meta"
- delete_transaction: excluir transação. Exemplos: "excluir gasto", "apagar transação"
- update_transaction: corrigir transação. Exemplos: "corrigir valor", "mudar gasto de ontem"
- toggle_alerts: ativar/desativar alertas. Exemplos: "desativar alertas", "ligar notificações"
- recommendation: pedir recomendação/dica. Exemplos: "onde investir?", "dica de economia"
- deep_research: pesquisar informações. Exemplos: "notícias do mercado", "cenário econômico"
- import_statement: importar extrato bancário. Exemplos: "importar extrato", "importar csv", "meu extrato bancário", "quero importar um arquivo"
- chat: conversa livre, agradecimento, resposta a saudação, perguntas sobre o bot. Exemplos: "obrigado", "valeu", "beleza", "show", "como você funciona?", "o que você é?", "ok", "entendi", "e no mês passado?", "na verdade foi 60", "quem é você?", "pode repetir?"
- introduce: apresentar nome. Exemplos: "meu nome é Guilherme", "me chamo Ana", "pode me chamar de João"
- greeting: saudação. Exemplos: "oi", "olá", "bom dia"
- help: pedido de ajuda / saber capacidades. Exemplos: "como usar?", "me ensina", "tutorial", "o que você sabe fazer?"
- correction: correção. Exemplos: "corrigir", "está errado", "não é isso"
- create_category: criar nova categoria. Exemplos: "criar categoria academia", "nova categoria mercado"
- delete_category: excluir categoria. Exemplos: "excluir categoria academia", "apagar categoria mercado"
- list_categories: listar categorias. Exemplos: "minhas categorias", "quais categorias tenho"
- unknown: não identificado

REGRAS IMPORTANTES:
- "gastos" sozinho (sem verbo como "gastei") é CONSULTA (query_data)
- "Mercado 240", "Uber 30" — padrão descrição+valor — é REGISTRO (register_expense)
- "quanto gastei" é sempre CONSULTA, nunca registro
- "guardei 500 na meta" é CONTRIBUIR META (contribute_goal), não registro de receita
- "obrigado", "valeu", "show" é CHAT, nunca UNKNOWN
- "e no mês passado?" depois de uma consulta é CHAT (follow-up sem contexto explícito)
- "na verdade foi X" é CHAT (correção contextual, não novo registro)
- "importar extrato", "importar", "meu extrato" é IMPORT_STATEMENT, não query_data ou unknown"""

    if history:
        base += f"\n\nHistórico recente da conversa:\n{history}"

    return base


def classify_intent(state: dict[str, Any]) -> dict[str, Any]:
    """Classify the intent of the user's message using LLM as primary classifier.

    Only fast-path: wizard state detection (must be instant).
    Everything else goes through the LLM for robust, flexible classification.
    """
    start_time = time.time()

    message = state.get("message", "")
    phone_number = state.get("phone_number", "")
    msg_norm = _normalize(message)

    # =====================================================================
    # FAST-PATH: Wizard state (must be instant, no LLM needed)
    # =====================================================================
    from app.agents.wizard import _load_wizard_state, _is_wizard_intent, _clear_wizard_state
    wizard_state = _load_wizard_state(phone_number)
    if wizard_state:
        wizard_type = wizard_state.get("type", "")
        wizard_status = wizard_state.get("status", "")

        cancel_words = ["cancelar", "cancela", "sair", "voltar", "esquece", "desistir"]
        if any(w in msg_norm for w in cancel_words):
            _clear_wizard_state(phone_number)
            logger.info("[classify_intent] Wizard cancelled by user request")
        elif _is_wizard_intent(wizard_type) and wizard_status in ["collecting", "confirming"]:
            intent_map = {
                "create_budget": IntentType.CREATE_BUDGET,
                "create_goal": IntentType.CREATE_GOAL,
                "update_goal": IntentType.CONTRIBUTE_GOAL,
                "contribute_goal": IntentType.CONTRIBUTE_GOAL,
            }
            state["intent"] = intent_map.get(wizard_type, IntentType.UNKNOWN)
            state["confidence"] = 0.9
            state["wizard"] = wizard_state
            elapsed = (time.time() - start_time) * 1000
            logger.info(f"[classify_intent] Wizard continuation: {elapsed:.0f}ms")
            return state

    # =====================================================================
    # LLM PRIMARY CLASSIFIER
    # =====================================================================
    llm_start = time.time()
    llm = get_llm(temperature=0.1)

    if not llm:
        logger.warning("[classify_intent] No LLM available — falling back to basic detection")
        # Minimal fallback without LLM
        msg_lower = message.lower()
        if any(w in msg_lower for w in ["oi", "ola", "bom dia", "boa tarde", "boa noite"]):
            state["intent"] = IntentType.GREETING
        elif any(w in msg_lower for w in ["obrigado", "obrigada", "valeu", "thanks"]):
            state["intent"] = IntentType.CHAT
        elif any(w in msg_lower for w in ["quanto", "qual", "saldo", "gastei", "gastos"]):
            state["intent"] = IntentType.QUERY_DATA
        elif re.search(r'(?:R?\$\s*)?\d+', msg_lower):
            state["intent"] = IntentType.REGISTER_EXPENSE
        else:
            state["intent"] = IntentType.UNKNOWN
        state["confidence"] = 0.5
        return state

    system_prompt = _enrich_system_prompt(phone_number)
    llm_init_ms = (time.time() - llm_start) * 1000
    logger.info(f"[classify_intent] get_llm() init: {llm_init_ms:.0f}ms")

    try:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Mensagem: {message}"),
        ]

        response, latency_ms = timed_invoke(llm, messages, operation="classify_intent")
        result = JsonOutputParser().parse(response.content)

        intent_str = result.get("intent", "unknown")
        intent_values = [e.value for e in IntentType]
        state["intent"] = IntentType(intent_str) if intent_str in intent_values else IntentType.UNKNOWN
        state["confidence"] = result.get("confidence", 0.5)

        total_elapsed = (time.time() - start_time) * 1000
        logger.info(f"[classify_intent] LLM: {state['intent']} (LLM={latency_ms:.0f}ms, total={total_elapsed:.0f}ms)")

    except Exception as e:
        total_elapsed = (time.time() - start_time) * 1000
        logger.error(f"[classify_intent] LLM error after {total_elapsed:.0f}ms: {e}")
        state["intent"] = IntentType.UNKNOWN
        state["confidence"] = 0.0

    return state
