"""Goal model for financial savings goals."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.db.models.enums import GoalStatus


class Goal(Base, TimestampMixin):
    """Financial savings goal.

    Attributes:
        id: Auto-increment primary key.
        user_id: FK to phone_users.
        title: Goal title (e.g. "Viagem para Europa").
        target_amount: Target savings amount.
        current_amount: Current saved amount.
        deadline: Optional target date.
        status: Goal status (active, completed, cancelled).
    """

    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("phone_users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    target_amount: Mapped[float] = mapped_column(Float, nullable=False)
    current_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[GoalStatus] = mapped_column(
        String(20), default=GoalStatus.ACTIVE.value, nullable=False,
    )

    # Relationships
    phone_user: Mapped["PhoneUser"] = relationship("PhoneUser", back_populates="goals")

    def __repr__(self) -> str:
        return (
            f"<Goal(id={self.id}, title={self.title}, "
            f"target={self.target_amount}, status={self.status})>"
        )
