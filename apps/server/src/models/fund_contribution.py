from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class FundContribution(SQLModel, table=True):
    __tablename__ = "fund_contribution"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    fund_id: int = Field(foreign_key="fund.id")
    amount: float
    contribution_date: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None
    
    fund: "Fund" = Relationship(back_populates="contributions")
