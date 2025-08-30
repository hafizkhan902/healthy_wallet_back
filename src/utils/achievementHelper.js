const { checkAndUnlockAchievements } = require('../controllers/achievementController');

/**
 * Trigger achievement check for a user without affecting main operation
 * @param {Object} user - User object with id property
 */
const triggerAchievementCheck = async (user) => {
  try {
    // Create mock req, res, next objects for the achievement controller
    const mockReq = { user };
    const mockRes = { 
      status: () => ({ json: () => {} }),
      json: () => {} 
    };
    const mockNext = () => {};

    await checkAndUnlockAchievements(mockReq, mockRes, mockNext);
  } catch (error) {
    // Silent achievement check error (no console output in production)
    // Don't throw error - achievement checks should not affect main operations
  }
};

module.exports = {
  triggerAchievementCheck
};
