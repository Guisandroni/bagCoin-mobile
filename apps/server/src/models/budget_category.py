from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class BudgetCategory(SQLModel, table=True):
    __tablename__ = "budget_category"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    budget_id: int = Field(foreign_key="budget.id")
    category_name: str
    budgeted_amount: float
    spent_amount: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    budget: "Budget" = Relationship(back_populates="budget_categories")
