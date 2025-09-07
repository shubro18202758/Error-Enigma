#!/usr/bin/env python3
"""
Flask API Backend for Adaptive Testing Integration
Wraps the adaptive_test_new.py system for web API access
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import sys
import os
import json
import uuid
from datetime import datetime
import traceback

# Add the orchestrator directory to path to import adaptive_test_new
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'orchestrator'))

try:
    from adaptive_test_new import (
        DataScienceMasterclassLoader,
        GroqQuestionGenerator, 
        AdaptiveEngine,
        ReportGenerator,
        UserResponse
    )
    PYTHON_BACKEND_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import adaptive_test_new: {e}")
    PYTHON_BACKEND_AVAILABLE = False

app = Flask(__name__)
app.secret_key = 'error404-adaptive-testing-key'
CORS(app)

# Global storage for active assessments (in production, use Redis or database)
active_assessments = {}

class AdaptiveAssessmentSession:
    """Manages an active assessment session"""
    
    def __init__(self, assessment_id, module_title, user_id):
        self.assessment_id = assessment_id
        self.module_title = module_title
        self.user_id = user_id
        self.created_at = datetime.now()
        
        # Initialize components if Python backend is available
        if PYTHON_BACKEND_AVAILABLE:
            try:
                self.loader = DataScienceMasterclassLoader()
                self.generator = GroqQuestionGenerator()
                self.engine = AdaptiveEngine()
                self.report_gen = ReportGenerator()
                self.modules = self.loader.get_modules()
                self.available = True
            except Exception as e:
                print(f"Failed to initialize Python backend: {e}")
                self.available = False
        else:
            self.available = False
        
        self.responses = []
        self.current_lesson = None
        self.lesson_questions = {}
        self.status = 'initialized'
    
    def get_lessons_for_module(self, module_number=1):
        """Get lessons for the specified module"""
        if not self.available:
            return self._get_mock_lessons()
        
        try:
            return self.loader.get_lessons(module_number)
        except Exception as e:
            print(f"Error getting lessons: {e}")
            return self._get_mock_lessons()
    
    def _get_mock_lessons(self):
        """Return mock lessons when Python backend unavailable"""
        return [
            {'number': 1, 'name': 'Introduction to Programming'},
            {'number': 2, 'name': 'Variables and Data Types'},
            {'number': 3, 'name': 'Control Structures'},
            {'number': 4, 'name': 'Functions and Methods'},
            {'number': 5, 'name': 'Data Structures'},
        ]
    
    def assess_lesson_confidence(self, lesson_name, is_confident):
        """Assess user confidence for a lesson"""
        self.engine.set_lesson_confidence(lesson_name, is_confident)
        
        if not is_confident:
            # Mark as skills assessment weakness
            weakness_response = UserResponse(
                question_id=f"skills_assessment_{lesson_name}",
                selected_answer="NO_PRACTICAL_KNOWLEDGE",
                is_correct=False,
                response_time=0,
                difficulty="skills_assessment",
                lesson_name=lesson_name,
                module_name=self.module_title
            )
            self.responses.append(weakness_response)
            return {'skip_testing': True, 'marked_for_learning': True}
        
        return {'skip_testing': False, 'proceed_to_questions': True}
    
    def generate_questions_for_lesson(self, lesson_name, module_number=1, lesson_number=1):
        """Generate questions for a specific lesson"""
        if not self.available:
            return self._generate_mock_questions(lesson_name)
        
        try:
            # Start new lesson in adaptive engine
            self.engine.start_new_lesson(lesson_name)
            
            # Load lesson content
            content = self.loader.load_lesson_content(module_number, lesson_number)
            
            if len(content) < 100:
                print(f"Insufficient content for {lesson_name}, using mock questions")
                return self._generate_mock_questions(lesson_name)
            
            # Generate questions using Groq
            topic = f"{self.module_title} - {lesson_name}"
            questions = self.generator.generate_questions(content, topic, num_questions=8)
            
            # Convert to serializable format
            questions_data = []
            for q in questions:
                questions_data.append({
                    'id': q.id,
                    'question': q.question,
                    'options': q.options,
                    'correct_answer': q.correct_answer,
                    'difficulty': q.difficulty,
                    'topic': q.topic,
                    'quality_score': q.quality_score,
                    'lesson_name': lesson_name
                })
            
            self.lesson_questions[lesson_name] = questions_data
            return questions_data
            
        except Exception as e:
            print(f"Error generating questions: {e}")
            traceback.print_exc()
            return self._generate_mock_questions(lesson_name)
    
    def _generate_mock_questions(self, lesson_name):
        """Generate mock questions when Python backend unavailable"""
        mock_questions = [
            {
                'id': f'mock_{lesson_name}_easy_1',
                'question': f'What is a key concept in {lesson_name}?',
                'options': {
                    'A': 'Option A - Basic concept',
                    'B': 'Option B - Intermediate concept', 
                    'C': 'Option C - Advanced concept',
                    'D': 'Option D - Unrelated concept'
                },
                'correct_answer': 'A',
                'difficulty': 'easy',
                'topic': lesson_name,
                'quality_score': 0.8,
                'lesson_name': lesson_name
            },
            {
                'id': f'mock_{lesson_name}_medium_1',
                'question': f'How do you apply {lesson_name} in practice?',
                'options': {
                    'A': 'Method A - Simple approach',
                    'B': 'Method B - Standard approach',
                    'C': 'Method C - Complex approach', 
                    'D': 'Method D - Incorrect approach'
                },
                'correct_answer': 'B',
                'difficulty': 'medium',
                'topic': lesson_name,
                'quality_score': 0.7,
                'lesson_name': lesson_name
            }
        ]
        
        self.lesson_questions[lesson_name] = mock_questions
        return mock_questions
    
    def submit_response(self, question_id, selected_answer, response_time):
        """Submit and process a question response"""
        # Find the question
        question = None
        for lesson_questions in self.lesson_questions.values():
            question = next((q for q in lesson_questions if q['id'] == question_id), None)
            if question:
                break
        
        if not question:
            return {'error': 'Question not found'}
        
        is_correct = selected_answer == question['correct_answer']
        
        # Create response record
        response = UserResponse(
            question_id=question_id,
            selected_answer=selected_answer,
            is_correct=is_correct,
            response_time=response_time,
            difficulty=question['difficulty'],
            lesson_name=question['lesson_name'],
            module_name=self.module_title
        )
        
        self.responses.append(response)
        
        if self.available:
            # Use adaptive engine for next difficulty
            self.engine.record_response(response)
            next_difficulty = self.engine.get_next_difficulty(is_correct, response_time)
            should_terminate = self.engine.should_terminate_lesson()
            
            if should_terminate:
                self.engine.mark_lesson_terminated()
        else:
            # Simple difficulty calculation
            next_difficulty = 'hard' if is_correct and response_time < 30 else 'medium' if is_correct else 'easy'
            should_terminate = False
        
        return {
            'question_id': question_id,
            'is_correct': is_correct,
            'correct_answer': question['correct_answer'],
            'response_time': response_time,
            'next_difficulty': next_difficulty,
            'should_terminate': should_terminate,
            'lesson_name': question['lesson_name']
        }
    
    def generate_final_report(self):
        """Generate comprehensive assessment report"""
        if not self.available:
            return self._generate_mock_report()
        
        try:
            # Analyze lesson performance
            self.engine.analyze_lesson_performance()
            
            # Generate report using Python system
            report_text = self.report_gen.generate_report(
                self.responses, 
                self.module_title, 
                self.engine.lesson_confidence
            )
            
            # Convert to structured data for frontend
            return self._parse_report_to_json(report_text)
            
        except Exception as e:
            print(f"Error generating report: {e}")
            return self._generate_mock_report()
    
    def _parse_report_to_json(self, report_text):
        """Parse text report into structured JSON"""
        # Extract key metrics from the report text
        lines = report_text.split('\n')
        
        # Basic parsing (can be enhanced)
        test_responses = [r for r in self.responses if r.difficulty != "skills_assessment"]
        skills_weaknesses = [r.lesson_name for r in self.responses if r.difficulty == "skills_assessment"]
        
        total_questions = len(test_responses)
        correct_answers = sum(1 for r in test_responses if r.is_correct)
        accuracy = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        avg_time = sum(r.response_time for r in test_responses) / total_questions if total_questions > 0 else 0
        
        return {
            'assessment_id': self.assessment_id,
            'generated_at': datetime.now().isoformat(),
            'full_report_text': report_text,
            'summary': {
                'total_questions': total_questions,
                'correct_answers': correct_answers,
                'overall_accuracy': accuracy,
                'avg_response_time': avg_time,
                'skills_weaknesses_count': len(skills_weaknesses)
            },
            'strengths': self._extract_strengths(),
            'weaknesses': skills_weaknesses + self._extract_performance_weaknesses(),
            'skip_recommendations': self._extract_skip_recommendations(),
            'focus_areas': self._extract_focus_areas(),
            'personalized_recommendations': self._extract_recommendations()
        }
    
    def _extract_strengths(self):
        """Extract strengths from performance data"""
        strengths = []
        lesson_performance = {}
        
        # Calculate lesson performance
        for response in self.responses:
            if response.difficulty != "skills_assessment":
                lesson = response.lesson_name
                if lesson not in lesson_performance:
                    lesson_performance[lesson] = {'correct': 0, 'total': 0}
                lesson_performance[lesson]['total'] += 1
                if response.is_correct:
                    lesson_performance[lesson]['correct'] += 1
        
        # Identify strengths (>= 80% accuracy)
        for lesson, perf in lesson_performance.items():
            accuracy = (perf['correct'] / perf['total']) * 100 if perf['total'] > 0 else 0
            if accuracy >= 80:
                strengths.append(lesson)
        
        return strengths
    
    def _extract_performance_weaknesses(self):
        """Extract weaknesses from poor performance"""
        weaknesses = []
        lesson_performance = {}
        
        for response in self.responses:
            if response.difficulty != "skills_assessment":
                lesson = response.lesson_name
                if lesson not in lesson_performance:
                    lesson_performance[lesson] = {'correct': 0, 'total': 0}
                lesson_performance[lesson]['total'] += 1
                if response.is_correct:
                    lesson_performance[lesson]['correct'] += 1
        
        # Identify weaknesses (< 60% accuracy)
        for lesson, perf in lesson_performance.items():
            accuracy = (perf['correct'] / perf['total']) * 100 if perf['total'] > 0 else 0
            if accuracy < 60:
                weaknesses.append(lesson)
        
        return weaknesses
    
    def _extract_skip_recommendations(self):
        """Extract lessons that can be skipped"""
        skip_recs = []
        lesson_performance = {}
        
        for response in self.responses:
            if response.difficulty != "skills_assessment":
                lesson = response.lesson_name
                if lesson not in lesson_performance:
                    lesson_performance[lesson] = {'correct': 0, 'total': 0}
                lesson_performance[lesson]['total'] += 1
                if response.is_correct:
                    lesson_performance[lesson]['correct'] += 1
        
        # Lessons with > 90% accuracy can be skipped
        for lesson, perf in lesson_performance.items():
            accuracy = (perf['correct'] / perf['total']) * 100 if perf['total'] > 0 else 0
            if accuracy > 90:
                skip_recs.append(lesson)
        
        return skip_recs
    
    def _extract_focus_areas(self):
        """Extract areas needing focused attention"""
        focus_areas = []
        
        # Skills assessment weaknesses are focus areas
        for response in self.responses:
            if response.difficulty == "skills_assessment":
                focus_areas.append(response.lesson_name)
        
        return focus_areas
    
    def _extract_recommendations(self):
        """Extract personalized recommendations"""
        weaknesses = len([r for r in self.responses if r.difficulty == "skills_assessment"])
        test_performance = [r for r in self.responses if r.difficulty != "skills_assessment"]
        accuracy = (sum(1 for r in test_performance if r.is_correct) / len(test_performance)) * 100 if test_performance else 0
        
        recommendations = {
            'priority_actions': [],
            'study_schedule': {
                'today': [],
                'this_week': [],
                'this_month': []
            }
        }
        
        if weaknesses > 0:
            recommendations['priority_actions'].append(f'Focus on {weaknesses} areas marked for learning')
            recommendations['study_schedule']['today'].append('Review fundamental concepts (30 min)')
        
        if accuracy < 70:
            recommendations['priority_actions'].append('Improve performance in tested areas')
            recommendations['study_schedule']['this_week'].append('Practice with additional exercises')
        
        if accuracy >= 80:
            recommendations['priority_actions'].append('Continue with advanced topics')
            recommendations['study_schedule']['this_month'].append('Tackle challenging projects')
        
        return recommendations
    
    def _generate_mock_report(self):
        """Generate mock report when Python backend unavailable"""
        return {
            'assessment_id': self.assessment_id,
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_questions': 5,
                'correct_answers': 3,
                'overall_accuracy': 60,
                'avg_response_time': 35
            },
            'strengths': ['Basic Programming Concepts'],
            'weaknesses': ['Advanced Data Structures', 'Algorithm Optimization'],
            'skip_recommendations': [],
            'focus_areas': ['Advanced Data Structures'],
            'personalized_recommendations': {
                'priority_actions': ['Review data structures', 'Practice algorithms'],
                'study_schedule': {
                    'today': ['Review concepts (30 min)'],
                    'this_week': ['Practice coding exercises'],
                    'this_month': ['Complete advanced projects']
                }
            }
        }

# API Routes

@app.route('/api/adaptive/start', methods=['POST'])
def start_assessment():
    """Start a new adaptive assessment session"""
    try:
        data = request.get_json()
        module_title = data.get('module_title', 'Programming Fundamentals')
        user_id = data.get('user_id', 'anonymous')
        
        # Create new assessment session
        assessment_id = str(uuid.uuid4())
        session = AdaptiveAssessmentSession(assessment_id, module_title, user_id)
        active_assessments[assessment_id] = session
        
        # Get available lessons
        lessons = session.get_lessons_for_module()
        
        return jsonify({
            'success': True,
            'data': {
                'assessment_id': assessment_id,
                'module_title': module_title,
                'user_id': user_id,
                'lessons': lessons,
                'python_backend_available': PYTHON_BACKEND_AVAILABLE,
                'status': 'started'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/adaptive/confidence', methods=['POST'])
def assess_confidence():
    """Assess user confidence for a lesson"""
    try:
        data = request.get_json()
        assessment_id = data.get('assessment_id')
        lesson_name = data.get('lesson_name')
        is_confident = data.get('is_confident', False)
        
        session = active_assessments.get(assessment_id)
        if not session:
            return jsonify({'success': False, 'error': 'Assessment session not found'}), 404
        
        result = session.assess_lesson_confidence(lesson_name, is_confident)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/adaptive/generate-questions', methods=['POST'])
def generate_questions():
    """Generate questions for a specific lesson"""
    try:
        data = request.get_json()
        assessment_id = data.get('assessment_id')
        lesson_name = data.get('lesson_name')
        module_number = data.get('module_number', 1)
        lesson_number = data.get('lesson_number', 1)
        
        session = active_assessments.get(assessment_id)
        if not session:
            return jsonify({'success': False, 'error': 'Assessment session not found'}), 404
        
        questions = session.generate_questions_for_lesson(lesson_name, module_number, lesson_number)
        
        return jsonify({
            'success': True,
            'questions': questions
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/adaptive/submit-response', methods=['POST'])
def submit_response():
    """Submit a response to a question"""
    try:
        data = request.get_json()
        assessment_id = data.get('assessment_id')
        question_id = data.get('question_id')
        selected_answer = data.get('selected_answer')
        response_time = data.get('response_time', 0)
        
        session = active_assessments.get(assessment_id)
        if not session:
            return jsonify({'success': False, 'error': 'Assessment session not found'}), 404
        
        result = session.submit_response(question_id, selected_answer, response_time)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/adaptive/generate-report', methods=['POST'])
def generate_report():
    """Generate final assessment report"""
    try:
        data = request.get_json()
        assessment_id = data.get('assessment_id')
        
        session = active_assessments.get(assessment_id)
        if not session:
            return jsonify({'success': False, 'error': 'Assessment session not found'}), 404
        
        report = session.generate_final_report()
        
        return jsonify({
            'success': True,
            'report': report
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'python_backend_available': PYTHON_BACKEND_AVAILABLE,
        'active_assessments': len(active_assessments)
    })

if __name__ == '__main__':
    print("🚀 Starting Error-404 Adaptive Testing API Server...")
    print(f"📊 Python Backend Available: {PYTHON_BACKEND_AVAILABLE}")
    app.run(debug=True, host='0.0.0.0', port=5000)
