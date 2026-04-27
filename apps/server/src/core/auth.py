from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from sqlmodel import Session, select
from .database import engine
from ..models.user import User
from ..config import settings


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


# JWT Functions
def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    to_encode = {"sub": str(user_id), "exp": expire, "iat": datetime.utcnow()}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return int(user_id)
    except JWTError:
        return None


def get_current_user_from_token(token: str) -> Optional[User]:
    user_id = decode_access_token(token)
    if user_id is None:
        return None
    with Session(engine) as session:
        return session.get(User, user_id)
