import logging
import httpx
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

async def send_whatsapp_message(phone_number: str, message: str) -> bool:
    """Envia mensagem de volta ao usuário via WhatsApp Bridge."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.whatsapp_bridge_url}/send",
                json={"phone_number": phone_number, "message": message},
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            logger.info(f"Mensagem enviada para {phone_number}")
            return True
    except Exception as e:
        logger.error(f"Erro ao enviar mensagem WhatsApp: {e}")
        return False
