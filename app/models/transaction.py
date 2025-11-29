from sqlalchemy import Column, String, DECIMAL, Date, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database.base import Base

class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"

class TransactionSource(str, enum.Enum):
    MANUAL = "manual"
    SMS = "sms"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    amount = Column(DECIMAL(10, 2), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    type = Column(Enum(TransactionType), nullable=False, index=True)
    description = Column(String(500))
    date = Column(Date, nullable=False, index=True)
    source = Column(Enum(TransactionSource), default=TransactionSource.MANUAL)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="transactions")