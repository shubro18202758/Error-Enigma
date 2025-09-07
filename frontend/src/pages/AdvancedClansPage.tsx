import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdvancedClanSystem, { Clan, ClanMember, Challenge, ClanActivity } from '../services/AdvancedClanSystem';

const AdvancedClansPage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [clanSystem, setClanSystem] = useState<AdvancedClanSystem | null>(null);
  const [clanData, setClanData] = useState<Clan | null>(null);
  const [currentMember, setCurrentMember] = useState<ClanMember | null>(null);
  const [recentActivities, setRecentActivities] = useState<ClanActivity[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<ClanMember[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'challenges' | 'leaderboard' | 'create'>('overview');
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  // New challenge form
  const [newChallenge, setNewChallenge] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    topic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    targetMember: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    // Initialize advanced clan system
    const system = new AdvancedClanSystem(currentUser);
    setClanSystem(system);

    // Load initial data
    setTimeout(() => {
      const clan = system.getClanData();
      const member = system.getCurrentMember();
      
      setClanData(clan);
      setCurrentMember(member);
      setRecentActivities(system.getRecentActivities(15));
      setActiveChallenges(system.getActiveChallenges());
      setLeaderboard(system.getLeaderboard());
    }, 100);

  }, [currentUser, navigate]);

  useEffect(() => {
    if (!clanSystem) return;

    // Listen for real-time updates
    const handleActivityUpdate = (activity: ClanActivity) => {
      setRecentActivities(prev => [activity, ...prev.slice(0, 14)]);
      setNotifications(prev => [`${activity.memberName} ${activity.description}`, ...prev.slice(0, 4)]);
      
      // Update leaderboard
      setLeaderboard(clanSystem.getLeaderboard());
      
      // Update current member data
      const updatedMember = clanSystem.getCurrentMember();
      if (updatedMember) {
        setCurrentMember(updatedMember);
      }
    };

    const handleChallengeUpdate = (challenge: Challenge) => {
      setActiveChallenges(prev => [challenge, ...prev.slice(0, 9)]);
      setNotifications(prev => [`New ${challenge.difficulty} challenge: ${challenge.topic}`, ...prev.slice(0, 4)]);
    };

    clanSystem.onActivityUpdate(handleActivityUpdate);
    clanSystem.onChallengeUpdate(handleChallengeUpdate);

    return () => {
      // Cleanup would go here in a real implementation
    };
  }, [clanSystem]);

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

  const handleCreateChallenge = () => {
    if (!clanSystem) return;
    
    try {
      const challenge = clanSystem.createChallenge(
        newChallenge.question,
        newChallenge.options,
        newChallenge.correctAnswer,
        newChallenge.explanation,
        newChallenge.topic,
        newChallenge.difficulty,
        newChallenge.targetMember || undefined
      );
      
      // Reset form
      setNewChallenge({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        topic: '',
        difficulty: 'medium',
        targetMember: ''
      });
      
      setActiveTab('challenges');
      setNotifications(prev => [`You created a challenge!`, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const handleAnswerChallenge = (challengeId: string, answer: number) => {
    if (!clanSystem) return;
    
    const timeSpent = 45; // Simulate time spent
    const isCorrect = clanSystem.respondToChallenge(challengeId, answer, timeSpent);
    
    const challenge = activeChallenges.find(c => c.id === challengeId);
    if (challenge) {
      setNotifications(prev => [
        isCorrect ? `Correct! +${challenge.points} points` : `Incorrect. The answer was: ${challenge.options[challenge.correctAnswer]}`,
        ...prev.slice(0, 4)
      ]);
    }
    
    setSelectedChallenge(null);
    setShowChallengeModal(false);
    
    // Update data
    setLeaderboard(clanSystem.getLeaderboard());
    setCurrentMember(clanSystem.getCurrentMember());
  };

  const formatTimeAgo = (date: Date | string | number) => {
    const now = new Date();
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Unknown';
    }
    
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getActivityIcon = (type: ClanActivity['type']) => {
    switch (type) {
      case 'course_started': return '📚';
      case 'course_completed': return '🎉';
      case 'achievement': return '🏆';
      case 'challenge_created': return '⚡';
      case 'challenge_completed': return '✅';
      case 'level_up': return '🚀';
      case 'quiz_passed': return '📝';
      default: return '💫';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/20';
      default: return 'text-blue-400 bg-blue-400/20';
    }
  };

  if (!clanData || !currentMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your clan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/')} className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                EduVerse
              </button>
              <span className="text-slate-400">|</span>
              <h1 className="text-xl font-semibold text-white">🛡️ {clanData.name}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Live notifications */}
              {notifications.length > 0 && (
                <div className="hidden md:flex items-center space-x-2 bg-blue-600/20 text-blue-300 px-3 py-2 rounded-lg border border-blue-500/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">{notifications[0]}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-3 bg-white/10 rounded-lg px-3 py-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{currentMember.name}</p>
                  <p className="text-xs text-slate-400">Level {currentMember.level} • {currentMember.points} pts</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {currentMember.avatar || currentMember.name[0]}
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-black/10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: '🏠 Overview', icon: '🏠' },
              { id: 'challenges', label: '⚡ Challenges', icon: '⚡' },
              { id: 'leaderboard', label: '🏆 Leaderboard', icon: '🏆' },
              { id: 'create', label: '➕ Create Challenge', icon: '➕' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Clan Stats */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">🛡️ Clan Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Members</span>
                    <span className="text-white font-medium">{clanData.members.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Clan Level</span>
                    <span className="text-blue-400 font-medium">Level {clanData.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Points</span>
                    <span className="text-purple-400 font-medium">{clanData.totalPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Members</span>
                    <span className="text-green-400 font-medium">
                      {clanData.members.filter(m => m.isOnline).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Online Members */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">👥 Online Members</h3>
                <div className="space-y-3">
                  {clanData.members.filter(m => m.isOnline).map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {member.avatar || member.name[0]}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{member.name}</p>
                        <p className="text-slate-400 text-xs">
                          {member.currentCourse ? `Studying ${member.currentCourse}` : `Level ${member.level}`}
                        </p>
                      </div>
                      {member.currentProgress && (
                        <div className="text-blue-400 text-xs font-medium">
                          {member.currentProgress}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">🔥 Live Activity Feed</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          <span className="font-medium text-blue-400">{activity.memberName}</span>
                          {' '}
                          <span>{activity.description}</span>
                          {activity.points && (
                            <span className="text-green-400 font-medium ml-1">+{activity.points} pts</span>
                          )}
                        </p>
                        <p className="text-slate-400 text-xs mt-1">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                  
                  {recentActivities.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No recent activity. Be the first to start learning!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">⚡ Active Challenges</h2>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Challenge
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeChallenges.map((challenge) => (
                <div key={challenge.id} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                    <span className="text-slate-400 text-xs">{challenge.points} pts</span>
                  </div>
                  
                  <h3 className="text-white font-semibold mb-2">{challenge.topic}</h3>
                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">{challenge.question}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-400">
                      By {clanData.members.find(m => m.id === challenge.createdBy)?.name || 'Unknown'}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setShowChallengeModal(true);
                      }}
                      disabled={challenge.responses.some(r => r.memberId === currentMember.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        challenge.responses.some(r => r.memberId === currentMember.id)
                          ? 'bg-green-600/20 text-green-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {challenge.responses.some(r => r.memberId === currentMember.id) ? 'Completed ✓' : 'Answer'}
                    </button>
                  </div>
                  
                  {challenge.responses.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-slate-400 mb-1">
                        {challenge.responses.length} response{challenge.responses.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex -space-x-2">
                        {challenge.responses.slice(0, 3).map((response, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold"
                          >
                            {response.memberName[0]}
                          </div>
                        ))}
                        {challenge.responses.length > 3 && (
                          <div className="w-6 h-6 bg-slate-700 rounded-full border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold">
                            +{challenge.responses.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {activeChallenges.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">⚡</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Active Challenges</h3>
                  <p className="text-slate-400 mb-4">Be the first to create a challenge for your clan!</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create First Challenge
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">🏆 Clan Leaderboard</h2>
            
            <div className="space-y-4">
              {leaderboard.map((member, index) => (
                <div key={member.id} className={`flex items-center space-x-4 p-4 rounded-xl transition-colors ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border border-yellow-400/20' : 'bg-white/5 hover:bg-white/10'
                }`}>
                  <div className="flex items-center justify-center w-8 h-8">
                    {index === 0 && <span className="text-2xl">🥇</span>}
                    {index === 1 && <span className="text-2xl">🥈</span>}
                    {index === 2 && <span className="text-2xl">🥉</span>}
                    {index > 2 && <span className="text-slate-400 font-bold">#{index + 1}</span>}
                  </div>
                  
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {member.avatar || member.name[0]}
                    </div>
                    {member.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-slate-900 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-semibold">{member.name}</h3>
                      {member.id === currentMember.id && (
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full">You</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">
                      Level {member.level} • {member.completedCourses.length} courses completed
                    </p>
                    {member.currentCourse && (
                      <p className="text-blue-400 text-xs">Currently: {member.currentCourse} ({member.currentProgress}%)</p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-400">{member.points.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">points</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">Last active</p>
                    <p className="text-white text-sm">{formatTimeAgo(member.lastActivity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">➕ Create New Challenge</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Challenge Topic</label>
                  <input
                    type="text"
                    value={newChallenge.topic}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., JavaScript Arrays, Machine Learning Basics"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Question</label>
                  <textarea
                    value={newChallenge.question}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter your challenge question..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Answer Options</label>
                  <div className="space-y-3">
                    {newChallenge.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="correct-answer"
                          checked={newChallenge.correctAnswer === index}
                          onChange={() => setNewChallenge(prev => ({ ...prev, correctAnswer: index }))}
                          className="text-blue-500 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newChallenge.options];
                            newOptions[index] = e.target.value;
                            setNewChallenge(prev => ({ ...prev, options: newOptions }));
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {newChallenge.correctAnswer === index && (
                          <span className="text-green-400 text-sm font-medium">✓ Correct</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Explanation</label>
                  <textarea
                    value={newChallenge.explanation}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, explanation: e.target.value }))}
                    placeholder="Explain why the correct answer is right..."
                    rows={2}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                    <select
                      value={newChallenge.difficulty}
                      onChange={(e) => setNewChallenge(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Easy (50 pts)</option>
                      <option value="medium">Medium (75 pts)</option>
                      <option value="hard">Hard (100 pts)</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Member (Optional)</label>
                    <select
                      value={newChallenge.targetMember}
                      onChange={(e) => setNewChallenge(prev => ({ ...prev, targetMember: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Everyone</option>
                      {clanData.members.filter(m => m.id !== currentMember.id).map((member) => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={handleCreateChallenge}
                    disabled={!newChallenge.question || !newChallenge.topic || newChallenge.options.some(opt => !opt.trim())}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    Create Challenge
                  </button>
                  <button
                    onClick={() => setActiveTab('challenges')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Challenge Modal */}
      {showChallengeModal && selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-white/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedChallenge.difficulty)}`}>
                  {selectedChallenge.difficulty} • {selectedChallenge.points} points
                </span>
                <h3 className="text-xl font-bold text-white mt-2">{selectedChallenge.topic}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedChallenge(null);
                  setShowChallengeModal(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 mb-4">{selectedChallenge.question}</p>
              
              <div className="space-y-3">
                {selectedChallenge.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerChallenge(selectedChallenge.id, index)}
                    className="w-full text-left p-4 bg-white/10 hover:bg-blue-600/20 border border-white/20 hover:border-blue-400/50 rounded-lg text-white transition-colors"
                  >
                    <span className="font-medium text-blue-400 mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-slate-400 text-sm">
                Created by {clanData.members.find(m => m.id === selectedChallenge.createdBy)?.name || 'Unknown'} • 
                Time limit: {selectedChallenge.timeLimit}s
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedClansPage;
