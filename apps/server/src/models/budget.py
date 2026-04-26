from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class Budget(SQLModel, table=True):
    __tablename__ = "budget"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    year: int
    month: int
    total_budgeted: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: "User" = Relationship(back_populates="budgets")
    budget_categories: List["BudgetCategory"] = Relationship(back_populates="budget")
