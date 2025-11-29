from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

class LoanBase(BaseModel):
    lender_name: str
    amount: Decimal
    purpose: Optional[str] = None
    date_taken: date
    due_date: date
    interest_rate: Decimal = Decimal('0')
    reminder_days: int = 3

class LoanCreate(LoanBase):
    pass

class LoanUpdate(BaseModel):
    is_paid: Optional[bool] = None
    paid_date: Optional[str] = None

class LoanResponse(LoanBase):
    id: UUID
    user_id: UUID
    is_paid: bool
    paid_date: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True