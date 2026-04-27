from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class CustomCategory(SQLModel, table=True):
    __tablename__ = "custom_category"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    category_type: str = Field(default="expense")  # expense, income
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: "User" = Relationship(back_populates="custom_categories")
