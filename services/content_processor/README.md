# Microlearning Content Processor

A streamlined AI-powered system that processes video and audio content into structured microlearning modules with real-time progress tracking.

## 🎯 Overview

This content processor automatically transforms multimedia educational content:
- **Transcribes** audio/video to text using OpenAI Whisper
- **Identifies** topics and subtopics within the content  
- **Structures** content into digestible microlearning chunks
- **Analyzes** key concepts and generates searchable metadata
- **Exports** structured data ready for integration

## ✨ Key Features

### 🔊 Smart Audio Processing
- Supports both video (MP4, AVI, MOV, etc.) and audio (MP3, WAV, M4A, etc.) files
- Automatic ffmpeg detection and configuration for video processing
- Multiple Whisper model sizes for speed vs accuracy optimization
- Automatic language detection and timestamped segments

### 🧠 Intelligent Content Analysis  
- Topic identification and subtopic extraction
- Key concept and keyword extraction
- Learning objective generation
- Content difficulty assessment

### 📊 Real-time Progress Tracking
- 6-stage processing pipeline with detailed progress updates
- Error handling with clear diagnostic messages
- Processing time estimation and performance metrics

## 🚀 Quick Start

### Installation
```bash
# Install Python dependencies
pip install -r requirements.txt

# Download language model for NLP
python -m spacy download en_core_web_sm

# For video processing, ensure FFmpeg is installed and in PATH
# Windows: Download from https://ffmpeg.org/download.html
```

### Basic Usage
```bash
# Process an audio file
python processor.py "sample.mp3" "Course Name" "Module Name" "Instructor"

# Process a video file (requires FFmpeg)
python processor.py "sample.mp4" "Course Name" "Module Name" "Instructor"
```

### Programmatic Usage
```python
from processor import MicrolearningProcessor

# Initialize processor
processor = MicrolearningProcessor(whisper_model="base")

# Process content
result = processor.process_video(
    video_path="lecture.mp4",
    course_name="Introduction to AI",
    module_name="Neural Networks", 
    instructor="Dr. Smith"
)

print(f"Content ID: {result.content_id}")
print(f"Transcribed {result.transcription.word_count} words")
print(f"Identified {len(result.subtopics)} subtopics")
```

## 📊 Processing Pipeline

The system processes content through 6 distinct stages:

1. **INITIALIZATION** (0-5%) - File validation and setup
2. **PREPROCESSING** (5-20%) - Metadata extraction and audio preparation  
3. **TRANSCRIPTION** (20-72%) - AI-powered speech-to-text conversion
4. **ANALYSIS** (72-82%) - Topic identification and content analysis
5. **STRUCTURING** (82-95%) - Learning chunk creation and organization
6. **COMPLETION** (95-100%) - Final data structuring and export

## 📋 Output Structure

The processor generates comprehensive structured data:

```json
{
  "content_id": "unique-identifier",
  "course_details": {
    "course_name": "Introduction to AI",
    "instructor": "Dr. Smith",
    "difficulty_level": "intermediate"
  },
  "module_details": {
    "module_name": "Neural Networks",
    "content_type": "lecture"
  },
  "transcription": {
    "full_text": "Complete transcribed text...",
    "word_count": 369,
    "language": "en",
    "processing_time": 9.45,
    "segments": [...]
  },
  "subtopics": [
    {
      "name": "Deep Learning Basics",
      "keywords": ["neural", "networks", "layers"],
      "importance_score": 0.85
    }
  ],
  "learning_chunks": [
    {
      "chunk_id": "chunk_1",
      "title": "Introduction to Neural Networks", 
      "content": "Neural networks are...",
      "estimated_read_time": 2.5
    }
  ],
  "main_topics": ["neural networks", "deep learning", "AI"],
  "key_concepts": ["backpropagation", "activation functions"],
  "tags": ["ai", "machine learning", "neural networks"],
  "metadata": {
    "duration_seconds": 140.85,
    "processed_at": "2025-09-06T13:55:01"
  }
}
```

## 🔧 Configuration

### Whisper Model Options
```python
# Fast processing, lower accuracy
processor = MicrolearningProcessor(whisper_model="tiny")

# Balanced (recommended)
processor = MicrolearningProcessor(whisper_model="base") 

# High accuracy, slower processing
processor = MicrolearningProcessor(whisper_model="large")
```

### Supported File Formats

**Audio Files** (Direct processing):
- MP3, WAV, M4A, FLAC, OGG, AAC

**Video Files** (Requires FFmpeg):
- MP4, AVI, MOV, MKV, WMV, FLV, WEBM

## 📁 Project Structure

```
microlearning_content_processor/
├── processor.py              # Main processing interface
├── requirements.txt          # Python dependencies
├── models/
│   └── data_models.py       # Data structure definitions
├── services/
│   ├── transcription_service.py    # Whisper integration
│   ├── topic_analysis_service.py   # NLP analysis
│   └── content_processor.py        # Main orchestrator
└── utils/
    └── helpers.py           # Utility functions
```

## 🔍 Error Handling

The system provides clear error messages for common issues:

### FFmpeg Not Found
```
Error: FFmpeg not found in PATH or common installation directories
Solution: Install FFmpeg and ensure it's accessible from command line
```

### Unsupported File Format
```
Error: Unsupported format: .xyz
Solution: Convert to supported format (MP3, WAV, MP4, etc.)
```

### File Not Found
```
Error: File does not exist
Solution: Check file path and permissions
```

## 🚀 Performance

### Processing Speed (Base Model)
- **Audio files**: ~2-5x real-time (2min audio = 24-60sec processing)
- **Video files**: Add 10-30sec for audio extraction
- **Factors**: File size, audio quality, system specs, model size

### System Requirements
- **Minimum**: 4GB RAM, dual-core CPU
- **Recommended**: 8GB+ RAM, quad-core+ CPU
- **GPU**: Optional, provides 2-5x speedup for large models

## 🤝 Integration Examples

### Flask API
```python
from flask import Flask, request, jsonify
from processor import MicrolearningProcessor

app = Flask(__name__)
processor = MicrolearningProcessor()

@app.route('/process', methods=['POST'])
def process_content():
    file = request.files['file']
    # Save and process file
    result = processor.process_video(
        video_path=file.filename,
        **request.form.to_dict()
    )
    return jsonify(result.dict())
```

### Batch Processing
```python
import os
from processor import MicrolearningProcessor

def process_directory(input_dir, output_dir):
    processor = MicrolearningProcessor()
    
    for filename in os.listdir(input_dir):
        if filename.endswith(('.mp4', '.mp3', '.wav')):
            result = processor.process_video(
                video_path=os.path.join(input_dir, filename),
                course_name="Batch Course",
                module_name=filename.split('.')[0],
                instructor="Auto-generated"
            )
            
            # Save result
            output_file = os.path.join(output_dir, f"{result.content_id}.json")
            with open(output_file, 'w') as f:
                f.write(result.json())
```

## 🎯 Use Cases

- **Educational Platforms**: Process lecture recordings into searchable modules
- **Corporate Training**: Transform training videos into structured content
- **Content Management**: Automatically organize and index multimedia libraries
- **E-learning Development**: Create microlearning modules from existing content
- **Accessibility**: Generate transcripts and structured content for better access

## 📈 Dependencies

Core requirements:
```
openai-whisper==20231117
moviepy==1.0.3
spacy==3.7.2
scikit-learn==1.3.0
nltk==3.8.1
torch==2.0.1
pydantic==2.4.2
```

## 🔮 Future Enhancements

Planned improvements:
- Batch processing interface
- Real-time processing for live streams
- Advanced topic modeling
- Multi-language content analysis
- Integration with popular LMS platforms
- GPU acceleration optimization

---

**Transform your multimedia content into structured microlearning modules today!**

For questions or support, check the examples in the codebase or refer to the inline documentation.
