"""
API Router Configuration - Central routing for all endpoints
"""

from fastapi import APIRouter
from .auth import router as auth_router
from .learning import router as learning_router
from .ai_assistant import router as ai_router

# Main API router
api_router = APIRouter(prefix="/api/v1")

# Include all sub-routers
api_router.include_router(auth_router)
api_router.include_router(learning_router)
api_router.include_router(ai_router)

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "EdTech Platform API",
        "version": "1.0.0"
    }
