import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UnifiedDashboard from '../components/UnifiedDashboard';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  points: number;
  streak: number;
  joinDate: string;
  clanId?: string;
  role: 'student' | 'mentor' | 'admin';
  badges: string[];
  completedCourses: number;
  activeModules: number;
  total_points: number;
  current_streak: number;
  lessons_completed: number;
  quizzes_completed: number;
  projects_completed: number;
}

interface ClanData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  level: number;
  points: number;
  challenges: Challenge[];
  members: ClanMember[];
  recentActivity: Activity[];
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'project' | 'discussion' | 'competition';
  status: 'active' | 'completed' | 'upcoming';
  participants: number;
  deadline: string;
  rewards: number;
  creator: string;
}

interface ClanMember {
  uid: string;
  name: string;
  level: number;
  points: number;
  role: 'member' | 'leader' | 'moderator';
  joinDate: string;
  avatar?: string;
}

interface Activity {
  id: string;
  type: 'challenge_created' | 'challenge_completed' | 'member_joined' | 'achievement_unlocked';
  user: string;
  description: string;
  timestamp: string;
  icon: string;
}

interface LearningProgress {
  currentPath: string;
  completionPercentage: number;
  weeklyGoal: number;
  weeklyProgress: number;
  upcomingDeadlines: Deadline[];
  recentAchievements: Achievement[];
  topics?: { [key: string]: any };
}

interface Deadline {
  id: string;
  title: string;
  type: 'assignment' | 'quiz' | 'project' | 'exam';
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface DashboardData {
  user: UserProfile & {
    profile: {
      points: number;
      level: number;
      streak: number;
      lessons_completed: number;
      quizzes_completed: number;
      projects_completed: number;
    };
    progress: {
      topics: { [key: string]: any };
    };
  };
  clanData: ClanData;
  recentCompletions: any[];
  learningStats: any;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [clanData, setClanData] = useState<ClanData | null>(null);
  const [learningProgress, setLearningProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clan' | 'progress' | 'challenges' | 'agentic'>('overview');
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

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
    if (currentUser) {
      const timer = setTimeout(() => {
        loadDashboardData();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      navigate('/signin');
    }
  }, [currentUser, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize user first
      await apiRequest('/api/users/initialize', { method: 'POST' }).catch(() => {}); // Ignore if already exists
      
      // Load comprehensive dashboard data
      const dashboardResponse = await apiRequest('/api/users/dashboard');
      
      if (dashboardResponse.success && dashboardResponse.dashboard) {
        const data = dashboardResponse.dashboard;
        setDashboardData(data);
        
        // Set individual states for backwards compatibility
        setUserProfile({
          uid: data.user.uid,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar,
          level: data.user.level,
          points: data.user.points,
          streak: data.user.streak,
          joinDate: data.user.joinDate,
          role: data.user.role,
          badges: data.user.badges || [],
          completedCourses: data.user.completedCourses,
          activeModules: data.user.activeModules,
          total_points: data.user.profile.points,
          current_streak: data.user.profile.streak,
          lessons_completed: data.user.profile.lessons_completed,
          quizzes_completed: data.user.profile.quizzes_completed,
          projects_completed: data.user.profile.projects_completed
        });
        
        setClanData(data.clanData);
        
        setLearningProgress({
          currentPath: `${data.user.profile.lessons_completed + data.user.profile.quizzes_completed + data.user.profile.projects_completed} Learning Activities Completed`,
          completionPercentage: Math.min(100, ((data.user.profile.total_completed || 0) * 10) % 100),
          weeklyGoal: 10,
          weeklyProgress: Math.min(10, (data.user.profile.total_completed || 0) % 10),
          upcomingDeadlines: [
            { id: '1', title: 'Complete JavaScript Fundamentals', type: 'assignment', dueDate: '2025-09-15', priority: 'high' },
            { id: '2', title: 'Python Quiz Chapter 3', type: 'quiz', dueDate: '2025-09-12', priority: 'medium' }
          ],
          recentAchievements: [
            { id: '1', title: 'First Steps', description: 'Completed your first lesson', icon: '🎯', unlockedAt: '2025-09-01', rarity: 'common' },
            { id: '2', title: 'Quiz Master', description: 'Completed 5 quizzes', icon: '🧠', unlockedAt: '2025-09-05', rarity: 'rare' },
            { id: '3', title: 'Streak Keeper', description: 'Maintained 7-day streak', icon: '🔥', unlockedAt: '2025-09-07', rarity: 'epic' }
          ],
          topics: data.user.progress.topics
        });
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const createChallenge = async (challengeData: Partial<Challenge>) => {
    try {
      const response = await apiRequest('/api/clans/challenges', {
        method: 'POST',
        body: JSON.stringify(challengeData)
      });

      if (response.success) {
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const response = await apiRequest(`/api/clans/challenges/${challengeId}/join`, {
        method: 'POST'
      });

      if (response.success) {
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your professional dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center border border-red-500/20">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={loadDashboardData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/10">
          <p className="text-white text-lg mb-4">No profile data found</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Professional Header */}
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
                <h1 className="text-xl font-bold text-white">EduLearn Pro</h1>
                <p className="text-sm text-slate-400">Professional Learning Platform</p>
              </div>
            </div>

            {/* Professional Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search courses, topics, or browse content..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 flex-shrink-0">
              {/* User Profile Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{userProfile.name}</p>
                  <p className="text-xs text-slate-400">Level {userProfile.level}</p>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {userProfile.name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                </div>
              </div>

              {/* Notifications */}
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors relative">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3.001 3.001 0 11-6 0m6 0H9" />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </button>

              {/* Settings & Logout */}
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome back, {userProfile.name?.split(' ')[0] || 'Student'} 👋
              </h2>
              <p className="text-slate-400">Ready to advance your professional learning journey?</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{userProfile.current_streak || userProfile.streak || 0}</div>
                <div className="text-sm text-slate-400">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{(userProfile.total_points || userProfile.points || 0).toLocaleString()}</div>
                <div className="text-sm text-slate-400">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{userProfile.lessons_completed || userProfile.completedCourses || 0}</div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/5 backdrop-blur-lg rounded-lg p-1 border border-white/10">
            {[
              { id: 'overview', label: 'Learning Overview', icon: '📊' },
              { id: 'progress', label: 'Progress Analytics', icon: '📈' },
              { id: 'agentic', label: 'Agentic AI Analysis', icon: '🤖' },
              { id: 'clan', label: 'Learning Community', icon: '👥' },
              { id: 'challenges', label: 'Skill Challenges', icon: '🏆' }
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
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <OverviewTab 
              userProfile={userProfile} 
              learningProgress={learningProgress}
              clanData={clanData}
            />
          )}
          
          {activeTab === 'progress' && (
            <ProgressTab 
              learningProgress={learningProgress}
              userProfile={userProfile}
            />
          )}
          
          {activeTab === 'agentic' && (
            <UnifiedDashboard />
          )}
          
          {activeTab === 'clan' && (
            <ClanTab 
              clanData={clanData}
              userProfile={userProfile}
              onCreateChallenge={createChallenge}
              onJoinChallenge={joinChallenge}
            />
          )}
          
          {activeTab === 'challenges' && (
            <ChallengesTab 
              clanData={clanData}
              userProfile={userProfile}
              onJoinChallenge={joinChallenge}
            />
          )}
        </div>
      </main>


    </div>
  );
};

// Professional Tab Components
const OverviewTab: React.FC<{
  userProfile: UserProfile;
  learningProgress: LearningProgress | null;
  clanData: ClanData | null;
}> = ({ userProfile, learningProgress, clanData }) => (
  <div className="space-y-6">
    {/* Professional Key Metrics Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-6 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-300 text-sm font-medium">Learning Progress</p>
            <p className="text-3xl font-bold text-white">{userProfile.lessons_completed || 0}</p>
            <p className="text-blue-400 text-xs">Lessons Completed</p>
          </div>
          <div className="text-4xl">📚</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-300 text-sm font-medium">Professional Level</p>
            <p className="text-3xl font-bold text-white">Level {userProfile.level || 1}</p>
            <p className="text-green-400 text-xs">{(userProfile.total_points || 0) % 100}/100 XP</p>
          </div>
          <div className="text-4xl">⭐</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-lg rounded-xl p-6 border border-orange-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-300 text-sm font-medium">Consistency Streak</p>
            <p className="text-3xl font-bold text-white">{userProfile.current_streak || 0}</p>
            <p className="text-orange-400 text-xs">Consecutive Days</p>
          </div>
          <div className="text-4xl">🔥</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-300 text-sm font-medium">Skill Points</p>
            <p className="text-3xl font-bold text-white">{(userProfile.total_points || 0).toLocaleString()}</p>
            <p className="text-purple-400 text-xs">Experience Earned</p>
          </div>
          <div className="text-4xl">🏆</div>
        </div>
      </div>
    </div>

    {/* Professional Analytics Dashboard */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Learning Analytics */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span>
          Learning Performance Analytics
        </h3>
        {learningProgress ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-300">Overall Progress</span>
              <span className="text-blue-400 font-semibold">{learningProgress.completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${learningProgress.completionPercentage}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <span className="text-slate-400 text-sm">Quizzes Mastered</span>
                <div className="text-white font-semibold text-lg">{userProfile.quizzes_completed || 0}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <span className="text-slate-400 text-sm">Projects Built</span>
                <div className="text-white font-semibold text-lg">{userProfile.projects_completed || 0}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Weekly Learning Goal</span>
                <span className="text-blue-400 text-sm">{learningProgress.weeklyProgress}/{learningProgress.weeklyGoal} activities</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (learningProgress.weeklyProgress / learningProgress.weeklyGoal) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🚀</div>
            <p className="text-slate-400 mb-4">Start your professional learning journey today!</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
              Explore Courses
            </button>
          </div>
        )}
      </div>

      {/* Professional Achievements & Deadlines */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">🎯</span>
          Goals & Achievements
        </h3>
        
        <div className="space-y-4">
          {/* Upcoming Professional Deadlines */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Upcoming Milestones</h4>
            <div className="space-y-2">
              {learningProgress?.upcomingDeadlines?.slice(0, 2).map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div>
                    <div className="text-white font-medium text-sm">{deadline.title}</div>
                    <div className="text-slate-400 text-xs">{deadline.type} • Due {deadline.dueDate}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    deadline.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    deadline.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {deadline.priority}
                  </span>
                </div>
              )) || (
                <div className="text-slate-400 text-sm">No upcoming deadlines</div>
              )}
            </div>
          </div>

          {/* Professional Achievements */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Recent Achievements</h4>
            <div className="space-y-2">
              {learningProgress?.recentAchievements?.slice(0, 2).map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3 bg-white/5 rounded-lg p-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm">{achievement.title}</div>
                    <div className="text-slate-400 text-xs">{achievement.description}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    achievement.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                    achievement.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                    achievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {achievement.rarity}
                  </span>
                </div>
              )) || (
                <div className="text-slate-400 text-sm">Start learning to unlock achievements</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>



    {/* Professional Learning Community Overview */}
    {clanData && (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">👥</span>
          Professional Learning Community
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-blue-400 mb-1">{clanData.name}</div>
            <div className="text-slate-400 text-sm mb-3">{clanData.description}</div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-slate-400">{clanData.memberCount} professional learners</span>
              <span className="text-slate-400">Community Level {clanData.level}</span>
              <span className="text-slate-400">{clanData.challenges?.length || 0} active challenges</span>
            </div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
            View Community
          </button>
        </div>
      </div>
    )}
  </div>
);

const ProgressTab: React.FC<{
  learningProgress: LearningProgress | null;
  userProfile: UserProfile;
}> = ({ learningProgress, userProfile }) => (
  <div className="space-y-6">
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4">Professional Progress Tracking</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400">{userProfile.lessons_completed || 0}</div>
          <div className="text-slate-400">Lessons Mastered</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400">{userProfile.quizzes_completed || 0}</div>
          <div className="text-slate-400">Assessments Passed</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-400">{userProfile.projects_completed || 0}</div>
          <div className="text-slate-400">Projects Completed</div>
        </div>
      </div>
    </div>
  </div>
);

const ClanTab: React.FC<{
  clanData: ClanData | null;
  userProfile: UserProfile;
  onCreateChallenge: (challengeData: Partial<Challenge>) => void;
  onJoinChallenge: (challengeId: string) => void;
}> = ({ clanData, userProfile, onCreateChallenge, onJoinChallenge }) => (
  <div className="space-y-6">
    {clanData ? (
      <>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{clanData.name}</h2>
              <p className="text-slate-400">{clanData.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-400">{clanData.level}</div>
              <div className="text-sm text-slate-400">Community Level</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{clanData.memberCount}</div>
              <div className="text-sm text-slate-400">Active Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{clanData.points.toLocaleString()}</div>
              <div className="text-sm text-slate-400">Community Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">{clanData.challenges.length}</div>
              <div className="text-sm text-slate-400">Learning Challenges</div>
            </div>
          </div>
        </div>
      </>
    ) : (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10 text-center">
        <div className="text-6xl mb-4">👥</div>
        <h2 className="text-2xl font-bold text-white mb-4">Join Professional Learning Community</h2>
        <p className="text-slate-400 mb-6">Connect with fellow professional learners, participate in skill challenges, and accelerate your career growth together.</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
          Explore Learning Communities
        </button>
      </div>
    )}
  </div>
);

const ChallengesTab: React.FC<{
  clanData: ClanData | null;
  userProfile: UserProfile;
  onJoinChallenge: (challengeId: string) => void;
}> = ({ clanData, userProfile, onJoinChallenge }) => (
  <div className="space-y-6">
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4">Professional Skill Challenges</h3>
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-slate-400 mb-4">Enhanced challenge system with AI-powered skill assessments coming soon...</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
          Get Notified
        </button>
      </div>
    </div>
  </div>
);

export default Dashboard;
