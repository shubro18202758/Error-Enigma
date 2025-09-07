/**
 * Python Backend Integration Service
 * ==================================
 * 
 * Integrates with the adaptive_test_new.py backend for:
 * - Real adaptive testing based on rep      const data = await response.json();
      
      // Check for various completion/termination states
      if (data.completed || data.lesson_completed || data.terminated || !data.question) {
        return null; // No more questions
      }

      const questionData = data.question;
      
      return {
        id: questionData.id || `question_${Date.now()}`,
        question: questionData.question,
        options: questionData.options || {},
        correctAnswer: questionData.correct_answer || 'A',
        difficulty: questionData.difficulty || 'medium',
        topic: questionData.topic || 'Unknown',
        lesson: questionData.lesson_name || data.lesson_name || 'Unknown',
        module: data.lesson_name || 'Unknown'
      };* - Dynamic question generation using Groq AI
 * - Performance analytics and insights
 * - Skills assessment and weaknesses identification
 */

export interface PythonBackendConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
}

export interface AdaptiveTestRequest {
  courseId: string;
  moduleId: string;
  lessonId: string;
  userId: string;
  confidenceLevel: boolean; // Based on skills assessment
}

export interface AdaptiveTestResponse {
  sessionId: string;
  status: 'started' | 'error';
  message: string;
}

export interface QuestionRequest {
  sessionId: string;
  currentDifficulty: 'easy' | 'medium' | 'hard';
}

export interface QuestionResponse {
  id: string;
  question: string;
  options: { [key: string]: string }; // A, B, C, D
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  lesson: string;
  module: string;
}

export interface AnswerSubmissionRequest {
  sessionId: string;
  questionId: string;
  selectedAnswer: string;
  responseTime: number;
}

export interface AnswerSubmissionResponse {
  isCorrect: boolean;
  correctAnswer: string;
  feedback: string;
  nextDifficulty: 'easy' | 'medium' | 'hard';
  shouldTerminate: boolean;
  reasonForTermination?: string;
}

export interface SessionAnalyticsResponse {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageResponseTime: number;
  difficultyBreakdown: {
    easy: { correct: number; total: number; avgTime: number };
    medium: { correct: number; total: number; avgTime: number };
    hard: { correct: number; total: number; avgTime: number };
  };
  lessonAnalysis: {
    [lessonName: string]: {
      accuracy: number;
      averageTime: number;
      terminated: boolean;
      isWeakness: boolean;
      isStrength: boolean;
    };
  };
  recommendations: string[];
  weaknesses: string[];
  strengths: string[];
}

export class PythonBackendService {
  private config: PythonBackendConfig;
  private isConnected = false;

  constructor(config: Partial<PythonBackendConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:5001/api',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3
    };
  }

  /**
   * Check connection to Python backend
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      this.isConnected = response.ok;
      return this.isConnected;
    } catch (error) {
      console.warn('Python backend connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Start adaptive test session
   */
  async startAdaptiveTest(request: AdaptiveTestRequest): Promise<AdaptiveTestResponse> {
    if (!this.isConnected) {
      await this.checkConnection();
    }

    if (!this.isConnected) {
      return {
        sessionId: '',
        status: 'error',
        message: 'Python backend not available. Please start the adaptive testing service.'
      };
    }

    try {
      const response = await this.makeRequest('/start-assessment', {
        method: 'POST',
        body: JSON.stringify({
          session_id: `${request.userId}_${request.courseId}_${Date.now()}`,
          module_id: 1, // Default to module 1 for now
          course_id: request.courseId,
          lesson_id: request.lessonId,
          user_id: request.userId,
          confidence_level: request.confidenceLevel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        sessionId: data.session_id || `session_${Date.now()}`,
        status: data.success ? 'started' : 'error',
        message: data.message || 'Test session started successfully'
      };
    } catch (error) {
      console.error('Failed to start adaptive test:', error);
      return {
        sessionId: '',
        status: 'error',
        message: `Failed to start test: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get next question in adaptive test
   */
  async getNextQuestion(request: QuestionRequest): Promise<QuestionResponse | null> {
    try {
      const response = await this.makeRequest('/get-next-question', {
        method: 'POST',
        body: JSON.stringify({
          session_id: request.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.questions || data.questions.length === 0) {
        return null; // No questions generated
      }

      // Return the first question from the generated set
      const firstQuestion = data.questions[0];
      return {
        id: firstQuestion.id || `question_${Date.now()}`,
        question: firstQuestion.question,
        options: firstQuestion.options || {},
        correctAnswer: firstQuestion.correct_answer || 'A',
        difficulty: firstQuestion.difficulty || request.currentDifficulty,
        topic: firstQuestion.topic || 'Unknown',
        lesson: 'Python Fundamentals',
        module: 'Module 1'
      };
    } catch (error) {
      console.error('Failed to get next question:', error);
      return null;
    }
  }

  /**
   * Submit answer to current question
   */
  async submitAnswer(request: AnswerSubmissionRequest): Promise<AnswerSubmissionResponse | null> {
    try {
      const response = await this.makeRequest('/submit-answer', {
        method: 'POST',
        body: JSON.stringify({
          session_id: request.sessionId,
          question_id: request.questionId,
          selected_answer: request.selectedAnswer,
          response_time: request.responseTime
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        isCorrect: data.is_correct || false,
        correctAnswer: data.correct_answer || 'Unknown',
        feedback: data.feedback || (data.is_correct ? 'Correct!' : 'Incorrect'),
        nextDifficulty: data.next_difficulty || 'medium',
        shouldTerminate: data.should_terminate || false,
        reasonForTermination: data.termination_reason
      };
    } catch (error) {
      console.error('Failed to submit answer:', error);
      return null;
    }
  }

  /**
   * End test session and get analytics
   */
  async endTestSession(sessionId: string): Promise<SessionAnalyticsResponse | null> {
    try {
      const response = await this.makeRequest('/end-session', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        sessionId: data.session_id || sessionId,
        totalQuestions: data.total_questions || 0,
        correctAnswers: data.correct_answers || 0,
        accuracy: data.accuracy || 0,
        averageResponseTime: data.average_response_time || 0,
        difficultyBreakdown: data.difficulty_breakdown || {
          easy: { correct: 0, total: 0, avgTime: 0 },
          medium: { correct: 0, total: 0, avgTime: 0 },
          hard: { correct: 0, total: 0, avgTime: 0 }
        },
        lessonAnalysis: data.lesson_analysis || {},
        recommendations: data.recommendations || [],
        weaknesses: data.weaknesses || [],
        strengths: data.strengths || []
      };
    } catch (error) {
      console.error('Failed to end test session:', error);
      return null;
    }
  }

  /**
   * Get available modules for testing
   */
  async getAvailableModules(): Promise<Array<{id: string; title: string; description: string}>> {
    try {
      const response = await this.makeRequest('/get-modules', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.modules || [];
    } catch (error) {
      console.error('Failed to get modules:', error);
      return [];
    }
  }

  /**
   * Get lessons for a specific module
   */
  async getLessonsForModule(moduleId: string): Promise<Array<{id: string; name: string; description?: string}>> {
    try {
      const response = await this.makeRequest('/get-lessons', {
        method: 'POST',
        body: JSON.stringify({
          module_id: moduleId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.lessons || [];
    } catch (error) {
      console.error('Failed to get lessons:', error);
      return [];
    }
  }

  /**
   * Helper method for making HTTP requests with retry logic
   */
  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    const url = `${this.config.baseURL}${endpoint}`;
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: AbortSignal.timeout(this.config.timeout)
    };

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (response.ok) {
          return response;
        }
        
        // If it's a client error (4xx), don't retry
        if (response.status >= 400 && response.status < 500) {
          return response;
        }
        
        // For server errors (5xx), retry
        lastError = new Error(`Server error: ${response.status} ${response.statusText}`);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Network error');
        
        // If it's the last attempt, throw the error
        if (attempt === this.config.retryAttempts) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('Request failed after all retry attempts');
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PythonBackendConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
let pythonService: PythonBackendService | null = null;

export const getPythonBackendService = (config?: Partial<PythonBackendConfig>): PythonBackendService => {
  if (!pythonService) {
    pythonService = new PythonBackendService(config);
  }
  return pythonService;
};

export default PythonBackendService;
