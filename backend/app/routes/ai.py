from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from decimal import Decimal
import uuid

from app.database.session import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.loan import Loan
from app.models.estimate import Estimate
from app.schemas.ai import ChatRequest, ChatResponse, SMSParseRequest, SMSParseResponse
from app.middleware.auth import get_current_user
from app.services.ai.categorizer import categorize_transaction
from app.services.ai.sms_parser import parse_sms_transaction
from app.services.ai.chatbot import chat_with_ai, parse_natural_language_transaction

router = APIRouter(prefix="/api/ai", tags=["AI Services"])

@router.post("/categorize")
async def categorize(
    description: str,
    amount: float,
    current_user: User = Depends(get_current_user)
):
    result = categorize_transaction(description, amount, current_user.language)
    return result

@router.post("/parse-sms", response_model=SMSParseResponse)
async def parse_sms(
    request: SMSParseRequest,
    current_user: User = Depends(get_current_user)
):
    result = parse_sms_transaction(request.sms_text)
    
    if 'description' not in result:
        result['description'] = f"Payment at {result.get('merchant', 'Unknown')}"

    tx_date = date.today()
    if result.get('date'):
        try:
            tx_date = datetime.strptime(result['date'], '%Y-%m-%d').date()
        except:
            pass

    if result.get('confidence', 0) > 0.7 and result.get('amount', 0) > 0:
        db_transaction = Transaction(
            id=uuid.uuid4(),
            user_id=current_user.id,
            amount=Decimal(str(result['amount'])),
            category=result['category'],
            type='INCOME' if result['type'] == 'credit' else 'EXPENSE',
            description=result['description'],
            date=tx_date,
            source='SMS'
        )
        
        db = next(get_db())
        db.add(db_transaction)
        db.commit()
    
    return result

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with AI assistant"""
    
    parsed = parse_natural_language_transaction(request.message, request.language)
    action = parsed.get('action', 'chat')
    
    # --- CASE 1: ADD TRANSACTION ---
    if action == 'add' and parsed.get('amount', 0) > 0:
        category_result = categorize_transaction(
            parsed.get('description', 'Expense'), 
            parsed['amount'], 
            request.language
        )
        
        tx_date = date.today()
        if parsed.get('date'):
            try:
                tx_date = datetime.strptime(parsed['date'], '%Y-%m-%d').date()
            except ValueError:
                pass

        db_transaction = Transaction(
            id=uuid.uuid4(),
            user_id=current_user.id,
            amount=Decimal(str(parsed['amount'])),
            category=category_result['category'],
            type=parsed.get('type', 'expense').upper(),
            description=parsed.get('description', 'AI Added'),
            date=tx_date,
            source='MANUAL'
        )
        
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        
        type_text = 'income' if parsed.get('type') == 'income' else 'expense'
        response_text = f"✅ Added {type_text} of ₹{parsed['amount']} for {parsed.get('description', 'item')} in {category_result['category']} on {tx_date}."
        
        return ChatResponse(
            response=response_text,
            action="transaction_added",
            data={"transaction_id": str(db_transaction.id)}
        )

    # --- CASE 2: DELETE TRANSACTION ---
    elif action == 'delete':
        query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
        
        if parsed.get('amount'):
            query = query.filter(Transaction.amount == parsed['amount'])
        if parsed.get('description'):
            query = query.filter(Transaction.description.ilike(f"%{parsed['description']}%"))
            
        tx_to_delete = query.order_by(Transaction.date.desc(), Transaction.created_at.desc()).first()
        
        if tx_to_delete:
            desc = tx_to_delete.description
            amt = tx_to_delete.amount
            db.delete(tx_to_delete)
            db.commit()
            return ChatResponse(
                response=f"🗑 Deleted transaction: {desc} (₹{amt})",
                action="transaction_deleted",
                data={"transaction_id": str(tx_to_delete.id)}
            )
        else:
            return ChatResponse(
                response="❌ I couldn't find a matching transaction to delete.",
                action="none"
            )

    # --- CASE 3: ADD LOAN ---
    elif action == 'add_loan':
        try:
            due_date = datetime.strptime(parsed.get('due_date'), '%Y-%m-%d').date()
        except:
            due_date = date.today() + timedelta(days=7)

        db_loan = Loan(
            id=uuid.uuid4(),
            user_id=current_user.id,
            lender_name=parsed.get('lender', 'Unknown'),
            amount=Decimal(str(parsed.get('amount', 0))),
            date_taken=date.today(),
            due_date=due_date,
            is_paid=False,
            interest_rate=0,
            reminder_days=3
        )
        db.add(db_loan)
        db.commit()
        
        return ChatResponse(
            response=f"✅ Added loan reminder: Pay ₹{parsed.get('amount')} to {parsed.get('lender')} by {due_date}.",
            action="loan_updated"
        )

    # --- CASE 4: PAY LOAN ---
    elif action == 'pay_loan':
        query = db.query(Loan).filter(Loan.user_id == current_user.id, Loan.is_paid == False)
        if parsed.get('lender'):
            query = query.filter(Loan.lender_name.ilike(f"%{parsed['lender']}%"))
            
        loan = query.first()
        if loan:
            loan.is_paid = True
            loan.paid_date = datetime.utcnow()
            db.commit()
            return ChatResponse(
                response=f"🎉 Great! Marked loan from {loan.lender_name} as paid.",
                action="loan_updated"
            )
        else:
            return ChatResponse(response="❌ No active loan found matching that description.")

    # --- CASE 5: DELETE LOAN ---
    elif action == 'delete_loan':
        query = db.query(Loan).filter(Loan.user_id == current_user.id)
        if parsed.get('lender'):
            query = query.filter(Loan.lender_name.ilike(f"%{parsed['lender']}%"))
            
        loan = query.first()
        if loan:
            db.delete(loan)
            db.commit()
            return ChatResponse(
                response=f"🗑 Deleted loan record for {loan.lender_name}.",
                action="loan_updated"
            )
        else:
            return ChatResponse(response="❌ Loan not found.")

    # --- CASE 6: CHAT QUESTION (RAG) ---
    else:
        month_start = date(date.today().year, date.today().month, 1)
        
        # Gather Data
        monthly_income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id, Transaction.date >= month_start, Transaction.type == 'INCOME'
        ).scalar() or Decimal('0')
        
        monthly_expense = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id, Transaction.date >= month_start, Transaction.type == 'EXPENSE'
        ).scalar() or Decimal('0')
        
        # Category Breakdown
        cat_data = db.query(Transaction.category, func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id, Transaction.date >= month_start, Transaction.type == 'EXPENSE'
        ).group_by(Transaction.category).all()
        category_text = "\n".join([f"- {cat}: ₹{amt}" for cat, amt in cat_data]) or "No expenses yet."

        # Budget Limits
        estimates = db.query(Estimate).filter(Estimate.user_id == current_user.id).all()
        budget_text = "\n".join([f"- {e.category}: Limit ₹{e.estimated_amount}" for e in estimates])

        # Recent Transactions
        recent_txs = db.query(Transaction).filter(
            Transaction.user_id == current_user.id
        ).order_by(Transaction.date.desc()).limit(10).all()
        recent_tx_text = "\n".join([f"- {t.date}: {t.description} (₹{t.amount})" for t in recent_txs]) or "No recent transactions."

        # Active Loans
        loans = db.query(Loan).filter(Loan.user_id == current_user.id, Loan.is_paid == False).all()
        loan_text = "\n".join([f"- ₹{l.amount} to {l.lender_name} due {l.due_date}" for l in loans]) or "No active loans."
        
        user_context = {
            'name': current_user.name,
            'job_type': current_user.job_type,
            'ai_tone': current_user.ai_tone,
            'savings_target': float(current_user.savings_target or 5000),
            'monthly_income': float(monthly_income),
            'monthly_expense': float(monthly_expense),
            'monthly_savings': float(monthly_income - monthly_expense),
            'categories': category_text,
            'budget_limits': budget_text,
            'recent_transactions': recent_tx_text,
            'loans': loan_text
            
        }
        
        ai_response = chat_with_ai(
            request.message, 
            user_context, 
            request.language, 
            tone=current_user.ai_tone
        )
        
        return ChatResponse(response=ai_response, action="query_answered")

@router.get("/insights")
async def get_insights(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.ai.insights import generate_insights
    data = generate_insights(current_user, db)
    
    if isinstance(data, list):
        return {"insights": data, "tip": "Save small amounts daily."}
        
    return data

@router.get("/forecast")
async def get_forecast(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.ai.forecaster import forecast_monthly_savings
    forecast = forecast_monthly_savings(current_user, db)
    return forecast