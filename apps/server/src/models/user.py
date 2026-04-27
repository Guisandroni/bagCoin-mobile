from datetime import datetime, timedelta
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


def _default_token_expiry() -> datetime:
    return datetime.utcnow() + timedelta(days=7)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    whatsapp_number: Optional[str] = Field(default=None, index=True, unique=True)
    name: Optional[str] = None
    activation_token: Optional[str] = Field(default=None, index=True, unique=True)
    is_active: bool = Field(default=False)
    activation_token_expires_at: Optional[datetime] = Field(default_factory=_default_token_expiry)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    transactions: List["Transaction"] = Relationship(back_populates="user")
    budgets: List["Budget"] = Relationship(back_populates="user")
    funds: List["Fund"] = Relationship(back_populates="user")
    reminders: List["Reminder"] = Relationship(back_populates="user")
    shopping_lists: List["ShoppingList"] = Relationship(back_populates="user")
    subscriptions: List["Subscription"] = Relationship(back_populates="user")
    custom_categories: List["CustomCategory"] = Relationship(back_populates="user")
