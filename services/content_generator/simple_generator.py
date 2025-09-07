"""
Simple Content Generator - Works with built-in Python libraries
Creates structured course content with text scripts and JSON metadata
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Any
import uuid
from pathlib import Path

class SimpleContentGenerator:
    """Generate structured educational content with text scripts and metadata"""
    
    def __init__(self, content_library_path: str):
        self.content_library_path = Path(content_library_path)
        self.content_library_path.mkdir(exist_ok=True)
        
    def generate_course(self, topic: str = "Data Science") -> Dict[str, Any]:
        """Generate complete course with modules and lesson content"""
        
        print(f"🚀 Generating course: {topic}")
        
        # Create course structure
        course_data = self._create_course_structure(topic)
        course_id = course_data["course_id"]
        
        # Create course directory
        course_path = self.content_library_path / course_id
        course_path.mkdir(exist_ok=True)
        
        print(f"📁 Created course directory: {course_path}")
        
        # Generate each module
        for module_idx, module in enumerate(course_data["modules"]):
            self._generate_module(course_path, module, module_idx + 1)
        
        # Save main course metadata
        with open(course_path / "course_info.json", 'w', encoding='utf-8') as f:
            json.dump(course_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Course '{topic}' generated successfully!")
        print(f"📍 Location: {course_path}")
        
        return course_data
    
    def _create_course_structure(self, topic: str) -> Dict[str, Any]:
        """Create the overall course structure"""
        
        # Predefined course templates
        courses = {
            "data science": {
                "title": "Complete Data Science Course",
                "description": "Learn data science from basics to advanced applications",
                "difficulty": "intermediate",
                "duration_hours": 40,
                "modules": [
                    {
                        "name": "Introduction to Data Science",
                        "description": "Overview of the data science field and methodology",
                        "lessons": [
                            "What is Data Science?",
                            "Data Science Applications", 
                            "Tools and Technologies"
                        ]
                    },
                    {
                        "name": "Python for Data Analysis",
                        "description": "Essential Python skills for data manipulation",
                        "lessons": [
                            "Python Basics Review",
                            "NumPy and Pandas",
                            "Data Loading and Cleaning"
                        ]
                    },
                    {
                        "name": "Statistical Analysis",
                        "description": "Statistical methods for data analysis",
                        "lessons": [
                            "Descriptive Statistics",
                            "Probability Distributions",
                            "Hypothesis Testing"
                        ]
                    },
                    {
                        "name": "Machine Learning Fundamentals", 
                        "description": "Introduction to machine learning algorithms",
                        "lessons": [
                            "Supervised Learning Basics",
                            "Unsupervised Learning",
                            "Model Evaluation"
                        ]
                    }
                ]
            },
            "web development": {
                "title": "Full-Stack Web Development",
                "description": "Complete web development from frontend to backend",
                "difficulty": "beginner", 
                "duration_hours": 50,
                "modules": [
                    {
                        "name": "HTML & CSS Fundamentals",
                        "description": "Building blocks of web pages",
                        "lessons": [
                            "HTML Structure and Semantics",
                            "CSS Styling and Layout", 
                            "Responsive Design Principles"
                        ]
                    },
                    {
                        "name": "JavaScript Programming",
                        "description": "Interactive web development",
                        "lessons": [
                            "JavaScript Basics",
                            "DOM Manipulation",
                            "Event Handling"
                        ]
                    },
                    {
                        "name": "Backend Development",
                        "description": "Server-side programming",
                        "lessons": [
                            "Node.js and Express",
                            "Database Integration",
                            "API Development"
                        ]
                    }
                ]
            },
            "machine learning": {
                "title": "Applied Machine Learning",
                "description": "Practical machine learning with real projects",
                "difficulty": "advanced",
                "duration_hours": 45,
                "modules": [
                    {
                        "name": "ML Foundations",
                        "description": "Core concepts and mathematics",
                        "lessons": [
                            "Linear Algebra for ML",
                            "Calculus and Optimization",
                            "Statistics for ML"
                        ]
                    },
                    {
                        "name": "Supervised Learning",
                        "description": "Classification and regression",
                        "lessons": [
                            "Linear and Logistic Regression",
                            "Decision Trees and Random Forest",
                            "Support Vector Machines"
                        ]
                    },
                    {
                        "name": "Deep Learning",
                        "description": "Neural networks and deep learning",
                        "lessons": [
                            "Neural Network Basics",
                            "Convolutional Neural Networks",
                            "Recurrent Neural Networks"
                        ]
                    }
                ]
            }
        }
        
        # Get course template or create generic one
        course_key = topic.lower().replace(" ", " ")
        template = courses.get(course_key, courses.get("data science"))
        
        # Create course metadata
        course_data = {
            "course_id": f"course_{uuid.uuid4().hex[:8]}",
            "course_name": template["title"],
            "topic": topic,
            "description": template["description"],
            "difficulty": template["difficulty"],
            "estimated_hours": template["duration_hours"],
            "instructor": "AI Generated Content",
            "category": self._get_category(topic),
            "created_at": datetime.now().isoformat(),
            "modules": []
        }
        
        # Process modules
        for i, module_template in enumerate(template["modules"]):
            module_data = {
                "module_id": f"mod_{uuid.uuid4().hex[:8]}",
                "module_name": module_template["name"],
                "description": module_template["description"],
                "order": i + 1,
                "lessons": []
            }
            
            # Process lessons
            for j, lesson_title in enumerate(module_template["lessons"]):
                lesson_data = {
                    "lesson_id": f"lesson_{uuid.uuid4().hex[:8]}",
                    "title": lesson_title,
                    "order": j + 1,
                    "estimated_duration_minutes": 15 + (j * 5)  # Varying duration
                }
                module_data["lessons"].append(lesson_data)
            
            course_data["modules"].append(module_data)
        
        return course_data
    
    def _generate_module(self, course_path: Path, module_data: Dict, module_number: int):
        """Generate a single module with all its lessons"""
        
        module_name = module_data["module_name"]
        print(f"📚 Creating Module {module_number}: {module_name}")
        
        # Create module directory
        module_slug = module_name.lower().replace(" ", "_").replace("&", "and").replace("?", "").replace(":", "").replace("/", "_").replace("\\", "_")
        module_dir = course_path / f"module_{module_number:02d}_{module_slug}"
        module_dir.mkdir(exist_ok=True)
        
        # Generate lesson files
        for lesson_idx, lesson_data in enumerate(module_data["lessons"]):
            self._generate_lesson(module_dir, lesson_data, lesson_idx + 1, module_name)
        
        # Create module metadata
        module_metadata = {
            "module_info": module_data,
            "total_lessons": len(module_data["lessons"]),
            "created_at": datetime.now().isoformat(),
            "content_files": [
                f"lesson_{i+1:02d}_*.txt" for i in range(len(module_data["lessons"]))
            ]
        }
        
        with open(module_dir / "module_info.json", 'w', encoding='utf-8') as f:
            json.dump(module_metadata, f, indent=2, ensure_ascii=False)
        
        print(f"  ✅ Generated {len(module_data['lessons'])} lessons")
    
    def _generate_lesson(self, module_dir: Path, lesson_data: Dict, 
                        lesson_number: int, module_name: str):
        """Generate individual lesson content"""
        
        lesson_title = lesson_data["title"]
        # Sanitize filename by removing invalid characters
        lesson_slug = lesson_title.lower().replace(" ", "_").replace("&", "and").replace("?", "").replace(":", "").replace("/", "_").replace("\\", "_").replace("*", "").replace('"', "").replace("<", "").replace(">", "").replace("|", "")
        
        # Generate lesson script
        script = self._create_lesson_script(lesson_title, module_name)
        
        # Save lesson script
        script_filename = f"lesson_{lesson_number:02d}_{lesson_slug}_script.txt"
        with open(module_dir / script_filename, 'w', encoding='utf-8') as f:
            f.write(script)
        
        # Create lesson metadata
        lesson_metadata = {
            "lesson_info": lesson_data,
            "script_file": script_filename,
            "word_count": len(script.split()),
            "estimated_read_time_minutes": len(script.split()) / 200,  # ~200 words per minute
            "created_at": datetime.now().isoformat(),
            "keywords": self._extract_keywords(lesson_title),
            "learning_objectives": self._generate_objectives(lesson_title, module_name)
        }
        
        json_filename = f"lesson_{lesson_number:02d}_{lesson_slug}_info.json"
        with open(module_dir / json_filename, 'w', encoding='utf-8') as f:
            json.dump(lesson_metadata, f, indent=2, ensure_ascii=False)
    
    def _create_lesson_script(self, lesson_title: str, module_name: str) -> str:
        """Create realistic lesson content"""
        
        content_templates = {
            "What is Data Science?": """
Welcome to our lesson on "What is Data Science?"

Data science is an interdisciplinary field that combines statistics, programming, and domain expertise to extract insights from data. In today's digital world, we generate massive amounts of data every day - from social media posts to sensor readings, from transaction records to scientific measurements.

Data science helps us make sense of this information by using scientific methods, processes, algorithms, and systems. The field draws from multiple disciplines including mathematics, statistics, computer science, and information science.

A typical data science project involves several key steps:

First, we define the problem and gather relevant data. This might involve collecting data from databases, APIs, or even web scraping.

Next, we clean and prepare the data. Real-world data is often messy, incomplete, or inconsistent. Data scientists spend significant time on this crucial step.

Then we explore and analyze the data using statistical methods and visualization techniques. This helps us understand patterns, relationships, and anomalies in the data.

Finally, we build models to make predictions or recommendations, and communicate our findings to stakeholders through reports, dashboards, or presentations.

Data science applications are everywhere: recommendation systems on Netflix, fraud detection in banking, predictive maintenance in manufacturing, and personalized medicine in healthcare.

The skills needed include programming (especially Python and R), statistics and mathematics, database management, data visualization, and strong communication abilities.

In our next lesson, we'll explore the specific applications of data science across different industries. Thank you for your attention!
""",
            
            "Python Basics Review": """
Welcome to our Python Basics Review lesson.

Python has become the most popular programming language for data science, and for good reason. It's readable, versatile, and has an extensive ecosystem of libraries specifically designed for data analysis.

Let's start with Python's core data types. We have integers for whole numbers, floats for decimal numbers, strings for text, and booleans for true/false values.

Python lists are ordered collections that can hold different types of data. For example, we might have a list like [1, 2, 'hello', True]. Lists are mutable, meaning we can change their contents after creation.

Dictionaries store key-value pairs, making them perfect for representing structured data. Think of them like a phone book - you look up a name (key) to get a phone number (value).

Control structures help us make decisions and repeat actions. If statements let us execute code conditionally, while loops let us repeat code blocks. For loops are especially useful for iterating through data collections.

Functions are reusable blocks of code that take inputs and return outputs. They help us organize our code and avoid repetition. A simple function might look like: def add_numbers(a, b): return a + b.

Python's readability comes from its use of indentation to define code blocks, rather than curly braces like other languages. This makes Python code look clean and organized.

For data science, we'll primarily use libraries like NumPy for numerical computations, Pandas for data manipulation, and Matplotlib for creating visualizations.

Practice these fundamentals, as they form the foundation for all our data science work. In our next lesson, we'll dive into NumPy and Pandas specifically.
""",

            "Descriptive Statistics": """
Welcome to our lesson on Descriptive Statistics.

Descriptive statistics help us summarize and understand our data through numerical and graphical methods. They're the first tool we reach for when exploring any new dataset.

Measures of central tendency tell us about the "typical" value in our data. The mean, or average, is calculated by summing all values and dividing by the count. However, the mean can be influenced by extreme values or outliers.

The median is the middle value when data is sorted from lowest to highest. It's more robust to outliers than the mean. For example, in the dataset [1, 2, 3, 100], the median is 2.5, while the mean is 26.5.

The mode is the most frequently occurring value. Some datasets might have multiple modes or no mode at all.

Measures of variability describe how spread out our data is. The range is simply the difference between the maximum and minimum values.

Variance measures the average squared deviation from the mean. It's useful for calculations, but its units are squared, making interpretation difficult.

Standard deviation is the square root of variance, bringing us back to the original units. About 68% of normally distributed data falls within one standard deviation of the mean.

Quartiles divide our data into four equal parts. The first quartile (Q1) is the value below which 25% of the data falls. The third quartile (Q3) captures 75% of the data.

The interquartile range (IQR) is Q3 minus Q1, representing the spread of the middle 50% of our data. It's another measure that's robust to outliers.

Box plots visualize these statistics beautifully, showing the median, quartiles, and potential outliers in a compact format.

Understanding these descriptive statistics is crucial before moving to inferential statistics. Practice calculating these measures with real datasets to build your intuition.
"""
        }
        
        # Get specific content or generate generic one
        if lesson_title in content_templates:
            return content_templates[lesson_title].strip()
        else:
            return self._generate_generic_script(lesson_title, module_name)
    
    def _generate_generic_script(self, lesson_title: str, module_name: str) -> str:
        """Generate a generic lesson script"""
        return f"""
Welcome to our lesson on {lesson_title}, part of the {module_name} module.

In this lesson, we'll explore the key concepts and practical applications of {lesson_title}. This topic is fundamental to understanding {module_name} and will build upon the knowledge we've gained in previous lessons.

Let's begin by defining what {lesson_title} means and why it's important in the context of {module_name}. Understanding these fundamentals will help you apply these concepts in real-world scenarios.

The main learning objectives for today include:
- Understanding the core principles of {lesson_title}
- Learning how to apply these concepts practically
- Recognizing common patterns and best practices
- Identifying potential challenges and solutions

We'll start with the theoretical foundation, then move to practical examples, and conclude with hands-on exercises that reinforce your understanding.

Key concepts we'll cover include the underlying principles, common methodologies, and industry best practices. We'll also discuss how {lesson_title} relates to other topics in {module_name}.

Real-world applications of {lesson_title} can be found across many industries and use cases. Understanding these applications will help you see the practical value of what you're learning.

Common challenges when working with {lesson_title} include typical pitfalls that beginners encounter and strategies for overcoming them. Learning from these common mistakes will accelerate your learning process.

Best practices include proven approaches that professionals use, efficient workflows, and quality assurance methods that ensure reliable results.

To summarize, {lesson_title} is a crucial component of {module_name}. The concepts we've discussed today will serve as building blocks for more advanced topics.

For your next steps, I recommend practicing with the provided exercises, reviewing the key concepts, and preparing for our next lesson where we'll build upon these fundamentals.

Thank you for your attention, and remember that mastery comes through practice and application of these concepts.
""".strip()
    
    def _extract_keywords(self, lesson_title: str) -> List[str]:
        """Extract relevant keywords from lesson title"""
        # Simple keyword extraction
        words = lesson_title.lower().replace("?", "").split()
        # Filter out common words
        stop_words = {"what", "is", "the", "and", "or", "but", "to", "for", "of", "in", "on", "at"}
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        return keywords
    
    def _generate_objectives(self, lesson_title: str, module_name: str) -> List[str]:
        """Generate learning objectives for the lesson"""
        return [
            f"Understand the fundamentals of {lesson_title}",
            f"Apply {lesson_title} concepts in practical scenarios", 
            f"Relate {lesson_title} to other topics in {module_name}",
            f"Identify best practices and common pitfalls"
        ]
    
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


def main():
    """Run the content generator"""
    print("🎓 Simple Content Generator for EdTech Platform")
    print("=" * 50)
    
    # Get user input
    topic = input("Enter course topic (or press Enter for 'Data Science'): ").strip()
    if not topic:
        topic = "Data Science"
    
    # Initialize generator
    generator = SimpleContentGenerator("../content_library")
    
    try:
        # Generate course
        course_data = generator.generate_course(topic)
        
        print("\n" + "=" * 50)
        print("✅ COURSE GENERATION COMPLETE!")
        print("=" * 50)
        
        print(f"📚 Course: {course_data['course_name']}")
        print(f"🆔 Course ID: {course_data['course_id']}")
        print(f"📊 Difficulty: {course_data['difficulty']}")
        print(f"⏱️  Estimated Hours: {course_data['estimated_hours']}")
        print(f"📁 Total Modules: {len(course_data['modules'])}")
        
        total_lessons = sum(len(module['lessons']) for module in course_data['modules'])
        print(f"📝 Total Lessons: {total_lessons}")
        
        print("\n📋 Module Structure:")
        for i, module in enumerate(course_data['modules'], 1):
            print(f"  {i}. {module['module_name']}")
            print(f"     📖 {len(module['lessons'])} lessons")
            for j, lesson in enumerate(module['lessons'], 1):
                print(f"        {j}. {lesson['title']}")
        
        print(f"\n📁 Content Location: content_library/{course_data['course_id']}/")
        print("\n🎯 Each lesson includes:")
        print("   - Detailed text script (*.txt)")
        print("   - Lesson metadata (*.json)")
        print("   - Learning objectives")
        print("   - Keywords and estimates")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
