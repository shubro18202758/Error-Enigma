#!/usr/bin/env python3
"""
🎯 ERROR-404 ADAPTIVE TERMINAL TESTING PLATFORM (IMPROVED)
===========================================================
Clean, focused adaptive testing system using Data Science Masterclass dataset
"""

import os
import sys
import json
import pathlib
import time
import random
from typing import List, Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass
from groq import Groq

# Configuration
GROQ_API_KEY = "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"
MASTERCLASS_PATH = pathlib.Path(__file__).parent.parent / "services" / "shared" / "content_library" / "Courses" / "complete_data_science_masterclass"

@dataclass
class Question:
    """Single multiple choice question"""
    id: str
    question: str
    options: Dict[str, str]  # A, B, C, D
    correct_answer: str
    difficulty: str  # easy, medium, hard
    topic: str
    quality_score: float = 0.0

@dataclass 
class UserResponse:
    """User's response to a question"""
    question_id: str
    selected_answer: str
    is_correct: bool
    response_time: float
    difficulty: str
    lesson_name: str
    module_name: str

class DataScienceMasterclassLoader:
    """Loads and processes Data Science Masterclass content"""
    
    def __init__(self):
        if not MASTERCLASS_PATH.exists():
            raise FileNotFoundError(f"Masterclass not found at: {MASTERCLASS_PATH}")
        self.course_metadata = self._load_course_metadata()
    
    def _load_course_metadata(self) -> Dict[str, Any]:
        """Load course structure"""
        metadata_file = MASTERCLASS_PATH / "course_metadata.json"
        if metadata_file.exists():
            with open(metadata_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"modules": []}
    
    def get_modules(self) -> List[Dict[str, Any]]:
        """Get all available modules"""
        modules = []
        for i, module_dir in enumerate(sorted(MASTERCLASS_PATH.glob("Module_*")), 1):
            if module_dir.is_dir():
                metadata_file = module_dir / "module_metadata.json"
                if metadata_file.exists():
                    with open(metadata_file, 'r', encoding='utf-8') as f:
                        metadata = json.load(f)
                        metadata['number'] = i
                        metadata['path'] = module_dir
                        modules.append(metadata)
        return modules
    
    def get_available_modules(self) -> List[Dict[str, Any]]:
        """Get available modules (alias for get_modules for API compatibility)"""
        return self.get_modules()
    
    def get_lessons(self, module_number: int) -> List[Dict[str, Any]]:
        """Get lessons for a specific module"""
        modules = self.get_modules()
        if 1 <= module_number <= len(modules):
            module = modules[module_number - 1]
            module_path = module['path']
            
            lessons = []
            for i, lesson_dir in enumerate(sorted(module_path.glob("Lesson_*")), 1):
                if lesson_dir.is_dir():
                    lesson_name = lesson_dir.name.replace("Lesson_", "").replace("_", " ").title()
                    lessons.append({
                        'number': i,
                        'name': lesson_name,
                        'path': lesson_dir
                    })
            return lessons
        return []
    
    def load_lesson_content(self, module_number: int, lesson_number: int) -> str:
        """Load content from specific lesson"""
        lessons = self.get_lessons(module_number)
        if 1 <= lesson_number <= len(lessons):
            lesson_path = lessons[lesson_number - 1]['path']
            content = ""
            
            # Load all text files in the lesson directory
            for content_file in lesson_path.glob("*.txt"):
                try:
                    with open(content_file, 'r', encoding='utf-8') as f:
                        content += f.read() + "\n\n"
                except Exception as e:
                    print(f"[Warning] Could not read {content_file}: {e}")
            
            return content.strip()
        return ""

class GroqQuestionGenerator:
    """Generate questions using Groq AI with enhanced difficulty control"""
    
    def __init__(self, api_key: str = GROQ_API_KEY):
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"
        self.used_question_patterns = set()  # Track question patterns to avoid repetition
    
    def generate_questions(self, content: str, topic: str, num_questions: int = 10) -> List[Question]:
        """Generate diverse difficulty questions from content with variety"""
        if len(content) < 100:
            raise ValueError("Content too short to generate quality questions")
        
        # Add randomization to ensure different questions each time
        import time
        seed = int(time.time()) % 1000  # Use current time as seed for variety
        random.seed(seed)
        
        # Generate questions with mixed difficulties
        easy_count = max(1, num_questions // 3)
        medium_count = max(1, num_questions // 3) 
        hard_count = num_questions - easy_count - medium_count
        
        all_questions = []
        
        # Generate each difficulty level with variation
        all_questions.extend(self._generate_by_difficulty(content, topic, "easy", easy_count, seed))
        all_questions.extend(self._generate_by_difficulty(content, topic, "medium", medium_count, seed + 1))
        all_questions.extend(self._generate_by_difficulty(content, topic, "hard", hard_count, seed + 2))
        
        # Shuffle and return requested number
        random.shuffle(all_questions)
        return all_questions[:num_questions]
    
    def _generate_by_difficulty(self, content: str, topic: str, difficulty: str, count: int, seed: int = 0) -> List[Question]:
        """Generate questions for specific difficulty level with variety"""
        
        # Multiple prompt patterns for each difficulty to ensure variety
        difficulty_prompts = {
            "easy": [
                f"""Generate {count} EASY practical assessment questions for {topic}.

EASY CRITERIA - Test basic practical knowledge:
- Simple command/syntax questions
- Basic function names and usage  
- Essential operations everyone should know
- Direct "What command..." or "How do you..." questions

Examples for Python: "What command appends to a list?", "How do you import pandas?"
Examples for Pandas: "What function reads CSV files?", "How do you select a column?"
Examples for NumPy: "What function creates an array?", "How do you find array shape?"

Content context: {content[:1000]}

Format each question exactly as:
Question: [practical question]
A) [option A]
B) [option B] 
C) [option C]
D) [option D]
Answer: [correct letter]

Generate {count} practical questions:""",

                f"""Create {count} beginner-level hands-on questions about {topic}.

FOCUS ON - Basic practical skills:
- Core syntax and commands
- Fundamental operations
- Basic method names
- Simple usage patterns

Question styles: "Which function...", "What syntax...", "How to perform...", "Basic command for..."

Examples for different topics:
- Python: "What method removes last item?", "How do you create a dictionary?"
- Pandas: "Which method shows data types?", "How do you rename columns?"
- NumPy: "What creates zeros array?", "How do you get array dimensions?"

Content: {content[:1000]}

Use this exact format:
Question: [practical question]
A) [option A]
B) [option B]
C) [option C] 
D) [option D]
Answer: [correct letter]

Create {count} varied questions:""",

                f"""Develop {count} introductory practical questions for {topic}.

TARGET - New learners testing:
- Basic command recognition
- Simple operation knowledge
- Core function awareness
- Elementary syntax

Patterns: "What does...", "Which is used to...", "How do you start...", "Basic way to..."

Topic examples:
- Python: "What opens a file?", "How do you add to dictionary?"
- Pandas: "What loads Excel files?", "How do you count rows?"
- NumPy: "What function sums arrays?", "How do you slice arrays?"

Reference: {content[:1000]}

Format requirement:
Question: [practical question]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Answer: [correct letter]

Generate {count} questions:"""
            ],
            
            "medium": [
                f"""Generate {count} MEDIUM practical assessment questions for {topic}.

MEDIUM CRITERIA - Test applied knowledge:
- Multi-step operations
- Parameter usage and options
- Common real-world scenarios
- "Which approach..." or "What happens when..." questions

Examples for Python: "Which method sorts a list in-place?", "What's the difference between append() and extend()?"
Examples for Pandas: "How do you filter rows with multiple conditions?", "Which function merges DataFrames?"
Examples for NumPy: "How do you reshape an array?", "What's the difference between copy() and view()?"

Content context: {content[:1000]}

Format each question exactly as:
Question: [practical question]
A) [option A]
B) [option B]
C) [option C] 
D) [option D]
Answer: [correct letter]

Generate {count} practical questions:""",

                f"""Create {count} intermediate-level questions about {topic}.

FOCUS - Applied practical skills:
- Method parameters and options
- Common workflow operations
- Practical decision-making
- Real-world applications

Question types: "When would you...", "Which parameter...", "Best method for...", "What happens if..."

Examples per topic:
- Python: "Which loop is better for...", "What parameter controls..."
- Pandas: "How to handle missing data...", "Which join type for..."
- NumPy: "What axis parameter does...", "How to broadcast..."

Source material: {content[:1000]}

Required format:
Question: [practical question]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Answer: [correct letter]

Produce {count} questions:""",

                f"""Design {count} intermediate practical questions for {topic}.

TARGET - Users with basic experience:
- Parameter combinations
- Method comparisons
- Practical workflows
- Common use cases

Styles: "Which combination...", "What's better for...", "How to achieve...", "What parameter changes..."

Topic applications:
- Python: "Best way to iterate...", "Which data structure for..."
- Pandas: "How to group and aggregate...", "What method transforms..."
- NumPy: "Which function calculates...", "How to handle dimensions..."

Context: {content[:1000]}

Format exactly:
Question: [practical question]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Answer: [correct letter]

Create {count} questions:"""
            ],
            
            "hard": [
                f"""Generate {count} HARD practical assessment questions for {topic}.

HARD CRITERIA - Test advanced application:
- Complex operations and edge cases
- Performance considerations
- Advanced parameters and options
- Problem-solving scenarios

Examples for Python: "Which is most efficient for large list operations?", "How to handle memory issues with large datasets?"
Examples for Pandas: "Best way to optimize DataFrame memory usage?", "How to handle missing values in time series?"
Examples for NumPy: "Most efficient way to perform element-wise operations?", "How to broadcast arrays with different shapes?"

Content context: {content[:1000]}

Format each question exactly as:
Question: [practical question]
A) [option A]
B) [option B]
C) [option C]
D) [option D] 
Answer: [correct letter]

Generate {count} practical questions:""",

                f"""Create {count} advanced-level questions about {topic}.

FOCUS - Expert practical knowledge:
- Performance optimization
- Complex scenarios
- Advanced features
- Efficiency considerations

Question patterns: "Most efficient way...", "Best practice for...", "How to optimize...", "Advanced technique for..."

Expert examples:
- Python: "Memory-efficient way to...", "Fastest method for..."
- Pandas: "How to optimize large data...", "Best approach for complex..."
- NumPy: "Most efficient operation for...", "How to minimize memory..."

Reference: {content[:1000]}

Use format:
Question: [practical question]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Answer: [correct letter]

Generate {count} questions:""",

                f"""Develop {count} expert-level questions for {topic}.

TARGET - Advanced practitioners:
- Optimization challenges
- Complex problem solving
- Advanced feature usage
- Performance awareness

Styles: "Optimal solution for...", "Advanced approach to...", "How to scale...", "Expert technique for..."

Advanced topics:
- Python: "Best architecture for...", "How to handle large-scale..."
- Pandas: "Optimal memory strategy...", "Advanced indexing for..."
- NumPy: "Best performance for...", "How to vectorize complex..."

Material: {content[:1000]}

Format strictly:
Question: [practical question]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Answer: [correct letter]

Create {count} questions:"""
            ]
        }
        
        # Select different prompt pattern based on seed to ensure variety
        prompts = difficulty_prompts.get(difficulty, difficulty_prompts["medium"])
        selected_prompt = prompts[seed % len(prompts)]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": selected_prompt}],
                temperature=0.3 + (seed % 5) * 0.1,  # Vary temperature for more diversity
                max_tokens=2000
            )
            
            content_response = response.choices[0].message.content.strip()
            return self._parse_questions(content_response, topic, difficulty)
            
        except Exception as e:
            print(f"[Error] Failed to generate {difficulty} questions: {e}")
            return []
    
    def _parse_questions(self, content: str, topic: str, difficulty: str) -> List[Question]:
        """Parse questions from Groq response"""
        questions = []
        lines = content.strip().split('\n')
        current_question = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if line.startswith('Question:'):
                if current_question.get('question'):
                    # Save previous question
                    q = self._create_question(current_question, topic, difficulty)
                    if q:
                        questions.append(q)
                current_question = {'question': line[9:].strip()}
                
            elif line.startswith(('A)', 'B)', 'C)', 'D)')):
                option_letter = line[0]
                option_text = line[2:].strip()
                if 'options' not in current_question:
                    current_question['options'] = {}
                current_question['options'][option_letter] = option_text
                
            elif line.startswith('Answer:'):
                current_question['answer'] = line[7:].strip().upper()
        
        # Don't forget the last question
        if current_question.get('question'):
            q = self._create_question(current_question, topic, difficulty)
            if q:
                questions.append(q)
        
        return questions
    
    def _create_question(self, data: Dict, topic: str, difficulty: str) -> Optional[Question]:
        """Create Question object from parsed data"""
        if not all(key in data for key in ['question', 'options', 'answer']):
            return None
        
        if len(data['options']) != 4 or data['answer'] not in ['A', 'B', 'C', 'D']:
            return None
        
        return Question(
            id=f"{difficulty}_{hash(data['question']) % 10000}",
            question=data['question'],
            options=data['options'],
            correct_answer=data['answer'],
            difficulty=difficulty,
            topic=topic,
            quality_score=self._calculate_quality(data['question'], data['options'])
        )
    
    def _calculate_quality(self, question: str, options: Dict[str, str]) -> float:
        """Simple quality scoring"""
        score = 1.0
        
        # Check question length
        if len(question) < 20:
            score -= 0.3
        
        # Check option diversity
        option_lengths = [len(opt) for opt in options.values()]
        if max(option_lengths) > 3 * min(option_lengths):
            score -= 0.2
        
        # Check for question words
        question_words = ['what', 'how', 'which', 'why', 'when', 'where']
        if not any(word in question.lower() for word in question_words):
            score -= 0.2
        
        return max(0.0, score)

class AdaptiveEngine:
    """Enhanced adaptive difficulty control with lesson-level tracking"""
    
    def __init__(self):
        self.performance_history = []
        self.current_difficulty = "medium"  # Always start with medium
        self.consecutive_correct = 0
        self.consecutive_wrong = 0
        self.consecutive_wrong_lesson = 0  # Track wrong answers per lesson only
        self.lesson_performance = {}  # Track performance per lesson
        self.lesson_confidence = {}  # Track pre-assessment confidence
        self.current_lesson = None
        self.questions_in_current_difficulty = 0
        self.target_questions_per_difficulty = 2  # 2 questions per difficulty level
        
    def set_lesson_confidence(self, lesson_name: str, is_confident: bool):
        """Set confidence level for a lesson"""
        self.lesson_confidence[lesson_name] = {
            'confident': is_confident,
            'category': 'pre_weakness' if not is_confident else 'confident'
        }
    
    def start_new_lesson(self, lesson_name: str):
        """Initialize tracking for a new lesson"""
        self.current_lesson = lesson_name
        self.current_difficulty = "medium"  # Always start with medium
        self.consecutive_correct = 0
        self.consecutive_wrong = 0
        self.consecutive_wrong_lesson = 0  # Reset for new lesson
        self.questions_in_current_difficulty = 0
        
        if lesson_name not in self.lesson_performance:
            self.lesson_performance[lesson_name] = {
                'easy': {'correct': 0, 'total': 0, 'avg_time': 0},
                'medium': {'correct': 0, 'total': 0, 'avg_time': 0},
                'hard': {'correct': 0, 'total': 0, 'avg_time': 0},
                'overall_accuracy': 0,
                'needs_focus': False,
                'is_strength': False,
                'time_concerns': False,
                'terminated': False
            }
    
    def should_terminate_lesson(self) -> bool:
        """Check if current lesson should be terminated due to poor performance"""
        return self.consecutive_wrong_lesson >= 2
    
    def mark_lesson_terminated(self):
        """Mark current lesson as terminated"""
        if self.current_lesson and self.current_lesson in self.lesson_performance:
            self.lesson_performance[self.current_lesson]['terminated'] = True
    
    def get_next_difficulty(self, was_correct: bool, response_time: float) -> str:
        """Enhanced difficulty progression with 2-question rule"""
        self.questions_in_current_difficulty += 1
        
        if was_correct:
            self.consecutive_correct += 1
            self.consecutive_wrong = 0
            self.consecutive_wrong_lesson = 0  # Reset lesson wrong counter on correct answer
        else:
            self.consecutive_wrong += 1
            self.consecutive_correct = 0
            self.consecutive_wrong_lesson += 1
        
        # Update lesson performance
        if self.current_lesson:
            lesson_perf = self.lesson_performance[self.current_lesson][self.current_difficulty]
            lesson_perf['total'] += 1
            if was_correct:
                lesson_perf['correct'] += 1
            
            # Update average time
            current_avg = lesson_perf['avg_time']
            total_questions = lesson_perf['total']
            lesson_perf['avg_time'] = ((current_avg * (total_questions - 1)) + response_time) / total_questions
        
        # Check if we've completed 2 questions in current difficulty
        if self.questions_in_current_difficulty >= self.target_questions_per_difficulty:
            # Decide next difficulty based on performance in current level
            if self.current_difficulty == "medium":
                if self.consecutive_correct >= 2:
                    # Both medium questions correct -> go to hard
                    self._reset_difficulty_tracking()
                    return "hard"
                else:
                    # At least one medium wrong -> go to easy
                    self._reset_difficulty_tracking()
                    return "easy"
            
            elif self.current_difficulty == "easy":
                if self.consecutive_correct >= 2:
                    # Both easy questions correct -> go back to medium
                    self._reset_difficulty_tracking()
                    return "medium"
                else:
                    # Still struggling with easy -> stay at easy
                    self._reset_difficulty_tracking()
                    return "easy"
            
            elif self.current_difficulty == "hard":
                if self.consecutive_correct >= 1:
                    # At least one hard correct -> stay at hard
                    self._reset_difficulty_tracking()
                    return "hard"
                else:
                    # Struggling with hard -> back to medium
                    self._reset_difficulty_tracking()
                    return "medium"
        
        # Continue with current difficulty if haven't reached 2 questions yet
        return self.current_difficulty
    
    def _reset_difficulty_tracking(self):
        """Reset counters for new difficulty level"""
        self.questions_in_current_difficulty = 0
        self.consecutive_correct = 0
        self.consecutive_wrong = 0
    
    def analyze_lesson_performance(self):
        """Analyze performance for each lesson and categorize"""
        for lesson_name, perf in self.lesson_performance.items():
            total_correct = sum(perf[diff]['correct'] for diff in ['easy', 'medium', 'hard'])
            total_attempted = sum(perf[diff]['total'] for diff in ['easy', 'medium', 'hard'])
            
            if total_attempted > 0:
                perf['overall_accuracy'] = (total_correct / total_attempted) * 100
                
                # Check for time concerns (average time > 45 seconds)
                avg_times = [perf[diff]['avg_time'] for diff in ['easy', 'medium', 'hard'] if perf[diff]['total'] > 0]
                if avg_times and sum(avg_times) / len(avg_times) > 45:
                    perf['time_concerns'] = True
                
                # Categorize based on performance
                if perf['overall_accuracy'] >= 80 and perf['hard']['correct'] > 0:
                    perf['is_strength'] = True
                elif perf['overall_accuracy'] < 60 or perf['easy']['correct'] < perf['easy']['total']:
                    perf['needs_focus'] = True
    
    def record_response(self, response: UserResponse):
        """Record user response for analysis"""
        self.performance_history.append(response)

class ReportGenerator:
    """Generate enhanced performance reports with improved structure"""
    
    def __init__(self):
        pass
    
    def generate_report(self, responses: List[UserResponse], topic: str, lesson_confidence: Dict) -> str:
        """Generate comprehensive Personal Recommendations report"""
        if not responses:
            return "No responses to analyze."
        
        # Separate skills assessment responses from actual test responses
        test_responses = [r for r in responses if r.difficulty != "skills_assessment"]
        skills_assessment_responses = [r for r in responses if r.difficulty == "skills_assessment"]
        
        # Calculate basic stats from test responses only
        if test_responses:
            total_questions = len(test_responses)
            correct_answers = sum(1 for r in test_responses if r.is_correct)
            accuracy = (correct_answers / total_questions) * 100
            avg_time = sum(r.response_time for r in test_responses) / total_questions
        else:
            total_questions = 0
            correct_answers = 0
            accuracy = 0
            avg_time = 0
        
        # Difficulty performance
        difficulty_stats = {}
        for difficulty in ['easy', 'medium', 'hard']:
            diff_responses = [r for r in test_responses if r.difficulty == difficulty]
            if diff_responses:
                diff_correct = sum(1 for r in diff_responses if r.is_correct)
                diff_avg_time = sum(r.response_time for r in diff_responses) / len(diff_responses)
                difficulty_stats[difficulty] = {
                    'attempted': len(diff_responses),
                    'correct': diff_correct,
                    'accuracy': (diff_correct / len(diff_responses)) * 100,
                    'avg_time': diff_avg_time
                }
        
        # Lesson-level analysis
        lesson_stats = {}
        for response in test_responses:
            lesson = response.lesson_name
            if lesson not in lesson_stats:
                lesson_stats[lesson] = {'correct': 0, 'total': 0, 'times': [], 'terminated': False}
            lesson_stats[lesson]['total'] += 1
            if response.is_correct:
                lesson_stats[lesson]['correct'] += 1
            lesson_stats[lesson]['times'].append(response.response_time)
        
        # Calculate lesson accuracies
        for lesson in lesson_stats:
            stats = lesson_stats[lesson]
            stats['accuracy'] = (stats['correct'] / stats['total']) * 100 if stats['total'] > 0 else 0
            stats['avg_time'] = sum(stats['times']) / len(stats['times']) if stats['times'] else 0
        
        # Get skills assessment weaknesses
        skills_assessment_weaknesses = [r.lesson_name for r in skills_assessment_responses]
        
        # Generate report
        report = f"""
═══════════════════════════════════════════════════════════════════════════
                    ERROR-404 ADAPTIVE TESTING PERFORMANCE REPORT
═══════════════════════════════════════════════════════════════════════════

📊 TEST SUMMARY
• Topic: {topic}
• Questions Attempted: {total_questions}
• Correct Answers: {correct_answers}
• Overall Accuracy: {accuracy:.1f}%
• Average Response Time: {avg_time:.1f} seconds
• Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}

📈 DIFFICULTY BREAKDOWN
"""
        
        for difficulty, stats in difficulty_stats.items():
            time_indicator = "⚡" if stats['avg_time'] <= 30 else "🐌" if stats['avg_time'] > 60 else "⏱️"
            report += f"• {difficulty.upper()}: {stats['correct']}/{stats['attempted']} ({stats['accuracy']:.1f}%) {time_indicator} {stats['avg_time']:.1f}s\n"
        
        report += "\n📚 LESSON BREAKDOWN\n"
        for lesson, stats in lesson_stats.items():
            time_indicator = "⚡" if stats['avg_time'] <= 30 else "🐌" if stats['avg_time'] > 60 else "⏱️"
            performance_indicator = "🟢" if stats['accuracy'] >= 80 else "🟡" if stats['accuracy'] >= 60 else "🔴"
            report += f"• {lesson}: {stats['correct']}/{stats['total']} ({stats['accuracy']:.1f}%) {performance_indicator} {time_indicator} {stats['avg_time']:.1f}s\n"
        
        # Personal Recommendations
        report += f"""

🎯 PERSONAL RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════════════

⚠️ WEAKNESSES:
"""
        
        # Skills assessment weaknesses (marked as "I don't know practical usage")
        weaknesses_found = False
        weakness_lessons = []  # Track lessons that are weaknesses
        
        if skills_assessment_weaknesses:
            report += "• 📚 SKILLS ASSESSMENT WEAKNESSES:\n"
            for lesson in skills_assessment_weaknesses:
                report += f"   → {lesson} (Marked as 'no practical knowledge')\n"
                weakness_lessons.append(lesson)  # Add to weakness list
            weaknesses_found = True
        
        # Performance-based weaknesses (only < 50% and terminated)
        for lesson, stats in lesson_stats.items():
            if stats.get('terminated', False):
                report += f"• ⚠️ CRITICAL: {lesson} (Terminated early - {stats['accuracy']:.1f}%)\n"
                weaknesses_found = True
                weakness_lessons.append(lesson)  # Add to weakness list
            elif stats['accuracy'] < 50:
                report += f"• 🔴 POOR: {lesson} ({stats['accuracy']:.1f}%)\n"
                weaknesses_found = True
                weakness_lessons.append(lesson)  # Add to weakness list
            # Note: 50-70% lessons will be handled in SUGGESTIONS section
        
        if difficulty_stats.get('easy', {}).get('accuracy', 100) < 80:
            report += "• Basic knowledge gaps in fundamental concepts\n"
            weaknesses_found = True
        
        if not weaknesses_found:
            report += "• No significant weaknesses identified\n"
        
        report += """
💪 STRENGTHS:
"""
        
        # Identify strengths
        strengths_found = False
        strength_lessons = []  # Track lessons that are strengths
        
        for lesson, stats in lesson_stats.items():
            if stats['accuracy'] >= 80:
                report += f"• 🟢 EXCELLENT: {lesson} ({stats['accuracy']:.1f}%)\n"
                strengths_found = True
                strength_lessons.append(lesson)  # Add to strength list
            elif stats['accuracy'] >= 70:
                report += f"• 🟢 GOOD: {lesson} ({stats['accuracy']:.1f}%)\n"
                strengths_found = True
                strength_lessons.append(lesson)  # Add to strength list
        
        if difficulty_stats.get('hard', {}).get('accuracy', 0) >= 70:
            report += "• Strong analytical and critical thinking skills\n"
            strengths_found = True
        
        if accuracy >= 80:
            report += "• Excellent overall performance\n"
            strengths_found = True
        
        if not strengths_found:
            report += "• Persistence and willingness to learn\n"
        
        report += """
📚 LESSON RECOMMENDATIONS (SUGGESTED LEARNING):
"""
        
        # Lessons that need focused learning (but NOT already listed in weaknesses OR strengths)
        suggestion_found = False
        
        # Only include lessons that are NOT in weaknesses AND NOT in strengths
        # These would be moderate performance lessons (50-70%) that need improvement
        
        for lesson, stats in lesson_stats.items():
            # Skip if lesson is already categorized as weakness or strength
            if lesson not in weakness_lessons and lesson not in strength_lessons:
                if not stats.get('terminated', False) and 50 <= stats['accuracy'] < 70:
                    report += f"• 🟡 NEEDS IMPROVEMENT: {lesson} ({stats['accuracy']:.1f}%) - Focus on areas of confusion\n"
                    suggestion_found = True
        
        if not suggestion_found:
            if weakness_lessons:
                report += "• Focus on addressing weaknesses listed above before moving to new topics\n"
            else:
                report += "• Continue with advanced topics - You're doing well!\n"
        
        report += """
⏱️ TIME-BASED ANALYSIS:
"""
        
        # Time-based categorization
        fast_lessons = []
        slow_lessons = []
        normal_lessons = []
        
        # Include both tested lessons and skills assessment
        all_lessons = set(lesson_stats.keys()) | set(skills_assessment_weaknesses)
        
        for lesson in all_lessons:
            if lesson in skills_assessment_weaknesses:
                # Skills assessment lessons have no timing data
                continue
            elif lesson in lesson_stats:
                stats = lesson_stats[lesson]
                if stats['avg_time'] <= 20:
                    fast_lessons.append(f"{lesson} ({stats['avg_time']:.1f}s)")
                elif stats['avg_time'] > 45:
                    slow_lessons.append(f"{lesson} ({stats['avg_time']:.1f}s)")
                else:
                    normal_lessons.append(f"{lesson} ({stats['avg_time']:.1f}s)")
        
        if fast_lessons:
            report += "• ⚡ QUICK RESPONSE TOPICS: " + ", ".join(fast_lessons) + "\n"
        if normal_lessons:
            report += "• ⏱️ NORMAL PACE TOPICS: " + ", ".join(normal_lessons) + "\n"
        if slow_lessons:
            report += "• 🐌 TOPICS NEEDING SPEED IMPROVEMENT: " + ", ".join(slow_lessons) + "\n"
        
        if not (fast_lessons or slow_lessons or normal_lessons):
            report += "• No timing data available\n"
        
        report += """
═══════════════════════════════════════════════════════════════════════════
"""
        
        return report

class TerminalInterface:
    """Clean terminal interface for the adaptive test"""
    
    def __init__(self):
        self.clear_screen()
    
    def clear_screen(self):
        """Clear terminal screen"""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def print_header(self):
        """Print application header"""
        print("═" * 70)
        print("          🎯 ERROR-404 ADAPTIVE TERMINAL TESTING PLATFORM")
        print("═" * 70)
        print()
    
    def select_module(self, modules: List[Dict[str, Any]]) -> int:
        """Let user select a module"""
        print("📚 AVAILABLE MODULES:")
        print("-" * 40)
        
        for i, module in enumerate(modules, 1):
            print(f"{i}. {module.get('title', f'Module {i}')}")
            desc = module.get('description', 'No description available')
            print(f"   {desc[:60]}...")
            print()
        
        while True:
            try:
                choice = input(f"Select module (1-{len(modules)}): ").strip()
                module_num = int(choice)
                if 1 <= module_num <= len(modules):
                    return module_num
                print(f"Please enter a number between 1 and {len(modules)}")
            except ValueError:
                print("Please enter a valid number")
            except (KeyboardInterrupt, EOFError):
                print("\n👋 Goodbye!")
                exit(0)
    
    def ask_lesson_confidence(self, lesson_name: str) -> bool:
        """Ask user about their confidence level for a lesson"""
        print(f"\n📋 SKILLS ASSESSMENT: {lesson_name}")
        print("─" * 60)
        print("Before testing your practical knowledge, let's assess your confidence.")
        print(f"How confident are you with hands-on skills in: {lesson_name}?")
        print()
        print("1. 🟢 I can use this practically (test my skills with 2 questions)")
        print("2. 🔴 I don't know practical usage (mark for learning)")
        print()
        
        while True:
            try:
                choice = input("Select your practical confidence level (1-2): ").strip()
                if choice == "1":
                    print("✅ Great! We'll test your practical skills with 2 questions.")
                    return True
                elif choice == "2":
                    print("📚 No problem! This will be marked for focused learning.")
                    return False
                else:
                    print("Please enter 1 or 2")
            except (KeyboardInterrupt, EOFError):
                print("\n👋 Assessment interrupted. Goodbye!")
                exit(0)
    
    def display_question(self, question: Question, question_num: int, total_questions: int) -> tuple:
        """Display question and get user response"""
        print(f"\n📝 Question {question_num}/{total_questions} | Difficulty: {question.difficulty.upper()}")
        print("─" * 50)
        print(f"\n{question.question}\n")
        
        for letter, option in question.options.items():
            print(f"{letter}) {option}")
        
        start_time = time.time()
        
        while True:
            try:
                answer = input("\nYour answer (A/B/C/D or 'q' to quit): ").strip().upper()
                if answer in ['A', 'B', 'C', 'D']:
                    response_time = time.time() - start_time
                    return answer, response_time
                elif answer == 'Q':
                    return None, 0
                print("Please enter A, B, C, D, or 'q' to quit")
            except (KeyboardInterrupt, EOFError):
                print("\n👋 Assessment interrupted. Goodbye!")
                return None, 0
    
    def show_result(self, is_correct: bool, correct_answer: str, response_time: float):
        """Show immediate feedback"""
        if is_correct:
            print(f"✅ Correct! ({response_time:.1f}s)")
        else:
            print(f"❌ Wrong. Correct answer: {correct_answer} ({response_time:.1f}s)")
        time.sleep(1.5)
    
    def show_final_summary(self, responses: List[UserResponse]):
        """Show test completion summary"""
        test_responses = [r for r in responses if r.difficulty != "pre_assessment"]
        correct = sum(1 for r in test_responses if r.is_correct)
        total = len(test_responses)
        accuracy = (correct / total) * 100 if total > 0 else 0
        
        print("\n" + "═" * 50)
        print("             🎯 TEST COMPLETED!")
        print("═" * 50)
        print(f"Questions Answered: {total}")
        print(f"Correct Answers: {correct}")
        print(f"Accuracy: {accuracy:.1f}%")
        
        if accuracy >= 80:
            print("🌟 Excellent performance!")
        elif accuracy >= 60:
            print("👍 Good job!")
        else:
            print("📚 Keep studying!")

def main():
    """Main application entry point with enhanced module-by-module testing"""
    interface = TerminalInterface()
    interface.print_header()
    
    try:
        # Initialize components
        print("🔄 Initializing Error-404 system...")
        loader = DataScienceMasterclassLoader()
        generator = GroqQuestionGenerator()
        engine = AdaptiveEngine()
        report_gen = ReportGenerator()
        
        # Get available modules
        modules = loader.get_modules()
        if not modules:
            print("❌ No modules found in the masterclass!")
            return
        
        # User selects module
        module_num = interface.select_module(modules)
        selected_module = modules[module_num - 1]
        
        # Get all lessons in the selected module
        lessons = loader.get_lessons(module_num)
        if not lessons:
            print("❌ No lessons found in this module!")
            return
        
        print(f"\n📚 Starting practical skills assessment for: {selected_module.get('title', 'Module')}")
        print(f"📖 Total topics to assess: {len(lessons)}")
        print("🎯 Each topic will test your hands-on knowledge with practical questions")
        
        try:
            input("\n🚀 Press Enter to start the skills assessment...")
        except (KeyboardInterrupt, EOFError):
            print("\n👋 Assessment interrupted. Goodbye!")
            return
        
        all_responses = []
        current_lesson_num = 1
        
        # Process each lesson in the module
        for lesson in lessons:
            interface.clear_screen()
            interface.print_header()
            
            lesson_name = lesson['name']
            print(f"📖 LESSON {current_lesson_num}/{len(lessons)}: {lesson_name}")
            print("═" * 60)
            
            # Ask about confidence level first
            is_confident = interface.ask_lesson_confidence(lesson_name)
            engine.set_lesson_confidence(lesson_name, is_confident)
            
            if not is_confident:
                # Mark as weakness and skip testing
                print(f"📚 {lesson_name} marked for focused learning of practical skills.")
                # Add this lesson to responses as a weakness marker
                weakness_response = UserResponse(
                    question_id=f"skills_assessment_{lesson_name}",
                    selected_answer="NO_PRACTICAL_KNOWLEDGE",
                    is_correct=False,
                    response_time=0,
                    difficulty="skills_assessment",
                    lesson_name=lesson_name,
                    module_name=selected_module.get('title', 'Module')
                )
                all_responses.append(weakness_response)
                current_lesson_num += 1
                continue
            
            # Start new lesson in adaptive engine
            engine.start_new_lesson(lesson_name)
            
            # Load lesson content
            print(f"🔄 Loading content for {lesson_name}...")
            content = loader.load_lesson_content(module_num, current_lesson_num)
            
            if len(content) < 100:
                print(f"⚠️ Insufficient content for {lesson_name}, skipping...")
                current_lesson_num += 1
                continue
            
            # Generate questions for this lesson
            print("🤖 Generating practical assessment questions...")
            topic = f"{selected_module.get('title', 'Module')} - {lesson_name}"
            questions = generator.generate_questions(content, topic, num_questions=8)
            
            if not questions:
                print(f"❌ Failed to generate questions for {lesson_name}!")
                current_lesson_num += 1
                continue
            
            print(f"✅ Generated {len(questions)} questions for {lesson_name}")
            
            # Group questions by difficulty
            question_pool = {
                'easy': [q for q in questions if q.difficulty == 'easy'],
                'medium': [q for q in questions if q.difficulty == 'medium'], 
                'hard': [q for q in questions if q.difficulty == 'hard']
            }
            
            print(f"\n🎯 Starting practical skills test for: {lesson_name}")
            print("📊 2 questions to test your hands-on knowledge")
            
            try:
                input("Press Enter to begin this skills test...")
            except (KeyboardInterrupt, EOFError):
                print("\n👋 Quiz interrupted. Goodbye!")
                return
            
            asked_questions = set()
            lesson_responses = []
            max_questions_per_lesson = 2  # Only 2 questions for confident lessons
            lesson_terminated = False
            
            # Adaptive questioning for current lesson
            for q_num in range(1, max_questions_per_lesson + 1):
                # Check if this lesson should be terminated
                if engine.should_terminate_lesson():
                    lesson_terminated = True
                    engine.mark_lesson_terminated()
                    print(f"\n⚠️ Assessment for '{lesson_name}' indicates significant knowledge gaps!")
                    print("📚 This topic needs comprehensive study. Moving to next assessment...")
                    break
                
                current_difficulty = engine.current_difficulty
                
                # Select question based on current difficulty
                available = [q for q in question_pool.get(current_difficulty, []) 
                            if q.id not in asked_questions]
                
                if not available:
                    # Try other difficulties if current is exhausted
                    all_available = [q for q in questions if q.id not in asked_questions]
                    if all_available:
                        current_question = random.choice(all_available)
                    else:
                        print(f"🎉 Completed all available questions for {lesson_name}")
                        break
                else:
                    current_question = random.choice(available)
                
                asked_questions.add(current_question.id)
                
                # Display question
                print(f"\n📝 {lesson_name} - Assessment Question {q_num}/{max_questions_per_lesson}")
                print(f"🎯 Level: {current_question.difficulty.upper()}")
                answer, response_time = interface.display_question(current_question, q_num, max_questions_per_lesson)
                
                if answer is None:  # User quit
                    print("👋 Quiz interrupted.")
                    return
                
                # Check if correct
                is_correct = answer == current_question.correct_answer
                interface.show_result(is_correct, current_question.correct_answer, response_time)
                
                # Record response
                response = UserResponse(
                    question_id=current_question.id,
                    selected_answer=answer,
                    is_correct=is_correct,
                    response_time=response_time,
                    difficulty=current_question.difficulty,
                    lesson_name=lesson_name,
                    module_name=selected_module.get('title', 'Module')
                )
                lesson_responses.append(response)
                all_responses.append(response)
                engine.record_response(response)
                
                # Update difficulty for next question
                next_difficulty = engine.get_next_difficulty(is_correct, response_time)
                
                if next_difficulty != current_difficulty:
                    if next_difficulty == "hard":
                        print("🔥 Great job! Moving to HARD questions")
                    elif next_difficulty == "easy":
                        print("📚 Let's practice with EASY questions")
                    elif next_difficulty == "medium":
                        print("⚖️ Moving to MEDIUM difficulty")
                
                time.sleep(1)
            
            # Lesson summary
            if lesson_responses:
                lesson_correct = sum(1 for r in lesson_responses if r.is_correct)
                lesson_accuracy = (lesson_correct / len(lesson_responses)) * 100
                print(f"\n✅ {lesson_name} Complete!")
                print(f"📊 Lesson Score: {lesson_correct}/{len(lesson_responses)} ({lesson_accuracy:.1f}%)")
                
                if lesson_accuracy >= 80:
                    print("🌟 Excellent performance!")
                elif lesson_accuracy >= 60:
                    print("👍 Good work!")
                else:
                    print("📚 Needs more practice")
            
            current_lesson_num += 1
            
            if current_lesson_num <= len(lessons):
                try:
                    input(f"\nPress Enter to continue to next lesson...")
                except (KeyboardInterrupt, EOFError):
                    print("\n👋 Assessment interrupted. Goodbye!")
                    return
        
        # Analyze performance across all lessons
        engine.analyze_lesson_performance()
        
        # Show final results
        interface.clear_screen()
        interface.show_final_summary(all_responses)
        
        # Generate comprehensive report
        print("\n🔄 Generating detailed module report...")
        module_topic = f"Module {module_num}: {selected_module.get('title', 'Unknown')}"
        report = report_gen.generate_report(all_responses, module_topic, engine.lesson_confidence)
        
        # Save report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_module_name = selected_module.get('title', 'Module').replace(' ', '_').replace('-', '_')
        report_filename = f"Error404_Module_{module_num}_{safe_module_name}_{timestamp}.txt"
        
        with open(report_filename, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"📄 Comprehensive report saved: {report_filename}")
        
        # Show report preview
        try:
            input("\nPress Enter to view your detailed module report...")
        except (KeyboardInterrupt, EOFError):
            print("\n👋 Assessment completed. Report saved!")
            return
        interface.clear_screen()
        print(report)
        
    except KeyboardInterrupt:
        print("\n\n👋 Quiz interrupted. Goodbye!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
