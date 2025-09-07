const { databaseService } = require('../config/database');

class Clans {
  // Create clans tables if they don't exist
  static async initializeTable() {
    try {
      // Create clans table
      await databaseService.run(`
        CREATE TABLE IF NOT EXISTS clans (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          creator_id TEXT NOT NULL,
          is_private BOOLEAN DEFAULT 0,
          member_count INTEGER DEFAULT 1,
          total_points INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create clan members table
      await databaseService.run(`
        CREATE TABLE IF NOT EXISTS clan_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clan_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT DEFAULT 'member',
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          points_contributed INTEGER DEFAULT 0
        )
      `);

      // Create clan invitations table
      await databaseService.run(`
        CREATE TABLE IF NOT EXISTS clan_invitations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clan_id TEXT NOT NULL,
          inviter_id TEXT NOT NULL,
          invited_user_id TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create clan activities table  
      await databaseService.run(`
        CREATE TABLE IF NOT EXISTS clan_activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clan_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          activity_type TEXT NOT NULL,
          activity_data TEXT,
          points_earned INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Clans tables initialized');
    } catch (error) {
      console.error('❌ Error initializing clans tables:', error);
      throw error;
    }
  }

  // Create a new clan
  static async createClan(creatorId, name, description, isPrivate = false) {
    try {
      const clanId = `clan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create clan
      await databaseService.run(`
        INSERT INTO clans (id, name, description, creator_id, is_private)
        VALUES (?, ?, ?, ?, ?)
      `, [clanId, name, description, creatorId, isPrivate ? 1 : 0]);

      // Add creator as admin member
      await databaseService.run(`
        INSERT INTO clan_members (clan_id, user_id, role)
        VALUES (?, ?, 'admin')
      `, [clanId, creatorId]);

      return { id: clanId, name, description, creator_id: creatorId, is_private: isPrivate };
    } catch (error) {
      console.error('Error creating clan:', error);
      throw error;
    }
  }

  // Get all public clans
  static async getPublicClans() {
    try {
      const clans = await databaseService.all(`
        SELECT 
          c.*,
          COUNT(cm.user_id) as actual_member_count
        FROM clans c
        LEFT JOIN clan_members cm ON c.id = cm.clan_id
        WHERE c.is_private = 0
        GROUP BY c.id
        ORDER BY c.total_points DESC, c.created_at DESC
      `);
      return clans || [];
    } catch (error) {
      console.error('Error fetching public clans:', error);
      return [];
    }
  }

  // Get user's clan
  static async getUserClan(userId) {
    try {
      const clan = await databaseService.get(`
        SELECT 
          c.*,
          cm.role,
          cm.joined_at,
          cm.points_contributed
        FROM clans c
        JOIN clan_members cm ON c.id = cm.clan_id
        WHERE cm.user_id = ?
      `, [userId]);
      return clan;
    } catch (error) {
      console.error('Error fetching user clan:', error);
      return null;
    }
  }

  // Join clan
  static async joinClan(clanId, userId) {
    try {
      await databaseService.run(`
        INSERT INTO clan_members (clan_id, user_id)
        VALUES (?, ?)
      `, [clanId, userId]);

      // Update member count
      await databaseService.run(`
        UPDATE clans SET member_count = member_count + 1 WHERE id = ?
      `, [clanId]);

      return true;
    } catch (error) {
      console.error('Error joining clan:', error);
      throw error;
    }
  }

  // Get clan members with their details
  static async getClanMembers(clanId) {
    try {
      const members = await databaseService.all(`
        SELECT 
          cm.*,
          up.name,
          up.email,
          up.total_points,
          up.current_streak,
          up.lessons_completed,
          up.quizzes_completed,
          up.projects_completed
        FROM clan_members cm
        LEFT JOIN user_progress up ON cm.user_id = up.uid
        WHERE cm.clan_id = ?
        ORDER BY cm.points_contributed DESC, cm.joined_at ASC
      `, [clanId]);
      return members || [];
    } catch (error) {
      console.error('Error fetching clan members:', error);
      return [];
    }
  }

  // Send clan invitation
  static async sendInvitation(clanId, inviterId, invitedUserId) {
    try {
      await databaseService.run(`
        INSERT OR REPLACE INTO clan_invitations (clan_id, inviter_id, invited_user_id, status)
        VALUES (?, ?, ?, 'pending')
      `, [clanId, inviterId, invitedUserId]);
      return true;
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  }

  // Get user's pending invitations
  static async getUserInvitations(userId) {
    try {
      const invitations = await databaseService.all(`
        SELECT 
          ci.*,
          c.name as clan_name,
          c.description as clan_description,
          up.name as inviter_name
        FROM clan_invitations ci
        JOIN clans c ON ci.clan_id = c.id
        LEFT JOIN user_progress up ON ci.inviter_id = up.uid
        WHERE ci.invited_user_id = ? AND ci.status = 'pending'
        ORDER BY ci.created_at DESC
      `, [userId]);
      return invitations || [];
    } catch (error) {
      console.error('Error fetching user invitations:', error);
      return [];
    }
  }

  // Accept/decline invitation
  static async respondToInvitation(invitationId, userId, response) {
    try {
      const invitation = await databaseService.get(`
        SELECT * FROM clan_invitations WHERE id = ? AND invited_user_id = ?
      `, [invitationId, userId]);
      
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (response === 'accept') {
        // Join the clan
        await this.joinClan(invitation.clan_id, userId);
      }

      // Update invitation status
      await databaseService.run(`
        UPDATE clan_invitations SET status = ? WHERE id = ?
      `, [response === 'accept' ? 'accepted' : 'declined', invitationId]);

      return true;
    } catch (error) {
      console.error('Error responding to invitation:', error);
      throw error;
    }
  }

  // Add activity to clan
  static async addActivity(clanId, userId, activityType, activityData = {}, pointsEarned = 0) {
    try {
      await databaseService.run(`
        INSERT INTO clan_activities (clan_id, user_id, activity_type, activity_data, points_earned)
        VALUES (?, ?, ?, ?, ?)
      `, [clanId, userId, activityType, JSON.stringify(activityData), pointsEarned]);

      // Update clan total points
      await databaseService.run(`
        UPDATE clans SET total_points = total_points + ? WHERE id = ?
      `, [pointsEarned, clanId]);

      // Update member points contribution
      await databaseService.run(`
        UPDATE clan_members SET points_contributed = points_contributed + ? 
        WHERE clan_id = ? AND user_id = ?
      `, [pointsEarned, clanId, userId]);

      return true;
    } catch (error) {
      console.error('Error adding clan activity:', error);
      return false;
    }
  }

  // Get clan activities
  static async getClanActivities(clanId, limit = 20) {
    try {
      const activities = await databaseService.all(`
        SELECT 
          ca.*,
          up.name as user_name
        FROM clan_activities ca
        LEFT JOIN user_progress up ON ca.user_id = up.uid
        WHERE ca.clan_id = ?
        ORDER BY ca.created_at DESC
        LIMIT ?
      `, [clanId, limit]);
      return activities || [];
    } catch (error) {
      console.error('Error fetching clan activities:', error);
      return [];
    }
  }

  // Search users by email or name for invitations
  static async searchUsers(searchQuery, excludeUserId) {
    try {
      const users = await databaseService.all(`
        SELECT 
          uid,
          name,
          email,
          total_points,
          current_streak,
          lessons_completed + quizzes_completed + projects_completed as total_completed
        FROM user_progress
        WHERE (LOWER(name) LIKE ? OR LOWER(email) LIKE ?) 
        AND uid != ?
        ORDER BY total_points DESC
        LIMIT 20
      `, [`%${searchQuery.toLowerCase()}%`, `%${searchQuery.toLowerCase()}%`, excludeUserId]);
      return users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Leave clan
  static async leaveClan(clanId, userId) {
    try {
      await databaseService.run(`
        DELETE FROM clan_members WHERE clan_id = ? AND user_id = ?
      `, [clanId, userId]);

      // Update member count
      await databaseService.run(`
        UPDATE clans SET member_count = member_count - 1 WHERE id = ?
      `, [clanId]);

      return true;
    } catch (error) {
      console.error('Error leaving clan:', error);
      throw error;
    }
  }
}

module.exports = Clans;
