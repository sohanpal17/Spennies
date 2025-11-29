from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.loan import Loan
from app.models.estimate import Estimate
from app.models.ai_insight import AIInsight

from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserUpdate, UserResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/fcm-token")
async def update_fcm_token(
    fcm_token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's FCM token for push notifications"""
    current_user.fcm_token = fcm_token
    
    db.commit()
    
    return {"message": "FCM token updated successfully"}

@router.delete("/me/data")
async def delete_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete all user data (transactions, loans, etc.) but keep account"""
    try:
        # Delete all related records
        db.query(Transaction).filter(Transaction.user_id == current_user.id).delete()
        db.query(Loan).filter(Loan.user_id == current_user.id).delete()
        db.query(Estimate).filter(Estimate.user_id == current_user.id).delete()
        db.query(AIInsight).filter(AIInsight.user_id == current_user.id).delete()
        
        # Reset user stats
        current_user.avg_income = 0
        current_user.savings_target = 0
        
        db.commit()
        return {"message": "All data deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))