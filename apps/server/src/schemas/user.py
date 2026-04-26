from datetime import date
from typing import Optional
from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str = "Usuario"


class UserResponse(BaseModel):
    id: int
    name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    is_active: bool
    activation_token: Optional[str] = None


class UserPreRegisterResponse(BaseModel):
    status: str
    token: str
    id: int
