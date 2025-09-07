import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Clan {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  level: number;
  points: number;
  activeChallenges: number;
  isPrivate: boolean;
  stats: {
    totalPoints: number;
    averageProgress: number;
    activeMembers: number;
  };
}

interface UserClan {
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

const ClansPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [availableClans, setAvailableClans] = useState<Clan[]>([]);
  const [userClan, setUserClan] = useState<UserClan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-clan' | 'create'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [createClanForm, setCreateClanForm] = useState({
    name: '',
    description: '',
    isPrivate: false
  });

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
      loadClansData();
    } else {
      navigate('/signin');
    }
  }, [currentUser, navigate]);

  const loadClansData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [clansResponse, userClanResponse] = await Promise.all([
        apiRequest('/api/clans'),
        apiRequest('/api/clans/my-clan').catch(() => ({ success: false }))
      ]);

      if (clansResponse.success) {
        setAvailableClans(clansResponse.clans || []);
      }

      if (userClanResponse.success) {
        setUserClan(userClanResponse.clan);
        setActiveTab('my-clan');
      }

    } catch (error) {
      console.error('Error loading clans data:', error);
      setError('Failed to load clans data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const joinClan = async (clanId: string) => {
    try {
      const response = await apiRequest(`/api/clans/${clanId}/join`, {
        method: 'POST'
      });

      if (response.success) {
        await loadClansData(); // Refresh data
        setActiveTab('my-clan');
      } else {
        setError(response.message || 'Failed to join clan');
      }
    } catch (error) {
      console.error('Error joining clan:', error);
      setError('Failed to join clan. Please try again.');
    }
  };

  const createClan = async () => {
    try {
      if (!createClanForm.name.trim()) {
        setError('Clan name is required');
        return;
      }

      const response = await apiRequest('/api/clans/create', {
        method: 'POST',
        body: JSON.stringify(createClanForm)
      });

      if (response.success) {
        await loadClansData();
        setActiveTab('my-clan');
        setCreateClanForm({ name: '', description: '', isPrivate: false });
      } else {
        setError(response.message || 'Failed to create clan');
      }
    } catch (error) {
      console.error('Error creating clan:', error);
      setError('Failed to create clan. Please try again.');
    }
  };

  const filteredClans = availableClans.filter(clan =>
    clan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clan.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="professional-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="professional-text">Loading clans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="professional-main">
      {/* Header */}
      <header className="professional-header">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="professional-heading-3 mb-0">Clans & Communities</h1>
                <p className="professional-text--small">Connect, collaborate, and compete</p>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 professional-button professional-button--secondary"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/5 backdrop-blur-lg rounded-lg p-1 border border-white/10">
            {[
              { id: 'browse', label: 'Browse Clans', icon: '🔍' },
              { id: 'my-clan', label: 'My Clan', icon: '👥', disabled: !userClan },
              { id: 'create', label: 'Create Clan', icon: '➕' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                disabled={tab.disabled}
                className={`professional-tab ${
                  activeTab === tab.id ? 'professional-tab--active' : ''
                } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'browse' && (
            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search clans by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="professional-input"
                  />
                </div>
                <button
                  onClick={loadClansData}
                  className="professional-button professional-button--secondary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClans.map((clan) => (
                  <div key={clan.id} className="professional-card p-6 hover-lift">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="professional-heading-3 mb-1">{clan.name}</h3>
                        <p className="professional-text--small">{clan.description}</p>
                      </div>
                      {clan.isPrivate && (
                        <div className="professional-badge professional-badge--warning">
                          🔒 Private
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-blue-400">{clan.memberCount}</div>
                        <div className="professional-text--small">Members</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-400">{clan.level}</div>
                        <div className="professional-text--small">Level</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="professional-text--muted">Total Points:</span>
                        <span className="professional-text">{clan.points.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="professional-text--muted">Active Challenges:</span>
                        <span className="text-orange-400">{clan.activeChallenges}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="professional-text--muted">Average Progress:</span>
                        <span className="text-purple-400">{clan.stats.averageProgress}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => joinClan(clan.id)}
                      className="w-full professional-button professional-button--primary"
                      disabled={userClan !== null}
                    >
                      {userClan ? 'Already in a Clan' : 'Join Clan'}
                    </button>
                  </div>
                ))}
              </div>

              {filteredClans.length === 0 && (
                <div className="professional-card p-8 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="professional-heading-3">No clans found</h3>
                  <p className="professional-text">Try adjusting your search or create a new clan.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-clan' && userClan && (
            <div className="space-y-6">
              {/* Clan Overview */}
              <div className="professional-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="professional-heading-2">{userClan.name}</h2>
                    <p className="professional-text">{userClan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-400">{userClan.level}</div>
                    <div className="professional-text--small">Clan Level</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">{userClan.memberCount}</div>
                    <div className="professional-text--small">Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{userClan.points.toLocaleString()}</div>
                    <div className="professional-text--small">Clan Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-400">{userClan.challenges.filter(c => c.status === 'active').length}</div>
                    <div className="professional-text--small">Active Challenges</div>
                  </div>
                </div>
              </div>

              {/* Active Challenges */}
              <div className="professional-card p-6">
                <h3 className="professional-heading-3 mb-4">🏆 Active Challenges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userClan.challenges
                    .filter(c => c.status === 'active')
                    .map((challenge) => (
                    <div key={challenge.id} className="glass-effect rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="professional-text font-semibold">{challenge.title}</h4>
                        <div className={`professional-badge ${
                          challenge.type === 'competition' ? 'professional-badge--error' :
                          challenge.type === 'project' ? 'professional-badge--warning' :
                          'professional-badge--primary'
                        }`}>
                          {challenge.type}
                        </div>
                      </div>
                      <p className="professional-text--small mb-3">{challenge.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="professional-text--small">
                          {challenge.participants} participants
                        </span>
                        <button className="professional-button professional-button--success">
                          Join Challenge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clan Members */}
              <div className="professional-card p-6">
                <h3 className="professional-heading-3 mb-4">👥 Clan Members</h3>
                <div className="space-y-3">
                  {userClan.members.map((member) => (
                    <div key={member.uid} className="flex items-center justify-between p-3 rounded-lg glass-effect">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="professional-text font-medium">{member.name}</div>
                          <div className="professional-text--small">
                            Level {member.level} • {member.points.toLocaleString()} points
                          </div>
                        </div>
                      </div>
                      <div className={`professional-badge ${
                        member.role === 'leader' ? 'professional-badge--warning' :
                        member.role === 'moderator' ? 'professional-badge--primary' :
                        'professional-badge--success'
                      }`}>
                        {member.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="professional-card p-6">
                <h3 className="professional-heading-3 mb-4">📈 Recent Activity</h3>
                <div className="space-y-3">
                  {userClan.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg glass-effect">
                      <div className="text-2xl">{activity.icon}</div>
                      <div className="flex-1">
                        <div className="professional-text">{activity.description}</div>
                        <div className="professional-text--small">
                          by {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="max-w-2xl mx-auto">
              <div className="professional-card p-8">
                <h2 className="professional-heading-2 mb-6">🏗️ Create a New Clan</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block professional-text--small mb-2">Clan Name *</label>
                    <input
                      type="text"
                      placeholder="Enter an awesome clan name..."
                      value={createClanForm.name}
                      onChange={(e) => setCreateClanForm({...createClanForm, name: e.target.value})}
                      className="professional-input"
                      maxLength={50}
                    />
                    <div className="professional-text--small text-right mt-1">
                      {createClanForm.name.length}/50
                    </div>
                  </div>

                  <div>
                    <label className="block professional-text--small mb-2">Description</label>
                    <textarea
                      placeholder="Describe your clan's mission and goals..."
                      value={createClanForm.description}
                      onChange={(e) => setCreateClanForm({...createClanForm, description: e.target.value})}
                      rows={4}
                      className="professional-input resize-none"
                      maxLength={200}
                    />
                    <div className="professional-text--small text-right mt-1">
                      {createClanForm.description.length}/200
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={createClanForm.isPrivate}
                      onChange={(e) => setCreateClanForm({...createClanForm, isPrivate: e.target.checked})}
                      className="w-4 h-4 text-blue-600 bg-transparent border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPrivate" className="professional-text">
                      Make this a private clan (requires approval to join)
                    </label>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex space-x-4">
                      <button
                        onClick={createClan}
                        disabled={!createClanForm.name.trim()}
                        className="flex-1 professional-button professional-button--primary"
                      >
                        Create Clan
                      </button>
                      <button
                        onClick={() => setCreateClanForm({ name: '', description: '', isPrivate: false })}
                        className="professional-button professional-button--secondary"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClansPage;
