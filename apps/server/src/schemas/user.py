from datetime import date
from typing import Optional
from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str = "Usuario"


class UserResponse(BaseModel):
    id: int
    name: Optional[str] = None
    email: Optional[str] = None
    whatsapp_number: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    activation_token: Optional[str] = None

    class Config:
        from_attributes = True


class UserPreRegisterResponse(BaseModel):
    status: str
    token: str
    id: int


class GoogleAuthPayload(BaseModel):
    code: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
