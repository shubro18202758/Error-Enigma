const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all public clans (for browsing)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Return mock clans data for now since we're focusing on AI features
    const mockClans = [
      {
        id: 'global-learners',
        name: 'Global Learners',
        description: 'A community of learners from around the world',
        memberCount: 1250,
        level: 15,
        points: 45600,
        challenges: [],
        recentActivity: [],
        isPublic: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'code-masters',
        name: 'Code Masters',
        description: 'Advanced programming and software development',
        memberCount: 850,
        level: 22,
        points: 78900,
        challenges: [],
        recentActivity: [],
        isPublic: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'data-scientists',
        name: 'Data Scientists',
        description: 'Data analysis, machine learning, and AI',
        memberCount: 620,
        level: 18,
        points: 56700,
        challenges: [],
        recentActivity: [],
        isPublic: true,
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      clans: mockClans,
      total: mockClans.length
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
    // For now, return that user hasn't joined a clan
    res.json({
      success: true,
      hasJoinedClan: false,
      clanData: null,
      message: 'You haven\'t joined a clan yet. Browse available clans to join one!'
    });
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
    
    // Mock successful join
    res.json({
      success: true,
      message: `Successfully joined clan: ${clanId}`,
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
    
    const newClan = {
      id: `clan_${Date.now()}`,
      name: name,
      description: description,
      memberCount: 1,
      level: 1,
      points: 0,
      creatorId: req.user.uid,
      isPrivate: isPrivate,
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      clan: newClan,
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

module.exports = router;
