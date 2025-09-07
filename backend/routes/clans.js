const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Clans = require('../models/ClansSimple');
const UserProgress = require('../models/UserProgress');

const router = express.Router();

// Get all public clans (for browsing)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const clans = await Clans.getPublicClans();
    
    // Format clans data
    const formattedClans = clans.map(clan => ({
      id: clan.id,
      name: clan.name,
      description: clan.description,
      memberCount: clan.actual_member_count || 0,
      level: Math.floor(clan.total_points / 1000) + 1,
      points: clan.total_points,
      isPublic: !clan.is_private,
      createdAt: clan.created_at,
      creatorId: clan.creator_id
    }));

    res.json({
      success: true,
      clans: formattedClans,
      total: formattedClans.length
    });
  } catch (error) {
    console.error('Error fetching clans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clans'
    });
  }
});

// Get user's current clan
router.get('/my-clan', authenticateToken, async (req, res) => {
  try {
    const userClan = await Clans.getUserClan(req.user.uid);
    
    if (userClan) {
      const members = await Clans.getClanMembers(userClan.id);
      const activities = await Clans.getClanActivities(userClan.id, 10);
      
      res.json({
        success: true,
        hasJoinedClan: true,
        clanData: {
          ...userClan,
          level: Math.floor(userClan.total_points / 1000) + 1,
          members: members,
          recentActivity: activities,
          memberCount: members.length
        }
      });
    } else {
      res.json({
        success: true,
        hasJoinedClan: false,
        clanData: null,
        message: 'You haven\'t joined a clan yet. Browse available clans to join one!'
      });
    }
  } catch (error) {
    console.error('Error fetching user clan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clan information'
    });
  }
});

// Join a clan
router.post('/join/:clanId', authenticateToken, async (req, res) => {
  try {
    const { clanId } = req.params;
    
    // Check if user is already in a clan
    const existingClan = await Clans.getUserClan(req.user.uid);
    if (existingClan) {
      return res.status(400).json({
        success: false,
        error: 'You are already a member of a clan. Leave your current clan first.'
      });
    }
    
    await Clans.joinClan(clanId, req.user.uid);
    
    // Add join activity
    await Clans.addActivity(clanId, req.user.uid, 'member_joined', {
      memberName: req.user.name || 'New Member'
    }, 10);
    
    res.json({
      success: true,
      message: `Successfully joined clan!`,
      clanId: clanId
    });
  } catch (error) {
    console.error('Error joining clan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join clan'
    });
  }
});

// Create a new clan
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, description, isPrivate = false } = req.body;
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Clan name must be at least 3 characters long'
      });
    }
    
    // Check if user is already in a clan
    const existingClan = await Clans.getUserClan(req.user.uid);
    if (existingClan) {
      return res.status(400).json({
        success: false,
        error: 'You are already a member of a clan. Leave your current clan first.'
      });
    }
    
    const newClan = await Clans.createClan(
      req.user.uid,
      name.trim(),
      description?.trim() || '',
      isPrivate
    );
    
    res.json({
      success: true,
      clan: {
        ...newClan,
        memberCount: 1,
        level: 1,
        points: 0
      },
      message: 'Clan created successfully!'
    });
  } catch (error) {
    console.error('Error creating clan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create clan'
    });
  }
});

// Search users for invitations
router.get('/search-users', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }
    
    const users = await Clans.searchUsers(q.trim(), req.user.uid);
    
    res.json({
      success: true,
      users: users.map(user => ({
        uid: user.uid,
        name: user.name || 'Anonymous User',
        email: user.email,
        totalPoints: user.total_points || 0,
        currentStreak: user.current_streak || 0,
        totalCompleted: user.total_completed || 0,
        level: Math.floor((user.total_points || 0) / 100) + 1
      }))
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

// Send clan invitation
router.post('/invite', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Check if user is in a clan and has permission
    const userClan = await Clans.getUserClan(req.user.uid);
    if (!userClan) {
      return res.status(400).json({
        success: false,
        error: 'You must be in a clan to send invitations'
      });
    }
    
    if (userClan.role !== 'admin' && userClan.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to invite members'
      });
    }
    
    await Clans.sendInvitation(userClan.id, req.user.uid, userId);
    
    res.json({
      success: true,
      message: 'Invitation sent successfully!'
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation'
    });
  }
});

// Get user's pending invitations
router.get('/invitations', authenticateToken, async (req, res) => {
  try {
    const invitations = await Clans.getUserInvitations(req.user.uid);
    
    res.json({
      success: true,
      invitations: invitations
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitations'
    });
  }
});

// Respond to clan invitation
router.post('/invitations/:invitationId/respond', authenticateToken, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { response } = req.body; // 'accept' or 'decline'
    
    if (!['accept', 'decline'].includes(response)) {
      return res.status(400).json({
        success: false,
        error: 'Response must be "accept" or "decline"'
      });
    }
    
    await Clans.respondToInvitation(invitationId, req.user.uid, response);
    
    res.json({
      success: true,
      message: response === 'accept' ? 'Invitation accepted! Welcome to the clan!' : 'Invitation declined.'
    });
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to respond to invitation'
    });
  }
});

// Leave clan
router.post('/leave', authenticateToken, async (req, res) => {
  try {
    const userClan = await Clans.getUserClan(req.user.uid);
    if (!userClan) {
      return res.status(400).json({
        success: false,
        error: 'You are not a member of any clan'
      });
    }
    
    await Clans.leaveClan(userClan.id, req.user.uid);
    
    // Add leave activity
    await Clans.addActivity(userClan.id, req.user.uid, 'member_left', {
      memberName: req.user.name || 'Member'
    }, 0);
    
    res.json({
      success: true,
      message: 'Successfully left the clan'
    });
  } catch (error) {
    console.error('Error leaving clan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave clan'
    });
  }
});

module.exports = router;
