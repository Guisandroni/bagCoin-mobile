from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class ShoppingList(SQLModel, table=True):
    __tablename__ = "shopping_list"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str = Field(default="Lista de Compras")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: "User" = Relationship(back_populates="shopping_lists")
    items: List["ShoppingItem"] = Relationship(back_populates="shopping_list")
