const Goal = require('../models/Goal');

// @desc    Get all goals for user
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res, next) => {
  try {
    const { status, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = { user: req.user.id };
    
    // Add filters
    if (status) query.status = status;
    if (category) query.category = category;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const goals = await Goal.find(query).sort(sortOptions);

    res.status(200).json({
      success: true,
      data: { goals }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single goal
// @route   GET /api/goals/:id
// @access  Private
const getGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { goal }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res, next) => {
  try {
    const goalData = {
      ...req.body,
      user: req.user.id
    };

    const goal = await Goal.create(goalData);

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: { goal }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: { goal }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add contribution to goal
// @route   POST /api/goals/:id/contribute
// @access  Private
const addContribution = async (req, res, next) => {
  try {
    const { amount, source = 'manual', note = '' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid contribution amount is required'
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    if (goal.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot contribute to inactive goal'
      });
    }

    await goal.addContribution(amount, source, note);

    res.status(200).json({
      success: true,
      message: 'Contribution added successfully',
      data: { goal }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get goals summary
// @route   GET /api/goals/summary
// @access  Private
const getGoalsSummary = async (req, res, next) => {
  try {
    const summary = await Goal.getGoalsSummary(req.user.id);
    const byCategory = await Goal.getGoalsByCategory(req.user.id);

    // Calculate overall progress
    const totalGoals = summary.reduce((total, item) => total + item.count, 0);
    const totalTargetAmount = summary.reduce((total, item) => total + item.totalTargetAmount, 0);
    const totalCurrentAmount = summary.reduce((total, item) => total + item.totalCurrentAmount, 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalGoals,
          totalTargetAmount,
          totalCurrentAmount,
          overallProgress: Math.round(overallProgress * 100) / 100,
          byStatus: summary,
          byCategory
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get goals by category
// @route   GET /api/goals/by-category
// @access  Private
const getGoalsByCategory = async (req, res, next) => {
  try {
    const goalsByCategory = await Goal.getGoalsByCategory(req.user.id);

    res.status(200).json({
      success: true,
      data: { goalsByCategory }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update goal status
// @route   PUT /api/goals/:id/status
// @access  Private
const updateGoalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'completed', 'paused', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Goal status updated successfully',
      data: { goal }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  getGoalsSummary,
  getGoalsByCategory,
  updateGoalStatus
};
