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
                     instructor: str = "AI Generated",
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
            
            processed_content = self.processor.process_media_content(
                course_details=course_details,
                module_details=module_details,
                media_file_path=video_path
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
def _extract_metadata_from_path(video_path: str) -> tuple:
    """
    Extract course name and module name from video file path
    
    Args:
        video_path: Path to video file
        
    Returns:
        Tuple of (course_name, module_name)
    """
    from pathlib import Path
    
    path = Path(video_path)
    parts = path.parts
    
    # Try to extract from common patterns
    course_name = "Auto-Generated Course"
    module_name = "General Module"
    
    # Look for course/module pattern in path
    for i, part in enumerate(parts):
        part_lower = part.lower()
        if 'course' in part_lower or 'masterclass' in part_lower:
            course_name = part.replace('_', ' ').title()
            # Look for next module
            if i + 1 < len(parts) and 'module' in parts[i + 1].lower():
                module_name = parts[i + 1].replace('_', ' ').title()
            break
        elif 'module' in part_lower:
            module_name = part.replace('_', ' ').title()
            # Look for previous course
            if i > 0:
                course_name = parts[i - 1].replace('_', ' ').title()
            break
    
    # Clean up names
    course_name = course_name.replace('Complete ', '').replace(' Masterclass', '')
    module_name = module_name.replace('Module ', '').replace('0', '').replace('1 ', '').replace('2 ', '').replace('3 ', '').replace('4 ', '')
    
    return course_name, module_name

def process_media_content(media_path: str, course_name: str = None, 
                         module_name: str = None, output_path: str = None, 
                         auto_save: bool = False, **kwargs) -> ProcessedContent:
    """
    Convenience function to process audio or video content with minimal setup
    
    Args:
        media_path: Path to audio or video file (absolute or relative to current working directory)
        course_name: Course name (auto-detected from path if None)
        module_name: Module name (auto-detected from path if None)
        output_path: Path to save the processed results (auto-generated if None and auto_save=True)
        auto_save: Whether to automatically save the results to file
        **kwargs: Additional parameters for detailed configuration
        
    Returns:
        ProcessedContent object
    """
    # Resolve absolute path for the media file
    if not os.path.isabs(media_path):
        media_path = os.path.abspath(media_path)
    
    # Auto-detect course and module names from file path if not provided
    if course_name is None or module_name is None:
        auto_course, auto_module = _extract_metadata_from_path(media_path)
        course_name = course_name or auto_course
        module_name = module_name or auto_module
    
    # Process the media file
    processor = MicrolearningProcessor()
    result = processor.process_video(media_path, course_name, module_name, **kwargs)
    
    # Handle output saving if requested
    if auto_save or output_path:
        if not output_path:
            # Default: save in same directory as media file
            media_dir = os.path.dirname(media_path)
            output_path = os.path.join(media_dir, f"processed_analysis_{result.content_id}.json")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Save the results
        if processor.export_content(result, output_path):
            print(f"✅ Results saved: {os.path.basename(output_path)}")
        else:
            print(f"❌ Failed to save results to: {output_path}")
    
    return result

def process_and_save(media_path: str, output_dir: str = None) -> str:
    """
    Optimized function to process media file and save results in one step
    
    Args:
        media_path: Path to audio/video file
        output_dir: Directory to save results (uses media file directory if None)
        
    Returns:
        Path to saved JSON file
    """
    result = process_media_content(media_path, auto_save=False)
    
    # Determine output location
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"processed_analysis_{result.content_id}.json")
    else:
        # Save in same directory as media file
        media_dir = os.path.dirname(os.path.abspath(media_path))
        output_path = os.path.join(media_dir, f"processed_analysis_{result.content_id}.json")
    
    # Save results
    processor = create_processor()
    if processor.export_content(result, output_path):
        return output_path
    else:
        raise Exception(f"Failed to save results to: {output_path}")

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

def process_content_library(library_path: str = None) -> Dict[str, Any]:
    """
    Process all MP4 files in the content library and store results in same folders
    
    Args:
        library_path: Path to content library (defaults to ../content_library)
    
    Returns:
        Dictionary with processing results
    """
    import json
    from pathlib import Path
    
    if library_path is None:
        library_path = Path(__file__).parent.parent / "content_library"
    else:
        library_path = Path(library_path)
    
    if not library_path.exists():
        raise FileNotFoundError(f"Content library not found: {library_path}")
    
    print(f"🔍 Scanning content library: {library_path}")
    
    processor = create_processor()
    results = {
        "processed_files": [],
        "failed_files": [],
        "total_files": 0,
        "successful": 0,
        "failed": 0
    }
    
    # Find all supported audio and video files recursively
    supported_extensions = [
        '*.mp4', '*.avi', '*.mov', '*.mkv', '*.wmv', '*.flv', '*.webm',  # Video formats
        '*.mp3', '*.wav', '*.m4a', '*.flac', '*.ogg', '*.aac'           # Audio formats
    ]
    
    media_files = []
    for extension in supported_extensions:
        media_files.extend(library_path.rglob(extension))
    
    results["total_files"] = len(media_files)
    
    print(f"🎬 Found {len(media_files)} audio/video files to process")
    
    # Group by file type for better reporting
    video_files = [f for f in media_files if f.suffix.lower() in ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']]
    audio_files = [f for f in media_files if f.suffix.lower() in ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac']]
    
    if video_files:
        print(f"   📹 Video files: {len(video_files)}")
    if audio_files:
        print(f"   🎵 Audio files: {len(audio_files)}")
    
    for media_file in media_files:
        try:
            # Check if already processed
            existing_processed = list(media_file.parent.glob("processed_analysis_*.json"))
            if existing_processed:
                print(f"\n⏭️  Skipping: {media_file.name} (already processed)")
                print(f"   📄 Existing: {existing_processed[0].name}")
                results["processed_files"].append({
                    "file": str(media_file),
                    "output": str(existing_processed[0]),
                    "status": "already_processed"
                })
                results["successful"] += 1
                continue
            
            # Determine file type for better logging
            file_type = "🎵 Audio" if media_file.suffix.lower() in ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'] else "📹 Video"
            print(f"\n{file_type} Processing: {media_file.name}")
            print(f"📁 Location: {media_file.parent}")
            
            # Extract metadata from folder structure
            course_name, module_name = _extract_metadata_from_path(str(media_file))
            
            print(f"📚 Course: {course_name}")
            print(f"📖 Module: {module_name}")
            
            # Process the media file (works for both audio and video)
            result = process_media_content(
                media_path=str(media_file),
                course_name=course_name,
                module_name=module_name
            )
            
            # Save results in the same folder as the media file
            output_file = media_file.parent / f"processed_analysis_{result.content_id}.json"
            
            processor = create_processor()
            if processor.export_content(result, str(output_file)):
                print(f"✅ Results saved: {output_file.name}")
                
                results["processed_files"].append({
                    "file": str(media_file),
                    "output": str(output_file),
                    "content_id": result.content_id,
                    "word_count": result.transcription.word_count,
                    "duration": result.video_metadata.duration_seconds,
                    "subtopics": len(result.subtopics),
                    "status": "newly_processed"
                })
                results["successful"] += 1
            else:
                raise Exception("Failed to export results")
                
        except Exception as e:
            print(f"❌ Failed to process {media_file.name}: {e}")
            results["failed_files"].append({
                "file": str(media_file),
                "error": str(e)
            })
            results["failed"] += 1
    
    return results



# Example usage when run directly
if __name__ == "__main__":
    import sys
    
    # Check for content library processing flag
    if len(sys.argv) == 2 and sys.argv[1] == "--process-library":
        try:
            print("🚀 Processing Content Library")
            print("=" * 50)
            
            results = process_content_library()
            
            print("\n" + "=" * 50)
            print("📊 PROCESSING SUMMARY")
            print("=" * 50)
            print(f"📹 Total files found: {results['total_files']}")
            print(f"✅ Successfully processed: {results['successful']}")
            print(f"❌ Failed to process: {results['failed']}")
            
            if results['successful'] > 0:
                print(f"\n📈 Processing Statistics:")
                total_words = sum(f['word_count'] for f in results['processed_files'])
                total_duration = sum(f['duration'] for f in results['processed_files'])
                total_subtopics = sum(f['subtopics'] for f in results['processed_files'])
                
                print(f"   📝 Total words transcribed: {total_words:,}")
                print(f"   ⏱️  Total content duration: {total_duration/60:.1f} minutes")
                print(f"   🏷️  Total subtopics identified: {total_subtopics}")
            
            if results['failed'] > 0:
                print(f"\n❌ Failed Files:")
                for failed in results['failed_files']:
                    print(f"   - {Path(failed['file']).name}: {failed['error']}")
            
        except Exception as e:
            print(f"❌ Library processing failed: {e}")
            sys.exit(1)
        
        sys.exit(0)
    
    # Check for specific file processing with library path extraction
    elif len(sys.argv) == 2 and sys.argv[1].endswith('.mp4'):
        try:
            mp4_path = Path(sys.argv[1])
            if not mp4_path.exists():
                print(f"❌ File not found: {mp4_path}")
                sys.exit(1)
            
            print(f"🎬 Processing single file from content library")
            print(f"📁 File: {mp4_path}")
            
            # Extract metadata from path
            course_name, module_name, lesson_name = _extract_metadata_from_path(mp4_path)
            
            print(f"📚 Detected Course: {course_name}")
            print(f"📖 Detected Module: {module_name}")
            print(f"📝 Detected Lesson: {lesson_name}")
            
            # Process and save the media file
            try:
                output_file = process_and_save(str(mp4_path))
                print(f"\n✅ Results saved to: {os.path.basename(output_file)}")
                
                # Get result for summary
                result = process_media_content(str(mp4_path), course_name, module_name)
                
                # Print summary
                processor = create_processor()
                summary = processor.get_content_summary(result)
            except Exception as e:
                print(f"❌ Processing failed: {e}")
                sys.exit(1)
            
            print("\n" + "="*50)
            print("PROCESSING COMPLETE")
            print("="*50)
            for key, value in summary.items():
                print(f"{key}: {value}")
                
        except Exception as e:
            print(f"❌ Processing failed: {e}")
            sys.exit(1)
        
        sys.exit(0)
    
    # Check for single file processing with auto-detection
    if len(sys.argv) == 2:
        video_path = sys.argv[1]
        
        # Auto-detect metadata from path
        mp4_path = Path(video_path)
        course_name, module_name, lesson_name = _extract_metadata_from_path(mp4_path)
        
        print(f"📁 Processing File: {video_path}")
        print(f"📚 Auto-detected Course: {course_name}")
        print(f"📖 Auto-detected Module: {module_name}")
        print(f"📝 Auto-detected Lesson: {lesson_name}")
        print()
        
        try:
            # Process and save the media file
            output_file = process_and_save(video_path)
            print(f"\n✅ Results saved to: {os.path.basename(output_file)}")
            
            # Get result for summary
            result = process_media_content(video_path, course_name, module_name)
            
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
        
        sys.exit(0)
    
    # Manual parameters processing or help
    if len(sys.argv) < 4:
        print("Microlearning Content Processor")
        print("=" * 40)
        print("\nUsage Options:")
        print("1. Process entire content library:")
        print("   python processor.py --process-library")
        print()
        print("2. Process single audio/video file (auto-detect metadata from path):")
        print("   python processor.py <path_to_media_file>")
        print()
        print("3. Process with manual parameters:")
        print("   python processor.py <media_path> <course_name> <module_name>")
        print()
        print("Supported formats:")
        print("   📹 Video: .mp4, .avi, .mov, .mkv, .wmv, .flv, .webm")
        print("   🎵 Audio: .mp3, .wav, .m4a, .flac, .ogg, .aac")
        print()
        print("Examples:")
        print("   python processor.py --process-library")
        print("   python processor.py lecture.mp4")
        print("   python processor.py audio_lecture.wav")
        print("   python processor.py ../content/video.mp4")
        print("   python processor.py lecture.mp4 'Math 101' 'Introduction'")
        print("   python processor.py audio_lesson.mp3 'Physics 101' 'Waves'")
        print()
        print("Supported formats: MP4, AVI, MOV, MKV, WMV, FLV, WebM (video)")
        print("                   MP3, WAV, M4A, FLAC, OGG, AAC (audio)")
        sys.exit(1)

    # Manual parameters mode (3 arguments: video_path, course_name, module_name)
    video_path = sys.argv[1]
    course_name = sys.argv[2]
    module_name = sys.argv[3]

    try:
        # Process the media file with manual parameters
        result = process_media_content(video_path, course_name, module_name)
        
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
