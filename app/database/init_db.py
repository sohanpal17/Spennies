from app.database.base import Base
from app.database.session import engine

# Import all models here to register them with Base
from app.models.user import User
from app.models.transaction import Transaction
from app.models.estimate import Estimate
from app.models.loan import Loan
from app.models.ai_insight import AIInsight

def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    init_db()