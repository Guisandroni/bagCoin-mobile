"""Recuperação de conhecimento somente leitura (gancho para RAG futuro).

Separação explícita das mutações (CRUD em services / nós de persistência):
esta camada não grava no banco nem altera saldos, orçamentos ou metas.

Quando houver base vetorial ou documentos indexados:
1. Indexe por user_id (ou tenant) e filtre sempre na consulta.
2. Exponha `retrieve_financial_knowledge_chunks` a um nó LangGraph ou use
   `make_readonly_knowledge_tool` num agente ReAct — nunca misture com tools de escrita.
"""

from __future__ import annotations

import os
from typing import Any

from langchain_core.tools import tool

from app.agents.tenant_context import tenant_phone_error

# Ative quando existir implementação de vector store (ex.: PGVector, RedisVL).
_RAG_ENV_FLAG = "BAGCOIN_KNOWLEDGE_RAG_ENABLED"


def retrieve_financial_knowledge_chunks(
    phone_number: str,
    query: str,
    top_k: int = 4,
) -> list[dict[str, Any]]:
    """Busca trechos relevantes para o usuário. Somente leitura; sem side effects.

    Retorna lista de dicts com chaves típicas: content, source, score (quando houver).
    """
    if tenant_phone_error(phone_number):
        return []
    if not query or not query.strip():
        return []
    if os.getenv(_RAG_ENV_FLAG, "").lower() not in ("1", "true", "yes"):
        return []
    # Implementação futura: embedding + vector store com filtro user_id.
    del top_k
    return []


def format_knowledge_context(chunks: list[dict[str, Any]]) -> str:
    """Formata trechos para injeção em prompt (evitar confundir com instruções de tool)."""
    if not chunks:
        return ""
    parts: list[str] = []
    for i, c in enumerate(chunks, start=1):
        body = (c.get("content") or "").strip()
        src = (c.get("source") or "documento").strip()
        if body:
            parts.append(f"[{i}] ({src})\n{body}")
    return "\n\n".join(parts)


def make_readonly_knowledge_tool(phone_number: str):
    """Factory: tool de busca em base documental, escopada ao tenant atual (somente leitura)."""

    @tool
    def search_financial_knowledge_base(query: str) -> str:
        """Busca trechos em documentos/FAQ do produto (somente leitura).

        Não cria, atualiza nem apaga transações, orçamentos ou metas.
        Use para políticas, ajuda longa ou normas em texto livre.
        """
        chunks = retrieve_financial_knowledge_chunks(phone_number, query)
        if not chunks:
            if os.getenv(_RAG_ENV_FLAG, "").lower() not in ("1", "true", "yes"):
                return (
                    "Base de conhecimento documental não está ativa "
                    f"(defina {_RAG_ENV_FLAG}=true quando o índice estiver pronto)."
                )
            return "Nenhum trecho relevante encontrado na base documental."
        return format_knowledge_context(chunks)

    return search_financial_knowledge_base
