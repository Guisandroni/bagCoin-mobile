"""Database models."""

# ruff: noqa: I001, RUF022 - Imports structured for Jinja2 template conditionals
from app.db.models.user import User
from app.db.models.conversation import Conversation, Message, ToolCall
from app.db.models.chat_file import ChatFile
from app.db.models.message_rating import MessageRating
from app.db.models.conversation_share import ConversationShare

# BagCoin models
from app.db.models.enums import TransactionType, UserStatus, GoalStatus
from app.db.models.phone_user import PhoneUser
from app.db.models.category import Category
from app.db.models.transaction import Transaction
from app.db.models.budget import Budget, BudgetItem
from app.db.models.goal import Goal
from app.db.models.report import Report
from app.db.models.phone_conversation import PhoneConversation
from app.db.models.agent_log import AgentLog
from app.db.models.credit_card import CreditCard
from app.db.models.account import Account
from app.db.models.integration_link_token import IntegrationLinkToken

__all__ = [
    "User",
    "Conversation",
    "Message",
    "ToolCall",
    "ChatFile",
    "MessageRating",
    "ConversationShare",
    # BagCoin models
    "TransactionType",
    "UserStatus",
    "GoalStatus",
    "PhoneUser",
    "Category",
    "Transaction",
    "Budget",
    "BudgetItem",
    "Goal",
    "Report",
    "PhoneConversation",
    "AgentLog",
    "CreditCard",
    "Account",
    "IntegrationLinkToken",
]
