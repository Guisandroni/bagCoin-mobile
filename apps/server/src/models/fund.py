from datetime import datetime, date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class Fund(SQLModel, table=True):
    __tablename__ = "fund"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    fund_type: str = Field(default="poupanca")  # emergencia, investimento, poupanca, outro
    current_amount: float = Field(default=0.0)
    target_amount: Optional[float] = None
    reminder_frequency: Optional[str] = None  # semanal, mensal, nunca
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: "User" = Relationship(back_populates="funds")
    contributions: List["FundContribution"] = Relationship(back_populates="fund")
