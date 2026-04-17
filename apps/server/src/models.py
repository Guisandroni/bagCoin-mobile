from datetime import datetime, date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    whatsapp_number: Optional[str] = Field(default=None, index=True, unique=True)
    name: Optional[str] = None
    activation_token: Optional[str] = Field(default=None, index=True, unique=True)
    is_active: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    transactions: List["Transaction"] = Relationship(back_populates="user")

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
