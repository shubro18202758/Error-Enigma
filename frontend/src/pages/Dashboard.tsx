import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProgress, getClanMembers, UserProfile, UserProgress } from '../services/firebaseService';

interface ClanMember extends UserProfile {
  overallProgress: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    loadUserData();
  }, [currentUser, navigate]);

  const loadUserData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Load user profile
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);

      // Load clan members if user is in a clan
      if (profile?.clanId) {
        const members = await getClanMembers(profile.clanId);
        const membersWithProgress = members.map(member => {
          const progressEntries = Object.entries(member.progress || {});
          const totalProgress = progressEntries.length > 0 
            ? progressEntries.reduce((acc, [, prog]) => acc + prog.percentage, 0) / progressEntries.length
            : 0;
          return {
            ...member,
            overallProgress: Math.round(totalProgress)
          };
        });
        setClanMembers(membersWithProgress);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateTopicProgress = async (topic: string, completed: number, total: number) => {
    if (!currentUser || !userProfile) return;

    try {
      await updateUserProgress(currentUser.uid, topic, completed, total);
      // Reload user data to reflect changes
      await loadUserData();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const addNewTopic = async () => {
    if (!selectedTopic || !currentUser) return;

    try {
      await updateUserProgress(currentUser.uid, selectedTopic, 0, 100);
      setSelectedTopic('');
      await loadUserData();
    } catch (error) {
      console.error('Error adding topic:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="glass-morphism rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  };

  if (!currentUser || !userProfile) {
    return null;
  }

  const availableTopics = [
    'JavaScript Fundamentals',
    'React Development',
    'Node.js Backend',
    'Python Programming',
    'Data Structures',
    'Algorithms',
    'Web Security',
    'Database Design',
    'Cloud Computing',
    'Machine Learning'
  ];

  const progressEntries = Object.entries(userProfile.progress || {});

  return (
    <div className="font-sans bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 min-h-screen text-white">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-dark-800/80 backdrop-blur-md border-b border-dark-600">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold gradient-text">LearnMate</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full px-4 py-2 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <svg className="absolute right-3 top-2.5 w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex items-center space-x-6">
              <a href="#" className="text-dark-300 hover:text-white transition-colors">Home</a>
              <a href="#" className="text-dark-300 hover:text-white transition-colors">Courses</a>
              <a href="#" className="text-dark-300 hover:text-white transition-colors">About</a>
              
              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 bg-dark-700/50 hover:bg-dark-600/50 px-4 py-2 rounded-xl transition-all duration-300"
                >
                  <img 
                    src={userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=6366f1&color=ffffff`}
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-white font-medium">{userProfile.name}</span>
                  <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="glass-morphism rounded-2xl p-8 hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome back, <span className="gradient-text">{userProfile.name}</span>!
                  </h2>
                  <p className="text-dark-300 text-lg">
                    Ready to continue your learning journey?
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold gradient-text">Level {userProfile.profile?.level || 1}</div>
                  <div className="text-dark-300">{userProfile.profile?.points || 0} points</div>
                </div>
              </div>
            </div>
          </div>

          {/* Add New Topic Section */}
          <div className="mb-8">
            <div className="glass-morphism rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 gradient-text">Add New Learning Topic</h3>
              <div className="flex space-x-4">
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="flex-1 px-4 py-2 bg-dark-700/50 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a topic...</option>
                  {availableTopics
                    .filter(topic => !userProfile.progress || !userProfile.progress[topic])
                    .map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))
                  }
                </select>
                <button
                  onClick={addNewTopic}
                  disabled={!selectedTopic}
                  className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300"
                >
                  Add Topic
                </button>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Personal Progress */}
            <div className="glass-morphism rounded-2xl p-6 hover-lift">
              <h3 className="text-xl font-bold mb-6 gradient-text">Your Progress</h3>
              
              {progressEntries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-dark-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-dark-300">No learning topics yet. Add your first topic above!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {progressEntries.map(([topic, progress], index) => (
                    <div key={index} className="bg-dark-700/30 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-white">{topic}</h4>
                        <span className="text-primary-400 font-bold">{progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-dark-600 rounded-full h-2 mb-3">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-dark-300 text-sm">{progress.completed} / {progress.total} completed</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateTopicProgress(topic, Math.max(0, progress.completed - 1), progress.total)}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => updateTopicProgress(topic, Math.min(progress.total, progress.completed + 1), progress.total)}
                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clan Progress */}
            <div className="glass-morphism rounded-2xl p-6 hover-lift">
              <h3 className="text-xl font-bold mb-6 gradient-text">
                {userProfile.clanId ? 'Clan Leaderboard' : 'Join a Clan (Optional)'}
              </h3>
              
              {!userProfile.clanId ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-dark-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-dark-300 mb-4">You're not in a clan yet. Join one to compete with others!</p>
                  <button className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all duration-300">
                    Browse Clans
                  </button>
                </div>
              ) : clanMembers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                  <p className="text-dark-300">Loading clan members...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clanMembers
                    .sort((a, b) => b.overallProgress - a.overallProgress)
                    .map((member, index) => (
                      <div key={member.uid} className="bg-dark-700/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <span className="text-primary-400 font-bold text-lg">#{index + 1}</span>
                            </div>
                            <img 
                              src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=ffffff`}
                              alt={member.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <h4 className="font-semibold text-white">{member.name}</h4>
                              <p className="text-dark-400 text-sm">{member.profile?.points || 0} points</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary-400">
                              {member.overallProgress}%
                            </div>
                            <div className="text-dark-400 text-sm">
                              {Object.keys(member.progress || {}).length} topics
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>

          {/* Recommended Courses */}
          <div className="glass-morphism rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-6 gradient-text">Recommended Courses</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTopics
                .filter(topic => 
                  (!userProfile.progress || !userProfile.progress[topic]) &&
                  topic.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 6)
                .map((topic, index) => (
                  <div key={index} className="bg-dark-700/30 rounded-xl p-4 hover:bg-dark-600/30 transition-all duration-300 cursor-pointer">
                    <h4 className="font-semibold text-white mb-2">{topic}</h4>
                    <p className="text-dark-400 text-sm mb-3">Master the fundamentals and advance your skills</p>
                    <button
                      onClick={() => {
                        setSelectedTopic(topic);
                        addNewTopic();
                      }}
                      className="w-full px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-lg text-sm font-medium transition-all duration-300"
                    >
                      Start Learning
                    </button>
                  </div>
                ))
              }
            </div>
            
            {availableTopics.filter(topic => 
              (!userProfile.progress || !userProfile.progress[topic]) &&
              topic.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-8">
                <p className="text-dark-300">No courses found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
