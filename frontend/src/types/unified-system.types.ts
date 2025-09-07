/**
 * Type definitions for Unified Agentic AI System
 */

export interface Course {
  id: string;
  courseId?: string;
  title: string;
  description: string;
  level: string;
  category: string;
  subcategory?: string;
  duration: number;
  instructor?: string;
  rating?: number;
  enrolled?: number;
  skills: string[];
  modules?: CourseModule[];
  totalModules?: number;
  totalLessons?: number;
  totalDuration?: number;
  prerequisites?: string[];
  learningObjectives?: string[];
  repositoryPath?: string;
  repositoryBased?: boolean;
  hasVideoContent?: boolean;
  hasTranscripts?: boolean;
  hasMetadata?: boolean;
  createdAt?: string;
  [key: string]: any;
}

export interface CourseModule {
  id: string;
  name: string;
  description: string;
  order: number;
  lessons: number;
  duration: number;
  topics: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  courses: Course[];
  skills: string[];
  careerOutcome: string;
  estimatedHours: number;
}

export interface UserSession {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  interactions: number;
  activities: ActivityLog[];
  engagementScore: number;
  learningVelocity: number;
}

export interface ActivityLog {
  type: string;
  timestamp: Date;
  data: any;
}

export interface UserProfile {
  preferredLevel?: string;
  learningVelocity?: number;
  interests?: string[];
  completedCourses?: string[];
  skillLevel?: Record<string, number>;
  streak?: number;
  [key: string]: any;
}

export interface ContentLibrary {
  courses: Course[];
  quizzes: Quiz[];
  projects: Project[];
  skillAssessments: SkillAssessment[];
  learningPaths: LearningPath[];
}

export interface Quiz {
  id: string;
  title: string;
  courseId?: string;
  questions: Question[];
  difficulty: string;
  timeLimit?: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: string;
  topic: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  skills: string[];
  estimatedHours: number;
  requirements: string[];
}

export interface SkillAssessment {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  questionCount: number;
  skills: string[];
  relatedCourses: string[];
  questions?: Question[];
  passingScore?: number;
  timeLimit?: number;
}

export interface LearningAnalytics {
  completionRates: Map<string, number>;
  skillProgress: Map<string, number>;
  recommendationEngine: any;
}

export interface Filters {
  category?: string;
  level?: string;
  maxDuration?: number;
  skills?: string[];
  instructor?: string;
  rating?: number;
  [key: string]: any;
}

export interface Insight {
  id: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  title: string;
  description: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  actionable?: boolean;
}

export interface SystemStatus {
  pythonConnected: boolean;
  backendConnected: boolean;
  geminiActive: boolean;
  activeAgents: number;
  totalSessions: number;
  lastUpdated: Date;
  contentSource: string;
}

export interface DashboardMetrics {
  totalSessions: number;
  totalCourses: number;
  totalLearningPaths: number;
  totalSkillAssessments: number;
  averageEngagement: number;
  learningVelocity: number;
  systemHealth: number;
  repositoryContentLoaded: boolean;
  lastUpdated: Date;
  connectionStatus: {
    python: boolean;
    backend: boolean;
    gemini: boolean;
  };
  pythonAnalytics?: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  courses?: Course[];
  message?: string;
  error?: string;
  totalCourses?: number;
  sourcedFromRepository?: boolean;
  repositoryPath?: string;
}

export interface AdaptiveTestResult {
  sessionId: string;
  questions: Question[];
  difficulty: string;
  subject: string;
  estimatedTime: number;
  adaptiveEngine: string;
}

export interface AnswerSubmissionResult {
  correct: boolean;
  nextQuestion?: Question;
  feedback: string;
  updatedDifficulty: string;
  sessionProgress: {
    questionsAnswered: number;
    correctAnswers: number;
    averageResponseTime: number;
    adaptedDifficulty: string;
  };
}

// Configuration interfaces
export interface SystemConfig {
  baseURL: string;
  backendAPI: string;
  pythonAPI: string;
  geminiAPIKey?: string;
  updateInterval: number;
  maxRetries: number;
  timeout: number;
}

export interface ConnectionStatus {
  python: boolean;
  backend: boolean;
  gemini: boolean;
  lastChecked: Date;
}
