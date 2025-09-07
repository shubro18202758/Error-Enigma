"""
Spaced Repetition Engine - Scientifically Optimized Memory Consolidation
"""

import asyncio
import logging
from typing import Dict, Any, List, Tuple
from datetime import datetime, timedelta
import math

logger = logging.getLogger(__name__)


class SpacedRepetitionEngine:
    """Advanced spaced repetition engine using SuperMemo 2 algorithm with modern optimizations"""
    
    def __init__(self):
        self.is_initialized = False
        self.minimum_interval = 1  # Minimum days between reviews
        self.maximum_interval = 365  # Maximum days between reviews
        self.ease_factor_bonus = 0.15  # Bonus for correct answers
        self.ease_factor_penalty = 0.20  # Penalty for incorrect answers
    
    async def initialize(self):
        """Initialize spaced repetition engine"""
        self.is_initialized = True
        logger.info("Spaced Repetition Engine initialized")
    
    def calculate_next_review(self, 
                            card_id: str,
                            performance: float,  # 0.0 to 1.0
                            current_interval: int = 1,
                            repetition_count: int = 0,
                            ease_factor: float = 2.5) -> Tuple[int, float, datetime]:
        """
        Calculate next review date using modified SuperMemo 2 algorithm
        
        Args:
            card_id: Unique identifier for the learning card
            performance: How well user performed (0.0 = failure, 1.0 = perfect)
            current_interval: Days since last review
            repetition_count: Number of successful repetitions
            ease_factor: Difficulty multiplier (higher = easier)
            
        Returns:
            Tuple of (next_interval_days, new_ease_factor, next_review_date)
        """
        
        # Performance threshold for success (3 out of 5 in SuperMemo scale)
        success_threshold = 0.6
        
        if performance >= success_threshold:
            # Successful recall - increase interval
            repetition_count += 1
            
            if repetition_count == 1:
                next_interval = 1
            elif repetition_count == 2:
                next_interval = 6
            else:
                next_interval = max(1, round(current_interval * ease_factor))
            
            # Update ease factor based on performance
            performance_bonus = (performance - success_threshold) * self.ease_factor_bonus
            ease_factor += performance_bonus
            
        else:
            # Failed recall - reset to beginning but keep some progress
            repetition_count = 0
            next_interval = 1
            
            # Decrease ease factor for difficulty
            performance_penalty = (success_threshold - performance) * self.ease_factor_penalty
            ease_factor = max(1.3, ease_factor - performance_penalty)
        
        # Apply bounds
        next_interval = max(self.minimum_interval, min(self.maximum_interval, next_interval))
        ease_factor = max(1.3, min(3.0, ease_factor))
        
        # Calculate next review date
        next_review_date = datetime.now() + timedelta(days=next_interval)
        
        logger.info(f"📅 Card {card_id}: Next review in {next_interval} days (ease: {ease_factor:.2f})")
        
        return next_interval, ease_factor, next_review_date
    
    async def get_due_cards(self, user_id: str, subject_id: str = None) -> List[Dict[str, Any]]:
        """Get cards due for review"""
        # Mock implementation - would query database
        return [
            {
                "card_id": "card_123",
                "content": "What is machine learning?",
                "subject_id": "ml_basics",
                "due_date": datetime.now() - timedelta(hours=2),
                "repetition_count": 3,
                "ease_factor": 2.3,
                "last_interval": 7
            }
        ]
    
    async def schedule_review_session(self, user_id: str, target_duration_minutes: int = 15) -> Dict[str, Any]:
        """Create optimized review session"""
        due_cards = await self.get_due_cards(user_id)
        
        # Prioritize cards by urgency and difficulty
        prioritized_cards = sorted(due_cards, key=lambda x: (
            (datetime.now() - x['due_date']).total_seconds(),  # Urgency
            1.0 / x['ease_factor']  # Difficulty (lower ease = higher priority)
        ), reverse=True)
        
        # Select cards for session duration
        session_cards = prioritized_cards[:10]  # Max 10 cards per session
        
        return {
            "session_id": f"session_{user_id}_{datetime.now().timestamp()}",
            "cards": session_cards,
            "estimated_duration": len(session_cards) * 2,  # 2 minutes per card
            "total_due": len(due_cards),
            "session_type": "spaced_repetition"
        }
    
    async def record_performance(self, user_id: str, card_id: str, performance: float, 
                               response_time_seconds: float) -> Dict[str, Any]:
        """Record user performance and update scheduling"""
        
        # Get current card data (mock)
        current_interval = 7
        repetition_count = 3
        ease_factor = 2.3
        
        # Calculate next review
        next_interval, new_ease_factor, next_review_date = self.calculate_next_review(
            card_id, performance, current_interval, repetition_count, ease_factor
        )
        
        # Update database (mock)
        update_data = {
            "last_reviewed": datetime.now(),
            "next_review": next_review_date,
            "interval_days": next_interval,
            "ease_factor": new_ease_factor,
            "repetition_count": repetition_count + (1 if performance >= 0.6 else 0),
            "performance_history": [performance],
            "response_time": response_time_seconds
        }
        
        logger.info(f"📊 Performance recorded for card {card_id}: {performance:.2f}")
        
        return {
            "success": True,
            "next_review_date": next_review_date,
            "interval_days": next_interval,
            "ease_factor": new_ease_factor,
            "performance_category": self._categorize_performance(performance)
        }
    
    def _categorize_performance(self, performance: float) -> str:
        """Categorize performance level"""
        if performance >= 0.9:
            return "excellent"
        elif performance >= 0.7:
            return "good"
        elif performance >= 0.6:
            return "satisfactory"
        elif performance >= 0.4:
            return "needs_improvement"
        else:
            return "difficult"
    
    async def get_retention_analytics(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get retention analytics for user"""
        return {
            "total_cards": 150,
            "cards_mastered": 45,
            "average_retention": 0.78,
            "study_streak": 12,
            "cards_due_today": 8,
            "estimated_study_time": 16,  # minutes
            "retention_trend": "improving",
            "difficulty_breakdown": {
                "easy": 60,
                "medium": 70,
                "hard": 20
            }
        }
    
    def is_healthy(self) -> bool:
        return self.is_initialized
    
    async def cleanup(self):
        logger.info("✅ Spaced Repetition Engine cleanup complete")
