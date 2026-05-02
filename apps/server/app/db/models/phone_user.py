"""PhoneUser model - BagCoin user identified by phone number."""

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.db.models.enums import UserStatus


class PhoneUser(Base, TimestampMixin):
    """BagCoin user identified by phone number.

    This is separate from the auth User model — it represents a
    financial profile user reachable via WhatsApp/Telegram.

    Attributes:
        id: Auto-increment primary key (SERIAL).
        phone_number: Unique phone number identifier.
        name: Optional display name.
        status: Account status (active/inactive/blocked).
        preferences: JSON blob for user preferences.
        financial_profile: JSON blob for financial profile data.
        telegram_chat_id: Optional Telegram chat ID for Telegram-based users.
        platform: Communication platform (whatsapp, telegram, etc.).
    """

    __tablename__ = "phone_users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    phone_number: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[UserStatus] = mapped_column(
        String(20), default=UserStatus.ACTIVE.value, nullable=False
    )
    preferences: Mapped[dict | None] = mapped_column(JSON, default=dict, nullable=True)
    financial_profile: Mapped[dict | None] = mapped_column(JSON, default=dict, nullable=True)
    telegram_chat_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True, index=True
    )
    platform: Mapped[str] = mapped_column(String(20), default="whatsapp", nullable=False)

    # Relationships
    categories: Mapped[list["Category"]] = relationship(
        "Category",
        back_populates="phone_user",
        cascade="all, delete-orphan",
    )
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction",
        back_populates="phone_user",
        cascade="all, delete-orphan",
    )
    budgets: Mapped[list["Budget"]] = relationship(
        "Budget",
        back_populates="phone_user",
        cascade="all, delete-orphan",
    )
    goals: Mapped[list["Goal"]] = relationship(
        "Goal",
        back_populates="phone_user",
        cascade="all, delete-orphan",
    )
    reports: Mapped[list["Report"]] = relationship(
        "Report",
        back_populates="phone_user",
        cascade="all, delete-orphan",
    )
    conversations: Mapped[list["PhoneConversation"]] = relationship(
        "PhoneConversation",
        back_populates="phone_user",
        cascade="all, delete-orphan",
    )
    agent_logs: Mapped[list["AgentLog"]] = relationship(
        "AgentLog",
        back_populates="phone_user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<PhoneUser(id={self.id}, phone={self.phone_number}, status={self.status})>"
