const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getUserStats,
  getLeaderboard,
  updateLoginStreak,
  checkAndAwardBadges,
} = require('../services/gamificationService');

const router = express.Router();

// Get user's gamification stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const result = await getUserStats(req.user.id);

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Get gamification stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const { type, period, limit } = req.query;

    const result = await getLeaderboard({ type, period, limit });

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update login streak (called on login)
router.post('/streak', authenticate, async (req, res) => {
  try {
    const result = await updateLoginStreak(req.user.id);

    if (result.success) {
      res.json({ success: true, data: { streak: result.streak } });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check and award badges manually
router.post('/check-badges', authenticate, async (req, res) => {
  try {
    const result = await checkAndAwardBadges(req.user.id);

    if (result.success) {
      res.json({
        success: true,
        data: {
          earnedBadges: result.earnedBadges,
          message: result.earnedBadges.length > 0
            ? `You earned ${result.earnedBadges.length} new badge(s)!`
            : 'No new badges earned yet.',
        },
      });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Check badges error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
