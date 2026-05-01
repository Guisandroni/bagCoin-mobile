"""Category Pydantic schemas."""

from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema, TimestampSchema


class CategoryCreate(BaseSchema):
    """Schema for creating a new category."""

    user_id: int
    name: str = Field(max_length=100)
    parent_category_id: int | None = None
    is_default: bool = False


class CategoryUpdate(BaseSchema):
    """Schema for updating an existing category."""

    name: str | None = Field(default=None, max_length=100)
    parent_category_id: int | None = None
    is_default: bool | None = None


class CategoryResponse(CategoryCreate, TimestampSchema):
    """Schema for reading a category."""

    id: int
    created_at: datetime
    updated_at: datetime | None = None
