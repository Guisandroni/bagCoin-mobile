"""Transaction Pydantic schemas."""

from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema, TimestampSchema
from app.schemas.enums import SourceFormat, TransactionType


class TransactionCreate(BaseSchema):
    """Schema for creating a new transaction."""
    user_id: int
    type: TransactionType
    amount: float = Field(gt=0)
    currency: str = Field(default="BRL", max_length=3)
    category_id: int | None = None
    description: str | None = Field(default=None, max_length=500)
    source_format: SourceFormat = SourceFormat.TEXT
    transaction_date: datetime | None = None
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)
    raw_input: str | None = None


class TransactionUpdate(BaseSchema):
    """Schema for updating an existing transaction."""
    type: TransactionType | None = None
    amount: float | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, max_length=3)
    category_id: int | None = None
    description: str | None = Field(default=None, max_length=500)
    source_format: SourceFormat | None = None
    transaction_date: datetime | None = None
    confidence_score: float | None = Field(default=None, ge=0.0, le=1.0)
    raw_input: str | None = None


class TransactionResponse(TransactionCreate, TimestampSchema):
    """Schema for reading a transaction."""
    id: int
    created_at: datetime
    updated_at: datetime | None = None
