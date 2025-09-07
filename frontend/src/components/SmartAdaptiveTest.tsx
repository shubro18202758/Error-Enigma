import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EdTechPlatform } from '../services';

interface Module {
  number: number;
  title: string;
  description?: string;
}

interface Lesson {
  number: number;
  name: string;
}

interface Question {
  id: string;
  question: string;
  options: { [key: string]: string };
  correct_answer: string;
  difficulty: string;
  topic: string;
  lesson_name: string;
}

interface SmartAdaptiveTestProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (results: any) => void;
}

const SmartAdaptiveTest: React.FC<SmartAdaptiveTestProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { currentUser } = useAuth();
  const [edTechPlatform] = useState(() => new EdTechPlatform());
  
  // State management following adaptive_test_new.py workflow
  const [currentStep, setCurrentStep] = useState<'module-selection' | 'confidence-check' | 'testing' | 'completed'>('module-selection');
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  
  // Test session state
  const [sessionId, setSessionId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Question state
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [startTime, setStartTime] = useState<number>(0);

  // Initialize - load available modules
  useEffect(() => {
    if (isOpen && currentStep === 'module-selection') {
      loadModules();
    }
  }, [isOpen, currentStep]);

  // Timer for questions
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === 'testing' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAnswerSubmit(''); // Auto-submit empty answer
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, timeRemaining]);

  const loadModules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use EdTechPlatform to get available modules from Python backend
      const availableModules = await edTechPlatform.getAvailableModules();
      
      if (availableModules && availableModules.length > 0) {
        setModules(availableModules.map((m, index) => ({
          number: index + 1,
          title: m.title || `Module ${index + 1}`,
          description: m.description || 'No description available'
        })));
      } else {
        setError('No modules found. Please check the course content.');
      }
    } catch (error) {
      console.error('Failed to load modules:', error);
      setError('Failed to load course modules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectModule = async (module: Module) => {
    try {
      setIsLoading(true);
      setSelectedModule(module);
      
      // Start assessment session
      const testSession = await edTechPlatform.startAdaptiveTest(
        'data-science-masterclass',
        'python-basics',
        'introduction',
        true
      );
      
      if (testSession && testSession.id) {
        setSessionId(testSession.id);
        
        // The Python backend should return lessons in the session
        // For now, create mock lessons - in real implementation this comes from backend
        const mockLessons = [
          { number: 1, name: 'Python Fundamentals' },
          { number: 2, name: 'Data Structures' },
          { number: 3, name: 'Control Flow' },
          { number: 4, name: 'Functions and Modules' }
        ];
        
        setLessons(mockLessons);
        setCurrentLessonIndex(0);
        setCurrentLesson(mockLessons[0]);
        setCurrentStep('confidence-check');
        
        console.log(`✅ Assessment session started: ${testSession.id}`);
      } else {
        throw new Error('Failed to start assessment session');
      }
    } catch (error) {
      console.error('Failed to start assessment:', error);
      setError('Failed to start assessment. Please ensure the Python backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfidenceResponse = async (isConfident: boolean) => {
    if (!currentLesson) return;
    
    try {
      setIsLoading(true);
      
      if (!isConfident) {
        // Mark as weakness - goes to compulsory roadmap
        console.log(`📚 ${currentLesson.name} marked for compulsory learning (no confidence)`);
        
        // Add to responses as skills assessment weakness
        setResponses(prev => [...prev, {
          type: 'compulsory_learning',
          lesson: currentLesson.name,
          confident: false,
          category: 'weak_foundation',
          questions_attempted: 0,
          questions_correct: 0,
          recommendation: 'Complete structured learning path'
        }]);
        
        moveToNextLesson();
      } else {
        // Start testing this lesson with exactly 2 questions
        console.log(`🎯 Starting 2-question assessment for: ${currentLesson.name}`);
        setCurrentStep('testing');
        setQuestionNumber(1);
        
        // Initialize lesson tracking
        setResponses(prev => [...prev, {
          type: 'lesson_assessment_started',
          lesson: currentLesson.name,
          confident: true,
          questions_attempted: 0,
          questions_correct: 0,
          lesson_responses: []
        }]);
        
        loadNextQuestion();
      }
    } catch (error) {
      console.error('Error handling confidence response:', error);
      setError('Failed to process confidence response.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextQuestion = async () => {
    if (!currentLesson) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we've already asked 2 questions for this lesson
      const lessonData = responses.find(r => 
        (r.type === 'lesson_assessment_started' || r.type === 'lesson_assessment_completed') 
        && r.lesson === currentLesson.name
      );
      
      const questionsAttempted = lessonData?.questions_attempted || 0;
      if (questionsAttempted >= 2) {
        console.log(`✅ Lesson completed: ${currentLesson.name} (2/2 questions answered)`);
        moveToNextLesson();
        return;
      }
      
      // Generate a question for this specific lesson
      // For now, create mock questions based on lesson content
      const mockQuestions = generateMockQuestionsForLesson(currentLesson.name, questionNumber);
      
      if (mockQuestions.length > 0) {
        const question = mockQuestions[0];
        setCurrentQuestion({
          id: `${currentLesson.name.toLowerCase().replace(/\s+/g, '_')}_q${questionNumber}`,
          question: question.question,
          options: question.options,
          correct_answer: question.correct_answer,
          difficulty: questionNumber === 1 ? 'medium' : 'hard', // First question medium, second hard
          topic: currentLesson.name,
          lesson_name: currentLesson.name
        });
        
        setSelectedAnswer('');
        setTimeRemaining(45);
        setStartTime(Date.now());
        
        console.log(`📝 Question ${questionNumber}/2 for ${currentLesson.name} (${questionNumber === 1 ? 'medium' : 'hard'})`);
      } else {
        console.log(`⚠️ Could not generate question for ${currentLesson.name}`);
        moveToNextLesson();
      }
    } catch (error) {
      console.error('Failed to load next question:', error);
      setError('Failed to load next question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock questions for different lessons (in real implementation, this would come from Python backend)
  const generateMockQuestionsForLesson = (lessonName: string, questionNum: number) => {
    const questionSets: { [key: string]: any[] } = {
      'Python Fundamentals': [
        {
          question: 'What is the correct way to declare a variable in Python?',
          options: {
            'A': 'var x = 5',
            'B': 'x = 5',
            'C': 'int x = 5',
            'D': 'declare x = 5'
          },
          correct_answer: 'B'
        },
        {
          question: 'Which of the following is NOT a valid Python data type?',
          options: {
            'A': 'list',
            'B': 'tuple', 
            'C': 'array',
            'D': 'dict'
          },
          correct_answer: 'C'
        }
      ],
      'Data Structures': [
        {
          question: 'How do you create an empty list in Python?',
          options: {
            'A': 'list = {}',
            'B': 'list = []',
            'C': 'list = ()',
            'D': 'list = ""'
          },
          correct_answer: 'B'
        },
        {
          question: 'What method adds an element to the end of a list?',
          options: {
            'A': 'add()',
            'B': 'insert()',
            'C': 'append()',
            'D': 'push()'
          },
          correct_answer: 'C'
        }
      ],
      'Control Flow': [
        {
          question: 'Which keyword is used to start a loop that continues while a condition is true?',
          options: {
            'A': 'for',
            'B': 'while',
            'C': 'loop',
            'D': 'repeat'
          },
          correct_answer: 'B'
        },
        {
          question: 'What does the "break" statement do in a loop?',
          options: {
            'A': 'Continues to next iteration',
            'B': 'Exits the loop completely',
            'C': 'Pauses the loop',
            'D': 'Restarts the loop'
          },
          correct_answer: 'B'
        }
      ],
      'Functions and Modules': [
        {
          question: 'How do you define a function in Python?',
          options: {
            'A': 'function myFunc():',
            'B': 'def myFunc():',
            'C': 'create myFunc():',
            'D': 'func myFunc():'
          },
          correct_answer: 'B'
        },
        {
          question: 'What keyword is used to return a value from a function?',
          options: {
            'A': 'return',
            'B': 'give',
            'C': 'output',
            'D': 'yield'
          },
          correct_answer: 'A'
        }
      ]
    };

    const lessonQuestions = questionSets[lessonName] || [
      {
        question: `What is a key concept in ${lessonName}?`,
        options: {
          'A': 'Option A',
          'B': 'Option B', 
          'C': 'Option C',
          'D': 'Option D'
        },
        correct_answer: 'B'
      },
      {
        question: `Which practice is recommended for ${lessonName}?`,
        options: {
          'A': 'Practice A',
          'B': 'Practice B',
          'C': 'Practice C', 
          'D': 'Practice D'
        },
        correct_answer: 'C'
      }
    ];

    return lessonQuestions.slice(questionNum - 1, questionNum);
  };

  const handleAnswerSubmit = async (answer?: string) => {
    if (!currentQuestion || !currentLesson) return;
    
    const finalAnswer = answer || selectedAnswer;
    const responseTime = (Date.now() - startTime) / 1000;
    const isCorrect = finalAnswer.toUpperCase() === currentQuestion.correct_answer.toUpperCase();
    
    try {
      setIsLoading(true);
      
      console.log(`${isCorrect ? '✅' : '❌'} Question ${questionNumber}: ${isCorrect ? 'Correct' : 'Incorrect'}`);
      
      // Update current lesson assessment
      setResponses(prev => {
        const updated = [...prev];
        const lessonAssessmentIndex = updated.findIndex(r => 
          r.type === 'lesson_assessment_started' && r.lesson === currentLesson.name
        );
        
        if (lessonAssessmentIndex !== -1) {
          const lessonData = updated[lessonAssessmentIndex];
          lessonData.questions_attempted = (lessonData.questions_attempted || 0) + 1;
          lessonData.questions_correct = (lessonData.questions_correct || 0) + (isCorrect ? 1 : 0);
          
          if (!lessonData.lesson_responses) lessonData.lesson_responses = [];
          lessonData.lesson_responses.push({
            question_id: currentQuestion.id,
            question: currentQuestion.question,
            selected_answer: finalAnswer,
            correct_answer: currentQuestion.correct_answer,
            is_correct: isCorrect,
            response_time: responseTime,
            difficulty: currentQuestion.difficulty
          });
        }
        
        return updated;
      });
      
      // Check if we've completed 2 questions for this lesson
      const lessonData = responses.find(r => 
        r.type === 'lesson_assessment_started' && r.lesson === currentLesson.name
      );
      
      const questionsAttempted = (lessonData?.questions_attempted || 0) + 1;
      const questionsCorrect = (lessonData?.questions_correct || 0) + (isCorrect ? 1 : 0);
      
      if (questionsAttempted >= 2) {
        // Categorize lesson based on adaptive_test_new.py logic
        let category: string;
        let recommendation: string;
        
        if (questionsCorrect === 2) {
          // Both correct → Strong topics (less focus)
          category = 'strong_topic';
          recommendation = 'Topic mastered - minimal review needed';
          console.log(`🟢 ${currentLesson.name}: Strong topic (2/2 correct)`);
        } else if (questionsCorrect === 1) {
          // One incorrect → Suggested learning
          category = 'suggested_learning';
          recommendation = 'Recommended for focused practice and review';
          console.log(`🟡 ${currentLesson.name}: Suggested learning (1/2 correct)`);
        } else {
          // Both wrong → Compulsory roadmap
          category = 'compulsory_learning';
          recommendation = 'Essential for structured learning path';
          console.log(`🔴 ${currentLesson.name}: Compulsory learning (0/2 correct)`);
        }
        
        // Update lesson final categorization
        setResponses(prev => {
          const updated = [...prev];
          const lessonIndex = updated.findIndex(r => 
            r.type === 'lesson_assessment_started' && r.lesson === currentLesson.name
          );
          
          if (lessonIndex !== -1) {
            updated[lessonIndex] = {
              ...updated[lessonIndex],
              type: 'lesson_assessment_completed',
              category,
              recommendation,
              questions_attempted: questionsAttempted,
              questions_correct: questionsCorrect,
              accuracy_percentage: (questionsCorrect / questionsAttempted) * 100
            };
          }
          
          return updated;
        });
        
        // Move to next lesson after brief pause
        setTimeout(() => moveToNextLesson(), 2000);
      } else {
        // Continue with next question (question 2)
        setQuestionNumber(prev => prev + 1);
        setTimeout(() => loadNextQuestion(), 1500);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const moveToNextLesson = () => {
    const nextIndex = currentLessonIndex + 1;
    
    if (nextIndex >= lessons.length) {
      // All lessons completed
      setCurrentStep('completed');
      console.log('🎉 All lessons completed!');
      return;
    }
    
    // Move to next lesson
    setCurrentLessonIndex(nextIndex);
    setCurrentLesson(lessons[nextIndex]);
    setCurrentStep('confidence-check');
    setQuestionNumber(1);
    
    console.log(`📖 Moving to next lesson: ${lessons[nextIndex].name}`);
  };

  const handleClose = () => {
    // Reset all state
    setCurrentStep('module-selection');
    setSelectedModule(null);
    setLessons([]);
    setCurrentLessonIndex(0);
    setCurrentLesson(null);
    setSessionId('');
    setCurrentQuestion(null);
    setResponses([]);
    setError(null);
    onClose();
  };

  // Generate personalized roadmap based on assessment results
  const generatePersonalizedRoadmap = () => {
    const completedAssessments = responses.filter(r => 
      r.type === 'lesson_assessment_completed' || r.type === 'compulsory_learning'
    );

    const roadmap = {
      assessmentResults: completedAssessments,
      learningPath: {
        compulsoryTopics: responses.filter(r => r.category === 'compulsory_learning'),
        suggestedTopics: responses.filter(r => r.category === 'suggested_learning'), 
        masteredTopics: responses.filter(r => r.category === 'strong_topic'),
        totalTopics: lessons.length,
        completionPercentage: Math.round(
          (responses.filter(r => r.category === 'strong_topic').length / lessons.length) * 100
        )
      },
      recommendations: {
        studyPlan: generateStudyPlan(),
        focusAreas: responses.filter(r => r.category === 'compulsory_learning').map(r => r.lesson),
        reviewAreas: responses.filter(r => r.category === 'suggested_learning').map(r => r.lesson),
        strengths: responses.filter(r => r.category === 'strong_topic').map(r => r.lesson)
      },
      moduleInfo: {
        moduleTitle: selectedModule?.title || 'Unknown Module',
        totalLessons: lessons.length,
        assessmentDate: new Date().toISOString()
      }
    };

    console.log('📋 Generated personalized roadmap:', roadmap);
    return roadmap;
  };

  // Generate a study plan based on assessment results
  const generateStudyPlan = () => {
    const compulsory = responses.filter(r => r.category === 'compulsory_learning');
    const suggested = responses.filter(r => r.category === 'suggested_learning');
    const mastered = responses.filter(r => r.category === 'strong_topic');

    return {
      phase1: {
        title: 'Foundation Building (Priority)',
        topics: compulsory.map(r => r.lesson),
        estimatedWeeks: Math.max(compulsory.length * 1, 1),
        description: 'Focus on core concepts with structured learning'
      },
      phase2: {
        title: 'Skills Enhancement (Recommended)', 
        topics: suggested.map(r => r.lesson),
        estimatedWeeks: Math.max(suggested.length * 0.5, 1),
        description: 'Strengthen understanding through practice'
      },
      phase3: {
        title: 'Advanced Applications (Optional)',
        topics: mastered.map(r => r.lesson),
        estimatedWeeks: Math.max(mastered.length * 0.25, 0.5),
        description: 'Quick review and advanced practice'
      }
    };
  };

  // Send assessment results to AI Assistant for roadmap generation
  const sendToAIAssistant = async (roadmapData: any) => {
    try {
      console.log('🤖 Sending assessment results to AI Assistant...', roadmapData);
      
      // Store the roadmap data in localStorage for AI Assistant to access
      localStorage.setItem('assessmentRoadmap', JSON.stringify({
        timestamp: new Date().toISOString(),
        data: roadmapData,
        triggerAI: true
      }));
      
      // Trigger a custom event that the AI Assistant can listen to
      window.dispatchEvent(new CustomEvent('assessmentCompleted', {
        detail: roadmapData
      }));
      
      // Also try to communicate directly with AgenticAIAssistant if available
      const aiMessage = generateAIPrompt(roadmapData);
      localStorage.setItem('aiAssistantMessage', JSON.stringify({
        type: 'assessment_results',
        message: aiMessage,
        timestamp: new Date().toISOString(),
        autoTrigger: true
      }));
      
    } catch (error) {
      console.error('Failed to send to AI Assistant:', error);
    }
  };

  // Generate AI prompt for roadmap creation
  const generateAIPrompt = (roadmapData: any) => {
    const { learningPath, recommendations } = roadmapData;
    
    return `I just completed an adaptive assessment for ${roadmapData.moduleInfo.moduleTitle}. Here are my results:

📊 Assessment Summary:
- Priority Topics (Need Focus): ${learningPath.compulsoryTopics.length} topics
- Review Topics (Suggested): ${learningPath.suggestedTopics.length} topics  
- Mastered Topics (Strong): ${learningPath.masteredTopics.length} topics
- Overall Completion: ${learningPath.completionPercentage}%

🔴 Priority Learning Areas:
${learningPath.compulsoryTopics.map((t: any) => `• ${t.lesson}`).join('\n')}

🟡 Areas for Review:
${learningPath.suggestedTopics.map((t: any) => `• ${t.lesson}`).join('\n')}

🟢 Strong Areas:
${learningPath.masteredTopics.map((t: any) => `• ${t.lesson}`).join('\n')}

Please create a personalized learning roadmap with:
1. Detailed study plan with timeline
2. Specific resources for each priority topic
3. Practice exercises and projects
4. Milestones and progress tracking
5. Integration with available course materials

Make it comprehensive and actionable for an EdTech platform experience.`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🎯 Smart Adaptive Assessment</h2>
              <p className="text-blue-100">AI-Powered Personalized Learning Evaluation</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              <div className="flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}

          {/* Module Selection */}
          {currentStep === 'module-selection' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">📚 Select Learning Module</h3>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading available modules...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {modules.map((module) => (
                    <div
                      key={module.number}
                      onClick={() => selectModule(module)}
                      className="p-6 border rounded-lg hover:shadow-lg cursor-pointer transition-all bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100"
                    >
                      <h4 className="text-lg font-semibold text-gray-800">
                        Module {module.number}: {module.title}
                      </h4>
                      <p className="text-gray-600 mt-2">{module.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Confidence Check */}
          {currentStep === 'confidence-check' && currentLesson && (
            <div>
              <h3 className="text-xl font-semibold mb-4">
                📋 Skills Assessment: {currentLesson.name}
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Before testing your practical knowledge, let's assess your confidence level.
                </p>
                <p className="text-lg font-medium mb-6">
                  How confident are you with hands-on skills in: <span className="text-blue-600">{currentLesson.name}</span>?
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={() => handleConfidenceResponse(true)}
                    disabled={isLoading}
                    className="w-full p-4 text-left rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🟢</span>
                      <div>
                        <div className="font-semibold text-green-800">I can use this practically</div>
                        <div className="text-green-600">Test my skills with adaptive questions</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleConfidenceResponse(false)}
                    disabled={isLoading}
                    className="w-full p-4 text-left rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🔴</span>
                      <div>
                        <div className="font-semibold text-red-800">I don't know practical usage</div>
                        <div className="text-red-600">Mark for focused learning</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Testing */}
          {currentStep === 'testing' && currentQuestion && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  📝 {currentLesson?.name} - Question {questionNumber}
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    Level: {currentQuestion.difficulty.toUpperCase()}
                  </div>
                  <div className={`text-sm px-3 py-1 rounded-full ${
                    timeRemaining <= 10 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    ⏱️ {timeRemaining}s
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border rounded-lg p-6 mb-6">
                <h4 className="text-lg font-medium mb-4 text-gray-900">{currentQuestion.question}</h4>
                
                <div className="space-y-3">
                  {Object.entries(currentQuestion.options).map(([letter, option]) => (
                    <label
                      key={letter}
                      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={letter}
                        checked={selectedAnswer === letter}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        className="mr-3"
                        disabled={isLoading}
                      />
                      <span className="font-medium mr-2 text-gray-900">{letter})</span>
                      <span className="text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Exit Assessment
                </button>
                <button
                  onClick={() => handleAnswerSubmit()}
                  disabled={!selectedAnswer || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Submitting...' : 'Submit Answer'}
                </button>
              </div>
            </div>
          )}

          {/* Completed */}
          {currentStep === 'completed' && (
            <div>
              <h3 className="text-2xl font-bold text-green-600 mb-6 text-center">🎉 Assessment Completed!</h3>
              
              {/* Personalized Roadmap */}
              <div className="space-y-6">
                {/* Compulsory Learning (Red) */}
                {responses.filter(r => r.category === 'compulsory_learning').length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                      🔴 Priority Learning Path (Must Complete)
                    </h4>
                    <div className="space-y-3">
                      {responses.filter(r => r.category === 'compulsory_learning').map((lesson, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div>
                            <span className="font-medium text-black">{lesson.lesson}</span>
                            <p className="text-sm text-gray-700">{lesson.recommendation}</p>
                          </div>
                          <div className="text-sm text-red-700 font-medium">
                            {lesson.confident === false ? 'No confidence' : `${lesson.questions_correct || 0}/${lesson.questions_attempted || 0} correct`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Learning (Yellow) */}
                {responses.filter(r => r.category === 'suggested_learning').length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                      🟡 Recommended Review Topics
                    </h4>
                    <div className="space-y-3">
                      {responses.filter(r => r.category === 'suggested_learning').map((lesson, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div>
                            <span className="font-medium text-black">{lesson.lesson}</span>
                            <p className="text-sm text-gray-700">{lesson.recommendation}</p>
                          </div>
                          <div className="text-sm text-yellow-700 font-medium">
                            {lesson.questions_correct || 0}/{lesson.questions_attempted || 0} correct
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strong Topics (Green) */}
                {responses.filter(r => r.category === 'strong_topic').length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                      🟢 Mastered Topics (Minimal Focus Needed)
                    </h4>
                    <div className="space-y-3">
                      {responses.filter(r => r.category === 'strong_topic').map((lesson, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div>
                            <span className="font-medium text-black">{lesson.lesson}</span>
                            <p className="text-sm text-gray-700">{lesson.recommendation}</p>
                          </div>
                          <div className="text-sm text-green-700 font-medium">
                            {lesson.questions_correct || 0}/{lesson.questions_attempted || 0} correct ✓
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overall Statistics */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-800 mb-4">📊 Assessment Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white p-3 rounded">
                      <div className="text-2xl font-bold text-red-600">
                        {responses.filter(r => r.category === 'compulsory_learning').length}
                      </div>
                      <div className="text-sm text-gray-700">Priority Topics</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-2xl font-bold text-yellow-600">
                        {responses.filter(r => r.category === 'suggested_learning').length}
                      </div>
                      <div className="text-sm text-gray-700">Review Topics</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {responses.filter(r => r.category === 'strong_topic').length}
                      </div>
                      <div className="text-sm text-gray-700">Mastered Topics</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(
                          responses.filter(r => r.accuracy_percentage !== undefined)
                            .reduce((acc, r) => acc + (r.accuracy_percentage || 0), 0) / 
                          Math.max(responses.filter(r => r.accuracy_percentage !== undefined).length, 1)
                        )}%
                      </div>
                      <div className="text-sm text-gray-700">Overall Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    const roadmapData = generatePersonalizedRoadmap();
                    // Send to AI Assistant for roadmap generation
                    sendToAIAssistant(roadmapData);
                    onComplete(roadmapData);
                  }}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold"
                >
                  🤖 Generate AI-Powered Learning Roadmap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartAdaptiveTest;
