// Real Clans Service that connects to backend API

interface ApiClan {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  level: number;
  points: number;
  isPublic: boolean;
  createdAt: string;
  creatorId: string;
}

interface ApiUser {
  uid: string;
  name: string;
  email: string;
  totalPoints: number;
  currentStreak: number;
  totalCompleted: number;
  level: number;
}

interface ClanInvitation {
  id: number;
  clan_id: string;
  clan_name: string;
  clan_description: string;
  inviter_name: string;
  created_at: string;
}

interface ClanMember {
  user_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
  points_contributed: number;
  total_points: number;
  current_streak: number;
  level: number;
}

interface ClanActivity {
  id: number;
  activity_type: string;
  user_name: string;
  activity_data: string;
  points_earned: number;
  created_at: string;
}

interface UserClanData {
  id: string;
  name: string;
  description: string;
  role: string;
  joined_at: string;
  points_contributed: number;
  total_points: number;
  level: number;
  members: ClanMember[];
  recentActivity: ClanActivity[];
  memberCount: number;
}

class ClansService {
  private baseUrl = 'http://localhost:3001/api';
  private authToken: string | null = null;

  constructor() {
    // Get auth token from localStorage or context
    this.authToken = localStorage.getItem('authToken');
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get all public clans
  async getPublicClans(): Promise<ApiClan[]> {
    try {
      const response = await this.apiRequest('/clans');
      return response.clans || [];
    } catch (error) {
      console.error('Error fetching public clans:', error);
      return [];
    }
  }

  // Get user's current clan
  async getUserClan(): Promise<{ hasJoinedClan: boolean; clanData: UserClanData | null }> {
    try {
      const response = await this.apiRequest('/clans/my-clan');
      return {
        hasJoinedClan: response.hasJoinedClan,
        clanData: response.clanData
      };
    } catch (error) {
      console.error('Error fetching user clan:', error);
      return { hasJoinedClan: false, clanData: null };
    }
  }

  // Create a new clan
  async createClan(name: string, description: string, isPrivate: boolean = false): Promise<ApiClan> {
    try {
      const response = await this.apiRequest('/clans/create', {
        method: 'POST',
        body: JSON.stringify({ name, description, isPrivate }),
      });
      return response.clan;
    } catch (error) {
      console.error('Error creating clan:', error);
      throw error;
    }
  }

  // Join a clan
  async joinClan(clanId: string): Promise<boolean> {
    try {
      await this.apiRequest(`/clans/join/${clanId}`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('Error joining clan:', error);
      throw error;
    }
  }

  // Leave clan
  async leaveClan(): Promise<boolean> {
    try {
      await this.apiRequest('/clans/leave', {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('Error leaving clan:', error);
      throw error;
    }
  }

  // Search users for invitations
  async searchUsers(query: string): Promise<ApiUser[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }
      const response = await this.apiRequest(`/clans/search-users?q=${encodeURIComponent(query)}`);
      return response.users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Send clan invitation
  async sendInvitation(userId: string): Promise<boolean> {
    try {
      await this.apiRequest('/clans/invite', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      return true;
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  }

  // Get user's pending invitations
  async getPendingInvitations(): Promise<ClanInvitation[]> {
    try {
      const response = await this.apiRequest('/clans/invitations');
      return response.invitations || [];
    } catch (error) {
      console.error('Error fetching invitations:', error);
      return [];
    }
  }

  // Respond to invitation
  async respondToInvitation(invitationId: number, response: 'accept' | 'decline'): Promise<boolean> {
    try {
      await this.apiRequest(`/clans/invitations/${invitationId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      });
      return true;
    } catch (error) {
      console.error('Error responding to invitation:', error);
      throw error;
    }
  }

  // Update auth token
  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }
}

export default ClansService;
export type { ApiClan, ApiUser, ClanInvitation, ClanMember, ClanActivity, UserClanData };
