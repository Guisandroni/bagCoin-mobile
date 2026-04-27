from typing import List, Optional
from datetime import date
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ...core.dependencies import CurrentUserDep, DbSessionDep
from ...repositories.fund_repository import FundRepository
from ...models.fund import Fund
from ...models.fund_contribution import FundContribution
from ...core.logging import logger

router = APIRouter(prefix="/funds", tags=["funds"])


class FundCreate(BaseModel):
    name: str
    fund_type: str = "poupanca"
    target_amount: Optional[float] = None
    current_amount: float = 0.0
    reminder_frequency: Optional[str] = None
    description: Optional[str] = None


class FundResponse(BaseModel):
    id: int
    name: str
    fund_type: str
    current_amount: float
    target_amount: Optional[float]
    reminder_frequency: Optional[str]
    description: Optional[str]


class ContributionCreate(BaseModel):
    amount: float
    note: Optional[str] = None


@router.get("", response_model=List[FundResponse])
def list_funds(
    user: CurrentUserDep,
    db: DbSessionDep,
):
    repo = FundRepository(db)
    funds = repo.get_by_user(user.id)
    return [
        FundResponse(
            id=f.id,
            name=f.name,
            fund_type=f.fund_type,
            current_amount=f.current_amount,
            target_amount=f.target_amount,
            reminder_frequency=f.reminder_frequency,
            description=f.description,
        )
        for f in funds
    ]


@router.post("", response_model=FundResponse)
def create_fund(
    user: CurrentUserDep,
    db: DbSessionDep,
    data: FundCreate,
):
    fund = Fund(
        user_id=user.id,
        name=data.name,
        fund_type=data.fund_type,
        target_amount=data.target_amount,
        current_amount=data.current_amount,
        reminder_frequency=data.reminder_frequency,
        description=data.description,
    )
    db.add(fund)
    db.commit()
    db.refresh(fund)
    
    logger.info("fund_created", user_id=user.id, fund_id=fund.id)
    
    return FundResponse(
        id=fund.id,
        name=fund.name,
        fund_type=fund.fund_type,
        current_amount=fund.current_amount,
        target_amount=fund.target_amount,
        reminder_frequency=fund.reminder_frequency,
        description=fund.description,
    )


@router.post("/{fund_id}/contributions")
def add_contribution(
    user: CurrentUserDep,
    db: DbSessionDep,
    fund_id: int,
    data: ContributionCreate,
):
    repo = FundRepository(db)
    fund = repo.get_by_id(fund_id, user.id)
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    
    contribution = ContributionCreate(
        fund_id=fund_id,
        amount=data.amount,
        note=data.note,
    )
    # Note: FundContribution model needs to be instantiated correctly
    contrib = FundContribution(
        fund_id=fund_id,
        amount=data.amount,
        note=data.note,
    )
    db.add(contrib)
    
    # Update fund current_amount
    fund.current_amount += data.amount
    db.add(fund)
    db.commit()
    db.refresh(contrib)
    
    logger.info("contribution_added", user_id=user.id, fund_id=fund_id, amount=data.amount)
    return {"status": "success", "fund_id": fund_id, "amount": data.amount}


@router.delete("/{fund_id}")
def delete_fund(
    user: CurrentUserDep,
    db: DbSessionDep,
    fund_id: int,
):
    repo = FundRepository(db)
    fund = repo.get_by_id(fund_id, user.id)
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    
    # Delete contributions first
    from sqlmodel import select
    contributions = db.exec(
        select(FundContribution).where(FundContribution.fund_id == fund_id)
    ).all()
    for c in contributions:
        db.delete(c)
    
    db.delete(fund)
    db.commit()
    
    logger.info("fund_deleted", user_id=user.id, fund_id=fund_id)
    return {"status": "deleted"}
