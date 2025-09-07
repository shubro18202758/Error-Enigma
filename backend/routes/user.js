const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const UserProgress = require('../models/UserProgress');
const router = express.Router();

// Initialize user on first login
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    await UserProgress.initializeUser(req.user.uid, req.user.email, req.user.name);
    
    res.json({
      success: true,
      message: 'User initialized successfully'
    });
  } catch (error) {
    console.error('User initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize user'
    });
  }
});

// Get user profile with real data
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Ensure user exists in database first
    let userData = await UserProgress.getUserProgress(req.user.uid);
    
    // If user doesn't exist, initialize them
    if (!userData) {
      await UserProgress.initializeUser(req.user.uid, req.user.email, req.user.name || 'New User');
      userData = await UserProgress.getUserProgress(req.user.uid);
    }
    
    const completions = await UserProgress.getUserCompletions(req.user.uid);
    
    // Calculate real level based on points
    const level = Math.floor(userData.total_points / 100) + 1;
    const pointsToNextLevel = 100 - (userData.total_points % 100);
    
    res.json({
      success: true,
      profile: {
        uid: userData.uid,
        email: userData.email || req.user.email,
        name: userData.name || req.user.name,
        total_points: userData.total_points,
        current_streak: userData.current_streak,
        longest_streak: userData.longest_streak,
        level: level,
        points_to_next_level: pointsToNextLevel,
        lessons_completed: userData.lessons_completed,
        quizzes_completed: userData.quizzes_completed,
        projects_completed: userData.projects_completed,
        total_completed: userData.lessons_completed + userData.quizzes_completed + userData.projects_completed,
        last_active: userData.last_active,
        recent_completions: completions.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// Get dashboard data (comprehensive user overview)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Ensure user exists in database first
    let userData = await UserProgress.getUserProgress(req.user.uid);
    
    // If user doesn't exist, initialize them
    if (!userData) {
      await UserProgress.initializeUser(req.user.uid, req.user.email, req.user.name || 'New User');
      userData = await UserProgress.getUserProgress(req.user.uid);
    }
    
    const completions = await UserProgress.getUserCompletions(req.user.uid);
    const analytics = await UserProgress.getLearningAnalytics(req.user.uid);
    
    // Calculate level and progress
    const level = Math.floor(userData.total_points / 100) + 1;
    const pointsToNextLevel = 100 - (userData.total_points % 100);
    
    // Structure dashboard data
    const dashboardData = {
      user: {
        uid: userData.uid,
        email: userData.email || req.user.email,
        name: userData.name || req.user.name || 'User',
        avatar: req.user.picture,
        level: level,
        points: userData.total_points,
        streak: userData.current_streak,
        joinDate: userData.created_at,
        role: 'student',
        badges: [], // Can be expanded later
        completedCourses: userData.lessons_completed,
        activeModules: userData.projects_completed,
        profile: {
          points: userData.total_points,
          level: level,
          streak: userData.current_streak,
          points_to_next_level: pointsToNextLevel,
          lessons_completed: userData.lessons_completed,
          quizzes_completed: userData.quizzes_completed,
          projects_completed: userData.projects_completed,
          total_completed: userData.lessons_completed + userData.quizzes_completed + userData.projects_completed,
          last_active: userData.last_active
        },
        progress: {
          topics: analytics.topics || {}
        }
      },
      hasJoinedClan: false, // Can be implemented later with clan system
      clanData: {
        id: 'global',
        name: 'Global Learning Community',
        description: 'Learn together, grow together',
        memberCount: 1000,
        level: 1,
        points: 0,
        challenges: [],
        members: [],
        recentActivity: []
      },
      recentCompletions: completions.slice(0, 10),
      learningStats: analytics
    };
    
    res.json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard data'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, bio, learning_goals } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (learning_goals) updateData.learning_goals = learning_goals;
    
    const result = await UserProgress.updateProfile(req.user.uid, updateData);
    
    if (result) {
      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Get comprehensive user progress and analytics
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const analytics = await UserProgress.getLearningAnalytics(req.user.uid);
    
    res.json({
      success: true,
      progress: analytics
    });
  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user progress'
    });
  }
});

// Record content completion (REAL tracking)
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const { contentId, contentType, pointsEarned } = req.body;
    
    if (!contentId || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'Content ID and type are required'
      });
    }
    
    // Calculate points based on content type
    const points = pointsEarned || (
      contentType === 'course' ? 50 :
      contentType === 'quiz' ? 20 :
      contentType === 'project' ? 100 :
      contentType === 'tutorial' ? 15 : 10
    );
    
    const result = await UserProgress.completeLessson(
      req.user.uid,
      contentId,
      contentType,
      points
    );
    
    res.json({
      success: true,
      result,
      message: result.alreadyCompleted ? 'Already completed' : `Earned ${points} points!`
    });
  } catch (error) {
    console.error('Completion recording error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record completion'
    });
  }
});

// Get user completions
router.get('/completions', authenticateToken, async (req, res) => {
  try {
    const completions = await UserProgress.getUserCompletions(req.user.uid);
    
    res.json({
      success: true,
      completions
    });
  } catch (error) {
    console.error('Completions fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch completions'
    });
  }
});

// Get real leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await UserProgress.getLeaderboard(limit);
    
    // Add ranking and additional stats
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
      level: Math.floor(user.total_points / 100) + 1
    }));
    
    res.json({
      success: true,
      leaderboard: rankedLeaderboard
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Update user streak manually (for testing)
router.post('/streak', authenticateToken, async (req, res) => {
  try {
    const newStreak = await UserProgress.updateStreak(req.user.uid);
    
    res.json({
      success: true,
      current_streak: newStreak,
      message: 'Streak updated successfully'
    });
  } catch (error) {
    console.error('Streak update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update streak'
    });
  }
});

module.exports = router;
