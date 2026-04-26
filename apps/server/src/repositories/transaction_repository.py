from datetime import date
from typing import List
from sqlmodel import Session, select
from sqlalchemy import func
from ..models.transaction import Transaction


class TransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        user_id: int,
        amount: float,
        description: str,
        category: str,
        transaction_date: date,
        source_file: str = "manual",
    ) -> Transaction:
        txn = Transaction(
            user_id=user_id,
            amount=amount,
            description=description,
            category=category,
            transaction_date=transaction_date,
            source_file=source_file,
        )
        self.db.add(txn)
        self.db.commit()
        self.db.refresh(txn)
        return txn

    def get_by_user(self, user_id: int, limit: int = 100) -> List[Transaction]:
        statement = (
            select(Transaction)
            .where(Transaction.user_id == user_id)
            .order_by(Transaction.transaction_date.desc())
            .limit(limit)
        )
        return self.db.exec(statement).all()

    def get_total_by_user(self, user_id: int) -> float:
        statement = select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id
        )
        result = self.db.exec(statement).first()
        return result or 0.0
