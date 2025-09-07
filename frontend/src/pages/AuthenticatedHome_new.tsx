import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AIAssistant from '../components/AIAssistant';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'quiz' | 'project' | 'tutorial';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  progress?: number;
  thumbnail: string;
  tags: string[];
  rating: number;
  enrollments: number;
  instructor?: string;
  totalModules?: number;
  questions?: number;
}

const AuthenticatedHome = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'quizzes' | 'projects' | 'tutorials'>('courses');
  const [loading, setLoading] = useState(true);
  const [contentData, setContentData] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to landing if not authenticated
    if (!currentUser) {
      navigate('/');
      return;
    }

    // Fetch real content from backend
    fetchContent();
  }, [currentUser, navigate]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token from Firebase
      const token = await currentUser?.getIdToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('http://localhost:3001/api/content', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.content) {
        setContentData(data.content);
        setError(null);
        console.log(`Loaded ${data.content.length} content items from library`);
      } else {
        throw new Error(data.message || 'Failed to load content library');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content library. Please check if the backend server is running and content exists.');
      setContentData([]); // NO MOCK CONTENT - just empty array
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (logout) {
        await logout();
      }
      localStorage.removeItem('authToken');
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const filteredContent = contentData.filter(item => {
    if (activeTab === 'courses') return item.type === 'course';
    if (activeTab === 'quizzes') return item.type === 'quiz';
    if (activeTab === 'projects') return item.type === 'project';
    if (activeTab === 'tutorials') return item.type === 'tutorial';
    return true;
  });

  const getTabCount = (type: string) => {
    return contentData.filter(item => item.type === type).length;
  };

  if (!currentUser) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Navigation Header */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LearnMate</h1>
                <p className="text-sm text-slate-400">Learning Hub</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 flex-shrink-0">
              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/home" className="text-blue-400 font-medium">Home</Link>
                <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">Dashboard</Link>
                <Link to="/clans" className="text-slate-300 hover:text-white transition-colors">Clans</Link>
              </nav>

              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser.displayName || currentUser.email?.split('@')[0]}</p>
                <p className="text-xs text-slate-400">Student</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Learner'} 👋
              </h2>
              <p className="text-slate-400">Ready to continue your learning journey?</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-red-400 font-medium">Content Loading Error</h4>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button 
                onClick={fetchContent} 
                className="ml-auto px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* AI Chat Interface - ON HOME PAGE */}
        <div className="mb-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">🤖 AI Learning Assistant</h3>
              <p className="text-slate-300">Your intelligent companion for personalized learning and instant help</p>
            </div>
            <div className="text-6xl">💡</div>
          </div>
          
          {/* AI Assistant Component - Featured prominently */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <AIAssistant variant="floating" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-blue-400 font-semibold mb-2">📚 Smart Recommendations</div>
              <div className="text-sm text-slate-400">Get personalized course suggestions based on your progress</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-green-400 font-semibold mb-2">🗺️ Learning Roadmaps</div>
              <div className="text-sm text-slate-400">AI-generated study paths tailored to your skill level</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-purple-400 font-semibold mb-2">⚡ Instant Help</div>
              <div className="text-sm text-slate-400">Get immediate answers to coding questions</div>
            </div>
          </div>
        </div>

        {/* Content Library */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">📖 Content Library</h3>
            <button 
              onClick={fetchContent}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
            >
              🔄 Refresh Content
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/5 backdrop-blur-lg rounded-lg p-1 mb-6 border border-white/10">
            {[
              { id: 'courses', label: 'Courses', icon: '📚', count: getTabCount('course') },
              { id: 'quizzes', label: 'Quizzes', icon: '📝', count: getTabCount('quiz') },
              { id: 'projects', label: 'Projects', icon: '🚀', count: getTabCount('project') },
              { id: 'tutorials', label: 'Tutorials', icon: '🎯', count: getTabCount('tutorial') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // Loading skeletons
              [...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 animate-pulse">
                  <div className="w-full h-32 bg-white/10 rounded-lg mb-4"></div>
                  <div className="h-4 bg-white/10 rounded mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-2/3 mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-white/10 rounded-full w-16"></div>
                    <div className="h-6 bg-white/10 rounded-full w-20"></div>
                  </div>
                </div>
              ))
            ) : filteredContent.length > 0 ? (
              filteredContent.map((item) => (
                <div key={item.id} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10 group cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{item.thumbnail}</div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-slate-300">{item.rating}</span>
                      </div>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400">{item.enrollments.toLocaleString()} enrolled</span>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 text-xs">
                      <span className={`px-2 py-1 rounded-full ${
                        item.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                        item.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {item.difficulty}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{item.duration}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-white/10 text-slate-300 px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white">
                    Start Learning
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-white mb-2">No Content Available</h3>
                <p className="text-slate-400 text-center mb-4">
                  {error 
                    ? 'There was an error loading content. Please check if the backend server is running.'
                    : 'No content found in the library. Please add courses to the content library.'
                  }
                </p>
                <button 
                  onClick={fetchContent}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthenticatedHome;
