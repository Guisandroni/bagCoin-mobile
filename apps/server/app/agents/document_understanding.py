"""Universal financial document understanding for agent tools.

This module separates document/file understanding from persistence. It returns a
validated, normalized payload that the orchestrator can preview and confirm
before saving transactions.
"""

from __future__ import annotations

import base64
import io
import json
import logging
import re
import urllib.request
from datetime import datetime
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.statement_parser import parse_statement
from app.core.config import settings
from app.services.docx_text import extract_docx_text
from app.services.llm_service import get_llm, timed_invoke

logger = logging.getLogger(__name__)

MAX_LLM_TEXT_CHARS = 14_000

FINANCIAL_DOCUMENT_TYPES = {
    "bank_statement",
    "credit_card_statement",
    "receipt",
    "invoice",
    "financial_spreadsheet",
    "payment_proof",
}


def analyze_document_media(
    media: dict[str, Any],
    *,
    extracted_text: str | None = None,
) -> dict[str, Any]:
    """Analyze uploaded media and return a normalized document result."""
    if not media or not media.get("data"):
        return _empty_result("missing_media", "Nenhum arquivo foi recebido para análise.")

    mimetype = str(media.get("mimetype") or "").lower()
    filename = str(media.get("filename") or "")

    deterministic = _deterministic_statement_result(media)
    if deterministic:
        return deterministic

    content = _extract_text_for_understanding(media, extracted_text=extracted_text)
    text = content.get("text", "")
    if not text:
        return _empty_result(
            content.get("method") or "text_extraction",
            "Não consegui extrair texto útil desse documento.",
        )

    unstructured = _parse_unstructured_financial_document(text)
    if unstructured:
        logger.info(
            "[document_understanding] unstructured financial document parsed: %s transactions",
            len(unstructured["transactions"]),
        )
        return _result_from_transactions(
            unstructured["transactions"],
            document_type="unstructured_financial_list",
            extraction_method=f"{content.get('method') or 'text_extraction'}+unstructured",
            confidence=unstructured["confidence"],
            issues=unstructured["issues"],
            source={"filename": filename, "mimetype": mimetype},
            summary=unstructured["summary"],
        )

    llm_result = _llm_understand_financial_document(
        text,
        filename=filename,
        mimetype=mimetype,
        extraction_method=str(content.get("method") or "text_extraction"),
    )
    if llm_result:
        return llm_result

    return {
        "document_type": "unknown",
        "is_financial": False,
        "extraction_method": content.get("method") or "text_extraction",
        "confidence": 0.2,
        "requires_confirmation": False,
        "transactions": [],
        "issues": ["Não consegui estruturar esse documento com segurança."],
        "summary": "Li o documento, mas não identifiquei dados financeiros importáveis com segurança.",
        "source": {"filename": filename, "mimetype": mimetype},
    }


def _deterministic_statement_result(media: dict[str, Any]) -> dict[str, Any] | None:
    """Use deterministic parsers when they can confidently parse structured files."""
    mimetype = str(media.get("mimetype") or "").lower()
    filename = str(media.get("filename") or "").lower()
    if not (
        mimetype in {"text/csv", "application/csv", "application/ofx", "text/ofx"}
        or filename.endswith((".csv", ".ofx", ".qfx"))
    ):
        return None

    transactions = _normalize_transactions(parse_statement(media))
    if not transactions:
        return None

    return _result_from_transactions(
        transactions,
        document_type="bank_statement",
        extraction_method="deterministic_statement_parser",
        confidence=0.95,
        issues=[],
        source={
            "filename": media.get("filename"),
            "mimetype": media.get("mimetype"),
        },
    )


def _extract_text_for_understanding(
    media: dict[str, Any],
    *,
    extracted_text: str | None = None,
) -> dict[str, Any]:
    if extracted_text and not _is_truncated(extracted_text):
        return {"text": extracted_text, "method": "multimodal_preextract"}

    mimetype = str(media.get("mimetype") or "").lower()
    filename = str(media.get("filename") or "").lower()
    try:
        raw = base64.b64decode(media.get("data") or "")
    except Exception as exc:
        logger.warning("[document_understanding] decode failed: %s", exc)
        return {"text": "", "method": "decode_error"}

    if mimetype.startswith("image/"):
        return {
            "text": extracted_text or _vision_extract(media, prompt_kind="image_document"),
            "method": "vision_ocr",
        }

    if mimetype == "application/pdf" or filename.endswith(".pdf"):
        text = _extract_pdf_text(raw)
        if text:
            return {"text": text, "method": "pdf_text"}
        return {"text": _vision_extract(media, prompt_kind="scanned_pdf"), "method": "vision_ocr"}

    if _is_docx(mimetype, filename):
        return {"text": extract_docx_text(raw) or "", "method": "docx_text"}

    try:
        return {"text": raw.decode("utf-8", errors="replace").strip(), "method": "plain_text"}
    except Exception:
        return {"text": "", "method": "text_decode_error"}


def _extract_pdf_text(data: bytes) -> str:
    try:
        import PyPDF2

        reader = PyPDF2.PdfReader(io.BytesIO(data))
        parts = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(part for part in parts if part).strip()
    except Exception as exc:
        logger.warning("[document_understanding] pdf text extraction failed: %s", exc)
        return ""


def _parse_unstructured_financial_document(text: str) -> dict[str, Any] | None:
    """Parse loose financial lists such as 'Mercado 240 reais' line by line."""
    transactions: list[dict[str, Any]] = []
    issues: list[str] = []
    candidate_lines = [line.strip() for line in text.splitlines() if line.strip()]

    for line in candidate_lines:
        parsed = _parse_unstructured_line(line)
        if parsed:
            transactions.append(parsed)

    if len(transactions) < 2:
        return None

    recurring_count = sum(1 for tx in transactions if tx.get("is_recurring"))
    summary = (
        f"Encontrei {len(transactions)} itens financeiros nesse documento: "
        f"{sum(1 for tx in transactions if tx['type'] == 'INCOME')} receitas e "
        f"{sum(1 for tx in transactions if tx['type'] == 'EXPENSE')} despesas."
    )
    if recurring_count:
        issues.append(
            f"Detectei {recurring_count} item(ns) com indício de recorrência; "
            "vou registrar os lançamentos e marcar isso na prévia."
        )
    return {
        "transactions": transactions,
        "issues": issues,
        "summary": summary,
        "confidence": 0.82 if recurring_count else 0.78,
    }


def _parse_unstructured_line(line: str) -> dict[str, Any] | None:
    amount_match = re.search(r"(-?\d+(?:[.,]\d{1,2})?)", line)
    if not amount_match:
        return None

    amount = _parse_amount(amount_match.group(1))
    if amount is None or amount <= 0:
        return None

    raw_description = line[: amount_match.start()].strip(" :-\t") or line
    description = _normalize_description(raw_description)
    if not description or description.lower().startswith("teste"):
        return None

    line_norm = _normalize_line(line)
    category = _guess_unstructured_category(description, line_norm)
    is_income = any(token in line_norm for token in ("salario", "recebi", "renda", "ganho", "entrada"))
    is_recurring = any(
        token in line_norm
        for token in ("todo dia", "todo mes", "mensal", "semanal", "anual", "todo ano")
    )
    recurrence_day = _extract_recurrence_day(line_norm) if is_recurring else None

    return {
        "date": datetime.now().date().isoformat(),
        "description": description,
        "amount": round(amount, 2),
        "type": "INCOME" if is_income else "EXPENSE",
        "category": category,
        "confidence": 0.8,
        "raw": line,
        "is_recurring": is_recurring,
        "recurrence_frequency": _infer_recurrence_frequency(line_norm) if is_recurring else None,
        "recurrence_day": recurrence_day,
    }


def _normalize_description(description: str) -> str:
    compact = " ".join(description.split()).strip()
    return compact[:255]


def _normalize_line(text: str) -> str:
    return (
        text.lower()
        .replace("á", "a")
        .replace("à", "a")
        .replace("â", "a")
        .replace("ã", "a")
        .replace("é", "e")
        .replace("ê", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ô", "o")
        .replace("õ", "o")
        .replace("ú", "u")
        .replace("ç", "c")
    )


def _guess_unstructured_category(description: str, line_norm: str) -> str:
    if "salario" in line_norm or "recebi" in line_norm:
        return "Receita"
    if any(token in line_norm for token in ("mercado", "pao", "padaria", "acougue", "feira")):
        return "Alimentação"
    if any(token in line_norm for token in ("uber", "99", "taxi", "transporte")):
        return "Transporte"
    return "Outros"


def _infer_recurrence_frequency(line_norm: str) -> str:
    if "semanal" in line_norm:
        return "weekly"
    if "anual" in line_norm or "todo ano" in line_norm:
        return "yearly"
    return "monthly"


def _extract_recurrence_day(line_norm: str) -> int | None:
    match = re.search(r"todo dia\s+(\d{1,2})", line_norm)
    if not match:
        return None
    try:
        day = int(match.group(1))
    except ValueError:
        return None
    return max(1, min(day, 28))


def _vision_extract(media: dict[str, Any], *, prompt_kind: str) -> str:
    """OCR/vision fallback using Gemini inline media support."""
    if not settings.GEMINI_API_KEY:
        return ""
    mimetype = str(media.get("mimetype") or "application/octet-stream")
    b64_data = str(media.get("data") or "")
    prompt = (
        "Extraia todo o texto financeiro visível deste arquivo. "
        "Preserve tabelas, datas, descrições, valores, sinais de débito/crédito e totais. "
        "Não invente dados. Responda somente com o texto extraído."
    )
    if prompt_kind == "scanned_pdf":
        prompt += " O arquivo pode ser um PDF escaneado."
    try:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        )
        body = json.dumps({
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": mimetype, "data": b64_data}},
                ]
            }]
        }).encode()
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
        response = urllib.request.urlopen(req, timeout=30)
        data = json.loads(response.read())
        return str(data["candidates"][0]["content"]["parts"][0]["text"]).strip()
    except Exception as exc:
        logger.warning("[document_understanding] vision OCR failed: %s", exc)
        return ""


def _llm_understand_financial_document(
    text: str,
    *,
    filename: str,
    mimetype: str,
    extraction_method: str,
) -> dict[str, Any] | None:
    llm = get_llm(temperature=0.0, request_timeout=20)
    if not llm:
        return None

    clipped = text[:MAX_LLM_TEXT_CHARS]
    messages = [
        SystemMessage(
            content=(
                "Você é um parser financeiro do BagCoin. Converta documentos financeiros "
                "em JSON estrito. Não use markdown. Não invente valores. Se o documento "
                "não for financeiro, retorne transactions vazio e is_financial=false."
            )
        ),
        HumanMessage(
            content=(
                "Analise este documento e responda somente com JSON neste formato:\n"
                "{"
                '"document_type":"bank_statement|credit_card_statement|receipt|invoice|financial_spreadsheet|payment_proof|other|unknown",'
                '"is_financial":true,'
                '"period_start":"YYYY-MM-DD|null",'
                '"period_end":"YYYY-MM-DD|null",'
                '"currency":"BRL",'
                '"confidence":0.0,'
                '"summary":"resumo curto",'
                '"issues":["problemas ou incertezas"],'
                '"transactions":[{"date":"YYYY-MM-DD|null","description":"texto","amount":123.45,'
                '"type":"EXPENSE|INCOME","category":"categoria","confidence":0.0,"raw":"evidencia"}]'
                "}\n\n"
                f"Arquivo: {filename or 'sem nome'}\n"
                f"MIME: {mimetype or 'desconhecido'}\n"
                f"Texto extraído:\n{clipped}"
            )
        ),
    ]
    try:
        response, _ = timed_invoke(llm, messages, operation="document_understanding")
    except Exception as exc:
        logger.warning("[document_understanding] llm failed: %s", exc)
        return None

    parsed = _parse_json_object(str(getattr(response, "content", "") or response))
    if not parsed:
        return None

    transactions = _normalize_transactions(parsed.get("transactions") or [])
    document_type = str(parsed.get("document_type") or "unknown")
    is_financial = _parse_bool(parsed.get("is_financial")) or bool(transactions)
    confidence = _clamp_float(parsed.get("confidence"), 0.0, 1.0, default=0.4)
    if transactions:
        confidence = max(confidence, min(tx.get("confidence", 0.4) for tx in transactions))
    issues = [str(item) for item in parsed.get("issues") or [] if str(item).strip()]
    if is_financial and not transactions:
        issues.append("Documento financeiro sem transações importáveis.")

    return _result_from_transactions(
        transactions,
        document_type=document_type,
        extraction_method=f"{extraction_method}+llm",
        confidence=confidence,
        issues=issues,
        source={"filename": filename, "mimetype": mimetype},
        is_financial=is_financial and document_type != "other",
        summary=str(parsed.get("summary") or ""),
        period_start=parsed.get("period_start"),
        period_end=parsed.get("period_end"),
    )


def _result_from_transactions(
    transactions: list[dict[str, Any]],
    *,
    document_type: str,
    extraction_method: str,
    confidence: float,
    issues: list[str],
    source: dict[str, Any],
    is_financial: bool = True,
    summary: str = "",
    period_start: Any = None,
    period_end: Any = None,
) -> dict[str, Any]:
    incomes = [tx for tx in transactions if tx.get("type") == "INCOME"]
    expenses = [tx for tx in transactions if tx.get("type") == "EXPENSE"]
    total_income = sum(float(tx.get("amount") or 0) for tx in incomes)
    total_expense = sum(float(tx.get("amount") or 0) for tx in expenses)
    if not summary:
        summary = (
            f"{len(transactions)} transações encontradas: "
            f"{len(incomes)} receitas e {len(expenses)} despesas."
        )
    return {
        "document_type": document_type,
        "is_financial": is_financial,
        "extraction_method": extraction_method,
        "confidence": _clamp_float(confidence, 0.0, 1.0, default=0.5),
        "requires_confirmation": bool(transactions),
        "transactions": transactions,
        "issues": issues,
        "summary": summary,
        "period_start": _normalize_date(period_start),
        "period_end": _normalize_date(period_end),
        "totals": {
            "income": round(total_income, 2),
            "expense": round(total_expense, 2),
            "transactions": len(transactions),
        },
        "source": source,
    }


def _normalize_transactions(items: list[Any]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    seen: set[tuple[str, str, float]] = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        amount = _parse_amount(item.get("amount"))
        if amount is None or amount == 0:
            continue
        tx_type = str(item.get("type") or "").upper()
        if tx_type not in {"EXPENSE", "INCOME"}:
            tx_type = "EXPENSE" if amount < 0 else "INCOME"
        amount = abs(amount)
        description = str(item.get("description") or "").strip()
        if not description:
            continue
        date = _normalize_date(item.get("date"))
        key = (date or "", description.lower(), round(amount, 2))
        if key in seen:
            continue
        seen.add(key)
        normalized.append(
            {
                "date": date or datetime.now().date().isoformat(),
                "description": description[:255],
                "amount": round(float(amount), 2),
                "type": tx_type,
                "category": str(item.get("category") or "Outros").strip() or "Outros",
                "confidence": _clamp_float(item.get("confidence"), 0.0, 1.0, default=0.6),
                "raw": str(item.get("raw") or item.get("raw_evidence") or description)[:1000],
            }
        )
    return normalized


def _parse_amount(value: Any) -> float | None:
    if isinstance(value, int | float):
        return float(value)
    text = str(value or "").strip()
    if not text:
        return None
    text = text.replace("R$", "").replace(" ", "")
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    else:
        text = text.replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def _normalize_date(value: Any) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    if text.lower() in {"null", "none", "desconhecido"}:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def _clamp_float(value: Any, minimum: float, maximum: float, *, default: float) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default
    return max(minimum, min(maximum, parsed))


def _parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "sim", "yes", "1"}
    return bool(value)


def _parse_json_object(text: str) -> dict[str, Any] | None:
    content = (text or "").strip()
    if "```json" in content:
        content = content.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in content:
        content = content.split("```", 1)[1].split("```", 1)[0].strip()
    if not content.startswith("{"):
        start = content.find("{")
        end = content.rfind("}")
        if start >= 0 and end > start:
            content = content[start : end + 1]
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _is_docx(mimetype: str, filename: str) -> bool:
    return (
        "wordprocessingml.document" in mimetype
        or mimetype == "application/msword"
        or filename.endswith(".docx")
    )


def _is_truncated(text: str) -> bool:
    return "...[texto truncado]" in text


def _empty_result(method: str, message: str) -> dict[str, Any]:
    return {
        "document_type": "unknown",
        "is_financial": False,
        "extraction_method": method,
        "confidence": 0.0,
        "requires_confirmation": False,
        "transactions": [],
        "issues": [message],
        "summary": message,
        "source": {},
    }
