import os
import logging
from typing import Optional

class Config:
    """Configuration settings for the microlearning content processor"""
    
    # Whisper model settings
    WHISPER_MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "base")
    
    # Processing settings
    MIN_SUBTOPIC_DURATION: int = int(os.getenv("MIN_SUBTOPIC_DURATION", "30"))
    MAX_LEARNING_CHUNK_DURATION: int = int(os.getenv("MAX_LEARNING_CHUNK_DURATION", "300"))
    DEFAULT_CHUNK_DURATION: int = int(os.getenv("DEFAULT_CHUNK_DURATION", "120"))
    
    # Topic analysis settings
    MAX_KEY_PHRASES: int = int(os.getenv("MAX_KEY_PHRASES", "20"))
    MAX_MAIN_TOPICS: int = int(os.getenv("MAX_MAIN_TOPICS", "5"))
    MAX_TAGS: int = int(os.getenv("MAX_TAGS", "20"))
    
    # File processing settings
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "500"))
    SUPPORTED_VIDEO_FORMATS: list = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']
    SUPPORTED_AUDIO_FORMATS: list = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac']
    SUPPORTED_MEDIA_FORMATS: list = SUPPORTED_VIDEO_FORMATS + SUPPORTED_AUDIO_FORMATS
    TEMP_DIR: str = os.getenv("TEMP_DIR", "/tmp")
    
    # API settings
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Database settings (for future use)
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    
    # Storage settings (for future use)
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local")
    AWS_S3_BUCKET: Optional[str] = os.getenv("AWS_S3_BUCKET")
    
    @classmethod
    def setup_logging(cls):
        """Setup logging configuration"""
        logging.basicConfig(
            level=getattr(logging, cls.LOG_LEVEL.upper()),
            format=cls.LOG_FORMAT
        )
    
    @classmethod
    def validate_file_size(cls, file_path: str) -> bool:
        """Check if file size is within limits"""
        if not os.path.exists(file_path):
            return False
        
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        return file_size_mb <= cls.MAX_FILE_SIZE_MB
    
    @classmethod
    def is_supported_format(cls, filename: str) -> bool:
        """Check if file format is supported (video or audio)"""
        return any(filename.lower().endswith(fmt) for fmt in cls.SUPPORTED_MEDIA_FORMATS)
    
    @classmethod
    def is_video_format(cls, filename: str) -> bool:
        """Check if file is a video format"""
        return any(filename.lower().endswith(fmt) for fmt in cls.SUPPORTED_VIDEO_FORMATS)
    
    @classmethod
    def is_audio_format(cls, filename: str) -> bool:
        """Check if file is an audio format"""
        return any(filename.lower().endswith(fmt) for fmt in cls.SUPPORTED_AUDIO_FORMATS)
