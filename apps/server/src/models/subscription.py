from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class Subscription(SQLModel, table=True):
    __tablename__ = "subscription"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    amount: float
    category: str
    frequency: str = Field(default="mensal")  # mensal, semanal, anual
    next_due_date: date
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: "User" = Relationship(back_populates="subscriptions")
