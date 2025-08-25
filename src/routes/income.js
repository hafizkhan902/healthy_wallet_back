const express = require('express');
const {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary,
  getIncomeByCategory,
  getRecurringIncomes
} = require('../controllers/incomeController');
const { protect } = require('../middleware/auth');
const { validate, incomeSchemas } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getIncomes)
  .post(validate(incomeSchemas.create), createIncome);

router.get('/summary', getIncomeSummary);
router.get('/by-category', getIncomeByCategory);
router.get('/recurring', getRecurringIncomes);

router.route('/:id')
  .get(getIncome)
  .put(validate(incomeSchemas.update), updateIncome)
  .delete(deleteIncome);

module.exports = router;
