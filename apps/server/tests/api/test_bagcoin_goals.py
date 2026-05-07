"""Tests for /bagcoin/goals/ REST endpoints."""

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
        self.phone_number = "+551****9999"
        self.google_id = None
        self.auth_provider = "email"
        self.avatar_url = None
        self.created_at = datetime.now(UTC)
        self.updated_at = datetime.now(UTC)


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
# Mock helpers
# ---------------------------------------------------------------------------


def _mock_goal_dict(**kwargs) -> dict:
    """Return a mock goal response dict."""
    now = kwargs.get("created_at", datetime.now(UTC))
    deadline = kwargs.get("deadline")
    return {
        "id": kwargs.get("id", 1),
        "title": kwargs.get("title", "Viagem para Europa"),
        "target_amount": kwargs.get("target_amount", 10000.0),
        "current_amount": kwargs.get("current_amount", 2500.0),
        "deadline": deadline.isoformat() if deadline else None,
        "percentage": kwargs.get("percentage", 25.0),
        "status": kwargs.get("status", "active"),
        "created_at": now.isoformat() if hasattr(now, "isoformat") else now,
        "updated_at": kwargs.get("updated_at", now).isoformat()
        if hasattr(kwargs.get("updated_at", now), "isoformat")
        else kwargs.get("updated_at", now),
    }


# ---------------------------------------------------------------------------
# Auth-guard tests – unauthenticated requests
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_goals_requires_auth(client):
    """Test that listing goals requires auth."""
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
    goals_data = [
        _mock_goal_dict(id=1, title="Viagem", target_amount=10000.0, current_amount=5000.0, percentage=50.0),
        _mock_goal_dict(id=2, title="Carro", target_amount=50000.0, current_amount=10000.0, percentage=20.0),
    ]

    with patch(
        "app.api.routes.v1.goals.goal_service.list_goals",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = goals_data

        response = await client_with_auth.get(f"{settings.API_V1_STR}/bagcoin/goals")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == 1
    assert data[0]["title"] == "Viagem"
    assert data[0]["percentage"] == 50.0
    assert data[1]["id"] == 2
    assert data[1]["title"] == "Carro"


# ---------------------------------------------------------------------------
# Create goal
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_create_goal(client_with_auth):
    """Test creating a goal returns 201."""
    goal_data = _mock_goal_dict(
        id=1,
        title="New Goal",
        target_amount=5000.0,
        current_amount=0.0,
        percentage=0.0,
        status="active",
    )

    with patch(
        "app.api.routes.v1.goals.goal_service.create_goal",
        new_callable=AsyncMock,
    ) as mock_create:
        mock_create.return_value = goal_data

        response = await client_with_auth.post(
            f"{settings.API_V1_STR}/bagcoin/goals",
            json={
                "title": "New Goal",
                "target_amount": 5000.0,
                "user_id": 1,
            },
        )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["title"] == "New Goal"
    assert data["target_amount"] == 5000.0
    assert data["current_amount"] == 0.0


@pytest.mark.anyio
async def test_create_goal_invalid_data(client_with_auth):
    """Test creating a goal with invalid data returns 422."""
    response = await client_with_auth.post(
        f"{settings.API_V1_STR}/bagcoin/goals",
        json={"title": "", "target_amount": -100},
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Get goal
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_get_goal(client_with_auth):
    """Test getting a specific goal."""
    goal_data = _mock_goal_dict(id=5, title="Specific Goal", target_amount=20000.0, current_amount=15000.0, percentage=75.0)

    with patch(
        "app.api.routes.v1.goals.goal_service.get_goal",
        new_callable=AsyncMock,
    ) as mock_get:
        mock_get.return_value = goal_data

        response = await client_with_auth.get(f"{settings.API_V1_STR}/bagcoin/goals/5")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 5
    assert data["title"] == "Specific Goal"
    assert data["current_amount"] == 15000.0
    assert data["percentage"] == 75.0


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
    updated_data = _mock_goal_dict(
        id=3,
        title="Updated Goal",
        target_amount=15000.0,
        current_amount=5000.0,
        percentage=33.3,
    )

    with patch(
        "app.api.routes.v1.goals.goal_service.update_goal",
        new_callable=AsyncMock,
    ) as mock_update:
        mock_update.return_value = updated_data

        response = await client_with_auth.patch(
            f"{settings.API_V1_STR}/bagcoin/goals/3",
            json={"title": "Updated Goal", "target_amount": 15000.0},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 3
    assert data["title"] == "Updated Goal"
    assert data["target_amount"] == 15000.0


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


# ---------------------------------------------------------------------------
# Goal alerts
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_get_goal_alerts_requires_auth(client):
    """Test that getting goal alerts requires auth."""
    response = await client.get(f"{settings.API_V1_STR}/bagcoin/goals/alerts")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_get_goal_alerts_empty(client_with_auth):
    """Test getting goal alerts when empty."""
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


@pytest.mark.anyio
async def test_get_goal_alerts_with_data(client_with_auth):
    """Test getting goal alerts with data."""
    alerts_data = [
        {
            "goal_id": 1,
            "goal_title": "Viagem para Europa",
            "target_amount": 10000.0,
            "current_amount": 10000.0,
            "percentage": 100.0,
            "type": "completed",
            "message": "Goal 'Viagem para Europa' completed!",
        },
        {
            "goal_id": 2,
            "goal_title": "Carro Novo",
            "target_amount": 50000.0,
            "current_amount": 45000.0,
            "percentage": 90.0,
            "type": "near_completion",
            "message": "Goal 'Carro Novo' está perto da conclusão (90%)",
        },
    ]

    with patch(
        "app.api.routes.v1.goals.goal_service.get_goal_alerts",
        new_callable=AsyncMock,
    ) as mock_alerts:
        mock_alerts.return_value = alerts_data

        response = await client_with_auth.get(
            f"{settings.API_V1_STR}/bagcoin/goals/alerts"
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["goal_id"] == 1
    assert data[0]["type"] == "completed"
    assert data[1]["goal_id"] == 2
    assert data[1]["type"] == "near_completion"
