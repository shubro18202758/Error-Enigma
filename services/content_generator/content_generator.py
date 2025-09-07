"""
Content Library Generator for EdTech Platform
Automatically generates structured course modules with audio content and metadata
"""

import os
import json
import requests
from datetime import datetime
from typing import List, Dict, Any
import uuid
from pathlib import Path

class ContentGenerator:
    """Generate structured educational content with audio files and metadata"""
    
    def __init__(self, content_library_path: str):
        self.content_library_path = Path(content_library_path)
        self.content_library_path.mkdir(exist_ok=True)
        
    def generate_course_content(self, topic: str, num_modules: int = 4, 
                              audio_per_module: int = 3) -> Dict[str, Any]:
        """
        Generate complete course structure with modules and audio content
        
        Args:
            topic: Main course topic (e.g., "Data Science")
            num_modules: Number of modules to generate
            audio_per_module: Number of audio lessons per module
            
        Returns:
            Course structure with metadata
        """
        print(f"🚀 Generating course content for: {topic}")
        
        # Generate course structure
        course_info = self._generate_course_structure(topic, num_modules)
        course_id = course_info["course_id"]
        
        # Create course directory
        course_path = self.content_library_path / course_id
        course_path.mkdir(exist_ok=True)
        
        # Generate modules
        for module_idx, module_info in enumerate(course_info["modules"]):
            print(f"📚 Creating Module {module_idx + 1}: {module_info['name']}")
            
            # Create module directory
            module_path = course_path / f"module_{module_idx + 1:02d}_{module_info['id']}"
            module_path.mkdir(exist_ok=True)
            
            # Generate audio content for this module
            audio_files = []
            for audio_idx in range(audio_per_module):
                print(f"🎵 Generating audio {audio_idx + 1}/{audio_per_module} for {module_info['name']}")
                
                audio_info = self._generate_audio_lesson(
                    module_info, audio_idx, module_path
                )
                audio_files.append(audio_info)
            
            # Save module metadata
            module_metadata = {
                "module_info": module_info,
                "audio_lessons": audio_files,
                "created_at": datetime.now().isoformat(),
                "total_lessons": len(audio_files)
            }
            
            with open(module_path / "module_metadata.json", 'w') as f:
                json.dump(module_metadata, f, indent=2)
        
        # Save course metadata
        course_info["created_at"] = datetime.now().isoformat()
        course_info["total_modules"] = len(course_info["modules"])
        
        with open(course_path / "course_metadata.json", 'w') as f:
            json.dump(course_info, f, indent=2)
        
        print(f"✅ Course '{topic}' generated successfully at: {course_path}")
        return course_info
    
    def _generate_course_structure(self, topic: str, num_modules: int) -> Dict[str, Any]:
        """Generate course structure based on topic"""
        
        # Course templates by topic
        course_templates = {
            "data science": {
                "description": "Comprehensive introduction to data science concepts and techniques",
                "difficulty": "intermediate",
                "estimated_hours": 40,
                "modules": [
                    {"name": "Introduction to Data Science", "description": "Overview of data science field and applications"},
                    {"name": "Python for Data Analysis", "description": "Essential Python libraries and techniques"},
                    {"name": "Statistics and Probability", "description": "Statistical foundations for data analysis"},
                    {"name": "Data Visualization", "description": "Creating effective charts and visualizations"},
                    {"name": "Machine Learning Basics", "description": "Introduction to ML algorithms and concepts"},
                    {"name": "Data Processing and Cleaning", "description": "Preparing and cleaning datasets"}
                ]
            },
            "machine learning": {
                "description": "Hands-on machine learning course with practical applications",
                "difficulty": "advanced",
                "estimated_hours": 50,
                "modules": [
                    {"name": "ML Fundamentals", "description": "Core concepts and terminology"},
                    {"name": "Supervised Learning", "description": "Classification and regression techniques"},
                    {"name": "Unsupervised Learning", "description": "Clustering and dimensionality reduction"},
                    {"name": "Neural Networks", "description": "Deep learning and neural network architectures"},
                    {"name": "Model Evaluation", "description": "Validation, testing, and performance metrics"}
                ]
            },
            "web development": {
                "description": "Full-stack web development with modern technologies",
                "difficulty": "beginner",
                "estimated_hours": 60,
                "modules": [
                    {"name": "HTML & CSS Basics", "description": "Fundamental web markup and styling"},
                    {"name": "JavaScript Programming", "description": "Interactive web development with JS"},
                    {"name": "Frontend Frameworks", "description": "React, Vue, and modern frontend tools"},
                    {"name": "Backend Development", "description": "Server-side programming and APIs"},
                    {"name": "Database Integration", "description": "Working with databases and data storage"},
                    {"name": "Deployment & DevOps", "description": "Publishing and maintaining web applications"}
                ]
            }
        }
        
        # Get template or create generic one
        template = course_templates.get(topic.lower(), {
            "description": f"Comprehensive course on {topic}",
            "difficulty": "intermediate",
            "estimated_hours": 30,
            "modules": [
                {"name": f"{topic} Fundamentals", "description": f"Basic concepts of {topic}"},
                {"name": f"Advanced {topic}", "description": f"Advanced topics in {topic}"},
                {"name": f"{topic} Applications", "description": f"Real-world applications of {topic}"},
                {"name": f"{topic} Best Practices", "description": f"Industry best practices and standards"}
            ]
        })
        
        # Select modules based on requested number
        selected_modules = template["modules"][:num_modules]
        
        # Add IDs to modules
        for i, module in enumerate(selected_modules):
            module["id"] = f"mod_{uuid.uuid4().hex[:8]}"
            module["order"] = i + 1
        
        course_info = {
            "course_id": f"course_{uuid.uuid4().hex[:8]}",
            "course_name": topic.title(),
            "description": template["description"],
            "difficulty": template["difficulty"],
            "estimated_hours": template["estimated_hours"],
            "modules": selected_modules,
            "instructor": "AI Generated Content",
            "category": self._categorize_topic(topic)
        }
        
        return course_info
    
    def _categorize_topic(self, topic: str) -> str:
        """Categorize topic for better organization"""
        categories = {
            "data science": "Technology",
            "machine learning": "Technology", 
            "web development": "Technology",
            "programming": "Technology",
            "business": "Business",
            "marketing": "Business",
            "design": "Creative",
            "mathematics": "Science",
            "physics": "Science",
            "chemistry": "Science"
        }
        return categories.get(topic.lower(), "General")
    
    def _generate_audio_lesson(self, module_info: Dict, audio_idx: int, 
                             module_path: Path) -> Dict[str, Any]:
        """Generate audio lesson content and metadata"""
        
        # Generate lesson content based on module
        lesson_topics = self._get_lesson_topics(module_info["name"], audio_idx)
        
        # Create lesson script
        lesson_script = self._create_lesson_script(
            module_info["name"], 
            lesson_topics["title"],
            lesson_topics["content"]
        )
        
        # Generate audio file
        audio_filename = f"lesson_{audio_idx + 1:02d}_{lesson_topics['slug']}.wav"
        audio_path = module_path / audio_filename
        
        # Create audio using text-to-speech (placeholder for now)
        self._create_audio_file(lesson_script, audio_path)
        
        # Create lesson metadata
        lesson_info = {
            "lesson_id": f"lesson_{uuid.uuid4().hex[:8]}",
            "title": lesson_topics["title"],
            "description": lesson_topics["description"],
            "audio_file": audio_filename,
            "script": lesson_script,
            "duration_seconds": len(lesson_script.split()) * 0.5,  # Estimate based on words
            "order": audio_idx + 1,
            "keywords": lesson_topics["keywords"],
            "learning_objectives": lesson_topics["objectives"]
        }
        
        # Save lesson script as text file
        script_filename = f"lesson_{audio_idx + 1:02d}_{lesson_topics['slug']}_script.txt"
        with open(module_path / script_filename, 'w', encoding='utf-8') as f:
            f.write(lesson_script)
        
        return lesson_info
    
    def _get_lesson_topics(self, module_name: str, lesson_index: int) -> Dict[str, Any]:
        """Generate lesson topics based on module name and index"""
        
        lesson_templates = {
            "Introduction to Data Science": [
                {
                    "title": "What is Data Science?",
                    "slug": "intro_data_science",
                    "description": "Overview of data science field and career opportunities",
                    "keywords": ["data science", "analytics", "big data", "statistics"],
                    "objectives": ["Understand what data science is", "Learn about career paths", "Explore applications"]
                },
                {
                    "title": "Data Science Workflow", 
                    "slug": "ds_workflow",
                    "description": "Step-by-step process of a typical data science project",
                    "keywords": ["workflow", "process", "methodology", "project lifecycle"],
                    "objectives": ["Learn the data science process", "Understand project phases", "Plan data projects"]
                },
                {
                    "title": "Tools and Technologies",
                    "slug": "ds_tools", 
                    "description": "Essential tools and programming languages for data science",
                    "keywords": ["Python", "R", "SQL", "tools", "libraries"],
                    "objectives": ["Identify key tools", "Choose appropriate technologies", "Set up development environment"]
                }
            ],
            "Python for Data Analysis": [
                {
                    "title": "Python Basics for Data Science",
                    "slug": "python_basics",
                    "description": "Essential Python programming concepts for data analysis",
                    "keywords": ["Python", "variables", "data types", "functions"],
                    "objectives": ["Master Python basics", "Write simple programs", "Understand data structures"]
                },
                {
                    "title": "NumPy and Pandas",
                    "slug": "numpy_pandas",
                    "description": "Working with numerical data and dataframes",
                    "keywords": ["NumPy", "Pandas", "arrays", "dataframes", "data manipulation"],
                    "objectives": ["Use NumPy for numerical computing", "Manipulate data with Pandas", "Clean and transform datasets"]
                },
                {
                    "title": "Data Loading and Processing",
                    "slug": "data_processing",
                    "description": "Reading, cleaning, and preparing data for analysis",
                    "keywords": ["data loading", "CSV", "cleaning", "preprocessing"],
                    "objectives": ["Load data from various sources", "Clean messy data", "Prepare data for analysis"]
                }
            ],
            "Statistics and Probability": [
                {
                    "title": "Descriptive Statistics",
                    "slug": "descriptive_stats",
                    "description": "Measures of central tendency and variability",
                    "keywords": ["mean", "median", "mode", "standard deviation", "statistics"],
                    "objectives": ["Calculate descriptive statistics", "Interpret statistical measures", "Summarize data distributions"]
                },
                {
                    "title": "Probability Fundamentals",
                    "slug": "probability_basics",
                    "description": "Basic probability concepts and distributions",
                    "keywords": ["probability", "distributions", "random variables", "Bayes theorem"],
                    "objectives": ["Understand probability concepts", "Work with distributions", "Apply probability rules"]
                },
                {
                    "title": "Hypothesis Testing",
                    "slug": "hypothesis_testing",
                    "description": "Statistical inference and hypothesis testing methods",
                    "keywords": ["hypothesis testing", "p-values", "confidence intervals", "statistical significance"],
                    "objectives": ["Design statistical tests", "Interpret test results", "Make data-driven decisions"]
                }
            ]
        }
        
        # Get lessons for this module or create generic ones
        module_lessons = lesson_templates.get(module_name, [
            {
                "title": f"{module_name} - Part {lesson_index + 1}",
                "slug": f"lesson_{lesson_index + 1}",
                "description": f"Key concepts and techniques in {module_name}",
                "keywords": [module_name.lower(), "concepts", "techniques"],
                "objectives": [f"Understand {module_name} concepts", f"Apply {module_name} techniques"]
            }
        ])
        
        # Return the lesson at the given index, or cycle through available lessons
        return module_lessons[lesson_index % len(module_lessons)]
    
    def _create_lesson_script(self, module_name: str, lesson_title: str, 
                            lesson_content: Dict) -> str:
        """Create a realistic lesson script for text-to-speech"""
        
        script = f"""
Welcome to this lesson on {lesson_title}, part of the {module_name} module.

In this lesson, we'll explore {lesson_content.get('description', 'key concepts and applications')}.

Let's start with the fundamentals. {lesson_title} is an essential topic that builds upon previous concepts we've discussed. Understanding this material will help you develop practical skills and theoretical knowledge.

The key points we'll cover today include:

First, we'll examine the basic principles and definitions. These foundational concepts are crucial for your understanding of more advanced topics.

Next, we'll look at practical applications and real-world examples. This will help you see how these concepts are used in professional settings.

We'll also discuss common challenges and best practices. Learning from typical mistakes can accelerate your learning process.

Finally, we'll review the main takeaways and prepare for the next lesson. Make sure to practice the concepts we've discussed and review the additional materials.

Remember, learning is a gradual process. Don't worry if everything doesn't click immediately. With practice and repetition, these concepts will become second nature.

That concludes this lesson on {lesson_title}. In our next session, we'll build upon these concepts and explore more advanced topics. Thank you for your attention, and keep up the great work!
"""
        
        return script.strip()
    
    def _create_audio_file(self, text: str, audio_path: Path):
        """Create audio file from text using text-to-speech"""
        
        try:
            # Try using Windows SAPI (built-in TTS)
            import win32com.client
            
            speaker = win32com.client.Dispatch("SAPI.SpVoice")
            
            # Set voice properties for better quality
            voices = speaker.GetVoices()
            if voices.Count > 0:
                # Use first available voice
                speaker.Voice = voices.Item(0)
            
            # Save to WAV file
            file_stream = win32com.client.Dispatch("SAPI.SpFileStream")
            file_stream.Open(str(audio_path), 3)  # 3 = SSFMCreateForWrite
            speaker.AudioOutputStream = file_stream
            
            speaker.Speak(text)
            
            file_stream.Close()
            print(f"✅ Audio created: {audio_path.name}")
            
        except ImportError:
            # Fallback: Create a placeholder audio file with gTTS if available
            try:
                from gtts import gTTS
                import io
                
                # Create audio using Google Text-to-Speech
                tts = gTTS(text=text, lang='en', slow=False)
                
                # Save as MP3 first, then convert to WAV if needed
                mp3_path = audio_path.with_suffix('.mp3')
                tts.save(str(mp3_path))
                
                # Try to convert to WAV using pydub
                try:
                    from pydub import AudioSegment
                    audio = AudioSegment.from_mp3(str(mp3_path))
                    audio.export(str(audio_path), format="wav")
                    mp3_path.unlink()  # Remove MP3 file
                    print(f"✅ Audio created: {audio_path.name}")
                except ImportError:
                    # Keep as MP3 if pydub not available
                    audio_path = mp3_path
                    print(f"✅ Audio created: {audio_path.name} (MP3 format)")
                    
            except ImportError:
                # Create a dummy text file as placeholder
                placeholder_path = audio_path.with_suffix('.txt')
                with open(placeholder_path, 'w', encoding='utf-8') as f:
                    f.write(f"AUDIO PLACEHOLDER\n\nOriginal text for TTS:\n\n{text}")
                print(f"⚠️  Audio placeholder created: {placeholder_path.name} (TTS not available)")


def main():
    """Example usage of the content generator"""
    
    # Initialize generator
    generator = ContentGenerator("../content_library")
    
    # Generate Data Science course
    print("=" * 60)
    print("CONTENT GENERATOR - EdTech Platform")
    print("=" * 60)
    
    # Get topic from user or use default
    topic = input("Enter course topic (default: Data Science): ").strip()
    if not topic:
        topic = "Data Science"
    
    num_modules = 3  # Default number of modules
    audio_per_module = 3  # Default audio lessons per module
    
    try:
        course_info = generator.generate_course_content(
            topic=topic,
            num_modules=num_modules,
            audio_per_module=audio_per_module
        )
        
        print("\n" + "=" * 60)
        print("GENERATION COMPLETE!")
        print("=" * 60)
        print(f"Course: {course_info['course_name']}")
        print(f"Course ID: {course_info['course_id']}")
        print(f"Modules: {len(course_info['modules'])}")
        print(f"Total Audio Lessons: {len(course_info['modules']) * audio_per_module}")
        print(f"Estimated Duration: {course_info['estimated_hours']} hours")
        
        print("\nGenerated Structure:")
        for i, module in enumerate(course_info['modules']):
            print(f"  Module {i+1}: {module['name']}")
            print(f"    - {audio_per_module} audio lessons")
            print(f"    - Module metadata JSON")
            print(f"    - Lesson scripts")
        
        print(f"\nContent saved to: content_library/{course_info['course_id']}/")
        
    except Exception as e:
        print(f"❌ Error generating content: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
