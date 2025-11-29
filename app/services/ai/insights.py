from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from decimal import Decimal
import json
import re
from app.models.user import User
from app.models.transaction import Transaction
from app.services.ai.gemini_client import generate_with_gemini

def generate_insights(user: User, db: Session) -> dict:
    """
    Generate SMART insights + Daily Tip for the user.
    Returns: { "insights": [...], "tip": "..." }
    """

    # helpers
    def fmt_money(x):
        try:
            return f"₹{int(Decimal(x)):,}"
        except Exception:
            return f"₹{x}"

    def safe_decimal(v):
        return v if isinstance(v, Decimal) else Decimal(str(v or 0))

    # month start
    month_start = date(date.today().year, date.today().month, 1)

    # totals
    monthly_income = safe_decimal(
        db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == user.id,
            Transaction.date >= month_start,
            Transaction.type == 'INCOME'
        ).scalar() or 0
    )

    monthly_expense = safe_decimal(
        db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == user.id,
            Transaction.date >= month_start,
            Transaction.type == 'EXPENSE'
        ).scalar() or 0
    )

    # category breakdown
    category_rows = db.query(
        Transaction.category,
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == user.id,
        Transaction.date >= month_start,
        Transaction.type == 'EXPENSE'
    ).group_by(Transaction.category).all()

    categories_text = ""
    for cat, amt in category_rows:
        amt_dec = safe_decimal(amt)
        categories_text += f"- {cat}: {fmt_money(amt_dec)}\n"
    if not categories_text:
        categories_text = "No category expenses recorded this month."

    # recent high-value expense
    high_value_txs = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.date >= month_start,
        Transaction.type == 'EXPENSE'
    ).order_by(Transaction.amount.desc()).limit(3).all()

    high_value_text = ""
    for t in high_value_txs:
        high_value_text += f"- {fmt_money(t.amount)} on {t.description or t.category}\n"
    if not high_value_text:
        high_value_text = "No high-value expenses recorded this month."

    # savings target
    savings_target = safe_decimal(getattr(user, "savings_target", 0) or 0)
    if savings_target <= 0 and monthly_income > 0:
        savings_target = (monthly_income * Decimal('0.2')).quantize(Decimal('1'))
    
    # CHECK FOR NEW USER (Force English as requested)
    if monthly_income == 0 and monthly_expense == 0:
        return {
            "insights": [{"type": "info", "message": "Welcome! Add your first income or expense to unlock personalized AI insights."}],
            "tip": "Start tracking daily small expenses."
        }

    # SETTINGS
    user_lang = getattr(user, 'language', 'en')
    user_tone = getattr(user, 'ai_tone', 'friendly')
    user_job = getattr(user, 'job_type', 'other')
    
    # You requested strict English for insights in this file specifically
    lang_instruction = "OUTPUT LANGUAGE: ENGLISH."

    tone_instruction = {
        'friendly': "Tone: Casual, warm, friend-like. Use emojis.",
        'motivational': "Tone: High-energy, coaching style. Push them to save more!",
        'professional': "Tone: Serious, advisory, objective. Minimal emojis."
    }.get(user_tone, "Tone: Helpful.")

    # JOB SPECIFIC INSTRUCTION
    job_instruction = {
        'driver': "User is a Driver (Uber/Ola/Delivery). Focus on fuel costs, vehicle maintenance, and daily earnings.",
        'freelancer': "User is a Freelancer. Focus on irregular income management and saving for lean months.",
        'student': "User is a Student. Focus on budget food, books, and low-cost entertainment.",
        'vendor': "User is a Shopkeeper/Vendor. Focus on inventory costs and daily cash flow.",
        'housewife': "User is a Homemaker. Focus on household budget optimization.",
        'other': "User has a general job."
    }.get(user_job, "User has a general job.")

    # Build Prompt
    prompt = f"""
    You are Spennies, a financial coach for gig workers in India.
    
    **CRITICAL INSTRUCTIONS:**
    1. **Language:** {lang_instruction}
    2. **Tone:** {tone_instruction}
    3. **Job Context:** {job_instruction} (Tailor advice to this job).
    4. **Mix:** Include 1 Warning, 1 Success, 1 Info/Observation.

    **INPUT DATA:**
    - Income: {fmt_money(monthly_income)}
    - Expenses: {fmt_money(monthly_expense)}
    - Savings: {fmt_money(monthly_income - monthly_expense)}
    - Goal: {fmt_money(savings_target)}

    **Category Breakdown:**
    {categories_text}

    **Top Expenses:**
    {high_value_text}

    **REQUIRED OUTPUT FORMAT (JSON):**
    {{
        "insights": [
            {{ "type": "warning", "message": "Start with a warning if applicable..." }},
            {{ "type": "success", "message": "Highlight a win..." }},
            {{ "type": "info", "message": "Observation about a pattern..." }}
        ],
        "tip": "A short, job-relevant tip (max 15 words)."
    }}
    """

    # Call LLM
    raw = ""
    try:
        raw = generate_with_gemini(prompt) 
    except Exception as e:
        print(f"Insight Gen Error: {e}")
        raw = ""

    # Parse Output
    result = None
    if raw:
        try:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                parsed = json.loads(match.group())
                if "insights" in parsed and "tip" in parsed:
                    parsed["insights"] = parsed["insights"][:3]
                    result = parsed
        except Exception:
            result = None

    # Fallback
    if not result:
        shortfall = (savings_target - (monthly_income - monthly_expense))
        fallback_msg = f"You are ₹{shortfall:,} away from goal." if shortfall > 0 else "You are on track!"
        
        result = {
            "insights": [
                {"type": "warning", "message": fallback_msg},
                {"type": "info", "message": "Track expenses daily."},
                {"type": "success", "message": "Great start!"}
            ],
            "tip": "Save small amounts daily to build a big safety net."
        }

    return result