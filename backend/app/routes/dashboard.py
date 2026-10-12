from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from decimal import Decimal

from app.database.session import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard summary data"""
    
    today = date.today()
    month_start = date(today.year, today.month, 1)
    
    # Today's transactions
    today_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.date == today,
        Transaction.type == 'INCOME'
    ).scalar() or Decimal('0')
    
    today_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.date == today,
        Transaction.type == 'EXPENSE'
    ).scalar() or Decimal('0')
    
    # Monthly transactions
    monthly_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= month_start,
        Transaction.type == 'INCOME'
    ).scalar() or Decimal('0')
    
    monthly_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= month_start,
        Transaction.type == 'EXPENSE'
    ).scalar() or Decimal('0')
    
    # Calculate savings
    monthly_savings = monthly_income - monthly_expense
    savings_target = current_user.savings_target or Decimal('5000')
    savings_progress = min((float(monthly_savings) / float(savings_target)) * 100, 100) if savings_target > 0 else 0
    
    # Emergency fund
    emergency_fund = max(monthly_savings - savings_target, Decimal('0'))
    
    return {
        "today": {
            "income": float(today_income),
            "expense": float(today_expense)
        },
        "monthly": {
            "income": float(monthly_income),
            "expense": float(monthly_expense),
            "savings": float(monthly_savings)
        },
        "goals": {
            "savings_target": float(savings_target),
            "savings_progress": float(savings_progress),
            "emergency_fund": float(emergency_fund)
        }
    }

@router.get("/charts")
async def get_chart_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get data for charts"""
    
    # Last 7 days
    today = date.today()
    week_ago = today - timedelta(days=6)
    
    # Weekly data
    weekly_data = []
    for i in range(7):
        day = week_ago + timedelta(days=i)
        
        income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.date == day,
            Transaction.type == 'INCOME'
        ).scalar() or Decimal('0')
        
        expense = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.date == day,
            Transaction.type == 'EXPENSE'
        ).scalar() or Decimal('0')
        
        weekly_data.append({
            "date": day.strftime("%a"),
            "income": float(income),
            "expense": float(expense)
        })
    
    # Expense by category (this month)
    month_start = date(today.year, today.month, 1)
    
    category_data = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= month_start,
        Transaction.type == 'EXPENSE'
    ).group_by(Transaction.category).all()
    
    expense_breakdown = [
        {"name": cat, "value": float(total)}
        for cat, total in category_data
    ]
    
    return {
        "weekly": weekly_data,
        "expense_breakdown": expense_breakdown
    }