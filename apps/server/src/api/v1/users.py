import base64
import secrets
import string
from typing import Annotated
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from slowapi.util import get_remote_address
from ...core.dependencies import DbSessionDep, CurrentUserDep
from ...core.metrics import pre_register_total
from ...core.logging import logger
from ...repositories.user_repository import UserRepository
from ...schemas.user import UserPreRegisterResponse, UserResponse
from ...models.conversation_context import ConversationContext
from sqlmodel import select

router = APIRouter(prefix="/users", tags=["users"])


def generate_random_token(length: int = 8) -> str:
    prefix = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(3))
    suffix = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))
    return f"{prefix}-{suffix}"


class PreRegisterPayload(BaseModel):
    name: str = "Usuario"


class UserUpdatePayload(BaseModel):
    name: str


@router.post("/pre-register", response_model=UserPreRegisterResponse)
def pre_register_user(
    request: Request,
    db: DbSessionDep,
    data: PreRegisterPayload,
) -> UserPreRegisterResponse:
    token = generate_random_token()
    repo = UserRepository(db)

    try:
        user = repo.create(name=data.name, token=token)
        logger.info("user_pre_registered", user_id=user.id, name=data.name)
        pre_register_total.labels(status="success").inc()
    except Exception as e:
        logger.error("error_pre_registering_user", error=str(e))
        pre_register_total.labels(status="error").inc()
        raise HTTPException(status_code=500, detail="Failed to create user")

    return UserPreRegisterResponse(status="success", token=token, id=user.id)


@router.get("/me", response_model=UserResponse)
def get_me(
    user: CurrentUserDep,
) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        whatsapp_number=user.whatsapp_number,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
    )


@router.put("/me", response_model=UserResponse)
def update_me(
    user: CurrentUserDep,
    db: DbSessionDep,
    data: UserUpdatePayload,
) -> UserResponse:
    user.name = data.name
    db.add(user)
    db.commit()
    db.refresh(user)
    
    logger.info("user_updated", user_id=user.id)
    
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        whatsapp_number=user.whatsapp_number,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
    )


class ContextResponse(BaseModel):
    user_id: int
    context: dict


@router.get("/context/{whatsapp_number}", response_model=ContextResponse)
def get_user_context_by_whatsapp(
    whatsapp_number: Annotated[str, ...],
    db: DbSessionDep,
    user: CurrentUserDep,
) -> ContextResponse:
    from ...models.user import User
    target_user = db.exec(select(User).where(User.whatsapp_number == whatsapp_number)).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure user can only access their own context or is admin
    if target_user.id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    ctx = db.exec(select(ConversationContext).where(ConversationContext.user_id == target_user.id)).first()
    return ContextResponse(
        user_id=target_user.id,
        context={
            "awaiting_budget_month": ctx.awaiting_budget_month if ctx else False,
            "pending_budget_category": ctx.pending_budget_category if ctx else None,
            "pending_budget_amount": ctx.pending_budget_amount if ctx else None,
            "awaiting_fund_field": ctx.awaiting_fund_field if ctx else None,
            "last_intent": ctx.last_intent if ctx else None,
            "last_action": ctx.last_action if ctx else None,
        }
    )
