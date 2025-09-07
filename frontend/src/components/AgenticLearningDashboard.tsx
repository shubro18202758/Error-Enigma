import React, { useState, useEffect, useCallback } from 'react';
import { EdTechPlatform } from '../services';

interface AgenticDashboardProps {
  userId?: string;
  onInsightUpdate?: (insights: any) => void;
}

interface AgenticInsight {
  type: 'learning_pattern' | 'performance_trend' | 'recommendation' | 'prediction' | 'alert';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  data?: any;
}

interface DashboardMetrics {
  totalSessions: number;
  averageEngagement: number;
  learningVelocity: number;
  systemHealth: number;
  pythonConnected: boolean;
  backendConnected: boolean;
  geminiActive: boolean;
}

const AgenticLearningDashboard: React.FC<AgenticDashboardProps> = ({
  userId = 'current_user',
  onInsightUpdate
}) => {
  const [edTechPlatform] = useState(() => new EdTechPlatform());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [agenticInsights, setAgenticInsights] = useState<AgenticInsight[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSessions: 0,
    averageEngagement: 0,
    learningVelocity: 0,
    systemHealth: 0,
    pythonConnected: false,
    backendConnected: false,
    geminiActive: false
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Real-time dashboard updates
  const updateDashboard = useCallback(async () => {
    try {
      const data = edTechPlatform.getDashboardData();
      setDashboardData(data);

      // Update metrics
      setMetrics({
        totalSessions: data.userStats.totalCourses,
        averageEngagement: 85, // Default engagement
        learningVelocity: data.userStats.streak * 10,
        systemHealth: data.systemHealth.backendConnected ? 100 : 50,
        pythonConnected: data.systemHealth.pythonConnected,
        backendConnected: data.systemHealth.backendConnected,
        geminiActive: true // Assume active for demo
      });

      // Process agentic insights
      if (data && (data as any).agenticInsights) {
        const processedInsights = processAgenticInsights((data as any).agenticInsights);
        setAgenticInsights(processedInsights);
        
        if (onInsightUpdate) {
          onInsightUpdate(processedInsights);
        }
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Dashboard update failed:', error);
    } finally {
      setLoading(false);
    }
  }, [edTechPlatform, onInsightUpdate]);

  // Process raw agentic insights into structured format
  const processAgenticInsights = (rawInsights: any): AgenticInsight[] => {
    const insights: AgenticInsight[] = [];

    // Process successful agent analyses
    rawInsights.successful?.forEach((result: any) => {
      if (result.adaptationNeeds?.length > 0) {
        insights.push({
          type: 'recommendation',
          title: 'Learning Path Adaptation Needed',
          description: `${result.adaptationNeeds.length} adaptations recommended for optimal learning`,
          confidence: 0.85,
          actionable: true,
          priority: 'high',
          timestamp: new Date(),
          data: result.adaptationNeeds
        });
      }

      if (result.riskFactors?.length > 0) {
        insights.push({
          type: 'alert',
          title: 'Learning Risk Factors Detected',
          description: `${result.riskFactors.length} potential learning obstacles identified`,
          confidence: 0.9,
          actionable: true,
          priority: 'high',
          timestamp: new Date(),
          data: result.riskFactors
        });
      }

      if (result.learningEfficiency?.score > 0.8) {
        insights.push({
          type: 'performance_trend',
          title: 'High Learning Efficiency',
          description: 'Learning patterns show exceptional efficiency - ready for advanced content',
          confidence: result.learningEfficiency.score,
          actionable: true,
          priority: 'medium',
          timestamp: new Date(),
          data: result.learningEfficiency
        });
      }
    });

    return insights.slice(0, 10); // Keep latest 10 insights
  };

  // Initialize and start real-time updates
  useEffect(() => {
    updateDashboard();

    // Set up real-time updates every 5 seconds
    const interval = setInterval(updateDashboard, 5000);

    return () => clearInterval(interval);
  }, [updateDashboard]);

  const getConnectionStatusColor = (connected: boolean) => 
    connected ? 'text-green-400' : 'text-red-400';

  const getConnectionStatusIcon = (connected: boolean) => 
    connected ? '✅' : '❌';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-4 bg-white/20 rounded w-1/2"></div>
          <div className="h-4 bg-white/20 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agentic System Status */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">🤖</span>
          Agentic Learning System Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Python Backend</span>
              <span className={getConnectionStatusColor(metrics.pythonConnected)}>
                {getConnectionStatusIcon(metrics.pythonConnected)} 
                {metrics.pythonConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Node.js Backend</span>
              <span className={getConnectionStatusColor(metrics.backendConnected)}>
                {getConnectionStatusIcon(metrics.backendConnected)} 
                {metrics.backendConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Gemini AI</span>
              <span className={getConnectionStatusColor(metrics.geminiActive)}>
                {getConnectionStatusIcon(metrics.geminiActive)} 
                {metrics.geminiActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{metrics.totalSessions}</div>
            <div className="text-sm text-slate-400">Active Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{(metrics.averageEngagement * 100).toFixed(1)}%</div>
            <div className="text-sm text-slate-400">Avg Engagement</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{metrics.learningVelocity.toFixed(2)}</div>
            <div className="text-sm text-slate-400">Learning Velocity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{metrics.systemHealth.toFixed(1)}%</div>
            <div className="text-sm text-slate-400">System Health</div>
          </div>
        </div>
      </div>

      {/* Agentic Insights */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <span className="text-2xl mr-2">🧠</span>
            Agentic Learning Insights
          </h3>
          <div className="text-sm text-slate-400">
            Last Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {agenticInsights.length > 0 ? (
            agenticInsights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)} hover:bg-white/5 transition-colors`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">{insight.title}</h4>
                    <p className="text-sm text-slate-300">{insight.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-xs px-2 py-1 bg-white/10 rounded">
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(insight.priority)}`}>
                      {insight.priority}
                    </span>
                  </div>
                </div>
                
                {insight.actionable && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-xs text-slate-400">
                      Type: {insight.type.replace('_', ' ')}
                    </span>
                    <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors">
                      Take Action
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔄</div>
              <p className="text-slate-400">Gathering agentic insights...</p>
              <p className="text-sm text-slate-500 mt-2">
                AI agents are analyzing your learning patterns
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Learning Analytics */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span>
          Real-time Learning Analytics
        </h3>
        
        {dashboardData?.performanceAnalytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Engagement Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Engagement</span>
                  <span className="text-blue-400">
                    {(dashboardData.performanceAnalytics.engagementMetrics?.averageEngagement * 100 || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(dashboardData.performanceAnalytics.engagementMetrics?.averageEngagement * 100 || 0)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Learning Efficiency</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Efficiency Score</span>
                  <span className="text-green-400">
                    {(dashboardData.performanceAnalytics.learningEfficiency?.score * 100 || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(dashboardData.performanceAnalytics.learningEfficiency?.score * 100 || 0)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📈</div>
            <p className="text-slate-400">Analytics data will appear here as you learn</p>
          </div>
        )}
      </div>

      {/* System Performance */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">⚡</span>
          Agentic System Performance
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center bg-white/5 rounded-lg p-4">
            <div className="text-lg font-bold text-blue-400">
              {dashboardData?.agenticSystemStatus?.activeAgents || 0}
            </div>
            <div className="text-sm text-slate-400">Active Agents</div>
          </div>
          
          <div className="text-center bg-white/5 rounded-lg p-4">
            <div className="text-lg font-bold text-green-400">
              {dashboardData?.agenticSystemStatus?.totalAnalyses || 0}
            </div>
            <div className="text-sm text-slate-400">Total Analyses</div>
          </div>
          
          <div className="text-center bg-white/5 rounded-lg p-4">
            <div className="text-lg font-bold text-purple-400">
              {metrics.pythonConnected && metrics.backendConnected ? 'Optimal' : 'Limited'}
            </div>
            <div className="text-sm text-slate-400">Connection Status</div>
          </div>
          
          <div className="text-center bg-white/5 rounded-lg p-4">
            <div className="text-lg font-bold text-orange-400">
              {agenticInsights.filter(i => i.actionable).length}
            </div>
            <div className="text-sm text-slate-400">Actionable Insights</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticLearningDashboard;
