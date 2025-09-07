import os
import hashlib
import json
from typing import Any, Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def generate_content_id(course_id: str, module_id: str, filename: str) -> str:
    """Generate unique content ID based on course, module, and file"""
    content_string = f"{course_id}_{module_id}_{filename}_{datetime.now().isoformat()}"
    return hashlib.md5(content_string.encode()).hexdigest()

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    # Remove or replace problematic characters
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    
    # Limit length
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]
    
    return f"{name}{ext}"

def format_duration(seconds: float) -> str:
    """Format duration in seconds to human-readable string"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds = int(seconds % 60)
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes:02d}:{seconds:02d}"

def calculate_reading_time(text: str, wpm: int = 200) -> float:
    """Calculate estimated reading time for text"""
    word_count = len(text.split())
    return max(1, word_count / wpm)  # At least 1 minute

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    import re
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters but keep punctuation
    text = re.sub(r'[^\w\s\.,!?;:\-\(\)]', '', text)
    
    return text.strip()

def extract_keywords_simple(text: str, max_keywords: int = 10) -> List[str]:
    """Simple keyword extraction as fallback"""
    import re
    from collections import Counter
    
    # Common stop words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    }
    
    # Extract words
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    
    # Filter out stop words and get most common
    filtered_words = [word for word in words if word not in stop_words]
    word_counts = Counter(filtered_words)
    
    return [word for word, count in word_counts.most_common(max_keywords)]

def validate_video_file(file_path: str) -> Dict[str, Any]:
    """Validate video/audio file and return basic info"""
    result = {
        "valid": False,
        "error": None,
        "info": {}
    }
    
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            result["error"] = "File does not exist"
            return result
        
        # Check file size
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            result["error"] = "File is empty"
            return result
        
        # Check file extension - support both video and audio formats
        _, ext = os.path.splitext(file_path)
        video_formats = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']
        audio_formats = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac']
        supported_formats = video_formats + audio_formats
        
        if ext.lower() not in supported_formats:
            result["error"] = f"Unsupported format: {ext}. Supported formats: {', '.join(supported_formats)}"
            return result
        
        # Determine file type
        file_type = "video" if ext.lower() in video_formats else "audio"
        
        result["valid"] = True
        result["info"] = {
            "file_size": file_size,
            "file_size_mb": round(file_size / (1024 * 1024), 2),
            "format": ext.lower(),
            "filename": os.path.basename(file_path),
            "file_type": file_type
        }
        
    except Exception as e:
        result["error"] = f"Validation error: {str(e)}"
        logger.error(f"File validation failed: {e}")
    
    return result

def create_learning_objectives(keywords: List[str], content_type: str = "general") -> List[str]:
    """Generate learning objectives based on keywords"""
    objectives = []
    
    # Templates based on content type
    templates = {
        "lecture": [
            "Understand the concept of {}",
            "Learn about {}",
            "Explain the principles of {}"
        ],
        "tutorial": [
            "Learn how to {}",
            "Practice {}",
            "Apply {} techniques"
        ],
        "demonstration": [
            "Observe {} in action",
            "Understand how {} works",
            "Identify key aspects of {}"
        ],
        "general": [
            "Understand {}",
            "Learn about {}",
            "Explore {}"
        ]
    }
    
    template_list = templates.get(content_type.lower(), templates["general"])
    
    for i, keyword in enumerate(keywords[:3]):  # Max 3 objectives
        template = template_list[i % len(template_list)]
        objectives.append(template.format(keyword))
    
    return objectives

def export_to_json(data: Dict[str, Any], file_path: str, indent: int = 2) -> bool:
    """Export data to JSON file"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=indent, ensure_ascii=False, default=str)
        return True
    except Exception as e:
        logger.error(f"Failed to export to JSON: {e}")
        return False

def load_from_json(file_path: str) -> Optional[Dict[str, Any]]:
    """Load data from JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load from JSON: {e}")
        return None

def calculate_confidence_score(transcription_segments: List) -> float:
    """Calculate overall confidence score from transcription segments"""
    if not transcription_segments:
        return 0.0
    
    confidences = []
    for segment in transcription_segments:
        if hasattr(segment, 'confidence') and segment.confidence is not None:
            confidences.append(segment.confidence)
    
    if not confidences:
        return 0.8  # Default confidence if not available
    
    return sum(confidences) / len(confidences)

def split_into_sentences(text: str) -> List[str]:
    """Split text into sentences"""
    import re
    
    # Simple sentence splitting
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    return sentences

def merge_similar_topics(topics: List[str], similarity_threshold: float = 0.7) -> List[str]:
    """Merge similar topics to reduce redundancy"""
    if len(topics) <= 1:
        return topics
    
    merged = []
    used_indices = set()
    
    for i, topic1 in enumerate(topics):
        if i in used_indices:
            continue
        
        similar_topics = [topic1]
        used_indices.add(i)
        
        for j, topic2 in enumerate(topics[i+1:], i+1):
            if j in used_indices:
                continue
            
            # Simple similarity check based on common words
            words1 = set(topic1.lower().split())
            words2 = set(topic2.lower().split())
            
            if words1 and words2:
                similarity = len(words1.intersection(words2)) / len(words1.union(words2))
                if similarity >= similarity_threshold:
                    similar_topics.append(topic2)
                    used_indices.add(j)
        
        # Use the longest topic name as representative
        representative = max(similar_topics, key=len)
        merged.append(representative)
    
    return merged
