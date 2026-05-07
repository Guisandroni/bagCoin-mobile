"""Budget Pydantic schemas."""

from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema, TimestampSchema


class BudgetItemSchema(BaseSchema):
    """Schema for a budget item (per-category limit)."""

    category_id: int | None = None
    limit_amount: float = Field(gt=0)


class BudgetCreate(BaseSchema):
    """Schema for creating a new budget."""

    name: str = Field(max_length=100)
    period: str = Field(max_length=20)  # monthly, weekly, yearly
    total_limit: float = Field(gt=0)
    budget_type: str | None = Field(default=None, max_length=50)
    category_id: int | None = None
    items: list[BudgetItemSchema] = Field(default_factory=list)


class BudgetUpdate(BaseSchema):
    """Schema for updating an existing budget."""

    name: str | None = Field(default=None, max_length=100)
    period: str | None = Field(default=None, max_length=20)
    total_limit: float | None = Field(default=None, gt=0)
    items: list[BudgetItemSchema] | None = None


class BudgetResponse(BudgetCreate, TimestampSchema):
    """Schema for reading a budget."""

    id: int
    created_at: datetime
    updated_at: datetime | None = None
