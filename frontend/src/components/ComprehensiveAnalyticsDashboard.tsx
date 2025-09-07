import React, { useState, useEffect } from 'react';
import IntegratedLearningAnalyticsEngine from '../services/IntegratedLearningAnalyticsEngine';

interface AnalyticsDashboardProps {
  userId: string;
}

const ComprehensiveAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId }) => {
  const [analyticsEngine] = useState(() => new IntegratedLearningAnalyticsEngine());
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsEngine.generateComprehensiveAnalytics(userId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Analyzing your learning patterns...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No analytics data available. Complete an assessment to get started!</p>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-blue-500 text-2xl mr-3">🧠</div>
            <div>
              <p className="text-sm font-medium text-gray-500">Learning Velocity</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.competency_metrics.learning_velocity?.toFixed(1) || '1.0'}x
              </p>
              <p className="text-xs text-green-600">Above average</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-green-500 text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-gray-500">Retention Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.competency_metrics.retention_rate?.toFixed(0) || '0'}%
              </p>
              <p className="text-xs text-gray-500">Last 30 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-orange-500 text-2xl mr-3">⚡</div>
            <div>
              <p className="text-sm font-medium text-gray-500">Cards Due Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.spaced_repetition_data.cards_due_today}
              </p>
              <p className="text-xs text-gray-500">
                ~{analytics.spaced_repetition_data.estimated_study_time} min
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-purple-500 text-2xl mr-3">🎯</div>
            <div>
              <p className="text-sm font-medium text-gray-500">Study Streak</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.spaced_repetition_data.study_streak} days
              </p>
              <p className="text-xs text-green-600">Keep it up!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cognitive Load Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            🧩 Cognitive Load Analysis
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Current Load:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              analytics.competency_metrics.cognitive_load_analysis.current_load === 'high' 
                ? 'bg-red-100 text-red-800' 
                : analytics.competency_metrics.cognitive_load_analysis.current_load === 'medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {analytics.competency_metrics.cognitive_load_analysis.current_load.toUpperCase()}
            </span>
          </div>
          
          {analytics.competency_metrics.cognitive_load_analysis.break_needed && (
            <div className="bg-orange-50 border border-orange-200 rounded p-4 mb-4">
              <div className="flex items-center">
                <span className="text-orange-600 text-lg mr-2">⚠️</span>
                <span className="text-orange-800 font-medium">Break Recommended</span>
              </div>
              <p className="text-orange-700 text-sm mt-1">
                Your cognitive load is high. Consider taking a break before continuing.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            {analytics.competency_metrics.cognitive_load_analysis.recommendations.map((rec: string, index: number) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <span className="text-blue-500 mr-2">💡</span>
                {rec}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            🎯 Priority Actions
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {analytics.personalized_recommendations.priority_actions.map((action: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-600 font-bold text-lg">{index + 1}</span>
                <span className="text-blue-800">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompetencyTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Subject Competency Levels</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {Object.entries(analytics.competency_metrics.subject_competencies).map(([subject, data]: [string, any]) => (
              <div key={subject} className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">{subject}</h4>
                  <span className="text-sm text-gray-500">
                    Level {data.level?.toFixed(0) || '0'}/100
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      data.level >= 80 ? 'bg-green-500' :
                      data.level >= 60 ? 'bg-yellow-500' :
                      data.level >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(5, data.level)}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Confidence:</span>
                    <span className="ml-1 text-gray-700">{data.confidence?.toFixed(0) || '0'}%</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Progress Rate:</span>
                    <span className={`ml-1 ${data.progression_rate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.progression_rate > 0 ? '+' : ''}{data.progression_rate?.toFixed(1) || '0'}%/week
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Last Assessed:</span>
                    <span className="ml-1 text-gray-700">
                      {new Date(data.last_assessed).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {data.knowledge_gaps?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-red-600">Knowledge Gaps:</span>
                    <div className="flex flex-wrap mt-1">
                      {data.knowledge_gaps.map((gap: string, gapIndex: number) => (
                        <span key={gapIndex} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.mastery_indicators?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-green-600">Mastery Areas:</span>
                    <div className="flex flex-wrap mt-1">
                      {data.mastery_indicators.map((mastery: string, masteryIndex: number) => (
                        <span key={masteryIndex} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                          {mastery}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPredictionsTab = () => (
    <div className="space-y-6">
      {/* Mastery Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            🎯 Mastery Timeline Predictions
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analytics.performance_predictions.mastery_timeline).map(([topic, timeline]) => (
              <div key={topic} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{topic}</span>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  String(timeline) === 'Already mastered' ? 'bg-green-100 text-green-800' :
                  String(timeline).includes('days') && parseInt(String(timeline)) < 30 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {String(timeline)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Probability */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            📊 Success Probability Analysis
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Object.entries(analytics.performance_predictions.success_probability).map(([topic, probability]) => (
              <div key={topic} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{topic}</span>
                  <span className="text-sm font-medium text-gray-600">{Number(probability).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      Number(probability) >= 80 ? 'bg-green-500' :
                      Number(probability) >= 60 ? 'bg-yellow-500' :
                      Number(probability) >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(5, Number(probability))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topics at Risk */}
      {analytics.performance_predictions.topics_at_risk.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              ⚠️ Topics at Risk
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analytics.performance_predictions.topics_at_risk.map((topic: string, index: number) => (
                <div key={index} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-600 text-lg mr-2">🚨</span>
                  <span className="text-red-800">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderScheduleTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              📅 Today
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {analytics.personalized_recommendations.study_schedule.today.map((item: string, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              🗓️ This Week
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {analytics.personalized_recommendations.study_schedule.this_week.map((item: string, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              📆 This Month
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {analytics.personalized_recommendations.study_schedule.this_month.map((item: string, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">◆</span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Optimal Study Times */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            ⏰ Optimal Study Times
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">Based on your learning patterns and performance data:</p>
          <div className="flex flex-wrap gap-2">
            {analytics.competency_metrics.optimal_study_times.map((time: string, index: number) => (
              <span key={index} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {time}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'competency', label: 'Competency', icon: '🎯' },
    { id: 'predictions', label: 'Predictions', icon: '🔮' },
    { id: 'schedule', label: 'Schedule', icon: '📅' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Learning Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          AI-powered insights combining adaptive testing, spaced repetition, and competency analytics
        </p>
      </div>

      {/* Integration Status */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Integration Status:</span>
            <div className="flex space-x-4">
              {Object.entries(analyticsEngine.getIntegrationStatus()).map(([system, status]) => (
                <div key={system} className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600 capitalize">{system}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'competency' && renderCompetencyTab()}
        {activeTab === 'predictions' && renderPredictionsTab()}
        {activeTab === 'schedule' && renderScheduleTab()}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center space-x-4">
        <button 
          onClick={loadAnalytics}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Refresh Analytics</span>
        </button>
        
        <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
          <span>📊</span>
          <span>Export Report</span>
        </button>
      </div>
    </div>
  );
};

export default ComprehensiveAnalyticsDashboard;
