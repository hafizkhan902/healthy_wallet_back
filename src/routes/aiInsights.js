const express = require('express');
const {
  getSpendingAnalysis,
  getSavingsRecommendations,
  getGoalForecast,
  getFinancialHealthInsights,
  getBudgetSuggestions
} = require('../controllers/aiInsightsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/spending-analysis', getSpendingAnalysis);
router.get('/savings-recommendations', getSavingsRecommendations);
router.get('/goal-forecast/:goalId', getGoalForecast);
router.get('/health-insights', getFinancialHealthInsights);
router.get('/budget-suggestions', getBudgetSuggestions);

module.exports = router;
