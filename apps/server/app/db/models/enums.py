"""BagCoin shared enums for database models."""

import enum


class TransactionType(str, enum.Enum):
    """Transaction type enumeration."""

    EXPENSE = "EXPENSE"
    INCOME = "INCOME"
    TRANSFER = "TRANSFER"
    ADJUSTMENT = "ADJUSTMENT"


class UserStatus(str, enum.Enum):
    """User status enumeration."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"


class GoalStatus(str, enum.Enum):
    """Goal status enumeration."""

    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
