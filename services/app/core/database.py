"""
Database configuration and models
"""

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Float, Boolean, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.config import settings

# Database engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Database Models
class User(Base):
    """User model for authentication and profile management"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    firebase_uid = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    profile_image_url = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Learning preferences
    learning_style = Column(String)  # visual, auditory, kinesthetic
    difficulty_preference = Column(String)  # beginner, intermediate, advanced
    time_preference = Column(Integer)  # minutes per session
    goals = Column(JSON)  # List of learning goals
    
    # Relationships
    learning_sessions = relationship("LearningSession", back_populates="user")
    assessments = relationship("AssessmentSession", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")
    analytics = relationship("UserAnalytics", back_populates="user")


class LearningSession(Base):
    """Individual learning sessions"""
    __tablename__ = "learning_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    content_id = Column(String)
    session_type = Column(String)  # microlearning, assessment, review
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    duration_minutes = Column(Integer)
    completion_percentage = Column(Float, default=0.0)
    engagement_score = Column(Float)
    fatigue_indicators = Column(JSON)
    interactions = Column(JSON)  # Detailed interaction data
    
    # Relationships
    user = relationship("User", back_populates="learning_sessions")


class AssessmentSession(Base):
    """Adaptive assessment sessions"""
    __tablename__ = "assessment_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    assessment_type = Column(String)  # pre_assessment, adaptive, final
    subject_area = Column(String)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    total_questions = Column(Integer)
    correct_answers = Column(Integer)
    final_score = Column(Float)
    ability_estimate = Column(Float)  # IRT-based ability estimate
    competency_map = Column(JSON)  # Detailed competency breakdown
    adaptive_path = Column(JSON)  # Questions asked and responses
    
    # Relationships
    user = relationship("User", back_populates="assessments")


class Content(Base):
    """Content repository"""
    __tablename__ = "content"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, index=True)
    description = Column(Text)
    content_type = Column(String)  # video, text, interactive, assessment
    subject_area = Column(String)
    difficulty_level = Column(String)
    duration_minutes = Column(Integer)
    prerequisites = Column(JSON)  # List of prerequisite content IDs
    learning_objectives = Column(JSON)
    content_url = Column(String)
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Analytics
    view_count = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)


class UserAchievement(Base):
    """User achievements and gamification"""
    __tablename__ = "user_achievements"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    achievement_type = Column(String)
    achievement_name = Column(String)
    description = Column(Text)
    points_earned = Column(Integer)
    earned_at = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON)
    
    # Relationships
    user = relationship("User", back_populates="achievements")


class UserAnalytics(Base):
    """Comprehensive user analytics"""
    __tablename__ = "user_analytics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    
    # Learning metrics
    total_study_time = Column(Integer, default=0)  # minutes
    sessions_completed = Column(Integer, default=0)
    average_session_duration = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    
    # Engagement metrics
    engagement_score = Column(Float, default=0.0)
    fatigue_level = Column(Float, default=0.0)
    interaction_frequency = Column(Float, default=0.0)
    
    # Performance metrics
    accuracy_rate = Column(Float, default=0.0)
    improvement_rate = Column(Float, default=0.0)
    skill_progression = Column(JSON)
    
    # Behavioral patterns
    preferred_study_times = Column(JSON)
    learning_velocity = Column(Float, default=0.0)
    retention_score = Column(Float, default=0.0)
    
    # Relationships
    user = relationship("User", back_populates="analytics")


class SpacedRepetition(Base):
    """Spaced repetition scheduling"""
    __tablename__ = "spaced_repetition"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    content_id = Column(String, ForeignKey("content.id"))
    
    # Spaced repetition algorithm data
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=1)
    repetitions = Column(Integer, default=0)
    next_review_date = Column(DateTime)
    last_reviewed = Column(DateTime)
    
    # Performance tracking
    success_rate = Column(Float, default=0.0)
    difficulty_rating = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LearningPath(Base):
    """Personalized learning paths"""
    __tablename__ = "learning_paths"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String)
    description = Column(Text)
    
    # Path configuration
    target_competencies = Column(JSON)
    estimated_duration_days = Column(Integer)
    difficulty_level = Column(String)
    
    # Progress tracking
    current_step = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    
    # Adaptive elements
    path_structure = Column(JSON)  # Ordered list of content and assessments
    adaptive_rules = Column(JSON)  # Rules for path modification
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ChatHistory(Base):
    """AI chat interaction history"""
    __tablename__ = "chat_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    session_id = Column(String)
    
    # Message data
    user_message = Column(Text)
    ai_response = Column(Text)
    context_data = Column(JSON)
    intent_classification = Column(String)
    
    # Metadata
    response_time_ms = Column(Integer)
    satisfaction_rating = Column(Integer)  # 1-5 scale
    
    timestamp = Column(DateTime, default=datetime.utcnow)


# Database dependency
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
