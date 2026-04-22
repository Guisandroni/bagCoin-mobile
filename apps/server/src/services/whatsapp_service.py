import httpx
from typing import Optional
from ..config import settings

WHATSAPP_BRIDGE_URL = settings.WHATSAPP_BRIDGE_URL

async def send_whatsapp_message(chat_id: str, text: str):
    """Send a text message via the WhatsApp Web bridge."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{WHATSAPP_BRIDGE_URL}/send-message",
            json={"chatId": chat_id, "text": text},
            timeout=30.0
        )
        resp.raise_for_status()
        return resp.json()

async def send_whatsapp_file(chat_id: str, base64_file: str, filename: str, caption: Optional[str] = None):
    """Send a file via the WhatsApp Web bridge."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{WHATSAPP_BRIDGE_URL}/send-file",
            json={
                "chatId": chat_id,
                "base64File": base64_file,
                "filename": filename,
                "caption": caption or ""
            },
            timeout=60.0
        )
        resp.raise_for_status()
        return resp.json()
