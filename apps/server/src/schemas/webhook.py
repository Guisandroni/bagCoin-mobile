from typing import Optional
from pydantic import BaseModel


class WebhookPayload(BaseModel):
    chatId: str
    messageId: Optional[str] = None
    messageText: Optional[str] = None
    fileBytes: Optional[str] = None
    fileType: Optional[str] = None
    pushname: Optional[str] = None
    isGroup: bool = False


class WebhookResponse(BaseModel):
    status: str
