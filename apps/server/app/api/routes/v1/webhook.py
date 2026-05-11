"""Webhook routes for BagCoin WhatsApp message processing.

Receives messages from WhatsApp Bridge, validates, deduplicates,
and processes via the LangGraph orchestrator.
"""

import base64
import logging
import os
import re

from fastapi import APIRouter, Depends, Header, HTTPException

from app.agents.orchestrator import orchestrator
from app.agents.persistence import get_or_create_user_sync
from app.agents.tenant_context import tenant_phone_error
from app.api.deps import verify_api_key as verify_telegram_api_key
from app.core.config import settings
from app.schemas.common import (
    TelegramResponse,
    TelegramWebhookPayload,
    WebhookPayload,
    WhatsAppResponse,
)
from app.services.integration_service import redact_message_for_log

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["webhook"])

# Redis client para deduplicação (lazy init)
_redis = None
_redis_initialized = False


def _get_redis():
    global _redis, _redis_initialized
    if _redis_initialized:
        return _redis
    _redis_initialized = True
    try:
        import redis as redis_module

        _redis = redis_module.from_url(settings.REDIS_URL, decode_responses=True, socket_timeout=2)
        _redis.ping()
        logger.info("Redis conectado para deduplicação")
    except Exception as e:
        logger.warning(f"Redis indisponível para deduplicação: {e}")
        _redis = None
    return _redis


def normalize_whatsapp_id(chat_id: str) -> str:
    """Remove @c.us, @lid, @g.us e outros sufixos, mantendo só dígitos."""
    if not chat_id:
        return chat_id
    number = chat_id.split("@")[0]
    return re.sub(r"\D", "", number)


def is_duplicate_message(message_id: str) -> bool:
    """Retorna True se a mensagem já foi processada nos últimos 60 segundos."""
    r = _get_redis()
    if not message_id or not r:
        return False
    key = f"msg:processed:{message_id}"
    if r.exists(key):
        return True
    r.setex(key, 60, "1")
    return False


def _source_format_from_payload(message_type: str | None, media: dict | None = None) -> str:
    """Normalize WhatsApp/bridge message types into BagCoin source formats."""
    media_type = str((media or {}).get("mimetype") or "").lower()
    raw_type = str(message_type or "").lower()

    if media_type.startswith("audio/") or raw_type in {"ptt", "audio", "voice"}:
        return "audio"
    if media_type.startswith("image/") or raw_type in {"image", "sticker"}:
        return "image"
    if media_type or raw_type in {"document", "file"}:
        return "document"
    return "text"


async def verify_api_key(x_api_key: str = Header(...)):
    """Verifica a API key do WhatsApp Bridge."""
    if x_api_key != settings.WHATSAPP_API_KEY:
        raise HTTPException(status_code=401, detail="API Key inválida")
    return x_api_key


@router.post("/whatsapp", response_model=WhatsAppResponse, tags=["csrf-exempt"])
async def receive_whatsapp_message(
    payload: WebhookPayload,
    api_key: str = Depends(verify_api_key),
):
    """Recebe mensagens do WhatsApp Bridge e processa via orquestrador."""

    # 1. Sanitiza phone_number
    raw_phone = payload.phone_number
    phone_number = normalize_whatsapp_id(raw_phone)

    terr = tenant_phone_error(phone_number)
    if terr:
        logger.warning(f"Webhook rejeitado — telefone inválido após normalização: {raw_phone!r}")
        return WhatsAppResponse(reply=f"⚠️ {terr}", actions=[])

    logger.info(
        "Webhook recebido de %s → %s: %s",
        raw_phone,
        phone_number,
        redact_message_for_log(payload.message or "", 50),
    )

    # 2. Deduplicação por message_id (se disponível) ou conteúdo
    msg_id = payload.raw_data.get("id") if payload.raw_data else None
    if not msg_id:
        msg_id = f"{phone_number}:{payload.message}:{payload.timestamp}"

    if is_duplicate_message(msg_id):
        logger.info(f"Mensagem {msg_id} já processada. Ignorando.")
        return WhatsAppResponse(reply="", actions=[])

    try:
        # 3. Determina formato da fonte
        source_format = _source_format_from_payload(payload.type, payload.media)

        # 4. Prepara estado inicial
        context = {"channel": "whatsapp"}
        if payload.media:
            context["media"] = payload.media

        initial_state = {
            "phone_number": phone_number,
            "user_id": None,
            "message": payload.message or "",
            "intent": None,
            "extracted_data": None,
            "query_result": None,
            "report_path": None,
            "report_summary": None,
            "response": None,
            "context": context,
            "error": None,
            "source_format": source_format,
        }

        # 5. Executa o grafo de orquestração
        result = orchestrator.invoke(initial_state)

        response_text = result.get("response") or "Processamento concluído. Se precisar de algo, é só falar! 😊"

        logger.info(f"Resposta gerada para {phone_number}: {response_text[:100]}...")

        # 6. Se um relatório PDF foi gerado, lê e inclui na resposta
        document = None
        report_path = result.get("report_path")
        if report_path and os.path.exists(report_path):
            try:
                with open(report_path, "rb") as f:
                    pdf_data = base64.b64encode(f.read()).decode("utf-8")
                filename = os.path.basename(report_path)
                document = {
                    "mimetype": "application/pdf",
                    "data": pdf_data,
                    "filename": filename,
                }
                logger.info(f"PDF anexado à resposta: {filename}")
            except Exception as e:
                logger.error(f"Erro ao ler PDF para envio: {e}")

        return WhatsAppResponse(
            reply=response_text,
            document=document,
            actions=[],
        )

    except Exception as e:
        logger.error(f"Erro no processamento do webhook: {e}", exc_info=True)
        return WhatsAppResponse(
            reply="Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
            actions=[],
        )


@router.post("/telegram", response_model=TelegramResponse, tags=["csrf-exempt"])
async def receive_telegram_message(
    payload: TelegramWebhookPayload,
    api_key: str = Depends(verify_telegram_api_key),
):
    """Recebe mensagens do Telegram bridge e processa via orquestrador."""

    # 1. Cria phone_number sintético
    phone_number = f"telegram:{payload.chat_id}"

    terr = tenant_phone_error(phone_number)
    if terr:
        logger.warning(f"Telegram webhook rejeitado — telefone inválido: {phone_number!r}")
        return TelegramResponse(reply=f"⚠️ {terr}", actions=[])

    # 2. Busca ou cria PhoneUser para garantir que existe
    try:
        get_or_create_user_sync(phone_number)
    except Exception as e:
        logger.error(f"Erro ao buscar/criar PhoneUser para {phone_number}: {e}")
        return TelegramResponse(
            reply="Erro ao identificar usuário. Tente novamente.",
            actions=[],
        )

    logger.info(
        "Telegram webhook recebido de %s (username=%s): %s",
        payload.chat_id,
        payload.username,
        redact_message_for_log(payload.message or "", 50),
    )

    # 3. Deduplicação simples (baseada em chat_id + message)
    msg_id = f"telegram:{payload.chat_id}:{payload.message}"
    if is_duplicate_message(msg_id):
        logger.info(f"Mensagem {msg_id} já processada. Ignorando.")
        return TelegramResponse(reply="", actions=[])

    try:
        # 4. Determina formato da fonte
        source_format = payload.source_format or "text"

        # 5. Prepara estado inicial
        context = {"channel": "telegram"}
        if payload.media:
            context["media"] = payload.media

        initial_state = {
            "phone_number": phone_number,
            "user_id": None,
            "message": payload.message or "",
            "intent": None,
            "extracted_data": None,
            "query_result": None,
            "report_path": None,
            "report_summary": None,
            "response": None,
            "context": context,
            "error": None,
            "source_format": source_format,
        }

        # 6. Executa o grafo de orquestração
        result = orchestrator.invoke(initial_state)

        response_text = result.get("response") or "Processamento concluído. Se precisar de algo, é só falar! 😊"

        logger.info(f"Resposta gerada para {phone_number}: {response_text[:100]}...")

        return TelegramResponse(
            reply=response_text,
            actions=[],
        )

    except Exception as e:
        logger.error(f"Erro no processamento do webhook Telegram: {e}", exc_info=True)
        return TelegramResponse(
            reply="Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
            actions=[],
        )


@router.get("/health")
async def webhook_health():
    """Health check do webhook."""
    r = _get_redis()
    redis_status = "ok" if (r and r.ping()) else "unavailable"
    return {"status": "ok", "service": "webhook", "redis": redis_status}
