from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

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