import base64
import time
from typing import Annotated
from fastapi import APIRouter, Request
from ...core.metrics import webhook_requests_total, webhook_latency_seconds
from ...tasks.agent_tasks import process_agent_message_task
from ...schemas.webhook import WebhookPayload, WebhookResponse
from ...config import settings

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Redis client for message deduplication
_redis = None
try:
    import redis
    _redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
    _redis.ping()
except Exception:
    _redis = None


def _is_duplicate_message(message_id: str) -> bool:
    """Return True if this message was already processed in the last 60 seconds."""
    if not message_id or not _redis:
        return False
    key = f"msg:processed:{message_id}"
    if _redis.exists(key):
        return True
    _redis.setex(key, 60, "1")
    return False


def _extract_greenapi_body(body: dict) -> tuple[str | None, bytes | None, str | None]:
    message_data = body.get("messageData", {})
    type_message = message_data.get("typeMessage")
    message_text = None
    file_bytes = None
    file_type = None

    if type_message == "textMessage":
        message_text = message_data.get("textMessageData", {}).get("textMessage")
    elif type_message == "extendedTextMessage":
        message_text = message_data.get("extendedTextMessageData", {}).get("text")
    elif type_message in ["imageMessage", "audioMessage", "documentMessage"]:
        file_data = message_data.get(f"{type_message}Data", {})
        download_url = file_data.get("downloadUrl")
        caption = file_data.get("caption")
        if caption:
            message_text = caption

        if download_url:
            import httpx

            with httpx.Client() as client:
                resp = client.get(download_url)
                if resp.status_code == 200:
                    file_bytes = resp.content
                    if type_message == "imageMessage":
                        file_type = "image"
                    elif type_message == "audioMessage":
                        file_type = "audio"
                    elif type_message == "documentMessage":
                        file_name = file_data.get("fileName", "").lower()
                        if file_name.endswith(".pdf"):
                            file_type = "pdf"

    return message_text, file_bytes, file_type


@router.post("/green-api", response_model=WebhookResponse)
async def green_api_webhook(request: Request):
    start = time.time()
    body = await request.json()
    chat_id = body.get("senderData", {}).get("chatId")

    if not chat_id:
        webhook_requests_total.labels(platform="green_api", status="ignored").inc()
        return WebhookResponse(status="ignored")

    message_text, file_bytes, file_type = _extract_greenapi_body(body)

    if message_text or file_bytes:
        file_bytes_b64 = base64.b64encode(file_bytes).decode("utf-8") if file_bytes else None
        process_agent_message_task.delay(
            chat_id, "whatsapp", message_text, file_bytes_b64, file_type
        )
        webhook_requests_total.labels(platform="green_api", status="queued").inc()

    webhook_latency_seconds.labels(platform="green_api").observe(time.time() - start)
    return WebhookResponse(status="queued")


@router.post("/telegram", response_model=WebhookResponse)
async def telegram_webhook(request: Request):
    start = time.time()
    body = await request.json()
    chat_id = body.get("senderData", {}).get("chatId")

    if not chat_id:
        webhook_requests_total.labels(platform="telegram", status="ignored").inc()
        return WebhookResponse(status="ignored")

    message_text, file_bytes, file_type = _extract_greenapi_body(body)

    if message_text or file_bytes:
        file_bytes_b64 = base64.b64encode(file_bytes).decode("utf-8") if file_bytes else None
        process_agent_message_task.delay(
            chat_id, "telegram", message_text, file_bytes_b64, file_type
        )
        webhook_requests_total.labels(platform="telegram", status="queued").inc()

    webhook_latency_seconds.labels(platform="telegram").observe(time.time() - start)
    return WebhookResponse(status="queued")


@router.post("/whatsapp", response_model=WebhookResponse)
async def whatsapp_web_webhook(
    request: Request,
    payload: WebhookPayload,
):
    start = time.time()
    chat_id = payload.chatId

    if not chat_id:
        webhook_requests_total.labels(
            platform="whatsapp_bridge", status="ignored"
        ).inc()
        return WebhookResponse(status="ignored")

    if payload.isGroup:
        webhook_requests_total.labels(
            platform="whatsapp_bridge", status="ignored_group"
        ).inc()
        return WebhookResponse(status="ignored_group")

    if payload.messageId and _is_duplicate_message(payload.messageId):
        webhook_requests_total.labels(
            platform="whatsapp_bridge", status="ignored_duplicate"
        ).inc()
        return WebhookResponse(status="ignored_duplicate")

    file_bytes = None
    if payload.fileBytes:
        if isinstance(payload.fileBytes, str):
            file_bytes = payload.fileBytes
        else:
            file_bytes = base64.b64encode(bytes(payload.fileBytes)).decode("utf-8")

    if payload.messageText or file_bytes:
        process_agent_message_task.delay(
            chat_id,
            "whatsapp",
            payload.messageText,
            file_bytes,
            payload.fileType,
            payload.pushname,
        )
        webhook_requests_total.labels(
            platform="whatsapp_bridge", status="queued"
        ).inc()

    webhook_latency_seconds.labels(platform="whatsapp_bridge").observe(
        time.time() - start
    )
    return WebhookResponse(status="queued")
