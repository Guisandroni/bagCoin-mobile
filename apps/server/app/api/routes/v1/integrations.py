"""Authenticated integration pairing endpoints."""

from typing import Any

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, IntegrationSvc
from app.schemas.integration import IntegrationStatus, LinkTokenRequest, LinkTokenResponse

router = APIRouter()


@router.post(
    "/link-token",
    response_model=LinkTokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_link_token(
    body: LinkTokenRequest,
    user: CurrentUser,
    svc: IntegrationSvc,
) -> Any:
    return await svc.create_link_token(user.id, body.channel)


@router.get("/status", response_model=IntegrationStatus)
async def integration_status(user: CurrentUser, svc: IntegrationSvc) -> Any:
    return await svc.status(user)
