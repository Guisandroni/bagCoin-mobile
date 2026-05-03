"""Transaction model for financial records."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.db.models.enums import TransactionType

if TYPE_CHECKING:
    from app.db.models.category import Category
    from app.db.models.phone_user import PhoneUser
    from app.db.models.user import User


class Transaction(Base, TimestampMixin):
    """Financial transaction record.

    Attributes:
        id: Auto-increment primary key.
        user_id: FK to phone_users (for WhatsApp/Telegram users).
        user_uuid: FK to users (for web app authenticated users).
        type: Transaction type (EXPENSE, INCOME, TRANSFER, ADJUSTMENT).
        amount: Transaction amount.
        currency: Currency code (default "BRL").
        category_id: FK to categories.
        description: Optional description.
        source_format: Origin format (text, audio, image, document).
        transaction_date: When the transaction occurred.
        confidence_score: AI extraction confidence (0.0-1.0).
        raw_input: Original raw input from the user.
    """

    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("phone_users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    user_uuid: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    type: Mapped[TransactionType] = mapped_column(
        String(20),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="BRL", nullable=False)
    category_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_format: Mapped[str] = mapped_column(String(20), default="text", nullable=False)
    transaction_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    raw_input: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    phone_user: Mapped[PhoneUser | None] = relationship("PhoneUser", back_populates="transactions")
    category: Mapped[Category | None] = relationship("Category", back_populates="transactions")
    user: Mapped[User | None] = relationship("User", back_populates="transactions")

    def __repr__(self) -> str:
        return (
            f"<Transaction(id={self.id}, type={self.type}, "
            f"amount={self.amount}, user_id={self.user_id})>"
        )
