from datetime import date
from typing import Optional
from pydantic import BaseModel


class TransactionCreate(BaseModel):
    amount: float
    description: str
    category: str
    transaction_date: Optional[date] = None
    source_file: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    amount: float
    description: str
    category: str
    transaction_date: date
    source_file: Optional[str] = None
