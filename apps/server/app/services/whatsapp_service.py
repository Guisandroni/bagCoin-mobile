"""WhatsApp service — sends messages via WhatsApp Bridge.

Uses httpx to communicate with the WhatsApp Bridge API.
"""

import logging

import httpx

from app.core.config import settings

settings = settings
logger = logging.getLogger(__name__)


async def send_whatsapp_message(phone_number: str, message: str) -> bool:
    """Envia mensagem de volta ao usuário via WhatsApp Bridge."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.WHATSAPP_BRIDGE_URL}/send",
                json={"phone_number": phone_number, "message": message},
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            logger.info(f"Mensagem enviada para {phone_number}")
            return True
    except Exception as e:
        logger.error(f"Erro ao enviar mensagem WhatsApp: {e}")
        return False
