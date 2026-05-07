"""Account model for bank accounts."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.user import User


class Account(Base, TimestampMixin):
    """Bank account model.

    Attributes:
        id: UUID primary key.
        user_id: FK to users.
        name: Account name (e.g. "Conta Corrente").
        bank: Bank name (e.g. "Nubank").
        type: Account type (CHECKING, SAVINGS).
        balance: Current balance.
        color: Display color for UI.
        active: Whether the account is active.
    """

    __tablename__ = "accounts"

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
    bank: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # CHECKING, SAVINGS
    balance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="accounts")

    def __repr__(self) -> str:
        return (
            f"<Account(id={self.id}, name={self.name}, "
            f"bank={self.bank}, balance={self.balance})>"
        )
