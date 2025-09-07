import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'roadmap' | 'recommendation' | 'schedule' | 'progress' | 'general';
  data?: any;
}

interface AIAssistantProps {
  className?: string;
  variant?: 'header' | 'floating' | 'sidebar' | 'main';
}

const AIAssistant: React.FC<AIAssistantProps> = ({ className = '', variant = 'header' }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Update current page context
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setCurrentPage('home');
    else if (path === '/dashboard') setCurrentPage('dashboard');
    else if (path === '/signin') setCurrentPage('signin');
    else if (path === '/signup') setCurrentPage('signup');
    else setCurrentPage('other');
  }, [location]);

  const contextualSuggestions = {
    home: [
      { text: "Show me learning paths", type: "roadmap" },
      { text: "What courses do you recommend?", type: "recommendation" },
      { text: "Help me get started", type: "general" },
      { text: "Create study plan", type: "schedule" }
    ],
    dashboard: [
      { text: "Show my progress", type: "progress" },
      { text: "Recommend next course", type: "recommendation" },
      { text: "Create learning roadmap", type: "roadmap" },
      { text: "Optimize study schedule", type: "schedule" }
    ],
    signin: [
      { text: "Help with login issues", type: "general" },
      { text: "Forgot password help", type: "general" },
      { text: "What can I do here?", type: "general" }
    ],
    signup: [
      { text: "Help me choose courses", type: "recommendation" },
      { text: "What's the best learning path?", type: "roadmap" },
      { text: "How does this platform work?", type: "general" }
    ]
  };

  const quickActions = contextualSuggestions[currentPage as keyof typeof contextualSuggestions] || contextualSuggestions.home;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    await processQuery(query);
  };

  const processQuery = async (queryText: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: queryText,
      sender: 'user',
      timestamp: new Date(),
      type: detectQueryType(queryText)
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsProcessing(true);
    setShowResults(true);

    try {
      let response;
      const queryType = detectQueryType(queryText);
      
      // Route to appropriate AI service based on query type
      switch (queryType) {
        case 'roadmap':
          response = await generateRoadmap(queryText);
          break;
        case 'recommendation':
          response = await getRecommendations(queryText);
          break;
        case 'schedule':
          response = await createSchedule(queryText);
          break;
        case 'progress':
          response = await getProgressInfo(queryText);
          break;
        default:
          response = await generalAIChat(queryText);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        type: queryType,
        data: (response as any).data
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle special responses
      if ((response as any).action) {
        handleAIAction((response as any).action, (response as any).data);
      }

    } catch (error) {
      console.error('AI Assistant Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I\'m having trouble processing your request. Please try again or rephrase your question.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const detectQueryType = (query: string): Message['type'] => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('roadmap') || lowerQuery.includes('learning path') || lowerQuery.includes('curriculum')) return 'roadmap';
    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('what should')) return 'recommendation';
    if (lowerQuery.includes('schedule') || lowerQuery.includes('plan') || lowerQuery.includes('study time')) return 'schedule';
    if (lowerQuery.includes('progress') || lowerQuery.includes('performance') || lowerQuery.includes('how am i')) return 'progress';
    return 'general';
  };

  const generateRoadmap = async (query: string) => {
    const token = currentUser ? await currentUser.getIdToken() : null;
    
    const response = await fetch('http://localhost:3001/api/ai/roadmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        query,
        userId: currentUser?.uid,
        currentPage 
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        text: data.roadmap || 'Here\'s a personalized learning roadmap for you based on your goals.',
        data: data.roadmapData,
        action: 'show_roadmap'
      };
    }
    
    // If AI service fails, suggest adaptive testing
    return {
      text: `I'd like to create a personalized roadmap for you! First, let me assess your current knowledge with a quick adaptive test. This will help me recommend the perfect learning path. Click "Take Adaptive Assessment" to begin.`,
      action: 'suggest_adaptive_test'
    };
  };

  const getRecommendations = async (query: string) => {
    const token = currentUser ? await currentUser.getIdToken() : null;
    
    try {
      const response = await fetch('http://localhost:3001/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query,
          userId: currentUser?.uid,
          currentPage 
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          text: data.recommendations || 'Here are some personalized course recommendations for you.',
          data: data.courses
        };
      }
    } catch (error) {
      // AI service unavailable - suggest adaptive assessment
    }
    
    return {
      text: `To give you the best course recommendations, I'd like to understand your current knowledge level. Let me start an adaptive assessment that will analyze your skills and suggest personalized courses. This takes just 5-10 minutes and will unlock tailored learning paths!`,
      action: 'trigger_adaptive_assessment'
    };
  };

  const createSchedule = async (query: string) => {
    return {
      text: `I'll help you create an optimal study schedule. Based on your available time and goals, here's a suggested plan:\n\n📚 **Weekly Schedule:**\n• Monday-Wednesday: 2 hours theory\n• Thursday-Friday: 2 hours practice\n• Weekend: 1 hour review\n\nWould you like me to customize this based on your specific availability?`,
      action: 'create_schedule'
    };
  };

  const getProgressInfo = async (query: string) => {
    const token = currentUser ? await currentUser.getIdToken() : null;
    
    try {
      const response = await fetch('http://localhost:3001/api/users/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.dashboard?.user;
        if (user) {
          return {
            text: `📊 **Your Progress Summary:**\n\n• Overall Level: ${user.profile?.level || 1}\n• Total Points: ${user.profile?.points || 0}\n• Current Streak: ${user.profile?.streak || 0} days\n\nYou're doing great! Keep up the momentum! 🚀`,
            data: user
          };
        }
      }
    } catch (error) {
      // Service unavailable - suggest adaptive assessment for baseline
    }

    return {
      text: `To provide accurate progress insights, I recommend taking an adaptive assessment to establish your current skill baseline. This will help me track your learning progress more effectively and provide personalized recommendations!`
    };
  };

  const generalAIChat = async (query: string) => {
    const token = currentUser ? await currentUser.getIdToken() : localStorage.getItem('authToken');
    
    try {
      const response = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: query,
          currentPage: currentPage,
          context: {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            pageContent: document.title
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          text: data.response || 'I\'m here to help you with your learning journey!',
          sources: data.sources || [],
          hasRAG: data.hasRAG || false
        };
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
    }

    return {
      text: `I'm your AI learning assistant! I use adaptive assessments to create personalized experiences:\n\n🧠 Adaptive skill assessments\n🗺️ Personalized learning roadmaps\n📚 AI-recommended courses\n� Real-time progress tracking\n\nStart with an adaptive assessment to unlock your personalized learning journey!`,
      action: 'suggest_adaptive_test'
    };
  };

  const handleAIAction = (action: string, data?: any) => {
    switch (action) {
      case 'show_roadmap':
        // Could navigate to a roadmap page or show modal
        console.log('Show roadmap:', data);
        break;
      case 'show_recommendations':
        // Could navigate to courses or show recommendations
        console.log('Show recommendations:', data);
        break;
      case 'create_schedule':
        // Could open schedule creator
        console.log('Create schedule:', data);
        break;
      default:
        break;
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getVariantClasses = () => {
    switch (variant) {
      case 'floating':
        return 'fixed bottom-6 right-6 w-80 z-50';
      case 'sidebar':
        return 'w-full h-full';
      case 'main':
        return 'w-full';
      default: // header
        return 'w-full max-w-2xl mx-auto';
    }
  };

  const getInputClasses = () => {
    switch (variant) {
      case 'main':
        return 'w-full pl-12 pr-20 py-5 bg-slate-800/50 backdrop-blur-lg border-2 border-slate-600/30 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-400/70 transition-all duration-300 text-lg';
      default:
        return 'w-full pl-12 pr-20 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300';
    }
  };

  return (
    <div className={`relative ${getVariantClasses()} ${className}`}>
      {/* AI Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-gray-400 z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            placeholder={variant === 'main' ? 
              "🧠 Ask me anything about courses, get roadmaps, recommendations, or screen-specific help..." : 
              `AI Assistant: Ask for roadmaps, recommendations, schedules... (${currentPage})`
            }
            className={getInputClasses()}
          />
          <div className="absolute right-2 flex items-center space-x-2">
            {isProcessing && (
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
            <button
              type="submit"
              disabled={!query.trim() || isProcessing}
              className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </form>

      {/* AI Results Panel */}
      {showResults && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl z-50 max-h-96 overflow-hidden"
        >
          {messages.length === 0 ? (
            /* Contextual Quick Actions */
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">
                {currentPage === 'dashboard' ? 'Your Learning Assistant' : 'How can I help you?'}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => processQuery(action.text)}
                    className="p-3 text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                  >
                    <span className="text-lg">
                      {action.type === 'roadmap' && '🗺️'}
                      {action.type === 'recommendation' && '📚'}
                      {action.type === 'schedule' && '📅'}
                      {action.type === 'progress' && '📊'}
                      {action.type === 'general' && '💡'}
                    </span>
                    <span>{action.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="max-h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white border border-white/20'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
