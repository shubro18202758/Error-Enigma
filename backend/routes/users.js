const express = require('express');
const { db } = require('../config/firebaseAdmin');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Get user dashboard data (works for both clan and non-clan users)
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    
    // Basic user data
    const dashboardData = {
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        progress: userData.progress,
        profile: userData.profile
      },
      hasJoinedClan: !!userData.clanId,
      clanData: null
    };

    // If user is in a clan, get clan data
    if (userData.clanId) {
      try {
        const clanDoc = await db.collection('clans').doc(userData.clanId).get();
        if (clanDoc.exists) {
          const clanInfo = clanDoc.data();
          
          // Get clan members for leaderboard
          const membersQuery = await db.collection('users')
            .where('clanId', '==', userData.clanId)
            .limit(10) // Top 10 members
            .get();

          const clanMembers = membersQuery.docs.map(doc => {
            const memberData = doc.data();
            const topics = memberData.progress?.topics || {};
            const topicNames = Object.keys(topics);
            
            let totalProgress = 0;
            topicNames.forEach(topicName => {
              const topic = topics[topicName];
              totalProgress += (topic.completed / topic.total) * 100;
            });

            const overallProgress = topicNames.length > 0 ? Math.round(totalProgress / topicNames.length) : 0;

            return {
              uid: memberData.uid,
              name: memberData.name,
              avatar: memberData.avatar,
              overallProgress,
              points: memberData.profile?.points || 0
            };
          });

          // Sort by progress
          clanMembers.sort((a, b) => b.overallProgress - a.overallProgress);

          dashboardData.clanData = {
            id: clanInfo.id,
            name: clanInfo.name,
            description: clanInfo.description,
            memberCount: clanInfo.memberCount,
            members: clanMembers,
            stats: clanInfo.stats
          };
        }
      } catch (clanError) {
        console.error('Error fetching clan data:', clanError);
        // Continue without clan data if there's an error
      }
    }

    res.json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
});

// Get user profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    
    res.json({
      success: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        clanId: userData.clanId || null,
        progress: userData.progress,
        profile: userData.profile,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin,
        hasJoinedClan: !!userData.clanId
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (bio !== undefined) updateData['profile.bio'] = bio;
    if (avatar) updateData['profile.avatar'] = avatar;

    await db.collection('users').doc(req.user.uid).update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Update user progress
router.post('/progress', authenticateUser, async (req, res) => {
  try {
    const { topicName, completed, total } = req.body;

    if (!topicName || completed === undefined || total === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Topic name, completed, and total are required'
      });
    }

    // Update user progress
    const progressData = {
      [`progress.topics.${topicName}`]: {
        completed,
        total,
        percentage: Math.round((completed / total) * 100),
        lastUpdated: new Date()
      },
      'progress.lastActivity': new Date()
    };

    await db.collection('users').doc(req.user.uid).update(progressData);

    // Calculate points based on progress
    const points = Math.floor((completed / total) * 100);
    await db.collection('users').doc(req.user.uid).update({
      'profile.points': admin.firestore.FieldValue.increment(points)
    });

    // If user is in a clan, update clan stats
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    
    if (userData.clanId) {
      // Trigger clan stats update (you can call the clan stats endpoint)
      // This is optional and can be done asynchronously
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      points: points,
      inClan: !!userData.clanId
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error.message
    });
  }
});

// Get user's clan members (optional - only if user is in a clan)
router.get('/clan-members', authenticateUser, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData.clanId) {
      return res.json({
        success: true,
        message: 'User is not in any clan',
        members: [],
        inClan: false
      });
    }

    // Get clan members
    const membersQuery = await db.collection('users')
      .where('clanId', '==', userData.clanId)
      .get();

    const members = membersQuery.docs.map(doc => {
      const memberData = doc.data();
      return {
        uid: memberData.uid,
        name: memberData.name,
        avatar: memberData.avatar,
        progress: memberData.progress,
        profile: memberData.profile
      };
    });

    res.json({
      success: true,
      members: members,
      inClan: true
    });
  } catch (error) {
    console.error('Get clan members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clan members',
      error: error.message
    });
  }
});

// Join clan
router.post('/join-clan', authenticateUser, async (req, res) => {
  try {
    const { clanId } = req.body;

    if (!clanId) {
      return res.status(400).json({
        success: false,
        message: 'Clan ID is required'
      });
    }

    // Check if clan exists
    const clanDoc = await db.collection('clans').doc(clanId).get();
    
    if (!clanDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Clan not found'
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
      joinedClanAt: new Date()
    });

    res.json({
      success: true,
      message: 'Successfully joined clan'
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
router.post('/leave-clan', authenticateUser, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData.clanId) {
      return res.status(400).json({
        success: false,
        message: 'User is not in any clan'
      });
    }

    // Remove user from clan
    await db.collection('clans').doc(userData.clanId).update({
      members: admin.firestore.FieldValue.arrayRemove(req.user.uid),
      memberCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: new Date()
    });

    // Update user's clan ID
    await db.collection('users').doc(req.user.uid).update({
      clanId: null,
      leftClanAt: new Date()
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

module.exports = router;
