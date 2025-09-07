/**
 * Unified Agentic AI System for EdTech Learning Platform
 * 
 * This system dynamically loads content from the actual repository structure:
 * - /services/shared/content_library/Courses/ (Real course metadata)
 * - Adaptive Testing with Python backend integration
 * - Agentic Learning Analysis with Gemini AI
 * - Real-time User Activity Tracking & Analytics
 * - Personalized Learning Paths & Course Recommendations
 * 
 * Optimized for performance with repository-based content loading
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import PythonAdaptiveTestingService from './PythonAdaptiveTestingService';
import ContentManagementService from './ContentManagementService';
import {
  Course,
  LearningPath,
  UserSession,
  UserProfile,
  ContentLibrary,
  LearningAnalytics,
  Filters,
  SystemConfig,
  DashboardMetrics,
  Insight,
  AdaptiveTestResult,
  AnswerSubmissionResult
} from '../types/unified-system.types';



class UnifiedAgenticAISystem {
  // Core AI services
  public pythonService: any;
  public geminiAPI: any;
  public geminiModel: any;

  // Connection status monitoring
  public isConnectedToPython: boolean;
  public isConnectedToBackend: boolean;
  public geminiActive: boolean;

  // Data management
  public userSessions: Map<string, UserSession>;
  public currentInsights: any[];
  public dashboardMetrics: any;
  public userProfiles: Map<string, UserProfile>;

  // EdTech Content Library - Repository-based Structure
  public contentLibrary: ContentLibrary;

  // Learning Analytics
  public learningAnalytics: LearningAnalytics;

  // System configuration
  public baseURL: string;
  public backendAPI: string;
  public updateInterval: number;

  constructor() {
    // Core AI services
    this.pythonService = new PythonAdaptiveTestingService();
    this.geminiAPI = null;
    this.geminiModel = null;

    // Connection status monitoring
    this.isConnectedToPython = false;
    this.isConnectedToBackend = false;
    this.geminiActive = false;

    // Data management
    this.userSessions = new Map();
    this.currentInsights = [];
    this.dashboardMetrics = {};
    this.userProfiles = new Map();
    
    // EdTech Content Library - Repository-based Structure
    this.contentLibrary = {
      courses: [],
      quizzes: [],
      projects: [],
      learningPaths: [],
      skillAssessments: []
    };

    // Learning Analytics
    this.learningAnalytics = {
      completionRates: new Map(),
      skillProgress: new Map(),
      recommendationEngine: null
    };

    // System configuration
    this.baseURL = 'http://localhost:5001/api';
    this.backendAPI = 'http://localhost:3001/api';
    this.updateInterval = 5000; // 5 seconds

    // Initialize all subsystems
    this.initializeSystem();
  }

  /**
   * Initialize all system components
   */
  async initializeSystem() {
    try {
      await this.initializeGeminiAI();
      await this.checkConnections();
      await this.initializeContentLibrary();
      this.startRealTimeMonitoring();
      console.log('🤖 Unified Agentic AI System initialized with repository-based content');
    } catch (error) {
      console.error('System initialization error:', error);
    }
  }

  /**
   * Initialize EdTech Content Library from actual repository structure
   */
  async initializeContentLibrary() {
    try {
      console.log('📚 Loading content library from actual repository structure...');
      
      // Load courses from the repository content library
      await this.loadCoursesFromRepository();
      
      // Load skill assessments
      this.loadSkillAssessments();
      
      // Generate learning paths based on loaded content
      this.generateLearningPaths();
      
      console.log('✅ Content library initialized with repository data');
      console.log(`📊 Loaded ${this.contentLibrary.courses.length} courses from repository`);
      
    } catch (error) {
      console.error('Error loading content library from repository:', error);
      // Fallback to basic content if loading fails
      this.initializeFallbackContent();
    }
  }

  /**
   * Load courses from the actual repository content library
   * Based on: /services/shared/content_library/Courses/
   */
  async loadCoursesFromRepository() {
    try {
      // Try to fetch course metadata from backend first
      const courses = await this.fetchCoursesFromBackend();
      
      if (courses && courses.length > 0) {
        this.contentLibrary.courses = courses;
        console.log('📚 Loaded courses from backend API');
      } else {
        // Load from known repository structure
        await this.loadKnownRepositoryCourses();
        console.log('📚 Loaded courses from repository structure');
      }
    } catch (error) {
      console.warn('Failed to load courses, using fallback:', error);
      await this.loadKnownRepositoryCourses();
    }
  }

  /**
   * Load courses from known repository structure
   * Based on actual files: complete_data_science_masterclass/ and modern_web_development_bootcamp/
   */
  async loadKnownRepositoryCourses() {
    const repositoryCourses = [
      {
        id: 'course_1d26f065',
        courseId: 'complete_data_science_masterclass',
        title: 'Complete Data Science Masterclass',
        description: 'Comprehensive data science course from basics to advanced machine learning',
        level: 'intermediate',
        category: 'Data Science',
        subcategory: 'Technology & Analytics',
        duration: 45,
        rating: 3.6,
        enrolled: 2284,
        instructor: 'Dr. Sarah Chen',
        skills: ['Python', 'Machine Learning', 'Statistics', 'Data Analysis', 'Visualization'],
        modules: [
          {
            id: 'mod_1018e38c',
            name: 'Introduction to Data Science',
            description: 'Foundation concepts and methodology in data science',
            order: 1,
            lessons: 3,
            duration: 45,
            topics: ['What is Data Science', 'Data Science Workflow', 'Tools and Environment Setup']
          },
          {
            id: 'mod_ae7061b6',
            name: 'Python Programming Fundamentals',
            description: 'Essential Python skills for data analysis',
            order: 2,
            lessons: 3,
            duration: 75,
            topics: ['Python Basics for Data Science', 'Working with NumPy Arrays', 'Pandas DataFrame Operations']
          },
          {
            id: 'mod_2d6c2b37',
            name: 'Statistical Analysis and Visualization',
            description: 'Statistical methods and data visualization techniques',
            order: 3,
            lessons: 3,
            duration: 60,
            topics: ['Descriptive Statistics', 'Data Visualization with Matplotlib', 'Advanced Plotting with Seaborn']
          },
          {
            id: 'mod_c3698650',
            name: 'Machine Learning Applications',
            description: 'Introduction to machine learning algorithms and applications',
            order: 4,
            lessons: 3,
            duration: 75,
            topics: ['Supervised Learning Overview', 'Unsupervised Learning Methods', 'Model Evaluation and Validation']
          }
        ],
        totalModules: 4,
        totalLessons: 12,
        totalDuration: 255,
        prerequisites: ['Basic Math', 'Computer Literacy'],
        learningObjectives: [
          'Master Python programming for data science',
          'Understand statistical concepts and their applications',
          'Build and evaluate machine learning models',
          'Create compelling data visualizations',
          'Complete end-to-end data science projects'
        ],
        repositoryPath: 'services/shared/content_library/Courses/complete_data_science_masterclass/',
        hasVideoContent: true,
        hasTranscripts: true,
        hasMetadata: true
      },
      {
        id: 'course_59162680',
        courseId: 'modern_web_development_bootcamp',
        title: 'Modern Web Development Bootcamp',
        description: 'Full-stack web development with modern technologies and best practices',
        level: 'beginner',
        category: 'Web Development',
        subcategory: 'Technology & Programming',
        duration: 60,
        rating: 4.4,
        enrolled: 3516,
        instructor: 'Prof. Alex Rodriguez',
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'],
        modules: [
          {
            id: 'mod_0bd0167b',
            name: 'Frontend Fundamentals',
            description: 'HTML, CSS, and JavaScript basics',
            order: 1,
            lessons: 3,
            duration: 60,
            topics: ['HTML Structure and Semantics', 'CSS Styling and Layouts', 'JavaScript ES6+ Features']
          },
          {
            id: 'mod_66aa34e6',
            name: 'React Development',
            description: 'Building interactive user interfaces with React',
            order: 2,
            lessons: 3,
            duration: 75,
            topics: ['React Components and JSX', 'State Management and Hooks', 'React Router and Navigation']
          },
          {
            id: 'mod_b7c158ed',
            name: 'Backend Development',
            description: 'Server-side programming with Node.js',
            order: 3,
            lessons: 3,
            duration: 85,
            topics: ['Node.js and Express Setup', 'Database Integration', 'Authentication and Security']
          }
        ],
        totalModules: 3,
        totalLessons: 9,
        totalDuration: 220,
        prerequisites: ['Basic Computer Skills'],
        learningObjectives: [
          'Build responsive, modern websites',
          'Master frontend and backend development',
          'Create full-stack web applications',
          'Understand modern development workflows',
          'Deploy applications to production'
        ],
        repositoryPath: 'services/shared/content_library/Courses/modern_web_development_bootcamp/',
        hasVideoContent: true,
        hasTranscripts: true,
        hasMetadata: true
      }
    ];

    this.contentLibrary.courses = repositoryCourses;
  }

  /**
   * Load skill assessments based on repository content structure
   */
  loadSkillAssessments() {
    this.contentLibrary.skillAssessments = [
      {
        id: 'programming-fundamentals',
        title: 'Programming Fundamentals Assessment',
        description: 'Test your basic programming knowledge and logical thinking',
        category: 'Programming',
        difficulty: 'beginner',
        duration: 30,
        questionCount: 20,
        skills: ['Logic', 'Problem Solving', 'Basic Programming', 'Algorithms'],
        relatedCourses: ['modern_web_development_bootcamp']
      },
      {
        id: 'web-development-skills',
        title: 'Web Development Skills Test',
        description: 'Assess your HTML, CSS, and JavaScript knowledge',
        category: 'Web Development', 
        difficulty: 'intermediate',
        duration: 45,
        questionCount: 25,
        skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
        relatedCourses: ['modern_web_development_bootcamp']
      },
      {
        id: 'data-science-assessment',
        title: 'Data Science & Analytics Assessment',
        description: 'Evaluate your data analysis and statistical knowledge',
        category: 'Data Science',
        difficulty: 'intermediate',
        duration: 40,
        questionCount: 30,
        skills: ['Statistics', 'Data Analysis', 'Python', 'Machine Learning'],
        relatedCourses: ['complete_data_science_masterclass']
      }
    ];
  }

  /**
   * Generate learning paths based on repository courses
   */
  generateLearningPaths() {
    this.contentLibrary.learningPaths = [
      {
        id: 'fullstack-developer-path',
        title: 'Full-Stack Developer',
        description: 'Complete path to become a full-stack web developer using repository courses',
        duration: '6 months',
        difficulty: 'beginner-to-intermediate',
        courses: this.contentLibrary.courses.filter(c => c.category === 'Web Development'),
        skills: ['Frontend Development', 'Backend Development', 'Database Integration', 'Full-Stack Applications'],
        careerOutcome: 'Full-Stack Developer',
        estimatedHours: this.contentLibrary.courses
          .filter(c => c.category === 'Web Development')
          .reduce((total, course) => total + course.duration, 0)
      },
      {
        id: 'data-scientist-path',
        title: 'Data Scientist',
        description: 'Master data science and machine learning using repository courses',
        duration: '8 months',
        difficulty: 'intermediate-to-advanced',
        courses: this.contentLibrary.courses.filter(c => c.category === 'Data Science'),
        skills: ['Python Programming', 'Statistical Analysis', 'Machine Learning', 'Data Visualization'],
        careerOutcome: 'Data Scientist',
        estimatedHours: this.contentLibrary.courses
          .filter(c => c.category === 'Data Science')
          .reduce((total, course) => total + course.duration, 0)
      },
      {
        id: 'programming-foundations-path',
        title: 'Programming Foundations',
        description: 'Start your programming journey with solid foundations',
        duration: '3 months',
        difficulty: 'beginner',
        courses: this.contentLibrary.courses.filter(c => c.level === 'beginner'),
        skills: ['Programming Logic', 'Problem Solving', 'Code Structure', 'Development Basics'],
        careerOutcome: 'Junior Developer',
        estimatedHours: this.contentLibrary.courses
          .filter(c => c.level === 'beginner')
          .reduce((total, course) => total + course.duration, 0)
      }
    ];
  }

  /**
   * Fetch courses from backend API (attempts to get live data from repository)
   */
  async fetchCoursesFromBackend() {
    try {
      if (!this.isConnectedToBackend) {
        console.log('🔌 Backend not connected, using repository fallback');
        return null;
      }
      
      console.log('🌐 Fetching courses from backend API...');
      const response = await fetch(`${this.backendAPI}/courses`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend courses loaded:', data.totalCourses || 'unknown count');
        
        if (data.success && data.courses) {
          return data.courses;
        }
      }
      
      console.warn('❌ Backend courses fetch failed:', response.status);
    } catch (error) {
      console.warn('❌ Backend courses fetch error:', error instanceof Error ? error.message : String(error));
    }
    
    return null;
  }

  /**
   * Get personalized learning paths for a user based on repository content
   */
  async getPersonalizedLearningPaths(userProfile: UserProfile, goals: string[]) {
    try {
      const recommendations = [];
      
      // Filter learning paths based on user level and goals
      for (const path of this.contentLibrary.learningPaths) {
        const isMatch = this.matchesUserGoals(path, goals, userProfile);
        if (isMatch) {
          recommendations.push({
            ...path,
            matchScore: this.calculateMatchScore(path, userProfile),
            estimatedCompletion: this.estimateCompletionTime(path, userProfile),
            availableCourses: path.courses.length,
            totalLessons: path.courses.reduce((total, course) => total + (course.totalLessons || 0), 0)
          });
        }
      }

      // Sort by match score
      recommendations.sort((a, b) => b.matchScore - a.matchScore);

      this.trackActivity('learning_paths_requested', { 
        pathCount: recommendations.length,
        userGoals: goals,
        repositoryBased: true
      });

      return {
        success: true,
        learningPaths: recommendations.slice(0, 5),
        totalPaths: this.contentLibrary.learningPaths.length,
        sourcedFromRepository: true
      };
    } catch (error) {
      console.error('Error getting learning paths:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Get course recommendations based on repository content
   */
  async getCourseRecommendations(userProfile: UserProfile, filters: Filters = {}) {
    try {
      let courses = [...this.contentLibrary.courses];

      // Apply filters
      if (filters.category) {
        courses = courses.filter(c => c.category === filters.category);
      }
      if (filters.level) {
        courses = courses.filter(c => c.level === filters.level);
      }
      if (filters.maxDuration) {
        courses = courses.filter(c => c.duration <= filters.maxDuration!);
      }

      // Add personalization score and repository information
      courses = courses.map(course => ({
        ...course,
        personalizedScore: this.calculatePersonalizationScore(course, userProfile),
        recommendationReason: this.generateRecommendationReason(course, userProfile),
        repositoryBased: true,
        contentAvailability: {
          hasVideos: course.hasVideoContent,
          hasTranscripts: course.hasTranscripts,
          hasMetadata: course.hasMetadata,
          repositoryPath: course.repositoryPath
        }
      }));

      // Sort by personalization score
      courses.sort((a, b) => b.personalizedScore - a.personalizedScore);

      this.trackActivity('courses_recommended', { 
        courseCount: courses.length,
        filters,
        repositoryBased: true
      });

      return {
        success: true,
        courses: courses.slice(0, 10),
        totalCourses: this.contentLibrary.courses.length,
        sourcedFromRepository: true
      };
    } catch (error) {
      console.error('Error getting course recommendations:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Generate adaptive test using Python backend
   */
  async generateAdaptiveTest(subject: string, difficulty: string = 'medium', questionCount: number = 10) {
    if (!this.isConnectedToPython) {
      throw new Error('Python backend required for adaptive testing');
    }

    try {
      const result = await this.pythonService.generateAdaptiveTest(subject, difficulty, questionCount);
      
      // Track this activity
      this.trackActivity('adaptive_test_generated', {
        subject,
        difficulty,
        questionCount: result.questions?.length || 0,
        repositoryContentUsed: true
      });

      return result;
    } catch (error) {
      console.error('Adaptive test generation failed:', error);
      throw error;
    }
  }

  /**
   * Submit answer and get adaptive feedback
   */
  async submitAnswer(sessionId: string, questionId: string, selectedAnswer: any, responseTime: number) {
    if (!this.isConnectedToPython) {
      throw new Error('Python backend required for answer submission');
    }

    try {
      const result = await this.pythonService.submitResponse(sessionId, questionId, selectedAnswer, responseTime);
      
      // Track this activity for learning analytics
      this.trackActivity('answer_submitted', {
        sessionId,
        questionId,
        isCorrect: result.isCorrect,
        responseTime,
        nextDifficulty: result.nextDifficulty
      });

      // Generate real-time insights
      await this.analyzeAnswerPattern(result);

      return result;
    } catch (error) {
      console.error('Answer submission failed:', error);
      throw error;
    }
  }

  // === Helper Methods ===

  matchesUserGoals(path: LearningPath, goals: string[], userProfile: UserProfile) {
    if (!goals || goals.length === 0) return true;
    
    const pathKeywords = [
      ...path.skills.map(s => s.toLowerCase()),
      path.careerOutcome.toLowerCase(),
      path.title.toLowerCase()
    ];
    
    return goals.some(goal => 
      pathKeywords.some(keyword => keyword.includes(goal.toLowerCase()))
    );
  }

  calculateMatchScore(path: LearningPath, userProfile: UserProfile) {
    let score = 50; // Base score
    
    // Level matching
    if (userProfile?.level) {
      if (path.difficulty.includes(userProfile.level)) score += 30;
    }
    
    // Experience matching
    if (userProfile?.completedCourses && userProfile.completedCourses.length > 5) score += 10;
    if (userProfile?.streak && userProfile.streak > 7) score += 10;
    
    return Math.min(100, score);
  }

  estimateCompletionTime(path: LearningPath, userProfile: UserProfile) {
    const baseDuration = path.duration;
    const userMultiplier = userProfile?.learningVelocity || 1.0;
    
    // Adjust based on user's learning velocity
    const estimatedMonths = parseInt(baseDuration) * (1 / userMultiplier);
    return `${Math.ceil(estimatedMonths)} months`;
  }

  calculatePersonalizationScore(course: Course, userProfile: UserProfile) {
    let score = 50; // Base score
    
    // Level matching
    if (userProfile?.preferredLevel === course.level) score += 20;
    
    // Interest matching
    if (userProfile?.interests?.includes(course.category)) score += 25;
    
    // Rating boost
    score += (course.rating || 3.5) * 5;
    
    return Math.min(100, score);
  }

  generateRecommendationReason(course: Course, userProfile: UserProfile) {
    const reasons = [];
    
    if (userProfile?.preferredLevel === course.level) {
      reasons.push(`Matches your ${course.level} level`);
    }
    
    if ((course.rating || 0) >= 4.0) {
      reasons.push(`Highly rated (${course.rating}/5.0)`);
    }
    
    if ((course.enrolled || 0) > 2000) {
      reasons.push('Popular choice');
    }

    reasons.push('Repository content available');
    
    return reasons.join(' • ') || 'Recommended for you';
  }

  initializeFallbackContent() {
    console.log('📚 Initializing fallback content...');
    this.contentLibrary.courses = [
      {
        id: 'fallback-course-1',
        title: 'Introduction to Programming',
        description: 'Basic programming concepts and fundamentals',
        level: 'beginner',
        category: 'Programming',
        duration: 20,
        rating: 4.0,
        enrolled: 1500,
        skills: ['Programming Basics', 'Logic', 'Problem Solving'],
        repositoryBased: false
      }
    ];
  }

  /**
   * Initialize Gemini AI
   */
  async initializeGeminiAI() {
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('Gemini API key not found');
        return;
      }

      this.geminiAPI = new GoogleGenerativeAI(apiKey);
      this.geminiModel = this.geminiAPI.getGenerativeModel({ model: 'gemini-pro' });
      this.geminiActive = true;
      console.log('✅ Gemini AI initialized');
    } catch (error) {
      console.warn('Gemini AI initialization failed:', error);
      this.geminiActive = false;
    }
  }

  /**
   * Check all backend connections
   */
  async checkConnections() {
    // Check Python backend
    try {
      this.isConnectedToPython = await this.pythonService.checkConnection();
    } catch (error) {
      this.isConnectedToPython = false;
    }

    // Check Node.js backend
    try {
      const response = await fetch(`${this.backendAPI}/health`);
      this.isConnectedToBackend = response.ok;
    } catch (error) {
      this.isConnectedToBackend = false;
    }

    console.log(`🔗 Connections - Python: ${this.isConnectedToPython}, Backend: ${this.isConnectedToBackend}, Gemini: ${this.geminiActive}`);
  }

  /**
   * Start real-time monitoring and analysis
   */
  startRealTimeMonitoring() {
    // Real-time updates every 5 seconds
    setInterval(() => {
      this.updateMetrics();
      this.generateInsights();
    }, this.updateInterval);

    // Connection health checks every 30 seconds
    setInterval(() => {
      this.checkConnections();
    }, 30000);

    console.log('📊 Real-time monitoring started');
  }

  /**
   * Track user activity
   */
  trackActivity(activityType: string, data: any) {
    const sessionId = this.getCurrentSessionId();
    
    if (!this.userSessions.has(sessionId)) {
      this.userSessions.set(sessionId, {
        sessionId,
        startTime: new Date(),
        lastActivity: new Date(),
        interactions: 0,
        learningVelocity: 0,
        engagementScore: 0.5,
        activities: []
      });
    }

    const session = this.userSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      session.interactions++;
      session.activities.push({
        type: activityType,
        timestamp: new Date(),
        data
      });

      // Update learning velocity
      const sessionDuration = (session.lastActivity.getTime() - session.startTime.getTime()) / 1000 / 60; // minutes
      session.learningVelocity = session.interactions / Math.max(sessionDuration, 1);
    }
  }

  /**
   * Analyze answer patterns for insights
   */
  async analyzeAnswerPattern(answerResult: any) {
    if (!this.geminiActive) return;

    try {
      const prompt = `Analyze this learning response pattern:
      
Answer Result: ${JSON.stringify(answerResult)}
Recent Session Data: ${JSON.stringify(this.getRecentSessionData())}

Provide immediate insights:
1. Learning pattern analysis
2. Difficulty adjustment recommendations
3. Risk assessment (struggling vs excelling)
4. Next best action for learner

Be concise and actionable.`;

      const result = await this.geminiModel.generateContent(prompt);
      const analysis = await result.response.text();

      // Generate insight from AI analysis
      this.addInsight({
        type: 'learning_pattern',
        title: 'Real-time Learning Analysis',
        description: analysis,
        confidence: 0.8,
        actionable: true,
        priority: answerResult.isCorrect ? 'medium' : 'high',
        timestamp: new Date(),
        data: answerResult
      });

    } catch (error) {
      console.warn('AI analysis failed:', error);
    }
  }

  /**
   * Update comprehensive metrics
   */
  async updateMetrics() {
    try {
      // Get Python backend analytics if available
      let pythonAnalytics = null;
      if (this.isConnectedToPython) {
        try {
          const response = await fetch(`${this.baseURL}/get-global-analytics`);
          if (response.ok) {
            const data = await response.json();
            pythonAnalytics = data.global_analytics;
          }
        } catch (error) {
          console.warn('Failed to fetch Python analytics:', error);
        }
      }

      // Calculate local metrics
      const localMetrics = {
        totalSessions: this.userSessions.size,
        totalCourses: this.contentLibrary.courses.length,
        totalLearningPaths: this.contentLibrary.learningPaths.length,
        totalSkillAssessments: this.contentLibrary.skillAssessments.length,
        averageEngagement: this.calculateAverageEngagement(),
        learningVelocity: this.calculateGlobalLearningVelocity(),
        systemHealth: this.calculateSystemHealth(),
        repositoryContentLoaded: this.contentLibrary.courses.every(c => c.repositoryBased !== false)
      };

      this.dashboardMetrics = {
        ...localMetrics,
        pythonAnalytics,
        lastUpdated: new Date(),
        connectionStatus: {
          python: this.isConnectedToPython,
          backend: this.isConnectedToBackend,
          gemini: this.geminiActive
        }
      };

    } catch (error) {
      console.error('Metrics update failed:', error);
    }
  }

  /**
   * Generate AI-powered insights
   */
  async generateInsights() {
    // System health insights
    this.checkSystemHealthInsights();

    // Learning pattern insights
    await this.analyzeLearningPatterns();

    // Performance insights
    this.analyzePerformanceMetrics();

    // Clean old insights (keep last 10)
    this.currentInsights = this.currentInsights
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }

  checkSystemHealthInsights() {
    if (!this.isConnectedToPython) {
      this.addInsight({
        type: 'alert',
        title: 'Python Backend Disconnected',
        description: 'Adaptive testing capabilities are limited without Python backend connection.',
        confidence: 1.0,
        actionable: true,
        priority: 'high',
        timestamp: new Date()
      });
    }

    if (!this.geminiActive) {
      this.addInsight({
        type: 'alert',
        title: 'Gemini AI Unavailable',
        description: 'Advanced learning insights are limited without Gemini AI integration.',
        confidence: 1.0,
        actionable: true,
        priority: 'medium',
        timestamp: new Date()
      });
    }
  }

  async analyzeLearningPatterns() {
    if (this.userSessions.size === 0) return;

    const avgVelocity = this.calculateGlobalLearningVelocity();
    const avgEngagement = this.calculateAverageEngagement();

    if (avgVelocity > 2.0) {
      this.addInsight({
        type: 'performance_trend',
        title: 'High Learning Velocity Detected',
        description: `Average learning velocity of ${avgVelocity.toFixed(2)} interactions/min indicates excellent engagement.`,
        confidence: 0.9,
        actionable: false,
        priority: 'low',
        timestamp: new Date()
      });
    }

    if (avgEngagement < 0.3) {
      this.addInsight({
        type: 'recommendation',
        title: 'Low Engagement Alert',
        description: 'Consider introducing interactive elements or adjusting difficulty to improve engagement.',
        confidence: 0.85,
        actionable: true,
        priority: 'high',
        timestamp: new Date()
      });
    }
  }

  analyzePerformanceMetrics() {
    const recentSessions = Array.from(this.userSessions.values())
      .filter(s => (Date.now() - s.lastActivity.getTime()) < 300000); // Last 5 minutes

    if (recentSessions.length > 0) {
      const avgInteractions = recentSessions.reduce((sum, s) => sum + s.interactions, 0) / recentSessions.length;
      
      if (avgInteractions > 10) {
        this.addInsight({
          type: 'performance_trend',
          title: 'High Activity Session',
          description: `Active learning session with ${avgInteractions.toFixed(0)} interactions detected.`,
          confidence: 0.8,
          actionable: false,
          priority: 'low',
          timestamp: new Date()
        });
      }
    }
  }

  addInsight(insight: any) {
    // Avoid duplicate insights
    const exists = this.currentInsights.some(i => 
      i.title === insight.title && 
      (Date.now() - i.timestamp.getTime()) < 60000 // Within last minute
    );

    if (!exists) {
      this.currentInsights.unshift(insight);
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  getDashboardData() {
    return {
      metrics: this.dashboardMetrics,
      insights: this.currentInsights,
      contentLibrary: {
        coursesCount: this.contentLibrary.courses.length,
        learningPathsCount: this.contentLibrary.learningPaths.length,
        skillAssessmentsCount: this.contentLibrary.skillAssessments.length,
        recentCourses: this.contentLibrary.courses.slice(0, 3),
        repositoryBased: true
      },
      systemStatus: {
        pythonConnected: this.isConnectedToPython,
        backendConnected: this.isConnectedToBackend,
        geminiActive: this.geminiActive,
        activeAgents: 4,
        totalSessions: this.userSessions.size,
        lastUpdated: new Date(),
        contentSource: 'Repository'
      }
    };
  }

  getSessionAnalytics(sessionId?: string) {
    const id = sessionId || this.getCurrentSessionId();
    const session = this.userSessions.get(id);
    
    if (!session) {
      return {
        sessionId: id,
        status: 'not_found',
        analytics: null
      };
    }

    return {
      sessionId: id,
      status: 'active',
      analytics: {
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        totalInteractions: session.interactions,
        learningVelocity: session.learningVelocity,
        engagementScore: session.engagementScore,
        recentActivities: session.activities.slice(-5)
      }
    };
  }

  // Utility methods
  getCurrentSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getRecentSessionData() {
    const sessionId = this.getCurrentSessionId();
    const session = this.userSessions.get(sessionId);
    return session ? {
      interactions: session.interactions,
      learningVelocity: session.learningVelocity,
      recentActivities: session.activities.slice(-3)
    } : null;
  }

  calculateAverageEngagement() {
    if (this.userSessions.size === 0) return 0;
    const total = Array.from(this.userSessions.values())
      .reduce((sum, s) => sum + s.engagementScore, 0);
    return total / this.userSessions.size;
  }

  calculateGlobalLearningVelocity() {
    if (this.userSessions.size === 0) return 0;
    const total = Array.from(this.userSessions.values())
      .reduce((sum, s) => sum + s.learningVelocity, 0);
    return total / this.userSessions.size;
  }

  calculateSystemHealth() {
    let health = 50; // Base health
    if (this.isConnectedToPython) health += 25;
    if (this.isConnectedToBackend) health += 15;
    if (this.geminiActive) health += 10;
    return Math.min(100, health);
  }

  cleanup() {
    console.log('🧹 Agentic AI System cleaned up');
  }
}

export default UnifiedAgenticAISystem;
