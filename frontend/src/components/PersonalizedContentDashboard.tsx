import React, { useState, useEffect } from 'react';
import { EnhancedAdaptiveEngine, PersonalizedRoadmapGenerator } from '../services/EnhancedAdaptiveSystem';

interface LearningObjective {
  id: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  prerequisites: string[];
  resources: ResourceItem[];
  progress: number;
  difficulty: number;
  personalizedReasoning: string;
}

interface ResourceItem {
  id: string;
  title: string;
  type: 'video' | 'article' | 'practice' | 'quiz';
  url?: string;
  duration: string;
  difficulty: number;
  personalizedNote: string;
}

interface AnalyticsData {
  competencyLevels: Record<string, number>;
  learningVelocity: number;
  retentionRate: number;
  strugglingTopics: string[];
  masteredTopics: string[];
  recommendedStudyTime: number;
  nextMilestone: string;
}

const PersonalizedContentDashboard: React.FC = () => {
  const [adaptiveEngine] = useState(() => new EnhancedAdaptiveEngine());
  const [roadmapGenerator] = useState(() => new PersonalizedRoadmapGenerator());
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<LearningObjective | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializePersonalizedContent();
  }, []);

  const initializePersonalizedContent = async () => {
    try {
      setIsLoading(true);
      
      // Get user's assessment results from localStorage
      const assessmentResults = localStorage.getItem('lastAssessmentResults');
      const userProfile = localStorage.getItem('userProfile');
      const lastEngineData = localStorage.getItem('adaptiveEngineData');
      
      if (assessmentResults && userProfile && lastEngineData) {
        const results = JSON.parse(assessmentResults);
        const profile = JSON.parse(userProfile);
        const engineData = JSON.parse(lastEngineData);
        
        // Generate personalized roadmap with correct parameters
        const roadmap = await roadmapGenerator.generatePersonalizedRoadmap(
          profile.userId || 'user_001',
          profile.courseTitle || 'Programming Fundamentals',
          engineData.responses || [],
          engineData.lessonPerformance || {},
          engineData.lessonConfidence || {}
        );
        
        // Convert roadmap to learning objectives using content_guidance
        const objectives: LearningObjective[] = Object.entries(roadmap.content_guidance).map(([lesson, guidance]: [string, any], index: number) => ({
          id: `objective_${index}`,
          topic: lesson,
          priority: guidance.difficulty_level === 'focus' ? 'high' : 
                   guidance.difficulty_level === 'challenge' ? 'medium' : 'low',
          estimatedTime: guidance.time_estimate,
          prerequisites: guidance.prerequisites,
          resources: generateResourcesForTopic(lesson, results, profile),
          progress: Math.random() * 30, // Simulated progress
          difficulty: guidance.difficulty_level === 'skip' ? 1 : 
                     guidance.difficulty_level === 'focus' ? 5 : 3,
          personalizedReasoning: guidance.personalized_comments.join(' ')
        }));
        
        setLearningObjectives(objectives);
        
        // Generate analytics data
        const analytics = generateAnalyticsData(results, profile);
        setAnalyticsData(analytics);
      }
    } catch (error) {
      console.error('Failed to initialize personalized content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateResourcesForTopic = (topic: string, results: any, profile: any): ResourceItem[] => {
    const baseResources = [
      { type: 'video', title: `${topic} Video Tutorial`, duration: '15 min' },
      { type: 'article', title: `${topic} Study Guide`, duration: '10 min' },
      { type: 'practice', title: `${topic} Practice Exercises`, duration: '20 min' },
      { type: 'quiz', title: `${topic} Knowledge Check`, duration: '5 min' }
    ];

    return baseResources.map((resource, index) => ({
      id: `resource_${topic}_${index}`,
      title: resource.title,
      type: resource.type as 'video' | 'article' | 'practice' | 'quiz',
      duration: resource.duration,
      difficulty: Math.floor(Math.random() * 5) + 1,
      personalizedNote: generatePersonalizedNote(resource.type, results, profile)
    }));
  };

  const generatePersonalizedNote = (resourceType: string, results: any, profile: any): string => {
    const notes = {
      video: "Based on your visual learning preference, this video will help reinforce key concepts.",
      article: "This reading material aligns with your analytical approach to learning.",
      practice: "These exercises target areas where you showed room for improvement.",
      quiz: "This assessment will help validate your understanding before moving forward."
    };
    return notes[resourceType as keyof typeof notes] || "Recommended for your learning path.";
  };

  const generateAnalyticsData = (results: any, profile: any): AnalyticsData => {
    return {
      competencyLevels: {
        'Mathematics': 75,
        'Science': 68,
        'Programming': 82,
        'Literature': 58
      },
      learningVelocity: 1.2,
      retentionRate: 78,
      strugglingTopics: ['Advanced Calculus', 'Quantum Physics'],
      masteredTopics: ['Basic Programming', 'Algebra'],
      recommendedStudyTime: 45,
      nextMilestone: 'Complete Intermediate Programming Module'
    };
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getResourceIcon = (type: string): string => {
    switch (type) {
      case 'video': return '🎥';
      case 'article': return '📄';
      case 'practice': return '✏️';
      case 'quiz': return '📝';
      default: return '📚';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Personalizing your learning experience...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Personalized Learning Dashboard</h1>
        <p className="text-gray-600">AI-curated content based on your assessment results and learning preferences</p>
      </div>

      {/* Analytics Overview */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Learning Velocity</h3>
            <div className="flex items-center mt-2">
              <span className="text-2xl font-bold text-blue-600">{analyticsData.learningVelocity}x</span>
              <span className="ml-2 text-sm text-green-600">↗ Above Average</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Retention Rate</h3>
            <div className="flex items-center mt-2">
              <span className="text-2xl font-bold text-green-600">{analyticsData.retentionRate}%</span>
              <span className="ml-2 text-sm text-gray-500">Last 30 days</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Daily Study Goal</h3>
            <div className="flex items-center mt-2">
              <span className="text-2xl font-bold text-purple-600">{analyticsData.recommendedStudyTime} min</span>
              <span className="ml-2 text-sm text-gray-500">Recommended</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Next Milestone</h3>
            <div className="mt-2">
              <span className="text-sm font-medium text-gray-900">{analyticsData.nextMilestone}</span>
            </div>
          </div>
        </div>
      )}

      {/* Competency Levels */}
      {analyticsData && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Competency Levels</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(analyticsData.competencyLevels).map(([topic, level]) => (
                <div key={topic} className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{topic}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${level}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-12">{level}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Learning Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Your Learning Path</h2>
          
          {learningObjectives.map((objective) => (
            <div 
              key={objective.id}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedObjective?.id === objective.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedObjective(objective)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{objective.topic}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(objective.priority)}`}>
                  {objective.priority.toUpperCase()}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{objective.personalizedReasoning}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>Estimated Time: {objective.estimatedTime}</span>
                <span>Difficulty: {"⭐".repeat(objective.difficulty)}</span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(objective.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${objective.progress}%` }}
                  ></div>
                </div>
              </div>
              
              {objective.prerequisites.length > 0 && (
                <div className="text-xs text-gray-500">
                  Prerequisites: {objective.prerequisites.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detailed View */}
        <div className="space-y-6">
          {selectedObjective ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-900">
                {selectedObjective.topic} - Resources
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-blue-600 font-medium">💡 AI Guidance</span>
                </div>
                <p className="text-blue-800 text-sm">{selectedObjective.personalizedReasoning}</p>
              </div>

              <div className="space-y-4">
                {selectedObjective.resources.map((resource) => (
                  <div key={resource.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getResourceIcon(resource.type)}</span>
                        <h4 className="font-medium text-gray-900">{resource.title}</h4>
                      </div>
                      <span className="text-sm text-gray-500">{resource.duration}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{resource.personalizedNote}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Difficulty:</span>
                        <span className="text-xs">{"⭐".repeat(resource.difficulty)}</span>
                      </div>
                      <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
                        Start Learning
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Learning Objective</h3>
              <p className="text-gray-500">Click on any learning objective to see personalized resources and guidance.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <span className="text-2xl">🧠</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">Retake Assessment</div>
                <div className="text-sm text-gray-500">Update your personalized path</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <span className="text-2xl">📊</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">View Analytics</div>
                <div className="text-sm text-gray-500">Deep dive into your progress</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <span className="text-2xl">🎯</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">Set Goals</div>
                <div className="text-sm text-gray-500">Customize your learning targets</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedContentDashboard;
