from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select
from ..core.database import get_db
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
