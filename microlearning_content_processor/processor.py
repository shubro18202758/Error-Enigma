#!/usr/bin/env python3
"""
Main Content Processor Module
A standalone module for processing video content into structured microlearning data.
Can be imported and used by other applications.
"""

import os
import sys
import logging
from typing import Dict, Any, Optional
from pathlib import Path

# Get the directory where this script is located
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# Add current directory to Python path for imports
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from models.data_models import (
        CourseDetails, ModuleDetails, ProcessedContent, 
        DifficultyLevel, ContentType
    )
    from services.content_processor import ContentProcessor
    from utils.config import Config
    from utils.helpers import validate_video_file, export_to_json
except ImportError as e:
    # Handle relative imports for different deployment scenarios
    try:
        from .models.data_models import (
            CourseDetails, ModuleDetails, ProcessedContent, 
            DifficultyLevel, ContentType
        )
        from .services.content_processor import ContentProcessor
        from .utils.config import Config
        from .utils.helpers import validate_video_file, export_to_json
    except ImportError:
        raise ImportError(f"Could not import required modules: {e}")

# Configure logging for this module
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MicrolearningProcessor:
    """
    Main processor class for converting video content to structured microlearning data.
    This class can be imported and used by other applications.
    
    Features:
    - Progress tracking with detailed status updates
    - Robust error handling and validation
    - Flexible input parameters with auto-generation
    - Multiple export formats
    - Search functionality
    """
    
    def __init__(self, whisper_model: str = "base", log_level: str = "INFO", 
                 progress_callback: Optional[callable] = None):
        """
        Initialize the microlearning processor
        
        Args:
            whisper_model: Whisper model size ("tiny", "base", "small", "medium", "large")
            log_level: Logging level ("DEBUG", "INFO", "WARNING", "ERROR")
            progress_callback: Optional callback function for progress updates
                              Should accept (stage: str, progress: float, message: str, details: dict)
        """
        # Set up logging
        logging.getLogger().setLevel(getattr(logging, log_level.upper()))
        
        self.logger = logging.getLogger(__name__)
        self.whisper_model = whisper_model
        self.progress_callback = progress_callback
        self.current_processing_info = {}
        
        # Initialize the content processor
        try:
            self.processor = ContentProcessor(whisper_model=whisper_model)
            self.logger.info(f"MicrolearningProcessor initialized with Whisper model: {whisper_model}")
        except Exception as e:
            self.logger.error(f"Failed to initialize processor: {e}")
            raise
    
    def _update_progress(self, stage: str, progress: float, message: str, details: Optional[Dict] = None):
        """
        Update processing progress
        
        Args:
            stage: Current processing stage
            progress: Progress percentage (0.0 to 1.0)
            message: Status message
            details: Optional additional details
        """
        progress_info = {
            "stage": stage,
            "progress": progress,
            "message": message,
            "timestamp": logging.Formatter().formatTime(logging.LogRecord("", 0, "", 0, "", (), None)),
            "details": details or {}
        }
        
        # Update current processing info
        self.current_processing_info.update(progress_info)
        
        # Call progress callback if provided
        if self.progress_callback:
            try:
                self.progress_callback(stage, progress, message, details or {})
            except Exception as e:
                self.logger.warning(f"Progress callback failed: {e}")
        
        # Log the progress
        self.logger.info(f"[{stage}] {progress:.1%} - {message}")
        
        if details:
            for key, value in details.items():
                self.logger.debug(f"  {key}: {value}")
    
    def get_current_progress(self) -> Dict[str, Any]:
        """Get current processing progress information"""
        return self.current_processing_info.copy()
    
    def process_video(self, 
                     video_path: str,
                     course_name: str,
                     module_name: str,
                     instructor: str,
                     category: str = "General",
                     course_id: Optional[str] = None,
                     module_id: Optional[str] = None,
                     difficulty_level: str = "beginner",
                     content_type: str = "lecture",
                     course_description: Optional[str] = None,
                     module_description: Optional[str] = None,
                     tags: Optional[list] = None,
                     learning_objectives: Optional[list] = None,
                     prerequisites: Optional[list] = None,
                     module_order: int = 1,
                     duration_estimate: Optional[int] = None) -> ProcessedContent:
        """
        Process a video file and return structured microlearning content with detailed progress tracking
        
        Processing Stages:
        1. INITIALIZATION (0-5%): Validate inputs and setup
        2. PREPROCESSING (5-10%): Extract video metadata and audio
        3. TRANSCRIPTION (10-60%): Convert audio to text using Whisper
        4. ANALYSIS (60-80%): Identify topics and analyze content
        5. STRUCTURING (80-95%): Create learning chunks and organize data  
        6. COMPLETION (95-100%): Finalize and package results
        
        Args:
            video_path: Path to the video file
            course_name: Name of the course
            module_name: Name of the module
            instructor: Instructor name
            category: Course category (default: "General")
            course_id: Course ID (auto-generated if not provided)
            module_id: Module ID (auto-generated if not provided)
            difficulty_level: "beginner", "intermediate", or "advanced"
            content_type: "lecture", "tutorial", "demonstration", "discussion", or "assessment"
            course_description: Optional course description
            module_description: Optional module description
            tags: Optional list of tags
            learning_objectives: Optional list of learning objectives
            prerequisites: Optional list of prerequisites
            module_order: Order of module in course (default: 1)
            duration_estimate: Estimated duration in minutes
            
        Returns:
            ProcessedContent object with all structured data
            
        Raises:
            FileNotFoundError: If video file doesn't exist
            ValueError: If video format is not supported or other validation fails
            Exception: If processing fails
        """
        from datetime import datetime
        start_time = datetime.now()
        
        try:
            # Stage 1: INITIALIZATION (0-5%)
            self._update_progress("INITIALIZATION", 0.0, "Starting video processing...", 
                                {"video_path": video_path, "course": course_name, "module": module_name})
            
            self.logger.info(f"Starting video processing: {video_path}")
            
            # Validate input file
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"Video file not found: {video_path}")
            
            validation = validate_video_file(video_path)
            if not validation["valid"]:
                raise ValueError(f"Video validation failed: {validation['error']}")
            
            file_info = validation.get("info", {})
            self._update_progress("INITIALIZATION", 0.03, "File validated successfully", 
                                {"file_size_mb": file_info.get("file_size_mb", 0),
                                 "format": file_info.get("format", "unknown")})
            
            # Auto-generate IDs if not provided
            if not course_id:
                course_id = f"course_{hash(course_name) % 10000:04d}"
            if not module_id:
                module_id = f"{course_id}_module_{module_order}"
            
            self._update_progress("INITIALIZATION", 0.05, "Configuration completed", 
                                {"course_id": course_id, "module_id": module_id})
            
            # Create course details
            course_details = CourseDetails(
                course_id=course_id,
                course_name=course_name,
                course_description=course_description,
                instructor=instructor,
                category=category,
                difficulty_level=DifficultyLevel(difficulty_level.lower()),
                tags=tags or []
            )
            
            # Create module details
            module_details = ModuleDetails(
                module_id=module_id,
                module_name=module_name,
                module_description=module_description,
                order=module_order,
                duration_estimate=duration_estimate,
                learning_objectives=learning_objectives or [],
                prerequisites=prerequisites or [],
                content_type=ContentType(content_type.lower())
            )
            
            # Override processor progress tracking to integrate with our system
            original_update = self.processor._update_status
            
            def progress_wrapper(content_id, progress=None, message=None):
                if progress is not None and message:
                    # Map internal progress to our stages
                    if "metadata" in message.lower():
                        stage = "PREPROCESSING" 
                        mapped_progress = 0.05 + (progress * 0.05)  # 5-10%
                    elif "extract" in message.lower() and "audio" in message.lower():
                        stage = "PREPROCESSING"
                        mapped_progress = 0.07 + (progress * 0.03)  # 7-10%
                    elif "transcrib" in message.lower():
                        stage = "TRANSCRIPTION"
                        mapped_progress = 0.10 + (progress * 0.50)  # 10-60%
                    elif "topic" in message.lower() or "analyz" in message.lower():
                        stage = "ANALYSIS" 
                        mapped_progress = 0.60 + (progress * 0.20)  # 60-80%
                    elif "chunk" in message.lower() or "structur" in message.lower():
                        stage = "STRUCTURING"
                        mapped_progress = 0.80 + (progress * 0.15)  # 80-95%
                    else:
                        stage = "PROCESSING"
                        mapped_progress = 0.10 + (progress * 0.80)  # General mapping
                    
                    self._update_progress(stage, mapped_progress, message)
                
                return original_update(content_id, progress, message)
            
            # Temporarily replace the update method
            self.processor._update_status = progress_wrapper
            
            # Stage 2-6: Main Processing
            self._update_progress("PREPROCESSING", 0.05, "Starting content processing...")
            
            processed_content = self.processor.process_video_content(
                course_details=course_details,
                module_details=module_details,
                video_file_path=video_path
            )
            
            # Restore original method
            self.processor._update_status = original_update
            
            # Stage 6: COMPLETION (95-100%)
            processing_time = (datetime.now() - start_time).total_seconds()
            
            completion_details = {
                "content_id": processed_content.content_id,
                "processing_time_seconds": round(processing_time, 2),
                "word_count": processed_content.transcription.word_count,
                "language_detected": processed_content.transcription.language,
                "subtopics_found": len(processed_content.subtopics),
                "learning_chunks": len(processed_content.learning_chunks),
                "main_topics": processed_content.main_topics[:3]  # Top 3
            }
            
            self._update_progress("COMPLETION", 0.95, "Finalizing results...", completion_details)
            
            # Log detailed summary
            self.logger.info(f"Processing completed successfully!")
            self.logger.info(f"  Content ID: {processed_content.content_id}")
            self.logger.info(f"  Processing time: {processing_time:.1f} seconds")
            self.logger.info(f"  Words transcribed: {processed_content.transcription.word_count}")
            self.logger.info(f"  Language detected: {processed_content.transcription.language}")
            self.logger.info(f"  Subtopics identified: {len(processed_content.subtopics)}")
            self.logger.info(f"  Learning chunks created: {len(processed_content.learning_chunks)}")
            
            self._update_progress("COMPLETION", 1.0, "Processing completed successfully!", completion_details)
            
            return processed_content
            
        except Exception as e:
            error_details = {"error": str(e), "error_type": type(e).__name__}
            self._update_progress("ERROR", 0.0, f"Processing failed: {str(e)}", error_details)
            self.logger.error(f"Video processing failed: {e}")
            raise
    
    def process_video_simple(self, video_path: str, course_name: str, 
                           module_name: str, instructor: str) -> ProcessedContent:
        """
        Simplified version with minimal required parameters
        
        Args:
            video_path: Path to video file
            course_name: Name of the course
            module_name: Name of the module
            instructor: Instructor name
            
        Returns:
            ProcessedContent object
        """
        return self.process_video(
            video_path=video_path,
            course_name=course_name,
            module_name=module_name,
            instructor=instructor
        )
    
    def get_content_summary(self, processed_content: ProcessedContent) -> Dict[str, Any]:
        """
        Get a summary of processed content
        
        Args:
            processed_content: ProcessedContent object
            
        Returns:
            Dictionary with summary information
        """
        return {
            "content_id": processed_content.content_id,
            "course_name": processed_content.course_details.course_name,
            "module_name": processed_content.module_details.module_name,
            "instructor": processed_content.course_details.instructor,
            "duration_seconds": processed_content.video_metadata.get("duration_seconds", 0),
            "word_count": processed_content.transcription.word_count,
            "language": processed_content.transcription.language,
            "subtopics_count": len(processed_content.subtopics),
            "learning_chunks_count": len(processed_content.learning_chunks),
            "main_topics": processed_content.main_topics,
            "key_concepts": processed_content.key_concepts[:10],  # Top 10
            "tags": processed_content.tags,
            "processed_at": processed_content.processed_at
        }
    
    def export_content(self, processed_content: ProcessedContent, 
                      output_path: str, format: str = "json") -> bool:
        """
        Export processed content to file
        
        Args:
            processed_content: ProcessedContent object
            output_path: Path to save the file
            format: Export format ("json", "summary")
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if format.lower() == "json":
                return export_to_json(processed_content.dict(), output_path)
            elif format.lower() == "summary":
                summary = self.get_content_summary(processed_content)
                return export_to_json(summary, output_path)
            else:
                self.logger.error(f"Unsupported export format: {format}")
                return False
        except Exception as e:
            self.logger.error(f"Export failed: {e}")
            return False
    
    def search_content(self, query: str, processed_contents: list, 
                      max_results: int = 10) -> list:
        """
        Search through processed content
        
        Args:
            query: Search query
            processed_contents: List of ProcessedContent objects
            max_results: Maximum results to return
            
        Returns:
            List of search results
        """
        return self.processor.search_content(query, processed_contents, max_results)

# Convenience functions for easy import and use
def process_video_content(video_path: str, course_name: str, module_name: str, 
                         instructor: str, **kwargs) -> ProcessedContent:
    """
    Convenience function to process a video with minimal setup
    
    Args:
        video_path: Path to video file (absolute or relative to current working directory)
        course_name: Course name
        module_name: Module name
        instructor: Instructor name
        **kwargs: Additional parameters for detailed configuration
        
    Returns:
        ProcessedContent object
    """
    # Resolve absolute path for the video file
    if not os.path.isabs(video_path):
        video_path = os.path.abspath(video_path)
    
    processor = MicrolearningProcessor()
    return processor.process_video(video_path, course_name, module_name, instructor, **kwargs)

def create_processor(whisper_model: str = "base", 
                    progress_callback: Optional[callable] = None) -> MicrolearningProcessor:
    """
    Create a processor instance
    
    Args:
        whisper_model: Whisper model size
        progress_callback: Optional callback for progress updates
        
    Returns:
        MicrolearningProcessor instance
    """
    return MicrolearningProcessor(whisper_model=whisper_model, progress_callback=progress_callback)

def get_processor_info() -> Dict[str, Any]:
    """
    Get information about the processor and its dependencies
    
    Returns:
        Dictionary with processor information
    """
    info = {
        "processor_location": CURRENT_DIR,
        "python_path": sys.path[:3],  # First 3 paths
        "dependencies": {},
        "supported_formats": {
            "video": [".mp4", ".avi", ".mov", ".mkv", ".wmv"],
            "audio": [".wav", ".mp3", ".m4a", ".flac", ".ogg"]
        }
    }
    
    # Check dependencies
    try:
        import whisper
        info["dependencies"]["whisper"] = "✅ Available"
    except ImportError:
        info["dependencies"]["whisper"] = "❌ Not available"
    
    try:
        from moviepy.editor import VideoFileClip
        info["dependencies"]["moviepy"] = "✅ Available"
    except ImportError:
        info["dependencies"]["moviepy"] = "❌ Not available"
    
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        info["dependencies"]["spacy"] = "✅ Available"
    except ImportError:
        info["dependencies"]["spacy"] = "❌ Not available"
    
    return info

# Example usage when run directly
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 5:
        print("Usage: python processor.py <video_path> <course_name> <module_name> <instructor>")
        print("Example: python processor.py lecture.mp4 'Math 101' 'Introduction' 'Dr. Smith'")
        sys.exit(1)
    
    video_path = sys.argv[1]
    course_name = sys.argv[2]
    module_name = sys.argv[3]
    instructor = sys.argv[4]
    
    try:
        # Process the video
        result = process_video_content(video_path, course_name, module_name, instructor)
        
        # Print summary
        processor = create_processor()
        summary = processor.get_content_summary(result)
        
        print("\n" + "="*50)
        print("PROCESSING COMPLETE")
        print("="*50)
        for key, value in summary.items():
            print(f"{key}: {value}")
        
        # Export results
        output_file = f"processed_{result.content_id}.json"
        if processor.export_content(result, output_file):
            print(f"\nResults saved to: {output_file}")
        
    except Exception as e:
        print(f"Processing failed: {e}")
        sys.exit(1)
