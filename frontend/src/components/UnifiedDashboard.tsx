/**
 * Unified Dashboard Component
 * 
 * Consolidates:
 * - Learning Progress Dashboard
 * - Agentic Learning Insights
 * - System Status Monitoring
 * - Performance Analytics
 * - Real-time Activity Tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UnifiedAgenticAISystem } from '../services';

interface DashboardData {
  metrics: {
    totalSessions: number;
    averageEngagement: number;
    learningVelocity: number;
    systemHealth: number;
    pythonAnalytics?: any;
    lastUpdated: Date;
    connectionStatus: {
      python: boolean;
      backend: boolean;
      gemini: boolean;
    };
  };
  insights: Array<{
    type: 'learning_pattern' | 'performance_trend' | 'recommendation' | 'prediction' | 'alert';
    title: string;
    description: string;
    confidence: number;
    actionable: boolean;
    priority: 'high' | 'medium' | 'low';
    timestamp: Date;
    data?: any;
  }>;
  systemStatus: {
    pythonConnected: boolean;
    backendConnected: boolean;
    geminiActive: boolean;
    activeAgents: number;
    totalSessions: number;
    lastUpdated: Date;
  };
}

const UnifiedDashboard: React.FC = () => {
  const { } = useAuth();
  const [agenticSystem] = useState(() => new UnifiedAgenticAISystem());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update dashboard data
  const updateDashboard = useCallback(async () => {
    try {
      const data = agenticSystem.getDashboardData();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error('Dashboard update failed:', err);
      setError('Failed to update dashboard data');
    } finally {
      setLoading(false);
    }
  }, [agenticSystem]);

  // Initialize and start real-time updates
  useEffect(() => {
    let updateInterval: NodeJS.Timeout;

    const initialize = async () => {
      await updateDashboard();
      
      // Update every 5 seconds
      updateInterval = setInterval(updateDashboard, 5000);
    };

    initialize();

    return () => {
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [updateDashboard]);

  const getConnectionStatusColor = (isConnected: boolean) => 
    isConnected ? 'text-green-600' : 'text-red-600';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert': return '⚠️';
      case 'recommendation': return '💡';
      case 'learning_pattern': return '📈';
      case 'performance_trend': return '📊';
      case 'prediction': return '🔮';
      default: return '💬';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading unified dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Dashboard Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={updateDashboard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 Unified Learning Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive AI-powered learning analytics and insights
          </p>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.metrics.systemHealth || 0}%
                </p>
              </div>
              <div className="text-3xl">🏥</div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${dashboardData?.metrics.systemHealth || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.systemStatus.totalSessions || 0}
                </p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Active Agents: {dashboardData?.systemStatus.activeAgents || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Learning Velocity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.metrics.learningVelocity?.toFixed(1) || '0.0'}
                </p>
              </div>
              <div className="text-3xl">⚡</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">interactions/minute</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((dashboardData?.metrics.averageEngagement || 0) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">average user engagement</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔗 System Connections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Python Backend</p>
                <p className="text-sm text-gray-600">Adaptive Testing</p>
              </div>
              <div className={`text-lg ${getConnectionStatusColor(dashboardData?.systemStatus.pythonConnected || false)}`}>
                {dashboardData?.systemStatus.pythonConnected ? '✅' : '❌'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Node.js Backend</p>
                <p className="text-sm text-gray-600">API Services</p>
              </div>
              <div className={`text-lg ${getConnectionStatusColor(dashboardData?.systemStatus.backendConnected || false)}`}>
                {dashboardData?.systemStatus.backendConnected ? '✅' : '❌'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Gemini AI</p>
                <p className="text-sm text-gray-600">AI Insights</p>
              </div>
              <div className={`text-lg ${getConnectionStatusColor(dashboardData?.systemStatus.geminiActive || false)}`}>
                {dashboardData?.systemStatus.geminiActive ? '✅' : '❌'}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">🧠 AI Insights</h2>
            <div className="text-sm text-gray-500">
              Last updated: {dashboardData?.systemStatus.lastUpdated ? 
                new Date(dashboardData.systemStatus.lastUpdated).toLocaleTimeString() : 'Never'}
            </div>
          </div>
          
          {dashboardData?.insights && dashboardData.insights.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.insights.slice(0, 5).map((insight: any, index: number) => (
                <div 
                  key={index}
                  className={`p-4 border-l-4 rounded-lg ${getPriorityColor(insight.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getInsightIcon(insight.type)}</span>
                        <h3 className="font-medium text-gray-900">{insight.title}</h3>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          {(insight.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{insight.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Type: {insight.type.replace('_', ' ')}</span>
                        <span>Priority: {insight.priority}</span>
                        <span>{insight.actionable ? '📋 Actionable' : '📊 Informational'}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 ml-4">
                      {new Date(insight.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">🔍</div>
              <p className="text-gray-600">No insights available yet</p>
              <p className="text-sm text-gray-500">Start using the system to generate AI insights</p>
            </div>
          )}
        </div>

        {/* Python Backend Analytics */}
        {dashboardData?.metrics.pythonAnalytics && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🐍 Python Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(dashboardData.metrics.pythonAnalytics).map(([key, value]) => (
                <div key={key} className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 text-left">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-medium text-gray-900">Start Adaptive Test</h3>
              <p className="text-sm text-gray-600">Begin AI-powered assessment</p>
            </button>
            
            <button className="p-4 border border-green-200 rounded-lg hover:bg-green-50 text-left">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-medium text-gray-900">View Analytics</h3>
              <p className="text-sm text-gray-600">Detailed performance metrics</p>
            </button>
            
            <button className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 text-left">
              <div className="text-2xl mb-2">🧠</div>
              <h3 className="font-medium text-gray-900">AI Recommendations</h3>
              <p className="text-sm text-gray-600">Personalized learning path</p>
            </button>
            
            <button 
              onClick={updateDashboard}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">🔄</div>
              <h3 className="font-medium text-gray-900">Refresh Data</h3>
              <p className="text-sm text-gray-600">Update all metrics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
