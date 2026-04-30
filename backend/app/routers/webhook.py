import os
import base64
import logging
import re
import time
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.schemas import WebhookPayload, WhatsAppResponse
from app.agents.orchestrator import orchestrator
from app.config import get_settings
from app.agents.tenant_context import tenant_phone_error
import redis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["webhook"])
settings = get_settings()

# Redis client para deduplicação
_redis = None
try:
    _redis = redis.from_url(settings.redis_url, decode_responses=True)
    _redis.ping()
    logger.info("✅ Redis conectado para deduplicação")
except Exception as e:
    logger.warning(f"⚠️ Redis indisponível para deduplicação: {e}")
    _redis = None


def normalize_whatsapp_id(chat_id: str) -> str:
    """Remove @c.us, @lid, @g.us e outros sufixos, mantendo só dígitos."""
    if not chat_id:
        return chat_id
    number = chat_id.split("@")[0]
    return re.sub(r"\D", "", number)


def is_duplicate_message(message_id: str) -> bool:
    """Retorna True se a mensagem já foi processada nos últimos 60 segundos."""
    if not message_id or not _redis:
        return False
    key = f"msg:processed:{message_id}"
    if _redis.exists(key):
        return True
    _redis.setex(key, 60, "1")
    return False


async def verify_api_key(x_api_key: str = Header(...)):
    """Verifica a API key do WhatsApp Bridge."""
    if x_api_key != settings.whatsapp_api_key:
        raise HTTPException(status_code=401, detail="API Key inválida")
    return x_api_key


@router.post("/whatsapp", response_model=WhatsAppResponse)
async def receive_whatsapp_message(
    payload: WebhookPayload,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """Recebe mensagens do WhatsApp Bridge e processa via orquestrador."""
    
    # 1. Sanitiza phone_number
    raw_phone = payload.phone_number
    phone_number = normalize_whatsapp_id(raw_phone)
    
    terr = tenant_phone_error(phone_number)
    if terr:
        logger.warning(f"Webhook rejeitado — telefone inválido após normalização: {raw_phone!r}")
        return WhatsAppResponse(reply=f"⚠️ {terr}", actions=[])

    logger.info(f"Webhook recebido de {raw_phone} → {phone_number}: {payload.message[:50]}...")
    
    # 2. Deduplicação por message_id (se disponível) ou conteúdo
    msg_id = payload.raw_data.get("id") if payload.raw_data else None
    if not msg_id:
        msg_id = f"{phone_number}:{payload.message}:{payload.timestamp}"
    
    if is_duplicate_message(msg_id):
        logger.info(f"Mensagem {msg_id} já processada. Ignorando.")
        return WhatsAppResponse(reply="", actions=[])
    
    try:
        # 3. Determina formato da fonte
        source_format = "audio" if payload.type in ["ptt", "audio"] else "image" if payload.type in ["image"] else "document" if payload.type in ["document"] else "text"

        # 4. Prepara estado inicial
        context = {}
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
            "source_format": source_format
        }
        
        # 4. Executa o grafo de orquestração
        result = orchestrator.invoke(initial_state)

        response_text = result.get("response", "Processamento concluído.")

        logger.info(f"Resposta gerada para {phone_number}: {response_text[:100]}...")

        # 5. Se um relatório PDF foi gerado, lê e inclui na resposta
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
                    "filename": filename
                }
                logger.info(f"PDF anexado à resposta: {filename}")
            except Exception as e:
                logger.error(f"Erro ao ler PDF para envio: {e}")

        return WhatsAppResponse(
            reply=response_text,
            document=document,
            actions=[]
        )
        
    except Exception as e:
        logger.error(f"Erro no processamento do webhook: {e}", exc_info=True)
        return WhatsAppResponse(
            reply="❌ Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
            actions=[]
        )


@router.get("/health")
async def webhook_health():
    """Health check do webhook."""
    redis_status = "ok" if (_redis and _redis.ping()) else "unavailable"
    return {"status": "ok", "service": "webhook", "redis": redis_status}
