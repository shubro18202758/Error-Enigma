import os
import uuid
import logging
from typing import Dict, Any, List
from datetime import datetime
from moviepy.editor import VideoFileClip
from pathlib import Path

from models.data_models import (
    CourseDetails, ModuleDetails, ProcessedContent, 
    TranscriptionResult, ProcessingStatus
)
from services.transcription_service import TranscriptionService
from services.topic_analysis_service import TopicAnalysisService

class ContentProcessor:
    """Main service for processing video content into structured microlearning data"""
    
    def __init__(self, whisper_model: str = "base"):
        """
        Initialize content processor
        
        Args:
            whisper_model: Whisper model size to use for transcription
        """
        self.logger = logging.getLogger(__name__)
        self.transcription_service = TranscriptionService(whisper_model)
        self.topic_analysis_service = TopicAnalysisService()
        
        # In-memory storage for processing status (use database in production)
        self.processing_status: Dict[str, ProcessingStatus] = {}
    
    def process_media_content(self, course_details: CourseDetails, 
                            module_details: ModuleDetails,
                            media_file_path: str) -> ProcessedContent:
        """
        Process audio or video content into structured microlearning format
        
        Args:
            course_details: Course information
            module_details: Module information  
            media_file_path: Path to audio or video file
            
        Returns:
            ProcessedContent with all analyzed data
        """
        content_id = str(uuid.uuid4())
        
        # Initialize processing status
        status = ProcessingStatus(
            content_id=content_id,
            status="processing",
            progress=0.0,
            message="Starting content processing...",
            started_at=datetime.now()
        )
        self.processing_status[content_id] = status
        
        try:
            self.logger.info(f"Starting content processing for: {media_file_path}")
            
            # Step 1: Extract media metadata
            self._update_status(content_id, 0.1, "Extracting media metadata...")
            video_metadata = self._extract_video_metadata(media_file_path)
            
            # Step 2: Transcribe audio/video content
            self._update_status(content_id, 0.2, "Transcribing audio content...")
            transcription = self.transcription_service.transcribe_video(media_file_path)
            
            # Step 3: Analyze topics and subtopics
            self._update_status(content_id, 0.6, "Analyzing topics and subtopics...")
            subtopics = self.topic_analysis_service.identify_subtopics(transcription)
            main_topics = self.topic_analysis_service.extract_main_topics(transcription)
            key_concepts = self.topic_analysis_service.extract_key_phrases(
                transcription.full_text, 15
            )
            
            # Step 4: Create learning chunks
            self._update_status(content_id, 0.8, "Creating learning chunks...")
            learning_chunks = self._create_learning_chunks(transcription, subtopics)
            
            # Step 5: Generate tags and searchable content
            self._update_status(content_id, 0.9, "Generating tags and search data...")
            tags = self._generate_tags(course_details, module_details, main_topics, key_concepts)
            searchable_text = self._create_searchable_text(transcription, subtopics, tags)
            
            # Step 6: Create final processed content
            processed_content = ProcessedContent(
                content_id=content_id,
                course_details=course_details,
                module_details=module_details,
                video_metadata=video_metadata,
                transcription=transcription,
                subtopics=subtopics,
                main_topics=main_topics,
                key_concepts=key_concepts,
                learning_chunks=learning_chunks,
                searchable_text=searchable_text,
                tags=tags,
                processed_at=datetime.now()
            )
            
            # Complete processing
            self._update_status(content_id, 1.0, "Processing completed successfully!")
            self.processing_status[content_id].status = "completed"
            self.processing_status[content_id].completed_at = datetime.now()
            
            self.logger.info(f"Content processing completed for ID: {content_id}")
            return processed_content
            
        except Exception as e:
            self.logger.error(f"Content processing failed: {e}")
            self._update_status(content_id, None, f"Processing failed: {str(e)}")
            self.processing_status[content_id].status = "failed"
            self.processing_status[content_id].error_details = str(e)
            raise
    
    def _extract_video_metadata(self, video_path: str) -> Dict[str, Any]:
        """Extract metadata from video file"""
        try:
            video = VideoFileClip(video_path)
            
            metadata = {
                "filename": os.path.basename(video_path),
                "file_size_mb": round(os.path.getsize(video_path) / (1024 * 1024), 2),
                "duration_seconds": video.duration,
                "has_audio": video.audio is not None,
                "file_format": Path(video_path).suffix.lower()
            }
            
            # Check if this file has video stream
            try:
                if hasattr(video, 'fps') and video.fps is not None:
                    metadata["fps"] = video.fps
                    metadata["resolution"] = {
                        "width": video.w,
                        "height": video.h
                    }
                    metadata["has_video"] = True
                else:
                    # Audio-only file
                    metadata["fps"] = None
                    metadata["resolution"] = None
                    metadata["has_video"] = False
                    metadata["audio_only"] = True
            except (AttributeError, TypeError):
                # Audio-only file
                metadata["fps"] = None
                metadata["resolution"] = None
                metadata["has_video"] = False
                metadata["audio_only"] = True
            
            video.close()
            return metadata
            
        except Exception as e:
            self.logger.warning(f"Failed to extract video metadata: {e}")
            return {
                "filename": os.path.basename(video_path),
                "file_size_mb": round(os.path.getsize(video_path) / (1024 * 1024), 2),
                "has_audio": True,
                "has_video": False,
                "audio_only": True,
                "error": str(e)
            }
    
    def _create_learning_chunks(self, transcription: TranscriptionResult, 
                              subtopics: List) -> List[Dict[str, Any]]:
        """Create microlearning chunks from content"""
        chunks = []
        
        # Create chunks based on subtopics
        for i, subtopic in enumerate(subtopics):
            # Find relevant segments for this subtopic
            relevant_segments = [
                seg for seg in transcription.segments
                if seg.start_time >= subtopic.start_time and seg.end_time <= subtopic.end_time
            ]
            
            chunk_text = " ".join([seg.text for seg in relevant_segments])
            
            chunk = {
                "chunk_id": f"chunk_{i+1}",
                "title": subtopic.name,
                "content": chunk_text,
                "start_time": subtopic.start_time,
                "end_time": subtopic.end_time,
                "duration": subtopic.end_time - subtopic.start_time,
                "keywords": subtopic.keywords,
                "importance_score": subtopic.importance_score,
                "estimated_read_time": max(1, len(chunk_text.split()) / 200),  # ~200 wpm
                "learning_objectives": [
                    f"Understand {concept}" for concept in subtopic.keywords[:3]
                ]
            }
            
            chunks.append(chunk)
        
        # If no subtopics found, create time-based chunks
        if not chunks:
            time_chunks = self.transcription_service.get_transcript_chunks(
                transcription, chunk_duration=120  # 2-minute chunks
            )
            
            for i, time_chunk in enumerate(time_chunks):
                chunk = {
                    "chunk_id": f"time_chunk_{i+1}",
                    "title": f"Segment {i+1}",
                    "content": time_chunk.text,
                    "start_time": time_chunk.start_time,
                    "end_time": time_chunk.end_time,
                    "duration": time_chunk.end_time - time_chunk.start_time,
                    "keywords": self.topic_analysis_service.extract_key_phrases(
                        time_chunk.text, 5
                    ),
                    "importance_score": 0.5,
                    "estimated_read_time": max(1, len(time_chunk.text.split()) / 200)
                }
                chunks.append(chunk)
        
        return chunks
    
    def _generate_tags(self, course_details: CourseDetails, 
                      module_details: ModuleDetails,
                      main_topics: List[str], key_concepts: List[str]) -> List[str]:
        """Generate comprehensive tags for the content"""
        tags = []
        
        # Course and module tags
        tags.extend(course_details.tags)
        tags.append(course_details.category)
        tags.append(course_details.difficulty_level.value)
        tags.append(module_details.content_type.value)
        
        # Content-based tags
        tags.extend([topic.lower() for topic in main_topics])
        tags.extend([concept.lower() for concept in key_concepts[:10]])
        
        # Clean and deduplicate
        tags = [tag.strip().lower() for tag in tags if tag and len(tag) > 2]
        tags = list(set(tags))  # Remove duplicates
        
        return tags[:20]  # Limit to 20 tags
    
    def _create_searchable_text(self, transcription: TranscriptionResult,
                              subtopics: List, tags: List[str]) -> str:
        """Create optimized searchable text"""
        searchable_parts = [
            transcription.full_text,
            " ".join([subtopic.name for subtopic in subtopics]),
            " ".join([kw for subtopic in subtopics for kw in subtopic.keywords]),
            " ".join(tags)
        ]
        
        return " ".join(searchable_parts)
    
    def _update_status(self, content_id: str, progress: float = None, 
                      message: str = None):
        """Update processing status"""
        if content_id in self.processing_status:
            if progress is not None:
                self.processing_status[content_id].progress = progress
            if message:
                self.processing_status[content_id].message = message
    
    def get_processing_status(self, content_id: str) -> ProcessingStatus:
        """Get current processing status"""
        return self.processing_status.get(content_id)
    
    def search_content(self, query: str, processed_contents: List[ProcessedContent],
                      max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search through processed content
        
        Args:
            query: Search query
            processed_contents: List of ProcessedContent to search
            max_results: Maximum results to return
            
        Returns:
            List of search results with relevance scores
        """
        results = []
        query_lower = query.lower()
        
        for content in processed_contents:
            relevance_score = 0.0
            
            # Search in different fields with different weights
            searchable = content.searchable_text.lower()
            if query_lower in searchable:
                relevance_score += searchable.count(query_lower) * 1.0
            
            # Higher weight for matches in titles and topics
            if query_lower in content.course_details.course_name.lower():
                relevance_score += 5.0
            if query_lower in content.module_details.module_name.lower():
                relevance_score += 4.0
            
            for topic in content.main_topics:
                if query_lower in topic.lower():
                    relevance_score += 3.0
            
            for tag in content.tags:
                if query_lower in tag:
                    relevance_score += 2.0
            
            if relevance_score > 0:
                results.append({
                    "content_id": content.content_id,
                    "course_name": content.course_details.course_name,
                    "module_name": content.module_details.module_name,
                    "relevance_score": relevance_score,
                    "matched_content": content
                })
        
        # Sort by relevance and return top results
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:max_results]
