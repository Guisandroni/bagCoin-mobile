from datetime import datetime
from typing import Optional

from sqlmodel import Session, select
from .database import engine
from ..models.user import User


def get_user_by_whatsapp(whatsapp_number: str) -> Optional[User]:
    with Session(engine) as session:
        statement = select(User).where(User.whatsapp_number == whatsapp_number)
        return session.exec(statement).first()


def is_token_valid(user: Optional[User]) -> bool:
    if not user:
        return False
    if not user.is_active:
        return False
    if user.activation_token_expires_at and user.activation_token_expires_at < datetime.utcnow():
        return False
    return True
