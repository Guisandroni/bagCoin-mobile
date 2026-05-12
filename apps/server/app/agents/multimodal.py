"""Multimodal agent — processes audio, image, and document media.

Audio:  Groq Whisper (whisper-large-v3-turbo)
Image:  Groq Llama-4-Scout → Gemini 2.0 Flash (fallback chain)
Docs:   PyPDF2, CSV/OFX text decode
"""

import base64
import io
import json
import logging
import os
import tempfile
from typing import Any
from collections.abc import Mapping

import urllib.request

from groq import Groq

from app.agents.multimodal_types import MultimodalResult
from app.agents.prompts.image_receipt import IMAGE_RECEIPT_PROMPT
from app.core.config import settings
from app.services.docx_text import extract_docx_text

logger = logging.getLogger(__name__)

MEDIA_FAILURE_PREFIXES = (
    "[Transcrição de áudio indisponível",
    "[Não consegui entender o áudio",
    "[Não consegui analisar a imagem",
    "[Erro ao decodificar documento",
    "[Não consegui ler o arquivo",
    "[Processamento de PDF indisponível",
    "[O PDF parece estar vazio",
    "[Não consegui processar o PDF",
    "[Tipo de documento não suportado",
    "[Formato de mídia não reconhecido",
)

WHISPER_HALLUCINATIONS = frozenset({
    "obrigado por assistir",
    "obrigada por assistir",
    "legendas pela comunidade",
    "transcrição e legendas",
    "inscreva-se no canal",
})


# ── Clients ────────────────────────────────────────────────

def _configured_api_key(value: str | None) -> str | None:
    key = (value or "").strip()
    if not key:
        return None
    placeholders = ("***", "coloque_sua_chave", "sua_chave", "change-me", "changeme")
    if any(marker in key.lower() for marker in placeholders):
        return None
    return key


def _get_groq_client() -> Groq | None:
    api_key = _configured_api_key(settings.GROQ_API_KEY)
    if not api_key:
        return None
    return Groq(api_key=api_key)


# ── Audio ──────────────────────────────────────────────────

def process_audio(media: dict[str, Any]) -> MultimodalResult:
    """Transcreve audio usando Groq Whisper.

    Suporta: ogg, mp3, m4a, wav, webm.
    """
    client = _get_groq_client()
    if not client:
        return MultimodalResult(
            text="",
            provider="groq_whisper",
            failure=True,
            reason="missing_groq_api_key",
        )

    try:
        audio_data = base64.b64decode(media["data"])
        mimetype = media.get("mimetype", "audio/ogg")

        ext_map = {
            "audio/ogg": ".ogg", "audio/mpeg": ".mp3", "audio/mp4": ".m4a",
            "audio/wav": ".wav", "audio/webm": ".webm",
        }
        ext = ext_map.get(mimetype, ".ogg")

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-large-v3-turbo",
                    language="pt",
                    response_format="verbose_json",
                    prompt="Transcrição em pt-BR. Vocabulário financeiro: reais, pix, mercado, orçamento, meta, gasto, receita.",
                )
            if isinstance(transcription, str):
                text = transcription.strip()
                duration = None
            else:
                text = str(getattr(transcription, "text", "") or "").strip()
                duration = getattr(transcription, "duration", None)
                if not text and isinstance(transcription, Mapping):
                    text = str(transcription.get("text", "") or "").strip()
                    duration = transcription.get("duration")
            confidence, reason = _audio_confidence(text, duration)
            logger.info(f"Áudio transcrito: {text[:80]}...")
            return MultimodalResult(
                text=text,
                confidence=confidence,
                reason=reason,
                provider="groq_whisper",
            )
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        logger.error(f"Erro na transcrição: {e}")
        return MultimodalResult(
            text="",
            provider="groq_whisper",
            failure=True,
            reason="transcription_error",
        )


def _audio_confidence(text: str, duration: float | None) -> tuple[str, str | None]:
    """Classify transcription confidence using simple deterministic guards."""
    text_clean = (text or "").strip()
    if len(text_clean) < 3:
        return "low", "too_short"
    text_norm = text_clean.lower()
    hallucinations = WHISPER_HALLUCINATIONS | {
        phrase.lower() for phrase in settings.EXTRA_WHISPER_HALLUCINATIONS
    }
    if any(phrase in text_norm for phrase in hallucinations):
        return "low", "whisper_hallucination"
    if duration is not None:
        try:
            if float(duration) < 0.5:
                return "low", "audio_too_short"
        except (TypeError, ValueError):
            pass
    return "normal", None


# ── Image ──────────────────────────────────────────────────

def _image_groq(mimetype: str, b64_data: str) -> str | None:
    """Analise de imagem via Groq Llama-4-Scout (multimodal)."""
    client = _get_groq_client()
    if not client:
        return None
    try:
        data_uri = f"data:{mimetype};base64,{b64_data}"
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": _image_prompt()},
                    {"type": "image_url", "image_url": {"url": data_uri}},
                ],
            }],
            max_tokens=1024,
            temperature=0.2,
        )
        text = response.choices[0].message.content.strip()
        logger.info(f"Imagem analisada (Groq Llama-4): {text[:80]}...")
        return text
    except Exception as e:
        logger.warning(f"Groq Llama-4 Vision falhou: {e}")
        return None


def _image_gemini(mimetype: str, b64_data: str) -> str | None:
    """Analise de imagem via Gemini 2.0 Flash (fallback)."""
    if not settings.GEMINI_API_KEY:
        return None
    try:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        )
        body = json.dumps({
            "contents": [{
                "parts": [
                    {"text": _image_prompt()},
                    {"inline_data": {"mime_type": mimetype, "data": b64_data}},
                ]
            }]
        }).encode()
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req, timeout=20)
        data = json.loads(resp.read())
        if "candidates" in data:
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            logger.info(f"Imagem analisada (Gemini): {text[:80]}...")
            return text
    except Exception as e:
        logger.warning(f"Gemini Vision falhou: {e}")
    return None


def _image_prompt() -> str:
    if settings.IMAGE_STRUCTURED_EXTRACT:
        return IMAGE_RECEIPT_PROMPT
    return (
        "Extraia TODO o texto visível nesta imagem. "
        "Se for nota fiscal, comprovante ou recibo, liste: "
        "estabelecimento, data, valor total, itens. "
        "Responda em português."
    )


def _parse_json_object(text: str) -> dict[str, Any] | None:
    """Parse a JSON object from model output, including fenced JSON."""
    content = (text or "").strip()
    if not content:
        return None
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


def _image_result_from_text(text: str, provider: str) -> MultimodalResult:
    structured = _parse_json_object(text) if settings.IMAGE_STRUCTURED_EXTRACT else None
    if structured:
        raw_text = str(structured.get("raw_text") or "").strip()
        establishment = str(structured.get("establishment") or "").strip()
        total = structured.get("total_amount")
        text_parts = [part for part in [establishment, f"R$ {total}" if total else "", raw_text] if part]
        result_text = "\n".join(text_parts) or raw_text or text
        logger.info(
            "[image_receipt] structured=True establishment=%s raw_text_len=%s",
            establishment or None,
            len(raw_text),
        )
        return MultimodalResult(text=result_text, structured=structured, provider=provider)
    return MultimodalResult(text=text, provider=provider)


def _failure_message(source_format: str, reason: str | None) -> str:
    if source_format == "audio":
        return "Não consegui entender o áudio. Pode enviar novamente, repetir ou escrever em texto?"
    if source_format == "image":
        return "Não consegui analisar a imagem. Pode descrever o conteúdo em texto?"
    if source_format == "document":
        return "Não consegui ler esse documento. Pode enviar novamente ou descrever em texto?"
    return "Não consegui processar essa mídia. Pode enviar novamente ou escrever em texto?"


def _low_confidence_message(source_format: str, reason: str | None) -> str:
    if source_format == "audio":
        return "Não consegui entender o áudio com segurança. Pode enviar novamente, repetir ou escrever em texto?"
    return _failure_message(source_format, reason)


def process_image(media: dict[str, Any]) -> MultimodalResult:
    """Extrai texto de imagem — Llama-4-Scout → Gemini.

    Útil para notas fiscais, comprovantes, prints de banco.
    Resizes large images to avoid Groq/Gemini payload limits.
    """
    mimetype = media.get("mimetype", "image/jpeg")
    try:
        raw_bytes = base64.b64decode(media["data"])
    except Exception as exc:
        logger.error(f"Failed to decode image data: {exc}")
        return MultimodalResult(text="", provider="image", failure=True, reason="decode_error")

    # Downscale before sending to model (Bug 8.1 fix)
    resized, new_mimetype = _maybe_resize_image(raw_bytes, mimetype)
    b64_data = base64.b64encode(resized).decode("ascii")

    # 1. Groq Llama-4-Scout (multimodal nativo)
    result = _image_groq(new_mimetype, b64_data)
    if result:
        return _image_result_from_text(result, "groq_llama4")

    # 2. Gemini 2.0 Flash (fallback)
    result = _image_gemini(new_mimetype, b64_data)
    if result:
        return _image_result_from_text(result, "gemini")

    return MultimodalResult(text="", provider="image", failure=True, reason="vision_unavailable")


# ── Document ───────────────────────────────────────────────

def _is_docx_media(mimetype: str, filename: str) -> bool:
    return (
        "wordprocessingml.document" in mimetype
        or mimetype == "application/msword"
        or filename.lower().endswith(".docx")
    )


def process_document(media: dict[str, Any]) -> MultimodalResult:
    """Extrai texto de documento (PDF, CSV, OFX)."""
    mimetype = media.get("mimetype", "application/pdf")
    filename = media.get("filename", "")

    try:
        doc_data = base64.b64decode(media["data"])
    except Exception as e:
        logger.error(f"Erro ao decodificar documento: {e}")
        return MultimodalResult(text="", provider="document", failure=True, reason="decode_error")

    # CSV / OFX / TXT
    if mimetype in ("text/csv", "application/csv", "text/plain", "application/ofx", "text/ofx"):
        try:
            text = doc_data.decode("utf-8", errors="replace").strip()
            logger.info(f"Documento texto ({mimetype}): {len(text)} chars")
            return MultimodalResult(text=text, provider="document_text")
        except Exception as e:
            logger.error(f"Erro ao decodificar texto: {e}")
            return MultimodalResult(text="", provider="document_text", failure=True, reason="text_decode_error")

    # PDF
    if mimetype == "application/pdf":
        try:
            import PyPDF2
        except ImportError:
            return MultimodalResult(text="", provider="pdf", failure=True, reason="pdf_library_missing")

        try:
            pdf_file = io.BytesIO(doc_data)
            reader = PyPDF2.PdfReader(pdf_file)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            full_text = "\n".join(text_parts).strip()
            if not full_text:
                return MultimodalResult(text="", provider="pdf", failure=True, reason="pdf_empty")
            if len(full_text) > 4000:
                full_text = full_text[:4000] + "\n...[texto truncado]"
            logger.info(f"PDF extraído: {len(full_text)} chars")
            return MultimodalResult(text=full_text, provider="pdf")
        except Exception as e:
            logger.error(f"Erro no PDF: {e}")
            return MultimodalResult(text="", provider="pdf", failure=True, reason="pdf_error")

    # DOCX
    if _is_docx_media(mimetype, filename):
        text = extract_docx_text(doc_data)
        if not text:
            return MultimodalResult(text="", provider="docx", failure=True, reason="docx_empty")
        if len(text) > 4000:
            text = text[:4000] + "\n...[texto truncado]"
        logger.info(f"DOCX extraído: {len(text)} chars")
        return MultimodalResult(text=text, provider="docx")

    return MultimodalResult(text="", provider="document", failure=True, reason="unsupported_document")


# ── Entry Point ────────────────────────────────────────────

def process_multimodal(state: dict[str, Any]) -> dict[str, Any]:
    """Processa mídia (áudio, imagem, documento) e extrai texto."""
    source_format = state.get("source_format", "text")
    media = state.get("context", {}).get("media")

    if source_format == "text" or not media:
        return state

    source_format = _source_format_from_media(source_format, media)

    logger.info(f"Processando mídia: {source_format}")

    if source_format == "audio":
        result = process_audio(media)
    elif source_format == "image":
        result = process_image(media)
    elif source_format == "document":
        result = process_document(media)
    else:
        result = MultimodalResult(text="", failure=True, reason="unknown_format")
    result = _coerce_result(result, source_format)

    if (
        result.is_failure
        and source_format == "document"
        and result.reason == "pdf_empty"
        and settings.USE_TOOL_AGENTS
    ):
        state["context"] = state.get("context", {})
        state["context"]["extracted_media_text"] = ""
        state["context"]["original_format"] = source_format
        state["context"]["media_provider"] = result.provider
        return state

    if result.is_failure:
        state["error"] = f"media_failure:{result.reason or 'unknown'}"
        state["response"] = _failure_message(source_format, result.reason)
        return state

    if result.confidence == "low":
        state["error"] = f"media_low_confidence:{result.reason or 'unknown'}"
        state["response"] = _low_confidence_message(source_format, result.reason)
        return state

    if source_format == "image" and result.structured is not None:
        if not result.structured.get("is_receipt", True) and not settings.USE_TOOL_AGENTS:
            state["response"] = (
                "Essa imagem não parece um comprovante. "
                "Pode mandar uma nota fiscal ou descrever em texto?"
            )
            return state

    state["message"] = result.text
    state["context"] = state.get("context", {})
    state["context"]["extracted_media_text"] = result.text
    state["context"]["original_format"] = source_format
    state["context"]["media_provider"] = result.provider
    if source_format == "audio":
        state["context"]["audio_transcription"] = result.text
    if result.structured:
        state["context"]["image_structured"] = result.structured

    logger.info(f"Texto extraído ({result.provider}): {result.text[:80]}...")
    return state


def _coerce_result(result: MultimodalResult | str, source_format: str) -> MultimodalResult:
    """Support legacy string-returning test doubles while processors migrate."""
    if isinstance(result, MultimodalResult):
        return result
    text = str(result)
    if text.startswith(MEDIA_FAILURE_PREFIXES):
        return MultimodalResult(text="", provider=source_format, failure=True, reason=text.strip("[]"))
    return MultimodalResult(text=text, provider=source_format)


def _source_format_from_media(source_format: str, media: dict[str, Any]) -> str:
    """Normalize bridge-specific message types using the media mimetype.

    Fallbacks (Bug 8.1 fix):
    - octet-stream / missing mimetype → infer from filename extension
    - unknown → keep source_format
    """
    mimetype = str(media.get("mimetype") or "").lower()
    filename = str(media.get("filename") or "").lower()

    if mimetype.startswith("audio/"):
        return "audio"
    if mimetype.startswith("image/"):
        return "image"
    if mimetype in {
        "application/pdf",
        "text/csv",
        "application/csv",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    }:
        return "document"

    # Fallback by filename extension
    if filename:
        ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
        ext_map = {
            "ogg": "audio", "mp3": "audio", "m4a": "audio", "wav": "audio", "webm": "audio",
            "jpg": "image", "jpeg": "image", "png": "image", "webp": "image", "gif": "image",
            "pdf": "document", "csv": "document", "txt": "document", "ofx": "document",
            "docx": "document", "doc": "document",
        }
        if ext in ext_map:
            return ext_map[ext]

    return source_format


def _maybe_resize_image(data: bytes, mimetype: str) -> tuple[bytes, str]:
    """Downscale large images to avoid hitting Groq/Gemini payload limits.

    Only runs if the image exceeds ~4MB. Returns (data, mimetype) unchanged
    if Pillow is unavailable or the image is already small.
    """
    MAX_BYTES = 4_000_000
    if len(data) <= MAX_BYTES:
        return data, mimetype
    try:
        from io import BytesIO

        from PIL import Image
    except ImportError:
        logger.warning("Pillow not installed — skipping large-image resize")
        return data, mimetype

    try:
        img = Image.open(BytesIO(data))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        # Scale so longest side is at most 2048px
        img.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=85, optimize=True)
        new_data = buf.getvalue()
        logger.info(
            f"Image resized: {len(data)} → {len(new_data)} bytes ({mimetype} → image/jpeg)"
        )
        return new_data, "image/jpeg"
    except Exception as exc:
        logger.warning(f"Image resize failed, using original: {exc}")
        return data, mimetype
