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

    def get_by_google_id(self, google_id: str) -> Optional[User]:
        statement = select(User).where(User.google_id == google_id)
        return self.db.exec(statement).first()

    def get_by_email(self, email: str) -> Optional[User]:
        statement = select(User).where(User.email == email)
        return self.db.exec(statement).first()

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.get(User, user_id)

    def create(self, name: str, token: str) -> User:
        user = User(name=name, activation_token=token, is_active=False)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_from_google(self, name: str, email: str, google_id: str, avatar_url: Optional[str] = None) -> User:
        user = User(
            name=name,
            email=email,
            google_id=google_id,
            avatar_url=avatar_url,
            is_active=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_google_info(self, user: User, google_id: str, avatar_url: Optional[str] = None) -> User:
        user.google_id = google_id
        if avatar_url:
            user.avatar_url = avatar_url
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

    def update(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
