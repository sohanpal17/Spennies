from sqlalchemy import Column, String, Integer, DECIMAL, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    firebase_uid = Column(String(255), unique=True, nullable=False, index=True)
    
    # Profile
    job_type = Column(String(50))
    language = Column(String(10), default='en')
    ai_tone = Column(String(50), default='friendly')
    
    # Financial info
    avg_income = Column(DECIMAL(10, 2))
    savings_target = Column(DECIMAL(10, 2))
    
    # FCM Token
    fcm_token = Column(String(255))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (Use strings for class names)
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    estimates = relationship("Estimate", back_populates="user", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    insights = relationship("AIInsight", back_populates="user", cascade="all, delete-orphan")