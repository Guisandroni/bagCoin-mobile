import logging
import time
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Cache global do LLM escolhido
_cached_llm: BaseChatModel | None = None
_cache_error: bool = False

# Modelos da OpenCodeGo em ordem de prioridade (mais rápido/primeiro)
OPENCODE_MODELS = ["glm-5", "glm-5.1", "kimi-k2.6", "deepseek-v4-flash"]


def _create_opencode_llm(temperature: float = 0.2, model: str = None) -> BaseChatModel | None:
    """Cria instância do LLM OpenCodeGo."""
    if not settings.opencode_api_key:
        return None
    model_name = model or OPENCODE_MODELS[0]
    try:
        return ChatOpenAI(
            api_key=settings.opencode_api_key,
            base_url="https://opencode.ai/zen/go/v1",
            model=model_name,
            temperature=temperature,
            max_tokens=2048,
            timeout=15,
            max_retries=1,
        )
    except Exception as e:
        logger.warning(f"Erro ao criar OpenCodeGo LLM ({model_name}): {e}")
        return None


def _create_groq_llm(temperature: float = 0.2, model: str = None) -> BaseChatModel | None:
    """Cria instância do LLM Groq (fallback experimental)."""
    if not settings.groq_api_key:
        return None
    model_name = model or settings.default_llm_model
    try:
        return ChatGroq(
            api_key=settings.groq_api_key,
            model_name=model_name,
            temperature=temperature,
            max_tokens=2048,
            timeout=15,
            max_retries=1,
        )
    except Exception as e:
        logger.warning(f"Erro ao criar Groq LLM: {e}")
        return None


def _invalidate_cache():
    """Invalida o cache do LLM (chamado quando há erro)."""
    global _cached_llm, _cache_error
    _cached_llm = None
    _cache_error = True
    logger.info("Cache do LLM invalidado devido a erro.")


def _select_llm(temperature: float = 0.2, model: str = None) -> BaseChatModel | None:
    """Seleciona o melhor LLM disponível.

    Sem health check síncrono. Cache permanente — só invalida em erro.
    Fallback automático entre modelos da OpenCodeGo.
    """
    global _cached_llm, _cache_error

    # Se tem cache válido e NÃO está em estado de erro, retorna imediatamente
    if _cached_llm and not _cache_error:
        return _cached_llm

    # Se estava em erro, tenta recriar
    if _cache_error:
        _cached_llm = None

    # 1. Tenta modelos da OpenCodeGo em ordem
    models_to_try = [model] if model else OPENCODE_MODELS
    for model_name in models_to_try:
        opencode = _create_opencode_llm(temperature, model_name)
        if opencode:
            logger.info(f"LLM selecionado: OpenCodeGo ({model_name})")
            _cached_llm = opencode
            _cache_error = False
            return opencode

    # 2. Fallback: Groq (experimental)
    groq = _create_groq_llm(temperature, model)
    if groq:
        logger.info(f"LLM fallback: Groq ({model or settings.default_llm_model})")
        _cached_llm = groq
        _cache_error = False
        return groq

    # 3. Sem LLM
    logger.warning("Nenhum LLM disponível. Modo offline (fast-path only).")
    _cached_llm = None
    return None


def get_llm(temperature: float = 0.2, model: str = None) -> BaseChatModel | None:
    """Retorna instância do LLM configurado (cache permanente, sem health check)."""
    return _select_llm(temperature, model)


def timed_invoke(llm: BaseChatModel, messages: list, operation: str = "llm_invoke") -> tuple:
    """Invoca LLM com timer de latência.

    Returns: (response, latency_ms)
    Invalida cache em caso de erro 429/timeout.
    """
    start = time.time()
    try:
        response = llm.invoke(messages)
        latency_ms = (time.time() - start) * 1000
        logger.info(f"[{operation}] Latência: {latency_ms:.0f}ms")
        return response, latency_ms
    except Exception as e:
        latency_ms = (time.time() - start) * 1000
        error_str = str(e).lower()
        logger.warning(f"[{operation}] Falhou após {latency_ms:.0f}ms: {e}")
        if "429" in str(e) or "rate limit" in error_str or "timeout" in error_str:
            _invalidate_cache()
        raise
