"""Report model for generated financial reports."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Report(Base, TimestampMixin):
    """Generated financial report.

    Attributes:
        id: Auto-increment primary key.
        user_id: FK to phone_users.
        period_start: Report period start date.
        period_end: Report period end date.
        file_url: URL or path to the generated report file.
    """

    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("phone_users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    phone_user: Mapped["PhoneUser"] = relationship("PhoneUser", back_populates="reports")

    def __repr__(self) -> str:
        return (
            f"<Report(id={self.id}, user_id={self.user_id}, "
            f"period={self.period_start.date()}–{self.period_end.date()})>"
        )
