from typing import Optional, List
from sqlmodel import Session, select
from datetime import date
from ..models.reminder import Reminder


class ReminderRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_user(self, user_id: int) -> List[Reminder]:
        statement = select(Reminder).where(Reminder.user_id == user_id, Reminder.is_active == True)
        return self.session.exec(statement).all()

    def get_upcoming(self, user_id: int, days: int = 7) -> List[Reminder]:
        from datetime import timedelta
        end_date = date.today() + timedelta(days=days)
        statement = select(Reminder).where(
            Reminder.user_id == user_id,
            Reminder.is_active == True,
            Reminder.due_date <= end_date
        ).order_by(Reminder.due_date)
        return self.session.exec(statement).all()

    def create(self, reminder: Reminder) -> Reminder:
        self.session.add(reminder)
        self.session.commit()
        self.session.refresh(reminder)
        return reminder

    def delete(self, reminder_id: int, user_id: int) -> bool:
        reminder = self.session.exec(
            select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user_id)
        ).first()
        if reminder:
            self.session.delete(reminder)
            self.session.commit()
            return True
        return False
