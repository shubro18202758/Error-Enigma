"""
Configuration settings for the EdTech platform
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # App Configuration
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = "error-404-6b343"
    FIREBASE_API_KEY: str = "AIzaSyAz_oD7ZTzoJqsJOc3wWOtzJZ94luR3si4"
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "../firebase-service-account.json"
    FIREBASE_SENDER_ID: Optional[str] = None
    
    # Database Configuration
    DATABASE_URL: str = "sqlite:///./edtech_platform.db"
    REDIS_URL: Optional[str] = None  # Make Redis optional for now
    
    # AI/ML Configuration
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: str = "AIzaSyDi1FCFBR56qtzLCxC5AcN0ZhzmB9NV2nk"
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Security & CORS
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Content Configuration
    CONTENT_STORAGE_PATH: str = "./content_library"
    MEDIA_STORAGE_PATH: str = "./media"
    VECTOR_DB_PATH: str = "./vector_db"
    
    # Microlearning Settings
    DEFAULT_MODULE_DURATION: int = 10  # minutes
    MAX_SESSION_TIME: int = 45  # minutes
    FATIGUE_THRESHOLD: float = 0.7
    
    # RAG Configuration
    VECTOR_DIMENSION: int = 384
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50
    
    # Proctoring Configuration
    FACE_DETECTION_CONFIDENCE: float = 0.8
    EMOTION_ANALYSIS_ENABLED: bool = True
    BEHAVIOR_MONITORING_ENABLED: bool = True
    
    # Gamification
    ACHIEVEMENT_POINTS_MULTIPLIER: int = 10
    STREAK_BONUS_MULTIPLIER: int = 2
    LEADERBOARD_SIZE: int = 100
    
    # External APIs
    YOUTUBE_API_KEY: Optional[str] = None
    SENDGRID_API_KEY: Optional[str] = None
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
