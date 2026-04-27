from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status, Header
from sqlmodel import Session, select
from ..core.database import get_db
from ..core.auth import get_current_user_from_token
from ..models.user import User

DbSessionDep = Annotated[Session, Depends(get_db)]


async def get_active_user_by_number(
    db: DbSessionDep,
    whatsapp_number: str,
) -> User:
    statement = select(User).where(
        User.whatsapp_number == whatsapp_number,
        User.is_active == True,
    )
    user = db.exec(statement).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or inactive",
        )
    return user


async def get_current_user(
    authorization: Annotated[Optional[str], Header()] = None,
) -> User:
    """Dependency to get the current authenticated user from JWT token."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_current_user_from_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]
