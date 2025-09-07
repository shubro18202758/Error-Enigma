"""
AI Orchestrator - Central Intelligence for Personalized Learning
Coordinates all AI services for adaptive, context-aware learning experiences
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import time

from app.core.config import settings
from app.core.logger import ai_logger
from app.ai_services.rag_engine import RAGEngine
from app.ai_services.adaptive_assessment import AdaptiveAssessmentEngine
from app.ai_services.engagement_monitor import EngagementMonitor
from app.ai_services.learning_path_generator import LearningPathGenerator
from app.ai_services.content_recommender import ContentRecommender
from app.ai_services.chat_agent import ChatAgent
from app.ai_services.spaced_repetition_engine import SpacedRepetitionEngine

logger = logging.getLogger(__name__)


class AIOrchestrator:
    """
    Central AI Orchestrator that coordinates all intelligent services
    for personalized microlearning experiences
    """
    
    def __init__(self):
        self.is_initialized = False
        self.services = {}
        
        # AI Service instances
        self.rag_engine: Optional[RAGEngine] = None
        self.assessment_engine: Optional[AdaptiveAssessmentEngine] = None
        self.engagement_monitor: Optional[EngagementMonitor] = None
        self.path_generator: Optional[LearningPathGenerator] = None
        self.content_recommender: Optional[ContentRecommender] = None
        self.chat_agent: Optional[ChatAgent] = None
        self.spaced_repetition: Optional[SpacedRepetitionEngine] = None
        
        # Context management
        self.user_contexts: Dict[str, Dict[str, Any]] = {}
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        
        logger.info("🧠 AI Orchestrator initialized")
    
    async def initialize(self):
        """Initialize all AI services"""
        try:
            logger.info("🚀 Initializing AI Orchestrator services...")
            
            # Initialize RAG Engine
            self.rag_engine = RAGEngine()
            await self.rag_engine.initialize()
            
            # Initialize Assessment Engine
            self.assessment_engine = AdaptiveAssessmentEngine()
            await self.assessment_engine.initialize()
            
            # Initialize Engagement Monitor
            self.engagement_monitor = EngagementMonitor()
            await self.engagement_monitor.initialize()
            
            # Initialize Learning Path Generator
            self.path_generator = LearningPathGenerator()
            await self.path_generator.initialize()
            
            # Initialize Content Recommender
            self.content_recommender = ContentRecommender()
            await self.content_recommender.initialize()
            
            # Initialize Chat Agent
            self.chat_agent = ChatAgent()
            await self.chat_agent.initialize()
            
            # Initialize Spaced Repetition Engine
            self.spaced_repetition = SpacedRepetitionEngine()
            await self.spaced_repetition.initialize()
            
            # Register services
            self.services = {
                "rag_engine": self.rag_engine,
                "assessment_engine": self.assessment_engine,
                "engagement_monitor": self.engagement_monitor,
                "path_generator": self.path_generator,
                "content_recommender": self.content_recommender,
                "chat_agent": self.chat_agent,
                "spaced_repetition": self.spaced_repetition
            }
            
            self.is_initialized = True
            logger.info("✅ AI Orchestrator fully initialized with all services")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize AI Orchestrator: {e}")
            raise
    
    async def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main processing method - routes requests to appropriate AI services
        """
        start_time = time.time()
        
        try:
            user_id = request.get("user_id")
            request_type = request.get("type", "general")
            message = request.get("message", "")
            context = request.get("context", {})
            
            if not user_id:
                raise ValueError("user_id is required")
            
            # Update user context
            await self._update_user_context(user_id, request)
            
            # Detect intent and route to appropriate service
            intent = await self._detect_intent(message, context)
            
            # Process based on intent
            response = await self._route_request(user_id, intent, request)
            
            # Log interaction
            processing_time = (time.time() - start_time) * 1000
            ai_logger.log_ai_request(user_id, request_type, processing_time)
            
            return {
                "success": True,
                "response": response,
                "intent": intent,
                "processing_time_ms": processing_time,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"AI Orchestrator processing error: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": (time.time() - start_time) * 1000
            }
    
    async def _detect_intent(self, message: str, context: Dict[str, Any]) -> str:
        """Detect user intent using NLP and context analysis"""
        try:
            # Use the chat agent for intent detection
            intent = await self.chat_agent.detect_intent(message, context)
            return intent
        except Exception as e:
            logger.error(f"Intent detection failed: {e}")
            return "general_query"
    
    async def _route_request(self, user_id: str, intent: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Route request to appropriate AI service based on intent"""
        
        message = request.get("message", "")
        context = request.get("context", {})
        
        # Assessment-related requests
        if intent in ["start_assessment", "adaptive_test", "skill_evaluation"]:
            return await self._handle_assessment_request(user_id, request)
        
        # Learning path requests
        elif intent in ["create_learning_path", "personalize_curriculum", "study_plan"]:
            return await self._handle_learning_path_request(user_id, request)
        
        # Content discovery and recommendations
        elif intent in ["find_content", "recommend_courses", "content_search"]:
            return await self._handle_content_request(user_id, request)
        
        # Chat and question answering
        elif intent in ["ask_question", "explain_concept", "get_help"]:
            return await self._handle_chat_request(user_id, message, context)
        
        # Progress and analytics
        elif intent in ["check_progress", "view_analytics", "performance_review"]:
            return await self._handle_analytics_request(user_id, request)
        
        # Spaced repetition and review
        elif intent in ["schedule_review", "practice_recall", "memory_reinforcement"]:
            return await self._handle_spaced_repetition_request(user_id, request)
        
        # Default: General chat
        else:
            return await self._handle_chat_request(user_id, message, context)
    
    async def _handle_assessment_request(self, user_id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle adaptive assessment requests"""
        try:
            context = request.get("context", {})
            subject = context.get("subject", "general")
            difficulty = context.get("difficulty", "adaptive")
            
            # Get user's current competency level
            user_context = self.user_contexts.get(user_id, {})
            
            # Generate adaptive assessment
            assessment = await self.assessment_engine.create_adaptive_assessment(
                user_id=user_id,
                subject=subject,
                difficulty=difficulty,
                user_context=user_context
            )
            
            return {
                "type": "adaptive_assessment",
                "assessment": assessment,
                "instructions": "This assessment adapts to your responses to accurately evaluate your knowledge level.",
                "estimated_time_minutes": assessment.get("estimated_duration", 15)
            }
            
        except Exception as e:
            logger.error(f"Assessment handling error: {e}")
            return {"error": "Failed to create assessment", "details": str(e)}
    
    async def _handle_learning_path_request(self, user_id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle learning path generation requests"""
        try:
            context = request.get("context", {})
            goals = context.get("goals", [])
            timeline = context.get("timeline_days", 30)
            
            # Get user profile and assessment data
            user_context = self.user_contexts.get(user_id, {})
            
            # Generate personalized learning path
            learning_path = await self.path_generator.generate_path(
                user_id=user_id,
                goals=goals,
                timeline_days=timeline,
                user_context=user_context
            )
            
            return {
                "type": "learning_path",
                "path": learning_path,
                "description": f"Personalized learning path for {', '.join(goals)}",
                "total_duration_days": timeline
            }
            
        except Exception as e:
            logger.error(f"Learning path handling error: {e}")
            return {"error": "Failed to generate learning path", "details": str(e)}
    
    async def _handle_content_request(self, user_id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle content discovery and recommendation requests"""
        try:
            message = request.get("message", "")
            context = request.get("context", {})
            
            # Get user preferences and history
            user_context = self.user_contexts.get(user_id, {})
            
            # Use RAG for intelligent content search
            search_results = await self.rag_engine.search_content(
                query=message,
                user_id=user_id,
                context=context
            )
            
            # Get personalized recommendations
            recommendations = await self.content_recommender.get_recommendations(
                user_id=user_id,
                user_context=user_context,
                query=message
            )
            
            return {
                "type": "content_discovery",
                "search_results": search_results,
                "recommendations": recommendations,
                "total_results": len(search_results) + len(recommendations)
            }
            
        except Exception as e:
            logger.error(f"Content request handling error: {e}")
            return {"error": "Failed to find content", "details": str(e)}
    
    async def _handle_chat_request(self, user_id: str, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general chat and Q&A requests"""
        try:
            # Get user context for personalization
            user_context = self.user_contexts.get(user_id, {})
            
            # Get AI response using RAG and chat agent
            response = await self.chat_agent.process_message(
                user_id=user_id,
                message=message,
                context={**context, **user_context}
            )
            
            # Check if additional resources are needed
            if response.get("needs_resources"):
                resources = await self.rag_engine.find_related_resources(
                    query=message,
                    user_id=user_id
                )
                response["resources"] = resources
            
            return {
                "type": "chat_response",
                "response": response,
                "personalized": True
            }
            
        except Exception as e:
            logger.error(f"Chat request handling error: {e}")
            return {"error": "Failed to process message", "details": str(e)}
    
    async def _handle_analytics_request(self, user_id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle progress and analytics requests"""
        try:
            # Get comprehensive user analytics
            user_context = self.user_contexts.get(user_id, {})
            
            # Generate analytics report
            analytics = await self._generate_analytics_report(user_id, user_context)
            
            # Check for engagement issues
            engagement_analysis = await self.engagement_monitor.analyze_user_engagement(
                user_id=user_id,
                recent_activity=user_context.get("recent_activity", [])
            )
            
            return {
                "type": "analytics_report",
                "analytics": analytics,
                "engagement_analysis": engagement_analysis,
                "recommendations": engagement_analysis.get("recommendations", [])
            }
            
        except Exception as e:
            logger.error(f"Analytics request handling error: {e}")
            return {"error": "Failed to generate analytics", "details": str(e)}
    
    async def _handle_spaced_repetition_request(self, user_id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle spaced repetition and review requests"""
        try:
            # Get items due for review
            review_items = await self.spaced_repetition.get_due_reviews(user_id)
            
            # Get optimal review schedule
            schedule = await self.spaced_repetition.generate_review_schedule(
                user_id=user_id,
                days_ahead=7
            )
            
            return {
                "type": "spaced_repetition",
                "due_reviews": review_items,
                "upcoming_schedule": schedule,
                "total_due": len(review_items)
            }
            
        except Exception as e:
            logger.error(f"Spaced repetition handling error: {e}")
            return {"error": "Failed to generate review schedule", "details": str(e)}
    
    async def _update_user_context(self, user_id: str, request: Dict[str, Any]):
        """Update user context with current request"""
        if user_id not in self.user_contexts:
            self.user_contexts[user_id] = {
                "session_start": datetime.utcnow(),
                "interactions": [],
                "preferences": {},
                "recent_activity": []
            }
        
        # Add current interaction
        self.user_contexts[user_id]["interactions"].append({
            "timestamp": datetime.utcnow(),
            "request": request,
            "type": request.get("type", "unknown")
        })
        
        # Limit context history
        if len(self.user_contexts[user_id]["interactions"]) > 100:
            self.user_contexts[user_id]["interactions"] = \
                self.user_contexts[user_id]["interactions"][-50:]
    
    async def _generate_analytics_report(self, user_id: str, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive analytics report"""
        try:
            interactions = user_context.get("interactions", [])
            
            # Basic metrics
            total_interactions = len(interactions)
            session_duration = datetime.utcnow() - user_context.get("session_start", datetime.utcnow())
            
            # Interaction type breakdown
            interaction_types = {}
            for interaction in interactions:
                itype = interaction.get("type", "unknown")
                interaction_types[itype] = interaction_types.get(itype, 0) + 1
            
            return {
                "user_id": user_id,
                "session_duration_minutes": session_duration.total_seconds() / 60,
                "total_interactions": total_interactions,
                "interaction_breakdown": interaction_types,
                "engagement_level": "high" if total_interactions > 10 else "moderate",
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Analytics generation error: {e}")
            return {"error": "Failed to generate analytics"}
    
    async def log_interaction(self, request: Dict[str, Any], response: Dict[str, Any]):
        """Log interaction for analytics"""
        try:
            user_id = request.get("user_id")
            if user_id:
                ai_logger.log_user_interaction(
                    user_id=user_id,
                    action=request.get("type", "unknown"),
                    details={
                        "success": response.get("success", False),
                        "intent": response.get("intent"),
                        "processing_time": response.get("processing_time_ms")
                    }
                )
        except Exception as e:
            logger.error(f"Interaction logging error: {e}")
    
    def is_healthy(self) -> bool:
        """Check if orchestrator and all services are healthy"""
        try:
            if not self.is_initialized:
                return False
            
            # Check all services
            for service_name, service in self.services.items():
                if service and hasattr(service, 'is_healthy'):
                    if not service.is_healthy():
                        logger.warning(f"Service {service_name} is unhealthy")
                        return False
            
            return True
        except Exception as e:
            logger.error(f"Health check error: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup resources and stop services"""
        try:
            logger.info("🔄 Cleaning up AI Orchestrator...")
            
            # Cleanup all services
            for service_name, service in self.services.items():
                if service and hasattr(service, 'cleanup'):
                    await service.cleanup()
                    logger.info(f"✅ {service_name} cleaned up")
            
            self.is_initialized = False
            logger.info("✅ AI Orchestrator cleanup complete")
            
        except Exception as e:
            logger.error(f"Cleanup error: {e}")
