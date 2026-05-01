"""Multimodal agent — processes audio, image, and document media.

Uses Groq API for audio transcription and vision analysis.
"""

import base64
import io
import logging
import os
import tempfile
from typing import Any

from groq import Groq

from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_groq_client() -> Groq | None:
    """Retorna cliente Groq para APIs de áudio/visão."""
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY não configurada. Multimodal indisponível.")
        return None
    return Groq(api_key=settings.GROQ_API_KEY)


def process_audio(media: dict[str, Any]) -> str:
    """Transcreve áudio (PTT) usando Whisper via Groq API.

    Args:
        media: dict com 'mimetype' e 'data' (base64)

    Returns:
        Texto transcrito ou mensagem de erro
    """
    client = _get_groq_client()
    if not client:
        return "[Transcrição indisponível — API key não configurada]"

    try:
        audio_data = base64.b64decode(media["data"])
        mimetype = media.get("mimetype", "audio/ogg")

        # Determina extensão pelo mimetype
        ext_map = {
            "audio/ogg": ".ogg",
            "audio/mpeg": ".mp3",
            "audio/mp4": ".m4a",
            "audio/wav": ".wav",
            "audio/webm": ".webm",
        }
        ext = ext_map.get(mimetype, ".ogg")

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=audio_file, model="whisper-large-v3", language="pt", response_format="text"
                )

            text = (
                transcription.strip()
                if isinstance(transcription, str)
                else str(transcription).strip()
            )
            logger.info(f"Áudio transcrito: {text[:80]}...")
            return text
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        logger.error(f"Erro na transcrição de áudio: {e}")
        return "[Não consegui entender o áudio. Pode tentar de novo ou enviar como texto?]"


def process_image(media: dict[str, Any]) -> str:
    """Extrai texto de imagem usando visão LLM (Groq).
    Útil para notas fiscais, comprovantes, prints de banco.

    Args:
        media: dict com 'mimetype' e 'data' (base64)

    Returns:
        Texto extraído da imagem ou mensagem de erro
    """
    client = _get_groq_client()
    if not client:
        return "[Análise de imagem indisponível — API key não configurada]"

    try:
        mimetype = media.get("mimetype", "image/jpeg")
        b64_data = media["data"]

        # Data URI para visão
        data_uri = f"data:{mimetype};base64,{b64_data}"

        response = client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Extraia TODO o texto visível nesta imagem. "
                                "Se for uma nota fiscal, comprovante ou recibo, "
                                "liste: estabelecimento, data, valor total, itens. "
                                "Responda em português."
                            ),
                        },
                        {"type": "image_url", "image_url": {"url": data_uri}},
                    ],
                }
            ],
            max_tokens=1024,
            temperature=0.2,
        )

        text = response.choices[0].message.content.strip()
        logger.info(f"Imagem analisada: {text[:80]}...")
        return text

    except Exception as e:
        logger.error(f"Erro na análise de imagem: {e}")
        return "[Não consegui analisar a imagem. Pode descrever o conteúdo em texto?]"


def process_document(media: dict[str, Any]) -> str:
    """Extrai texto de documento (PDF, CSV, OFX).

    Args:
        media: dict com 'mimetype', 'data' (base64), 'filename'

    Returns:
        Texto extraído ou mensagem de erro
    """
    mimetype = media.get("mimetype", "application/pdf")

    try:
        doc_data = base64.b64decode(media["data"])
    except Exception as e:
        logger.error(f"Erro ao decodificar documento: {e}")
        return "[Erro ao decodificar documento.]"

    # CSV / OFX / TXT: decodifica como texto diretamente
    if mimetype in ("text/csv", "application/csv", "text/plain", "application/ofx", "text/ofx"):
        try:
            text = doc_data.decode("utf-8", errors="replace").strip()
            logger.info(f"Documento texto ({mimetype}) extraído: {len(text)} caracteres")
            return text
        except Exception as e:
            logger.error(f"Erro ao decodificar texto: {e}")
            return "[Não consegui ler o arquivo de texto.]"

    # PDF: extrai com PyPDF2
    if mimetype == "application/pdf":
        try:
            import PyPDF2
        except ImportError:
            logger.error("PyPDF2 não instalado. Não é possível processar PDFs.")
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
                return "[O PDF parece estar vazio ou conter apenas imagens. Não consegui extrair texto.]"
            if len(full_text) > 4000:
                full_text = full_text[:4000] + "\n...[texto truncado]"
            logger.info(f"PDF extraído: {len(full_text)} caracteres")
            return full_text
        except Exception as e:
            logger.error(f"Erro no processamento de PDF: {e}")
            return "[Não consegui processar o PDF. Pode tentar enviar como imagem ou descrever o conteúdo?]"

    return f"[Tipo de documento não suportado: {mimetype}. Envie PDF, CSV ou OFX.]"


def process_multimodal(state: dict[str, Any]) -> dict[str, Any]:
    """Processa mídia (áudio, imagem, documento) e extrai texto.

    Atualiza o estado com:
    - 'message' = texto extraído da mídia
    - 'source_format' = tipo original
    - 'extracted_media_text' = texto bruto extraído (para contexto)
    """
    source_format = state.get("source_format", "text")
    media = state.get("context", {}).get("media")

    if source_format == "text" or not media:
        return state

    logger.info(f"Processando mídia tipo: {source_format}")

    if source_format == "audio":
        extracted = process_audio(media)
    elif source_format == "image":
        extracted = process_image(media)
    elif source_format == "document":
        extracted = process_document(media)
    else:
        extracted = "[Formato de mídia não reconhecido]"

    # Atualiza estado
    state["message"] = extracted
    state["context"] = state.get("context", {})
    state["context"]["extracted_media_text"] = extracted
    state["context"]["original_format"] = source_format

    logger.info(f"Texto extraído da mídia: {extracted[:80]}...")
    return state
