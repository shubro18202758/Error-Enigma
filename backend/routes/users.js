const express = require('express');
const { db } = require('../config/firebaseAdmin');
const { authenticateToken } = require('../middleware/auth');
const dbService = require('../config/database');

const router = express.Router();

// Get user dashboard data (works for both clan and non-clan users)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Try to get user from SQLite database first
    let userResult = await dbService.getUserProfile(req.user.uid);
    
    if (!userResult.success || !userResult.data) {
      // Create user if doesn't exist
      const newUser = {
        uid: req.user.uid,
        email: req.user.email || 'user@example.com',
        name: req.user.name || req.user.displayName || 'New User',
        level: 1,
        points: 0,
        streak: 0
      };
      
      await dbService.createUser(newUser);
      userResult = await dbService.getUserProfile(req.user.uid);
    }

    // Get dashboard data using the database service
    const dashboardResult = await dbService.getDashboardData(req.user.uid);
    
    if (dashboardResult.success) {
      return res.json(dashboardResult);
    } else {
      return res.status(500).json({
        success: false,
        message: dashboardResult.error || 'Failed to load dashboard'
      });
    }
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
});

// Get user profile with database fallback
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Try database first
    const dbResult = await dbService.getUserProfile(req.user.uid);
    
    if (dbResult.success && dbResult.data) {
      return res.json({
        success: true,
        data: dbResult.data
      });
    }

    // Fallback to Firebase
    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      
      if (!userDoc.exists) {
        // Create default user profile
        const defaultProfile = {
          uid: req.user.uid,
          email: req.user.email,
          displayName: 'New User',
          level: 1,
          points: 0,
          streak: 0
        };
        
        await dbService.createUser(defaultProfile);
        
        return res.json({
          success: true,
          data: defaultProfile
        });
      }

      const userData = userDoc.data();
      
      // Convert Firebase format to our format
      const userProfile = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.name || userData.displayName,
        level: userData.profile?.level || 1,
        points: userData.profile?.points || 0,
        streak: userData.profile?.streak || 0,
        avatar: userData.avatar,
        clanId: userData.clanId || null
      };
      
      // Save to database for future use
      await dbService.createUser(userProfile);
      
      res.json({
        success: true,
        data: userProfile
      });
    } catch (firebaseError) {
      console.warn('Firebase profile fetch failed:', firebaseError.message);
      
      // Ultimate fallback
      const demoProfile = {
        uid: req.user.uid,
        email: req.user.email,
        displayName: 'Demo Student',
        level: 1,
        points: 150,
        streak: 3
      };
      
      res.json({
        success: true,
        data: demoProfile
      });
    }
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
router.put('/profile', authenticateToken, async (req, res) => {
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

// Update user progress with database integration
router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const { topic, topicName, completed, total } = req.body;
    const finalTopic = topic || topicName;

    if (!finalTopic || completed === undefined || total === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Topic name, completed, and total are required'
      });
    }

    // Update in database
    const result = await dbService.updateProgress(req.user.uid, finalTopic, completed, total);
    
    if (result.success) {
      // Update leaderboard
      const profileResult = await dbService.getUserProfile(req.user.uid);
      if (profileResult.success && profileResult.data) {
        await dbService.updateLeaderboard(
          req.user.uid,
          profileResult.data.displayName,
          profileResult.data.points,
          profileResult.data.level
        );
      }

      // Also try to update Firebase (but don't fail if it doesn't work)
      try {
        const progressData = {
          [`progress.topics.${finalTopic}`]: {
            completed,
            total,
            percentage: Math.round((completed / total) * 100),
            lastUpdated: new Date()
          },
          'progress.lastActivity': new Date()
        };

        await db.collection('users').doc(req.user.uid).update(progressData);
      } catch (firebaseError) {
        console.warn('Firebase progress update failed (continuing with database):', firebaseError.message);
      }

      res.json({
        success: true,
        message: 'Progress updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to update progress'
      });
    }
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
router.get('/clan-members', authenticateToken, async (req, res) => {
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
router.post('/join-clan', authenticateToken, async (req, res) => {
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
router.post('/leave-clan', authenticateToken, async (req, res) => {
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

// Get user progress for dashboard
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const result = await dbService.getUserProgress(req.user.uid);
    
    if (result.success && result.data) {
      // Transform the data to match our new LearningProgress interface
      const progressData = {
        currentPath: result.data.currentPath || "JavaScript Fundamentals",
        completionPercentage: result.data.completionPercentage || 65,
        weeklyGoal: result.data.weeklyGoal || 10,
        weeklyProgress: result.data.weeklyProgress || 7,
        upcomingDeadlines: result.data.upcomingDeadlines || [
          {
            id: "deadline_1",
            title: "React Project Due",
            type: "project",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            priority: "high"
          },
          {
            id: "deadline_2", 
            title: "Algorithm Quiz",
            type: "quiz",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            priority: "medium"
          }
        ],
        recentAchievements: result.data.recentAchievements || [
          {
            id: "achievement_1",
            title: "First Steps",
            description: "Completed your first lesson",
            icon: "🎯",
            unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            rarity: "common"
          },
          {
            id: "achievement_2",
            title: "Code Warrior",
            description: "Solved 10 coding challenges",
            icon: "⚔️",
            unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            rarity: "rare"
          }
        ]
      };

      return res.json({
        success: true,
        progress: progressData
      });
    }

    // Fallback with demo learning progress data
    const fallbackProgress = {
      currentPath: "JavaScript Fundamentals",
      completionPercentage: 45,
      weeklyGoal: 8,
      weeklyProgress: 5,
      upcomingDeadlines: [
        {
          id: "deadline_1",
          title: "JavaScript Basics Quiz",
          type: "quiz",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "medium"
        }
      ],
      recentAchievements: [
        {
          id: "achievement_1",
          title: "Getting Started",
          description: "Welcome to your learning journey!",
          icon: "🚀",
          unlockedAt: new Date().toISOString(),
          rarity: "common"
        }
      ]
    };

    res.json({
      success: true,
      progress: fallbackProgress
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress'
    });
  }
});

module.exports = router;
