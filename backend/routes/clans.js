const express = require('express');
const { db, admin } = require('../config/firebaseAdmin');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Get all public clans (for browsing)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    // Get public clans
    const clansQuery = await db.collection('clans')
      .where('isPrivate', '==', false)
      .orderBy('memberCount', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const clans = clansQuery.docs.map(doc => {
      const clanData = doc.data();
      return {
        id: clanData.id,
        name: clanData.name,
        description: clanData.description,
        memberCount: clanData.memberCount,
        createdAt: clanData.createdAt,
        stats: clanData.stats,
        settings: {
          maxMembers: clanData.settings.maxMembers
        }
      };
    });

    res.json({
      success: true,
      clans,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: clans.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get clans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clans',
      error: error.message
    });
  }
});

// Create new clan
router.post('/create', authenticateUser, async (req, res) => {
  try {
    const { name, description, isPrivate = false } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Clan name is required'
      });
    }

    // Check if clan name already exists
    const existingClan = await db.collection('clans')
      .where('name', '==', name)
      .get();

    if (!existingClan.empty) {
      return res.status(400).json({
        success: false,
        message: 'Clan name already exists'
      });
    }

    // Generate clan ID
    const clanId = db.collection('clans').doc().id;

    const clanData = {
      id: clanId,
      name,
      description: description || '',
      createdBy: req.user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [req.user.uid],
      memberCount: 1,
      isPrivate,
      settings: {
        maxMembers: 50,
        allowInvites: true,
        requireApproval: isPrivate
      },
      stats: {
        totalPoints: 0,
        averageProgress: 0,
        activeMembers: 1
      }
    };

    // Create clan
    await db.collection('clans').doc(clanId).set(clanData);

    // Update user's clan ID
    await db.collection('users').doc(req.user.uid).update({
      clanId: clanId,
      joinedClanAt: new Date(),
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Clan created successfully',
      clan: clanData
    });
  } catch (error) {
    console.error('Create clan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create clan',
      error: error.message
    });
  }
});

// Get clan details
router.get('/:clanId', authenticateUser, async (req, res) => {
  try {
    const { clanId } = req.params;

    const clanDoc = await db.collection('clans').doc(clanId).get();

    if (!clanDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Clan not found'
      });
    }

    const clanData = clanDoc.data();

    // Get members data
    const membersQuery = await db.collection('users')
      .where('clanId', '==', clanId)
      .get();

    const members = membersQuery.docs.map(doc => {
      const memberData = doc.data();
      return {
        uid: memberData.uid,
        name: memberData.name,
        avatar: memberData.avatar,
        joinedAt: memberData.joinedClanAt,
        progress: memberData.progress || {},
        profile: memberData.profile || {},
        role: memberData.role || 'member'
      };
    });

    res.json({
      success: true,
      clan: {
        ...clanData,
        members
      }
    });
  } catch (error) {
    console.error('Get clan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clan details',
      error: error.message
    });
  }
});

// Get clan leaderboard (only for clan members)
router.get('/:clanId/leaderboard', authenticateUser, async (req, res) => {
  try {
    const { clanId } = req.params;

    // Verify user is in this clan or allow viewing if clan is public
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    // Check if clan exists
    const clanDoc = await db.collection('clans').doc(clanId).get();
    if (!clanDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Clan not found'
      });
    }

    const clanData = clanDoc.data();

    // Allow access if user is in the clan OR if clan is public
    if (userData.clanId !== clanId && clanData.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This is a private clan'
      });
    }

    // Get clan members with their progress
    const membersQuery = await db.collection('users')
      .where('clanId', '==', clanId)
      .get();

    const leaderboard = membersQuery.docs.map(doc => {
      const memberData = doc.data();
      
      // Calculate overall progress
      const topics = memberData.progress?.topics || {};
      const topicNames = Object.keys(topics);
      
      let totalProgress = 0;
      let completedTopics = 0;
      
      const memberTopics = topicNames.map(topicName => {
        const topic = topics[topicName];
        const progress = (topic.completed / topic.total) * 100;
        totalProgress += progress;
        
        if (progress === 100) completedTopics++;
        
        return {
          topic: topicName,
          completed: topic.completed,
          total: topic.total,
          percentage: Math.round(progress)
        };
      });

      const overallProgress = topicNames.length > 0 ? Math.round(totalProgress / topicNames.length) : 0;

      return {
        uid: memberData.uid,
        name: memberData.name,
        avatar: memberData.avatar,
        overallProgress,
        completedTopics,
        totalTopics: topicNames.length,
        points: memberData.profile?.points || 0,
        level: memberData.profile?.level || 1,
        topics: memberTopics,
        lastActivity: memberData.progress?.lastActivity
      };
    });

    // Sort by overall progress, then by points
    leaderboard.sort((a, b) => {
      if (b.overallProgress !== a.overallProgress) {
        return b.overallProgress - a.overallProgress;
      }
      return b.points - a.points;
    });

    res.json({
      success: true,
      leaderboard,
      isUserMember: userData.clanId === clanId,
      clanInfo: {
        name: clanData.name,
        description: clanData.description,
        memberCount: clanData.memberCount
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clan leaderboard',
      error: error.message
    });
  }
});

// Search clans
router.get('/search/:query', authenticateUser, async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    // Search clans by name (case-insensitive)
    const clansQuery = await db.collection('clans')
      .where('isPrivate', '==', false)
      .get();

    const clans = clansQuery.docs
      .map(doc => doc.data())
      .filter(clan => 
        clan.name.toLowerCase().includes(query.toLowerCase()) ||
        clan.description.toLowerCase().includes(query.toLowerCase())
      )
      .map(clan => ({
        id: clan.id,
        name: clan.name,
        description: clan.description,
        memberCount: clan.memberCount,
        createdAt: clan.createdAt,
        stats: clan.stats
      }));

    res.json({
      success: true,
      clans
    });
  } catch (error) {
    console.error('Search clans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search clans',
      error: error.message
    });
  }
});

// Join clan by ID
router.post('/:clanId/join', authenticateUser, async (req, res) => {
  try {
    const { clanId } = req.params;

    // Check if clan exists
    const clanDoc = await db.collection('clans').doc(clanId).get();
    
    if (!clanDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Clan not found'
      });
    }

    const clanData = clanDoc.data();

    // Check if user is already in a clan
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (userData.clanId) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a clan. Leave your current clan first.'
      });
    }

    // Check if clan is full
    if (clanData.memberCount >= clanData.settings.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Clan is full'
      });
    }

    // Add user to clan
    await db.collection('clans').doc(clanId).update({
      members: admin.firestore.FieldValue.arrayUnion(req.user.uid),
      memberCount: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date()
    });

    // Update user's clan ID
    await db.collection('users').doc(req.user.uid).update({
      clanId: clanId,
      joinedClanAt: new Date(),
      role: 'member'
    });

    res.json({
      success: true,
      message: 'Successfully joined clan',
      clan: {
        id: clanData.id,
        name: clanData.name,
        description: clanData.description
      }
    });
  } catch (error) {
    console.error('Join clan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join clan',
      error: error.message
    });
  }
});

// Leave clan
router.post('/:clanId/leave', authenticateUser, async (req, res) => {
  try {
    const { clanId } = req.params;

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (userData.clanId !== clanId) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this clan'
      });
    }

    // Remove user from clan
    await db.collection('clans').doc(clanId).update({
      members: admin.firestore.FieldValue.arrayRemove(req.user.uid),
      memberCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: new Date()
    });

    // Update user's clan ID
    await db.collection('users').doc(req.user.uid).update({
      clanId: null,
      leftClanAt: new Date(),
      role: null
    });

    res.json({
      success: true,
      message: 'Successfully left clan'
    });
  } catch (error) {
    console.error('Leave clan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave clan',
      error: error.message
    });
  }
});

// Update clan progress (when members complete topics)
router.post('/:clanId/update-stats', authenticateUser, async (req, res) => {
  try {
    const { clanId } = req.params;

    // Get all clan members
    const membersQuery = await db.collection('users')
      .where('clanId', '==', clanId)
      .get();

    let totalPoints = 0;
    let totalProgress = 0;
    let activeMembers = 0;

    membersQuery.docs.forEach(doc => {
      const memberData = doc.data();
      totalPoints += memberData.profile?.points || 0;
      
      // Calculate member's average progress
      const topics = memberData.progress?.topics || {};
      const topicNames = Object.keys(topics);
      
      if (topicNames.length > 0) {
        let memberProgress = 0;
        topicNames.forEach(topicName => {
          const topic = topics[topicName];
          memberProgress += (topic.completed / topic.total) * 100;
        });
        totalProgress += memberProgress / topicNames.length;
        activeMembers++;
      }
    });

    const averageProgress = activeMembers > 0 ? Math.round(totalProgress / activeMembers) : 0;

    // Update clan stats
    await db.collection('clans').doc(clanId).update({
      'stats.totalPoints': totalPoints,
      'stats.averageProgress': averageProgress,
      'stats.activeMembers': activeMembers,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Clan stats updated successfully',
      stats: {
        totalPoints,
        averageProgress,
        activeMembers
      }
    });
  } catch (error) {
    console.error('Update clan stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update clan stats',
      error: error.message
    });
  }
});

module.exports = router;
