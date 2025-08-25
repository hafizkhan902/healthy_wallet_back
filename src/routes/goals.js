const express = require('express');
const {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  getGoalsSummary,
  getGoalsByCategory,
  updateGoalStatus
} = require('../controllers/goalController');
const { protect } = require('../middleware/auth');
const { validate, goalSchemas } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getGoals)
  .post(validate(goalSchemas.create), createGoal);

router.get('/summary', getGoalsSummary);
router.get('/by-category', getGoalsByCategory);

router.route('/:id')
  .get(getGoal)
  .put(validate(goalSchemas.update), updateGoal)
  .delete(deleteGoal);

router.post('/:id/contribute', addContribution);
router.put('/:id/status', updateGoalStatus);

module.exports = router;
