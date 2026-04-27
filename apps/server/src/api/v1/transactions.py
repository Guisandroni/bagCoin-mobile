from typing import List, Optional
from datetime import date
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from ...core.dependencies import CurrentUserDep, DbSessionDep
from ...repositories.transaction_repository import TransactionRepository
from ...schemas.transaction import TransactionCreate, TransactionResponse
from ...core.logging import logger

router = APIRouter(prefix="/transactions", tags=["transactions"])


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int


class TransactionSummaryResponse(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    total_by_category: dict[str, float]


@router.get("", response_model=TransactionListResponse)
def list_transactions(
    user: CurrentUserDep,
    db: DbSessionDep,
    month: Optional[str] = Query(None, description="Filter by month (YYYY-MM)"),
    category: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    repo = TransactionRepository(db)
    transactions = repo.get_by_user(user.id, limit=1000)
    
    # Apply filters
    if month:
        transactions = [t for t in transactions if str(t.transaction_date).startswith(month)]
    if category:
        transactions = [t for t in transactions if t.category == category]
    
    # Apply offset/limit
    total = len(transactions)
    transactions = transactions[offset:offset + limit]
    
    return TransactionListResponse(
        items=[
            TransactionResponse(
                id=t.id,
                amount=t.amount,
                description=t.description,
                category=t.category,
                transaction_date=t.transaction_date,
                source_file=t.source_file,
            )
            for t in transactions
        ],
        total=total,
    )


@router.post("", response_model=TransactionResponse)
def create_transaction(
    user: CurrentUserDep,
    db: DbSessionDep,
    data: TransactionCreate,
):
    repo = TransactionRepository(db)
    txn = repo.create(
        user_id=user.id,
        amount=data.amount,
        description=data.description,
        category=data.category,
        transaction_date=data.transaction_date or date.today(),
        source_file=data.source_file or "web",
    )
    logger.info("transaction_created", user_id=user.id, transaction_id=txn.id)
    return TransactionResponse(
        id=txn.id,
        amount=txn.amount,
        description=txn.description,
        category=txn.category,
        transaction_date=txn.transaction_date,
        source_file=txn.source_file,
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    user: CurrentUserDep,
    db: DbSessionDep,
    transaction_id: int,
):
    repo = TransactionRepository(db)
    txn = repo.get_by_id(transaction_id, user.id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionResponse(
        id=txn.id,
        amount=txn.amount,
        description=txn.description,
        category=txn.category,
        transaction_date=txn.transaction_date,
        source_file=txn.source_file,
    )


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    user: CurrentUserDep,
    db: DbSessionDep,
    transaction_id: int,
    data: TransactionCreate,
):
    repo = TransactionRepository(db)
    txn = repo.get_by_id(transaction_id, user.id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    txn.amount = data.amount
    txn.description = data.description
    txn.category = data.category
    txn.transaction_date = data.transaction_date or txn.transaction_date
    txn.source_file = data.source_file or txn.source_file
    
    db.add(txn)
    db.commit()
    db.refresh(txn)
    
    logger.info("transaction_updated", user_id=user.id, transaction_id=txn.id)
    return TransactionResponse(
        id=txn.id,
        amount=txn.amount,
        description=txn.description,
        category=txn.category,
        transaction_date=txn.transaction_date,
        source_file=txn.source_file,
    )


@router.delete("/{transaction_id}")
def delete_transaction(
    user: CurrentUserDep,
    db: DbSessionDep,
    transaction_id: int,
):
    repo = TransactionRepository(db)
    txn = repo.get_by_id(transaction_id, user.id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(txn)
    db.commit()
    
    logger.info("transaction_deleted", user_id=user.id, transaction_id=transaction_id)
    return {"status": "deleted"}


@router.get("/summary", response_model=TransactionSummaryResponse)
def get_summary(
    user: CurrentUserDep,
    db: DbSessionDep,
    month: Optional[str] = Query(None, description="Filter by month (YYYY-MM)"),
):
    repo = TransactionRepository(db)
    transactions = repo.get_by_user(user.id, limit=1000)
    
    if month:
        transactions = [t for t in transactions if str(t.transaction_date).startswith(month)]
    
    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expense = sum(t.amount for t in transactions if t.amount < 0)
    
    total_by_category = {}
    for t in transactions:
        cat = t.category
        total_by_category[cat] = total_by_category.get(cat, 0) + abs(t.amount)
    
    return TransactionSummaryResponse(
        total_income=total_income,
        total_expense=abs(total_expense),
        balance=total_income + total_expense,
        total_by_category=total_by_category,
    )
