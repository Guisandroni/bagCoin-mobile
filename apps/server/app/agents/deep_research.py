"""Deep Research agent — web-powered financial research for BagCoin.

Searches the web using DuckDuckGo for financial topics.
"""
import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.services.llm_service import get_llm
from app.agents.persistence import get_conversation_history

logger = logging.getLogger(__name__)


def _search_web(query: str, max_results: int = 5) -> list[dict]:
    """Busca na web usando DuckDuckGo (gratuito, sem API key)."""
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            return [
                {"title": r.get("title", ""), "body": r.get("body", ""), "href": r.get("href", "")}
                for r in results
            ]
    except ImportError:
        logger.warning("duckduckgo_search não instalado")
        return []
    except Exception as e:
        logger.warning(f"Erro na busca web: {e}")
        return []


def deep_research(state: dict[str, Any]) -> dict[str, Any]:
    """Realiza pesquisa aprofundada sobre tópicos financeiros com busca web real."""
    message = state.get("message", "")
    llm = get_llm(temperature=0.5)

    if not llm:
        state["response"] = (
            "No momento não consigo realizar pesquisas. Tente novamente mais tarde."
        )
        return state

    try:
        web_results = _search_web(f"financas investimentos economia Brasil {message}")

        # Injeta histórico da conversa
        history = get_conversation_history(state.get("phone_number", ""), limit=4)
        history_context = f"\n\nHistórico da conversa:\n{history}" if history else ""

        system_prompt = """Você é um assistente de pesquisa financeira educativo.
Forneça informações atualizadas e contextuais sobre finanças, investimentos e economia.

DIRETRIZES:
- NÃO prometa rentabilidade específica
- NÃO recomende produtos sem contextualização
- NÃO substitua assessoria profissional
- Explique conceitos de forma clara e acessível
- Mencione riscos sempre que relevante
- Use linguagem simples
- Se não tiver certeza, seja honesto e sugira fontes confiáveis

Formate a resposta de forma amigável para WhatsApp (use quebras de linha).
"""

        context = ""
        if web_results:
            context = "\n\nResultados de busca na web:\n"
            for i, r in enumerate(web_results[:3], 1):
                context += f"{i}. {r['title']}: {r['body'][:300]}\n"
            context += "\nUse esses resultados para responder com dados atuais quando relevante."

        # Adiciona histórico ao contexto
        if history_context:
            context += history_context

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Pergunta do usuário: {message}{context}")
        ]

        response = llm.invoke(messages)

        state["response"] = (
            f"{response.content}\n\n"
            f"_Informação educativa. Consulte um profissional credenciado para decisões financeiras importantes._"
        )

    except Exception as e:
        logger.error(f"Erro no deep research: {e}")
        state["error"] = "Não consegui realizar a pesquisa no momento. Tente novamente mais tarde."

    return state
