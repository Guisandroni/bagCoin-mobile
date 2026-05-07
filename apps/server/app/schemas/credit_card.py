"""CreditCard Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseSchema, TimestampSchema


class CreditCardBase(BaseSchema):
    """Base credit card schema."""

    name: str = Field(max_length=100)
    issuer: str = Field(max_length=50)
    limit: float = Field(gt=0)
    closing_day: int = Field(ge=1, le=31)
    due_day: int = Field(ge=1, le=31)
    color: str | None = Field(default=None, max_length=7)
    active: bool = True


class CreditCardCreate(CreditCardBase):
    """Schema for creating a new credit card."""

    pass


class CreditCardUpdate(BaseSchema):
    """Schema for updating an existing credit card."""

    name: str | None = Field(default=None, max_length=100)
    issuer: str | None = Field(default=None, max_length=50)
    limit: float | None = Field(default=None, gt=0)
    closing_day: int | None = Field(default=None, ge=1, le=31)
    due_day: int | None = Field(default=None, ge=1, le=31)
    color: str | None = Field(default=None, max_length=7)
    active: bool | None = None


class CreditCardResponse(CreditCardBase, TimestampSchema):
    """Schema for reading a credit card."""

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime | None = None
