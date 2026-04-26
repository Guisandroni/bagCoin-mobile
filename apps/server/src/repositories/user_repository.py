from typing import Optional, List
from sqlmodel import Session, select
from ..models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_whatsapp(self, whatsapp_number: str) -> Optional[User]:
        statement = select(User).where(
            User.whatsapp_number == whatsapp_number,
            User.is_active == True,
        )
        return self.db.exec(statement).first()

    def get_by_token(self, token: str) -> Optional[User]:
        statement = select(User).where(User.activation_token == token)
        return self.db.exec(statement).first()

    def create(self, name: str, token: str) -> User:
        user = User(name=name, activation_token=token, is_active=False)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def activate(self, user: User, whatsapp_number: str) -> User:
        user.whatsapp_number = whatsapp_number
        user.is_active = True
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
