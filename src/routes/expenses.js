const express = require('express');
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  getExpenseByCategory,
  getRecurringExpenses,
  getTopCategories
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { validate, expenseSchemas } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getExpenses)
  .post(validate(expenseSchemas.create), createExpense);

router.get('/summary', getExpenseSummary);
router.get('/by-category', getExpenseByCategory);
router.get('/recurring', getRecurringExpenses);
router.get('/top-categories', getTopCategories);

router.route('/:id')
  .get(getExpense)
  .put(validate(expenseSchemas.update), updateExpense)
  .delete(deleteExpense);

module.exports = router;
