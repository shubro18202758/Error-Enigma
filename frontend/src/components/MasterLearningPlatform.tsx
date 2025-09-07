import React, { useState, useEffect } from 'react';
import AdaptiveTestNew from './AdaptiveTestNew';
import PersonalizedContentDashboard from './PersonalizedContentDashboard';
import ComprehensiveAnalyticsDashboard from './ComprehensiveAnalyticsDashboard';
import IntegratedLearningAnalyticsEngine from '../services/IntegratedLearningAnalyticsEngine';
import { EnhancedAdaptiveEngine } from '../services/EnhancedAdaptiveSystem';

interface MasterLearningPlatformProps {
  userId?: string;
  courseId?: string;
}

const MasterLearningPlatform: React.FC<MasterLearningPlatformProps> = ({ 
  userId = 'user_001', 
  courseId = 'programming_fundamentals' 
}) => {
  const [currentView, setCurrentView] = useState<'assessment' | 'content' | 'analytics'>('assessment');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [analyticsEngine] = useState(() => new IntegratedLearningAnalyticsEngine());
  const [adaptiveEngine] = useState(() => new EnhancedAdaptiveEngine());

  useEffect(() => {
    initializePlatform();
  }, [userId]);

  const initializePlatform = () => {
    // Check if user has existing data
    const existingProfile = localStorage.getItem('userProfile');
    const existingAssessment = localStorage.getItem('lastAssessmentResults');
    
    if (existingProfile) {
      setUserProfile(JSON.parse(existingProfile));
    } else {
      // Initialize new user profile
      const defaultProfile = {
        userId,
        courseId,
        courseTitle: 'Programming Fundamentals',
        learningStyle: 'visual',
        difficulty: 'medium',
        created_at: new Date().toISOString()
      };
      setUserProfile(defaultProfile);
      localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
    }

    if (existingAssessment) {
      setHasCompletedAssessment(true);
      if (currentView === 'assessment') {
        setCurrentView('content'); // Navigate to content if assessment already done
      }
    }
  };

  const handleAssessmentComplete = (results: any) => {
    // Store assessment results
    localStorage.setItem('lastAssessmentResults', JSON.stringify(results));
    
    // Store adaptive engine data
    const engineData = {
      responses: adaptiveEngine.getPerformanceHistory(),
      lessonPerformance: adaptiveEngine.getLessonPerformance(),
      lessonConfidence: adaptiveEngine.getLessonConfidence(),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('adaptiveEngineData', JSON.stringify(engineData));
    
    setHasCompletedAssessment(true);
    setCurrentView('content');
    
    // Show completion notification
    showNotification('Assessment completed! Your personalized learning path is ready.', 'success');
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    // Simple notification - could be enhanced with toast library
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  const NavigationBar = () => (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">EdTech AI Platform</h1>
            
            <div className="flex space-x-6">
              <button
                onClick={() => setCurrentView('assessment')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'assessment'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🧠 Assessment
              </button>
              
              <button
                onClick={() => setCurrentView('content')}
                disabled={!hasCompletedAssessment}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'content'
                    ? 'bg-blue-100 text-blue-700'
                    : hasCompletedAssessment
                    ? 'text-gray-500 hover:text-gray-700'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                📚 Personalized Content
              </button>
              
              <button
                onClick={() => setCurrentView('analytics')}
                disabled={!hasCompletedAssessment}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'analytics'
                    ? 'bg-blue-100 text-blue-700'
                    : hasCompletedAssessment
                    ? 'text-gray-500 hover:text-gray-700'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                📊 Analytics
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, {userProfile?.userId || 'User'}
            </div>
            
            {/* Integration Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${hasCompletedAssessment ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-gray-500">Assessment</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${analyticsEngine.getIntegrationStatus().spaced ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-gray-500">Spaced Rep</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${analyticsEngine.getIntegrationStatus().analytics ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-gray-500">Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  const WelcomeScreen = () => (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Your AI-Powered Learning Platform
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Experience personalized education with adaptive testing, intelligent content curation, 
          and comprehensive learning analytics.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">🧠</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Adaptive Assessment</h3>
          <p className="text-gray-600">
            AI-powered testing that adapts to your knowledge level and provides immediate insights
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Content</h3>
          <p className="text-gray-600">
            Curated learning paths with AI guidance based on your assessment results
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
          <p className="text-gray-600">
            Comprehensive insights combining spaced repetition and competency metrics
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <button
          onClick={() => setCurrentView('assessment')}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Start Your Learning Journey
        </button>
      </div>
    </div>
  );

  const FeatureBadges = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap justify-center gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          🤖 Gemini AI Integration
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          ⚡ Offline Capable
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          🎯 Real-time Adaptation
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
          📈 Predictive Analytics
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800">
          🧩 Spaced Repetition
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      
      <main>
        {currentView === 'assessment' && !hasCompletedAssessment && (
          <div className="py-8">
            <FeatureBadges />
            <AdaptiveTestNew 
              isOpen={true}
              onClose={() => {}} // No close needed in embedded mode
              onComplete={handleAssessmentComplete}
              userGoals="Learn programming fundamentals through adaptive assessment"
            />
          </div>
        )}
        
        {currentView === 'assessment' && hasCompletedAssessment && (
          <div className="py-8">
            <div className="max-w-4xl mx-auto text-center p-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Completed!</h2>
              <p className="text-gray-600 mb-6">
                Your personalized learning path has been generated. You can retake the assessment 
                at any time to update your recommendations.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => setCurrentView('content')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  View Personalized Content
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('lastAssessmentResults');
                    localStorage.removeItem('adaptiveEngineData');
                    setHasCompletedAssessment(false);
                    window.location.reload();
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Retake Assessment
                </button>
              </div>
            </div>
          </div>
        )}
        
        {currentView === 'content' && hasCompletedAssessment && (
          <div className="py-8">
            <FeatureBadges />
            <PersonalizedContentDashboard />
          </div>
        )}
        
        {currentView === 'content' && !hasCompletedAssessment && (
          <div className="py-8">
            <div className="max-w-4xl mx-auto text-center p-8">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Assessment First</h2>
              <p className="text-gray-600 mb-6">
                Please complete the adaptive assessment to generate your personalized content recommendations.
              </p>
              <button
                onClick={() => setCurrentView('assessment')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Take Assessment
              </button>
            </div>
          </div>
        )}
        
        {currentView === 'analytics' && hasCompletedAssessment && (
          <div className="py-8">
            <FeatureBadges />
            <ComprehensiveAnalyticsDashboard userId={userId} />
          </div>
        )}
        
        {currentView === 'analytics' && !hasCompletedAssessment && (
          <div className="py-8">
            <div className="max-w-4xl mx-auto text-center p-8">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Analytics Data Available</h2>
              <p className="text-gray-600 mb-6">
                Analytics will become available after you complete the adaptive assessment 
                and start using the personalized learning features.
              </p>
              <button
                onClick={() => setCurrentView('assessment')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Assessment
              </button>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Adaptive Testing Engine</li>
                <li>✓ AI-Powered Content Personalization</li>
                <li>✓ Spaced Repetition Integration</li>
                <li>✓ Predictive Learning Analytics</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">AI Technologies</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Google Gemini AI Integration</li>
                <li>✓ Real-time Difficulty Adaptation</li>
                <li>✓ Cognitive Load Analysis</li>
                <li>✓ Performance Prediction Models</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Learning Benefits</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Personalized Learning Paths</li>
                <li>✓ Optimized Study Schedules</li>
                <li>✓ Knowledge Gap Identification</li>
                <li>✓ Mastery Timeline Predictions</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Powered by AI • Built with React & TypeScript • Commercial EdTech Quality
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MasterLearningPlatform;
