import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AgenticAIAssistant from '../components/AgenticAIAssistant';
import SmartAdaptiveTest from '../components/SmartAdaptiveTest';
import CourseProgressTracker from '../components/CourseProgressTracker';
import ComprehensiveFinalTest from '../components/ComprehensiveFinalTest';
import AdvancedClanSystem from '../services/AdvancedClanSystem';

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
}

const Home = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'quizzes' | 'projects' | 'tutorials'>('courses');
  const [loading, setLoading] = useState(true);
  const [contentData, setContentData] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showAdaptiveTest, setShowAdaptiveTest] = useState(false);
  const [testAnalysis, setTestAnalysis] = useState<any>(null);
  const [clanSystem, setClanSystem] = useState<AdvancedClanSystem | null>(null);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [showFinalTest, setShowFinalTest] = useState(false);
  const [finalTestContext, setFinalTestContext] = useState<any>(null);

  useEffect(() => {
    // Redirect to landing if not authenticated
    if (!currentUser) {
      navigate('/');
      return;
    }

    // Initialize clan system
    const system = new AdvancedClanSystem(currentUser);
    setClanSystem(system);

    // Fetch real content from backend
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get auth token from Firebase or localStorage
        const token = localStorage.getItem('authToken') || (await currentUser?.getIdToken());
        
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
        } else {
          throw new Error(data.message || 'Failed to load content library');
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to load content library. Please check your connection and try again.');
        // No mock content fallback - system uses only real content
        setContentData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
    fetchUserProfile();
  }, [currentUser, navigate]);

  const fetchUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      setProfileLoading(true);
      const token = localStorage.getItem('authToken') || (await currentUser?.getIdToken());
      
      const response = await fetch('http://localhost:3001/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.profile) {
        setUserProfile(data.profile);
      } else {
        console.log('Profile not found, user may need initialization');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setProfileLoading(false);
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

  // Initialize user progress on component mount
  useEffect(() => {
    if (currentUser) {
      initializeUserProgress();
    }
  }, [currentUser]);

  const initializeUserProgress = async () => {
    try {
      const token = await currentUser?.getIdToken();
      await fetch('http://localhost:3001/api/users/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.log('User already initialized or error:', error);
    }
  };

  const handleStartLearning = (course: ContentItem) => {
    if (course.progress && course.progress > 0) {
      // Continue existing course - navigate to content
      navigate(`/course/${course.id}`);
    } else {
      // New course - trigger adaptive assessment first
      console.log('Starting adaptive assessment for:', course.title);
      setShowAdaptiveTest(true);
      // Store selected course for after assessment
      localStorage.setItem('selectedCourse', JSON.stringify(course));
    }
  };

  // Handle progress tracker actions
  const handleProgressAction = (action: string, data: any) => {
    console.log('🎯 Progress action triggered:', action, data);
    
    switch (action) {
      case 'continue_learning':
        navigate(`/course/${data.id}?resume=true`);
        break;
      case 'take_final_test':
        setFinalTestContext(data);
        setShowFinalTest(true);
        break;
      case 'view_analytics':
        // Show detailed analytics for the course
        console.log('📊 Viewing analytics for:', data);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Handle final test completion
  const handleFinalTestComplete = (analysis: any) => {
    console.log('🎉 Final test completed with analysis:', analysis);
    setShowFinalTest(false);
    setFinalTestContext(null);
    
    // Show results or navigate to certificate page
    if (analysis.overall.certificateEarned) {
      alert(`🎓 Congratulations! You earned a certificate with ${analysis.overall.accuracy}% accuracy!`);
    } else {
      alert(`📚 Test completed with ${analysis.overall.accuracy}% accuracy. Review recommended topics and try again.`);
    }
  };

  const generatePersonalizedContent = async (course: ContentItem, analysis: any) => {
    try {
      const token = localStorage.getItem('authToken') || (await currentUser?.getIdToken());
      
      // Send course selection and assessment results to AI orchestrator
      const response = await fetch('http://localhost:3001/api/ai/personalized-learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
          assessmentResults: analysis,
          userGoals: userProfile?.name ? `Professional development for ${userProfile.name}` : 'General programming skills'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Personalized learning path generated:', data);
        
        // Navigate to course with personalized content
        navigate(`/course/${course.id}?personalized=true&assessment=${analysis.id}`);
      } else {
        // Fallback - navigate to course normally
        navigate(`/course/${course.id}`);
      }
    } catch (error) {
      console.error('Error generating personalized content:', error);
      // Fallback navigation
      navigate(`/course/${course.id}`);
    }
  };

  // NO MORE MOCK CONTENT - only real data from API
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

            {/* Quick Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm">Search</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm">Quick Add</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4 flex-shrink-0">
              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/home" className="text-blue-400 font-medium">Home</Link>
                <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">Dashboard</Link>
                <Link to="/clans" className="text-slate-300 hover:text-white transition-colors">Clans</Link>
                <Link to="/analytics" className="text-slate-300 hover:text-white transition-colors">Analytics</Link>
              </nav>

              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser.displayName || currentUser.email?.split('@')[0]}</p>
                <p className="text-xs text-slate-400">
                  {profileLoading ? 'Loading...' : `Level ${userProfile?.level || 1} • ${userProfile?.total_points || 0} pts`}
                </p>
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
              <p className="text-slate-400">Ready to continue your learning journey? Let's explore what's new!</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {profileLoading ? '...' : userProfile?.current_streak || 0}
                </div>
                <div className="text-sm text-slate-400">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {profileLoading ? '...' : userProfile?.total_points || 0}
                </div>
                <div className="text-sm text-slate-400">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {profileLoading ? '...' : (userProfile?.lessons_completed || 0) + (userProfile?.quizzes_completed || 0) + (userProfile?.projects_completed || 0)}
                </div>
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
                onClick={() => window.location.reload()} 
                className="ml-auto px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Advanced AI Learning Assistant - Main Feature */}
        <div className="mb-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">� Advanced AI Learning Assistant</h3>
                <p className="text-slate-300">RAG-powered intelligent companion with access to entire course library</p>
              </div>
              <div className="text-6xl">�</div>
            </div>
            
            {/* Agentic AI Chat Interface - Main Feature */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-indigo-500/20">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-white mb-2">🤖 Your Intelligent Learning Companion</h4>
                <p className="text-slate-300 text-sm mb-3">
                  Get personalized learning paths, take adaptive assessments, explore courses, and receive intelligent guidance tailored to your goals.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">🎯 Adaptive Learning</div>
                  <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">📊 Progress Analytics</div>
                  <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">🧠 AI-Powered</div>
                  <div className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs">⚡ Time Efficient</div>
                </div>
              </div>
              <div className="h-96">
                <AgenticAIAssistant 
                  variant="main" 
                  onCourseSelect={(course: any) => {
                    console.log('Selected course:', course);
                    // Navigate to course or open course details
                  }}
                  onStartTest={() => {
                    setShowAdaptiveTest(true);
                  }}
                  onViewRoadmap={(roadmap: any) => {
                    console.log('Viewing roadmap:', roadmap);
                    // Show personalized learning roadmap
                  }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-blue-400 font-semibold mb-2">🎯 Smart Recommendations</div>
                <div className="text-sm text-slate-400">AI analyzes your progress and suggests optimal learning paths</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-green-400 font-semibold mb-2">🗺️ Custom Roadmaps</div>
                <div className="text-sm text-slate-400">Personalized study plans based on your goals and timeline</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-purple-400 font-semibold mb-2">⚡ Context-Aware Help</div>
                <div className="text-sm text-slate-400">Screen-aware AI understands what you're viewing for precise help</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-yellow-400 font-semibold mb-2">📊 Learning Analytics</div>
                <div className="text-sm text-slate-400">Real-time insights into your learning patterns and optimization tips</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Dashboard Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">📈 Learning Progress Dashboard</h3>
            <button
              onClick={() => setShowProgressTracker(!showProgressTracker)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2"
            >
              <span>{showProgressTracker ? '📊 Hide Dashboard' : '📈 View Progress'}</span>
            </button>
          </div>
          
          {showProgressTracker && (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <CourseProgressTracker onActionClick={handleProgressAction} />
            </div>
          )}
        </div>

        {/* Content Library with Tabs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">📖 Content Library</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">Filter by:</span>
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Levels</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/5 backdrop-blur-lg rounded-lg p-1 mb-6 border border-white/10">
            {[
              { id: 'courses', label: 'Courses', icon: '📚', count: contentData.filter((i: ContentItem) => i.type === 'course').length },
              { id: 'quizzes', label: 'Quizzes', icon: '📝', count: contentData.filter((i: ContentItem) => i.type === 'quiz').length },
              { id: 'projects', label: 'Projects', icon: '🚀', count: contentData.filter((i: ContentItem) => i.type === 'project').length },
              { id: 'tutorials', label: 'Tutorials', icon: '🎯', count: contentData.filter((i: ContentItem) => i.type === 'tutorial').length }
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
            ) : (
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

                  {item.progress && (
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
                    onClick={() => handleStartLearning(item)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                    item.progress 
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}>
                    {item.progress ? 'Continue Learning' : 'Start Learning'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Adaptive Test Modal */}
      <SmartAdaptiveTest
        isOpen={showAdaptiveTest}
        onClose={() => setShowAdaptiveTest(false)}
        onComplete={(results: any) => {
          // Transform results to match expected analysis format
          const analysis = {
            overallScore: Math.round(results.reduce((acc: number, r: any) => acc + (r.is_correct ? 100 : 0), 0) / results.length),
            skillAssessment: {
              recommendedLevel: 'intermediate',
              strengths: results.filter((r: any) => r.is_correct).map((r: any) => r.lesson_name).slice(0, 3),
              weaknesses: results.filter((r: any) => !r.is_correct).map((r: any) => r.lesson_name).slice(0, 3),
              totalQuestions: results.length,
              correctAnswers: results.filter((r: any) => r.is_correct).length
            },
            detailedResults: results
          };
          
          setTestAnalysis(analysis);
          setShowAdaptiveTest(false);
          
          // Notify clan system about assessment completion
          if (clanSystem) {
            clanSystem.updateMemberActivity('assessment_completed', {
              accuracy: analysis.overallScore,
              level: analysis.skillAssessment?.recommendedLevel || 'intermediate'
            });
          }
          
          // Process course selection with assessment results
          const selectedCourse = localStorage.getItem('selectedCourse');
          if (selectedCourse) {
            const course = JSON.parse(selectedCourse);
            console.log('🎯 Assessment completed for course:', course.title);
            console.log('📊 Assessment results:', analysis);
            
            // Notify clan system about course start
            if (clanSystem) {
              clanSystem.updateMemberActivity('course_started', {
                courseTitle: course.title
              });
            }
            
            // Generate personalized learning path with adaptive test results
            generatePersonalizedContent(course, analysis);
            
            // Clean up
            localStorage.removeItem('selectedCourse');
          }
        }}
      />

      {/* Comprehensive Final Test Modal */}
      <ComprehensiveFinalTest
        isOpen={showFinalTest}
        onClose={() => {
          setShowFinalTest(false);
          setFinalTestContext(null);
        }}
        onComplete={handleFinalTestComplete}
        courseContext={finalTestContext}
      />
    </div>
  );
};

export default Home;
