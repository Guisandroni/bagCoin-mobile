"""BagCoin conversation REST endpoints for web frontend.

Reuses the existing PhoneConversation model and services
to manage bagcoin conversation history and pending transactions.
"""

from typing import Any

from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DBSession
from app.db.models.phone_conversation import PhoneConversation
from app.db.models.transaction import Transaction
from app.db.models.user import User

router = APIRouter(prefix="/bagcoin/conversations", tags=["bagcoin"])


async def _get_phone_user_id(db: AsyncSession, user_uuid) -> int | None:
    """Get the PhoneUser id associated with a user's phone number."""
    from sqlalchemy import select as sa_select

    from app.db.models.phone_user import PhoneUser

    result = await db.execute(sa_select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user or not user.phone_number:
        return None
    result = await db.execute(
        sa_select(PhoneUser.id).where(PhoneUser.phone_number == user.phone_number)
    )
    phone_user_id = result.scalar_one_or_none()
    return phone_user_id


@router.get("")
async def list_conversations(
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """List the last 50 bagcoin conversations for the user."""
    phone_user_id = await _get_phone_user_id(db, current_user.id)
    if not phone_user_id:
        return []

    result = await db.execute(
        select(PhoneConversation)
        .where(PhoneConversation.user_id == phone_user_id)
        .order_by(PhoneConversation.updated_at.desc())
        .limit(50)
    )
    conversations = result.scalars().all()
    return [
        {
            "id": conv.id,
            "channel": conv.channel,
            "last_intent": conv.last_intent,
            "message_count": len(conv.message_history or []),
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
        }
        for conv in conversations
    ]


@router.get("/{conv_id}/messages")
async def get_conversation_messages(
    conv_id: int,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """Get messages from a specific bagcoin conversation."""
    phone_user_id = await _get_phone_user_id(db, current_user.id)
    if not phone_user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(PhoneConversation).where(
            PhoneConversation.id == conv_id,
            PhoneConversation.user_id == phone_user_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conv.message_history or []


@router.get("/pending")
async def get_pending_messages(
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """List pending transactions (low confidence) that need confirmation."""
    result = await db.execute(
        select(Transaction).where(
            Transaction.user_uuid == current_user.id,
            Transaction.confidence_score < 0.7,
        )
        .order_by(Transaction.created_at.desc())
        .limit(50)
    )
    transactions = result.scalars().all()
    return [
        {
            "id": tx.id,
            "type": tx.type,
            "amount": tx.amount,
            "description": tx.description,
            "transaction_date": tx.transaction_date.isoformat()
            if tx.transaction_date
            else None,
            "source_format": tx.source_format,
            "raw_input": tx.raw_input,
            "created_at": tx.created_at.isoformat() if tx.created_at else None,
        }
        for tx in transactions
    ]


@router.patch("/{conv_id}/messages/{msg_id}/confirm")
async def confirm_message(
    conv_id: int,
    msg_id: str,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """Confirm a pending transaction by its ID.

    Sets confidence_score to 1.0 to confirm the transaction.
    The msg_id parameter is the transaction ID (as string).
    """
    try:
        tx_id = int(msg_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid transaction ID")

    result = await db.execute(
        select(Transaction).where(
            Transaction.id == tx_id,
            Transaction.user_uuid == current_user.id,
        )
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    tx.confidence_score = 1.0
    db.add(tx)
    await db.flush()
    await db.refresh(tx)

    return {
        "id": tx.id,
        "status": "confirmed",
        "message": "Transaction confirmed successfully",
    }
