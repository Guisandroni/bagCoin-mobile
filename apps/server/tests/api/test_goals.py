"""Tests for Goal REST endpoints."""

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
async def test_list_goals_requires_auth(client):
    """Test that unauthenticated requests are rejected."""
    response = await client.get(f"{settings.API_V1_STR}/bagcoin/goals")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_create_goal_requires_auth(client):
    """Test that creating a goal requires auth."""
    response = await client.post(
        f"{settings.API_V1_STR}/bagcoin/goals",
        json={"title": "Test Goal", "target_amount": 5000.0, "user_id": 1},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_get_goal_requires_auth(client):
    """Test that getting a goal requires auth."""
    response = await client.get(f"{settings.API_V1_STR}/bagcoin/goals/1")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_update_goal_requires_auth(client):
    """Test that updating a goal requires auth."""
    response = await client.patch(
        f"{settings.API_V1_STR}/bagcoin/goals/1",
        json={"title": "Updated"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_delete_goal_requires_auth(client):
    """Test that deleting a goal requires auth."""
    response = await client.delete(f"{settings.API_V1_STR}/bagcoin/goals/1")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_goal_alerts_requires_auth(client):
    """Test that goal alerts require auth."""
    response = await client.get(f"{settings.API_V1_STR}/bagcoin/goals/alerts")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# List goals
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_goals_empty(client_with_auth):
    """Test listing goals when empty."""
    with patch(
        "app.api.routes.v1.goals.goal_service.list_goals",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = []

        response = await client_with_auth.get(f"{settings.API_V1_STR}/bagcoin/goals")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_list_goals_with_data(client_with_auth):
    """Test listing goals with data."""
    now = datetime.now(UTC)
    goals_data = [
        {
            "id": 1,
            "title": "Savings Goal",
            "target_amount": 5000.0,
            "current_amount": 1500.0,
            "deadline": None,
            "percentage": 30.0,
            "status": "active",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
    ]

    with patch(
        "app.api.routes.v1.goals.goal_service.list_goals",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = goals_data

        response = await client_with_auth.get(f"{settings.API_V1_STR}/bagcoin/goals")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["title"] == "Savings Goal"
    assert data[0]["target_amount"] == 5000.0
    assert data[0]["current_amount"] == 1500.0
    assert data[0]["percentage"] == 30.0
    assert data[0]["status"] == "active"
    assert data[0]["deadline"] is None


# ---------------------------------------------------------------------------
# Create goal
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_create_goal_201(client_with_auth):
    """Test creating a goal returns 201."""
    now = datetime.now(UTC)
    goal_data = {
        "id": 10,
        "title": "New Goal",
        "target_amount": 3000.0,
        "current_amount": 0.0,
        "deadline": None,
        "percentage": 0.0,
        "status": "active",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    with patch(
        "app.api.routes.v1.goals.goal_service.create_goal",
        new_callable=AsyncMock,
    ) as mock_create:
        mock_create.return_value = goal_data

        response = await client_with_auth.post(
            f"{settings.API_V1_STR}/bagcoin/goals",
            json={
                "title": "New Goal",
                "target_amount": 3000.0,
                "current_amount": 0.0,
                "user_id": 1,
            },
        )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 10
    assert data["title"] == "New Goal"
    assert data["target_amount"] == 3000.0
    assert data["current_amount"] == 0.0
    assert data["percentage"] == 0.0
    assert data["status"] == "active"


# ---------------------------------------------------------------------------
# Get goal
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_get_goal(client_with_auth):
    """Test getting a specific goal."""
    now = datetime.now(UTC)
    goal_data = {
        "id": 5,
        "title": "Specific Goal",
        "target_amount": 8000.0,
        "current_amount": 4000.0,
        "deadline": None,
        "percentage": 50.0,
        "status": "active",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    with patch(
        "app.api.routes.v1.goals.goal_service.get_goal",
        new_callable=AsyncMock,
    ) as mock_get:
        mock_get.return_value = goal_data

        response = await client_with_auth.get(
            f"{settings.API_V1_STR}/bagcoin/goals/5"
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 5
    assert data["title"] == "Specific Goal"
    assert data["target_amount"] == 8000.0
    assert data["current_amount"] == 4000.0
    assert data["percentage"] == 50.0
    assert data["status"] == "active"


@pytest.mark.anyio
async def test_get_goal_not_found(client_with_auth):
    """Test getting a non-existent goal returns 404."""
    from app.core.exceptions import NotFoundError

    with patch(
        "app.api.routes.v1.goals.goal_service.get_goal",
        new_callable=AsyncMock,
    ) as mock_get:
        mock_get.side_effect = NotFoundError(
            message="Goal not found", details={"id": 999}
        )

        response = await client_with_auth.get(
            f"{settings.API_V1_STR}/bagcoin/goals/999"
        )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


# ---------------------------------------------------------------------------
# Update goal
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_update_goal(client_with_auth):
    """Test updating a goal."""
    now = datetime.now(UTC)
    updated_data = {
        "id": 3,
        "title": "Updated Title",
        "target_amount": 8000.0,
        "current_amount": 1000.0,
        "deadline": None,
        "percentage": 12.5,
        "status": "active",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    with patch(
        "app.api.routes.v1.goals.goal_service.update_goal",
        new_callable=AsyncMock,
    ) as mock_update:
        mock_update.return_value = updated_data

        response = await client_with_auth.patch(
            f"{settings.API_V1_STR}/bagcoin/goals/3",
            json={"title": "Updated Title", "target_amount": 8000.0},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 3
    assert data["title"] == "Updated Title"
    assert data["target_amount"] == 8000.0
    assert data["current_amount"] == 1000.0


@pytest.mark.anyio
async def test_update_goal_not_found(client_with_auth):
    """Test updating a non-existent goal returns 404."""
    from app.core.exceptions import NotFoundError

    with patch(
        "app.api.routes.v1.goals.goal_service.update_goal",
        new_callable=AsyncMock,
    ) as mock_update:
        mock_update.side_effect = NotFoundError(
            message="Goal not found", details={"id": 999}
        )

        response = await client_with_auth.patch(
            f"{settings.API_V1_STR}/bagcoin/goals/999",
            json={"title": "Should Fail"},
        )

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Delete goal
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_delete_goal(client_with_auth):
    """Test deleting a goal returns 204."""
    with patch(
        "app.api.routes.v1.goals.goal_service.delete_goal",
        new_callable=AsyncMock,
    ) as mock_delete:
        mock_delete.return_value = None

        response = await client_with_auth.delete(
            f"{settings.API_V1_STR}/bagcoin/goals/7"
        )

    assert response.status_code == 204


@pytest.mark.anyio
async def test_delete_goal_not_found(client_with_auth):
    """Test deleting a non-existent goal returns 404."""
    from app.core.exceptions import NotFoundError

    with patch(
        "app.api.routes.v1.goals.goal_service.delete_goal",
        new_callable=AsyncMock,
    ) as mock_delete:
        mock_delete.side_effect = NotFoundError(
            message="Goal not found", details={"id": 999}
        )

        response = await client_with_auth.delete(
            f"{settings.API_V1_STR}/bagcoin/goals/999"
        )

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Goal alerts
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_get_goal_alerts_route_shadowed(client_with_auth):
    """Test that /goals/alerts now works correctly (route ordering fixed).

    The /alerts route is now registered before /{goal_id},
    so it resolves correctly instead of being shadowed.
    """
    with patch(
        "app.api.routes.v1.goals.goal_service.get_goal_alerts",
        new_callable=AsyncMock,
    ) as mock_alerts:
        mock_alerts.return_value = []

        response = await client_with_auth.get(
            f"{settings.API_V1_STR}/bagcoin/goals/alerts"
        )

    assert response.status_code == 200
    assert response.json() == []
