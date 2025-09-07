// Enhanced Adaptive Testing System based on adaptive_test_new.py
// Complete implementation with personalized roadmaps and content guidance

// Remove uuid import for now - will use Date.now() for IDs
// import { v4 as uuidv4 } from 'uuid';

// Core interfaces matching the Python implementation
interface Question {
  id: string;
  question: string;
  options: { [key: string]: string }; // A, B, C, D
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  lesson_name: string;
  module_name: string;
  quality_score: number;
  explanation?: string;
}

interface UserResponse {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  response_time: number;
  difficulty: string;
  lesson_name: string;
  module_name: string;
  timestamp: Date;
}

interface LessonPerformance {
  easy: { correct: number; total: number; avg_time: number };
  medium: { correct: number; total: number; avg_time: number };
  hard: { correct: number; total: number; avg_time: number };
  overall_accuracy: number;
  needs_focus: boolean;
  is_strength: boolean;
  time_concerns: boolean;
  terminated: boolean;
}

interface SkillsAssessment {
  confident_lessons: string[];
  weak_lessons: string[];  // "I don't know practical usage"
  lesson_confidence: { [lesson: string]: { confident: boolean; category: string } };
}

interface PersonalizedRoadmap {
  user_id: string;
  course_title: string;
  assessment_results: any;
  strengths: string[];
  weaknesses: string[];
  skip_recommendations: string[];
  focus_areas: string[];
  personalized_learning_path: {
    phase1: { title: string; duration: string; topics: string[]; lessons: string[] };
    phase2: { title: string; duration: string; topics: string[]; lessons: string[] };
    phase3: { title: string; duration: string; topics: string[]; lessons: string[] };
  };
  content_guidance: {
    [lesson: string]: {
      difficulty_level: 'skip' | 'review' | 'focus' | 'challenge';
      personalized_comments: string[];
      time_estimate: string;
      prerequisites: string[];
      success_criteria: string[];
    };
  };
  time_based_analysis: {
    fast_lessons: string[];
    slow_lessons: string[];
    normal_lessons: string[];
  };
  ai_insights: string[];
  estimated_completion_time: string;
  created_at: Date;
}

class EnhancedAdaptiveEngine {
  private performance_history: UserResponse[] = [];
  private current_difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  private consecutive_correct = 0;
  private consecutive_wrong = 0;
  private consecutive_wrong_lesson = 0;
  private lesson_performance: { [lesson: string]: LessonPerformance } = {};
  private lesson_confidence: { [lesson: string]: { confident: boolean; category: string } } = {};
  private current_lesson: string | null = null;
  private questions_in_current_difficulty = 0;
  private target_questions_per_difficulty = 2;

  setLessonConfidence(lesson_name: string, is_confident: boolean) {
    this.lesson_confidence[lesson_name] = {
      confident: is_confident,
      category: is_confident ? 'confident' : 'pre_weakness'
    };
  }

  startNewLesson(lesson_name: string) {
    this.current_lesson = lesson_name;
    this.current_difficulty = 'medium';
    this.consecutive_correct = 0;
    this.consecutive_wrong = 0;
    this.consecutive_wrong_lesson = 0;
    this.questions_in_current_difficulty = 0;

    if (!this.lesson_performance[lesson_name]) {
      this.lesson_performance[lesson_name] = {
        easy: { correct: 0, total: 0, avg_time: 0 },
        medium: { correct: 0, total: 0, avg_time: 0 },
        hard: { correct: 0, total: 0, avg_time: 0 },
        overall_accuracy: 0,
        needs_focus: false,
        is_strength: false,
        time_concerns: false,
        terminated: false
      };
    }
  }

  shouldTerminateLesson(): boolean {
    return this.consecutive_wrong_lesson >= 2;
  }

  markLessonTerminated() {
    if (this.current_lesson && this.lesson_performance[this.current_lesson]) {
      this.lesson_performance[this.current_lesson].terminated = true;
    }
  }

  getNextDifficulty(was_correct: boolean, response_time: number): 'easy' | 'medium' | 'hard' {
    this.questions_in_current_difficulty += 1;

    if (was_correct) {
      this.consecutive_correct += 1;
      this.consecutive_wrong = 0;
      this.consecutive_wrong_lesson = 0;
    } else {
      this.consecutive_wrong += 1;
      this.consecutive_correct = 0;
      this.consecutive_wrong_lesson += 1;
    }

    // Update lesson performance
    if (this.current_lesson) {
      const lesson_perf = this.lesson_performance[this.current_lesson][this.current_difficulty];
      lesson_perf.total += 1;
      if (was_correct) {
        lesson_perf.correct += 1;
      }

      // Update average time
      const current_avg = lesson_perf.avg_time;
      const total_questions = lesson_perf.total;
      lesson_perf.avg_time = ((current_avg * (total_questions - 1)) + response_time) / total_questions;
    }

    // Apply adaptive logic from Python implementation
    if (this.questions_in_current_difficulty >= this.target_questions_per_difficulty) {
      if (this.current_difficulty === 'medium') {
        if (this.consecutive_correct >= 2) {
          this.resetDifficultyTracking();
          return 'hard';
        } else {
          this.resetDifficultyTracking();
          return 'easy';
        }
      } else if (this.current_difficulty === 'easy') {
        if (this.consecutive_correct >= 2) {
          this.resetDifficultyTracking();
          return 'medium';
        } else {
          this.resetDifficultyTracking();
          return 'easy';
        }
      } else if (this.current_difficulty === 'hard') {
        if (this.consecutive_correct >= 1) {
          this.resetDifficultyTracking();
          return 'hard';
        } else {
          this.resetDifficultyTracking();
          return 'medium';
        }
      }
    }

    return this.current_difficulty;
  }

  private resetDifficultyTracking() {
    this.questions_in_current_difficulty = 0;
    this.consecutive_correct = 0;
    this.consecutive_wrong = 0;
  }

  recordResponse(response: UserResponse) {
    this.performance_history.push(response);
  }

  analyzeLessonPerformance() {
    for (const [lesson_name, perf] of Object.entries(this.lesson_performance)) {
      const total_correct = perf.easy.correct + perf.medium.correct + perf.hard.correct;
      const total_attempted = perf.easy.total + perf.medium.total + perf.hard.total;

      if (total_attempted > 0) {
        perf.overall_accuracy = (total_correct / total_attempted) * 100;

        // Check for time concerns
        const avg_times = [perf.easy, perf.medium, perf.hard]
          .filter(d => d.total > 0)
          .map(d => d.avg_time);
        
        if (avg_times.length > 0 && avg_times.reduce((a, b) => a + b) / avg_times.length > 45) {
          perf.time_concerns = true;
        }

        // Categorize performance
        if (perf.overall_accuracy >= 80 && perf.hard.correct > 0) {
          perf.is_strength = true;
        } else if (perf.overall_accuracy < 60 || perf.easy.correct < perf.easy.total) {
          perf.needs_focus = true;
        }
      }
    }
  }

  getPerformanceHistory(): UserResponse[] {
    return this.performance_history;
  }

  getLessonPerformance(): { [lesson: string]: LessonPerformance } {
    return this.lesson_performance;
  }

  getLessonConfidence(): { [lesson: string]: { confident: boolean; category: string } } {
    return this.lesson_confidence;
  }
}

class PersonalizedRoadmapGenerator {
  private geminiModel: any = null;

  constructor(geminiModel?: any) {
    this.geminiModel = geminiModel;
  }

  async generatePersonalizedRoadmap(
    user_id: string,
    course_title: string,
    responses: UserResponse[],
    lesson_performance: { [lesson: string]: LessonPerformance },
    lesson_confidence: { [lesson: string]: { confident: boolean; category: string } }
  ): Promise<PersonalizedRoadmap> {
    
    // Analyze assessment results
    const assessment_results = this.analyzeAssessmentResults(responses, lesson_performance, lesson_confidence);
    
    // Generate personalized learning path
    const learning_path = await this.generateLearningPath(assessment_results, course_title);
    
    // Generate content guidance for each lesson
    const content_guidance = this.generateContentGuidance(assessment_results, lesson_performance, lesson_confidence);
    
    // Generate time-based analysis
    const time_analysis = this.generateTimeBasedAnalysis(lesson_performance, lesson_confidence);
    
    // Generate AI insights
    const ai_insights = await this.generateAIInsights(assessment_results, course_title);

    const roadmap: PersonalizedRoadmap = {
      user_id,
      course_title,
      assessment_results,
      strengths: assessment_results.strengths,
      weaknesses: assessment_results.weaknesses,
      skip_recommendations: assessment_results.skip_recommendations,
      focus_areas: assessment_results.focus_areas,
      personalized_learning_path: learning_path,
      content_guidance,
      time_based_analysis: time_analysis,
      ai_insights,
      estimated_completion_time: this.calculateEstimatedTime(assessment_results),
      created_at: new Date()
    };

    return roadmap;
  }

  private analyzeAssessmentResults(
    responses: UserResponse[],
    lesson_performance: { [lesson: string]: LessonPerformance },
    lesson_confidence: { [lesson: string]: { confident: boolean; category: string } }
  ) {
    const test_responses = responses.filter(r => r.difficulty !== 'skills_assessment');
    const skills_assessment_responses = responses.filter(r => r.difficulty === 'skills_assessment');

    // Calculate basic stats
    const total_questions = test_responses.length;
    const correct_answers = test_responses.filter(r => r.is_correct).length;
    const accuracy = total_questions > 0 ? (correct_answers / total_questions) * 100 : 0;
    const avg_time = total_questions > 0 ? 
      test_responses.reduce((sum, r) => sum + r.response_time, 0) / total_questions : 0;

    // Categorize lessons
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const skip_recommendations: string[] = [];
    const focus_areas: string[] = [];

    // Skills assessment weaknesses (marked as "I don't know practical usage")
    skills_assessment_responses.forEach(r => {
      weaknesses.push(r.lesson_name);
      focus_areas.push(r.lesson_name);
    });

    // Performance-based analysis
    Object.entries(lesson_performance).forEach(([lesson, perf]) => {
      if (perf.terminated) {
        weaknesses.push(lesson);
        focus_areas.push(lesson);
      } else if (perf.overall_accuracy >= 80) {
        strengths.push(lesson);
        if (perf.overall_accuracy >= 90) {
          skip_recommendations.push(lesson);
        }
      } else if (perf.overall_accuracy < 60) {
        weaknesses.push(lesson);
        focus_areas.push(lesson);
      }
    });

    return {
      total_questions,
      correct_answers,
      accuracy,
      avg_time,
      strengths: Array.from(new Set(strengths)),
      weaknesses: Array.from(new Set(weaknesses)),
      skip_recommendations: Array.from(new Set(skip_recommendations)),
      focus_areas: Array.from(new Set(focus_areas)),
      lesson_performance,
      skills_assessment_weaknesses: skills_assessment_responses.map(r => r.lesson_name)
    };
  }

  private async generateLearningPath(assessment_results: any, course_title: string) {
    // Create adaptive learning phases based on assessment
    const phase1_lessons = assessment_results.focus_areas.slice(0, 3);
    const phase2_lessons = assessment_results.weaknesses.filter((l: string) => !phase1_lessons.includes(l));
    const phase3_lessons = assessment_results.strengths;

    const learning_path = {
      phase1: {
        title: "Foundation Building & Critical Areas",
        duration: "2-3 weeks",
        topics: phase1_lessons.length > 0 ? phase1_lessons : ["Basic concepts", "Fundamentals"],
        lessons: phase1_lessons
      },
      phase2: {
        title: "Skill Development & Practice",
        duration: "3-4 weeks", 
        topics: phase2_lessons.length > 0 ? phase2_lessons : ["Intermediate concepts", "Applied practice"],
        lessons: phase2_lessons
      },
      phase3: {
        title: "Advanced Mastery & Optimization",
        duration: "2-3 weeks",
        topics: phase3_lessons.length > 0 ? phase3_lessons : ["Advanced topics", "Real-world projects"],
        lessons: phase3_lessons
      }
    };

    // Use AI to enhance learning path if available
    if (this.geminiModel) {
      try {
        const ai_enhanced_path = await this.enhanceLearningPathWithAI(learning_path, assessment_results, course_title);
        return ai_enhanced_path || learning_path;
      } catch (error) {
        console.log('Using offline learning path generation');
      }
    }

    return learning_path;
  }

  private generateContentGuidance(
    assessment_results: any,
    lesson_performance: { [lesson: string]: LessonPerformance },
    lesson_confidence: { [lesson: string]: { confident: boolean; category: string } }
  ) {
    const content_guidance: PersonalizedRoadmap['content_guidance'] = {};

    // Generate guidance for each lesson based on performance
    const all_lessons = new Set([
      ...Object.keys(lesson_performance),
      ...Object.keys(lesson_confidence),
      ...assessment_results.strengths,
      ...assessment_results.weaknesses
    ]);

    all_lessons.forEach(lesson => {
      const perf = lesson_performance[lesson];
      const confidence = lesson_confidence[lesson];
      
      let difficulty_level: 'skip' | 'review' | 'focus' | 'challenge' = 'review';
      let personalized_comments: string[] = [];
      let time_estimate = "2-3 hours";
      let prerequisites: string[] = [];
      let success_criteria: string[] = [];

      // Determine difficulty level and guidance
      if (assessment_results.skip_recommendations.includes(lesson)) {
        difficulty_level = 'skip';
        personalized_comments = [
          `🎉 You've mastered this topic! You scored ${perf?.overall_accuracy || 90}%`,
          "💡 Consider this as a quick review or skip entirely",
          "🚀 You can move to more advanced topics"
        ];
        time_estimate = "30 minutes (optional review)";
      } else if (assessment_results.focus_areas.includes(lesson)) {
        difficulty_level = 'focus';
        personalized_comments = [
          `📚 This area needs focused attention`,
          perf?.terminated ? "⚠️ Assessment indicated significant knowledge gaps" : 
            `🎯 You scored ${perf?.overall_accuracy || 0}% - let's improve this!`,
          "💪 Take your time and practice hands-on exercises",
          "🔄 Consider revisiting prerequisites if needed"
        ];
        time_estimate = "4-6 hours";
        success_criteria = [
          "Complete all practical exercises",
          "Achieve 80%+ on lesson quiz",
          "Apply concepts in a mini-project"
        ];
      } else if (assessment_results.strengths.includes(lesson)) {
        difficulty_level = 'challenge';
        personalized_comments = [
          `💪 You're strong in this area! (${perf?.overall_accuracy || 80}%)`,
          "🔥 Ready for advanced challenges and real-world applications",
          "👨‍💻 Focus on optimization and best practices"
        ];
        time_estimate = "1-2 hours";
        success_criteria = [
          "Complete advanced exercises",
          "Optimize existing solutions",
          "Help others in the community"
        ];
      } else {
        difficulty_level = 'review';
        personalized_comments = [
          "📖 Standard learning pace recommended",
          "🎯 Focus on understanding core concepts",
          "💡 Practice with examples and exercises"
        ];
        success_criteria = [
          "Understand core concepts",
          "Complete basic exercises",
          "Pass lesson assessment"
        ];
      }

      // Add time-based insights
      if (perf?.time_concerns) {
        personalized_comments.push("⏰ Take extra time - no rush! Understanding is more important than speed");
        time_estimate = this.increaseTimeEstimate(time_estimate);
      }

      content_guidance[lesson] = {
        difficulty_level,
        personalized_comments,
        time_estimate,
        prerequisites,
        success_criteria
      };
    });

    return content_guidance;
  }

  private generateTimeBasedAnalysis(
    lesson_performance: { [lesson: string]: LessonPerformance },
    lesson_confidence: { [lesson: string]: { confident: boolean; category: string } }
  ) {
    const fast_lessons: string[] = [];
    const slow_lessons: string[] = [];
    const normal_lessons: string[] = [];

    Object.entries(lesson_performance).forEach(([lesson, perf]) => {
      const avg_times = [perf.easy, perf.medium, perf.hard]
        .filter(d => d.total > 0)
        .map(d => d.avg_time);
      
      if (avg_times.length > 0) {
        const overall_avg = avg_times.reduce((a, b) => a + b) / avg_times.length;
        
        if (overall_avg <= 20) {
          fast_lessons.push(lesson);
        } else if (overall_avg > 45) {
          slow_lessons.push(lesson);
        } else {
          normal_lessons.push(lesson);
        }
      }
    });

    return {
      fast_lessons,
      slow_lessons,
      normal_lessons
    };
  }

  private async generateAIInsights(assessment_results: any, course_title: string): Promise<string[]> {
    const insights: string[] = [];

    // Generate intelligent insights based on performance patterns
    if (assessment_results.accuracy >= 90) {
      insights.push("🌟 Exceptional performance! You're ready for advanced challenges");
    } else if (assessment_results.accuracy >= 75) {
      insights.push("💪 Strong foundation with room for optimization in specific areas");
    } else if (assessment_results.accuracy >= 50) {
      insights.push("📚 Good starting point - focused practice will accelerate your progress");
    } else {
      insights.push("🎯 Building from basics - every expert started here!");
    }

    // Pattern-based insights
    if (assessment_results.strengths.length > assessment_results.weaknesses.length) {
      insights.push("🚀 You have more strengths than weaknesses - leverage these to tackle challenging areas");
    }

    if (assessment_results.focus_areas.length > 0) {
      insights.push(`🎯 Focus on ${assessment_results.focus_areas.length} key areas for maximum impact`);
    }

    // Time-based insights
    if (assessment_results.avg_time > 45) {
      insights.push("⏰ Take your time to understand concepts deeply - quality over speed");
    } else if (assessment_results.avg_time < 20) {
      insights.push("⚡ You're a quick learner! Challenge yourself with advanced problems");
    }

    // Use AI for additional insights if available
    if (this.geminiModel) {
      try {
        const ai_insight = await this.generateAIPersonalizedInsight(assessment_results, course_title);
        if (ai_insight) {
          insights.push(`🤖 AI Insight: ${ai_insight}`);
        }
      } catch (error) {
        console.log('Using offline insights generation');
      }
    }

    return insights;
  }

  private calculateEstimatedTime(assessment_results: any): string {
    let base_weeks = 6; // Default course duration
    
    // Adjust based on performance
    if (assessment_results.accuracy >= 80) {
      base_weeks -= 1; // Advanced learners finish faster
    } else if (assessment_results.accuracy < 50) {
      base_weeks += 2; // More time needed for foundation
    }

    // Adjust based on focus areas
    base_weeks += Math.floor(assessment_results.focus_areas.length / 3);

    return `${Math.max(3, base_weeks)} weeks`;
  }

  private increaseTimeEstimate(current_estimate: string): string {
    const match = current_estimate.match(/(\d+)-?(\d+)?/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return `${min + 1}-${max + 2} hours`;
    }
    return current_estimate;
  }

  private async enhanceLearningPathWithAI(learning_path: any, assessment_results: any, course_title: string) {
    if (!this.geminiModel) return null;

    try {
      const prompt = `Enhance this learning path for ${course_title}:
        
        Current path: ${JSON.stringify(learning_path, null, 2)}
        Assessment results: Accuracy ${assessment_results.accuracy}%, Strengths: ${assessment_results.strengths.join(', ')}, Focus areas: ${assessment_results.focus_areas.join(', ')}
        
        Return JSON with improved phase descriptions, better topic organization, and specific recommendations.`;

      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log('AI enhancement failed, using base path');
    }
    
    return null;
  }

  private async generateAIPersonalizedInsight(assessment_results: any, course_title: string): Promise<string | null> {
    if (!this.geminiModel) return null;

    try {
      const prompt = `Generate a personalized learning insight for a student in ${course_title}:
        - Accuracy: ${assessment_results.accuracy}%
        - Strengths: ${assessment_results.strengths.join(', ')}
        - Focus areas: ${assessment_results.focus_areas.join(', ')}
        
        Provide one encouraging, specific insight about their learning pattern in 1-2 sentences.`;

      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      return null;
    }
  }
}

class ContentPersonalizationEngine {
  private roadmap: PersonalizedRoadmap | null = null;
  private user_id: string;

  constructor(user_id: string) {
    this.user_id = user_id;
  }

  setPersonalizedRoadmap(roadmap: PersonalizedRoadmap) {
    this.roadmap = roadmap;
    // Save to localStorage for persistence
    localStorage.setItem(`roadmap_${this.user_id}`, JSON.stringify(roadmap));
  }

  getPersonalizedRoadmap(): PersonalizedRoadmap | null {
    if (this.roadmap) return this.roadmap;
    
    // Try to load from localStorage
    const saved = localStorage.getItem(`roadmap_${this.user_id}`);
    if (saved) {
      this.roadmap = JSON.parse(saved);
      return this.roadmap;
    }
    
    return null;
  }

  getContentGuidanceForLesson(lesson_name: string) {
    if (!this.roadmap) return null;
    return this.roadmap.content_guidance[lesson_name] || null;
  }

  getPersonalizedCommentsForLesson(lesson_name: string): string[] {
    const guidance = this.getContentGuidanceForLesson(lesson_name);
    return guidance?.personalized_comments || [];
  }

  getDifficultyLevelForLesson(lesson_name: string): 'skip' | 'review' | 'focus' | 'challenge' | null {
    const guidance = this.getContentGuidanceForLesson(lesson_name);
    return guidance?.difficulty_level || null;
  }

  getTimeEstimateForLesson(lesson_name: string): string | null {
    const guidance = this.getContentGuidanceForLesson(lesson_name);
    return guidance?.time_estimate || null;
  }

  getSuccessCriteriaForLesson(lesson_name: string): string[] {
    const guidance = this.getContentGuidanceForLesson(lesson_name);
    return guidance?.success_criteria || [];
  }

  // Generate dynamic content labels based on assessment
  generateContentLabels(original_content: any): any {
    if (!this.roadmap) return original_content;

    const labeled_content = { ...original_content };
    
    // Add personalized metadata to content
    if (labeled_content.lessons) {
      labeled_content.lessons = labeled_content.lessons.map((lesson: any) => {
        const guidance = this.getContentGuidanceForLesson(lesson.name || lesson.title);
        if (guidance) {
          return {
            ...lesson,
            personalized_meta: {
              difficulty_indicator: this.getDifficultyIndicator(guidance.difficulty_level),
              time_estimate: guidance.time_estimate,
              personalized_comments: guidance.personalized_comments,
              success_criteria: guidance.success_criteria,
              priority: this.getPriorityLevel(guidance.difficulty_level)
            }
          };
        }
        return lesson;
      });
    }

    return labeled_content;
  }

  private getDifficultyIndicator(level: 'skip' | 'review' | 'focus' | 'challenge'): string {
    switch (level) {
      case 'skip': return '⚡ Quick Review';
      case 'review': return '📖 Standard Learning';
      case 'focus': return '🎯 Focused Practice';
      case 'challenge': return '🔥 Advanced Challenge';
      default: return '📖 Learning';
    }
  }

  private getPriorityLevel(level: 'skip' | 'review' | 'focus' | 'challenge'): number {
    switch (level) {
      case 'focus': return 1; // Highest priority
      case 'review': return 2;
      case 'challenge': return 3;
      case 'skip': return 4; // Lowest priority
      default: return 2;
    }
  }
}

// Export the enhanced system
export {
  EnhancedAdaptiveEngine,
  PersonalizedRoadmapGenerator,
  ContentPersonalizationEngine,
  type Question,
  type UserResponse,
  type PersonalizedRoadmap,
  type LessonPerformance
};
