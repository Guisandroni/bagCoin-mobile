import httpx
from typing import Annotated
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ...core.auth import create_access_token
from ...core.logging import logger
from ...core.dependencies import DbSessionDep, CurrentUserDep
from ...repositories.user_repository import UserRepository
from ...schemas.user import UserResponse
from ...config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/google", response_model=AuthResponse)
async def google_auth(
    db: DbSessionDep,
    data: Annotated[dict, ...],
) -> AuthResponse:
    """Exchange Google authorization code for access token."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    code = data.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")
    
    # Exchange code for token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
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
            email=user.email,
            whatsapp_number=user.whatsapp_number,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
        )
    )


@router.get("/me", response_model=UserResponse)
def get_current_user(
    user: CurrentUserDep,
) -> UserResponse:
    """Get current authenticated user."""
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        whatsapp_number=user.whatsapp_number,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
    )
