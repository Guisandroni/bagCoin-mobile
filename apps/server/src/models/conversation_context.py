from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column, JSON


class ConversationContext(SQLModel, table=True):
    """Persistent conversational state for multi-turn follow-ups.

    Stores follow-up flags and pending data so that conversational
    flow survives across Celery worker processes and restarts.
    """

    __tablename__ = "conversation_context"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, unique=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Budget follow-up
    awaiting_budget_month: bool = Field(default=False)
    pending_budget_category: Optional[str] = Field(default=None)
    pending_budget_amount: Optional[float] = Field(default=None)

    # Fund follow-up
    awaiting_fund_field: Optional[str] = Field(default=None)
    pending_fund: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    # General conversational context
    last_intent: Optional[str] = Field(default=None)
    last_action: Optional[str] = Field(default=None)

    # File upload flow
    awaiting_file_type: bool = Field(default=False)
    pending_file_bytes: Optional[bytes] = Field(default=None)
    pending_file_type: Optional[str] = Field(default=None)
