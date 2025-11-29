from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from decimal import Decimal
from app.models.user import User
from app.models.transaction import Transaction
from app.services.ai.gemini_client import generate_with_gemini

def forecast_monthly_savings(user: User, db: Session) -> dict:
    """Forecast end-of-month savings using AI"""
    
    today = date.today()
    month_start = date(today.year, today.month, 1)
    days_in_month = (date(today.year, today.month + 1, 1) - timedelta(days=1)).day if today.month < 12 else 31
    days_elapsed = today.day
    days_remaining = days_in_month - days_elapsed
    
    # Get current month data
    monthly_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user.id,
        Transaction.date >= month_start,
        Transaction.type == 'INCOME'
    ).scalar() or Decimal('0')
    
    monthly_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user.id,
        Transaction.date >= month_start,
        Transaction.type == 'EXPENSE'
    ).scalar() or Decimal('0')
    
    # Simple prediction (can be enhanced with ML)
    if days_elapsed > 0:
        daily_expense_avg = float(monthly_expense) / days_elapsed
        projected_expense = daily_expense_avg * days_in_month
        projected_savings = float(monthly_income) - projected_expense
    else:
        projected_savings = float(monthly_income)
    
    savings_target = float(user.savings_target or 5000)
    
    lang_instruction = {
        'en': 'Respond in English.',
        'hi': 'हिंदी में जवाब दें।',
        'mr': 'मराठीत उत्तर द्या।'
    }.get(user.language, 'Respond in English.')
    
    prompt = f"""
    You are a financial forecaster.
    
    Current situation:
    - Income so far: ₹{monthly_income}
    - Expenses so far: ₹{monthly_expense}
    - Days elapsed: {days_elapsed}/{days_in_month}
    - Projected end-of-month savings: ₹{projected_savings:.0f}
    - Savings goal: ₹{savings_target}
    
    {lang_instruction}
    
    Explain this forecast in 2-3 sentences. Be encouraging if on track, helpful if behind.
    Keep it under 150 characters.
    """
    
    explanation = generate_with_gemini(prompt)
    
    return {
        "projected_savings": round(projected_savings, 2),
        "savings_target": savings_target,
        "on_track": projected_savings >= savings_target,
        "explanation": explanation or "Keep tracking to get better predictions!"
    }