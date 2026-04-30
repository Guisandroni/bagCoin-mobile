from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class SourceFormat(str, Enum):
    TEXT = "text"
    AUDIO = "audio"
    IMAGE = "image"
    DOCUMENT = "document"

class IntentType(str, Enum):
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
    UNKNOWN = "unknown"

class WebhookPayload(BaseModel):
    phone_number: str
    message: str
    type: str = "chat"
    timestamp: int
    hasMedia: bool = False
    media: Optional[Dict[str, Any]] = None
    raw_data: Optional[Dict[str, Any]] = None

class WhatsAppResponse(BaseModel):
    reply: str
    document: Optional[Dict[str, Any]] = None
    actions: Optional[List[Dict[str, Any]]] = None

class ExtractedTransaction(BaseModel):
    type: str
    amount: Optional[float] = None
    currency: str = "BRL"
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0, default=0.8)
    raw_text: Optional[str] = None

class QueryResult(BaseModel):
    sql: Optional[str] = None
    results: Optional[List[Dict[str, Any]]] = None
    summary: Optional[str] = None
    error: Optional[str] = None

class ReportRequest(BaseModel):
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    category_id: Optional[int] = None

class AgentState(BaseModel):
    phone_number: str
    user_id: Optional[int] = None
    message: str
    intent: Optional[IntentType] = None
    extracted_data: Optional[Dict[str, Any]] = None
    query_result: Optional[QueryResult] = None
    report_path: Optional[str] = None
    response: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None
