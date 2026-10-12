from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str
    
    # AI
    GEMINI_API_KEY: str
    
    # FCM
    FCM_SERVER_KEY: str = ""
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    
    # App
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return ["*"]
    
    class Config:
        env_file = ".env"

settings = Settings()