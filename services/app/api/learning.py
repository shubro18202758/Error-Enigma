"""
Learning and Assessment API Routes
"""

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging

from .auth import get_current_user
from ..services.ai_orchestrator import AIOrchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/learning", tags=["Learning & Assessment"])

# Request/Response Models
class AssessmentRequest(BaseModel):
    subject: str
    difficulty_level: Optional[str] = "adaptive"
    max_questions: Optional[int] = 10
    assessment_type: Optional[str] = "adaptive"

class QuestionResponse(BaseModel):
    question_id: str
    user_answer: str
    confidence_level: Optional[float] = None
    response_time_seconds: Optional[float] = None

class LearningPathRequest(BaseModel):
    subjects: List[str]
    target_level: str
    time_commitment_hours_per_week: int
    learning_style: Optional[str] = "mixed"

class ContentSearchRequest(BaseModel):
    query: str
    subject_filter: Optional[str] = None
    difficulty_level: Optional[str] = None
    content_type: Optional[str] = None

@router.post("/assessment/start")
async def start_assessment(
    request: AssessmentRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Start a new adaptive assessment"""
    try:
        orchestrator = AIOrchestrator()
        
        assessment_result = await orchestrator.process_request(
            user_id=current_user['uid'],
            request_type="start_assessment",
            request_data={
                "subject": request.subject,
                "difficulty_level": request.difficulty_level,
                "max_questions": request.max_questions,
                "assessment_type": request.assessment_type
            }
        )
        
        return {
            "success": True,
            "assessment_id": assessment_result.get("assessment_id"),
            "first_question": assessment_result.get("first_question"),
            "estimated_duration": assessment_result.get("estimated_duration"),
            "instructions": assessment_result.get("instructions")
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to start assessment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start assessment: {str(e)}"
        )

@router.post("/assessment/{assessment_id}/respond")
async def submit_assessment_response(
    assessment_id: str,
    response: QuestionResponse,
    current_user: Dict = Depends(get_current_user)
):
    """Submit response to assessment question"""
    try:
        orchestrator = AIOrchestrator()
        
        result = await orchestrator.process_request(
            user_id=current_user['uid'],
            request_type="submit_assessment_response",
            request_data={
                "assessment_id": assessment_id,
                "question_id": response.question_id,
                "user_answer": response.user_answer,
                "confidence_level": response.confidence_level,
                "response_time_seconds": response.response_time_seconds
            }
        )
        
        return {
            "success": True,
            "is_correct": result.get("is_correct"),
            "explanation": result.get("explanation"),
            "next_question": result.get("next_question"),
            "assessment_complete": result.get("assessment_complete"),
            "current_ability_estimate": result.get("current_ability_estimate")
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to submit response: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit response: {str(e)}"
        )

@router.get("/assessment/{assessment_id}/results")
async def get_assessment_results(
    assessment_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get detailed assessment results"""
    try:
        orchestrator = AIOrchestrator()
        
        results = await orchestrator.process_request(
            user_id=current_user['uid'],
            request_type="get_assessment_results",
            request_data={"assessment_id": assessment_id}
        )
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Failed to get results: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment results not found"
        )

@router.post("/learning-path/create")
async def create_learning_path(
    request: LearningPathRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
):
    """Create personalized learning path"""
    try:
        orchestrator = AIOrchestrator()
        
        # Start learning path generation (may take time)
        background_tasks.add_task(
            _generate_learning_path_background,
            current_user['uid'],
            request.dict()
        )
        
        return {
            "success": True,
            "message": "Learning path generation started",
            "estimated_completion": "2-3 minutes",
            "status_endpoint": f"/learning/learning-path/status/{current_user['uid']}"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to create learning path: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create learning path: {str(e)}"
        )

@router.get("/learning-path/status/{user_id}")
async def get_learning_path_status(
    user_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get learning path generation status"""
    if user_id != current_user['uid']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Mock status check
    return {
        "status": "completed",
        "progress": 100,
        "learning_path_id": f"path_{user_id}",
        "total_modules": 8,
        "estimated_duration_weeks": 12
    }

@router.post("/content/search")
async def search_content(
    request: ContentSearchRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Search and recommend learning content"""
    try:
        orchestrator = AIOrchestrator()
        
        results = await orchestrator.process_request(
            user_id=current_user['uid'],
            request_type="search_content",
            request_data={
                "query": request.query,
                "subject_filter": request.subject_filter,
                "difficulty_level": request.difficulty_level,
                "content_type": request.content_type
            }
        )
        
        return {
            "success": True,
            "results": results.get("content_results", []),
            "total_found": results.get("total_count", 0),
            "search_suggestions": results.get("suggestions", []),
            "personalized_recommendations": results.get("recommendations", [])
        }
        
    except Exception as e:
        logger.error(f"❌ Content search failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Content search failed: {str(e)}"
        )

@router.get("/progress/analytics")
async def get_learning_analytics(
    days: int = 30,
    current_user: Dict = Depends(get_current_user)
):
    """Get detailed learning progress analytics"""
    try:
        orchestrator = AIOrchestrator()
        
        analytics = await orchestrator.process_request(
            user_id=current_user['uid'],
            request_type="get_analytics",
            request_data={"days": days}
        )
        
        return analytics
        
    except Exception as e:
        logger.error(f"❌ Failed to get analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analytics"
        )

async def _generate_learning_path_background(user_id: str, request_data: Dict[str, Any]):
    """Background task for learning path generation"""
    try:
        orchestrator = AIOrchestrator()
        
        result = await orchestrator.process_request(
            user_id=user_id,
            request_type="create_learning_path",
            request_data=request_data
        )
        
        logger.info(f"✅ Learning path generated for user {user_id}")
        
    except Exception as e:
        logger.error(f"❌ Background learning path generation failed: {str(e)}")
