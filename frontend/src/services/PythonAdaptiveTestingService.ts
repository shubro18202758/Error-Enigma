import { AdaptiveTestResult, AnswerSubmissionResult } from '../types/unified-system.types';

/**
 * Python Adaptive Testing Service
 * Handles communication with Python backend for adaptive testing
 */
export class PythonAdaptiveTestingService {
  private baseURL: string;
  private isConnected: boolean = false;

  constructor(baseURL: string = 'http://localhost:5001/api') {
    this.baseURL = baseURL;
  }

  /**
   * Check if Python backend is available
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
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
   * Generate adaptive test based on subject and difficulty
   */
  async generateAdaptiveTest(
    subject: string, 
    difficulty: string = 'medium', 
    questionCount: number = 10
  ): Promise<AdaptiveTestResult> {
    if (!this.isConnected) {
      throw new Error('Python backend not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/generate-adaptive-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          difficulty,
          question_count: questionCount,
          adaptive_algorithm: 'irt_cat' // Item Response Theory - Computerized Adaptive Testing
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        sessionId: data.session_id,
        questions: data.questions.map((q: any) => ({
          id: q.question_id,
          question: q.question_text,
          options: q.options,
          correctAnswer: q.correct_answer_index,
          difficulty: q.difficulty_level,
          topic: q.topic || subject,
          explanation: q.explanation
        })),
        difficulty: data.current_difficulty,
        subject: subject,
        estimatedTime: data.estimated_completion_time,
        adaptiveEngine: 'Python IRT-CAT'
      };
    } catch (error) {
      console.error('Error generating adaptive test:', error);
      throw new Error(`Failed to generate adaptive test: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Submit answer and get adaptive feedback
   */
  async submitResponse(
    sessionId: string,
    questionId: string,
    selectedAnswer: number,
    responseTime: number
  ): Promise<AnswerSubmissionResult> {
    if (!this.isConnected) {
      throw new Error('Python backend not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/submit-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: questionId,
          selected_answer: selectedAnswer,
          response_time_seconds: responseTime
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        correct: data.is_correct,
        nextQuestion: data.next_question ? {
          id: data.next_question.question_id,
          question: data.next_question.question_text,
          options: data.next_question.options,
          correctAnswer: data.next_question.correct_answer_index,
          difficulty: data.next_question.difficulty_level,
          topic: data.next_question.topic,
          explanation: data.next_question.explanation
        } : undefined,
        feedback: data.feedback,
        updatedDifficulty: data.updated_difficulty,
        sessionProgress: {
          questionsAnswered: data.session_progress.questions_answered,
          correctAnswers: data.session_progress.correct_answers,
          averageResponseTime: data.session_progress.average_response_time,
          adaptedDifficulty: data.session_progress.current_difficulty
        }
      };
    } catch (error) {
      console.error('Error submitting response:', error);
      throw new Error(`Failed to submit response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get session analytics from Python backend
   */
  async getSessionAnalytics(sessionId: string): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Python backend not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/get-session-analytics/${sessionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw new Error(`Failed to get session analytics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get global analytics from Python backend
   */
  async getGlobalAnalytics(): Promise<any> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}/get-global-analytics`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn('Error getting global analytics:', error);
      return null;
    }
  }

  /**
   * Initialize or reset adaptive test session
   */
  async initializeSession(userId: string, subject: string): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Python backend not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/initialize-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          subject: subject,
          session_type: 'adaptive_test'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.session_id;
    } catch (error) {
      console.error('Error initializing session:', error);
      throw new Error(`Failed to initialize session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Update base URL for Python backend
   */
  updateBaseURL(newBaseURL: string): void {
    this.baseURL = newBaseURL;
    this.isConnected = false; // Reset connection status
  }
}

export default PythonAdaptiveTestingService;
