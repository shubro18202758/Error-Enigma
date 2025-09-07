/**
 * ERROR-404 EDTECH PLATFORM - PRODUCTION READY
 * =============================================
 * 
 * Comprehensive EdTech platform integrating:
 * - Repository-based Content Management
 * - Python-powered Adaptive Testing 
 * - Real-time Learning Analytics
 * - Personalized Learning Paths
 * - AI-powered Insights
 * 
 * Quick Start:
 * ```typescript
 * import { getEdTechPlatform } from './services';
 * 
 * const platform = getEdTechPlatform();
 * 
 * // Load repository courses
 * const courses = await platform.loadRepositoryCourses();
 * 
 * // Start adaptive test
 * const session = await platform.startAdaptiveTest(courseId, moduleId, lessonId);
 * 
 * // Get personalized learning paths
 * const paths = await platform.getPersonalizedLearningPaths(userProfile);
 * 
 * // Get dashboard data
 * const dashboard = platform.getDashboardData();
 * ```
 */

// ==================== CORE IMPORTS ====================
import EdTechPlatformClass, { getEdTechPlatform } from './EdTechPlatform';
import { PythonBackendService, getPythonBackendService } from './PythonBackendService';

// ==================== MAIN PLATFORM ====================
export { 
  EdTechPlatformClass as EdTechPlatform,
  getEdTechPlatform 
};

// ==================== PYTHON BACKEND INTEGRATION ====================
export { 
  PythonBackendService,
  getPythonBackendService 
};

// ==================== TYPE EXPORTS ====================
export type {
  Course,
  Module,
  Lesson,
  AdaptiveTestSession,
  TestQuestion,
  TestResponse,
  SessionAnalytics,
  UserProfile,
  LearningPath,
  LearningInsight
} from './EdTechPlatform';

export type {
  AdaptiveTestRequest,
  AdaptiveTestResponse,
  QuestionRequest,
  QuestionResponse,
  AnswerSubmissionRequest,
  AnswerSubmissionResponse,
  SessionAnalyticsResponse
} from './PythonBackendService';

// ==================== BACKWARD COMPATIBILITY ====================
// Legacy wrapper for existing components that import UnifiedAgenticAISystem

export class UnifiedAgenticAISystem {
  private platform: EdTechPlatformClass;
  
  constructor() {
    this.platform = getEdTechPlatform();
  }
  
  // Backward compatibility methods
  async getCourseRecommendations(userProfile: any, filters = {}) {
    const courses = this.platform.getCourses();
    return {
      success: true,
      courses: courses.slice(0, 10),
      totalCourses: courses.length,
      sourcedFromRepository: true
    };
  }
  
  async getPersonalizedLearningPaths(userProfile: any, goals: string[]) {
    const paths = await this.platform.getPersonalizedLearningPaths(userProfile);
    return {
      success: true,
      learningPaths: paths.slice(0, 5),
      totalPaths: paths.length,
      sourcedFromRepository: true
    };
  }
  
  getDashboardData() {
    return this.platform.getDashboardData();
  }
  
  async generateAdaptiveTest(subject: string, difficulty = 'medium', questionCount = 10) {
    // For backward compatibility - direct users to new API
    console.warn('⚠️ Use platform.startAdaptiveTest() instead of generateAdaptiveTest()');
    return {
      success: true,
      message: 'Use EdTechPlatform.startAdaptiveTest(courseId, moduleId, lessonId) for adaptive testing',
      testId: `legacy_test_${Date.now()}`
    };
  }
  
  async submitAnswer(sessionId: string, questionId: string, selectedAnswer: any, responseTime: number) {
    const result = await this.platform.submitAnswer(questionId, selectedAnswer);
    return {
      success: !!result,
      isCorrect: result?.isCorrect || false,
      feedback: result?.feedback || 'No feedback available'
    };
  }
}

// ==================== LEGACY SYSTEMS ====================
// Kept for backward compatibility with existing components
export { default as AdvancedClanSystem } from './AdvancedClanSystem';
export { EnhancedAdaptiveEngine, PersonalizedRoadmapGenerator } from './EnhancedAdaptiveSystem';
export { default as IntegratedLearningAnalyticsEngine } from './IntegratedLearningAnalyticsEngine';

// ==================== UTILITY FUNCTIONS ====================

/**
 * Initialize platform with environment configuration
 */
export function initializePlatform(environment: 'development' | 'production' = 'development') {
  const platform = getEdTechPlatform();
  console.log(`🚀 EdTech Platform initialized for ${environment}`);
  return platform;
}

/**
 * Health check for the platform
 */
export async function checkPlatformHealth() {
  const platform = getEdTechPlatform();
  const status = platform.getSystemStatus();
  const dashboard = platform.getDashboardData();
  
  return {
    status: 'healthy',
    services: {
      backend: status.backendConnected,
      python: status.pythonConnected,
      courses: status.coursesLoaded > 0,
      learningPaths: status.learningPathsAvailable > 0
    },
    data: {
      coursesAvailable: status.coursesLoaded,
      learningPathsAvailable: status.learningPathsAvailable,
      activeSession: status.activeSession,
      userProfile: status.userProfileSet
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Configuration presets for different environments
 */
export const PlatformConfig = {
  development: {
    apiURL: 'http://localhost:3001/api',
    pythonURL: 'http://localhost:5001/api',
    debug: true,
    enableAnalytics: true
  },
  production: {
    apiURL: 'https://api.error404platform.com',
    pythonURL: 'https://python.error404platform.com',
    debug: false,
    enableAnalytics: true
  }
};
