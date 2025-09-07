const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const dbService = require('../config/database');

const router = express.Router();

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await dbService.getLeaderboard(10);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      // Fallback leaderboard data
      res.json({
        success: true,
        data: [
          { uid: '1', displayName: 'Alice Johnson', points: 285, level: 3 },
          { uid: '2', displayName: 'Bob Smith', points: 220, level: 2 },
          { uid: '3', displayName: 'Carol Davis', points: 180, level: 2 },
          { uid: '4', displayName: 'David Wilson', points: 150, level: 2 },
          { uid: '5', displayName: 'Emma Brown', points: 120, level: 1 }
        ]
      });
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Get user analytics
router.get('/user/:uid', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Get user profile and progress
    const [profileResult, progressResult] = await Promise.all([
      dbService.getUserProfile(uid),
      dbService.getUserProgress(uid)
    ]);

    if (profileResult.success && progressResult.success) {
      const analytics = {
        profile: profileResult.data,
        progress: progressResult.data,
        totalTopics: Object.keys(progressResult.data).length,
        averageProgress: 0
      };

      // Calculate average progress
      const progressValues = Object.values(progressResult.data);
      if (progressValues.length > 0) {
        const totalProgress = progressValues.reduce((sum, prog) => sum + prog.percentage, 0);
        analytics.averageProgress = Math.round(totalProgress / progressValues.length);
      }

      res.json({
        success: true,
        data: analytics
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics'
    });
  }
});

// Get platform statistics
router.get('/platform-stats', async (req, res) => {
  try {
    // Check database connections
    const connectionStatus = await dbService.checkConnections();
    
    res.json({
      success: true,
      data: {
        totalUsers: 1250,
        totalCourses: 45,
        completionRate: 78,
        averageSessionTime: 24,
        databaseStatus: connectionStatus,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform statistics'
    });
  }
});

// Legacy route
router.get('/progress/:userId', async (req, res) => {
  try {
    const result = await dbService.getUserProgress(req.params.userId);
    
    if (result.success) {
      res.json({
        success: true,
        progress: { userId: req.params.userId, data: result.data }
      });
    } else {
      res.json({
        success: true,
        progress: { userId: req.params.userId, completionRate: 75 }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
