"""Tests for /bagcoin/reports/ REST endpoints."""

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


def _mock_report_dict(**kwargs) -> dict:
    """Return a mock report response dict."""
    now = kwargs.get("created_at", datetime.now(UTC))
    return {
        "id": kwargs.get("id", 1),
        "period_start": kwargs.get("period_start", datetime.now(UTC)).isoformat()
        if hasattr(kwargs.get("period_start", datetime.now(UTC)), "isoformat")
        else kwargs.get("period_start"),
        "period_end": kwargs.get("period_end", datetime.now(UTC)).isoformat()
        if hasattr(kwargs.get("period_end", datetime.now(UTC)), "isoformat")
        else kwargs.get("period_end"),
        "file_url": kwargs.get("file_url", "/tmp/report_1.pdf"),
        "created_at": now.isoformat() if hasattr(now, "isoformat") else now,
    }


# ---------------------------------------------------------------------------
# Auth-guard tests – unauthenticated requests
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_reports_requires_auth(client):
    """Test that listing reports requires auth."""
    response = await client.get(f"{settings.API_V1_STR}/bagcoin/reports")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_download_report_requires_auth(client):
    """Test that downloading a report requires auth."""
    response = await client.get(f"{settings.API_V1_STR}/bagcoin/reports/1/download")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_delete_report_requires_auth(client):
    """Test that deleting a report requires auth."""
    response = await client.delete(f"{settings.API_V1_STR}/bagcoin/reports/1")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# List reports
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_reports_empty(client_with_auth):
    """Test listing reports when empty."""
    with patch(
        "app.api.routes.v1.reports.report_service.list_reports",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = []

        response = await client_with_auth.get(f"{settings.API_V1_STR}/bagcoin/reports")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_list_reports_with_data(client_with_auth):
    """Test listing reports with data."""
    now = datetime.now(UTC)
    reports_data = [
        _mock_report_dict(id=1, period_start=now, period_end=now, file_url="/tmp/report_1.pdf"),
        _mock_report_dict(id=2, period_start=now, period_end=now, file_url="/tmp/report_2.pdf"),
    ]

    with patch(
        "app.api.routes.v1.reports.report_service.list_reports",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = reports_data

        response = await client_with_auth.get(f"{settings.API_V1_STR}/bagcoin/reports")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == 1
    assert data[0]["file_url"] == "/tmp/report_1.pdf"
    assert data[1]["id"] == 2
    assert data[1]["file_url"] == "/tmp/report_2.pdf"


# ---------------------------------------------------------------------------
# Get report (download)
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_get_report_download_not_found(client_with_auth):
    """Test downloading a non-existent report returns 404."""
    from app.core.exceptions import NotFoundError

    with patch(
        "app.api.routes.v1.reports.report_service.get_report_download",
        new_callable=AsyncMock,
    ) as mock_download:
        mock_download.side_effect = NotFoundError(
            message="Report not found", details={"id": 999}
        )

        response = await client_with_auth.get(
            f"{settings.API_V1_STR}/bagcoin/reports/999/download"
        )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


# ---------------------------------------------------------------------------
# Delete report
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_delete_report(client_with_auth):
    """Test deleting a report returns 204."""
    with patch(
        "app.api.routes.v1.reports.report_service.delete_report",
        new_callable=AsyncMock,
    ) as mock_delete:
        mock_delete.return_value = None

        response = await client_with_auth.delete(
            f"{settings.API_V1_STR}/bagcoin/reports/1"
        )

    assert response.status_code == 204


@pytest.mark.anyio
async def test_delete_report_not_found(client_with_auth):
    """Test deleting a non-existent report returns 404."""
    from app.core.exceptions import NotFoundError

    with patch(
        "app.api.routes.v1.reports.report_service.delete_report",
        new_callable=AsyncMock,
    ) as mock_delete:
        mock_delete.side_effect = NotFoundError(
            message="Report not found", details={"id": 999}
        )

        response = await client_with_auth.delete(
            f"{settings.API_V1_STR}/bagcoin/reports/999"
        )

    assert response.status_code == 404
