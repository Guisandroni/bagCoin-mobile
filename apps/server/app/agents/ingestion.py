"""Ingestion agent — intent classification for BagCoin.

Classifies user messages using LLM as primary classifier.
Only fast-path rules kept: wizard state (must be instant).
"""

import logging
import re
import time
import unicodedata
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser

from app.schemas.enums import IntentType
from app.services.llm_service import get_llm, timed_invoke

logger = logging.getLogger(__name__)


def _normalize(text: str) -> str:
    """Remove accents and convert to lowercase."""
    return unicodedata.normalize("NFKD", text.lower()).encode("ASCII", "ignore").decode("ASCII")


def _enrich_system_prompt(phone_number: str) -> str:
    """Build the LLM system prompt with conversation context."""
    from app.agents.prompts.classify_intent import build_classify_prompt

    history = ""
    try:
        from app.agents.persistence import get_conversation_history

        history = get_conversation_history(phone_number, limit=4)
    except Exception:
        pass

    return build_classify_prompt(history=history)


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
    from app.agents.wizard import _clear_wizard_state, _is_wizard_intent, _load_wizard_state

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
        elif re.search(r"(?:R?\$\s*)?\d+", msg_lower):
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
        state["intent"] = (
            IntentType(intent_str) if intent_str in intent_values else IntentType.UNKNOWN
        )
        state["confidence"] = result.get("confidence", 0.5)

        total_elapsed = (time.time() - start_time) * 1000
        logger.info(
            f"[classify_intent] LLM: {state['intent']} (LLM={latency_ms:.0f}ms, total={total_elapsed:.0f}ms)"
        )

    except Exception as e:
        total_elapsed = (time.time() - start_time) * 1000
        logger.error(f"[classify_intent] LLM error after {total_elapsed:.0f}ms: {e}")
        state["intent"] = IntentType.UNKNOWN
        state["confidence"] = 0.0

    return state
