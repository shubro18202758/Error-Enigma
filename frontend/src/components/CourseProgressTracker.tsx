import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProgressEntry {
  id: string;
  timestamp: string;
  courseTitle: string;
  assessmentResults?: any;
  status: 'assessment_completed' | 'course_started' | 'lesson_completed' | 'course_completed' | 'final_test_completed';
  nextRecommendedAction: string;
  completionPercentage?: number;
  timeSpent?: number;
  skillsAcquired?: string[];
  weaknessesIdentified?: string[];
}

interface CourseProgressTrackerProps {
  onActionClick?: (action: string, data: any) => void;
}

const CourseProgressTracker: React.FC<CourseProgressTrackerProps> = ({ onActionClick }) => {
  const { currentUser } = useAuth();
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ProgressEntry | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadProgressData();
    const interval = setInterval(loadProgressData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadProgressData = () => {
    try {
      const stored = localStorage.getItem('courseProgress');
      if (stored) {
        const data = JSON.parse(stored);
        setProgressData(data.reverse()); // Most recent first
        generateAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const generateAnalytics = (data: ProgressEntry[]) => {
    const analytics = {
      totalCourses: new Set(data.map(d => d.courseTitle)).size,
      assessmentsCompleted: data.filter(d => d.status === 'assessment_completed').length,
      coursesInProgress: data.filter(d => d.status === 'course_started').length,
      coursesCompleted: data.filter(d => d.status === 'course_completed').length,
      finalTestsCompleted: data.filter(d => d.status === 'final_test_completed').length,
      averageCompletionRate: 0,
      recentActivity: data.slice(0, 5),
      skillsOverview: {
        mastered: [] as string[],
        learning: [] as string[],
        needsFocus: [] as string[]
      }
    };

    // Calculate average completion rate
    const completionRates = data.filter(d => d.completionPercentage).map(d => d.completionPercentage || 0);
    if (completionRates.length > 0) {
      analytics.averageCompletionRate = Math.round(
        completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
      );
    }

    // Aggregate skills data from assessments
    data.forEach(entry => {
      if (entry.assessmentResults?.learningPath) {
        const { masteredTopics, suggestedTopics, compulsoryTopics } = entry.assessmentResults.learningPath;
        
        masteredTopics?.forEach((topic: any) => {
          if (!analytics.skillsOverview.mastered.includes(topic.lesson)) {
            analytics.skillsOverview.mastered.push(topic.lesson);
          }
        });
        
        suggestedTopics?.forEach((topic: any) => {
          if (!analytics.skillsOverview.learning.includes(topic.lesson)) {
            analytics.skillsOverview.learning.push(topic.lesson);
          }
        });
        
        compulsoryTopics?.forEach((topic: any) => {
          if (!analytics.skillsOverview.needsFocus.includes(topic.lesson)) {
            analytics.skillsOverview.needsFocus.push(topic.lesson);
          }
        });
      }
    });

    setAnalytics(analytics);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assessment_completed': return 'bg-blue-500';
      case 'course_started': return 'bg-yellow-500';
      case 'lesson_completed': return 'bg-green-500';
      case 'course_completed': return 'bg-purple-500';
      case 'final_test_completed': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assessment_completed': return '📝';
      case 'course_started': return '▶️';
      case 'lesson_completed': return '✅';
      case 'course_completed': return '🎓';
      case 'final_test_completed': return '🏆';
      default: return '📋';
    }
  };

  const handleTakeFinalTest = (courseEntry: ProgressEntry) => {
    console.log('🎯 Initiating final course test for:', courseEntry.courseTitle);
    
    // Store final test context
    localStorage.setItem('finalTestContext', JSON.stringify({
      courseTitle: courseEntry.courseTitle,
      assessmentData: courseEntry.assessmentResults,
      type: 'final_comprehensive_test'
    }));
    
    if (onActionClick) {
      onActionClick('take_final_test', courseEntry);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Learning Analytics Dashboard</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalCourses}</div>
              <div className="text-sm text-gray-600">Courses Explored</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.assessmentsCompleted}</div>
              <div className="text-sm text-gray-600">Assessments Taken</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{analytics.coursesCompleted}</div>
              <div className="text-sm text-gray-600">Courses Completed</div>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{analytics.averageCompletionRate}%</div>
              <div className="text-sm text-gray-600">Avg Completion</div>
            </div>
          </div>

          {/* Skills Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">🟢 Mastered Skills ({analytics.skillsOverview.mastered.length})</h3>
              <div className="text-sm text-green-700">
                {analytics.skillsOverview.mastered.slice(0, 3).join(', ')}
                {analytics.skillsOverview.mastered.length > 3 && ` +${analytics.skillsOverview.mastered.length - 3} more`}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">🟡 Currently Learning ({analytics.skillsOverview.learning.length})</h3>
              <div className="text-sm text-yellow-700">
                {analytics.skillsOverview.learning.slice(0, 3).join(', ')}
                {analytics.skillsOverview.learning.length > 3 && ` +${analytics.skillsOverview.learning.length - 3} more`}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">🔴 Needs Focus ({analytics.skillsOverview.needsFocus.length})</h3>
              <div className="text-sm text-red-700">
                {analytics.skillsOverview.needsFocus.slice(0, 3).join(', ')}
                {analytics.skillsOverview.needsFocus.length > 3 && ` +${analytics.skillsOverview.needsFocus.length - 3} more`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Learning Progress Timeline</h2>
        
        {progressData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">🎯 No learning activity yet</p>
            <p className="text-sm">Take an assessment to start tracking your progress!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {progressData.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedCourse(selectedCourse?.id === entry.id ? null : entry)}
              >
                <div className={`w-3 h-3 rounded-full ${getStatusColor(entry.status)} mr-4 flex-shrink-0`}></div>
                
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getStatusIcon(entry.status)} {entry.courseTitle}
                      </h3>
                      <p className="text-sm text-gray-600">{entry.nextRecommendedAction.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{formatTimestamp(entry.timestamp)}</div>
                      {entry.completionPercentage && (
                        <div className="text-sm font-medium text-blue-600">{entry.completionPercentage}% complete</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {selectedCourse?.id === entry.id && entry.assessmentResults && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-3">Assessment Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-red-600">Priority Topics:</span>
                          <ul className="mt-1 text-gray-700">
                            {entry.assessmentResults.learningPath?.compulsoryTopics?.map((topic: any, idx: number) => (
                              <li key={idx}>• {topic.lesson}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-600">Review Topics:</span>
                          <ul className="mt-1 text-gray-700">
                            {entry.assessmentResults.learningPath?.suggestedTopics?.map((topic: any, idx: number) => (
                              <li key={idx}>• {topic.lesson}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium text-green-600">Mastered Topics:</span>
                          <ul className="mt-1 text-gray-700">
                            {entry.assessmentResults.learningPath?.masteredTopics?.map((topic: any, idx: number) => (
                              <li key={idx}>• {topic.lesson}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <button 
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onActionClick) onActionClick('continue_learning', entry);
                          }}
                        >
                          📚 Continue Learning
                        </button>
                        <button 
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTakeFinalTest(entry);
                          }}
                        >
                          🎯 Take Final Test
                        </button>
                        <button 
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onActionClick) onActionClick('view_analytics', entry);
                          }}
                        >
                          📊 View Analytics
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseProgressTracker;
