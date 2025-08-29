const User = require('../models/User');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          profilePicture: user.profilePicture,
          achievements: user.achievements,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, bio } = req.body;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(bio !== undefined && { bio })
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          profilePicture: user.profilePicture
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  try {
    const { theme, notifications, privacy } = req.body;

    const updateData = {};
    if (theme) updateData['settings.theme'] = theme;
    if (notifications) {
      if (notifications.email !== undefined) updateData['settings.notifications.email'] = notifications.email;
      if (notifications.push !== undefined) updateData['settings.notifications.push'] = notifications.push;
      if (notifications.goalReminders !== undefined) updateData['settings.notifications.goalReminders'] = notifications.goalReminders;
      if (notifications.weeklyReports !== undefined) updateData['settings.notifications.weeklyReports'] = notifications.weeklyReports;
    }
    if (privacy && privacy.dataSharing !== undefined) {
      updateData['settings.privacy.dataSharing'] = privacy.dataSharing;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        settings: user.settings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get financial summary
// @route   GET /api/users/financial-summary
// @access  Private
const getFinancialSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Update financial summary
    await user.updateFinancialSummary();

    // Get additional stats
    const totalGoals = await Goal.countDocuments({ user: req.user.id });
    const completedGoals = await Goal.countDocuments({ user: req.user.id, status: 'completed' });
    const activeGoals = await Goal.countDocuments({ user: req.user.id, status: 'active' });

    // Get this month's data
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyIncome = await Income.aggregate([
      {
        $match: {
          user: req.user.id,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.user.id,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        financialSummary: {
          ...user.financialSummary.toObject(),
          monthlyIncome: monthlyIncome[0]?.total || 0,
          monthlyExpenses: monthlyExpenses[0]?.total || 0,
          monthlySavings: (monthlyIncome[0]?.total || 0) - (monthlyExpenses[0]?.total || 0)
        },
        goals: {
          total: totalGoals,
          completed: completedGoals,
          active: activeGoals
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user achievements
// @route   GET /api/users/achievements
// @access  Private
const getAchievements = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        achievements: user.achievements
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    // Delete all user data
    await Promise.all([
      Income.deleteMany({ user: req.user.id }),
      Expense.deleteMany({ user: req.user.id }),
      Goal.deleteMany({ user: req.user.id }),
      User.findByIdAndDelete(req.user.id)
    ]);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateSettings,
  getFinancialSummary,
  getAchievements,
  deleteAccount
};
