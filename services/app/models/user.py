"""
User Models - Database models for user management
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from typing import Optional, List, Dict, Any

Base = declarative_base()


class User(Base):
    """User model for storing user information"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)  # Firebase UID
    email = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    
    # Profile Information
    learning_goals = Column(JSON, default=list)  # List of learning objectives
    preferred_subjects = Column(JSON, default=list)  # Preferred subject areas
    progress_level = Column(String, default="beginner")  # beginner, intermediate, advanced
    
    # Learning Statistics
    total_study_time = Column(Integer, default=0)  # Total study time in minutes
    streak_days = Column(Integer, default=0)  # Current learning streak
    total_sessions = Column(Integer, default=0)  # Total learning sessions
    
    # Engagement Metrics
    average_session_duration = Column(Float, default=0.0)  # Average session length in minutes
    completion_rate = Column(Float, default=0.0)  # Percentage of completed activities
    last_active = Column(DateTime, default=datetime.utcnow)
    
    # Personalization Data
    learning_style = Column(String, default="mixed")  # visual, auditory, kinesthetic, mixed
    difficulty_preference = Column(String, default="adaptive")  # easy, medium, hard, adaptive
    
    # Account Status
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert user object to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email": self.email,
            "display_name": self.display_name,
            "learning_goals": self.learning_goals or [],
            "preferred_subjects": self.preferred_subjects or [],
            "progress_level": self.progress_level,
            "total_study_time": self.total_study_time,
            "streak_days": self.streak_days,
            "total_sessions": self.total_sessions,
            "average_session_duration": self.average_session_duration,
            "completion_rate": self.completion_rate,
            "last_active": self.last_active.isoformat() if self.last_active else None,
            "learning_style": self.learning_style,
            "difficulty_preference": self.difficulty_preference,
            "is_active": self.is_active,
            "is_premium": self.is_premium,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "User":
        """Create user object from dictionary"""
        return cls(
            user_id=data.get("user_id"),
            email=data.get("email"),
            display_name=data.get("display_name"),
            learning_goals=data.get("learning_goals", []),
            preferred_subjects=data.get("preferred_subjects", []),
            progress_level=data.get("progress_level", "beginner"),
            total_study_time=data.get("total_study_time", 0),
            streak_days=data.get("streak_days", 0),
            learning_style=data.get("learning_style", "mixed"),
            difficulty_preference=data.get("difficulty_preference", "adaptive")
        )
