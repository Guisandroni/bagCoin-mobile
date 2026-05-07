"""Tests for Budget REST endpoints."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_user, get_db_session, get_redis
from app.core.config import settings
from app.main import app


class MockUser:
    """Mock authenticated user."""

    def __init__(self):
        self.id = uuid4()
        self.email = "test@example.com"
        self.full_name = "Test User"
        self.is_active = True
        self.role = "user"


@pytest.fixture
def mock_user():
    return MockUser()


@pytest.fixture
async def client_with_auth(mock_user, mock_redis, mock_db_session):
    """Client with authenticated user override."""

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_redis] = lambda: mock_redis
    app.dependency_overrides[get_db_session] = lambda: mock_db_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Auth-guard tests – unauthenticated requests
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_budgets_requires_auth(client):
    """Test that unauthenticated requests are rejected."""
    response = await client.get(f"{settings.API_V1_STR}/bagcoin/budgets")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_create_budget_requires_auth(client):
    """Test that creating a budget requires auth."""
    response = await client.post(
        f"{settings.API_V1_STR}/bagcoin/budgets",
        json={"name": "Test", "period": "monthly", "total_limit": 1000.0, "category_id": 1, "user_id": 1},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_get_budget_requires_auth(client):
    """Test that getting a budget requires auth."""
    response = await client.get(f"{settings.API_V1_STR}/bagcoin/budgets/1")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_update_budget_requires_auth(client):
    """Test that updating a budget requires auth."""
    response = await client.patch(
        f"{settings.API_V1_STR}/bagcoin/budgets/1",
        json={"name": "Updated"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_delete_budget_requires_auth(client):
    """Test that deleting a budget requires auth."""
    response = await client.delete(f"{settings.API_V1_STR}/bagcoin/budgets/1")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_budget_alerts_requires_auth(client):
    """Test that budget alerts require auth."""
    response = await client.get(f"{settings.API_V1_STR}/bagcoin/budgets/alerts")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# List budgets
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_budgets_empty(client_with_auth):
    """Test listing budgets when empty."""
    with patch(
        "app.api.routes.v1.budgets.budget_service.list_budgets",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = []

        response = await client_with_auth.get(f"{settings.API_V1_STR}/bagcoin/budgets")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_list_budgets_with_data(client_with_auth):
    """Test listing budgets with data."""
    now = datetime.now(UTC)
    budgets_data = [
        {
            "id": 1,
            "name": "Test Budget",
            "category_id": 1,
            "category_name": "Category",
            "total_limit": 1000.0,
            "total_spent": 150.0,
            "total_remaining": 850.0,
            "percentage": 15.0,
            "period": "monthly",
            "budget_type": "general",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
    ]

    with patch(
        "app.api.routes.v1.budgets.budget_service.list_budgets",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = budgets_data

        response = await client_with_auth.get(f"{settings.API_V1_STR}/bagcoin/budgets")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["name"] == "Test Budget"
    assert data[0]["total_limit"] == 1000.0
    assert data[0]["total_spent"] == 150.0
    assert data[0]["total_remaining"] == 850.0
    assert data[0]["period"] == "monthly"
    assert data[0]["budget_type"] == "general"


# ---------------------------------------------------------------------------
# Create budget
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_create_budget_201(client_with_auth):
    """Test creating a budget returns 201."""
    now = datetime.now(UTC)
    budget_data = {
        "id": 1,
        "name": "New Budget",
        "category_id": 1,
        "category_name": "Category",
        "total_limit": 500.0,
        "total_spent": 0.0,
        "total_remaining": 500.0,
        "percentage": 0.0,
        "period": "monthly",
        "budget_type": "general",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    with patch(
        "app.api.routes.v1.budgets.budget_service.create_budget",
        new_callable=AsyncMock,
    ) as mock_create:
        mock_create.return_value = budget_data

        response = await client_with_auth.post(
            f"{settings.API_V1_STR}/bagcoin/budgets",
            json={
                "name": "New Budget",
                "period": "monthly",
                "total_limit": 500.0,
                "category_id": 1,
                "user_id": 1,
            },
        )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["name"] == "New Budget"
    assert data["total_limit"] == 500.0
    assert data["total_spent"] == 0.0


# ---------------------------------------------------------------------------
# Get budget
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_get_budget(client_with_auth):
    """Test getting a specific budget."""
    now = datetime.now(UTC)
    budget_data = {
        "id": 5,
        "name": "Specific Budget",
        "category_id": 2,
        "category_name": "Food",
        "total_limit": 1000.0,
        "total_spent": 250.0,
        "total_remaining": 750.0,
        "percentage": 25.0,
        "period": "monthly",
        "budget_type": "general",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    with patch(
        "app.api.routes.v1.budgets.budget_service.get_budget",
        new_callable=AsyncMock,
    ) as mock_get:
        mock_get.return_value = budget_data

        response = await client_with_auth.get(
            f"{settings.API_V1_STR}/bagcoin/budgets/5"
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 5
    assert data["name"] == "Specific Budget"
    assert data["total_spent"] == 250.0
    assert data["total_limit"] == 1000.0


@pytest.mark.anyio
async def test_get_budget_not_found(client_with_auth):
    """Test getting a non-existent budget returns 404."""
    from app.core.exceptions import NotFoundError

    with patch(
        "app.api.routes.v1.budgets.budget_service.get_budget",
        new_callable=AsyncMock,
    ) as mock_get:
        mock_get.side_effect = NotFoundError(
            message="Budget not found", details={"id": 999}
        )

        response = await client_with_auth.get(
            f"{settings.API_V1_STR}/bagcoin/budgets/999"
        )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


# ---------------------------------------------------------------------------
# Update budget
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_update_budget(client_with_auth):
    """Test updating a budget."""
    now = datetime.now(UTC)
    updated_data = {
        "id": 3,
        "name": "Updated Name",
        "category_id": 1,
        "category_name": "Category",
        "total_limit": 2500.0,
        "total_spent": 100.0,
        "total_remaining": 2400.0,
        "percentage": 4.0,
        "period": "monthly",
        "budget_type": "general",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    with patch(
        "app.api.routes.v1.budgets.budget_service.update_budget",
        new_callable=AsyncMock,
    ) as mock_update:
        mock_update.return_value = updated_data

        response = await client_with_auth.patch(
            f"{settings.API_V1_STR}/bagcoin/budgets/3",
            json={"name": "Updated Name", "total_limit": 2500.0},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 3
    assert data["name"] == "Updated Name"
    assert data["total_limit"] == 2500.0
    assert data["total_spent"] == 100.0


@pytest.mark.anyio
async def test_update_budget_not_found(client_with_auth):
    """Test updating a non-existent budget returns 404."""
    from app.core.exceptions import NotFoundError

    with patch(
        "app.api.routes.v1.budgets.budget_service.update_budget",
        new_callable=AsyncMock,
    ) as mock_update:
        mock_update.side_effect = NotFoundError(
            message="Budget not found", details={"id": 999}
        )

        response = await client_with_auth.patch(
            f"{settings.API_V1_STR}/bagcoin/budgets/999",
            json={"name": "Should Fail"},
        )

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Delete budget
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_delete_budget(client_with_auth):
    """Test deleting a budget returns 204."""
    with patch(
        "app.api.routes.v1.budgets.budget_service.delete_budget",
        new_callable=AsyncMock,
    ) as mock_delete:
        mock_delete.return_value = None

        response = await client_with_auth.delete(
            f"{settings.API_V1_STR}/bagcoin/budgets/7"
        )

    assert response.status_code == 204


@pytest.mark.anyio
async def test_delete_budget_not_found(client_with_auth):
    """Test deleting a non-existent budget returns 404."""
    from app.core.exceptions import NotFoundError

    with patch(
        "app.api.routes.v1.budgets.budget_service.delete_budget",
        new_callable=AsyncMock,
    ) as mock_delete:
        mock_delete.side_effect = NotFoundError(
            message="Budget not found", details={"id": 999}
        )

        response = await client_with_auth.delete(
            f"{settings.API_V1_STR}/bagcoin/budgets/999"
        )

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Budget alerts
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_get_budget_alerts_route_shadowed(client_with_auth):
    """Test that /budgets/alerts now works correctly (route ordering fixed).

    The /alerts route is now registered before /{budget_id},
    so it resolves correctly instead of being shadowed.
    """
    with patch(
        "app.api.routes.v1.budgets.budget_service.get_budget_alerts",
        new_callable=AsyncMock,
    ) as mock_alerts:
        mock_alerts.return_value = []

        response = await client_with_auth.get(
            f"{settings.API_V1_STR}/bagcoin/budgets/alerts"
        )

    assert response.status_code == 200
    assert response.json() == []
