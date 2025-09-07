from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class ContentType(str, Enum):
    LECTURE = "lecture"
    TUTORIAL = "tutorial"
    DEMONSTRATION = "demonstration"
    DISCUSSION = "discussion"
    ASSESSMENT = "assessment"

class CourseDetails(BaseModel):
    """Course information model"""
    course_id: str = Field(..., description="Unique course identifier")
    course_name: str = Field(..., description="Name of the course")
    course_description: Optional[str] = Field(None, description="Course description")
    instructor: str = Field(..., description="Course instructor name")
    category: str = Field(..., description="Course category/subject")
    difficulty_level: DifficultyLevel = Field(..., description="Course difficulty level")
    tags: List[str] = Field(default_factory=list, description="Course tags")
    created_at: datetime = Field(default_factory=datetime.now)

class ModuleDetails(BaseModel):
    """Module information model"""
    module_id: str = Field(..., description="Unique module identifier")
    module_name: str = Field(..., description="Name of the module")
    module_description: Optional[str] = Field(None, description="Module description")
    order: int = Field(..., description="Order of module in course")
    duration_estimate: Optional[int] = Field(None, description="Estimated duration in minutes")
    learning_objectives: List[str] = Field(default_factory=list, description="Learning objectives")
    prerequisites: List[str] = Field(default_factory=list, description="Prerequisites")
    content_type: ContentType = Field(..., description="Type of content")

class TimestampedSegment(BaseModel):
    """Timestamped text segment"""
    start_time: float = Field(..., description="Start time in seconds")
    end_time: float = Field(..., description="End time in seconds")
    text: str = Field(..., description="Transcribed text")
    confidence: Optional[float] = Field(None, description="Transcription confidence")

class Subtopic(BaseModel):
    """Identified subtopic within content"""
    subtopic_id: str = Field(..., description="Unique subtopic identifier")
    name: str = Field(..., description="Subtopic name")
    keywords: List[str] = Field(..., description="Key terms related to subtopic")
    start_time: float = Field(..., description="When subtopic begins")
    end_time: float = Field(..., description="When subtopic ends")
    importance_score: float = Field(..., ge=0, le=1, description="Importance score 0-1")
    related_concepts: List[str] = Field(default_factory=list, description="Related concepts")

class TranscriptionResult(BaseModel):
    """Complete transcription result"""
    full_text: str = Field(..., description="Complete transcribed text")
    segments: List[TimestampedSegment] = Field(..., description="Timestamped segments")
    language: str = Field(..., description="Detected language")
    processing_time: float = Field(..., description="Processing time in seconds")
    word_count: int = Field(..., description="Total word count")

class ProcessedContent(BaseModel):
    """Complete processed content structure"""
    content_id: str = Field(..., description="Unique content identifier")
    course_details: CourseDetails = Field(..., description="Course information")
    module_details: ModuleDetails = Field(..., description="Module information")
    
    # Video metadata
    video_metadata: Dict[str, Any] = Field(..., description="Video file metadata")
    
    # Transcription results
    transcription: TranscriptionResult = Field(..., description="Transcription results")
    
    # Topic analysis
    subtopics: List[Subtopic] = Field(..., description="Identified subtopics")
    main_topics: List[str] = Field(..., description="Main topics covered")
    key_concepts: List[str] = Field(..., description="Key concepts identified")
    
    # Microlearning segments
    learning_chunks: List[Dict[str, Any]] = Field(..., description="Segmented learning chunks")
    
    # Search and recommendation data
    searchable_text: str = Field(..., description="Processed text for search")
    tags: List[str] = Field(..., description="Generated tags")
    embeddings: Optional[List[float]] = Field(None, description="Text embeddings for similarity")
    
    # Processing metadata
    processed_at: datetime = Field(default_factory=datetime.now)
    processing_version: str = Field(default="1.0", description="Processing pipeline version")
    
class ProcessingStatus(BaseModel):
    """Processing status model"""
    content_id: str
    status: str  # processing, completed, failed
    progress: float  # 0-1
    message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_details: Optional[str] = None
