from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.estimate import Estimate
from app.middleware.auth import get_current_user
from app.schemas.user import UserCreate, UserResponse
import uuid
from datetime import datetime
from decimal import Decimal

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.firebase_uid == user_data.firebase_uid)
        ).first()
        
        if existing_user:
            # If user exists in DB but we are re-registering (e.g. partial failure), 
            # return existing user instead of error
            return existing_user
        
        # Create new user
        db_user = User(
            id=uuid.uuid4(),
            email=user_data.email,
            name=user_data.name,
            firebase_uid=user_data.firebase_uid,
            job_type=user_data.job_type,
            language=user_data.language,
            ai_tone=user_data.ai_tone,
            avg_income=user_data.avg_income,
            savings_target=user_data.savings_target,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_user)
        db.flush()  # Get ID without committing yet

        # SAVE ESTIMATES
        if user_data.expenses:
            current_month = datetime.utcnow().month
            current_year = datetime.utcnow().year
            
            for category, amount in user_data.expenses.items():
                # Only save if amount > 0
                if amount:
                    # Convert category to Title Case (food -> Food)
                    cat_name = category.capitalize()
                    
                    estimate = Estimate(
                        id=uuid.uuid4(),
                        user_id=db_user.id,
                        category=cat_name,
                        estimated_amount=Decimal(str(amount)),
                        month=current_month,
                        year=current_year,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(estimate)

        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except Exception as e:
        db.rollback()
        print(f"🔥 REGISTER ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Get current user information"""
    return current_user