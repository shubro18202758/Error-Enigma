"""
Firebase configuration and initialization
"""

import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Firebase instances
firebase_app = None
firestore_client = None


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global firebase_app, firestore_client
    
    try:
        # Check if Firebase is already initialized
        if firebase_app is not None:
            logger.info("Firebase already initialized")
            return firebase_app
        
        # Get service account path
        service_account_path = os.path.abspath(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
        
        if not os.path.exists(service_account_path):
            logger.warning(f"Firebase service account file not found at: {service_account_path}")
            logger.info("Attempting to initialize Firebase with default credentials...")
            
            # Try to initialize with default credentials
            firebase_app = firebase_admin.initialize_app()
        else:
            # Initialize with service account
            cred = credentials.Certificate(service_account_path)
            firebase_app = firebase_admin.initialize_app(cred, {
                'projectId': settings.FIREBASE_PROJECT_ID,
            })
        
        # Initialize Firestore client
        firestore_client = firestore.client()
        
        logger.info("✅ Firebase initialized successfully!")
        return firebase_app
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize Firebase: {e}")
        # Continue without Firebase for development
        return None


def get_firebase_user(id_token: str):
    """Verify Firebase ID token and get user info"""
    try:
        if not firebase_app:
            raise Exception("Firebase not initialized")
        
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.error(f"Firebase token verification failed: {e}")
        raise


def get_firestore_client():
    """Get Firestore client instance"""
    global firestore_client
    
    if not firestore_client:
        initialize_firebase()
    
    return firestore_client


class FirebaseService:
    """Firebase service wrapper"""
    
    def __init__(self):
        self.app = firebase_app
        self.firestore = firestore_client
    
    async def verify_user_token(self, id_token: str) -> dict:
        """Verify Firebase ID token"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return {
                "uid": decoded_token["uid"],
                "email": decoded_token.get("email"),
                "email_verified": decoded_token.get("email_verified", False),
                "name": decoded_token.get("name"),
                "picture": decoded_token.get("picture")
            }
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            raise ValueError("Invalid token")
    
    async def create_custom_token(self, uid: str) -> str:
        """Create custom Firebase token"""
        try:
            custom_token = auth.create_custom_token(uid)
            return custom_token.decode('utf-8')
        except Exception as e:
            logger.error(f"Custom token creation failed: {e}")
            raise
    
    async def get_user_by_email(self, email: str):
        """Get Firebase user by email"""
        try:
            user = auth.get_user_by_email(email)
            return {
                "uid": user.uid,
                "email": user.email,
                "email_verified": user.email_verified,
                "display_name": user.display_name,
                "photo_url": user.photo_url,
                "disabled": user.disabled
            }
        except Exception as e:
            logger.error(f"Get user by email failed: {e}")
            return None
    
    async def store_user_data(self, uid: str, data: dict):
        """Store user data in Firestore"""
        try:
            if not self.firestore:
                logger.warning("Firestore not available")
                return False
            
            doc_ref = self.firestore.collection('users').document(uid)
            doc_ref.set(data, merge=True)
            return True
        except Exception as e:
            logger.error(f"Store user data failed: {e}")
            return False
    
    async def get_user_data(self, uid: str):
        """Get user data from Firestore"""
        try:
            if not self.firestore:
                logger.warning("Firestore not available")
                return None
            
            doc_ref = self.firestore.collection('users').document(uid)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Get user data failed: {e}")
            return None


# Global Firebase service instance
firebase_service = FirebaseService()


async def verify_firebase_token(token: str) -> dict:
    """Verify Firebase token - wrapper function for auth compatibility"""
    return await firebase_service.verify_user_token(token)


async def create_firebase_user(email: str, display_name: str) -> dict:
    """Create Firebase user - wrapper function for auth compatibility"""
    try:
        # In a real implementation, this would create a new user
        # For now, return a mock response
        user_record = auth.create_user(
            email=email,
            display_name=display_name
        )
        
        # Create custom token
        custom_token = await firebase_service.create_custom_token(user_record.uid)
        
        return {
            "uid": user_record.uid,
            "email": user_record.email,
            "display_name": user_record.display_name,
            "token": custom_token
        }
    except Exception as e:
        logger.error(f"Create Firebase user failed: {e}")
        # Return mock data for development
        import uuid
        mock_uid = str(uuid.uuid4())
        return {
            "uid": mock_uid,
            "email": email,
            "display_name": display_name,
            "token": f"mock_token_{mock_uid}"
        }
