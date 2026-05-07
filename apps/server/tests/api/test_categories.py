"""Tests for /bagcoin/categories/ REST endpoints (API Key auth)."""

from unittest.mock import MagicMock, patch

import pytest

from app.core.config import settings


# ---------------------------------------------------------------------------
# Auth-guard tests — missing / invalid API key
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_categories_requires_api_key(client):
    """Test that listing categories requires API key header."""
    response = await client.get(
        f"{settings.API_V1_STR}/bagcoin/categories/",
        params={"phone_number": "+5511999999999"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_invalid_api_key(client):
    """Test that an invalid API key returns 403."""
    response = await client.get(
        f"{settings.API_V1_STR}/bagcoin/categories/",
        params={"phone_number": "+5511999999999"},
        headers={settings.API_KEY_HEADER: "invalid-key-xyz"},
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# List categories
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_categories_empty(client, api_key_headers):
    """Test listing categories when empty."""
    with patch(
        "app.api.routes.v1.categories.list_categories",
        return_value=[],
    ) as mock_list:
        response = await client.get(
            f"{settings.API_V1_STR}/bagcoin/categories/",
            params={"phone_number": "+5511999999999"},
            headers=api_key_headers,
        )

    assert response.status_code == 200
    assert response.json() == []
    mock_list.assert_called_once_with("+5511999999999")


@pytest.mark.anyio
async def test_list_categories_with_data(client, api_key_headers):
    """Test listing categories with data."""
    categories_data = [
        {"id": 1, "name": "Alimentação", "is_default": True},
        {"id": 2, "name": "Transporte", "is_default": True},
        {"id": 3, "name": "Meu Cat Personalizado", "is_default": False},
    ]

    with patch(
        "app.api.routes.v1.categories.list_categories",
        return_value=categories_data,
    ) as mock_list:
        response = await client.get(
            f"{settings.API_V1_STR}/bagcoin/categories/",
            params={"phone_number": "+5511999999999"},
            headers=api_key_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert data[0]["name"] == "Alimentação"
    assert data[1]["name"] == "Transporte"
    assert data[2]["name"] == "Meu Cat Personalizado"
    assert data[2]["is_default"] is False
    mock_list.assert_called_once_with("+5511999999999")


# ---------------------------------------------------------------------------
# Create category
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_create_category(client, api_key_headers):
    """Test creating a category returns 201."""
    new_cat = {"id": 10, "name": "Novidades"}

    with patch(
        "app.api.routes.v1.categories.create_category",
        return_value=new_cat,
    ) as mock_create:
        response = await client.post(
            f"{settings.API_V1_STR}/bagcoin/categories/",
            params={"phone_number": "+5511999999999", "name": "Novidades"},
            headers=api_key_headers,
        )

    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "Category 'Novidades' created"
    assert data["category"]["id"] == 10
    assert data["category"]["name"] == "Novidades"
    mock_create.assert_called_once_with("+5511999999999", "Novidades")


@pytest.mark.anyio
async def test_create_category_duplicate(client, api_key_headers):
    """Test creating a duplicate category returns 409."""
    with patch(
        "app.api.routes.v1.categories.create_category",
        return_value=None,
    ) as mock_create:
        response = await client.post(
            f"{settings.API_V1_STR}/bagcoin/categories/",
            params={"phone_number": "+5511999999999", "name": "Alimentação"},
            headers=api_key_headers,
        )

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]
    mock_create.assert_called_once_with("+5511999999999", "Alimentação")


# ---------------------------------------------------------------------------
# Rename category
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_rename_category(client, api_key_headers):
    """Test renaming a category returns 200."""
    with patch(
        "app.api.routes.v1.categories.rename_category",
        return_value=True,
    ) as mock_rename:
        response = await client.patch(
            f"{settings.API_V1_STR}/bagcoin/categories/Alimentação",
            params={
                "phone_number": "+5511999999999",
                "new_name": "Comidas",
            },
            headers=api_key_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert "renamed" in data["message"]
    mock_rename.assert_called_once_with(
        "+5511999999999", "Alimentação", "Comidas"
    )


@pytest.mark.anyio
async def test_rename_category_not_found(client, api_key_headers):
    """Test renaming a non-existent category returns 404."""
    with patch(
        "app.api.routes.v1.categories.rename_category",
        return_value=False,
    ) as mock_rename:
        response = await client.patch(
            f"{settings.API_V1_STR}/bagcoin/categories/Inexistente",
            params={
                "phone_number": "+5511999999999",
                "new_name": "NovoNome",
            },
            headers=api_key_headers,
        )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"]
    mock_rename.assert_called_once_with(
        "+5511999999999", "Inexistente", "NovoNome"
    )


# ---------------------------------------------------------------------------
# Delete category
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_delete_category(client, api_key_headers):
    """Test deleting a category returns 200."""
    with patch(
        "app.api.routes.v1.categories.delete_category",
        return_value=True,
    ) as mock_delete:
        response = await client.delete(
            f"{settings.API_V1_STR}/bagcoin/categories/MeuCat",
            params={"phone_number": "+5511999999999"},
            headers=api_key_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert "deleted" in data["message"]
    mock_delete.assert_called_once_with("+5511999999999", "MeuCat")


@pytest.mark.anyio
async def test_delete_category_default(client, api_key_headers):
    """Test deleting a default category returns 404."""
    with patch(
        "app.api.routes.v1.categories.delete_category",
        return_value=False,
    ) as mock_delete:
        response = await client.delete(
            f"{settings.API_V1_STR}/bagcoin/categories/Alimentação",
            params={"phone_number": "+5511999999999"},
            headers=api_key_headers,
        )

    assert response.status_code == 404
    assert "not found or is default" in response.json()["detail"]
    mock_delete.assert_called_once_with("+5511999999999", "Alimentação")


@pytest.mark.anyio
async def test_delete_category_not_found(client, api_key_headers):
    """Test deleting a non-existent category returns 404."""
    with patch(
        "app.api.routes.v1.categories.delete_category",
        return_value=False,
    ) as mock_delete:
        response = await client.delete(
            f"{settings.API_V1_STR}/bagcoin/categories/NoExist",
            params={"phone_number": "+5511999999999"},
            headers=api_key_headers,
        )

    assert response.status_code == 404
    assert "not found or is default" in response.json()["detail"]
    mock_delete.assert_called_once_with("+5511999999999", "NoExist")
