import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ClansService, { ApiClan, ApiUser, ClanInvitation, UserClanData } from '../services/ClansService';
import { Users, Plus, Search, Crown, Trophy, Calendar, Activity, UserPlus, Mail, Check, X } from 'lucide-react';

const RealClansPage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [clansService] = useState(new ClansService());
  
  // State
  const [activeTab, setActiveTab] = useState<'browse' | 'my-clan' | 'create' | 'invitations'>('browse');
  const [publicClans, setPublicClans] = useState<ApiClan[]>([]);
  const [userClan, setUserClan] = useState<UserClanData | null>(null);
  const [hasJoinedClan, setHasJoinedClan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [invitations, setInvitations] = useState<ClanInvitation[]>([]);
  
  // Create clan form
  const [createClanForm, setCreateClanForm] = useState({
    name: '',
    description: '',
    isPrivate: false
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    loadInitialData();
  }, [currentUser, navigate]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load public clans
      const clans = await clansService.getPublicClans();
      setPublicClans(clans);

      // Load user's clan
      const { hasJoinedClan: joined, clanData } = await clansService.getUserClan();
      setHasJoinedClan(joined);
      setUserClan(clanData);

      // Load invitations
      const pendingInvitations = await clansService.getPendingInvitations();
      setInvitations(pendingInvitations);

      // Set default tab based on clan status
      if (joined && clanData) {
        setActiveTab('my-clan');
      } else if (pendingInvitations.length > 0) {
        setActiveTab('invitations');
      } else {
        setActiveTab('browse');
      }
    } catch (error) {
      console.error('Error loading clan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClan = async (clanId: string) => {
    try {
      await clansService.joinClan(clanId);
      alert('Successfully joined clan!');
      loadInitialData(); // Reload data
    } catch (error) {
      alert('Failed to join clan. You may already be in a clan.');
    }
  };

  const handleCreateClan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createClanForm.name.trim()) {
      alert('Please enter a clan name');
      return;
    }
    
    try {
      await clansService.createClan(
        createClanForm.name,
        createClanForm.description,
        createClanForm.isPrivate
      );
      alert('Clan created successfully!');
      setCreateClanForm({ name: '', description: '', isPrivate: false });
      loadInitialData();
    } catch (error) {
      alert('Failed to create clan');
    }
  };

  const handleLeaveClan = async () => {
    if (!window.confirm('Are you sure you want to leave this clan?')) return;
    
    try {
      await clansService.leaveClan();
      alert('Left clan successfully');
      loadInitialData();
    } catch (error) {
      alert('Failed to leave clan');
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = await clansService.searchUsers(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSendInvitation = async (userId: string) => {
    try {
      await clansService.sendInvitation(userId);
      alert('Invitation sent successfully!');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      alert('Failed to send invitation');
    }
  };

  const handleInvitationResponse = async (invitationId: number, response: 'accept' | 'decline') => {
    try {
      await clansService.respondToInvitation(invitationId, response);
      alert(response === 'accept' ? 'Invitation accepted!' : 'Invitation declined');
      loadInitialData();
    } catch (error) {
      alert('Failed to respond to invitation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Learning Clans</h1>
              <p className="text-gray-600 mt-2">Connect, collaborate, and learn together</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'browse', name: 'Browse Clans', icon: Search },
                { id: 'my-clan', name: hasJoinedClan ? 'My Clan' : 'No Clan', icon: Users },
                { id: 'create', name: 'Create Clan', icon: Plus },
                { id: 'invitations', name: `Invitations (${invitations.length})`, icon: Mail }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Browse Clans Tab */}
          {activeTab === 'browse' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Public Clans</h2>
              {publicClans.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No public clans available. Be the first to create one!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicClans.map((clan) => (
                    <div key={clan.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{clan.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{clan.description}</p>
                        </div>
                        <Crown className="w-5 h-5 text-yellow-500" />
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center justify-between">
                          <span>Members:</span>
                          <span className="font-medium">{clan.memberCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Level:</span>
                          <span className="font-medium">{clan.level}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Points:</span>
                          <span className="font-medium">{clan.points.toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinClan(clan.id)}
                        disabled={hasJoinedClan}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          hasJoinedClan
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {hasJoinedClan ? 'Already in a clan' : 'Join Clan'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Clan Tab */}
          {activeTab === 'my-clan' && (
            <div>
              {hasJoinedClan && userClan ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{userClan.name}</h2>
                      <p className="text-gray-600">{userClan.description}</p>
                    </div>
                    <button
                      onClick={handleLeaveClan}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Leave Clan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <Trophy className="w-6 h-6 text-blue-600 mb-2" />
                      <div className="text-2xl font-bold text-blue-900">{userClan.total_points}</div>
                      <div className="text-sm text-blue-600">Total Points</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <Users className="w-6 h-6 text-green-600 mb-2" />
                      <div className="text-2xl font-bold text-green-900">{userClan.memberCount}</div>
                      <div className="text-sm text-green-600">Members</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <Crown className="w-6 h-6 text-purple-600 mb-2" />
                      <div className="text-2xl font-bold text-purple-900">{userClan.level}</div>
                      <div className="text-sm text-purple-600">Clan Level</div>
                    </div>
                  </div>

                  {/* Invite Members Section */}
                  {(userClan.role === 'admin' || userClan.role === 'moderator') && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Members</h3>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search users by name or email..."
                          value={searchQuery}
                          onChange={(e) => handleSearchUsers(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {searchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map((user) => (
                              <div key={user.uid} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                  <div className="text-xs text-gray-400">
                                    Level {user.level} • {user.totalPoints} points
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleSendInvitation(user.uid)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                                >
                                  Invite
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Members List */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Members ({userClan.memberCount})</h3>
                    <div className="space-y-3">
                      {userClan.members.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {member.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{member.name || 'Anonymous User'}</div>
                              <div className="text-sm text-gray-500">
                                {member.role} • Level {member.level || 1}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{member.points_contributed || 0}</div>
                            <div className="text-sm text-gray-500">points contributed</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    {userClan.recentActivity.length === 0 ? (
                      <p className="text-gray-500">No recent activity</p>
                    ) : (
                      <div className="space-y-3">
                        {userClan.recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Activity className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                              <span className="text-gray-900">{activity.user_name}</span>
                              <span className="text-gray-600 ml-1">
                                {activity.activity_type.replace('_', ' ')}
                              </span>
                              {activity.points_earned > 0 && (
                                <span className="text-green-600 ml-2">+{activity.points_earned} points</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(activity.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">You haven't joined a clan yet</h3>
                  <p className="text-gray-500 mb-6">Join a clan to connect with other learners and collaborate on your learning journey.</p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Clans
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create Clan Tab */}
          {activeTab === 'create' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Clan</h2>
              {hasJoinedClan ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Already in a clan</h3>
                  <p className="text-gray-500">You need to leave your current clan before creating a new one.</p>
                </div>
              ) : (
                <form onSubmit={handleCreateClan} className="max-w-lg">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clan Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createClanForm.name}
                      onChange={(e) => setCreateClanForm({ ...createClanForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter clan name (min 3 characters)"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={createClanForm.description}
                      onChange={(e) => setCreateClanForm({ ...createClanForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Describe your clan's purpose and goals"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={createClanForm.isPrivate}
                        onChange={(e) => setCreateClanForm({ ...createClanForm, isPrivate: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Private clan (invite only)</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Clan
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Clan Invitations</h2>
              {invitations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending invitations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{invitation.clan_name}</h3>
                          <p className="text-gray-600 mt-1">{invitation.clan_description}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Invited by: <span className="font-medium">{invitation.inviter_name}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(invitation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleInvitationResponse(invitation.id, 'decline')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1"
                          >
                            <X className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealClansPage;
