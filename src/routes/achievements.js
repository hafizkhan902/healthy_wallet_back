const express = require('express');
const { 
  checkAndUnlockAchievements,
  getAllAchievements,
  getAchievementLeaderboard
} = require('../controllers/achievementController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   POST /api/achievements/check
// @desc    Check and unlock new achievements
// @access  Private
router.post('/check', checkAndUnlockAchievements);

// @route   GET /api/achievements
// @desc    Get all achievements (unlocked and locked)
// @access  Private
router.get('/', getAllAchievements);

// @route   GET /api/achievements/leaderboard
// @desc    Get achievement leaderboard
// @access  Private
router.get('/leaderboard', getAchievementLeaderboard);

module.exports = router;
