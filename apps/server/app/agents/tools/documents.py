"""Document tools for BagCoin chat agents."""

from __future__ import annotations

from typing import Any

from langchain_core.tools import BaseTool, tool

from app.agents.document_understanding import analyze_document_media
from app.agents.pending_actions import save_pending_action
import logging

logger = logging.getLogger(__name__)


def create_document_tools(phone_number: str, context: dict[str, Any] | None = None) -> list[BaseTool]:
    """Create document tools with media and tenant context captured in closures."""
    context = context or {}
    media = context.get("media") or {}
    channel = str(context.get("channel") or "whatsapp")
    if channel not in {"whatsapp", "telegram"}:
        channel = "whatsapp"

    @tool
    def analyze_uploaded_document() -> str:
        """Analyze the uploaded document/image and prepare financial import confirmation."""
        result = analyze_document_media(
            media,
            extracted_text=context.get("extracted_media_text"),
        )
        logger.info(
            "[document_tool] analyzed %s (%s) -> type=%s txs=%s method=%s",
            (result.get("source") or {}).get("filename") or "sem_nome",
            (result.get("source") or {}).get("mimetype") or "desconhecido",
            result.get("document_type"),
            len(result.get("transactions") or []),
            result.get("extraction_method"),
        )
        transactions = result.get("transactions") or []
        if not result.get("is_financial"):
            return result.get("summary") or "Não identifiquei um documento financeiro importável."
        if not transactions:
            issues = result.get("issues") or []
            issue_text = f"\n\nPontos de atenção: {', '.join(issues)}" if issues else ""
            return (
                "Identifiquei um documento financeiro, mas não encontrei transações "
                f"seguras para importar.{issue_text}"
            )

        totals = result.get("totals") or {}
        issues = result.get("issues") or []
        issue_text = f"\n\nPontos de atenção: {', '.join(issues[:3])}" if issues else ""
        preview_lines = []
        for tx in transactions[:5]:
            preview_lines.append(
                f"- {tx['description']}: R$ {float(tx['amount']):,.2f} ({'receita' if tx['type'] == 'INCOME' else 'despesa'})"
            )
        preview = "\n".join(preview_lines)
        summary = (
            "Encontrei transações neste documento:\n\n"
            f"- {int(totals.get('transactions') or len(transactions))} transações\n"
            f"- Receitas: R$ {float(totals.get('income') or 0):,.2f}\n"
            f"- Despesas: R$ {float(totals.get('expense') or 0):,.2f}\n"
            f"- Confiança: {float(result.get('confidence') or 0):.0%}\n"
            f"- Método: {result.get('extraction_method') or 'document_tool'}"
            f"{issue_text}\n\n"
            f"{preview}\n\n"
            "Se estiver correto, posso importar essas transações."
        )
        return save_pending_action(
            phone_number,
            action="import_document_transactions",
            params={
                "transactions": transactions,
                "document_type": result.get("document_type"),
                "extraction_method": result.get("extraction_method"),
                "confidence": result.get("confidence"),
                "source": result.get("source") or {},
            },
            summary=summary,
            channel=channel,
        )

    return [analyze_uploaded_document]
