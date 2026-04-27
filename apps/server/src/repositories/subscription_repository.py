from typing import Optional, List
from sqlmodel import Session, select
from ..models.subscription import Subscription


class SubscriptionRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_user(self, user_id: int) -> List[Subscription]:
        statement = select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.is_active == True
        )
        return self.session.exec(statement).all()

    def create(self, subscription: Subscription) -> Subscription:
        self.session.add(subscription)
        self.session.commit()
        self.session.refresh(subscription)
        return subscription

    def delete(self, sub_id: int, user_id: int) -> bool:
        sub = self.session.exec(
            select(Subscription).where(Subscription.id == sub_id, Subscription.user_id == user_id)
        ).first()
        if sub:
            sub.is_active = False
            self.session.add(sub)
            self.session.commit()
            return True
        return False
