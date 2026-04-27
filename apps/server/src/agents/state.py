from typing import Annotated, List, TypedDict, Union, Optional
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel

class TransactionExtraction(BaseModel):
    amount: float
    description: str
    category: str
    is_expense: bool = True
    date: Optional[str] = None

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    extracted_data: Optional[TransactionExtraction]
    query_result: Optional[str]
    intent: Optional[str]
    user_id: Optional[int]
    whatsapp_number: str
    file_bytes: Optional[bytes]
    file_type: Optional[str]
    report_pdf_bytes: Optional[bytes]
    sources: Optional[List[str]]
    processed_transactions: Optional[List[TransactionExtraction]]
    pushname: Optional[str]
    is_group: bool
    # File upload flow control
    awaiting_file_type: bool
    pending_file_bytes: Optional[bytes]
    pending_file_type: Optional[str]
    # Budget flow control
    awaiting_budget_month: bool
    pending_budget_category: Optional[str]
    pending_budget_amount: Optional[float]
    # Fund flow control
    awaiting_fund_field: Optional[str]
    pending_fund: Optional[dict]
    # General conversational context
    last_intent: Optional[str]
    last_action: Optional[str]
