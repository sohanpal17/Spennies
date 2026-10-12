from sqlalchemy import Column, String, DECIMAL, Date, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database.base import Base

class Loan(Base):
    __tablename__ = "loans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    lender_name = Column(String(255), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    purpose = Column(String(500))
    
    date_taken = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    
    interest_rate = Column(DECIMAL(5, 2), default=0)
    reminder_days = Column(Integer, default=3)
    
    is_paid = Column(Boolean, default=False, index=True)
    paid_date = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="loans")