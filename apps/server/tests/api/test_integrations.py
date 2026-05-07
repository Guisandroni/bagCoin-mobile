# ruff: noqa: I001
"""Tests for /integrations routes."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_user, get_db_session, get_integration_service
from app.main import app
from app.schemas.integration import IntegrationStatus, LinkTokenResponse


class MockUser:
    def __init__(self):
        self.id = uuid4()
        self.email = "u@example.com"
        self.full_name = "Test"
        self.phone_number = None


@pytest.fixture
def mock_user():
    return MockUser()


@pytest.fixture
async def client_integrations(mock_user: MockUser):
    mock_svc = MagicMock()
    mock_svc.create_link_token = AsyncMock(
        return_value=LinkTokenResponse(
            token="toktoktoktok",
            expires_at=datetime.now(UTC) + timedelta(minutes=10),
            deeplink_whatsapp="https://wa.me/1?text=hi",
            deeplink_telegram=None,
            manual_command_whatsapp="#bagcoin link toktoktoktok",
            manual_command_telegram="/start toktoktoktok",
        )
    )
    mock_svc.status = AsyncMock(
        return_value=IntegrationStatus(
            whatsapp_linked=False,
            telegram_linked=False,
            phone_number=None,
        )
    )

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_integration_service] = lambda: mock_svc
    app.dependency_overrides[get_db_session] = lambda: AsyncMock()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_create_link_token(client_integrations: AsyncClient):
    r = await client_integrations.post("/api/v1/integrations/link-token", json={"channel": "whatsapp"})
    assert r.status_code == 201
    body = r.json()
    assert body["token"] == "toktoktoktok"
    assert "manual_command_whatsapp" in body


@pytest.mark.anyio
async def test_integration_status(client_integrations: AsyncClient):
    r = await client_integrations.get("/api/v1/integrations/status")
    assert r.status_code == 200
    assert r.json()["whatsapp_linked"] is False
