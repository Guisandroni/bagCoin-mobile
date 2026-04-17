from typing import Annotated, List, TypedDict, Union, Optional
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel

class TransactionExtraction(BaseModel):
    amount: float
    description: str
    category: str
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
