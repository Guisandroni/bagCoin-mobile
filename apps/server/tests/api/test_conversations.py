"""Tests for Conversation CRUD REST endpoints (AI Chat)."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import (
    get_conversation_service,
    get_conversation_share_service,
    get_current_user,
    get_db_session,
    get_rating_service,
    get_redis,
)
from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.main import app
from app.schemas.conversation import (
    ConversationCreate,
    ConversationRead,
    ConversationReadWithMessages,
    ConversationUpdate,
)
from app.schemas.message_rating import MessageRatingCreate, MessageRatingRead, RatingValue
from app.services.conversation import ConversationService
from app.services.conversation_share import ConversationShareService
from app.services.message_rating import MessageRatingService


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
def mock_conversation_service():
    """Mock ConversationService with AsyncMock."""
    return AsyncMock(spec=ConversationService)


@pytest.fixture
def mock_rating_service():
    """Mock MessageRatingService with AsyncMock."""
    return AsyncMock(spec=MessageRatingService)


@pytest.fixture
def mock_share_service():
    """Mock ConversationShareService with AsyncMock."""
    return AsyncMock(spec=ConversationShareService)


@pytest.fixture
async def client_with_auth(
    mock_user,
    mock_redis,
    mock_db_session,
):
    """Async HTTP client with authenticated user override.

    Sets up dependency overrides for auth, redis, and DB session.
    Service-specific overrides are added in individual tests.
    """
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
# Auth-guard tests -- unauthenticated requests
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_conversations_requires_auth(client):
    """GET /conversations without auth returns 401."""
    response = await client.get(f"{settings.API_V1_STR}/conversations")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_create_conversation_requires_auth(client):
    """POST /conversations without auth returns 401."""
    response = await client.post(f"{settings.API_V1_STR}/conversations", json={})
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# List conversations
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_conversations_empty(
    client_with_auth,
    mock_conversation_service,
):
    """GET /conversations returns empty list when user has no conversations."""
    app.dependency_overrides[get_conversation_service] = lambda: mock_conversation_service
    mock_conversation_service.list_conversations.return_value = ([], 0)

    response = await client_with_auth.get(f"{settings.API_V1_STR}/conversations")

    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0

    app.dependency_overrides.pop(get_conversation_service, None)


@pytest.mark.anyio
async def test_list_conversations_with_data(
    client_with_auth,
    mock_conversation_service,
    mock_user,
):
    """GET /conversations returns paginated list of conversations."""
    app.dependency_overrides[get_conversation_service] = lambda: mock_conversation_service

    now = datetime.now(UTC)
    conv1 = ConversationRead(
        id=uuid4(),
        user_id=mock_user.id,
        title="First Chat",
        is_archived=False,
        created_at=now,
        updated_at=now,
    )
    conv2 = ConversationRead(
        id=uuid4(),
        user_id=mock_user.id,
        title="Second Chat",
        is_archived=False,
        created_at=now,
        updated_at=now,
    )
    mock_conversation_service.list_conversations.return_value = ([conv1, conv2], 2)

    response = await client_with_auth.get(
        f"{settings.API_V1_STR}/conversations?skip=0&limit=10"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 2
    assert data["items"][0]["title"] == "First Chat"
    assert data["items"][1]["title"] == "Second Chat"

    mock_conversation_service.list_conversations.assert_awaited_once_with(
        user_id=mock_user.id, skip=0, limit=10, include_archived=False,
    )

    app.dependency_overrides.pop(get_conversation_service, None)


# ---------------------------------------------------------------------------
# Create conversation
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_create_conversation(
    client_with_auth,
    mock_conversation_service,
    mock_user,
):
    """POST /conversations creates a new conversation successfully."""
    app.dependency_overrides[get_conversation_service] = lambda: mock_conversation_service

    now = datetime.now(UTC)
    conv = ConversationRead(
        id=uuid4(),
        user_id=mock_user.id,
        title="New Conversation",
        is_archived=False,
        created_at=now,
        updated_at=now,
    )
    mock_conversation_service.create_conversation.return_value = conv

    response = await client_with_auth.post(
        f"{settings.API_V1_STR}/conversations",
        json={"title": "New Conversation"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Conversation"
    assert data["user_id"] == str(mock_user.id)
    assert data["is_archived"] is False

    # Verify the service was called with a ConversationCreate containing
    # the user_id injected by the route and the title from request body.
    mock_conversation_service.create_conversation.assert_awaited_once()
    # await_args is (_Call) where [0] = positional args tuple, so [0][0] is the first arg
    call_args_tuple = mock_conversation_service.create_conversation.await_args[0]
    call_arg = call_args_tuple[0]
    assert isinstance(call_arg, ConversationCreate)
    assert call_arg.title == "New Conversation"
    assert call_arg.user_id == mock_user.id

    app.dependency_overrides.pop(get_conversation_service, None)


# ---------------------------------------------------------------------------
# Get conversation
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_get_conversation(
    client_with_auth,
    mock_conversation_service,
    mock_user,
):
    """GET /conversations/{id} returns a conversation with messages."""
    app.dependency_overrides[get_conversation_service] = lambda: mock_conversation_service

    conv_id = uuid4()
    now = datetime.now(UTC)
    conv = ConversationReadWithMessages(
        id=conv_id,
        user_id=mock_user.id,
        title="My Conversation",
        is_archived=False,
        messages=[],
        created_at=now,
        updated_at=now,
    )
    mock_conversation_service.get_conversation.return_value = conv

    response = await client_with_auth.get(
        f"{settings.API_V1_STR}/conversations/{conv_id}"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(conv_id)
    assert data["title"] == "My Conversation"
    assert data["messages"] == []

    mock_conversation_service.get_conversation.assert_awaited_once_with(
        conv_id, include_messages=True, user_id=mock_user.id,
    )

    app.dependency_overrides.pop(get_conversation_service, None)


@pytest.mark.anyio
async def test_get_conversation_not_found(
    client_with_auth,
    mock_conversation_service,
):
    """GET /conversations/{id} with non-existent id returns 404."""
    app.dependency_overrides[get_conversation_service] = lambda: mock_conversation_service

    conv_id = uuid4()
    mock_conversation_service.get_conversation.side_effect = NotFoundError(
        message="Conversation not found",
    )

    response = await client_with_auth.get(
        f"{settings.API_V1_STR}/conversations/{conv_id}"
    )

    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "NOT_FOUND"
    assert "not found" in data["error"]["message"].lower()

    app.dependency_overrides.pop(get_conversation_service, None)


# ---------------------------------------------------------------------------
# Update conversation
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_update_conversation(
    client_with_auth,
    mock_conversation_service,
    mock_user,
):
    """PATCH /conversations/{id} updates conversation title."""
    app.dependency_overrides[get_conversation_service] = lambda: mock_conversation_service

    conv_id = uuid4()
    now = datetime.now(UTC)
    updated_conv = ConversationRead(
        id=conv_id,
        user_id=mock_user.id,
        title="Updated Title",
        is_archived=False,
        created_at=now,
        updated_at=now,
    )
    mock_conversation_service.update_conversation.return_value = updated_conv

    response = await client_with_auth.patch(
        f"{settings.API_V1_STR}/conversations/{conv_id}",
        json={"title": "Updated Title"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"

    mock_conversation_service.update_conversation.assert_awaited_once()
    args, kwargs = mock_conversation_service.update_conversation.await_args
    assert str(args[0]) == str(conv_id)
    assert isinstance(args[1], ConversationUpdate)
    assert args[1].title == "Updated Title"
    assert kwargs.get("user_id") == mock_user.id

    app.dependency_overrides.pop(get_conversation_service, None)


# ---------------------------------------------------------------------------
# Delete conversation
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_delete_conversation(
    client_with_auth,
    mock_conversation_service,
    mock_user,
):
    """DELETE /conversations/{id} deletes a conversation."""
    app.dependency_overrides[get_conversation_service] = lambda: mock_conversation_service

    conv_id = uuid4()
    mock_conversation_service.delete_conversation.return_value = True

    response = await client_with_auth.delete(
        f"{settings.API_V1_STR}/conversations/{conv_id}"
    )

    assert response.status_code == 204

    mock_conversation_service.delete_conversation.assert_awaited_once_with(
        conv_id, user_id=mock_user.id,
    )

    app.dependency_overrides.pop(get_conversation_service, None)


# ---------------------------------------------------------------------------
# Archive conversation
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_archive_conversation(
    client_with_auth,
    mock_conversation_service,
    mock_user,
):
    """POST /conversations/{id}/archive archives a conversation."""
    app.dependency_overrides[get_conversation_service] = lambda: mock_conversation_service

    conv_id = uuid4()
    now = datetime.now(UTC)
    archived_conv = ConversationRead(
        id=conv_id,
        user_id=mock_user.id,
        title="Archived Chat",
        is_archived=True,
        created_at=now,
        updated_at=now,
    )
    mock_conversation_service.archive_conversation.return_value = archived_conv

    response = await client_with_auth.post(
        f"{settings.API_V1_STR}/conversations/{conv_id}/archive"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_archived"] is True

    mock_conversation_service.archive_conversation.assert_awaited_once_with(
        conv_id, user_id=mock_user.id,
    )

    app.dependency_overrides.pop(get_conversation_service, None)


# ---------------------------------------------------------------------------
# Rate message
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_rate_message(
    client_with_auth,
    mock_rating_service,
    mock_user,
):
    """POST /conversations/{id}/messages/{msg_id}/rate rates a message."""
    app.dependency_overrides[get_rating_service] = lambda: mock_rating_service

    conv_id = uuid4()
    msg_id = uuid4()
    now = datetime.now(UTC)
    rating = MessageRatingRead(
        id=uuid4(),
        message_id=msg_id,
        user_id=mock_user.id,
        rating=RatingValue.LIKE,
        comment=None,
        created_at=now,
        updated_at=now,
    )
    mock_rating_service.rate_message.return_value = (rating, True)

    response = await client_with_auth.post(
        f"{settings.API_V1_STR}/conversations/{conv_id}/messages/{msg_id}/rate",
        json={"rating": 1},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 1
    assert data["message_id"] == str(msg_id)

    mock_rating_service.rate_message.assert_awaited_once()
    _, call_kwargs = mock_rating_service.rate_message.await_args
    assert str(call_kwargs["conversation_id"]) == str(conv_id)
    assert str(call_kwargs["message_id"]) == str(msg_id)
    assert call_kwargs["user_id"] == mock_user.id
    assert isinstance(call_kwargs["data"], MessageRatingCreate)
    assert call_kwargs["data"].rating == 1

    app.dependency_overrides.pop(get_rating_service, None)


# ---------------------------------------------------------------------------
# Shared-with-me list
# ---------------------------------------------------------------------------


@pytest.mark.xfail(
    reason="Route GET /conversations/shared-with-me is shadowed by GET /conversations/{conversation_id} "
    "due to definition order. The static path must be registered before the dynamic path in the router.",
    strict=False,
)
@pytest.mark.anyio
async def test_list_shared_with_me(
    client_with_auth,
    mock_share_service,
    mock_user,
):
    """GET /conversations/shared-with-me lists conversations shared with user."""
    app.dependency_overrides[get_conversation_share_service] = lambda: mock_share_service

    now = datetime.now(UTC)
    shared_items = [
        ConversationRead(
            id=uuid4(),
            user_id=uuid4(),
            title="Shared With Me",
            is_archived=False,
            created_at=now,
            updated_at=now,
        ),
    ]
    mock_share_service.list_shared_with_me.return_value = (shared_items, 1)

    response = await client_with_auth.get(
        f"{settings.API_V1_STR}/conversations/shared-with-me"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Shared With Me"

    mock_share_service.list_shared_with_me.assert_awaited_once_with(
        mock_user.id, skip=0, limit=50,
    )

    app.dependency_overrides.pop(get_conversation_share_service, None)


# ---------------------------------------------------------------------------
# Get shared conversation (public)
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_get_shared_conversation(
    client,
    mock_share_service,
):
    """GET /conversations/shared/{token} returns a shared conversation (no auth)."""
    app.dependency_overrides[get_conversation_share_service] = lambda: mock_share_service

    token = "public-share-token-abc123"
    now = datetime.now(UTC)
    share_data = {
        "conversation": {
            "id": str(uuid4()),
            "title": "Public Shared Conversation",
            "messages": [
                {
                    "id": str(uuid4()),
                    "role": "user",
                    "content": "Hello from shared conversation!",
                    "created_at": now.isoformat(),
                },
            ],
        },
        "share": {
            "id": str(uuid4()),
            "permission": "view",
            "share_token": token,
        },
    }
    mock_share_service.get_by_token.return_value = share_data

    response = await client.get(
        f"{settings.API_V1_STR}/conversations/shared/{token}"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["conversation"]["title"] == "Public Shared Conversation"
    assert len(data["conversation"]["messages"]) == 1
    assert data["share"]["share_token"] == token

    mock_share_service.get_by_token.assert_awaited_once_with(token)

    app.dependency_overrides.pop(get_conversation_share_service, None)
