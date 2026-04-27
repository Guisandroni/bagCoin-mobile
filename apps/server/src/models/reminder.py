from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class Reminder(SQLModel, table=True):
    __tablename__ = "reminder"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    title: str
    description: Optional[str] = None
    due_date: date
    amount: Optional[float] = None
    is_recurring: bool = Field(default=False)
    recurring_frequency: Optional[str] = None  # mensal, semanal, anual
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: "User" = Relationship(back_populates="reminders")
