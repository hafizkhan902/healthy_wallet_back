const express = require('express');
const {
  getDashboardData,
  getMonthlyReport,
  getCategoryAnalysis,
  getTrendAnalysis,
  getFinancialHealthScore,
  exportData
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/dashboard', getDashboardData);
router.get('/monthly/:year/:month', getMonthlyReport);
router.get('/category-analysis', getCategoryAnalysis);
router.get('/trend-analysis', getTrendAnalysis);
router.get('/health-score', getFinancialHealthScore);
router.get('/export', exportData);

module.exports = router;
