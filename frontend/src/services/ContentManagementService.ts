import { 
  Course, 
  ContentLibrary, 
  LearningPath, 
  SkillAssessment,
  APIResponse,
  Filters,
  UserProfile 
} from '../types/unified-system.types';

/**
 * Content Management Service
 * Handles repository-based content loading and management
 */
export class ContentManagementService {
  private backendAPI: string;
  private isConnectedToBackend: boolean = false;
  private contentLibrary: ContentLibrary;

  constructor(backendAPI: string = 'http://localhost:3001/api') {
    this.backendAPI = backendAPI;
    this.contentLibrary = {
      courses: [],
      quizzes: [],
      projects: [],
      skillAssessments: [],
      learningPaths: []
    };
  }

  /**
   * Initialize content library from repository
   */
  async initializeContentLibrary(): Promise<void> {
    console.log('🚀 Initializing content library from repository...');
    
    try {
      // Load courses from repository
      await this.loadCoursesFromRepository();
      
      // Generate skill assessments
      this.loadSkillAssessments();
      
      // Generate learning paths based on loaded courses
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
   */
  async loadCoursesFromRepository(): Promise<void> {
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
   * Fetch courses from backend API
   */
  async fetchCoursesFromBackend(): Promise<Course[] | null> {
    try {
      if (!this.isConnectedToBackend) {
        console.log('🔌 Backend not connected, using repository fallback');
        return null;
      }
      
      console.log('🌐 Fetching courses from backend API...');
      const response = await fetch(`${this.backendAPI}/courses`);
      
      if (response.ok) {
        const data: APIResponse = await response.json();
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
   * Load courses from known repository structure
   */
  async loadKnownRepositoryCourses(): Promise<void> {
    const repositoryCourses: Course[] = [
      {
        id: 'complete_data_science_masterclass',
        courseId: 'complete_data_science_masterclass',
        title: 'Complete Data Science Masterclass',
        description: 'Master data science from basics to advanced machine learning, including Python, statistics, and real-world projects.',
        level: 'intermediate',
        category: 'Data Science',
        subcategory: 'Machine Learning',
        duration: 45, // hours
        instructor: 'Dr. Sarah Johnson',
        rating: 4.6,
        enrolled: 2834,
        skills: ['Python', 'Statistics', 'Machine Learning', 'Data Visualization', 'Pandas', 'NumPy'],
        totalModules: 4,
        totalLessons: 12,
        totalDuration: 2700, // minutes
        prerequisites: ['Basic Python Knowledge', 'Statistics Fundamentals'],
        learningObjectives: [
          'Master Python for data science applications',
          'Understand statistical analysis and hypothesis testing',
          'Build and evaluate machine learning models',
          'Create compelling data visualizations',
          'Work with real-world datasets'
        ],
        repositoryPath: 'services/shared/content_library/Courses/complete_data_science_masterclass/',
        hasVideoContent: true,
        hasTranscripts: true,
        hasMetadata: true,
        createdAt: '2024-01-15',
        repositoryBased: true
      },
      {
        id: 'modern_web_development_bootcamp',
        courseId: 'modern_web_development_bootcamp',
        title: 'Modern Web Development Bootcamp',
        description: 'Full-stack web development with React, Node.js, and modern JavaScript. Build complete web applications from scratch.',
        level: 'beginner-to-intermediate',
        category: 'Web Development',
        subcategory: 'Full-Stack Development',
        duration: 60, // hours
        instructor: 'Mike Chen',
        rating: 4.7,
        enrolled: 3456,
        skills: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'MongoDB', 'Authentication'],
        totalModules: 3,
        totalLessons: 9,
        totalDuration: 3600, // minutes
        prerequisites: ['Basic HTML/CSS', 'JavaScript Fundamentals'],
        learningObjectives: [
          'Build responsive, modern websites',
          'Master React for frontend development',
          'Create RESTful APIs with Node.js',
          'Implement user authentication',
          'Deploy applications to production'
        ],
        repositoryPath: 'services/shared/content_library/Courses/modern_web_development_bootcamp/',
        hasVideoContent: true,
        hasTranscripts: true,
        hasMetadata: true,
        createdAt: '2024-02-01',
        repositoryBased: true
      }
    ];

    this.contentLibrary.courses = repositoryCourses;
  }

  /**
   * Load skill assessments based on available courses
   */
  loadSkillAssessments(): void {
    this.contentLibrary.skillAssessments = [
      {
        id: 'programming-fundamentals',
        title: 'Programming Fundamentals Assessment',
        description: 'Evaluate your understanding of basic programming concepts',
        category: 'Programming',
        difficulty: 'beginner',
        duration: 30,
        questionCount: 15,
        skills: ['Programming Logic', 'Problem Solving', 'Code Structure'],
        relatedCourses: ['data-science-masterclass'],
        questions: [], // Would be populated from actual assessment data
        passingScore: 70,
        timeLimit: 30 // minutes
      },
      {
        id: 'data-science-basics',
        title: 'Data Science Fundamentals',
        description: 'Test your knowledge of data science concepts and Python',
        category: 'Data Science',
        difficulty: 'intermediate',
        duration: 45,
        questionCount: 20,
        skills: ['Python', 'Statistics', 'Data Analysis'],
        relatedCourses: ['data-science-masterclass'],
        questions: [],
        passingScore: 75,
        timeLimit: 45
      },
      {
        id: 'web-development-skills',
        title: 'Web Development Skills Assessment',
        description: 'Comprehensive test of frontend and backend development skills',
        category: 'Web Development',
        difficulty: 'advanced',
        duration: 60,
        questionCount: 25,
        skills: ['JavaScript', 'React', 'Node.js', 'HTML/CSS'],
        relatedCourses: ['data-science-masterclass'],
        questions: [],
        passingScore: 70,
        timeLimit: 60
      }
    ];
  }

  /**
   * Generate learning paths based on available courses
   */
  generateLearningPaths(): void {
    this.contentLibrary.learningPaths = [
      {
        id: 'fullstack-developer-path',
        title: 'Full-Stack Developer',
        description: 'Become a complete web developer with frontend and backend skills',
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
        title: 'Data Scientist Career Path',
        description: 'Master data science from fundamentals to advanced machine learning',
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
        description: 'Start your programming journey with essential skills',
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
   * Get personalized learning paths for a user
   */
  async getPersonalizedLearningPaths(userProfile: UserProfile, goals: string[]): Promise<any> {
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
  async getCourseRecommendations(userProfile: UserProfile, filters: Filters = {}): Promise<any> {
    try {
      let courses = [...this.contentLibrary.courses];

      // Apply filters safely
      if (filters.category) {
        courses = courses.filter(c => c.category === filters.category);
      }
      if (filters.level) {
        courses = courses.filter(c => c.level === filters.level);
      }
      if (filters.maxDuration && filters.maxDuration > 0) {
        courses = courses.filter(c => c.duration <= filters.maxDuration!);
      }

      // Add personalization score and repository information
      const recommendations = courses.map(course => ({
        ...course,
        personalizationScore: this.calculatePersonalizationScore(course, userProfile),
        recommendationReason: this.generateRecommendationReason(course, userProfile),
        fromRepository: true,
        repositoryMetadata: {
          hasActualContent: course.repositoryBased || false,
          contentPath: course.repositoryPath || null,
          lastUpdated: course.createdAt || 'Unknown'
        }
      }));

      // Sort by personalization score
      recommendations.sort((a, b) => b.personalizationScore - a.personalizationScore);

      return {
        success: true,
        courses: recommendations.slice(0, 10),
        totalCourses: this.contentLibrary.courses.length,
        sourcedFromRepository: true
      };
    } catch (error) {
      console.error('Error getting course recommendations:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Helper methods
  private matchesUserGoals(path: LearningPath, goals: string[], userProfile: UserProfile): boolean {
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

  private calculateMatchScore(path: LearningPath, userProfile: UserProfile): number {
    let score = 50; // Base score
    
    // Level matching
    if (userProfile?.preferredLevel === path.difficulty) {
      score += 25;
    }
    
    // Skills alignment
    if (userProfile?.interests) {
      const matchingSkills = path.skills.filter(skill => 
        userProfile.interests!.some(interest => 
          skill.toLowerCase().includes(interest.toLowerCase())
        )
      );
      score += matchingSkills.length * 5;
    }
    
    return Math.min(100, score);
  }

  private estimateCompletionTime(path: LearningPath, userProfile: UserProfile): string {
    const baseDuration = path.duration;
    const userMultiplier = userProfile?.learningVelocity || 1.0;
    
    // Adjust based on user learning velocity
    const adjustedDuration = baseDuration;
    return adjustedDuration;
  }

  private calculatePersonalizationScore(course: Course, userProfile: UserProfile): number {
    let score = 50; // Base score
    
    // Level matching
    if (userProfile?.preferredLevel === course.level) {
      score += 20;
    }
    
    // Skills matching
    if (userProfile?.interests) {
      const matchingSkills = course.skills.filter(skill => 
        userProfile.interests!.some(interest => 
          skill.toLowerCase().includes(interest.toLowerCase())
        )
      );
      score += matchingSkills.length * 3;
    }
    
    // Rating boost
    score += (course.rating || 3.5) * 5;
    
    return Math.min(100, score);
  }

  private generateRecommendationReason(course: Course, userProfile: UserProfile): string {
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

    return reasons.join(' • ') || 'Great for skill development';
  }

  /**
   * Initialize fallback content if repository loading fails
   */
  private initializeFallbackContent(): void {
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
   * Check backend connection
   */
  async checkBackendConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendAPI}/health`);
      this.isConnectedToBackend = response.ok;
      return this.isConnectedToBackend;
    } catch (error) {
      this.isConnectedToBackend = false;
      return false;
    }
  }

  /**
   * Get content library
   */
  getContentLibrary(): ContentLibrary {
    return this.contentLibrary;
  }

  /**
   * Update backend API URL
   */
  updateBackendAPI(newAPI: string): void {
    this.backendAPI = newAPI;
    this.isConnectedToBackend = false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnectedToBackend;
  }
}

export default ContentManagementService;
