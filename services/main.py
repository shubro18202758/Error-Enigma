"""
Advanced EdTech Platform - Main Application
A comprehensive personalized microlearning engine with AI-driven features
"""

from fastapi import FastAPI, WebSocket, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import asyncio
import logging
from typing import List, Dict, Any
import uvicorn
import os

from app.core.config import settings
from app.core.logger import setup_logging
from app.api.routes import api_router
from app.services.ai_orchestrator import AIOrchestrator

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Global instances
ai_orchestrator = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global ai_orchestrator
    
    logger.info("🚀 Starting EdTech Platform...")
    
    # Initialize core services
    ai_orchestrator = AIOrchestrator()
    
    # Start services
    await ai_orchestrator.initialize()
    
    logger.info("✅ AI Orchestrator initialized successfully!")
    
    yield
    
    # Cleanup
    logger.info("🔄 Shutting down services...")
    await ai_orchestrator.cleanup()
    logger.info("✅ Shutdown complete!")

# Create FastAPI app with lifespan
app = FastAPI(
    title="Advanced EdTech Platform",
    description="Personalized Microlearning Engine with AI-Driven Adaptive Learning",
    version="2.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security
security = HTTPBearer()

# Include API router
app.include_router(api_router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Advanced EdTech Platform API",
        "version": "2.0.0",
        "features": [
            "Personalized Microlearning Engine",
            "Adaptive Pre-Assessment with CAT",
            "Real-time Engagement & Fatigue Monitoring",
            "Agentic AI with RAG Framework",
            "Deadline-Driven Learning Optimization",
            "Social Learning & Gamification",
            "Adaptive Proctoring System",
            "Comprehensive Analytics & Learning Science Integration"
        ],
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check all services
        services_status = {
            "ai_orchestrator": ai_orchestrator.is_healthy() if ai_orchestrator else False
        }
        
        all_healthy = all(services_status.values())
        
        return {
            "status": "healthy" if all_healthy else "degraded",
            "services": services_status,
            "timestamp": asyncio.get_event_loop().time()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.websocket("/ws/realtime/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time features"""
    await websocket.close(code=1000, reason="WebSocket service not implemented yet")

@app.post("/api/v1/orchestrator/process")
async def process_ai_request(
    request: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """Main AI Orchestrator endpoint"""
    if not ai_orchestrator:
        raise HTTPException(status_code=503, detail="AI Orchestrator not available")
    
    try:
        response = await ai_orchestrator.process_request(request)
        
        # Add background task for analytics
        background_tasks.add_task(
            ai_orchestrator.log_interaction,
            request,
            response
        )
        
        return response
    except Exception as e:
        logger.error(f"AI Orchestrator error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/adaptive/next-activity")
async def get_next_activity(
    user_id: str,
    context: Dict[str, Any]
):
    """Get next optimal learning activity"""
    try:
        # Use AI Orchestrator for adaptive recommendations
        activity = await ai_orchestrator.process_request(
            user_id=user_id,
            request_type="get_next_activity",
            request_data=context
        )
        return activity
    except Exception as e:
        logger.error(f"Adaptive Engine error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/content/discover")
async def discover_content(
    query: str,
    user_id: str,
    limit: int = 10
):
    """Intelligent content discovery"""
    try:
        # Use AI Orchestrator for content discovery
        results = await ai_orchestrator.process_request(
            user_id=user_id,
            request_type="discover_content",
            request_data={
                "query": query,
                "limit": limit
            }
        )
        return results
    except Exception as e:
        logger.error(f"Content discovery error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return {
        "error": {
            "code": exc.status_code,
            "message": exc.detail,
            "type": "http_error"
        }
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled Exception: {exc}")
    return {
        "error": {
            "code": 500,
            "message": "Internal server error",
            "type": "server_error"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
