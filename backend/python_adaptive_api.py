#!/usr/bin/env python3
"""
Python Backend API for Adaptive Testing Integration
Exposes the adaptive testing functionality as REST API endpoints
"""

import os
import sys
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

# Add the orchestrator directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'orchestrator'))

# Import the adaptive testing modules
from adaptive_test_new import (
    DataScienceMasterclassLoader, 
    GroqQuestionGenerator, 
    AdaptiveEngine, 
    Question,
    UserResponse,
    ReportGenerator
)

app = Flask(__name__)
# Enable CORS with specific configuration for frontend integration
CORS(app, 
     origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

# Global instances
loader = None
generator = None
adaptive_engines = {}  # Store engines per session
report_gen = ReportGenerator()

def initialize_system():
    """Initialize the adaptive testing system"""
    global loader, generator
    try:
        loader = DataScienceMasterclassLoader()
        generator = GroqQuestionGenerator()
        print("✅ Python Adaptive Testing System initialized")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize system: {e}")
        return False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Python Adaptive Testing API is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/get-modules', methods=['GET'])
def get_available_modules():
    """Get available modules for testing - matches PythonBackendService expectation"""
    try:
        # Based on DataScienceMasterclassLoader structure
        modules = [
            {
                'id': 'data-science-masterclass',
                'title': 'Data Science Masterclass',
                'description': 'Comprehensive data science curriculum covering Python fundamentals, statistics, machine learning, and data visualization with hands-on projects and real-world applications.'
            },
            {
                'id': 'python-fundamentals',
                'title': 'Python Programming Fundamentals',
                'description': 'Core Python programming concepts including data types, control structures, functions, and object-oriented programming principles.'
            },
            {
                'id': 'data-analysis-pandas',
                'title': 'Data Analysis with Pandas',
                'description': 'Advanced data manipulation, cleaning, and analysis techniques using pandas library for real-world datasets.'
            },
            {
                'id': 'machine-learning-basics',
                'title': 'Machine Learning Fundamentals',
                'description': 'Introduction to supervised and unsupervised learning algorithms with practical implementation using scikit-learn.'
            },
            {
                'id': 'data-visualization',
                'title': 'Data Visualization & Storytelling',
                'description': 'Creating compelling visualizations using matplotlib, seaborn, and plotly to communicate insights effectively.'
            }
        ]
        
        return jsonify({
            'success': True,
            'modules': modules,
            'total_modules': len(modules)
        })
        
    except Exception as e:
        print(f"❌ Error getting modules: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'modules': []
        }), 500

@app.route('/api/get-lessons', methods=['POST'])
def get_module_lessons():
    """Get lessons for a specific module - matches PythonBackendService expectation"""
    try:
        data = request.get_json()
        module_id = data.get('module_id', '')
        
        # Define lessons based on adaptive_test_new.py curriculum structure
        lesson_mappings = {
            'data-science-masterclass': [
                {'id': 'python-basics', 'name': 'Python Basics & Syntax', 'description': 'Variables, data types, operators, and basic I/O operations'},
                {'id': 'data-structures', 'name': 'Data Structures & Collections', 'description': 'Lists, dictionaries, sets, tuples, and their methods'},
                {'id': 'control-flow', 'name': 'Control Flow & Functions', 'description': 'Loops, conditionals, function definitions, and scope'},
                {'id': 'pandas-intro', 'name': 'Introduction to Pandas', 'description': 'DataFrames, Series, and basic data manipulation'},
                {'id': 'data-cleaning', 'name': 'Data Cleaning & Preprocessing', 'description': 'Handling missing data, duplicates, and data transformation'},
                {'id': 'data-visualization', 'name': 'Data Visualization Fundamentals', 'description': 'Creating plots with matplotlib and seaborn'},
                {'id': 'statistical-analysis', 'name': 'Statistical Analysis', 'description': 'Descriptive statistics, distributions, and hypothesis testing'},
                {'id': 'machine-learning-intro', 'name': 'Machine Learning Concepts', 'description': 'Supervised vs unsupervised learning, model evaluation'}
            ],
            'python-fundamentals': [
                {'id': 'variables-datatypes', 'name': 'Variables & Data Types', 'description': 'Numbers, strings, booleans, and type conversion'},
                {'id': 'operators-expressions', 'name': 'Operators & Expressions', 'description': 'Arithmetic, comparison, logical, and assignment operators'},
                {'id': 'strings-manipulation', 'name': 'String Manipulation', 'description': 'String methods, formatting, and regular expressions'},
                {'id': 'lists-tuples', 'name': 'Lists & Tuples', 'description': 'Creating, accessing, and modifying sequences'},
                {'id': 'dictionaries-sets', 'name': 'Dictionaries & Sets', 'description': 'Key-value pairs and unique collections'},
                {'id': 'functions-modules', 'name': 'Functions & Modules', 'description': 'Function definition, parameters, and code organization'}
            ],
            'data-analysis-pandas': [
                {'id': 'pandas-basics', 'name': 'Pandas Fundamentals', 'description': 'Series and DataFrame creation and basic operations'},
                {'id': 'data-indexing', 'name': 'Data Indexing & Selection', 'description': 'Accessing and filtering data using various methods'},
                {'id': 'data-aggregation', 'name': 'Data Aggregation & Grouping', 'description': 'GroupBy operations and aggregation functions'},
                {'id': 'data-merging', 'name': 'Data Merging & Joining', 'description': 'Combining datasets using merge, join, and concat'},
                {'id': 'time-series', 'name': 'Time Series Analysis', 'description': 'Working with dates, time zones, and temporal data'},
                {'id': 'advanced-pandas', 'name': 'Advanced Pandas Techniques', 'description': 'Performance optimization and advanced operations'}
            ],
            'machine-learning-basics': [
                {'id': 'ml-concepts', 'name': 'ML Concepts & Workflow', 'description': 'Understanding the machine learning pipeline'},
                {'id': 'data-preprocessing', 'name': 'Data Preprocessing for ML', 'description': 'Feature scaling, encoding, and data preparation'},
                {'id': 'supervised-learning', 'name': 'Supervised Learning Algorithms', 'description': 'Regression and classification techniques'},
                {'id': 'model-evaluation', 'name': 'Model Evaluation & Validation', 'description': 'Cross-validation, metrics, and model selection'},
                {'id': 'unsupervised-learning', 'name': 'Unsupervised Learning', 'description': 'Clustering and dimensionality reduction'},
                {'id': 'model-deployment', 'name': 'Model Deployment Basics', 'description': 'Saving, loading, and deploying ML models'}
            ],
            'data-visualization': [
                {'id': 'matplotlib-basics', 'name': 'Matplotlib Fundamentals', 'description': 'Creating basic plots and customizing appearance'},
                {'id': 'seaborn-statistical', 'name': 'Seaborn Statistical Plots', 'description': 'Statistical visualizations and advanced plotting'},
                {'id': 'interactive-plotly', 'name': 'Interactive Plots with Plotly', 'description': 'Creating interactive and web-ready visualizations'},
                {'id': 'dashboard-creation', 'name': 'Dashboard Creation', 'description': 'Building comprehensive data dashboards'},
                {'id': 'visualization-best-practices', 'name': 'Visualization Best Practices', 'description': 'Design principles and effective communication'},
                {'id': 'storytelling-data', 'name': 'Data Storytelling', 'description': 'Narrative techniques for data presentation'}
            ]
        }
        
        lessons = lesson_mappings.get(module_id, [])
        
        return jsonify({
            'success': True,
            'lessons': lessons,
            'module_id': module_id,
            'total_lessons': len(lessons)
        })
        
    except Exception as e:
        print(f"❌ Error getting lessons: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'lessons': []
        }), 500

@app.before_request
def handle_preflight():
    """Handle preflight OPTIONS requests"""
    if request.method == "OPTIONS":
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

@app.route('/api/modules', methods=['GET'])
def get_modules():
    """Get available course modules"""
    try:
        if not loader:
            return jsonify({'error': 'System not initialized'}), 500
        
        modules = loader.get_modules()
        return jsonify({
            'success': True,
            'modules': [
                {
                    'id': i + 1,
                    'title': module.get('title', f'Module {i + 1}'),
                    'description': module.get('description', 'No description available'),
                    'lessons_count': len(loader.get_lessons(i + 1))
                }
                for i, module in enumerate(modules)
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/modules/<int:module_id>/lessons', methods=['GET'])
def get_lessons(module_id):
    """Get lessons for a specific module"""
    try:
        if not loader:
            return jsonify({'error': 'System not initialized'}), 500
        
        lessons = loader.get_lessons(module_id)
        return jsonify({
            'success': True,
            'lessons': [
                {
                    'id': lesson['number'],
                    'name': lesson['name'],
                    'module_id': module_id
                }
                for lesson in lessons
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/start-assessment', methods=['POST'])
def start_assessment():
    """Initialize a new adaptive assessment session using adaptive_test_new.py workflow"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', f'session_{datetime.now().timestamp()}')
        module_id = data.get('module_id', 1)
        course_id = data.get('course_id', 'data-science-masterclass')
        
        if not loader or not generator:
            return jsonify({'error': 'System not initialized'}), 500
        
        # Create new adaptive engine for this session using the actual AdaptiveEngine
        engine = AdaptiveEngine()
        adaptive_engines[session_id] = {
            'engine': engine,
            'module_id': module_id,
            'current_lesson_index': 0,
            'lessons': loader.get_lessons(module_id),
            'current_lesson_questions': [],
            'asked_questions': set(),
            'session_responses': []
        }
        
        # Get lessons for the module
        lessons = loader.get_lessons(module_id)
        if not lessons:
            return jsonify({'error': 'No lessons found in module'}), 404
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'message': f'Assessment session initialized with {len(lessons)} lessons',
            'module_id': module_id,
            'total_lessons': len(lessons),
            'lessons': [{'number': l['number'], 'name': l['name']} for l in lessons]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/set-lesson-confidence', methods=['POST'])
def set_lesson_confidence():
    """Set confidence level for a lesson and start lesson testing"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        lesson_name = data.get('lesson_name')
        is_confident = data.get('is_confident', False)
        
        if session_id not in adaptive_engines:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data = adaptive_engines[session_id]
        engine = session_data['engine']
        
        # Set confidence for the lesson
        engine.set_lesson_confidence(lesson_name, is_confident)
        
        if not is_confident:
            # Mark as weakness and move to next lesson
            current_lesson_id = session_data['current_lesson_id']
            lessons = session_data['lessons']
            
            # Create weakness response (similar to adaptive_test_new.py)
            weakness_response = UserResponse(
                question_id=f"skills_assessment_{lesson_name}",
                selected_answer="NO_PRACTICAL_KNOWLEDGE",
                is_correct=False,
                response_time=0,
                difficulty="skills_assessment",
                lesson_name=lesson_name,
                module_name=f"Module {session_data['module_id']}"
            )
            engine.performance_history.append(weakness_response)
            
            # Move to next lesson
            session_data['current_lesson_id'] += 1
            session_data['lesson_started'] = False
            
            return jsonify({
                'success': True,
                'lesson_skipped': True,
                'message': f'{lesson_name} marked for focused learning',
                'next_lesson': session_data['current_lesson_id'] <= len(lessons)
            })
        else:
            # Start lesson testing
            engine.start_new_lesson(lesson_name)
            session_data['lesson_started'] = True
            session_data['current_questions'] = []
            session_data['question_index'] = 0
            
            return jsonify({
                'success': True,
                'lesson_started': True,
                'message': f'Starting assessment for {lesson_name}'
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/start-adaptive-session', methods=['POST'])
def start_adaptive_session():
    """Start a complete adaptive session with module and lesson flow"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', f'session_{datetime.now().timestamp()}')
        module_id = data.get('module_id', 1)
        
        if not loader:
            return jsonify({'error': 'System not initialized'}), 500
        
        # Create new adaptive engine for this session
        engine = AdaptiveEngine()
        adaptive_engines[session_id] = {
            'engine': engine,
            'module_id': module_id,
            'current_lesson_id': 1,
            'lessons': loader.get_lessons(module_id),
            'current_questions': [],
            'question_index': 0,
            'lesson_started': False
        }
        
        # Get module information
        modules = loader.get_modules()
        selected_module = modules[module_id - 1] if module_id <= len(modules) else None
        
        if not selected_module:
            return jsonify({'error': 'Invalid module ID'}), 400
        
        session_data = adaptive_engines[session_id]
        lessons = session_data['lessons']
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'module_title': selected_module.get('title', f'Module {module_id}'),
            'total_lessons': len(lessons),
            'lessons': [{'id': i+1, 'name': lesson['name']} for i, lesson in enumerate(lessons)],
            'message': 'Adaptive session started successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-next-question', methods=['POST'])
def get_next_question():
    """Get the next adaptive question following the adaptive_test_new.py workflow"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if session_id not in adaptive_engines:
            return jsonify({'error': 'Session not found'}), 404
        
        if not loader or not generator:
            return jsonify({'error': 'System not initialized'}), 500
        
        session_data = adaptive_engines[session_id]
        engine = session_data['engine']
        lessons = session_data['lessons']
        current_lesson_id = session_data['current_lesson_id']
        
        # Check if we have more lessons
        if current_lesson_id > len(lessons):
            return jsonify({
                'completed': True,
                'message': 'All lessons completed'
            })
        
        # Get current lesson
        current_lesson = lessons[current_lesson_id - 1]
        lesson_name = current_lesson['name']
        
        # If lesson not started, we need confidence check first
        if not session_data['lesson_started']:
            return jsonify({
                'need_confidence_check': True,
                'lesson_name': lesson_name,
                'lesson_id': current_lesson_id,
                'message': f'Confidence check needed for {lesson_name}'
            })
        
        # Check if current lesson should be terminated
        if engine.should_terminate_lesson():
            engine.mark_lesson_terminated()
            # Move to next lesson
            session_data['current_lesson_id'] += 1
            session_data['lesson_started'] = False
            session_data['current_questions'] = []
            session_data['question_index'] = 0
            return get_next_question()  # Recursive call for next lesson
        
        # Generate questions if we don't have any
        if not session_data['current_questions']:
            module_id = session_data['module_id']
            content = loader.load_lesson_content(module_id, current_lesson_id)
            
            if len(content) < 100:
                # Skip this lesson due to insufficient content
                session_data['current_lesson_id'] += 1
                session_data['lesson_started'] = False
                return get_next_question()  # Try next lesson
            
            # Generate questions for current difficulty
            difficulty = engine.current_difficulty
            topic = f"Module {module_id} - {lesson_name}"
            questions = generator.generate_questions(content, topic, 2)  # Generate 2 questions per difficulty
            
            if not questions:
                session_data['current_lesson_id'] += 1
                session_data['lesson_started'] = False
                return jsonify({'error': 'Failed to generate questions'}), 500
            
            session_data['current_questions'] = questions
            session_data['question_index'] = 0
        
        # Get current question
        questions = session_data['current_questions']
        question_index = session_data['question_index']
        
        if question_index >= len(questions):
            # Need more questions for different difficulty
            session_data['current_questions'] = []
            return get_next_question()  # Generate questions for next difficulty
        
        current_question = questions[question_index]
        session_data['question_index'] += 1
        
        return jsonify({
            'success': True,
            'question': {
                'id': current_question.id,
                'question': current_question.question,
                'options': current_question.options,
                'difficulty': current_question.difficulty,
                'topic': current_question.topic,
                'lesson_name': lesson_name,
                'lesson_id': current_lesson_id,
                'module_id': session_data['module_id']
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-questions', methods=['POST'])
def generate_questions():
    """Legacy endpoint - Generate adaptive questions for a lesson"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        module_id = data.get('module_id', 1)
        lesson_id = data.get('lesson_id', 1)
        lesson_name = data.get('lesson_name', 'Unknown Lesson')
        num_questions = data.get('num_questions', 6)
        
        if session_id not in adaptive_engines:
            return jsonify({'error': 'Session not found'}), 404
        
        if not loader or not generator:
            return jsonify({'error': 'System not initialized'}), 500
        
        # Load lesson content
        content = loader.load_lesson_content(module_id, lesson_id)
        if len(content) < 100:
            return jsonify({'error': 'Insufficient content for question generation'}), 400
        
        # Generate questions
        topic = f"Module {module_id} - {lesson_name}"
        questions = generator.generate_questions(content, topic, num_questions)
        
        if not questions:
            return jsonify({'error': 'Failed to generate questions'}), 500
        
        # Convert questions to JSON-serializable format
        questions_data = []
        for q in questions:
            questions_data.append({
                'id': q.id,
                'question': q.question,
                'options': q.options,
                'correct_answer': q.correct_answer,
                'difficulty': q.difficulty,
                'topic': q.topic,
                'quality_score': q.quality_score
            })
        
        return jsonify({
            'success': True,
            'questions': questions_data,
            'topic': topic,
            'lesson_name': lesson_name
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submit-response', methods=['POST'])
def submit_response():
    """Submit user response and get next difficulty"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        question_id = data.get('question_id')
        selected_answer = data.get('selected_answer')
        response_time = data.get('response_time', 0)
        difficulty = data.get('difficulty', 'medium')
        lesson_name = data.get('lesson_name', 'Unknown')
        module_name = data.get('module_name', 'Unknown Module')
        correct_answer = data.get('correct_answer')
        
        if session_id not in adaptive_engines:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data = adaptive_engines[session_id]
        engine = session_data['engine']
        
        # Determine if answer is correct
        is_correct = selected_answer.upper() == correct_answer.upper()
        
        # Create user response (like in adaptive_test_new.py)
        response = UserResponse(
            question_id=question_id,
            selected_answer=selected_answer,
            is_correct=is_correct,
            response_time=response_time,
            difficulty=difficulty,
            lesson_name=lesson_name,
            module_name=f"Module_{session_data['module_id']}"
        )
        
        # Record response in both places
        session_data['session_responses'].append(response)
        engine.record_response(response)
        next_difficulty = engine.get_next_difficulty(is_correct, response_time)
        
        # Check if lesson should be terminated
        should_terminate = engine.should_terminate_lesson()
        
        return jsonify({
            'success': True,
            'is_correct': is_correct,
            'next_difficulty': next_difficulty,
            'should_terminate_lesson': should_terminate,
            'consecutive_wrong': engine.consecutive_wrong_lesson,
            'current_difficulty': engine.current_difficulty
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/start-lesson', methods=['POST'])
def start_lesson():
    """Start a new lesson in the adaptive engine"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        lesson_name = data.get('lesson_name')
        
        if session_id not in adaptive_engines:
            return jsonify({'error': 'Session not found'}), 404
        
        engine = adaptive_engines[session_id]
        engine.start_new_lesson(lesson_name)
        
        return jsonify({
            'success': True,
            'message': f'Started lesson: {lesson_name}',
            'current_difficulty': engine.current_difficulty
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    """Generate comprehensive assessment report"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        topic = data.get('topic', 'Assessment')
        
        if session_id not in adaptive_engines:
            return jsonify({'error': 'Session not found'}), 404
        
        engine = adaptive_engines[session_id]
        
        # Analyze performance
        engine.analyze_lesson_performance()
        
        # Generate report
        report_text = report_gen.generate_report(
            engine.performance_history, 
            topic, 
            engine.lesson_confidence
        )
        
        # Extract structured data from performance
        lesson_performance = {}
        for lesson, perf in engine.lesson_performance.items():
            lesson_performance[lesson] = {
                'overall_accuracy': perf.get('overall_accuracy', 0),
                'needs_focus': perf.get('needs_focus', False),
                'is_strength': perf.get('is_strength', False),
                'terminated': perf.get('terminated', False)
            }
        
        # Calculate overall statistics
        test_responses = [r for r in engine.performance_history if r.difficulty != 'skills_assessment']
        total_questions = len(test_responses)
        correct_answers = sum(1 for r in test_responses if r.is_correct)
        overall_accuracy = (correct_answers / total_questions * 100) if total_questions > 0 else 0
        
        return jsonify({
            'success': True,
            'report_text': report_text,
            'structured_data': {
                'overall_accuracy': overall_accuracy,
                'total_questions': total_questions,
                'correct_answers': correct_answers,
                'lesson_performance': lesson_performance,
                'lesson_confidence': engine.lesson_confidence,
                'performance_history': [
                    {
                        'question_id': r.question_id,
                        'is_correct': r.is_correct,
                        'difficulty': r.difficulty,
                        'lesson_name': r.lesson_name,
                        'response_time': r.response_time
                    }
                    for r in engine.performance_history
                ]
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/session-status', methods=['GET'])
def get_session_status():
    """Get current session status and statistics"""
    try:
        session_id = request.args.get('session_id')
        
        if not session_id or session_id not in adaptive_engines:
            return jsonify({'error': 'Session not found'}), 404
        
        engine = adaptive_engines[session_id]
        
        # Calculate current statistics
        test_responses = [r for r in engine.performance_history if r.difficulty != 'skills_assessment']
        total_questions = len(test_responses)
        correct_answers = sum(1 for r in test_responses if r.is_correct)
        accuracy = (correct_answers / total_questions * 100) if total_questions > 0 else 0
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'current_lesson': engine.current_lesson,
            'current_difficulty': engine.current_difficulty,
            'total_questions': total_questions,
            'correct_answers': correct_answers,
            'accuracy': accuracy,
            'consecutive_wrong': engine.consecutive_wrong_lesson,
            'questions_in_current_difficulty': engine.questions_in_current_difficulty
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cleanup-session', methods=['POST'])
def cleanup_session():
    """Clean up a completed session"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if session_id in adaptive_engines:
            del adaptive_engines[session_id]
        
        return jsonify({
            'success': True,
            'message': 'Session cleaned up'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-session-analytics', methods=['POST'])
def get_session_analytics():
    """Get comprehensive session analytics for agentic learning system"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default_session')
        
        # Get session data if exists
        analytics = {}
        
        if session_id in adaptive_engines:
            engine = adaptive_engines[session_id]
            
            # Comprehensive session analytics
            analytics = {
                'session_id': session_id,
                'current_lesson': engine.current_lesson,
                'lesson_performance': dict(engine.lesson_performance),
                'difficulty_stats': {
                    'current_difficulty': engine.current_difficulty,
                    'consecutive_correct': engine.consecutive_correct,
                    'consecutive_wrong': engine.consecutive_wrong,
                    'questions_in_current_difficulty': engine.questions_in_current_difficulty
                },
                'learning_patterns': {
                    'total_responses': len(engine.performance_history),
                    'accuracy_by_lesson': {},
                    'time_efficiency': {},
                    'weakness_patterns': []
                },
                'adaptive_insights': {
                    'adaptation_count': getattr(engine, 'adaptation_count', 0),
                    'mastery_indicators': [],
                    'learning_velocity': 0.0,
                    'predicted_outcomes': {}
                }
            }
            
            # Calculate accuracy by lesson
            for lesson_num, performance in engine.lesson_performance.items():
                if 'questions_attempted' in performance and performance['questions_attempted'] > 0:
                    accuracy = (performance.get('questions_correct', 0) / performance['questions_attempted']) * 100
                    analytics['learning_patterns']['accuracy_by_lesson'][lesson_num] = accuracy
            
            # Analyze response patterns for learning insights
            if engine.performance_history:
                total_time = sum(r.response_time for r in engine.performance_history if hasattr(r, 'response_time'))
                avg_time = total_time / len(engine.performance_history) if engine.performance_history else 0
                analytics['learning_patterns']['time_efficiency']['average_response_time'] = avg_time
                
                # Identify weakness patterns
                wrong_responses = [r for r in engine.performance_history if not r.is_correct]
                if wrong_responses:
                    difficulty_errors = {}
                    for r in wrong_responses:
                        diff = getattr(r, 'difficulty', 'unknown')
                        difficulty_errors[diff] = difficulty_errors.get(diff, 0) + 1
                    analytics['learning_patterns']['weakness_patterns'] = difficulty_errors
        else:
            # Session not found, return basic structure
            analytics = {
                'session_id': session_id,
                'status': 'session_not_found',
                'message': 'No active session found for analytics',
                'learning_patterns': {
                    'total_responses': 0,
                    'accuracy_by_lesson': {},
                    'time_efficiency': {'average_response_time': 0},
                    'weakness_patterns': []
                },
                'adaptive_insights': {
                    'learning_velocity': 0.0,
                    'predicted_outcomes': {}
                }
            }
        
        return jsonify({
            'success': True,
            'analytics': analytics,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Session analytics error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/get-global-analytics', methods=['GET'])
def get_global_analytics():
    """Get global analytics across all sessions for dashboard"""
    try:
        global_analytics = {
            'total_active_sessions': len(adaptive_engines),
            'system_health': {
                'loader_status': 'active' if loader else 'inactive',
                'generator_status': 'active' if generator else 'inactive',
                'total_modules': len(loader.get_available_modules()) if loader else 0
            },
            'performance_metrics': {
                'average_session_length': 0,
                'total_questions_generated': 0,
                'global_accuracy': 0.0,
                'difficulty_distribution': {'easy': 0, 'medium': 0, 'hard': 0}
            },
            'learning_insights': {
                'most_challenging_lessons': [],
                'high_performance_patterns': [],
                'common_weaknesses': []
            }
        }
        
        # Calculate aggregate metrics
        if adaptive_engines:
            total_questions = 0
            total_correct = 0
            difficulty_counts = {'easy': 0, 'medium': 0, 'hard': 0}
            
            for engine in adaptive_engines.values():
                total_questions += len(engine.performance_history)
                total_correct += sum(1 for r in engine.performance_history if r.is_correct)
                
                # Count difficulty distribution
                for r in engine.performance_history:
                    diff = getattr(r, 'difficulty', 'medium')
                    if diff in difficulty_counts:
                        difficulty_counts[diff] += 1
            
            if total_questions > 0:
                global_analytics['performance_metrics']['global_accuracy'] = (total_correct / total_questions) * 100
                global_analytics['performance_metrics']['total_questions_generated'] = total_questions
                global_analytics['performance_metrics']['difficulty_distribution'] = difficulty_counts
        
        return jsonify({
            'success': True,
            'global_analytics': global_analytics,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Global analytics error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Python Adaptive Testing API...")
    
    if initialize_system():
        print("✅ System initialized successfully")
        print("🌐 Starting Flask server on http://localhost:5001")
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        print("❌ Failed to start system")
        sys.exit(1)
