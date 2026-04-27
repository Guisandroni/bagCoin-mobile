from typing import List, Annotated
from datetime import date
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ...core.dependencies import CurrentUserDep, DbSessionDep
from ...models.subscription import Subscription
from ...core.logging import logger
from sqlmodel import select

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


class SubscriptionCreate(BaseModel):
    name: str
    amount: float
    category: str
    frequency: str = "mensal"
    next_due_date: date


class SubscriptionResponse(BaseModel):
    id: int
    name: str
    amount: float
    category: str
    frequency: str
    next_due_date: date
    is_active: bool


class StatusResponse(BaseModel):
    status: str


@router.get("", response_model=List[SubscriptionResponse])
def list_subscriptions(
    user: CurrentUserDep,
    db: DbSessionDep,
) -> List[SubscriptionResponse]:
    subs = db.exec(
        select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.is_active == True,
        )
    ).all()
    
    return [
        SubscriptionResponse(
            id=s.id,
            name=s.name,
            amount=s.amount,
            category=s.category,
            frequency=s.frequency,
            next_due_date=s.next_due_date,
            is_active=s.is_active,
        )
        for s in subs
    ]


@router.post("", response_model=SubscriptionResponse)
def create_subscription(
    user: CurrentUserDep,
    db: DbSessionDep,
    data: SubscriptionCreate,
) -> SubscriptionResponse:
    sub = Subscription(
        user_id=user.id,
        name=data.name,
        amount=data.amount,
        category=data.category,
        frequency=data.frequency,
        next_due_date=data.next_due_date,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    
    logger.info("subscription_created", user_id=user.id, subscription_id=sub.id)
    
    return SubscriptionResponse(
        id=sub.id,
        name=sub.name,
        amount=sub.amount,
        category=sub.category,
        frequency=sub.frequency,
        next_due_date=sub.next_due_date,
        is_active=sub.is_active,
    )


@router.delete("/{subscription_id}", response_model=StatusResponse)
def delete_subscription(
    user: CurrentUserDep,
    db: DbSessionDep,
    subscription_id: Annotated[int, ...],
) -> StatusResponse:
    sub = db.exec(
        select(Subscription).where(
            Subscription.id == subscription_id,
            Subscription.user_id == user.id,
        )
    ).first()
    
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    sub.is_active = False
    db.add(sub)
    db.commit()
    
    logger.info("subscription_deleted", user_id=user.id, subscription_id=subscription_id)
    return StatusResponse(status="deleted")
