from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.session import get_db
from app.models.estimate import Estimate
from app.models.user import User
from app.schemas.estimate import EstimateCreate, EstimateResponse, EstimateUpdate
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/estimates", tags=["Estimates"])

@router.post("/", response_model=EstimateResponse)
async def create_estimate(
    estimate: EstimateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update estimate for a category"""
    
    # Check if estimate already exists
    existing = db.query(Estimate).filter(
        Estimate.user_id == current_user.id,
        Estimate.category == estimate.category,
        Estimate.month == estimate.month,
        Estimate.year == estimate.year
    ).first()
    
    if existing:
        # Update existing
        existing.estimated_amount = estimate.estimated_amount
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new
    db_estimate = Estimate(
        id=uuid.uuid4(),
        user_id=current_user.id,
        **estimate.dict()
    )
    
    db.add(db_estimate)
    db.commit()
    db.refresh(db_estimate)
    
    return db_estimate

@router.get("/", response_model=List[EstimateResponse])
async def get_estimates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    month: int = None,
    year: int = None
):
    """Get all user estimates"""
    query = db.query(Estimate).filter(Estimate.user_id == current_user.id)
    
    if month:
        query = query.filter(Estimate.month == month)
    if year:
        query = query.filter(Estimate.year == year)
    
    estimates = query.all()
    return estimates

@router.put("/{estimate_id}", response_model=EstimateResponse)
async def update_estimate(
    estimate_id: str,
    estimate_update: EstimateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an estimate"""
    db_estimate = db.query(Estimate).filter(
        Estimate.id == estimate_id,
        Estimate.user_id == current_user.id
    ).first()
    
    if not db_estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
    
    for key, value in estimate_update.dict(exclude_unset=True).items():
        setattr(db_estimate, key, value)
    
    db.commit()
    db.refresh(db_estimate)
    
    return db_estimate