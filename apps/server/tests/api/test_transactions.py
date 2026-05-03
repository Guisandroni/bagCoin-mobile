"""Tests for transaction REST endpoints."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

ServiceMock = AsyncMock

from app.api.deps import get_current_user, get_db_session, get_redis
from app.core.config import settings
from app.main import app


class MockTransaction:
    """Mock transaction for testing."""

    def __init__(self, tx_id=1, user_uuid=None):
        self.id = tx_id
        self.user_uuid = user_uuid or uuid4()
        self.user_id = None
        self.type = "EXPENSE"
        self.amount = 100.0
        self.currency = "BRL"
        self.category_id = None
        self.description = "Test transaction"
        self.source_format = "manual"
        self.transaction_date = datetime(2026, 5, 1, tzinfo=UTC)
        self.confidence_score = 1.0
        self.raw_input = None
        self.created_at = datetime.now(UTC)
        self.updated_at = datetime.now(UTC)


class MockUser:
    """Mock authenticated user."""

    def __init__(self):
        self.id = uuid4()
        self.email = "test@example.com"
        self.full_name = "Test User"
        self.is_active = True
        self.role = "user"
        self.phone_number = None
        self.google_id = None
        self.auth_provider = "email"
        self.avatar_url = None
        self.created_at = datetime.now(UTC)
        self.updated_at = datetime.now(UTC)


@pytest.fixture
def mock_user():
    return MockUser()


@pytest.fixture
def mock_tx():
    return MockTransaction()


@pytest.fixture
async def client_with_auth(mock_user, mock_redis, mock_db_session):
    """Client with authenticated user override."""
    from app.api.deps import get_redis as gr_orig

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_redis] = lambda: mock_redis
    app.dependency_overrides[get_db_session] = lambda: mock_db_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_list_transactions_empty(client_with_auth, mock_db_session):
    """Test listing transactions when empty."""
    from unittest.mock import AsyncMock, MagicMock

    count_result = MagicMock()
    count_result.scalar.return_value = 0

    list_result = MagicMock()
    list_result.scalars.return_value.all.return_value = []

    mock_db_session.execute = AsyncMock(side_effect=[count_result, list_result])
    mock_db_session.scalar = AsyncMock(return_value=0)

    response = await client_with_auth.get(f"{settings.API_V1_STR}/transactions")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.anyio
async def test_list_transactions_requires_auth(client):
    """Test that unauthenticated requests are rejected."""
    response = await client.get(f"{settings.API_V1_STR}/transactions")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_get_summary_requires_auth(client):
    """Test that summary requires auth."""
    response = await client.get(f"{settings.API_V1_STR}/transactions/summary")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_create_transaction_requires_auth(client):
    """Test that creating transaction requires auth."""
    response = await client.post(
        f"{settings.API_V1_STR}/transactions",
        json={
            "type": "EXPENSE",
            "amount": 50.0,
            "description": "Test",
        },
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_delete_transaction_requires_auth(client):
    """Test that deleting transaction requires auth."""
    response = await client.delete(f"{settings.API_V1_STR}/transactions/1")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_google_login_endpoint_exists(client_with_auth):
    """Test that the Google login endpoint is registered."""
    mock_user_service = MagicMock()
    mock_user_service.google_auth = AsyncMock(
        return_value=mock_user_service.google_auth
    )

    from app.api.deps import get_user_service

    mock_user = MockUser()
    mock_user_service.google_auth = AsyncMock(return_value=mock_user)

    app.dependency_overrides[get_user_service] = lambda: mock_user_service

    response = await client_with_auth.post(
        f"{settings.API_V1_STR}/auth/google",
        json={"id_token": "valid-token"},
    )
    # The override for get_current_user is still active, but the endpoint
    # uses UserSvc which is now overridden
    assert response.status_code == 200


@pytest.mark.anyio
async def test_register_with_phone_field(client_with_auth):
    """Test that register accepts phone_number field."""
    mock_user_service = MagicMock()
    mock_user = MockUser()
    mock_user_service.register = AsyncMock(return_value=mock_user)

    from app.api.deps import get_user_service

    app.dependency_overrides[get_user_service] = lambda: mock_user_service

    response = await client_with_auth.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "new@test.com",
            "password": "password123",
            "full_name": "New User",
            "phone_number": "+5511999999999",
        },
    )
    assert response.status_code == 201
