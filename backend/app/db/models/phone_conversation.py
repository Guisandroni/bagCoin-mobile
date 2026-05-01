"""PhoneConversation model — WhatsApp conversation context tracking."""

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class PhoneConversation(Base, TimestampMixin):
    """Tracks WhatsApp/Telegram conversation context for BagCoin agents.

    This is separate from the template's Conversation model (which tracks
    AI chat sessions). This model stores intent, context, and message
    history for the BagCoin agent orchestration flow.

    Attributes:
        id: Auto-increment primary key.
        user_id: FK to phone_users.
        channel: Communication channel (whatsapp, telegram, etc.).
        last_intent: Last detected intent by the agent.
        context_json: JSON blob for conversation context.
        message_history: JSON list of recent messages.
    """

    __tablename__ = "phone_conversations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("phone_users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    channel: Mapped[str] = mapped_column(String(20), default="whatsapp", nullable=False)
    last_intent: Mapped[str | None] = mapped_column(String(50), nullable=True)
    context_json: Mapped[dict | None] = mapped_column(JSON, default=dict, nullable=True)
    message_history: Mapped[list | None] = mapped_column(JSON, default=list, nullable=True)

    # Relationships
    phone_user: Mapped["PhoneUser"] = relationship("PhoneUser", back_populates="conversations")

    def __repr__(self) -> str:
        return (
            f"<PhoneConversation(id={self.id}, user_id={self.user_id}, "
            f"channel={self.channel})>"
        )
