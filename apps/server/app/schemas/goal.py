"""Goal Pydantic schemas."""

from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema, TimestampSchema
from app.schemas.enums import GoalStatus


class GoalCreate(BaseSchema):
    """Schema for creating a new savings goal."""

    user_id: int
    title: str = Field(max_length=200)
    target_amount: float = Field(gt=0)
    current_amount: float = Field(default=0.0, ge=0)
    deadline: datetime | None = None
    status: GoalStatus = GoalStatus.ACTIVE


class GoalUpdate(BaseSchema):
    """Schema for updating an existing goal."""

    title: str | None = Field(default=None, max_length=200)
    target_amount: float | None = Field(default=None, gt=0)
    current_amount: float | None = Field(default=None, ge=0)
    deadline: datetime | None = None
    status: GoalStatus | None = None


class GoalResponse(GoalCreate, TimestampSchema):
    """Schema for reading a goal."""

    id: int
    created_at: datetime
    updated_at: datetime | None = None
