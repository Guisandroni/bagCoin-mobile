"""AgentLog model — audit trail for BagCoin agent invocations."""

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class AgentLog(Base, TimestampMixin):
    """Audit log for BagCoin agent invocations.

    Records every request/response cycle for monitoring and debugging.

    Attributes:
        id: Auto-increment primary key.
        user_id: FK to phone_users.
        agent_name: Name of the agent that processed the request.
        request_payload: JSON blob of the incoming request.
        response_payload: JSON blob of the agent response.
        status: Processing status (success, error, pending).
    """

    __tablename__ = "agent_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("phone_users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agent_name: Mapped[str] = mapped_column(String(50), nullable=False)
    request_payload: Mapped[dict | None] = mapped_column(JSON, default=dict, nullable=True)
    response_payload: Mapped[dict | None] = mapped_column(JSON, default=dict, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="success", nullable=False)

    # Relationships
    phone_user: Mapped["PhoneUser"] = relationship("PhoneUser", back_populates="agent_logs")

    def __repr__(self) -> str:
        return (
            f"<AgentLog(id={self.id}, agent={self.agent_name}, "
            f"status={self.status}, user_id={self.user_id})>"
        )
