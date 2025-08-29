const Income = require('../models/Income');
const User = require('../models/User');
const mongoose = require('mongoose');
const { triggerAchievementCheck } = require('../utils/achievementHelper');

// @desc    Get all incomes for user
// @route   GET /api/income
// @access  Private
const getIncomes = async (req, res, next) => {
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

    const incomes = await Income.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Income.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        incomes,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: incomes.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single income
// @route   GET /api/income/:id
// @access  Private
const getIncome = async (req, res, next) => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { income }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new income
// @route   POST /api/income
// @access  Private
const createIncome = async (req, res, next) => {
  try {
    const incomeData = {
      ...req.body,
      user: req.user.id
    };

    const income = await Income.create(incomeData);

    // Update user's financial summary
    const user = await User.findById(req.user.id);
    await user.updateFinancialSummary();

    // Check for new achievements after income creation
    await triggerAchievementCheck(req.user);

    res.status(201).json({
      success: true,
      message: 'Income created successfully',
      data: { income }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update income
// @route   PUT /api/income/:id
// @access  Private
const updateIncome = async (req, res, next) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Update user's financial summary
    const user = await User.findById(req.user.id);
    await user.updateFinancialSummary();

    res.status(200).json({
      success: true,
      message: 'Income updated successfully',
      data: { income }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete income
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Update user's financial summary
    const user = await User.findById(req.user.id);
    await user.updateFinancialSummary();

    res.status(200).json({
      success: true,
      message: 'Income deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get income summary
// @route   GET /api/income/summary
// @access  Private
const getIncomeSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await Income.getIncomeSummary(req.user.id, start, end);
    const monthlyTrend = await Income.getMonthlyTrend(req.user.id);

    const totalIncome = summary.reduce((total, item) => total + item.totalAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalIncome,
          byCategory: summary,
          monthlyTrend
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get income by category
// @route   GET /api/income/by-category
// @access  Private
const getIncomeByCategory = async (req, res, next) => {
  try {
    const incomeByCategory = await Income.aggregate([
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
      data: { incomeByCategory }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recurring incomes
// @route   GET /api/income/recurring
// @access  Private
const getRecurringIncomes = async (req, res, next) => {
  try {
    const recurringIncomes = await Income.find({
      user: req.user.id,
      isRecurring: true
    }).sort({ nextRecurringDate: 1 });

    res.status(200).json({
      success: true,
      data: { recurringIncomes }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary,
  getIncomeByCategory,
  getRecurringIncomes
};
