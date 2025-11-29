from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    message: str
    language: str = 'en'

class ChatResponse(BaseModel):
    response: str
    action: Optional[str] = None  # 'transaction_added', 'query_answered', etc.
    data: Optional[dict] = None

class SMSParseRequest(BaseModel):
    sms_text: str

class SMSParseResponse(BaseModel):
    amount: float
    category: str
    type: str
    description: Optional[str] = None  # Make it optional to be safe
    merchant: Optional[str] = None
    confidence: float
    date: Optional[str] = None

class InsightResponse(BaseModel):
    insight_type: str
    message: str
    severity: str  # 'info', 'warning', 'success'