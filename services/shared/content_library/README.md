# Content Library - Generated Educational Courses

This directory contains automatically generated educational courses with structured modules, lessons, and media files.

## 📚 Available Courses

### Complete Data Science Masterclass
- **Instructor**: Dr. Sarah Chen
- **Difficulty**: Intermediate
- **Duration**: 45 hours
- **Modules**: 4 modules, 12 lessons total
- **Format**: MP4 videos, text transcripts, JSON metadata

## 📁 Folder Structure

```
course_name/
├── course_metadata.json           # Course overview and structure
├── Module_01_[name]/             # First module
│   ├── module_metadata.json     # Module information
│   ├── Lesson_01_[name]/         # Individual lesson
│   │   ├── lesson_video.mp4     # Video content with narration
│   │   ├── lesson_transcript.txt # Full lesson transcript
│   │   └── lesson_metadata.json # Lesson details and metadata
│   ├── Lesson_02_[name]/
│   └── Lesson_03_[name]/
├── Module_02_[name]/
├── Module_03_[name]/
└── Module_04_[name]/
```

## 🎯 Content Features

### Video Files
- **Format**: MP4 with audio narration
- **Quality**: Generated using Windows Speech API or Google TTS
- **Duration**: Matches educational pacing (12-30 minutes per lesson)
- **Content**: Comprehensive explanations with examples

### Transcripts
- **Format**: Plain text (.txt files)
- **Content**: Complete lesson scripts with detailed explanations
- **Quality**: Professional educational content
- **Length**: 1000-2000 words per lesson

### Metadata
- **Format**: JSON for easy integration
- **Content**: Learning objectives, keywords, durations, difficulty
- **Structure**: Course → Module → Lesson hierarchy
- **IDs**: Unique identifiers for database integration

## 📊 Course Content Overview

### Module 1: Introduction to Data Science (45 min)
1. **What is Data Science** (12 min) - Field overview and applications
2. **Data Science Workflow** (15 min) - Project methodology and process
3. **Tools and Environment Setup** (18 min) - Software and tools introduction

### Module 2: Python Programming Fundamentals (75 min)
1. **Python Basics for Data Science** (20 min) - Core programming concepts
2. **Working with NumPy Arrays** (25 min) - Numerical computing
3. **Pandas DataFrame Operations** (30 min) - Data manipulation

### Module 3: Statistical Analysis and Visualization (60 min)
1. **Descriptive Statistics** (18 min) - Central tendency and spread
2. **Data Visualization with Matplotlib** (22 min) - Chart creation
3. **Advanced Plotting with Seaborn** (20 min) - Statistical visualizations

### Module 4: Machine Learning Applications (75 min)
1. **Supervised Learning Overview** (25 min) - Classification and regression
2. **Unsupervised Learning Methods** (22 min) - Clustering and reduction
3. **Model Evaluation and Validation** (28 min) - Performance assessment

## 🔧 Technical Details

### File Formats
- **Video**: MP4 (H.264 codec, AAC audio)
- **Transcript**: UTF-8 encoded text
- **Metadata**: JSON with comprehensive structure

### Integration Ready
- **LMS Compatible**: Structured for Learning Management Systems
- **API Friendly**: JSON metadata for web applications
- **Database Ready**: Unique IDs and hierarchical structure
- **Search Optimized**: Keywords and topics for content discovery

### Quality Assurance
- **Content Accuracy**: Professionally written educational material
- **Consistent Structure**: Standardized format across all lessons
- **Proper Naming**: Clean filenames and folder organization
- **Complete Metadata**: All necessary information for cataloging

## 🚀 Usage Examples

### Loading Course Data
```python
import json

# Load course metadata
with open('complete_data_science_masterclass/course_metadata.json') as f:
    course = json.load(f)

print(f"Course: {course['course_name']}")
print(f"Total Modules: {course['total_modules']}")

# Access specific lesson
lesson_path = "Module_01_introduction_to_data_science/Lesson_01_what_is_data_science/"
with open(lesson_path + "lesson_metadata.json") as f:
    lesson = json.load(f)

print(f"Lesson: {lesson['lesson_info']['title']}")
print(f"Duration: {lesson['lesson_info']['duration_minutes']} minutes")
```

### Processing All Courses
```python
from pathlib import Path

content_dir = Path(".")
for course_dir in content_dir.iterdir():
    if course_dir.is_dir() and (course_dir / "course_metadata.json").exists():
        with open(course_dir / "course_metadata.json") as f:
            course = json.load(f)
        
        print(f"Found course: {course['course_name']}")
        print(f"  Instructor: {course['instructor']}")
        print(f"  Modules: {len(course['modules'])}")
```

## 📈 Content Statistics

- **Total Videos**: 12 MP4 files with narration
- **Total Transcripts**: 12 detailed lesson scripts
- **Total Metadata**: 17 JSON files (1 course + 4 modules + 12 lessons)
- **Estimated Content**: ~4.5 hours of video material
- **Word Count**: ~20,000 words of educational content

## 🔮 Extension Possibilities

- **Additional Courses**: Generate more topics using the content generator
- **Language Support**: Translate content to other languages
- **Interactive Elements**: Add quizzes and assessments
- **Video Enhancement**: Add slides, animations, or captions
- **Mobile Optimization**: Create mobile-friendly versions

---

**Generated by**: Enhanced Content Generator v1.0  
**Created**: September 6, 2025  
**Format**: Educational content library for EdTech platforms
