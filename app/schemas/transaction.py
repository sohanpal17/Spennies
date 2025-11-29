from pydantic import BaseModel, Field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

class TransactionBase(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Transaction amount")
    category: str
    type: str
    description: str
    date: date
    source: str = 'manual'

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    category: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date] = None

class TransactionResponse(TransactionBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True