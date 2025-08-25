const Expense = require('../models/Expense');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get all expenses for user
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, startDate, endDate, sortBy = 'date', sortOrder = 'desc' } = req.query;

    const query = { user: req.user.id };
    
    // Add filters
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const expenses = await Expense.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        expenses,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: expenses.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res, next) => {
  try {
    const expenseData = {
      ...req.body,
      user: req.user.id
    };

    const expense = await Expense.create(expenseData);

    // Update user's financial summary
    const user = await User.findById(req.user.id);
    await user.updateFinancialSummary();

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Update user's financial summary
    const user = await User.findById(req.user.id);
    await user.updateFinancialSummary();

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Update user's financial summary
    const user = await User.findById(req.user.id);
    await user.updateFinancialSummary();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense summary
// @route   GET /api/expenses/summary
// @access  Private
const getExpenseSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await Expense.getExpenseSummary(req.user.id, start, end);
    const monthlyTrend = await Expense.getMonthlyTrend(req.user.id);

    const totalExpenses = summary.reduce((total, item) => total + item.totalAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalExpenses,
          byCategory: summary,
          monthlyTrend
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense by category
// @route   GET /api/expenses/by-category
// @access  Private
const getExpenseByCategory = async (req, res, next) => {
  try {
    const expenseByCategory = await Expense.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          lastEntry: { $max: '$date' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: { expenseByCategory }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recurring expenses
// @route   GET /api/expenses/recurring
// @access  Private
const getRecurringExpenses = async (req, res, next) => {
  try {
    const recurringExpenses = await Expense.find({
      user: req.user.id,
      isRecurring: true
    }).sort({ nextRecurringDate: 1 });

    res.status(200).json({
      success: true,
      data: { recurringExpenses }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top spending categories
// @route   GET /api/expenses/top-categories
// @access  Private
const getTopCategories = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    
    const topCategories = await Expense.getTopCategories(req.user.id, parseInt(limit));

    res.status(200).json({
      success: true,
      data: { topCategories }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  getExpenseByCategory,
  getRecurringExpenses,
  getTopCategories
};
