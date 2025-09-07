"""
AI Assistant and Chat API Routes
"""

from fastapi import APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
import json

from .auth import get_current_user
from ..services.ai_orchestrator import AIOrchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

# Request/Response Models
class ChatMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    message_type: Optional[str] = "text"

class SpacedRepetitionSession(BaseModel):
    target_duration_minutes: Optional[int] = 15
    subject_filter: Optional[str] = None
    difficulty_preference: Optional[str] = "adaptive"

class PerformanceRecord(BaseModel):
    card_id: str
    performance: float  # 0.0 to 1.0
    response_time_seconds: float
    confidence_level: Optional[float] = None

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"🔌 WebSocket connected for user {user_id}")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"🔌 WebSocket disconnected for user {user_id}")

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

@router.post("/chat")
async def chat_with_ai(
    message: ChatMessage,
    current_user: Dict = Depends(get_current_user)
):
    """Send message to AI assistant"""
    try:
        orchestrator = AIOrchestrator()
        
        response = await orchestrator.process_request(
            user_id=current_user['uid'],
            request_type="chat_message",
            request_data={
                "message": message.message,
                "context": message.context or {},
                "message_type": message.message_type
            }
        )
        
        return {
            "success": True,
            "response": response.get("response"),
            "confidence": response.get("confidence"),
            "suggested_actions": response.get("suggested_actions", []),
            "needs_resources": response.get("needs_resources", False)
        }
        
    except Exception as e:
        logger.error(f"❌ Chat failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {str(e)}"
        )

@router.websocket("/chat/ws/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time chat"""
    await manager.connect(websocket, user_id)
    orchestrator = AIOrchestrator()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Process with AI orchestrator
            response = await orchestrator.process_request(
                user_id=user_id,
                request_type="chat_message",
                request_data=message_data
            )
            
            # Send response back
            await websocket.send_text(json.dumps({
                "type": "ai_response",
                "data": response
            }))
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"❌ WebSocket error: {str(e)}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "Chat service temporarily unavailable"
        }))
        manager.disconnect(user_id)

@router.post("/spaced-repetition/session")
async def start_spaced_repetition_session(
    session_request: SpacedRepetitionSession,
    current_user: Dict = Depends(get_current_user)
):
    """Start a spaced repetition review session"""
    try:
        orchestrator = AIOrchestrator()
        
        session = await orchestrator.process_request(
            user_id=current_user['uid'],
            request_type="start_spaced_repetition",
            request_data={
                "target_duration_minutes": session_request.target_duration_minutes,
                "subject_filter": session_request.subject_filter,
                "difficulty_preference": session_request.difficulty_preference
            }
        )
        
        return {
            "success": True,
            "session_id": session.get("session_id"),
            "cards": session.get("cards", []),
            "estimated_duration": session.get("estimated_duration"),
            "total_due": session.get("total_due"),
            "session_type": session.get("session_type")
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to start spaced repetition: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start spaced repetition: {str(e)}"
        )

@router.post("/spaced-repetition/performance")
async def record_spaced_repetition_performance(
    performance: PerformanceRecord,
    current_user: Dict = Depends(get_current_user)
):
    """Record performance on spaced repetition card"""
    try:
        orchestrator = AIOrchestrator()
        
        result = await orchestrator.process_request(
            user_id=current_user['uid'],
            request_type="record_spaced_repetition_performance",
            request_data={
                "card_id": performance.card_id,
                "performance": performance.performance,
                "response_time_seconds": performance.response_time_seconds,
                "confidence_level": performance.confidence_level
            }
        )
        
        return {
            "success": True,
            "next_review_date": result.get("next_review_date"),
            "interval_days": result.get("interval_days"),
            "performance_category": result.get("performance_category"),
            "ease_factor": result.get("ease_factor")
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to record performance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record performance: {str(e)}"
        )

@router.get("/spaced-repetition/analytics")
async def get_spaced_repetition_analytics(
    days: int = 30,
    current_user: Dict = Depends(get_current_user)
):
    """Get spaced repetition analytics"""
    try:
        orchestrator = AIOrchestrator()
        
        analytics = await orchestrator.process_request(
            user_id=current_user['uid'],
            request_type="get_spaced_repetition_analytics",
            request_data={"days": days}
        )
        
        return analytics
        
    except Exception as e:
        logger.error(f"❌ Failed to get analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve spaced repetition analytics"
        )

@router.get("/engagement/monitor")
async def get_engagement_status(
    current_user: Dict = Depends(get_current_user)
):
    """Get current user engagement status"""
    try:
        orchestrator = AIOrchestrator()
        
        status = await orchestrator.process_request(
            user_id=current_user['uid'],
            request_type="check_engagement",
            request_data={}
        )
        
        return {
            "engagement_level": status.get("engagement_level"),
            "attention_score": status.get("attention_score"),
            "fatigue_level": status.get("fatigue_level"),
            "recommendations": status.get("recommendations", []),
            "suggested_break_time": status.get("suggested_break_time")
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get engagement status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve engagement status"
        )

@router.post("/feedback")
async def submit_ai_feedback(
    feedback_data: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """Submit feedback about AI responses"""
    try:
        # Log feedback for AI improvement
        logger.info(f"📝 AI Feedback from {current_user['uid']}: {feedback_data}")
        
        return {
            "success": True,
            "message": "Thank you for your feedback! It helps us improve."
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to submit feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit feedback"
        )
