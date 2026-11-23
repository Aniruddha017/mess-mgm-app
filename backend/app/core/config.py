import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MessMate API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Secret key for JWT tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "messmate-super-secret-jwt-key-2026-btech-knit")
    # Shared secret key for HMAC QR tokens
    QR_HMAC_SECRET: str = os.getenv("QR_HMAC_SECRET", "messmate-hmac-qr-signing-secret-key-30s")
    
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    QR_EXPIRY_SECONDS: int = 60  # Short-lived rotating QR (30-60s)
    
    # Database URL: default to SQLite for instant local dev & testing, can be PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./messmate.db")
    
    class Config:
        case_sensitive = True

settings = Settings()

