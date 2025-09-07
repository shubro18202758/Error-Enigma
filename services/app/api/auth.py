"""
Authentication and User Management API Routes
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional
import logging

from ..core.firebase_config import verify_firebase_token, create_firebase_user
from ..services.user_service import UserService
from ..models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# Request/Response Models
class UserRegistration(BaseModel):
    email: EmailStr
    display_name: str
    learning_goals: Optional[list] = []
    preferred_subjects: Optional[list] = []

class UserProfile(BaseModel):
    user_id: str
    email: str
    display_name: str
    learning_goals: list
    preferred_subjects: list
    progress_level: str
    total_study_time: int
    streak_days: int

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_profile: UserProfile

# Dependency for authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify Firebase token and return user data"""
    try:
        user_data = await verify_firebase_token(credentials.credentials)
        return user_data
    except Exception as e:
        logger.error(f"❌ Authentication failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

@router.post("/register", response_model=TokenResponse)
async def register_user(user_data: UserRegistration):
    """Register new user with Firebase and create profile"""
    try:
        # Create Firebase user
        firebase_user = await create_firebase_user(
            email=user_data.email,
            display_name=user_data.display_name
        )
        
        # Create user profile in database
        user_service = UserService()
        user_profile = await user_service.create_user_profile(
            user_id=firebase_user['uid'],
            email=user_data.email,
            display_name=user_data.display_name,
            learning_goals=user_data.learning_goals,
            preferred_subjects=user_data.preferred_subjects
        )
        
        return TokenResponse(
            access_token=firebase_user['token'],
            token_type="Bearer",
            user_profile=UserProfile(**user_profile)
        )
        
    except Exception as e:
        logger.error(f"❌ Registration failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: Dict = Depends(get_current_user)):
    """Get current user profile"""
    try:
        user_service = UserService()
        profile = await user_service.get_user_profile(current_user['uid'])
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return UserProfile(**profile)
        
    except Exception as e:
        logger.error(f"❌ Failed to get profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )

@router.put("/profile")
async def update_user_profile(
    profile_updates: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """Update user profile"""
    try:
        user_service = UserService()
        updated_profile = await user_service.update_user_profile(
            current_user['uid'], 
            profile_updates
        )
        
        return {"success": True, "profile": updated_profile}
        
    except Exception as e:
        logger.error(f"❌ Profile update failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Profile update failed: {str(e)}"
        )

@router.post("/logout")
async def logout_user(current_user: Dict = Depends(get_current_user)):
    """Logout user (invalidate session)"""
    try:
        # In Firebase, token invalidation happens client-side
        # Here we can log the logout event
        logger.info(f"✅ User {current_user['uid']} logged out")
        
        return {"success": True, "message": "Successfully logged out"}
        
    except Exception as e:
        logger.error(f"❌ Logout failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.get("/verify")
async def verify_token(current_user: Dict = Depends(get_current_user)):
    """Verify authentication token"""
    return {
        "valid": True,
        "user_id": current_user['uid'],
        "email": current_user.get('email')
    }
