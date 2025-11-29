from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.base import Base
from app.database.session import engine

# Import models so SQLAlchemy knows about them
from app.models.user import User
from app.models.transaction import Transaction
from app.models.estimate import Estimate
from app.models.loan import Loan
from app.models.ai_insight import AIInsight

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Spennies API",
    description="AI-powered financial companion for gig workers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes import auth, users, transactions, estimates, loans, dashboard, ai

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(estimates.router)
app.include_router(loans.router)
app.include_router(dashboard.router)
app.include_router(ai.router)

@app.get("/")
async def root():
    return {"message": "Spennies API is running! 🚀"}