const express = require('express');
const { 
  getProfile, 
  updateProfile, 
  updateSettings, 
  getFinancialSummary,
  getAchievements,
  deleteAccount 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate(userSchemas.updateProfile), updateProfile);
router.put('/settings', updateSettings);
router.get('/financial-summary', getFinancialSummary);
router.get('/achievements', getAchievements);
router.delete('/account', deleteAccount);

module.exports = router;
