"""CreditCard model for tracking credit cards."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.user import User


class CreditCard(Base, TimestampMixin):
    """Credit card model.

    Attributes:
        id: UUID primary key.
        user_id: FK to users.
        name: Card name (e.g. "Nubank").
        issuer: Card issuer (visa, mastercard, etc.).
        limit: Credit limit.
        closing_day: Card closing day (1-31).
        due_day: Payment due day (1-31).
        color: Display color for UI.
        active: Whether the card is active.
    """

    __tablename__ = "credit_cards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    issuer: Mapped[str] = mapped_column(String(50), nullable=False)
    limit: Mapped[float] = mapped_column(Float, nullable=False)
    closing_day: Mapped[int] = mapped_column(Integer, nullable=False)
    due_day: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="credit_cards")

    def __repr__(self) -> str:
        return (
            f"<CreditCard(id={self.id}, name={self.name}, "
            f"issuer={self.issuer}, limit={self.limit})>"
        )
