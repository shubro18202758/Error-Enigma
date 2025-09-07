import { EnhancedAdaptiveEngine, PersonalizedRoadmapGenerator } from './EnhancedAdaptiveSystem';

interface SpacedRepetitionCard {
  card_id: string;
  content: string;
  subject_id: string;
  due_date: Date;
  repetition_count: number;
  ease_factor: number;
  last_interval: number;
  performance_history: number[];
  last_reviewed?: Date;
  next_review?: Date;
}

interface RetentionAnalytics {
  total_cards: number;
  cards_mastered: number;
  average_retention: number;
  study_streak: number;
  cards_due_today: number;
  estimated_study_time: number;
  retention_trend: 'improving' | 'stable' | 'declining';
  difficulty_breakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
}

interface CompetencyMetrics {
  subject_competencies: Record<string, {
    level: number;
    confidence: number;
    last_assessed: Date;
    progression_rate: number;
    knowledge_gaps: string[];
    mastery_indicators: string[];
  }>;
  learning_velocity: number;
  retention_rate: number;
  struggle_patterns: string[];
  strength_patterns: string[];
  optimal_study_times: string[];
  cognitive_load_analysis: {
    current_load: 'low' | 'medium' | 'high' | 'overload';
    recommendations: string[];
    break_needed: boolean;
  };
}

interface IntegratedLearningAnalytics {
  adaptive_insights: any;
  spaced_repetition_data: RetentionAnalytics;
  competency_metrics: CompetencyMetrics;
  personalized_recommendations: {
    priority_actions: string[];
    study_schedule: {
      today: string[];
      this_week: string[];
      this_month: string[];
    };
    content_suggestions: {
      review: string[];
      new_learning: string[];
      reinforcement: string[];
    };
    difficulty_adjustments: Record<string, 'increase' | 'decrease' | 'maintain'>;
  };
  performance_predictions: {
    topics_at_risk: string[];
    mastery_timeline: Record<string, string>;
    success_probability: Record<string, number>;
  };
}

export class IntegratedLearningAnalyticsEngine {
  private adaptiveEngine: EnhancedAdaptiveEngine;
  private roadmapGenerator: PersonalizedRoadmapGenerator;
  private spacedRepetitionCards: Map<string, SpacedRepetitionCard>;

  constructor() {
    this.adaptiveEngine = new EnhancedAdaptiveEngine();
    this.roadmapGenerator = new PersonalizedRoadmapGenerator();
    this.spacedRepetitionCards = new Map();
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Initialize with sample spaced repetition cards
    const mockCards: SpacedRepetitionCard[] = [
      {
        card_id: 'card_js_variables',
        content: 'What are the different ways to declare variables in JavaScript?',
        subject_id: 'javascript_basics',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        repetition_count: 3,
        ease_factor: 2.3,
        last_interval: 7,
        performance_history: [0.8, 0.9, 0.7, 0.85]
      },
      {
        card_id: 'card_react_hooks',
        content: 'Explain the useState and useEffect hooks in React',
        subject_id: 'react_fundamentals',
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        repetition_count: 1,
        ease_factor: 2.5,
        last_interval: 1,
        performance_history: [0.6]
      },
      {
        card_id: 'card_algorithms_complexity',
        content: 'What is Big O notation and why is it important?',
        subject_id: 'algorithms',
        due_date: new Date(), // Today
        repetition_count: 5,
        ease_factor: 1.8,
        last_interval: 14,
        performance_history: [0.4, 0.5, 0.6, 0.7, 0.8]
      }
    ];

    mockCards.forEach(card => {
      this.spacedRepetitionCards.set(card.card_id, card);
    });
  }

  async generateComprehensiveAnalytics(userId: string): Promise<IntegratedLearningAnalytics> {
    // Get adaptive testing insights
    const adaptiveData = this.loadAdaptiveEngineData();
    const adaptiveInsights = adaptiveData ? this.analyzeAdaptivePerformance(adaptiveData) : null;

    // Get spaced repetition analytics
    const retentionData = await this.calculateRetentionAnalytics(userId);
    
    // Generate competency metrics
    const competencyMetrics = this.calculateCompetencyMetrics(adaptiveInsights, retentionData);
    
    // Generate personalized recommendations
    const recommendations = this.generatePersonalizedRecommendations(
      adaptiveInsights, 
      retentionData, 
      competencyMetrics
    );
    
    // Generate performance predictions
    const predictions = this.generatePerformancePredictions(
      adaptiveInsights, 
      retentionData, 
      competencyMetrics
    );

    return {
      adaptive_insights: adaptiveInsights,
      spaced_repetition_data: retentionData,
      competency_metrics: competencyMetrics,
      personalized_recommendations: recommendations,
      performance_predictions: predictions
    };
  }

  private loadAdaptiveEngineData(): any {
    const stored = localStorage.getItem('adaptiveEngineData');
    return stored ? JSON.parse(stored) : null;
  }

  private analyzeAdaptivePerformance(adaptiveData: any): any {
    const responses = adaptiveData.responses || [];
    const lessonPerformance = adaptiveData.lessonPerformance || {};
    
    // Calculate advanced metrics
    const totalQuestions = responses.length;
    const correctAnswers = responses.filter((r: any) => r.is_correct).length;
    const overallAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) : 0;
    
    // Analyze response patterns
    const responsePatterns = this.analyzeResponsePatterns(responses);
    
    // Calculate learning velocity
    const learningVelocity = this.calculateLearningVelocity(responses);
    
    return {
      overall_accuracy: overallAccuracy,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      response_patterns: responsePatterns,
      learning_velocity: learningVelocity,
      lesson_breakdown: lessonPerformance,
      confidence_indicators: this.extractConfidenceIndicators(responses),
      knowledge_gaps: this.identifyKnowledgeGaps(lessonPerformance),
      mastery_areas: this.identifyMasteryAreas(lessonPerformance)
    };
  }

  private analyzeResponsePatterns(responses: any[]): any {
    if (responses.length === 0) return {};
    
    const patterns = {
      consistency: 0,
      improvement_trend: 0,
      difficulty_adaptation: 0,
      time_efficiency: 0
    };
    
    // Analyze consistency (standard deviation of performance)
    const accuracies = responses.map(r => r.is_correct ? 1 : 0);
    const avgAccuracy = accuracies.reduce((a: number, b: number) => a + b, 0) / accuracies.length;
    const variance = accuracies.reduce((sum: number, acc: number) => sum + Math.pow(acc - avgAccuracy, 2), 0) / accuracies.length;
    patterns.consistency = Math.max(0, 1 - Math.sqrt(variance));
    
    // Analyze improvement trend
    if (responses.length >= 5) {
      const firstHalf = accuracies.slice(0, Math.floor(accuracies.length / 2));
      const secondHalf = accuracies.slice(Math.ceil(accuracies.length / 2));
      const firstAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;
      patterns.improvement_trend = secondAvg - firstAvg;
    }
    
    return patterns;
  }

  private calculateLearningVelocity(responses: any[]): number {
    if (responses.length < 2) return 1.0;
    
    // Calculate velocity based on accuracy improvement over time
    let totalImprovement = 0;
    let measurements = 0;
    
    for (let i = 1; i < responses.length; i++) {
      const prev = responses[i - 1].is_correct ? 1 : 0;
      const curr = responses[i].is_correct ? 1 : 0;
      totalImprovement += (curr - prev);
      measurements++;
    }
    
    const avgImprovement = measurements > 0 ? totalImprovement / measurements : 0;
    return Math.max(0.1, 1.0 + avgImprovement);
  }

  private extractConfidenceIndicators(responses: any[]): string[] {
    const indicators: string[] = [];
    
    if (responses.length === 0) return indicators;
    
    const recentAccuracy = responses.slice(-5).filter(r => r.is_correct).length / Math.min(5, responses.length);
    
    if (recentAccuracy >= 0.8) {
      indicators.push('High recent performance indicates strong confidence');
    } else if (recentAccuracy <= 0.4) {
      indicators.push('Low recent performance suggests confidence issues');
    }
    
    // Analyze response times if available
    const responseTimes = responses.filter(r => r.response_time).map(r => r.response_time);
    if (responseTimes.length > 0) {
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      if (avgTime < 30) {
        indicators.push('Quick response times indicate confidence');
      } else if (avgTime > 120) {
        indicators.push('Slower response times may indicate uncertainty');
      }
    }
    
    return indicators;
  }

  private identifyKnowledgeGaps(lessonPerformance: Record<string, any>): string[] {
    const gaps = [];
    
    for (const [lesson, perf] of Object.entries(lessonPerformance)) {
      if (perf.overall_accuracy < 0.5 || perf.needs_focus) {
        gaps.push(lesson);
      }
    }
    
    return gaps;
  }

  private identifyMasteryAreas(lessonPerformance: Record<string, any>): string[] {
    const mastery = [];
    
    for (const [lesson, perf] of Object.entries(lessonPerformance)) {
      if (perf.overall_accuracy >= 0.85 && perf.is_strength) {
        mastery.push(lesson);
      }
    }
    
    return mastery;
  }

  async calculateRetentionAnalytics(userId: string): Promise<RetentionAnalytics> {
    const cards = Array.from(this.spacedRepetitionCards.values());
    
    // Calculate mastery (cards with ease_factor > 2.5 and repetition_count > 3)
    const masteredCards = cards.filter(card => 
      card.ease_factor > 2.5 && card.repetition_count > 3
    ).length;
    
    // Calculate average retention based on performance history
    let totalRetention = 0;
    let cardCount = 0;
    
    cards.forEach(card => {
      if (card.performance_history.length > 0) {
        const cardRetention = card.performance_history.reduce((a, b) => a + b, 0) / card.performance_history.length;
        totalRetention += cardRetention;
        cardCount++;
      }
    });
    
    const averageRetention = cardCount > 0 ? totalRetention / cardCount : 0;
    
    // Calculate cards due today
    const today = new Date();
    const dueToday = cards.filter(card => {
      const dueDate = new Date(card.due_date);
      return dueDate <= today;
    }).length;
    
    // Difficulty breakdown
    const easyCards = cards.filter(card => card.ease_factor > 2.3).length;
    const hardCards = cards.filter(card => card.ease_factor < 2.0).length;
    const mediumCards = cards.length - easyCards - hardCards;
    
    return {
      total_cards: cards.length,
      cards_mastered: masteredCards,
      average_retention: averageRetention,
      study_streak: 12, // Mock data
      cards_due_today: dueToday,
      estimated_study_time: dueToday * 2, // 2 minutes per card
      retention_trend: averageRetention > 0.7 ? 'improving' : 
                      averageRetention > 0.5 ? 'stable' : 'declining',
      difficulty_breakdown: {
        easy: easyCards,
        medium: mediumCards,
        hard: hardCards
      }
    };
  }

  private calculateCompetencyMetrics(adaptiveInsights: any, retentionData: RetentionAnalytics): CompetencyMetrics {
    const subjects = ['JavaScript', 'React', 'Algorithms', 'Data Structures'];
    const subjectCompetencies: Record<string, any> = {};
    
    subjects.forEach((subject, index) => {
      subjectCompetencies[subject] = {
        level: Math.random() * 100,
        confidence: Math.random() * 100,
        last_assessed: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        progression_rate: (Math.random() - 0.5) * 20,
        knowledge_gaps: adaptiveInsights?.knowledge_gaps?.slice(0, 2) || [],
        mastery_indicators: adaptiveInsights?.mastery_areas?.slice(0, 2) || []
      };
    });
    
    return {
      subject_competencies: subjectCompetencies,
      learning_velocity: adaptiveInsights?.learning_velocity || 1.0,
      retention_rate: retentionData.average_retention * 100,
      struggle_patterns: adaptiveInsights?.knowledge_gaps || [],
      strength_patterns: adaptiveInsights?.mastery_areas || [],
      optimal_study_times: ['9:00 AM', '2:00 PM', '7:00 PM'],
      cognitive_load_analysis: {
        current_load: retentionData.cards_due_today > 10 ? 'high' : 'medium',
        recommendations: [
          'Take breaks every 25 minutes',
          'Focus on one topic at a time',
          'Review difficult concepts multiple times'
        ],
        break_needed: retentionData.cards_due_today > 15
      }
    };
  }

  private generatePersonalizedRecommendations(
    adaptiveInsights: any,
    retentionData: RetentionAnalytics,
    competencyMetrics: CompetencyMetrics
  ): any {
    const priorityActions = [];
    
    if (retentionData.cards_due_today > 5) {
      priorityActions.push('Complete spaced repetition review session');
    }
    
    if (adaptiveInsights?.knowledge_gaps?.length > 0) {
      priorityActions.push(`Focus on improving: ${adaptiveInsights.knowledge_gaps.slice(0, 2).join(', ')}`);
    }
    
    if (competencyMetrics.cognitive_load_analysis.break_needed) {
      priorityActions.push('Take a learning break to avoid cognitive overload');
    }
    
    return {
      priority_actions: priorityActions,
      study_schedule: {
        today: [
          'Review due spaced repetition cards (15 min)',
          'Practice weak areas identified in assessment (20 min)',
          'Quick review of mastered topics (10 min)'
        ],
        this_week: [
          'Complete adaptive assessment retake',
          'Focus sessions on knowledge gaps',
          'Build projects using mastered skills'
        ],
        this_month: [
          'Master identified weak areas',
          'Advanced challenges in strength areas',
          'Comprehensive skill assessment'
        ]
      },
      content_suggestions: {
        review: adaptiveInsights?.knowledge_gaps || ['Basic concepts'],
        new_learning: ['Advanced topics', 'Real-world applications'],
        reinforcement: adaptiveInsights?.mastery_areas || ['Completed topics']
      },
      difficulty_adjustments: {
        'Easy Topics': 'increase' as const,
        'Medium Topics': 'maintain' as const,
        'Hard Topics': 'decrease' as const
      }
    };
  }

  private generatePerformancePredictions(
    adaptiveInsights: any,
    retentionData: RetentionAnalytics,
    competencyMetrics: CompetencyMetrics
  ): any {
    const topicsAtRisk = [];
    const masteryTimeline: Record<string, string> = {};
    const successProbability: Record<string, number> = {};
    
    // Identify topics at risk based on retention and performance
    if (retentionData.average_retention < 0.6) {
      topicsAtRisk.push('Recently studied topics due to low retention');
    }
    
    if (adaptiveInsights?.knowledge_gaps) {
      topicsAtRisk.push(...adaptiveInsights.knowledge_gaps);
    }
    
    // Predict mastery timelines
    Object.keys(competencyMetrics.subject_competencies).forEach(subject => {
      const competency = competencyMetrics.subject_competencies[subject];
      const currentLevel = competency.level;
      const progressionRate = Math.abs(competency.progression_rate);
      
      if (currentLevel >= 80) {
        masteryTimeline[subject] = 'Already mastered';
      } else {
        const daysToMastery = Math.ceil((80 - currentLevel) / (progressionRate / 7));
        masteryTimeline[subject] = `${daysToMastery} days`;
      }
      
      // Calculate success probability
      successProbability[subject] = Math.min(100, currentLevel + (progressionRate * 2));
    });
    
    return {
      topics_at_risk: topicsAtRisk,
      mastery_timeline: masteryTimeline,
      success_probability: successProbability
    };
  }

  async updateSpacedRepetitionPerformance(
    cardId: string, 
    performance: number, 
    responseTime: number
  ): Promise<void> {
    const card = this.spacedRepetitionCards.get(cardId);
    if (!card) return;
    
    // Update performance history
    card.performance_history.push(performance);
    if (card.performance_history.length > 10) {
      card.performance_history.shift(); // Keep only last 10 performances
    }
    
    // Calculate new parameters using SuperMemo algorithm
    const { nextInterval, newEaseFactor } = this.calculateNextReview(card, performance);
    
    card.ease_factor = newEaseFactor;
    card.last_interval = nextInterval;
    card.last_reviewed = new Date();
    card.next_review = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000);
    
    if (performance >= 0.6) {
      card.repetition_count += 1;
    } else {
      card.repetition_count = 0; // Reset on failure
    }
    
    this.spacedRepetitionCards.set(cardId, card);
  }

  private calculateNextReview(card: SpacedRepetitionCard, performance: number): { nextInterval: number; newEaseFactor: number } {
    const successThreshold = 0.6;
    let nextInterval = card.last_interval;
    let easeFactor = card.ease_factor;
    
    if (performance >= successThreshold) {
      // Success - increase interval
      if (card.repetition_count === 0) {
        nextInterval = 1;
      } else if (card.repetition_count === 1) {
        nextInterval = 6;
      } else {
        nextInterval = Math.round(card.last_interval * easeFactor);
      }
      
      // Adjust ease factor based on performance
      const performanceBonus = (performance - successThreshold) * 0.15;
      easeFactor += performanceBonus;
    } else {
      // Failure - reset interval but keep some progress
      nextInterval = 1;
      const performancePenalty = (successThreshold - performance) * 0.20;
      easeFactor = Math.max(1.3, easeFactor - performancePenalty);
    }
    
    // Apply bounds
    nextInterval = Math.max(1, Math.min(365, nextInterval));
    easeFactor = Math.max(1.3, Math.min(3.0, easeFactor));
    
    return { nextInterval, newEaseFactor: easeFactor };
  }

  getIntegrationStatus(): { adaptive: boolean; spaced: boolean; analytics: boolean } {
    return {
      adaptive: !!localStorage.getItem('adaptiveEngineData'),
      spaced: this.spacedRepetitionCards.size > 0,
      analytics: true
    };
  }
}

export default IntegratedLearningAnalyticsEngine;
