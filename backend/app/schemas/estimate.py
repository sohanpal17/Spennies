from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from uuid import UUID

class EstimateBase(BaseModel):
    category: str
    estimated_amount: Decimal
    month: int
    year: int

class EstimateCreate(EstimateBase):
    pass

class EstimateUpdate(BaseModel):
    estimated_amount: Optional[Decimal] = None

class EstimateResponse(EstimateBase):
    id: UUID
    user_id: UUID
    
    class Config:
        from_attributes = True