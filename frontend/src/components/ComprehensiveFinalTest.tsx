import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface FinalTestQuestion {
  id: string;
  question: string;
  options: { [key: string]: string };
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  explanation?: string;
}

interface FinalTestResult {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  responseTime: number;
  topic: string;
  difficulty: string;
}

interface ComprehensiveFinalTestProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (results: any) => void;
  courseContext?: any;
}

const ComprehensiveFinalTest: React.FC<ComprehensiveFinalTestProps> = ({
  isOpen,
  onClose,
  onComplete,
  courseContext
}) => {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState<FinalTestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [results, setResults] = useState<FinalTestResult[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds per question
  const [startTime, setStartTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize test
  useEffect(() => {
    if (isOpen && !testCompleted) {
      initializeFinalTest();
    }
  }, [isOpen]);

  // Timer for questions
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeRemaining > 0 && !testCompleted && questions.length > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAnswerSubmit(''); // Auto-submit empty answer
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeRemaining, testCompleted, questions.length]);

  const initializeFinalTest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get context from localStorage if not provided
      const context = courseContext || JSON.parse(localStorage.getItem('finalTestContext') || '{}');
      
      console.log('🎯 Initializing comprehensive final test for:', context.courseTitle);
      
      // Generate comprehensive test questions using AI
      const generatedQuestions = await generateComprehensiveQuestions(context);
      
      if (generatedQuestions.length === 0) {
        throw new Error('Failed to generate test questions');
      }
      
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
      setTimeRemaining(60);
      setStartTime(Date.now());
      setResults([]);
      
      console.log(`📝 Final test initialized with ${generatedQuestions.length} questions`);
      
    } catch (error) {
      console.error('Failed to initialize final test:', error);
      setError('Failed to initialize test. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateComprehensiveQuestions = async (context: any): Promise<FinalTestQuestion[]> => {
    // For now, generate mock questions based on assessment data
    // In production, this would call AI service to generate questions
    
    const allTopics = [
      ...(context.assessmentData?.learningPath?.compulsoryTopics || []),
      ...(context.assessmentData?.learningPath?.suggestedTopics || []),
      ...(context.assessmentData?.learningPath?.masteredTopics || [])
    ];

    const mockQuestions: FinalTestQuestion[] = [
      // Python Fundamentals Questions
      {
        id: 'final_q1',
        question: 'Which of the following is the correct way to define a function that returns the sum of two parameters?',
        options: {
          'A': 'def sum(a, b): return a + b',
          'B': 'function sum(a, b) { return a + b }',
          'C': 'sum = lambda a, b: a + b',
          'D': 'Both A and C are correct'
        },
        correctAnswer: 'D',
        difficulty: 'medium',
        topic: 'Functions and Modules',
        explanation: 'Both def syntax and lambda expressions are valid ways to define functions in Python.'
      },
      {
        id: 'final_q2',
        question: 'What will be the output of the following code?\n\ndata = [1, 2, 3, 4, 5]\nresult = [x**2 for x in data if x % 2 == 0]\nprint(result)',
        options: {
          'A': '[1, 4, 9, 16, 25]',
          'B': '[4, 16]',
          'C': '[2, 4]',
          'D': 'Error'
        },
        correctAnswer: 'B',
        difficulty: 'hard',
        topic: 'Data Structures',
        explanation: 'List comprehension filters even numbers (2, 4) and squares them (4, 16).'
      },
      {
        id: 'final_q3',
        question: 'In Python, which statement is used to handle exceptions?',
        options: {
          'A': 'catch',
          'B': 'except',
          'C': 'handle',
          'D': 'error'
        },
        correctAnswer: 'B',
        difficulty: 'easy',
        topic: 'Control Flow',
        explanation: 'Python uses try-except blocks for exception handling.'
      },
      {
        id: 'final_q4',
        question: 'Which pandas method is used to remove duplicate rows from a DataFrame?',
        options: {
          'A': 'remove_duplicates()',
          'B': 'drop_duplicates()',
          'C': 'unique()',
          'D': 'deduplicate()'
        },
        correctAnswer: 'B',
        difficulty: 'medium',
        topic: 'Data Analysis',
        explanation: 'The drop_duplicates() method removes duplicate rows from a DataFrame.'
      },
      {
        id: 'final_q5',
        question: 'What is the primary purpose of the "if __name__ == \'__main__\':" construct in Python?',
        options: {
          'A': 'To define the main function',
          'B': 'To check if the script is being run directly',
          'C': 'To import other modules',
          'D': 'To handle errors'
        },
        correctAnswer: 'B',
        difficulty: 'hard',
        topic: 'Python Fundamentals',
        explanation: 'This construct checks if the script is being executed directly, not imported as a module.'
      },
      {
        id: 'final_q6',
        question: 'Which loop construct is most appropriate for iterating over a dictionary in Python?',
        options: {
          'A': 'for key in dict:',
          'B': 'for key, value in dict.items():',
          'C': 'while loop with manual key tracking',
          'D': 'Both A and B depending on needs'
        },
        correctAnswer: 'D',
        difficulty: 'medium',
        topic: 'Control Flow',
        explanation: 'Both approaches work - use .items() when you need both key and value, or iterate over keys directly when you only need keys.'
      },
      {
        id: 'final_q7',
        question: 'What is the difference between a list and a tuple in Python?',
        options: {
          'A': 'Lists are mutable, tuples are immutable',
          'B': 'Lists use [], tuples use ()',
          'C': 'Lists can store any data type, tuples cannot',
          'D': 'Both A and B'
        },
        correctAnswer: 'D',
        difficulty: 'easy',
        topic: 'Data Structures',
        explanation: 'The main differences are mutability (lists can be changed, tuples cannot) and syntax ([] vs ()).'
      },
      {
        id: 'final_q8',
        question: 'In data science, what is the primary purpose of data normalization?',
        options: {
          'A': 'To remove outliers',
          'B': 'To scale features to similar ranges',
          'C': 'To fill missing values',
          'D': 'To reduce dataset size'
        },
        correctAnswer: 'B',
        difficulty: 'hard',
        topic: 'Data Analysis',
        explanation: 'Normalization scales features to similar ranges, preventing features with larger scales from dominating the analysis.'
      }
    ];

    // Filter questions based on topics from assessment if available
    if (allTopics.length > 0) {
      const relevantQuestions = mockQuestions.filter(q => 
        allTopics.some((topic: any) => 
          q.topic.toLowerCase().includes(topic.lesson?.toLowerCase() || '')
        )
      );
      return relevantQuestions.length > 0 ? relevantQuestions : mockQuestions;
    }

    return mockQuestions;
  };

  const handleAnswerSubmit = (answer?: string) => {
    const finalAnswer = answer || selectedAnswer;
    const responseTime = (Date.now() - startTime) / 1000;
    const currentQuestion = questions[currentQuestionIndex];
    
    if (!currentQuestion) return;

    const isCorrect = finalAnswer.toUpperCase() === currentQuestion.correctAnswer.toUpperCase();
    
    // Record result
    const result: FinalTestResult = {
      questionId: currentQuestion.id,
      selectedAnswer: finalAnswer,
      isCorrect,
      responseTime,
      topic: currentQuestion.topic,
      difficulty: currentQuestion.difficulty
    };

    setResults(prev => [...prev, result]);
    
    console.log(`${isCorrect ? '✅' : '❌'} Question ${currentQuestionIndex + 1}: ${isCorrect ? 'Correct' : 'Incorrect'}`);

    // Move to next question or complete test
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setTimeRemaining(60);
      setStartTime(Date.now());
    } else {
      completeTest([...results, result]);
    }
  };

  const completeTest = (finalResults: FinalTestResult[]) => {
    setTestCompleted(true);
    
    // Generate comprehensive analysis
    const analysis = generateTestAnalysis(finalResults);
    
    console.log('🎉 Final test completed! Analysis:', analysis);
    
    // Store completion in progress tracking
    storeTestCompletion(analysis);
    
    onComplete(analysis);
  };

  const generateTestAnalysis = (finalResults: FinalTestResult[]) => {
    const totalQuestions = finalResults.length;
    const correctAnswers = finalResults.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Analyze by topic
    const topicAnalysis: { [key: string]: any } = {};
    finalResults.forEach(result => {
      if (!topicAnalysis[result.topic]) {
        topicAnalysis[result.topic] = {
          total: 0,
          correct: 0,
          accuracy: 0,
          averageTime: 0
        };
      }
      topicAnalysis[result.topic].total++;
      if (result.isCorrect) topicAnalysis[result.topic].correct++;
      topicAnalysis[result.topic].averageTime += result.responseTime;
    });

    // Calculate topic accuracies
    Object.keys(topicAnalysis).forEach(topic => {
      const data = topicAnalysis[topic];
      data.accuracy = Math.round((data.correct / data.total) * 100);
      data.averageTime = Math.round(data.averageTime / data.total);
    });

    // Analyze by difficulty
    const difficultyAnalysis = {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 }
    };

    finalResults.forEach(result => {
      const diff = result.difficulty as keyof typeof difficultyAnalysis;
      difficultyAnalysis[diff].total++;
      if (result.isCorrect) difficultyAnalysis[diff].correct++;
    });

    // Determine performance level
    let performanceLevel: string;
    let certificateEarned = false;
    
    if (accuracy >= 90) {
      performanceLevel = 'Excellent';
      certificateEarned = true;
    } else if (accuracy >= 75) {
      performanceLevel = 'Good';
      certificateEarned = true;
    } else if (accuracy >= 60) {
      performanceLevel = 'Satisfactory';
    } else {
      performanceLevel = 'Needs Improvement';
    }

    return {
      overall: {
        totalQuestions,
        correctAnswers,
        accuracy,
        performanceLevel,
        certificateEarned,
        averageResponseTime: Math.round(finalResults.reduce((sum, r) => sum + r.responseTime, 0) / totalQuestions)
      },
      topicAnalysis,
      difficultyAnalysis,
      detailedResults: finalResults,
      recommendations: generateRecommendations(accuracy, topicAnalysis),
      completionDate: new Date().toISOString()
    };
  };

  const generateRecommendations = (accuracy: number, topicAnalysis: any) => {
    const recommendations = [];
    
    if (accuracy < 75) {
      recommendations.push('📚 Consider reviewing course materials and taking practice tests');
    }
    
    // Topic-specific recommendations
    Object.entries(topicAnalysis).forEach(([topic, data]: [string, any]) => {
      if (data.accuracy < 70) {
        recommendations.push(`🔍 Focus on ${topic} - accuracy: ${data.accuracy}%`);
      }
    });
    
    if (accuracy >= 90) {
      recommendations.push('🎯 Excellent performance! Ready for advanced topics');
    }
    
    return recommendations;
  };

  const storeTestCompletion = (analysis: any) => {
    try {
      // Add to course progress
      const progressData = JSON.parse(localStorage.getItem('courseProgress') || '[]');
      progressData.push({
        id: `final_test_${Date.now()}`,
        timestamp: new Date().toISOString(),
        courseTitle: courseContext?.courseTitle || 'Final Assessment',
        status: 'final_test_completed',
        nextRecommendedAction: analysis.overall.certificateEarned ? 'claim_certificate' : 'review_and_retake',
        completionPercentage: analysis.overall.accuracy,
        testAnalysis: analysis
      });
      
      localStorage.setItem('courseProgress', JSON.stringify(progressData));
      console.log('📈 Final test completion stored in progress tracking');
    } catch (error) {
      console.error('Error storing test completion:', error);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🎯 Comprehensive Final Assessment</h2>
              <p className="text-purple-100">Complete course evaluation with AI-generated questions</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Progress Bar */}
          {questions.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-purple-100 mb-2">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{progress}% Complete</span>
              </div>
              <div className="w-full bg-purple-800 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              <div className="flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Generating comprehensive test questions...</p>
            </div>
          ) : testCompleted ? (
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600 mb-4">🎉 Test Completed!</h3>
              <p className="text-gray-600 mb-6">Your comprehensive analysis is ready.</p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-2">Test Summary:</h4>
                <p className="text-green-700">
                  Answered {questions.length} questions with detailed performance analysis generated.
                </p>
              </div>
            </div>
          ) : currentQuestion ? (
            <div>
              {/* Question Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {currentQuestion.topic}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentQuestion.difficulty.toUpperCase()}
                  </span>
                </div>
                <div className={`text-lg font-bold ${timeRemaining <= 10 ? 'text-red-600' : 'text-gray-600'}`}>
                  ⏱️ {timeRemaining}s
                </div>
              </div>

              {/* Question */}
              <div className="bg-gray-50 border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium mb-4 text-black whitespace-pre-line">
                  {currentQuestion.question}
                </h3>
                
                <div className="space-y-3">
                  {Object.entries(currentQuestion.options).map(([letter, option]) => (
                    <label
                      key={letter}
                      className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
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
                      <span className="font-medium mr-2 text-black">{letter})</span>
                      <span className="text-black">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-between">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Exit Test
                </button>
                <button
                  onClick={() => handleAnswerSubmit()}
                  disabled={!selectedAnswer || isLoading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Complete Test' : 'Next Question'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">No questions available. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveFinalTest;
