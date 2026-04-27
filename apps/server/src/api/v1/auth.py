import httpx
from typing import Annotated, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from ...core.database import engine
from ...core.auth import create_access_token, get_current_user_from_token
from ...core.logging import logger
from ...core.dependencies import DbSessionDep
from ...repositories.user_repository import UserRepository
from ...schemas.user import UserResponse
from ...config import settings
from sqlmodel import Session, select
from ...models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleAuthPayload(BaseModel):
    code: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/google", response_model=AuthResponse)
async def google_auth(
    db: DbSessionDep,
    data: GoogleAuthPayload,
):
    """Exchange Google authorization code for access token."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    # Exchange code for token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": data.code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": f"{settings.FRONTEND_URL}/api/auth/callback/google",
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)
        if token_response.status_code != 200:
            logger.error("google_token_exchange_failed", status=token_response.status_code)
            raise HTTPException(status_code=400, detail="Failed to exchange Google code")
        
        token_json = token_response.json()
        access_token = token_json.get("access_token")
        
        # Get user info
        user_info_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if user_info_response.status_code != 200:
            logger.error("google_userinfo_failed", status=user_info_response.status_code)
            raise HTTPException(status_code=400, detail="Failed to get Google user info")
        
        user_info = user_info_response.json()
    
    google_id = user_info.get("id")
    email = user_info.get("email")
    name = user_info.get("name")
    avatar_url = user_info.get("picture")
    
    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Invalid Google user info")
    
    # Find or create user
    repo = UserRepository(db)
    user = repo.get_by_google_id(google_id)
    
    if not user:
        # Check if user exists with same email
        user = repo.get_by_email(email)
        if user:
            # Link Google account
            user = repo.update_google_info(user, google_id=google_id, avatar_url=avatar_url)
        else:
            # Create new user
            user = repo.create_from_google(
                name=name or email.split("@")[0],
                email=email,
                google_id=google_id,
                avatar_url=avatar_url,
            )
    
    # Generate JWT
    jwt_token = create_access_token(user.id)
    
    logger.info("user_authenticated", user_id=user.id, email=email, provider="google")
    
    return AuthResponse(
        access_token=jwt_token,
        user=UserResponse(
            id=user.id,
            name=user.name,
            whatsapp_number=user.whatsapp_number,
            is_active=user.is_active,
            activation_token=user.activation_token,
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    db: DbSessionDep,
    token: Annotated[str, Query()],
):
    """Get current authenticated user."""
    user = get_current_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return UserResponse(
        id=user.id,
        name=user.name,
        whatsapp_number=user.whatsapp_number,
        is_active=user.is_active,
        activation_token=user.activation_token,
    )
