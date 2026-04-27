from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from .user import User


class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    amount: float
    description: str
    category: str
    transaction_date: date = Field(default_factory=date.today)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    source_file: Optional[str] = None

    user: User = Relationship(back_populates="transactions")
