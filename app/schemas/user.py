from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    email: str
    name: str
    job_type: Optional[str] = None
    language: str = 'en'
    ai_tone: str = 'friendly'
    avg_income: Optional[Decimal] = None
    savings_target: Optional[Decimal] = None
    
class UserCreate(UserBase):
    firebase_uid: str
    expenses: Optional[dict] = None 
class UserUpdate(BaseModel):
    name: Optional[str] = None
    job_type: Optional[str] = None
    language: Optional[str] = None
    ai_tone: Optional[str] = None
    avg_income: Optional[Decimal] = None
    savings_target: Optional[Decimal] = None
    fcm_token: Optional[str] = None

class UserResponse(UserBase):
    id: UUID  # Changed from str to UUID
    firebase_uid: str
    fcm_token: Optional[str] = None
    created_at: datetime  # Changed from str to datetime
    savings_target: Optional[Decimal] = None
    class Config:
        from_attributes = True