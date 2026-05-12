"""Authentication-specific schemas."""

from typing import Literal

from pydantic import EmailStr, Field, field_validator

from app.schemas.base import BaseSchema


class AuthPendingResponse(BaseSchema):
    """Response for auth flows that require email verification."""

    email: EmailStr
    requires_email_verification: bool = True
    auth_provider: Literal["email", "google"]
    expires_in_seconds: int
    resend_available_in_seconds: int


class EmailVerificationRequest(BaseSchema):
    """Verify an email with a 6-digit code."""

    email: EmailStr
    code: str = Field(min_length=6, max_length=6)

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        if not value.isdigit():
            raise ValueError("code must contain exactly 6 digits")
        return value


class EmailVerificationResponse(BaseSchema):
    """Success response for email verification."""

    verified: bool = True
    message: str = "Email verified successfully"


class ResendVerificationRequest(BaseSchema):
    """Request a fresh verification code."""

    email: EmailStr


class ResendVerificationResponse(BaseSchema):
    """Success response for resending email verification."""

    sent: bool = True
    resend_available_in_seconds: int
    expires_in_seconds: int
