# Content Generator for EdTech Platform

Automatically generates structured educational course content with modules, lessons, and metadata in JSON format suitable for EdTech platforms.

## 🎯 Overview

This tool creates complete course structures with:
- **Structured modules** with organized lessons
- **Detailed lesson scripts** in text format
- **JSON metadata** for easy integration
- **Learning objectives** and keywords
- **Estimated durations** and difficulty levels

Perfect for creating content libraries, testing EdTech platforms, or generating educational material templates.

## 🚀 Quick Start

### Simple Generator (No Dependencies)
```bash
# Run the simple generator (works out of the box)
cd content_generator
python simple_generator.py
```

### Advanced Generator (With Audio)
```bash
# Install dependencies for audio generation
pip install -r requirements.txt

# Run the advanced generator
python content_generator.py
```

## 📊 Generated Structure

The generator creates this organized structure:

```
content_library/
└── course_12ab34cd/                    # Unique course ID
    ├── course_info.json               # Course metadata
    ├── module_01_introduction/        # Module directory
    │   ├── module_info.json          # Module metadata
    │   ├── lesson_01_what_is_data_science_script.txt
    │   ├── lesson_01_what_is_data_science_info.json
    │   ├── lesson_02_applications_script.txt
    │   ├── lesson_02_applications_info.json
    │   └── lesson_03_tools_script.txt
    ├── module_02_python_analysis/
    │   ├── module_info.json
    │   ├── lesson_01_python_basics_script.txt
    │   ├── lesson_01_python_basics_info.json
    │   └── ...
    └── module_03_statistics/
        └── ...
```

## 📋 Available Course Topics

### Pre-built Templates:
- **Data Science** - Complete data science curriculum
- **Web Development** - Full-stack web development
- **Machine Learning** - Applied ML with projects

### Custom Topics:
- Enter any topic and the generator creates appropriate modules
- Automatically categorizes and structures content
- Generates relevant learning objectives

## 📄 Sample Output Files

### Course Metadata (`course_info.json`)
```json
{
  "course_id": "course_12ab34cd",
  "course_name": "Complete Data Science Course",
  "topic": "Data Science",
  "description": "Learn data science from basics to advanced applications",
  "difficulty": "intermediate",
  "estimated_hours": 40,
  "instructor": "AI Generated Content",
  "category": "Technology & Analytics",
  "created_at": "2025-09-06T14:30:00",
  "modules": [...]
}
```

### Lesson Script (`lesson_01_what_is_data_science_script.txt`)
```
Welcome to our lesson on "What is Data Science?"

Data science is an interdisciplinary field that combines statistics, 
programming, and domain expertise to extract insights from data...

[Detailed lesson content with explanations, examples, and key concepts]
```

### Lesson Metadata (`lesson_01_what_is_data_science_info.json`)
```json
{
  "lesson_info": {
    "lesson_id": "lesson_ef56gh78",
    "title": "What is Data Science?",
    "order": 1,
    "estimated_duration_minutes": 15
  },
  "script_file": "lesson_01_what_is_data_science_script.txt",
  "word_count": 245,
  "estimated_read_time_minutes": 1.225,
  "keywords": ["data", "science", "analysis"],
  "learning_objectives": [
    "Understand the fundamentals of What is Data Science?",
    "Apply What is Data Science? concepts in practical scenarios"
  ]
}
```

## 🔧 Customization Options

### Simple Generator
```python
from simple_generator import SimpleContentGenerator

# Initialize
generator = SimpleContentGenerator("./my_content_library")

# Generate course
course = generator.generate_course("Machine Learning")
```

### Programmatic Usage
```python
# Custom course generation
generator = SimpleContentGenerator("./content")

# Available topics with templates
topics = [
    "Data Science",
    "Web Development", 
    "Machine Learning",
    "Python Programming",  # Will generate generic structure
    "Digital Marketing"    # Will generate generic structure
]

for topic in topics:
    generator.generate_course(topic)
```

## 📈 Content Quality

### Lesson Scripts Include:
- **Introduction** with context and objectives
- **Core concepts** with clear explanations  
- **Practical applications** and real-world examples
- **Best practices** and common pitfalls
- **Summary** and next steps

### Metadata Provides:
- **Learning objectives** for each lesson
- **Keywords** extracted from content
- **Time estimates** for reading and completion
- **Difficulty levels** and prerequisites
- **Unique IDs** for database integration

## 🎯 Use Cases

### EdTech Platform Testing
```python
# Generate test content for platform development
generator = SimpleContentGenerator("./test_content")

test_courses = ["Python", "JavaScript", "SQL", "React"]
for course in test_courses:
    generator.generate_course(course)
```

### Content Library Seeding
```python
# Create initial content library
generator = SimpleContentGenerator("./production_content")

# Generate multiple courses
courses = {
    "Data Science": "Complete data science curriculum",
    "Web Development": "Full-stack development course",
    "Digital Marketing": "Modern marketing strategies"
}

for topic in courses:
    generator.generate_course(topic)
```

### LMS Integration
The JSON metadata is designed for easy integration with Learning Management Systems:

- **Unique IDs** for database records
- **Structured hierarchy** (course → module → lesson)
- **Time estimates** for progress tracking
- **Keywords** for search functionality
- **Learning objectives** for assessment alignment

## 🗂️ File Organization

### Easy Content Management:
- **Separate directories** for each course and module
- **Consistent naming** conventions for automation
- **JSON metadata** for programmatic access
- **Text scripts** for human readability
- **Unique IDs** prevent conflicts

### Bulk Operations:
```python
import json
from pathlib import Path

# Process all courses in content library
content_dir = Path("content_library")
for course_dir in content_dir.iterdir():
    if course_dir.is_dir():
        # Load course metadata
        with open(course_dir / "course_info.json") as f:
            course = json.load(f)
        
        print(f"Course: {course['course_name']}")
        print(f"Modules: {len(course['modules'])}")
```

## 🔮 Future Enhancements

### Planned Features:
- **Audio generation** with multiple TTS engines
- **Video content** creation with slides
- **Interactive exercises** and quizzes
- **Multi-language** support
- **Assessment generation** with questions
- **Progress tracking** templates

### Integration Options:
- **API endpoints** for web integration
- **Database connectors** for direct import
- **LMS plugins** for popular platforms
- **Batch processing** for large content libraries

---

**Ready to generate structured educational content?**

Start with the simple generator for immediate results, or install dependencies for enhanced features including audio generation!

## 🛠️ Technical Details

- **No external dependencies** for simple generator
- **Pure Python** implementation
- **Cross-platform** compatible
- **JSON format** for universal compatibility
- **Unicode support** for international content
- **Extensible design** for custom templates
