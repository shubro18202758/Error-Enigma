const express = require('express');
const router = express.Router();

// Proctor routes
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Proctor endpoint',
      status: 'active'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/start-session', async (req, res) => {
  try {
    res.json({
      success: true,
      sessionId: 'session-' + Date.now()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
