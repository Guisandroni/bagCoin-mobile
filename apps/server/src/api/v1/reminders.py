from typing import List, Optional, Annotated
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from ...core.dependencies import CurrentUserDep, DbSessionDep
from ...models.reminder import Reminder
from ...core.logging import logger
from sqlmodel import select

router = APIRouter(prefix="/reminders", tags=["reminders"])


class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: date
    amount: Optional[float] = None
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None


class ReminderResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: date
    amount: Optional[float]
    is_recurring: bool
    recurring_frequency: Optional[str]


class StatusResponse(BaseModel):
    status: str


@router.get("", response_model=List[ReminderResponse])
def list_reminders(
    user: CurrentUserDep,
    db: DbSessionDep,
    upcoming_days: Annotated[Optional[int], Query()] = None,
) -> List[ReminderResponse]:
    if upcoming_days:
        end_date = date.today() + timedelta(days=upcoming_days)
        reminders = db.exec(
            select(Reminder).where(
                Reminder.user_id == user.id,
                Reminder.is_active == True,
                Reminder.due_date <= end_date,
            ).order_by(Reminder.due_date)
        ).all()
    else:
        reminders = db.exec(
            select(Reminder).where(
                Reminder.user_id == user.id,
                Reminder.is_active == True,
            ).order_by(Reminder.due_date)
        ).all()
    
    return [
        ReminderResponse(
            id=r.id,
            title=r.title,
            description=r.description,
            due_date=r.due_date,
            amount=r.amount,
            is_recurring=r.is_recurring,
            recurring_frequency=r.recurring_frequency,
        )
        for r in reminders
    ]


@router.post("", response_model=ReminderResponse)
def create_reminder(
    user: CurrentUserDep,
    db: DbSessionDep,
    data: ReminderCreate,
) -> ReminderResponse:
    reminder = Reminder(
        user_id=user.id,
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        amount=data.amount,
        is_recurring=data.is_recurring,
        recurring_frequency=data.recurring_frequency,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    
    logger.info("reminder_created", user_id=user.id, reminder_id=reminder.id)
    
    return ReminderResponse(
        id=reminder.id,
        title=reminder.title,
        description=reminder.description,
        due_date=reminder.due_date,
        amount=reminder.amount,
        is_recurring=reminder.is_recurring,
        recurring_frequency=reminder.recurring_frequency,
    )


@router.delete("/{reminder_id}", response_model=StatusResponse)
def delete_reminder(
    user: CurrentUserDep,
    db: DbSessionDep,
    reminder_id: Annotated[int, ...],
) -> StatusResponse:
    reminder = db.exec(
        select(Reminder).where(
            Reminder.id == reminder_id,
            Reminder.user_id == user.id,
        )
    ).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    db.delete(reminder)
    db.commit()
    
    logger.info("reminder_deleted", user_id=user.id, reminder_id=reminder_id)
    return StatusResponse(status="deleted")
