"""Category model for transaction categorization."""

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Category(Base, TimestampMixin):
    """Transaction category.

    Supports hierarchical categories via parent_category_id self-reference.

    Attributes:
        id: Auto-increment primary key.
        user_id: FK to phone_users.
        name: Category name (e.g. "Alimentação", "Transporte").
        parent_category_id: Self-referencing FK for sub-categories.
        is_default: Whether this is a system-default category.
    """

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("phone_users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True,
    )
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    phone_user: Mapped["PhoneUser"] = relationship("PhoneUser", back_populates="categories")
    parent: Mapped["Category | None"] = relationship(
        "Category", remote_side="Category.id", backref="children",
    )
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="category",
    )
    budgets: Mapped[list["Budget"]] = relationship(
        "Budget", back_populates="category",
    )
    budget_items: Mapped[list["BudgetItem"]] = relationship(
        "BudgetItem", back_populates="category",
    )

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name={self.name}, user_id={self.user_id})>"
