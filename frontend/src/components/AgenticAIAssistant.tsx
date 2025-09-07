import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  metadata?: {
    suggestions?: string[];
    actions?: Array<{
      type: 'start_course' | 'take_test' | 'view_roadmap' | 'explore_content';
      label: string;
      data: any;
    }>;
    roadmap?: any;
    courses?: any[];
  };
}

interface AgenticAIAssistantProps {
  variant?: 'main' | 'header' | 'sidebar' | 'fullscreen';
  onCourseSelect?: (course: any) => void;
  onStartTest?: () => void;
  onViewRoadmap?: (roadmap: any) => void;
}

const AgenticAIAssistant: React.FC<AgenticAIAssistantProps> = ({ 
  variant = 'main', 
  onCourseSelect, 
  onStartTest,
  onViewRoadmap 
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(variant === 'fullscreen');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Listen for assessment completion events
  useEffect(() => {
    const handleAssessmentCompleted = (event: CustomEvent) => {
      console.log('🤖 AI Assistant received assessment results:', event.detail);
      processAssessmentResults(event.detail);
    };

    const handleStoredAIMessage = () => {
      const storedMessage = localStorage.getItem('aiAssistantMessage');
      if (storedMessage) {
        try {
          const parsed = JSON.parse(storedMessage);
          if (parsed.autoTrigger && parsed.type === 'assessment_results') {
            console.log('🤖 Processing stored assessment message');
            setInputValue(parsed.message);
            setTimeout(() => handleSendMessage(parsed.message), 1000);
            localStorage.removeItem('aiAssistantMessage');
          }
        } catch (error) {
          console.error('Error processing stored AI message:', error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('assessmentCompleted', handleAssessmentCompleted as EventListener);
    
    // Check for stored messages on mount
    handleStoredAIMessage();
    
    // Check periodically for stored messages
    const interval = setInterval(handleStoredAIMessage, 2000);

    return () => {
      window.removeEventListener('assessmentCompleted', handleAssessmentCompleted as EventListener);
      clearInterval(interval);
    };
  }, []);

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const token = currentUser ? await currentUser.getIdToken() : null;
    
    const response = await fetch(`${baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message on component mount
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: `🌟 Welcome to your intelligent learning companion! I'm here to help you:

• **Get Personalized Learning Paths** - Tell me your goals and I'll create a custom roadmap
• **Take Adaptive Tests** - Assess your skills and get tailored recommendations  
• **Explore Courses & Content** - Find the perfect learning materials for you
• **Track Your Progress** - Get insights and motivation to keep learning
• **Answer Any Questions** - About courses, concepts, or your learning journey

What would you like to explore today? Try asking:
- "Show me learning paths for web development"
- "I want to take a skills assessment test" 
- "What courses do you recommend for beginners?"
- "Help me create a study plan"`,
        timestamp: new Date(),
        metadata: {
          suggestions: [
            "Show me learning paths",
            "Take a skills assessment", 
            "Explore available courses",
            "Create a study plan"
          ]
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Process assessment results and generate personalized roadmap
  const processAssessmentResults = async (assessmentData: any) => {
    try {
      console.log('🎯 Processing assessment results for roadmap generation...', assessmentData);
      
      const aiMessage: Message = {
        id: `ai-assessment-${Date.now()}`,
        type: 'ai',
        content: '🤖 **Assessment Complete!** I\'ve analyzed your results and I\'m generating a personalized learning roadmap...',
        timestamp: new Date(),
        isLoading: true
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Generate comprehensive roadmap based on assessment
      const roadmapPrompt = `Based on assessment results, generate a comprehensive learning roadmap:
      
Assessment Data: ${JSON.stringify(assessmentData.learningPath)}
Module: ${assessmentData.moduleInfo.moduleTitle}
Completion: ${assessmentData.learningPath.completionPercentage}%

Priority Areas (${assessmentData.learningPath.compulsoryTopics.length}):
${assessmentData.learningPath.compulsoryTopics.map((t: any) => `- ${t.lesson}`).join('\n')}

Generate detailed:
1. Learning sequence with timeline
2. Study materials for each topic  
3. Practice exercises and projects
4. Progress milestones and checkpoints
5. Estimated completion timeline`;

      // Call AI service to generate roadmap
      const roadmapResponse = await apiRequest('/api/ai/generate-roadmap', {
        method: 'POST',
        body: JSON.stringify({
          prompt: roadmapPrompt,
          assessmentData,
          userId: currentUser?.uid || 'anonymous'
        })
      });

      const roadmap = await roadmapResponse.json();
      
      // Update message with generated roadmap
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id ? {
          ...msg,
          content: `🎯 **Your Personalized Learning Roadmap**

${roadmap.content || 'Roadmap generated successfully! Here\'s your customized learning path...'}`,
          isLoading: false,
          metadata: {
            roadmap: assessmentData,
            actions: [
              {
                type: 'start_course',
                label: '🚀 Start Priority Learning',
                data: { topics: assessmentData.learningPath.compulsoryTopics }
              },
              {
                type: 'view_roadmap',
                label: '📋 View Full Roadmap',
                data: assessmentData
              },
              {
                type: 'take_test',
                label: '📝 Take Another Assessment',
                data: {}
              }
            ]
          }
        } : msg
      ));
      
      // Store roadmap in course progress tracking
      storeProgressData(assessmentData);
      
    } catch (error) {
      console.error('Error processing assessment results:', error);
      
      // Fallback roadmap generation
      setMessages(prev => prev.map(msg => 
        msg.id.includes('assessment') ? {
          ...msg,
          content: `✅ **Assessment Analysis Complete**

📊 **Your Results Summary:**
- **Strong Areas (${assessmentData.learningPath.masteredTopics.length}):** ${assessmentData.learningPath.masteredTopics.map((t: any) => t.lesson).join(', ')}
- **Review Needed (${assessmentData.learningPath.suggestedTopics.length}):** ${assessmentData.learningPath.suggestedTopics.map((t: any) => t.lesson).join(', ')}
- **Priority Focus (${assessmentData.learningPath.compulsoryTopics.length}):** ${assessmentData.learningPath.compulsoryTopics.map((t: any) => t.lesson).join(', ')}

🎯 **Recommended Action:** Start with priority topics for maximum learning impact!`,
          isLoading: false
        } : msg
      ));
    }
  };

  // Store progress data in dashboard tracking
  const storeProgressData = (assessmentData: any) => {
    try {
      const existingProgress = JSON.parse(localStorage.getItem('courseProgress') || '[]');
      const progressEntry = {
        id: `assessment_${Date.now()}`,
        timestamp: new Date().toISOString(),
        courseTitle: assessmentData.moduleInfo.moduleTitle,
        assessmentResults: assessmentData,
        status: 'assessment_completed',
        nextRecommendedAction: 'start_priority_learning'
      };
      
      existingProgress.push(progressEntry);
      localStorage.setItem('courseProgress', JSON.stringify(existingProgress));
      
      console.log('📈 Progress data stored for dashboard tracking');
    } catch (error) {
      console.error('Error storing progress data:', error);
    }
  };

  const handleSendMessage = async (message?: string) => {
    const messageText = message || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: `ai-loading-${Date.now()}`,
      type: 'ai',
      content: 'Analyzing your request with advanced AI...',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Get screen context for better AI responses
      const screenContext = getScreenContext();
      
      // Determine if this is a request for specific actions
      const intentAnalysis = analyzeUserIntent(messageText);
      
      let aiResponse: any;
      
      if (intentAnalysis.intent === 'learning_path' || intentAnalysis.intent === 'roadmap') {
        // Generate learning roadmap
        aiResponse = await apiRequest('/api/ai/roadmap', {
          method: 'POST',
          body: JSON.stringify({ 
            query: messageText,
            context: screenContext,
            userGoals: intentAnalysis.extractedGoals
          })
        });
      } else if (intentAnalysis.intent === 'adaptive_test' || intentAnalysis.intent === 'assessment') {
        // Generate adaptive test
        aiResponse = await apiRequest('/api/ai/adaptive-test', {
          method: 'POST',
          body: JSON.stringify({ 
            goals: intentAnalysis.extractedGoals || messageText,
            skillLevel: intentAnalysis.skillLevel || 'beginner'
          })
        });
      } else if (intentAnalysis.intent === 'course_recommendation') {
        // Get course recommendations
        aiResponse = await apiRequest('/api/ai/recommendations', {
          method: 'POST',
          body: JSON.stringify({ 
            query: messageText,
            context: screenContext
          })
        });
      } else {
        // General AI chat with content library access
        aiResponse = await apiRequest('/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({ 
            message: messageText,
            context: screenContext,
            conversationHistory: messages.slice(-10) // Last 10 messages for context
          })
        });
      }

      // Remove loading message and add AI response
      setMessages(prev => {
        const withoutLoading = prev.filter(m => m.id !== loadingMessage.id);
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: aiResponse.response || aiResponse.message || 'I apologize, but I encountered an issue processing your request.',
          timestamp: new Date(),
          metadata: {
            suggestions: aiResponse.suggestions || [],
            actions: aiResponse.actions || [],
            roadmap: aiResponse.roadmap,
            courses: aiResponse.courses
          }
        };
        return [...withoutLoading, aiMessage];
      });

    } catch (error) {
      console.error('AI request failed:', error);
      setMessages(prev => {
        const withoutLoading = prev.filter(m => m.id !== loadingMessage.id);
        const errorMessage: Message = {
          id: `ai-error-${Date.now()}`,
          type: 'ai',
          content: '⚠️ I apologize, but I\'m having trouble processing your request right now. Please try again or rephrase your question.',
          timestamp: new Date(),
          metadata: {
            suggestions: [
              "Try a different question",
              "Check your connection",
              "Contact support"
            ]
          }
        };
        return [...withoutLoading, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeUserIntent = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('learning path') || 
        lowerMessage.includes('roadmap') || 
        lowerMessage.includes('study plan') ||
        lowerMessage.includes('curriculum')) {
      return { 
        intent: 'learning_path',
        extractedGoals: extractGoalsFromMessage(message),
        skillLevel: extractSkillLevel(message)
      };
    }
    
    if (lowerMessage.includes('test') || 
        lowerMessage.includes('assessment') || 
        lowerMessage.includes('evaluate') ||
        lowerMessage.includes('skill check')) {
      return { 
        intent: 'adaptive_test',
        extractedGoals: extractGoalsFromMessage(message),
        skillLevel: extractSkillLevel(message)
      };
    }
    
    if (lowerMessage.includes('course') || 
        lowerMessage.includes('recommend') || 
        lowerMessage.includes('suggest') ||
        lowerMessage.includes('learn')) {
      return { 
        intent: 'course_recommendation',
        extractedGoals: extractGoalsFromMessage(message)
      };
    }
    
    return { intent: 'general_chat' };
  };

  const extractGoalsFromMessage = (message: string): string => {
    // Extract learning goals from the message
    const goalKeywords = ['web development', 'javascript', 'python', 'react', 'node.js', 'ai', 'machine learning', 'data science'];
    const foundGoals = goalKeywords.filter(goal => 
      message.toLowerCase().includes(goal)
    );
    
    return foundGoals.length > 0 ? foundGoals.join(', ') : message;
  };

  const extractSkillLevel = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('beginner') || lowerMessage.includes('new')) return 'beginner';
    if (lowerMessage.includes('intermediate')) return 'intermediate';
    if (lowerMessage.includes('advanced') || lowerMessage.includes('expert')) return 'advanced';
    return 'beginner';
  };

  const getScreenContext = () => {
    return {
      currentPage: 'dashboard',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  };

  const handleActionClick = (action: any) => {
    switch (action.type) {
      case 'start_course':
        if (onCourseSelect && action.data) {
          onCourseSelect(action.data);
        }
        break;
      case 'take_test':
        if (onStartTest) {
          onStartTest();
        }
        break;
      case 'view_roadmap':
        if (onViewRoadmap && action.data) {
          onViewRoadmap(action.data);
        }
        break;
      default:
        handleSendMessage(action.label);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: Message) => (
    <div key={message.id} className={`mb-6 ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
      <div className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          message.type === 'user' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
        }`}>
          {message.type === 'user' ? (
            currentUser?.displayName?.charAt(0) || 'U'
          ) : (
            '🤖'
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
          <div className={`inline-block max-w-full p-4 rounded-2xl ${
            message.type === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
          }`}>
            {message.isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm">{message.content}</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
            )}
          </div>

          {/* Message Actions & Suggestions */}
          {message.metadata && !message.isLoading && (
            <div className="mt-3 space-y-2">
              {message.metadata.actions && message.metadata.actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {message.metadata.actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(action)}
                      className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs hover:bg-blue-600/30 transition-colors border border-blue-500/30"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {message.metadata.suggestions && message.metadata.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {message.metadata.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-3 py-1 bg-white/5 text-slate-300 rounded-full text-xs hover:bg-white/10 transition-colors border border-white/10"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs text-slate-500 mt-2 ${message.type === 'user' ? 'text-right' : ''}`}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );

  // Different rendering based on variant
  if (variant === 'header') {
    return (
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            placeholder="🧠 Ask me anything about courses, get roadmaps, recommendations, or screen-specific help..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${
      variant === 'fullscreen' 
        ? 'fixed inset-0 z-50 bg-slate-900' 
        : variant === 'main'
        ? 'bg-white/5 backdrop-blur-lg rounded-xl border border-white/10'
        : 'bg-white/10 rounded-lg'
    } flex flex-col ${variant === 'main' ? 'h-96' : 'h-full'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🤖</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">Agentic AI Learning Assistant</h3>
            <p className="text-slate-400 text-xs">Intelligent • Adaptive • Personalized</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {variant !== 'fullscreen' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M20 12H4" : "M12 4v16m8-8H4"} />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex space-x-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about courses, request learning paths, take assessments, or get help with anything..."
            rows={1}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgenticAIAssistant;
