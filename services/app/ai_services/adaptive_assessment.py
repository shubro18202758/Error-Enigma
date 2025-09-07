"""
Adaptive Assessment Engine - Computer Adaptive Testing (CAT)
Implements IRT-based adaptive assessments for precise competency measurement
"""

import asyncio
import logging
import random
import math
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np

from app.core.config import settings
from app.core.logger import learning_logger

logger = logging.getLogger(__name__)


class ItemResponseTheory:
    """
    Implementation of Item Response Theory for adaptive testing
    """
    
    @staticmethod
    def probability_correct(ability: float, difficulty: float, discrimination: float = 1.0, guessing: float = 0.0) -> float:
        """
        Calculate probability of correct response using 3PL model
        P(θ) = c + (1-c) * (1 / (1 + e^(-a(θ-b))))
        """
        try:
            exponent = -discrimination * (ability - difficulty)
            return guessing + (1 - guessing) / (1 + math.exp(exponent))
        except (OverflowError, ZeroDivisionError):
            return 0.5
    
    @staticmethod
    def information_function(ability: float, difficulty: float, discrimination: float = 1.0, guessing: float = 0.0) -> float:
        """
        Calculate Fisher Information for item at given ability level
        """
        try:
            p = ItemResponseTheory.probability_correct(ability, difficulty, discrimination, guessing)
            q = 1 - p
            
            if p <= guessing or p >= 1 or q <= 0:
                return 0.0
            
            derivative_p = discrimination * p * q / (1 - guessing)
            return (derivative_p ** 2) / (p * q)
        except:
            return 0.0
    
    @staticmethod
    def estimate_ability(responses: List[Tuple[float, bool, float]], initial_ability: float = 0.0) -> Tuple[float, float]:
        """
        Estimate ability using Maximum Likelihood Estimation
        Returns (ability_estimate, standard_error)
        """
        try:
            if not responses:
                return initial_ability, 2.0
            
            ability = initial_ability
            
            # Newton-Raphson method for MLE
            for iteration in range(10):  # Max 10 iterations
                likelihood_derivative = 0.0
                second_derivative = 0.0
                
                for difficulty, correct, discrimination in responses:
                    p = ItemResponseTheory.probability_correct(ability, difficulty, discrimination)
                    q = 1 - p
                    
                    if p > 0.001 and q > 0.001:  # Avoid division by zero
                        if correct:
                            likelihood_derivative += discrimination * q
                            second_derivative -= discrimination * discrimination * p * q
                        else:
                            likelihood_derivative -= discrimination * p
                            second_derivative -= discrimination * discrimination * p * q
                
                if abs(second_derivative) > 0.001:
                    delta = likelihood_derivative / second_derivative
                    ability -= delta
                    
                    # Convergence check
                    if abs(delta) < 0.001:
                        break
                else:
                    break
            
            # Calculate standard error
            information = sum(
                ItemResponseTheory.information_function(ability, difficulty, discrimination)
                for difficulty, _, discrimination in responses
            )
            
            standard_error = 1.0 / math.sqrt(information) if information > 0 else 2.0
            
            return ability, standard_error
            
        except Exception as e:
            logger.error(f"Ability estimation error: {e}")
            return initial_ability, 2.0


class QuestionItem:
    """Represents a single assessment question with IRT parameters"""
    
    def __init__(self, item_id: str, content: str, options: List[str], correct_answer: int,
                 difficulty: float, discrimination: float = 1.0, guessing: float = 0.0,
                 subject: str = "general", topic: str = ""):
        self.item_id = item_id
        self.content = content
        self.options = options
        self.correct_answer = correct_answer
        self.difficulty = difficulty
        self.discrimination = discrimination
        self.guessing = guessing
        self.subject = subject
        self.topic = topic
        
        # Usage statistics
        self.times_used = 0
        self.times_correct = 0
        self.avg_response_time = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "item_id": self.item_id,
            "content": self.content,
            "options": self.options,
            "difficulty": self.difficulty,
            "discrimination": self.discrimination,
            "subject": self.subject,
            "topic": self.topic
        }
    
    def update_statistics(self, correct: bool, response_time: float):
        """Update item statistics"""
        self.times_used += 1
        if correct:
            self.times_correct += 1
        
        # Update average response time
        if self.times_used == 1:
            self.avg_response_time = response_time
        else:
            self.avg_response_time = (
                (self.avg_response_time * (self.times_used - 1) + response_time) / self.times_used
            )


class AdaptiveAssessmentEngine:
    """
    Advanced Adaptive Assessment Engine using Computer Adaptive Testing
    """
    
    def __init__(self):
        self.is_initialized = False
        self.question_pools: Dict[str, List[QuestionItem]] = {}
        self.active_assessments: Dict[str, Dict[str, Any]] = {}
        
        # CAT parameters
        self.min_questions = 5
        self.max_questions = 30
        self.precision_threshold = 0.3  # Standard error threshold
        self.ability_range = (-4.0, 4.0)  # Logit scale range
        
        logger.info("📝 Adaptive Assessment Engine initialized")
    
    async def initialize(self):
        """Initialize assessment engine"""
        try:
            logger.info("Initializing Adaptive Assessment Engine...")
            
            # Load question pools
            await self._load_question_pools()
            
            # Initialize IRT calibration
            await self._calibrate_items()
            
            self.is_initialized = True
            logger.info("Adaptive Assessment Engine ready")
            
        except Exception as e:
            logger.error(f"❌ Assessment engine initialization failed: {e}")
            raise
    
    async def _load_question_pools(self):
        """Load pre-defined question pools for different subjects"""
        try:
            # Create sample question pools for demonstration
            subjects = ["mathematics", "python_programming", "machine_learning", "data_science"]
            
            for subject in subjects:
                self.question_pools[subject] = await self._create_sample_questions(subject)
            
            total_questions = sum(len(pool) for pool in self.question_pools.values())
            logger.info(f"Loaded {total_questions} questions across {len(subjects)} subjects")
            
        except Exception as e:
            logger.error(f"Question pool loading error: {e}")
    
    async def _create_sample_questions(self, subject: str) -> List[QuestionItem]:
        """Create sample questions for a subject"""
        questions = []
        
        if subject == "python_programming":
            questions_data = [
                {
                    "content": "What is the output of: print(type([]))",
                    "options": ["<class 'list'>", "<class 'dict'>", "<class 'tuple'>", "<class 'set'>"],
                    "correct": 0,
                    "difficulty": -1.5,  # Easy
                    "topic": "data_types"
                },
                {
                    "content": "Which method adds an element to the end of a list?",
                    "options": ["add()", "append()", "insert()", "extend()"],
                    "correct": 1,
                    "difficulty": -0.5,
                    "topic": "lists"
                },
                {
                    "content": "What is the difference between '==' and 'is' operators?",
                    "options": [
                        "No difference", 
                        "'==' compares values, 'is' compares identity",
                        "'is' compares values, '==' compares identity",
                        "Both compare identity"
                    ],
                    "correct": 1,
                    "difficulty": 0.8,  # Intermediate
                    "topic": "operators"
                },
                {
                    "content": "What will 'list(zip([1,2], [3,4,5]))' return?",
                    "options": ["[(1, 3), (2, 4)]", "[(1, 3), (2, 4), (5,)]", "[1, 2, 3, 4, 5]", "Error"],
                    "correct": 0,
                    "difficulty": 1.2,  # Advanced
                    "topic": "functions"
                },
                {
                    "content": "How do you create a generator function in Python?",
                    "options": ["Use 'return'", "Use 'yield'", "Use 'generate'", "Use 'iterator'"],
                    "correct": 1,
                    "difficulty": 1.8,  # Advanced
                    "topic": "generators"
                }
            ]
        
        elif subject == "mathematics":
            questions_data = [
                {
                    "content": "What is 15% of 80?",
                    "options": ["10", "12", "15", "20"],
                    "correct": 1,
                    "difficulty": -1.0,
                    "topic": "percentages"
                },
                {
                    "content": "Solve for x: 2x + 5 = 13",
                    "options": ["x = 3", "x = 4", "x = 6", "x = 9"],
                    "correct": 1,
                    "difficulty": 0.0,
                    "topic": "algebra"
                },
                {
                    "content": "What is the derivative of x²?",
                    "options": ["x", "2x", "x³", "2x²"],
                    "correct": 1,
                    "difficulty": 0.8,
                    "topic": "calculus"
                }
            ]
        
        elif subject == "machine_learning":
            questions_data = [
                {
                    "content": "What is supervised learning?",
                    "options": [
                        "Learning without labeled data",
                        "Learning with labeled training data", 
                        "Learning through trial and error",
                        "Learning without any data"
                    ],
                    "correct": 1,
                    "difficulty": -0.5,
                    "topic": "fundamentals"
                },
                {
                    "content": "What is overfitting in machine learning?",
                    "options": [
                        "Model performs well on all data",
                        "Model performs poorly on training data",
                        "Model performs well on training but poorly on test data",
                        "Model has too few parameters"
                    ],
                    "correct": 2,
                    "difficulty": 0.5,
                    "topic": "model_evaluation"
                }
            ]
        
        else:  # Default questions
            questions_data = [
                {
                    "content": f"Sample question for {subject}",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct": 0,
                    "difficulty": 0.0,
                    "topic": "general"
                }
            ]
        
        # Create QuestionItem objects
        for i, q_data in enumerate(questions_data):
            question = QuestionItem(
                item_id=f"{subject}_{i+1}",
                content=q_data["content"],
                options=q_data["options"],
                correct_answer=q_data["correct"],
                difficulty=q_data["difficulty"],
                discrimination=random.uniform(0.8, 2.0),  # Random discrimination parameter
                guessing=0.1,  # 10% guessing parameter for multiple choice
                subject=subject,
                topic=q_data["topic"]
            )
            questions.append(question)
        
        return questions
    
    async def _calibrate_items(self):
        """Calibrate item parameters using historical data"""
        try:
            # In a real system, this would use actual response data
            # For now, we'll use the pre-set parameters
            
            for subject, questions in self.question_pools.items():
                for question in questions:
                    # Ensure discrimination is reasonable
                    if question.discrimination < 0.5:
                        question.discrimination = 0.5
                    elif question.discrimination > 3.0:
                        question.discrimination = 3.0
            
            logger.info("Item calibration completed")
            
        except Exception as e:
            logger.error(f"Item calibration error: {e}")
    
    async def create_adaptive_assessment(self, user_id: str, subject: str = "general", 
                                       difficulty: str = "adaptive", 
                                       user_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a new adaptive assessment for a user"""
        try:
            user_context = user_context or {}
            
            # Check if subject exists
            if subject not in self.question_pools:
                available_subjects = list(self.question_pools.keys())
                if available_subjects:
                    subject = available_subjects[0]  # Use first available
                else:
                    raise ValueError("No question pools available")
            
            # Initialize assessment session
            assessment_id = f"assessment_{user_id}_{int(datetime.utcnow().timestamp())}"
            
            # Determine starting ability estimate
            starting_ability = await self._get_starting_ability(user_id, subject, user_context)
            
            # Create assessment session
            assessment_session = {
                "assessment_id": assessment_id,
                "user_id": user_id,
                "subject": subject,
                "start_time": datetime.utcnow(),
                "current_ability": starting_ability,
                "standard_error": 2.0,  # High initial uncertainty
                "responses": [],
                "questions_asked": [],
                "current_question_index": 0,
                "is_complete": False,
                "completion_criteria": {
                    "min_questions": self.min_questions,
                    "max_questions": self.max_questions,
                    "precision_threshold": self.precision_threshold
                }
            }
            
            # Store active assessment
            self.active_assessments[assessment_id] = assessment_session
            
            # Get first question
            first_question = await self._select_next_question(assessment_id)
            
            logger.info(f"📝 Created adaptive assessment {assessment_id} for user {user_id}")
            
            return {
                "assessment_id": assessment_id,
                "subject": subject,
                "estimated_duration": f"{self.min_questions}-{self.max_questions} questions",
                "first_question": first_question,
                "instructions": self._get_assessment_instructions(),
                "adaptive_features": [
                    "Questions adapt to your ability level",
                    "Assessment stops when precise measurement achieved",
                    "Efficient and personalized testing"
                ]
            }
            
        except Exception as e:
            logger.error(f"Assessment creation error: {e}")
            raise
    
    async def _get_starting_ability(self, user_id: str, subject: str, user_context: Dict[str, Any]) -> float:
        """Determine starting ability estimate based on user history"""
        try:
            # Check user's previous assessments in this subject
            previous_ability = user_context.get("previous_assessments", {}).get(subject, {}).get("final_ability")
            if previous_ability is not None:
                return previous_ability
            
            # Check difficulty preference
            difficulty_pref = user_context.get("difficulty_preference", "intermediate")
            ability_mapping = {
                "beginner": -1.0,
                "intermediate": 0.0,
                "advanced": 1.0
            }
            
            return ability_mapping.get(difficulty_pref, 0.0)
            
        except Exception as e:
            logger.error(f"Starting ability estimation error: {e}")
            return 0.0  # Neutral starting point
    
    async def _select_next_question(self, assessment_id: str) -> Dict[str, Any]:
        """Select the most informative question for current ability estimate"""
        try:
            session = self.active_assessments.get(assessment_id)
            if not session:
                raise ValueError("Assessment session not found")
            
            subject = session["subject"]
            current_ability = session["current_ability"]
            asked_questions = set(session["questions_asked"])
            
            # Get available questions
            available_questions = [
                q for q in self.question_pools[subject]
                if q.item_id not in asked_questions
            ]
            
            if not available_questions:
                raise ValueError("No more questions available")
            
            # Select question with maximum information at current ability level
            best_question = None
            max_information = 0
            
            for question in available_questions:
                information = ItemResponseTheory.information_function(
                    current_ability, question.difficulty, question.discrimination, question.guessing
                )
                
                if information > max_information:
                    max_information = information
                    best_question = question
            
            # Fallback to first available question
            if best_question is None:
                best_question = available_questions[0]
            
            # Update session
            session["questions_asked"].append(best_question.item_id)
            session["current_question_index"] += 1
            
            return {
                "question_number": session["current_question_index"],
                "total_estimated": f"{session['current_question_index']}-{self.max_questions}",
                "question": best_question.to_dict(),
                "progress_percentage": min(95, (session["current_question_index"] / self.max_questions) * 100)
            }
            
        except Exception as e:
            logger.error(f"Question selection error: {e}")
            raise
    
    async def submit_answer(self, assessment_id: str, question_id: str, selected_answer: int, 
                          response_time: float = None) -> Dict[str, Any]:
        """Submit an answer and get next question or complete assessment"""
        try:
            session = self.active_assessments.get(assessment_id)
            if not session:
                raise ValueError("Assessment session not found")
            
            if session["is_complete"]:
                raise ValueError("Assessment already completed")
            
            # Find the question
            question = None
            for q in self.question_pools[session["subject"]]:
                if q.item_id == question_id:
                    question = q
                    break
            
            if not question:
                raise ValueError("Question not found")
            
            # Check if answer is correct
            is_correct = (selected_answer == question.correct_answer)
            
            # Update question statistics
            if response_time:
                question.update_statistics(is_correct, response_time)
            
            # Record response
            response_data = (question.difficulty, is_correct, question.discrimination)
            session["responses"].append(response_data)
            
            # Update ability estimate
            new_ability, standard_error = ItemResponseTheory.estimate_ability(
                session["responses"], session["current_ability"]
            )
            
            session["current_ability"] = new_ability
            session["standard_error"] = standard_error
            
            # Check completion criteria
            should_continue = await self._should_continue_assessment(session)
            
            response = {
                "correct": is_correct,
                "correct_answer": question.correct_answer,
                "explanation": f"The correct answer is option {question.correct_answer + 1}.",
                "current_ability_estimate": new_ability,
                "precision": 1.0 / standard_error if standard_error > 0 else 0.0,
                "questions_completed": len(session["responses"])
            }
            
            if should_continue:
                # Get next question
                next_question = await self._select_next_question(assessment_id)
                response["next_question"] = next_question
                response["assessment_complete"] = False
            else:
                # Complete assessment
                await self._complete_assessment(assessment_id)
                response["assessment_complete"] = True
                response["final_results"] = await self._generate_assessment_report(assessment_id)
            
            return response
            
        except Exception as e:
            logger.error(f"Answer submission error: {e}")
            raise
    
    async def _should_continue_assessment(self, session: Dict[str, Any]) -> bool:
        """Determine if assessment should continue"""
        try:
            questions_answered = len(session["responses"])
            standard_error = session["standard_error"]
            
            # Must answer minimum questions
            if questions_answered < self.min_questions:
                return True
            
            # Stop if reached maximum questions
            if questions_answered >= self.max_questions:
                return False
            
            # Stop if precision threshold met
            if standard_error <= self.precision_threshold:
                return False
            
            # Continue if none of the stopping criteria met
            return True
            
        except Exception as e:
            logger.error(f"Continuation check error: {e}")
            return False
    
    async def _complete_assessment(self, assessment_id: str):
        """Complete the assessment and generate final results"""
        try:
            session = self.active_assessments.get(assessment_id)
            if not session:
                return
            
            session["is_complete"] = True
            session["end_time"] = datetime.utcnow()
            session["duration_minutes"] = (
                session["end_time"] - session["start_time"]
            ).total_seconds() / 60
            
            logger.info(f"📝 Completed assessment {assessment_id}")
            
        except Exception as e:
            logger.error(f"Assessment completion error: {e}")
    
    async def _generate_assessment_report(self, assessment_id: str) -> Dict[str, Any]:
        """Generate comprehensive assessment report"""
        try:
            session = self.active_assessments.get(assessment_id)
            if not session:
                return {}
            
            total_questions = len(session["responses"])
            correct_answers = sum(1 for _, correct, _ in session["responses"] if correct)
            
            # Ability level interpretation
            ability = session["current_ability"]
            if ability < -1.5:
                level = "Beginner"
                description = "Foundation level - focus on basic concepts"
            elif ability < 0.5:
                level = "Intermediate" 
                description = "Solid understanding - ready for advanced topics"
            else:
                level = "Advanced"
                description = "Strong mastery - ready for expert-level content"
            
            # Competency breakdown by topic
            topic_performance = {}
            for i, (difficulty, correct, _) in enumerate(session["responses"]):
                question_id = session["questions_asked"][i]
                # Find question to get topic
                for q in self.question_pools[session["subject"]]:
                    if q.item_id == question_id:
                        topic = q.topic
                        if topic not in topic_performance:
                            topic_performance[topic] = {"correct": 0, "total": 0}
                        topic_performance[topic]["total"] += 1
                        if correct:
                            topic_performance[topic]["correct"] += 1
                        break
            
            return {
                "assessment_id": assessment_id,
                "subject": session["subject"],
                "final_ability_estimate": ability,
                "precision": 1.0 / session["standard_error"],
                "proficiency_level": level,
                "level_description": description,
                "total_questions": total_questions,
                "correct_answers": correct_answers,
                "accuracy_percentage": (correct_answers / total_questions) * 100,
                "duration_minutes": session.get("duration_minutes", 0),
                "topic_breakdown": {
                    topic: {
                        "accuracy": data["correct"] / data["total"] * 100,
                        "questions_answered": data["total"]
                    }
                    for topic, data in topic_performance.items()
                },
                "recommendations": await self._generate_learning_recommendations(session),
                "completed_at": session.get("end_time", datetime.utcnow()).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Report generation error: {e}")
            return {"error": "Failed to generate report"}
    
    async def _generate_learning_recommendations(self, session: Dict[str, Any]) -> List[str]:
        """Generate personalized learning recommendations"""
        try:
            ability = session["current_ability"]
            accuracy = sum(1 for _, correct, _ in session["responses"] if correct) / len(session["responses"])
            
            recommendations = []
            
            if ability < -1.0:
                recommendations.extend([
                    "Start with foundational concepts and basic exercises",
                    "Take time to master fundamentals before advancing",
                    "Use visual aids and simple examples for better understanding"
                ])
            elif ability < 0.5:
                recommendations.extend([
                    "Practice intermediate-level problems to solidify understanding",
                    "Explore real-world applications of concepts",
                    "Connect new learning to previously mastered topics"
                ])
            else:
                recommendations.extend([
                    "Challenge yourself with advanced problems and projects",
                    "Explore cutting-edge developments in the field",
                    "Consider mentoring others to reinforce your knowledge"
                ])
            
            if accuracy < 0.7:
                recommendations.append("Focus on areas where you had difficulty - review and practice more")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Recommendation generation error: {e}")
            return ["Continue learning and practicing regularly"]
    
    def _get_assessment_instructions(self) -> str:
        """Get assessment instructions for users"""
        return """
Welcome to your adaptive assessment! Here's how it works:

1. **Personalized Questions**: Each question is selected based on your previous responses
2. **Adaptive Difficulty**: Questions become easier or harder based on your performance  
3. **Efficient Testing**: The assessment stops when we have an accurate measure of your ability
4. **No Time Pressure**: Take your time to think through each question carefully
5. **Learning Opportunity**: You'll receive explanations for each answer

The assessment typically takes 10-20 minutes and will provide detailed insights into your current knowledge level and learning recommendations.
"""
    
    def get_assessment_status(self, assessment_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of an assessment"""
        session = self.active_assessments.get(assessment_id)
        if not session:
            return None
        
        return {
            "assessment_id": assessment_id,
            "is_complete": session["is_complete"],
            "questions_completed": len(session["responses"]),
            "current_ability_estimate": session["current_ability"],
            "precision": 1.0 / session["standard_error"] if session["standard_error"] > 0 else 0.0,
            "estimated_remaining": max(0, self.min_questions - len(session["responses"]))
        }
    
    def is_healthy(self) -> bool:
        """Check if assessment engine is healthy"""
        return self.is_initialized and len(self.question_pools) > 0
    
    async def cleanup(self):
        """Cleanup assessment engine resources"""
        try:
            # Save active assessments if needed
            logger.info("Adaptive Assessment Engine cleanup complete")
        except Exception as e:
            logger.error(f"Assessment cleanup error: {e}")
