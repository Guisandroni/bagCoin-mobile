"""LLM service for BagCoin agents.

Manages LLM provider selection with global caching.
Priority: OpenCodeGo (multi-model) -> Groq (fallback).

Supports BAGCOIN_MODEL env var for model override without restart.
"""

import logging
import os
import time

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global LLM cache
_cached_llm: BaseChatModel | None = None
_cache_error: bool = False

# OpenCodeGo models in priority order (ranked by latency)
OPENCODE_MODELS = [
    "minimax-m2.7",       # 🥇 2.0s, 119 tok
    "mimo-v2.5",          # 🥈 3.5s, 104 tok
    "mimo-v2-omni",       # 🥉 4.0s, 103 tok
    "mimo-v2-pro",        # 4.4s, 104 tok
    "kimi-k2.6",          # 4.6s, 230 tok (reasoning)
    "kimi-k2.5",          # 4.8s, 258 tok (reasoning)
    "qwen3.6-plus",       # 5.6s, 307 tok
    "deepseek-v4-flash",  # 1.4-7s*, 181 tok (reasoning, varia)
    "mimo-v2.5-pro",      # 8.0s, 105 tok
    "qwen3.5-plus",       # 8.2s, 448 tok
    "deepseek-v4-pro",    # variable, 208 tok (reasoning)
    "glm-5.1",            # variable, 223 tok (reasoning)
    "glm-5",              # variable, 230 tok (reasoning)
]


def _get_model_override() -> str | None:
    """Check for model override from env var or shared file."""
    override = os.environ.get("BAGCOIN_MODEL")
    if override:
        return override
    # Fallback: check shared file (allows hot-swap without restart)
    try:
        fp = "/app/model_override.txt"
        if os.path.exists(fp):
            with open(fp) as f:
                return f.read().strip() or None
    except Exception:
        pass
    return None


def _create_opencode_llm(
    temperature: float = 0.2, model: str | None = None
) -> BaseChatModel | None:
    """Create an OpenCodeGo LLM instance."""
    if not settings.OPENCODE_API_KEY:
        return None
    model_name = model or _get_model_override() or OPENCODE_MODELS[0]
    try:
        extra = {}
        # Disable thinking for models that support it (reduces token waste)
        if any(m in model_name.lower() for m in ["deepseek", "kimi", "glm"]):
            extra = {"extra_body": {"thinking": {"type": "disabled"}}}
        return ChatOpenAI(
            api_key=settings.OPENCODE_API_KEY,
            base_url="https://opencode.ai/zen/go/v1",
            model=model_name,
            temperature=temperature,
            max_tokens=2048,
            timeout=30,
            max_retries=1,
            model_kwargs=extra,
        )
    except Exception as e:
        logger.warning(f"Error creating OpenCodeGo LLM ({model_name}): {e}")
        return None


def _create_groq_llm(temperature: float = 0.2, model: str | None = None) -> BaseChatModel | None:
    """Create a Groq LLM instance (fallback)."""
    if not settings.GROQ_API_KEY:
        return None
    model_name = model or settings.DEFAULT_LLM_MODEL
    try:
        return ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model_name=model_name,
            temperature=temperature,
            max_tokens=2048,
            timeout=15,
            max_retries=1,
        )
    except Exception as e:
        logger.warning(f"Error creating Groq LLM: {e}")
        return None


def _invalidate_cache() -> None:
    """Invalidate the LLM cache on error or model change."""
    global _cached_llm, _cache_error
    _cached_llm = None
    _cache_error = True
    logger.info("LLM cache invalidated.")


def _select_llm(temperature: float = 0.2, model: str | None = None) -> BaseChatModel | None:
    """Select the best available LLM.

    Priority: OpenCodeGo (model list) -> Groq (fallback).
    Cache is invalidated when BAGCOIN_MODEL changes.
    """
    global _cached_llm, _cache_error

    override = _get_model_override()
    if override:
        # Model override active — always create fresh (no cache)
        opencode = _create_opencode_llm(temperature, override)
        if opencode:
            logger.info(f"LLM selected: OpenCodeGo/{override} (override)")
            _cached_llm = opencode
            _cache_error = False
            return opencode

    # Return cached LLM if available and no error state
    if _cached_llm and not _cache_error:
        return _cached_llm

    # Reset on error
    if _cache_error:
        _cached_llm = None

    # 1. OpenCodeGo — try models in priority order
    models_to_try = [model] if model else OPENCODE_MODELS
    for model_name in models_to_try:
        opencode = _create_opencode_llm(temperature, model_name)
        if opencode:
            logger.info(f"LLM selected: OpenCodeGo ({model_name})")
            _cached_llm = opencode
            _cache_error = False
            return opencode

    # 2. Fallback: Groq
    groq = _create_groq_llm(temperature, model)
    if groq:
        logger.info(f"LLM fallback: Groq ({model or settings.DEFAULT_LLM_MODEL})")
        _cached_llm = groq
        _cache_error = False
        return groq

    # No LLM available
    logger.warning("No LLM available. Running in offline mode (fast-path only).")
    _cached_llm = None
    return None


def get_llm(temperature: float = 0.2, model: str | None = None) -> BaseChatModel | None:
    """Return a configured LLM instance (cached globally, no health check)."""
    return _select_llm(temperature, model)


def timed_invoke(llm: BaseChatModel, messages: list, operation: str = "llm_invoke") -> tuple:
    """Invoke an LLM with latency timing.

    Returns:
        (response, latency_ms)

    Invalidates cache on 429/timeout errors.
    """
    start = time.time()
    try:
        response = llm.invoke(messages)
        latency_ms = (time.time() - start) * 1000
        logger.info(f"[{operation}] Latency: {latency_ms:.0f}ms")
        return response, latency_ms
    except Exception as e:
        latency_ms = (time.time() - start) * 1000
        error_str = str(e).lower()
        logger.warning(f"[{operation}] Failed after {latency_ms:.0f}ms: {e}")
        if "429" in str(e) or "rate limit" in error_str or "timeout" in error_str:
            _invalidate_cache()
        raise
