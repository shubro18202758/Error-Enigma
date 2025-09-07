"""
Logging configuration for the EdTech platform
"""

import logging
import logging.config
import sys
from typing import Dict, Any


def setup_logging(level: str = "INFO") -> None:
    """Setup structured logging configuration"""
    
    logging_config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "simple": {
                "format": "%(levelname)s - %(message)s"
            },
            "json": {
                "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": level,
                "formatter": "detailed",
                "stream": sys.stdout
            },
            "file": {
                "class": "logging.FileHandler",
                "level": level,
                "formatter": "json",
                "filename": "edtech_platform.log",
                "mode": "a"
            }
        },
        "loggers": {
            "": {  # Root logger
                "level": level,
                "handlers": ["console", "file"],
                "propagate": False
            },
            "uvicorn": {
                "level": level,
                "handlers": ["console"],
                "propagate": False
            },
            "sqlalchemy": {
                "level": "WARNING",
                "handlers": ["console"],
                "propagate": False
            }
        }
    }
    
    logging.config.dictConfig(logging_config)
    
    # Set up main application logger
    logger = logging.getLogger(__name__)
    logger.info("Logging system initialized")


class StructuredLogger:
    """Structured logger for better observability"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def log_user_interaction(self, user_id: str, action: str, details: Dict[str, Any]):
        """Log user interactions for analytics"""
        self.logger.info(
            f"USER_INTERACTION | user_id={user_id} | action={action} | details={details}"
        )
    
    def log_ai_request(self, user_id: str, request_type: str, processing_time: float):
        """Log AI service requests"""
        self.logger.info(
            f"AI_REQUEST | user_id={user_id} | type={request_type} | time_ms={processing_time:.2f}"
        )
    
    def log_learning_event(self, user_id: str, event_type: str, content_id: str, metadata: Dict[str, Any]):
        """Log learning events"""
        self.logger.info(
            f"LEARNING_EVENT | user_id={user_id} | event={event_type} | content_id={content_id} | metadata={metadata}"
        )
    
    def log_error(self, error_type: str, error_message: str, context: Dict[str, Any] = None):
        """Log structured errors"""
        context_str = f" | context={context}" if context else ""
        self.logger.error(
            f"ERROR | type={error_type} | message={error_message}{context_str}"
        )


# Create global loggers for different components
app_logger = StructuredLogger("app")
ai_logger = StructuredLogger("ai_services")
learning_logger = StructuredLogger("learning")
analytics_logger = StructuredLogger("analytics")
