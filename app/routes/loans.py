from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from app.database.session import get_db
from app.models.loan import Loan
from app.models.user import User
from app.schemas.loan import LoanCreate, LoanResponse, LoanUpdate
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/loans", tags=["Loans"])

@router.post("/", response_model=LoanResponse)
async def create_loan(
    loan: LoanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new loan reminder"""
    db_loan = Loan(
        id=uuid.uuid4(),
        user_id=current_user.id,
        **loan.dict()
    )
    
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    
    return db_loan

@router.get("/", response_model=List[LoanResponse])
async def get_loans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    is_paid: bool = None
):
    """Get all user loans"""
    query = db.query(Loan).filter(Loan.user_id == current_user.id)
    
    if is_paid is not None:
        query = query.filter(Loan.is_paid == is_paid)
    
    loans = query.order_by(Loan.due_date).all()
    return loans

@router.put("/{loan_id}/paid", response_model=LoanResponse)
async def mark_loan_paid(
    loan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark loan as paid"""
    db_loan = db.query(Loan).filter(
        Loan.id == loan_id,
        Loan.user_id == current_user.id
    ).first()
    
    if not db_loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    db_loan.is_paid = True
    db_loan.paid_date = datetime.utcnow()
    
    db.commit()
    db.refresh(db_loan)
    
    return db_loan

@router.delete("/{loan_id}")
async def delete_loan(
    loan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a loan"""
    loan = db.query(Loan).filter(
        Loan.id == loan_id,
        Loan.user_id == current_user.id
    ).first()
    
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    db.delete(loan)
    db.commit()
    
    return {"message": "Loan deleted successfully"}