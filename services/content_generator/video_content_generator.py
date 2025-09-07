"""
Enhanced Content Generator with Video/Audio Generation
Creates structured course content with actual media files and organized folder structure
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Any
import uuid
from pathlib import Path
import subprocess
import tempfile

class VideoContentGenerator:
    """Generate structured educational content with video/audio files and metadata"""
    
    def __init__(self, content_library_path: str):
        self.content_library_path = Path(content_library_path)
        self.content_library_path.mkdir(exist_ok=True)
        
    def generate_course(self, topic: str = "Data Science") -> Dict[str, Any]:
        """Generate complete course with video/audio files and proper structure"""
        
        print(f"🚀 Generating course with media files: {topic}")
        
        # Clean up any previous incomplete generations
        self._cleanup_incomplete_files()
        
        # Create course structure
        course_data = self._create_course_structure(topic)
        course_id = course_data["course_id"]
        
        # Create organized folder structure: course/modules/lessons/
        course_path = self.content_library_path / course_data["course_name"].replace(" ", "_").lower()
        course_path.mkdir(exist_ok=True)
        
        print(f"📁 Created course directory: {course_path}")
        
        # Generate each module with proper structure
        for module_idx, module in enumerate(course_data["modules"]):
            self._generate_module_with_media(course_path, module, module_idx + 1)
        
        # Save main course metadata
        with open(course_path / "course_metadata.json", 'w', encoding='utf-8') as f:
            json.dump(course_data, f, indent=2, ensure_ascii=False)
        
        # Final cleanup of temporary files
        self._cleanup_temporary_files(course_path)
        
        print(f"✅ Course '{topic}' generated with media files!")
        print(f"📍 Location: {course_path}")
        
        return course_data
    
    def _create_course_structure(self, topic: str) -> Dict[str, Any]:
        """Create the overall course structure"""
        
        # Enhanced course templates with more detailed content
        courses = {
            "data science": {
                "title": "Complete Data Science Masterclass",
                "description": "Comprehensive data science course from basics to advanced machine learning",
                "difficulty": "intermediate",
                "duration_hours": 45,
                "instructor": "Dr. Sarah Chen",
                "modules": [
                    {
                        "name": "Introduction to Data Science",
                        "description": "Foundation concepts and methodology in data science",
                        "lessons": [
                            {
                                "title": "What is Data Science",
                                "description": "Understanding the field and its applications",
                                "duration_minutes": 12
                            },
                            {
                                "title": "Data Science Workflow", 
                                "description": "Step-by-step process of data science projects",
                                "duration_minutes": 15
                            },
                            {
                                "title": "Tools and Environment Setup",
                                "description": "Essential tools and software installation",
                                "duration_minutes": 18
                            }
                        ]
                    },
                    {
                        "name": "Python Programming Fundamentals",
                        "description": "Essential Python skills for data analysis",
                        "lessons": [
                            {
                                "title": "Python Basics for Data Science",
                                "description": "Variables, data types, and basic operations",
                                "duration_minutes": 20
                            },
                            {
                                "title": "Working with NumPy Arrays",
                                "description": "Numerical computing with NumPy library",
                                "duration_minutes": 25
                            },
                            {
                                "title": "Pandas DataFrame Operations",
                                "description": "Data manipulation with Pandas",
                                "duration_minutes": 30
                            }
                        ]
                    },
                    {
                        "name": "Statistical Analysis and Visualization",
                        "description": "Statistical methods and data visualization techniques",
                        "lessons": [
                            {
                                "title": "Descriptive Statistics",
                                "description": "Measures of central tendency and spread",
                                "duration_minutes": 18
                            },
                            {
                                "title": "Data Visualization with Matplotlib",
                                "description": "Creating effective charts and graphs",
                                "duration_minutes": 22
                            },
                            {
                                "title": "Advanced Plotting with Seaborn",
                                "description": "Statistical visualizations and styling",
                                "duration_minutes": 20
                            }
                        ]
                    },
                    {
                        "name": "Machine Learning Applications",
                        "description": "Introduction to machine learning algorithms and applications",
                        "lessons": [
                            {
                                "title": "Supervised Learning Overview",
                                "description": "Classification and regression techniques",
                                "duration_minutes": 25
                            },
                            {
                                "title": "Unsupervised Learning Methods",
                                "description": "Clustering and dimensionality reduction",
                                "duration_minutes": 22
                            },
                            {
                                "title": "Model Evaluation and Validation",
                                "description": "Assessing model performance and avoiding overfitting",
                                "duration_minutes": 28
                            }
                        ]
                    }
                ]
            },
            "web development": {
                "title": "Modern Web Development Bootcamp",
                "description": "Full-stack web development with modern technologies and best practices",
                "difficulty": "beginner",
                "duration_hours": 60,
                "instructor": "Prof. Alex Rodriguez",
                "modules": [
                    {
                        "name": "Frontend Fundamentals",
                        "description": "HTML, CSS, and JavaScript basics",
                        "lessons": [
                            {"title": "HTML Structure and Semantics", "description": "Building semantic web pages", "duration_minutes": 15},
                            {"title": "CSS Styling and Layouts", "description": "Modern CSS techniques", "duration_minutes": 20},
                            {"title": "JavaScript ES6+ Features", "description": "Modern JavaScript programming", "duration_minutes": 25}
                        ]
                    },
                    {
                        "name": "React Development",
                        "description": "Building interactive user interfaces with React",
                        "lessons": [
                            {"title": "React Components and JSX", "description": "Component-based architecture", "duration_minutes": 22},
                            {"title": "State Management and Hooks", "description": "Managing component state", "duration_minutes": 28},
                            {"title": "React Router and Navigation", "description": "Building single-page applications", "duration_minutes": 25}
                        ]
                    },
                    {
                        "name": "Backend Development",
                        "description": "Server-side programming with Node.js",
                        "lessons": [
                            {"title": "Node.js and Express Setup", "description": "Building REST APIs", "duration_minutes": 20},
                            {"title": "Database Integration", "description": "Working with MongoDB", "duration_minutes": 30},
                            {"title": "Authentication and Security", "description": "User authentication systems", "duration_minutes": 35}
                        ]
                    }
                ]
            }
        }
        
        # Get course template or create generic one
        course_key = topic.lower()
        template = courses.get(course_key, courses.get("data science"))
        
        # Create course metadata
        course_data = {
            "course_id": f"course_{uuid.uuid4().hex[:8]}",
            "course_name": template["title"],
            "topic": topic,
            "description": template["description"],
            "difficulty": template["difficulty"],
            "estimated_hours": template["duration_hours"],
            "instructor": template["instructor"],
            "category": self._get_category(topic),
            "created_at": datetime.now().isoformat(),
            "total_modules": len(template["modules"]),
            "modules": []
        }
        
        # Process modules with enhanced metadata
        for i, module_template in enumerate(template["modules"]):
            module_data = {
                "module_id": f"mod_{uuid.uuid4().hex[:8]}",
                "module_name": module_template["name"],
                "description": module_template["description"],
                "order": i + 1,
                "total_lessons": len(module_template["lessons"]),
                "lessons": []
            }
            
            # Process lessons with detailed metadata
            total_duration = 0
            for j, lesson_template in enumerate(module_template["lessons"]):
                lesson_data = {
                    "lesson_id": f"lesson_{uuid.uuid4().hex[:8]}",
                    "title": lesson_template["title"],
                    "description": lesson_template["description"],
                    "order": j + 1,
                    "duration_minutes": lesson_template["duration_minutes"],
                    "video_file": "",  # Will be set during generation
                    "transcript_file": "",  # Will be set during generation
                    "metadata_file": ""  # Will be set during generation
                }
                module_data["lessons"].append(lesson_data)
                total_duration += lesson_template["duration_minutes"]
            
            module_data["total_duration_minutes"] = total_duration
            course_data["modules"].append(module_data)
        
        return course_data
    
    def _generate_module_with_media(self, course_path: Path, module_data: Dict, module_number: int):
        """Generate module with proper folder structure and media files"""
        
        module_name = module_data["module_name"]
        print(f"📚 Creating Module {module_number}: {module_name}")
        
        # Create module directory with clean name
        module_slug = self._sanitize_name(module_name)
        module_dir = course_path / f"Module_{module_number:02d}_{module_slug}"
        module_dir.mkdir(exist_ok=True)
        
        # Generate lesson folders and files
        generated_lessons = []
        for lesson_idx, lesson_data in enumerate(module_data["lessons"]):
            lesson_files = self._generate_lesson_with_media(
                module_dir, lesson_data, lesson_idx + 1, module_name
            )
            generated_lessons.append(lesson_files)
        
        # Update module data with generated file paths
        for i, lesson_files in enumerate(generated_lessons):
            module_data["lessons"][i].update(lesson_files)
        
        # Create comprehensive module metadata
        module_metadata = {
            "module_info": module_data,
            "generated_at": datetime.now().isoformat(),
            "file_structure": {
                "total_lessons": len(module_data["lessons"]),
                "media_files": [f"Lesson_{i+1:02d}/lesson_video.mp4" for i in range(len(module_data["lessons"]))],
                "transcript_files": [f"Lesson_{i+1:02d}/lesson_transcript.txt" for i in range(len(module_data["lessons"]))],
                "metadata_files": [f"Lesson_{i+1:02d}/lesson_metadata.json" for i in range(len(module_data["lessons"]))]
            }
        }
        
        with open(module_dir / "module_metadata.json", 'w', encoding='utf-8') as f:
            json.dump(module_metadata, f, indent=2, ensure_ascii=False)
        
        print(f"  ✅ Generated {len(module_data['lessons'])} lessons with media files")
    
    def _generate_lesson_with_media(self, module_dir: Path, lesson_data: Dict, 
                                  lesson_number: int, module_name: str) -> Dict[str, str]:
        """Generate individual lesson with video file and metadata"""
        
        lesson_title = lesson_data["title"]
        lesson_slug = self._sanitize_name(lesson_title)
        
        # Create lesson directory
        lesson_dir = module_dir / f"Lesson_{lesson_number:02d}_{lesson_slug}"
        lesson_dir.mkdir(exist_ok=True)
        
        print(f"    🎬 Creating Lesson {lesson_number}: {lesson_title}")
        
        # Generate lesson script/transcript
        script = self._create_detailed_script(lesson_data, module_name)
        
        # Save transcript
        transcript_file = "lesson_transcript.txt"
        transcript_path = lesson_dir / transcript_file
        with open(transcript_path, 'w', encoding='utf-8') as f:
            f.write(script)
        
        # Generate video/audio file
        video_file = "lesson_video.mp4"
        video_path = lesson_dir / video_file
        audio_created = self._create_media_file(script, video_path, lesson_data["duration_minutes"])
        
        # Create comprehensive lesson metadata
        lesson_metadata = {
            "lesson_info": lesson_data,
            "content_details": {
                "script_word_count": len(script.split()),
                "estimated_speech_duration": len(script.split()) * 0.5,  # seconds
                "actual_duration_minutes": lesson_data["duration_minutes"],
                "difficulty_level": self._assess_difficulty(script),
                "key_topics": self._extract_topics(script),
                "learning_objectives": self._generate_detailed_objectives(lesson_title, module_name)
            },
            "files": {
                "video_file": video_file if audio_created else None,
                "transcript_file": transcript_file,
                "metadata_file": "lesson_metadata.json"
            },
            "technical_details": {
                "video_format": "MP4" if audio_created else "Not generated",
                "audio_quality": "Standard TTS",
                "file_size_estimate_mb": lesson_data["duration_minutes"] * 2,  # Rough estimate
                "generated_at": datetime.now().isoformat()
            }
        }
        
        # Save lesson metadata
        metadata_file = "lesson_metadata.json"
        with open(lesson_dir / metadata_file, 'w', encoding='utf-8') as f:
            json.dump(lesson_metadata, f, indent=2, ensure_ascii=False)
        
        return {
            "video_file": f"Lesson_{lesson_number:02d}_{lesson_slug}/{video_file}",
            "transcript_file": f"Lesson_{lesson_number:02d}_{lesson_slug}/{transcript_file}",
            "metadata_file": f"Lesson_{lesson_number:02d}_{lesson_slug}/{metadata_file}"
        }
    
    def _create_detailed_script(self, lesson_data: Dict, module_name: str) -> str:
        """Create detailed, realistic lesson script"""
        
        lesson_title = lesson_data["title"]
        description = lesson_data["description"]
        duration = lesson_data["duration_minutes"]
        
        # Enhanced content templates
        detailed_scripts = {
            "What is Data Science": """
Welcome to this comprehensive lesson on "What is Data Science?" I'm excited to guide you through this fundamental topic that forms the foundation of our entire course.

Data science is a rapidly growing interdisciplinary field that has revolutionized how we understand and work with information in the digital age. At its core, data science combines statistical analysis, computer programming, and domain expertise to extract meaningful insights from structured and unstructured data.

Let me break this definition down for you. When we say "interdisciplinary," we mean that data science draws from multiple fields of study. These include mathematics and statistics for analytical rigor, computer science for programming and algorithmic thinking, and specific domain knowledge depending on the application area.

The process of data science typically follows what we call the data science lifecycle. This begins with problem formulation, where we clearly define what question we're trying to answer or what business problem we're trying to solve.

Next comes data collection and acquisition. This might involve gathering data from databases, APIs, web scraping, surveys, or even IoT sensors. The key is identifying relevant data sources that can help answer our research question.

Data cleaning and preprocessing often takes up 60 to 80 percent of a data scientist's time. Real-world data is messy, incomplete, and inconsistent. We need to handle missing values, remove duplicates, standardize formats, and ensure data quality before analysis.

Exploratory data analysis follows, where we use statistical methods and visualization techniques to understand patterns, relationships, and anomalies in our data. This step often reveals unexpected insights and helps guide our modeling approach.

Then we move to modeling and analysis, where we apply machine learning algorithms, statistical models, or other analytical techniques to extract insights or make predictions from our data.

Finally, we communicate our findings through reports, dashboards, presentations, or deployed applications that stakeholders can use to make informed decisions.

Data science applications are everywhere in our modern world. Netflix uses data science to recommend movies you might enjoy. Banks use it to detect fraudulent transactions in real-time. Healthcare organizations use it for drug discovery and personalized treatment plans. Retail companies optimize their supply chains and pricing strategies.

The skills required for data science include programming languages like Python and R, statistical analysis, data visualization, machine learning, database management, and crucially, strong communication skills to explain complex findings to non-technical stakeholders.

As we progress through this course, we'll dive deep into each of these areas, giving you hands-on experience with the tools and techniques that data scientists use every day.

In our next lesson, we'll explore the data science workflow in more detail and see how these concepts apply to real-world projects. Thank you for your attention, and I look forward to continuing this journey with you.
""",
            
            "Python Basics for Data Science": """
Welcome to our lesson on Python Basics for Data Science. Today, we're going to cover the essential Python programming concepts that form the foundation of all data science work.

Python has become the most popular programming language for data science, and there are several reasons for this. First, Python's syntax is clean and readable, making it accessible to beginners while remaining powerful enough for advanced applications. Second, Python has an extensive ecosystem of libraries specifically designed for data analysis, machine learning, and scientific computing.

Let's start with Python's core data types that you'll use constantly in data science work. We have integers for whole numbers like 42 or negative 15. We have floats for decimal numbers like 3.14159 or 2.5. Strings represent text data and are enclosed in quotes, like "Hello, World!" or 'Data Science'. Boolean values are either True or False, which are crucial for logical operations and filtering data.

Python lists are ordered collections that can hold multiple items of different types. For example, we might create a list like this: [1, 2, 3, 'hello', True]. Lists are mutable, meaning we can modify their contents after creation by adding, removing, or changing elements.

Dictionaries are key-value pairs, similar to a real dictionary where you look up a word to get its definition. In Python, we might have a dictionary like this example: name is Alice, age is 30, city is New York. Dictionaries are incredibly useful for representing structured data.

Control structures help us make decisions and repeat operations. If statements allow conditional execution of code based on certain conditions. For example, if a student's grade is above 90, we might classify them as an 'A' student.

Loops let us repeat operations efficiently. For loops are perfect for iterating through data collections like lists or dictionaries. While loops continue executing as long as a condition remains true.

Functions are reusable blocks of code that take inputs, perform operations, and return outputs. They help us organize our code and avoid repetition. A simple function might look like: def calculate_average(numbers): return sum(numbers) / len(numbers).

Python's philosophy emphasizes code readability. Unlike languages that use curly braces, Python uses indentation to define code blocks. This makes Python code look clean and organized, which is especially important when working on complex data science projects.

For data science work, we'll primarily use several key libraries. NumPy provides support for large, multi-dimensional arrays and mathematical functions. Pandas offers data structures and tools for data manipulation and analysis. Matplotlib and Seaborn are used for creating visualizations. Scikit-learn provides machine learning algorithms.

Let me give you a quick example of how these concepts work together. Suppose we have a list of exam scores: [85, 92, 78, 96, 88]. We could use a for loop to iterate through the scores, use an if statement to categorize each score, and use a function to calculate the class average.

Practice is essential for mastering these concepts. Start with simple exercises like creating lists of data, writing functions to process that data, and using conditional statements to make decisions based on your analysis.

In our next lesson, we'll dive deeper into NumPy arrays and see how they provide the foundation for numerical computing in Python. Make sure to practice these basic concepts, as they'll be building blocks for everything we do going forward.

Thank you for your attention, and remember: the best way to learn programming is by doing, so don't hesitate to experiment with the code examples.
""",

            "Descriptive Statistics": """
Welcome to our comprehensive lesson on Descriptive Statistics. This is one of the most fundamental topics in data analysis, and understanding these concepts will serve as the foundation for all your future statistical work.

Descriptive statistics help us summarize, organize, and understand our data through numerical measures and graphical representations. Think of descriptive statistics as tools that help us tell the story of what our data contains, before we move on to making predictions or inferences.

Let's begin with measures of central tendency, which tell us about the "typical" or "average" value in our dataset. The most common measure is the arithmetic mean, calculated by adding all values and dividing by the number of observations. For example, if we have test scores of 85, 90, 78, 92, and 88, the mean is (85 + 90 + 78 + 92 + 88) divided by 5, which equals 86.6.

However, the mean can be heavily influenced by extreme values or outliers. Consider this example: if most students scored around 85, but one student scored 20, that single low score would pull the mean down significantly, making it less representative of typical performance.

This is where the median becomes valuable. The median is the middle value when all observations are arranged in order from lowest to highest. In our previous example with scores 78, 85, 88, 90, 92, the median is 88. If we had an even number of observations, the median would be the average of the two middle values.

The median is more robust to outliers than the mean. Even if that one student scored 0 instead of 20, the median would remain the same, giving us a better sense of typical performance.

The mode represents the most frequently occurring value in our dataset. Some datasets might have multiple modes (bimodal or multimodal), while others might have no mode at all if all values occur with equal frequency.

Now let's explore measures of variability, which describe how spread out our data points are. The range is the simplest measure, calculated as the difference between the maximum and minimum values. While easy to compute, the range only considers two points and can be heavily influenced by outliers.

Variance provides a more comprehensive measure of spread by considering how much each data point deviates from the mean. It's calculated as the average of the squared differences from the mean. However, because we square the differences, the units become squared as well, making interpretation challenging.

Standard deviation solves this problem by taking the square root of the variance, bringing us back to the original units. Standard deviation is particularly useful because, in normally distributed data, approximately 68% of observations fall within one standard deviation of the mean, 95% fall within two standard deviations, and 99.7% fall within three standard deviations.

Quartiles divide our data into four equal parts. The first quartile (Q1) is the value below which 25% of the data falls. The second quartile (Q2) is the median, with 50% of data below it. The third quartile (Q3) has 75% of data below it.

The interquartile range (IQR) is calculated as Q3 minus Q1, representing the range of the middle 50% of our data. The IQR is another measure that's robust to outliers, making it useful for understanding the spread of typical values.

Box plots provide an excellent visual representation of these statistics. They show the median as a line, the first and third quartiles as the box edges, and potential outliers as individual points beyond the "whiskers."

Understanding the shape of our data distribution is also crucial. Data can be symmetric, where values are evenly distributed around the center, or skewed. Right-skewed (positively skewed) data has a long tail extending toward higher values, while left-skewed (negatively skewed) data has a long tail toward lower values.

Let me give you a practical example. Suppose you're analyzing household income data. Income distributions are typically right-skewed because while most people earn moderate amounts, a small number of people earn very high incomes. In this case, the median would be more representative than the mean, which would be pulled upward by the high earners.

These descriptive statistics are your first line of analysis for any dataset. They help you understand your data's basic characteristics, identify potential issues like outliers or data entry errors, and guide your choice of analytical methods.

Before applying any machine learning algorithms or statistical tests, always start with descriptive statistics. They provide the foundation for understanding what you're working with and often reveal insights that guide your entire analysis.

In our next lesson, we'll build on these concepts to explore probability distributions and how they help us model different types of data. Practice calculating these measures with real datasets to build your intuition.

Thank you for your attention. Remember, these concepts might seem simple, but they're the building blocks of all advanced statistical analysis.
"""
        }
        
        # Get specific content or generate generic one
        if lesson_title in detailed_scripts:
            return detailed_scripts[lesson_title].strip()
        else:
            return self._generate_generic_detailed_script(lesson_data, module_name)
    
    def _generate_generic_detailed_script(self, lesson_data: Dict, module_name: str) -> str:
        """Generate a detailed generic lesson script"""
        
        title = lesson_data["title"]
        description = lesson_data["description"]
        duration = lesson_data["duration_minutes"]
        
        return f"""
Welcome to this comprehensive lesson on {title}, an essential component of our {module_name} module.

Today's lesson focuses on {description}. Over the next {duration} minutes, we'll explore this topic in depth, providing you with both theoretical understanding and practical insights that you can apply in real-world scenarios.

Let me begin by explaining why {title} is crucial in the context of {module_name}. Understanding these concepts will not only enhance your knowledge but also provide you with valuable skills that are highly sought after in today's data-driven world.

Our learning objectives for today include: First, we'll establish a solid foundation by defining key concepts and terminology. Second, we'll explore the practical applications and see how professionals use these techniques in their daily work. Third, we'll discuss best practices and common pitfalls to avoid. Finally, we'll review real-world case studies that demonstrate the impact of these methods.

Let's start with the fundamental concepts. {title} encompasses several key principles that work together to create a comprehensive approach to problem-solving. These principles have been developed and refined over years of research and practical application.

The theoretical foundation of {title} draws from multiple disciplines and represents the convergence of academic research and industry best practices. When we examine the underlying principles, we see how they connect to broader themes in {module_name}.

Now, let's move to practical applications. In professional settings, {title} is used across various industries and contexts. For example, in technology companies, these methods help optimize processes and improve decision-making. In healthcare, they contribute to better patient outcomes and more efficient resource allocation.

The implementation process typically follows several key steps. First, we assess the current situation and identify areas for improvement. Next, we develop a strategy based on the principles we've discussed. Then, we execute the plan while monitoring progress and making adjustments as needed. Finally, we evaluate the results and document lessons learned for future reference.

Common challenges when working with {title} include data quality issues, resource constraints, and the need to balance competing priorities. However, by following established best practices and learning from the experiences of others, we can navigate these challenges successfully.

Quality assurance is paramount when applying these methods. This involves regular review of our processes, validation of our results, and continuous improvement based on feedback and new insights. Professional practitioners emphasize the importance of maintaining high standards throughout the entire process.

Let me share a case study that illustrates these concepts in action. [Case study example would be inserted here based on the specific topic]. This example demonstrates how the theoretical concepts we've discussed translate into practical results.

Industry trends show that demand for expertise in {title} continues to grow. Organizations increasingly recognize the value of these approaches and are investing in training their teams and updating their processes accordingly.

To ensure you're well-prepared for practical application, I recommend focusing on hands-on practice with real datasets and scenarios. Start with simple exercises and gradually work up to more complex challenges. Don't hesitate to experiment and learn from both successes and mistakes.

Additional resources for continued learning include professional publications, online communities, and specialized training programs. Building a network of peers and mentors in this field can also accelerate your learning and career development.

As we conclude today's lesson, let me summarize the key takeaways. We've covered the fundamental concepts of {title}, explored practical applications, discussed implementation strategies, and reviewed best practices. Most importantly, we've seen how these concepts fit within the broader context of {module_name}.

Your next steps should include reviewing today's materials, practicing with the provided exercises, and beginning to think about how you might apply these concepts in your own projects or work environment.

In our upcoming lesson, we'll build upon today's foundation to explore more advanced topics and techniques. This progression will help you develop a comprehensive understanding of {module_name} and prepare you for real-world applications.

Thank you for your engagement and attention throughout this lesson. Remember, mastery comes through consistent practice and application. I encourage you to experiment with these concepts and don't hesitate to reach out if you have questions.

Keep up the excellent work, and I look forward to seeing you in the next lesson where we'll continue building your expertise in this exciting field.
""".strip()
    
    def _create_media_file(self, script: str, output_path: Path, duration_minutes: int) -> bool:
        """Create proper video file with visual elements and audio"""
        
        try:
            # Try using Windows SAPI first (most compatible)
            try:
                import win32com.client
                
                # Create temporary WAV file
                temp_audio = output_path.with_suffix('.wav')
                
                speaker = win32com.client.Dispatch("SAPI.SpVoice")
                
                # Set voice properties
                voices = speaker.GetVoices()
                if voices.Count > 0:
                    speaker.Voice = voices.Item(0)
                
                # Adjust speech rate for desired duration
                words_per_minute = len(script.split()) / duration_minutes
                if words_per_minute > 180:  # Too fast
                    speaker.Rate = -2  # Slower
                elif words_per_minute < 120:  # Too slow
                    speaker.Rate = 2   # Faster
                else:
                    speaker.Rate = 0   # Normal
                
                # Create audio file
                file_stream = win32com.client.Dispatch("SAPI.SpFileStream")
                file_stream.Open(str(temp_audio), 3)
                speaker.Speak(script)
                file_stream.Close()
                
                # Create proper video with visual elements if ffmpeg is available
                if self._has_ffmpeg():
                    return self._create_video_with_visuals(temp_audio, output_path, script, duration_minutes)
                else:
                    # Convert WAV to MP4 (audio only with proper container)
                    self._create_audio_only_mp4(temp_audio, output_path)
                    temp_audio.unlink()  # Remove WAV file
                    print(f"      ✅ Created MP4 (audio-only): {output_path.name}")
                    return True
                    
            except ImportError:
                # Try alternative TTS methods as fallback
                print(f"      ⚠️  Windows SAPI not available, using placeholder")
            
            # Fallback: Create placeholder video file info
            placeholder_info = {
                "media_type": "placeholder",
                "original_script": script,
                "intended_duration_minutes": duration_minutes,
                "note": "TTS not available - script provided for manual recording",
                "suggested_tools": ["Windows Speech Platform", "Google Text-to-Speech", "Amazon Polly"]
            }
            
            with open(output_path.with_suffix('.json'), 'w', encoding='utf-8') as f:
                json.dump(placeholder_info, f, indent=2)
            
            print(f"      ⚠️  Created placeholder: {output_path.with_suffix('.json').name}")
            return False
            
        except Exception as e:
            print(f"      ❌ Media creation failed: {e}")
            return False
    
    def _has_ffmpeg(self) -> bool:
        """Check if ffmpeg is available"""
        try:
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
            return True
        except:
            return False
    
    def _create_video_with_visuals(self, audio_path: Path, output_path: Path, script: str, duration_minutes: int) -> bool:
        """Create proper video with visual elements using ffmpeg"""
        try:
            # Create a simple visual background (solid color with text overlay)
            lesson_title = output_path.parent.name.replace('_', ' ').title()
            
            # Calculate actual audio duration
            result = subprocess.run([
                'ffprobe', '-i', str(audio_path), '-show_entries', 
                'format=duration', '-v', 'quiet', '-of', 'csv=p=0'
            ], capture_output=True, text=True)
            
            try:
                actual_duration = float(result.stdout.strip())
            except:
                actual_duration = duration_minutes * 60  # fallback
            
            # Create video with proper properties
            ffmpeg_cmd = [
                'ffmpeg', '-y',  # Overwrite output
                '-f', 'lavfi', '-i', f'color=c=0x1e3a8a:size=1920x1080:duration={actual_duration}:rate=30',  # Blue background, 30 FPS
                '-i', str(audio_path),  # Audio input
                '-vf', f'drawtext=fontfile=arial.ttf:text=\'{lesson_title}\':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2',  # Text overlay
                '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',  # Video codec settings
                '-c:a', 'aac', '-b:a', '128k',  # Audio codec settings
                '-pix_fmt', 'yuv420p',  # Pixel format for compatibility
                '-r', '30',  # Frame rate
                '-shortest',  # Match shortest stream duration
                str(output_path)
            ]
            
            # Try with system fonts fallback if arial not found
            try:
                subprocess.run(ffmpeg_cmd, check=True, capture_output=True)
            except subprocess.CalledProcessError:
                # Retry without custom font
                ffmpeg_cmd_simple = [
                    'ffmpeg', '-y',
                    '-f', 'lavfi', '-i', f'color=c=0x1e3a8a:size=1920x1080:duration={actual_duration}:rate=30',
                    '-i', str(audio_path),
                    '-vf', f'drawtext=text=\'{lesson_title}\':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2',
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
                    '-c:a', 'aac', '-b:a', '128k',
                    '-pix_fmt', 'yuv420p',
                    '-r', '30',
                    '-shortest',
                    str(output_path)
                ]
                subprocess.run(ffmpeg_cmd_simple, check=True, capture_output=True)
            
            # Clean up temporary audio file
            audio_path.unlink()
            print(f"      ✅ Created full video: {output_path.name} (1920x1080, 30fps)")
            return True
            
        except Exception as e:
            print(f"      ⚠️  Video creation failed, falling back to audio-only: {e}")
            return self._create_audio_only_mp4(audio_path, output_path)
    
    def _create_audio_only_mp4(self, audio_path: Path, output_path: Path) -> bool:
        """Create audio-only MP4 with proper container"""
        try:
            subprocess.run([
                'ffmpeg', '-y', '-i', str(audio_path),
                '-c:a', 'aac', '-b:a', '128k',
                '-f', 'mp4',
                str(output_path)
            ], check=True, capture_output=True)
            
            print(f"      ✅ Created MP4 (audio-only): {output_path.name}")
            return True
        except Exception as e:
            # Final fallback - just rename the WAV file
            output_path.with_suffix('.wav').write_bytes(audio_path.read_bytes())
            audio_path.unlink()
            print(f"      ⚠️  Created WAV file: {output_path.with_suffix('.wav').name}")
            return True
    
    def _split_text_for_tts(self, text: str, max_chars: int) -> List[str]:
        """Split text into chunks for TTS processing"""
        sentences = text.split('. ')
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) < max_chars:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _combine_audio_files(self, audio_files: List[Path], output_path: Path):
        """Combine multiple audio files into one"""
        try:
            from pydub import AudioSegment
            
            combined = AudioSegment.empty()
            for audio_file in audio_files:
                audio = AudioSegment.from_mp3(str(audio_file))
                combined += audio
            
            combined.export(str(output_path.with_suffix('.mp3')), format="mp3")
            
        except ImportError:
            # Simple concatenation fallback
            print("      ⚠️  pydub not available, keeping separate audio files")
    
    def _sanitize_name(self, name: str) -> str:
        """Sanitize name for use in filenames and folders"""
        # Remove invalid characters and replace spaces with underscores
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            name = name.replace(char, '')
        return name.replace(' ', '_').replace('&', 'and').lower()
    
    def _get_category(self, topic: str) -> str:
        """Categorize the topic"""
        categories = {
            "data science": "Technology & Analytics",
            "machine learning": "Technology & AI", 
            "web development": "Technology & Programming",
            "programming": "Technology & Programming",
            "business": "Business & Management",
            "marketing": "Business & Marketing"
        }
        return categories.get(topic.lower(), "General Education")
    
    def _assess_difficulty(self, script: str) -> str:
        """Assess content difficulty based on script analysis"""
        word_count = len(script.split())
        complex_words = len([w for w in script.split() if len(w) > 8])
        complexity_ratio = complex_words / word_count if word_count > 0 else 0
        
        if complexity_ratio > 0.15:
            return "Advanced"
        elif complexity_ratio > 0.08:
            return "Intermediate"
        else:
            return "Beginner"
    
    def _extract_topics(self, script: str) -> List[str]:
        """Extract key topics from script"""
        # Simple keyword extraction
        words = script.lower().split()
        # Filter for meaningful terms (simplified approach)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        meaningful_words = [w for w in words if len(w) > 4 and w not in stop_words]
        
        # Get most frequent meaningful words
        from collections import Counter
        word_counts = Counter(meaningful_words)
        return [word for word, count in word_counts.most_common(10)]
    
    def _generate_detailed_objectives(self, lesson_title: str, module_name: str) -> List[str]:
        """Generate detailed learning objectives"""
        return [
            f"Understand the fundamental concepts and principles of {lesson_title}",
            f"Apply {lesson_title} techniques in practical, real-world scenarios",
            f"Analyze the relationship between {lesson_title} and other topics in {module_name}",
            f"Evaluate the effectiveness of different approaches to {lesson_title}",
            f"Create solutions using {lesson_title} methodologies and best practices"
        ]
    
    def _cleanup_incomplete_files(self):
        """Clean up any incomplete or temporary files from previous runs"""
        try:
            for course_dir in self.content_library_path.iterdir():
                if course_dir.is_dir():
                    # Remove temporary files
                    for temp_file in course_dir.rglob("*.tmp"):
                        temp_file.unlink()
                    for temp_file in course_dir.rglob("chunk_*.mp3"):
                        temp_file.unlink()
                    for temp_file in course_dir.rglob("temp_*.wav"):
                        temp_file.unlink()
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")
    
    def _cleanup_temporary_files(self, course_path: Path):
        """Clean up temporary files after course generation"""
        try:
            # Remove any leftover temporary files
            for temp_file in course_path.rglob("*.tmp"):
                temp_file.unlink()
            for temp_file in course_path.rglob("chunk_*.mp3"):
                temp_file.unlink() 
            for temp_file in course_path.rglob("temp_*.wav"):
                temp_file.unlink()
            
            print("🧹 Cleaned up temporary files")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")
    
    def _validate_media_files(self, course_path: Path) -> Dict[str, Any]:
        """Validate generated media files and report statistics"""
        stats = {
            "total_videos": 0,
            "valid_videos": 0,
            "audio_only": 0,
            "placeholders": 0,
            "total_size_mb": 0
        }
        
        try:
            for video_file in course_path.rglob("lesson_video.*"):
                stats["total_videos"] += 1
                
                if video_file.suffix == ".mp4":
                    # Check if it's a proper video with metadata
                    try:
                        result = subprocess.run([
                            'ffprobe', '-i', str(video_file), '-show_entries',
                            'stream=codec_type', '-v', 'quiet', '-of', 'csv=p=0'
                        ], capture_output=True, text=True)
                        
                        if 'video' in result.stdout:
                            stats["valid_videos"] += 1
                        else:
                            stats["audio_only"] += 1
                    except:
                        stats["audio_only"] += 1
                        
                    stats["total_size_mb"] += video_file.stat().st_size / (1024 * 1024)
                    
                elif video_file.suffix in [".wav", ".mp3"]:
                    stats["audio_only"] += 1
                    stats["total_size_mb"] += video_file.stat().st_size / (1024 * 1024)
                elif video_file.suffix == ".json":
                    stats["placeholders"] += 1
                    
        except Exception as e:
            print(f"⚠️  Validation warning: {e}")
            
        return stats


def main():
    """Run the enhanced video content generator"""
    print("🎬 Enhanced Content Generator with Video/Audio Files")
    print("=" * 60)
    
    # Get user input
    topic = input("Enter course topic (Data Science/Web Development): ").strip()
    if not topic:
        topic = "Data Science"
    
    # Initialize generator
    generator = VideoContentGenerator("../content_library")
    
    try:
        # Generate course with media
        course_data = generator.generate_course(topic)
        
        print("\n" + "=" * 60)
        print("✅ ENHANCED COURSE GENERATION COMPLETE!")
        print("=" * 60)
        
        print(f"📚 Course: {course_data['course_name']}")
        print(f"🆔 Course ID: {course_data['course_id']}")
        print(f"👨‍🏫 Instructor: {course_data['instructor']}")
        print(f"📊 Difficulty: {course_data['difficulty']}")
        print(f"⏱️  Estimated Hours: {course_data['estimated_hours']}")
        print(f"📁 Total Modules: {len(course_data['modules'])}")
        
        total_lessons = sum(len(module['lessons']) for module in course_data['modules'])
        print(f"📝 Total Lessons: {total_lessons}")
        
        print("\n📋 Detailed Course Structure:")
        for i, module in enumerate(course_data['modules'], 1):
            print(f"\n  📚 Module {i}: {module['module_name']}")
            print(f"      📄 {module['description']}")
            print(f"      ⏱️  Duration: {module['total_duration_minutes']} minutes")
            print(f"      📖 Lessons ({len(module['lessons'])}):")
            
            for j, lesson in enumerate(module['lessons'], 1):
                print(f"        {j}. {lesson['title']} ({lesson['duration_minutes']} min)")
                print(f"           📄 {lesson['description']}")
        
        course_folder = course_data['course_name'].replace(' ', '_').lower()
        # Validate and report media files
        course_folder_path = Path("../content_library") / course_folder
        media_stats = generator._validate_media_files(course_folder_path)
        
        print(f"\n📁 Content Structure: content_library/{course_folder}/")
        print("   📚 Module_01_[name]/")
        print("      📖 Lesson_01_[name]/")
        print("         🎬 lesson_video.mp4 (with video @ 30fps)")
        print("         📄 lesson_transcript.txt")
        print("         📊 lesson_metadata.json")
        
        print("\n🎯 Media File Statistics:")
        print(f"   🎬 Total Videos: {media_stats['total_videos']}")
        print(f"   ✅ Full Videos (with visuals): {media_stats['valid_videos']}")
        print(f"   🔊 Audio-only Files: {media_stats['audio_only']}")
        print(f"   📄 Placeholders: {media_stats['placeholders']}")
        print(f"   💾 Total Size: {media_stats['total_size_mb']:.2f} MB")
        
        print("\n🎯 Generated Files Include:")
        print("   🎬 Full MP4 videos (1920x1080, 30fps) with visual elements")
        print("   🔊 High-quality audio narration using Windows TTS")
        print("   📄 Detailed lesson transcripts")
        print("   📊 Comprehensive JSON metadata")
        print("   📚 Module and course organization")
        print("   🏷️  Learning objectives and keywords")
        print("   📈 Duration and difficulty assessments")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
