from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class ShoppingItem(SQLModel, table=True):
    __tablename__ = "shopping_item"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    shopping_list_id: int = Field(foreign_key="shopping_list.id")
    name: str
    quantity: Optional[str] = None
    is_checked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    shopping_list: "ShoppingList" = Relationship(back_populates="items")
