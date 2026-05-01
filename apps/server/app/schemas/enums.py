"""BagCoin shared enums for Pydantic schemas."""

import enum
from enum import StrEnum


class IntentType(StrEnum):
    """Intent types recognized by the BagCoin agent orchestrator."""
    REGISTER_EXPENSE = "register_expense"
    REGISTER_INCOME = "register_income"
    QUERY_DATA = "query_data"
    GENERATE_REPORT = "generate_report"
    CREATE_BUDGET = "create_budget"
    CREATE_GOAL = "create_goal"
    CONTRIBUTE_GOAL = "contribute_goal"
    DELETE_BUDGET = "delete_budget"
    UPDATE_BUDGET = "update_budget"
    DELETE_TRANSACTION = "delete_transaction"
    UPDATE_TRANSACTION = "update_transaction"
    DELETE_GOAL = "delete_goal"
    UPDATE_GOAL = "update_goal"
    TOGGLE_ALERTS = "toggle_alerts"
    RECOMMENDATION = "recommendation"
    DEEP_RESEARCH = "deep_research"
    IMPORT_STATEMENT = "import_statement"
    GREETING = "greeting"
    INTRODUCE = "introduce"
    HELP = "help"
    CORRECTION = "correction"
    CREATE_CATEGORY = "create_category"
    DELETE_CATEGORY = "delete_category"
    UPDATE_CATEGORY = "update_category"
    LIST_CATEGORIES = "list_categories"
    CHAT = "chat"
    UNKNOWN = "unknown"


class SourceFormat(StrEnum):
    """Source format for transaction input."""
    TEXT = "text"
    AUDIO = "audio"
    IMAGE = "image"
    DOCUMENT = "document"


class TransactionType(str, enum.Enum):
    """Transaction type enumeration."""
    EXPENSE = "EXPENSE"
    INCOME = "INCOME"
    TRANSFER = "TRANSFER"
    ADJUSTMENT = "ADJUSTMENT"


class GoalStatus(str, enum.Enum):
    """Goal status enumeration."""
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
