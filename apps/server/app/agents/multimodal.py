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

import urllib.request

from groq import Groq

from app.core.config import settings

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

def process_audio(media: dict[str, Any]) -> str:
    """Transcreve audio usando Groq Whisper.

    Suporta: ogg, mp3, m4a, wav, webm.
    """
    client = _get_groq_client()
    if not client:
        return "[Transcrição de áudio indisponível — configure GROQ_API_KEY]"

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
                    response_format="text",
                )
            text = transcription.strip() if isinstance(transcription, str) else str(transcription).strip()
            logger.info(f"Áudio transcrito: {text[:80]}...")
            return text
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        logger.error(f"Erro na transcrição: {e}")
        return "[Não consegui entender o áudio. Tente de novo ou envie como texto.]"


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
                    {"type": "text", "text": (
                        "Extraia TODO o texto visível nesta imagem. "
                        "Se for nota fiscal, comprovante ou recibo, liste: "
                        "estabelecimento, data, valor total, itens. "
                        "Responda em português."
                    )},
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
                    {"text": (
                        "Extraia TODO o texto visivel nesta imagem. "
                        "Se for nota fiscal, comprovante ou recibo, liste: "
                        "estabelecimento, data, valor total, itens. "
                        "Responda em portugues."
                    )},
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


def process_image(media: dict[str, Any]) -> str:
    """Extrai texto de imagem — Llama-4-Scout → Gemini.

    Útil para notas fiscais, comprovantes, prints de banco.
    """
    mimetype = media.get("mimetype", "image/jpeg")
    b64_data = media["data"]

    # 1. Groq Llama-4-Scout (multimodal nativo)
    result = _image_groq(mimetype, b64_data)
    if result:
        return result

    # 2. Gemini 2.0 Flash (fallback)
    result = _image_gemini(mimetype, b64_data)
    if result:
        return result

    return "[Não consegui analisar a imagem. Pode descrever o conteúdo em texto?]"


# ── Document ───────────────────────────────────────────────

def process_document(media: dict[str, Any]) -> str:
    """Extrai texto de documento (PDF, CSV, OFX)."""
    mimetype = media.get("mimetype", "application/pdf")

    try:
        doc_data = base64.b64decode(media["data"])
    except Exception as e:
        logger.error(f"Erro ao decodificar documento: {e}")
        return "[Erro ao decodificar documento.]"

    # CSV / OFX / TXT
    if mimetype in ("text/csv", "application/csv", "text/plain", "application/ofx", "text/ofx"):
        try:
            text = doc_data.decode("utf-8", errors="replace").strip()
            logger.info(f"Documento texto ({mimetype}): {len(text)} chars")
            return text
        except Exception as e:
            logger.error(f"Erro ao decodificar texto: {e}")
            return "[Não consegui ler o arquivo de texto.]"

    # PDF
    if mimetype == "application/pdf":
        try:
            import PyPDF2
        except ImportError:
            return "[Processamento de PDF indisponível. Biblioteca não instalada.]"

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
                return "[O PDF parece estar vazio ou conter apenas imagens.]"
            if len(full_text) > 4000:
                full_text = full_text[:4000] + "\n...[texto truncado]"
            logger.info(f"PDF extraído: {len(full_text)} chars")
            return full_text
        except Exception as e:
            logger.error(f"Erro no PDF: {e}")
            return "[Não consegui processar o PDF. Envie como imagem ou descreva o conteúdo.]"

    return f"[Tipo de documento não suportado: {mimetype}. Envie PDF, CSV ou OFX.]"


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
        extracted = process_audio(media)
    elif source_format == "image":
        extracted = process_image(media)
    elif source_format == "document":
        extracted = process_document(media)
    else:
        extracted = "[Formato de mídia não reconhecido]"

    if extracted.startswith(MEDIA_FAILURE_PREFIXES):
        state["error"] = extracted.strip("[]")
        state["response"] = (
            f"{extracted}\n\n"
            "Pode enviar novamente ou escrever a despesa/receita em texto?"
        )
        return state

    state["message"] = extracted
    state["context"] = state.get("context", {})
    state["context"]["extracted_media_text"] = extracted
    state["context"]["original_format"] = source_format

    logger.info(f"Texto extraído: {extracted[:80]}...")
    return state


def _source_format_from_media(source_format: str, media: dict[str, Any]) -> str:
    """Normalize bridge-specific message types using the media mimetype."""
    mimetype = str(media.get("mimetype") or "").lower()
    if mimetype.startswith("audio/"):
        return "audio"
    if mimetype.startswith("image/"):
        return "image"
    if mimetype in {"application/pdf", "text/csv", "application/csv", "text/plain"}:
        return "document"
    return source_format
