"""Tests for Report REST endpoints."""

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
async def test_list_reports_requires_auth(client):
    """Test that unauthenticated requests are rejected."""
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
    reports_data = [
        {
            "id": 1,
            "period_start": "2026-01-01T00:00:00+00:00",
            "period_end": "2026-01-31T00:00:00+00:00",
            "file_url": "/reports/jan2026.pdf",
            "created_at": "2026-01-31T12:00:00+00:00",
        },
        {
            "id": 2,
            "period_start": "2026-02-01T00:00:00+00:00",
            "period_end": "2026-02-28T00:00:00+00:00",
            "file_url": "/reports/feb2026.pdf",
            "created_at": "2026-02-28T12:00:00+00:00",
        },
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
    assert data[0]["file_url"] == "/reports/jan2026.pdf"
    assert data[0]["period_start"] is not None
    assert data[0]["period_end"] is not None
    assert data[1]["id"] == 2
    assert data[1]["file_url"] == "/reports/feb2026.pdf"


# ---------------------------------------------------------------------------
# Download report
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_reports_with_pagination(client_with_auth):
    """Test listing reports with pagination params."""
    reports_data = [
        {"id": 1, "period_start": None, "period_end": None, "file_url": "/a.pdf", "created_at": None},
    ]

    with patch(
        "app.api.routes.v1.reports.report_service.list_reports",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = reports_data

        response = await client_with_auth.get(
            f"{settings.API_V1_STR}/bagcoin/reports?skip=0&limit=10"
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


# ---------------------------------------------------------------------------
# Download report
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_download_report(client_with_auth):
    """Test downloading a report PDF."""
    with patch(
        "app.api.routes.v1.reports.report_service.get_report_download",
        new_callable=AsyncMock,
    ) as mock_download:
        mock_download.return_value = {"path": "/tmp/test_report.pdf"}

        response = await client_with_auth.get(
            f"{settings.API_V1_STR}/bagcoin/reports/5/download"
        )

    assert response.status_code == 200


@pytest.mark.anyio
async def test_download_report_not_found(client_with_auth):
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


@pytest.mark.anyio
async def test_download_report_not_owned(client_with_auth):
    """Test downloading another user's report returns 404."""
    from app.core.exceptions import NotFoundError

    with patch(
        "app.api.routes.v1.reports.report_service.get_report_download",
        new_callable=AsyncMock,
    ) as mock_download:
        mock_download.side_effect = NotFoundError(
            message="Report not found", details={"id": 10}
        )

        response = await client_with_auth.get(
            f"{settings.API_V1_STR}/bagcoin/reports/10/download"
        )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


@pytest.mark.anyio
async def test_download_report_invalid_id(client_with_auth):
    """Test downloading a report with invalid id returns 422."""
    response = await client_with_auth.get(
        f"{settings.API_V1_STR}/bagcoin/reports/abc/download"
    )
    assert response.status_code == 422


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
            f"{settings.API_V1_STR}/bagcoin/reports/7"
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
    assert response.json()["error"]["code"] == "NOT_FOUND"
