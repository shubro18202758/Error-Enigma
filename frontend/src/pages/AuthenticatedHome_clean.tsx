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
  completed?: boolean;
  thumbnail: string;
  tags: string[];
  instructor?: string;
  totalModules?: number;
  modules?: any[];
}

interface UserStats {
  total_points: number;
  current_streak: number;
  level: number;
  lessons_completed: number;
  quizzes_completed: number;
  projects_completed: number;
  total_completed: number;
}

const Home = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'quizzes' | 'projects' | 'tutorials'>('courses');
  const [loading, setLoading] = useState(true);
  const [contentData, setContentData] = useState<ContentItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total_points: 0,
    current_streak: 0,
    level: 1,
    lessons_completed: 0,
    quizzes_completed: 0,
    projects_completed: 0,
    total_completed: 0
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    fetchAllData();
  }, [currentUser, navigate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await currentUser?.getIdToken();
      
      // Initialize user first
      await fetch('http://localhost:3001/api/users/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {}); // Ignore error if user already exists
      
      // Fetch user profile and content in parallel
      const [profileResponse, contentResponse] = await Promise.all([
        fetch('http://localhost:3001/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('http://localhost:3001/api/content', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!profileResponse.ok || !contentResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [profileData, contentData] = await Promise.all([
        profileResponse.json(),
        contentResponse.json()
      ]);

      if (profileData.success && profileData.user) {
        setUserStats(profileData.user);
      }

      if (contentData.success && contentData.content) {
        setContentData(contentData.content);
      } else {
        throw new Error('No content available');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load content. Please check your connection.');
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

  const handleCompleteContent = async (contentId: string, contentType: string) => {
    try {
      const token = await currentUser?.getIdToken();
      
      const response = await fetch('http://localhost:3001/api/users/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          contentType
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh data to show updated progress
        await fetchAllData();
      }
    } catch (error) {
      console.error('Error completing content:', error);
    }
  };

  const filteredContent = contentData.filter(item => {
    if (activeTab === 'courses') return item.type === 'course';
    if (activeTab === 'quizzes') return item.type === 'quiz';
    if (activeTab === 'projects') return item.type === 'project';
    if (activeTab === 'tutorials') return item.type === 'tutorial';
    return true;
  });

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
                <p className="text-xs text-slate-400">Level {userStats.level} • {userStats.total_points} pts</p>
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
        {/* Welcome Section with Real Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Learner'} 👋
              </h2>
              <p className="text-slate-400">Ready to continue your learning journey? Let's explore what's new!</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{userStats.current_streak}</div>
                <div className="text-sm text-slate-400">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{userStats.total_points}</div>
                <div className="text-sm text-slate-400">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{userStats.total_completed}</div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
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
                onClick={fetchAllData} 
                className="ml-auto px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* AI Chat Interface - Main Feature on Page */}
        <div className="mb-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-white/10">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-4">🤖 AI Learning Assistant</h3>
            <p className="text-slate-300">Your intelligent companion for personalized learning, instant help, and study planning</p>
          </div>
          
          {/* AI Assistant Component - Main Feature */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6">
            <AIAssistant variant="floating" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-blue-400 font-semibold mb-2">📚 Smart Recommendations</div>
              <div className="text-sm text-slate-400">Get personalized course suggestions based on your progress and goals</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-green-400 font-semibold mb-2">🗺️ Learning Roadmaps</div>
              <div className="text-sm text-slate-400">AI-generated study paths tailored to your skill level and pace</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-purple-400 font-semibold mb-2">⚡ Instant Help</div>
              <div className="text-sm text-slate-400">Get immediate answers to coding questions and concept explanations</div>
            </div>
          </div>
        </div>

        {/* Content Library with Real Data */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">📖 Content Library</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">Total: {contentData.length} items</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/5 backdrop-blur-lg rounded-lg p-1 mb-6 border border-white/10">
            {[
              { id: 'courses', label: 'Courses', icon: '📚', count: contentData.filter(i => i.type === 'course').length },
              { id: 'quizzes', label: 'Quizzes', icon: '📝', count: contentData.filter(i => i.type === 'quiz').length },
              { id: 'projects', label: 'Projects', icon: '🚀', count: contentData.filter(i => i.type === 'project').length },
              { id: 'tutorials', label: 'Tutorials', icon: '🎯', count: contentData.filter(i => i.type === 'tutorial').length }
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

          {/* Real Content Grid */}
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
            ) : filteredContent.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-white mb-2">No Content Available</h3>
                <p className="text-slate-400">Content library is being loaded. Please check back soon!</p>
              </div>
            ) : (
              filteredContent.map((item) => (
                <div key={item.id} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10 group cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{item.thumbnail}</div>
                    <div className="flex items-center space-x-2">
                      {item.completed && (
                        <div className="text-green-400 text-sm font-medium">✓ Completed</div>
                      )}
                      <div className="text-xs text-slate-400">{item.instructor}</div>
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

                  {item.progress && item.progress > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">Progress</span>
                        <span className="text-xs text-blue-400">{item.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-white/10 text-slate-300 px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleCompleteContent(item.id, item.type)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                      item.completed
                        ? 'bg-green-600/20 text-green-400 border border-green-500/30 cursor-default'
                        : item.progress && item.progress > 0
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    disabled={item.completed}
                  >
                    {item.completed ? '✓ Completed' : 
                     item.progress && item.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
