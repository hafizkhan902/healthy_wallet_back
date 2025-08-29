const User = require('../models/User');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');
const mongoose = require('mongoose');
const moment = require('moment');

// Achievement definitions with 10 levels
const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 1,
    name: "First Goal Achiever",
    description: "Complete your first financial goal within the deadline",
    category: "goals",
    icon: "🎯",
    criteria: "Complete 1 goal on time",
    points: 100
  },
  {
    id: 2,
    name: "Savings Improver",
    description: "Save more than your average of the past two months",
    category: "savings",
    icon: "📈",
    criteria: "Monthly savings > 2-month average",
    points: 150
  },
  {
    id: 3,
    name: "Consistent Tracker",
    description: "Add income or expense entries for 7 consecutive days",
    category: "consistency",
    icon: "📊",
    criteria: "7 consecutive days of entries",
    points: 200
  },
  {
    id: 4,
    name: "Budget Master",
    description: "Keep expenses under 80% of income for a full month",
    category: "savings",
    icon: "💰",
    criteria: "Monthly expense ratio < 80%",
    points: 250
  },
  {
    id: 5,
    name: "Goal Setter",
    description: "Create and actively work on 3 different goals simultaneously",
    category: "goals",
    icon: "🎯",
    criteria: "3 active goals with contributions",
    points: 300
  },
  {
    id: 6,
    name: "Emergency Fund Builder",
    description: "Build an emergency fund worth 3 months of expenses",
    category: "milestones",
    icon: "🛡️",
    criteria: "Emergency fund ≥ 3x monthly expenses",
    points: 400
  },
  {
    id: 7,
    name: "Savings Champion",
    description: "Maintain a savings rate of 20% or higher for 3 consecutive months",
    category: "savings",
    icon: "🏆",
    criteria: "20%+ savings rate for 3 months",
    points: 500
  },
  {
    id: 8,
    name: "Goal Completionist",
    description: "Successfully complete 5 financial goals",
    category: "goals",
    icon: "⭐",
    criteria: "Complete 5 goals total",
    points: 600
  },
  {
    id: 9,
    name: "Financial Discipline Master",
    description: "Track expenses daily for 30 consecutive days",
    category: "consistency",
    icon: "📝",
    criteria: "30 consecutive days of expense tracking",
    points: 750
  },
  {
    id: 10,
    name: "Wealth Builder Legend",
    description: "Achieve a net worth growth of 50% from your starting point",
    category: "milestones",
    icon: "👑",
    criteria: "50% net worth growth",
    points: 1000
  }
];

// @desc    Check and unlock new achievements for user
// @route   POST /api/users/check-achievements
// @access  Private
const checkAndUnlockAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current achievement IDs
    const currentAchievements = user.achievements.map(a => a.achievementId);
    const newAchievements = [];

    // Check each achievement
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      // Skip if already unlocked
      if (currentAchievements.includes(achievement.id)) {
        continue;
      }

      // Check if user qualifies for this achievement
      const qualifies = await checkAchievementCriteria(userId, achievement.id);
      
      if (qualifies) {
        // Add new achievement
        user.achievements.push({
          achievementId: achievement.id,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          icon: achievement.icon,
          points: achievement.points,
          earnedAt: new Date()
        });

        newAchievements.push({
          ...achievement,
          earnedAt: new Date()
        });
      }
    }

    // Save user if new achievements were unlocked
    if (newAchievements.length > 0) {
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        newAchievements,
        totalAchievements: user.achievements.length,
        totalPoints: user.achievements.reduce((sum, a) => sum + (a.points || 0), 0),
        message: newAchievements.length > 0 
          ? `Congratulations! You unlocked ${newAchievements.length} new achievement${newAchievements.length > 1 ? 's' : ''}!`
          : 'No new achievements unlocked'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all achievements (unlocked and locked)
// @route   GET /api/users/achievements/all
// @access  Private
const getAllAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const unlockedIds = user.achievements.map(a => a.achievementId);
    
    const allAchievements = ACHIEVEMENT_DEFINITIONS.map(achievement => {
      const unlocked = user.achievements.find(a => a.achievementId === achievement.id);
      
      return {
        ...achievement,
        unlocked: !!unlocked,
        earnedAt: unlocked?.earnedAt || null,
        progress: unlocked ? 100 : 0 // Can be enhanced with partial progress later
      };
    });

    const stats = {
      totalAchievements: ACHIEVEMENT_DEFINITIONS.length,
      unlockedCount: user.achievements.length,
      totalPoints: user.achievements.reduce((sum, a) => sum + (a.points || 0), 0),
      completionPercentage: Math.round((user.achievements.length / ACHIEVEMENT_DEFINITIONS.length) * 100)
    };

    res.status(200).json({
      success: true,
      data: {
        achievements: allAchievements,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get achievement leaderboard
// @route   GET /api/users/achievements/leaderboard
// @access  Private
const getAchievementLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await User.aggregate([
      {
        $addFields: {
          achievementCount: { $size: '$achievements' },
          totalPoints: {
            $reduce: {
              input: '$achievements',
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.points', 0] }] }
            }
          }
        }
      },
      {
        $sort: { totalPoints: -1, achievementCount: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          name: 1,
          achievementCount: 1,
          totalPoints: 1,
          lastAchievement: { $arrayElemAt: ['$achievements', -1] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        totalUsers: leaderboard.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to check achievement criteria
const checkAchievementCriteria = async (userId, achievementId) => {
  switch (achievementId) {
    case 1: // First Goal Achiever
      return await checkFirstGoalAchiever(userId);
    case 2: // Savings Improver
      return await checkSavingsImprover(userId);
    case 3: // Consistent Tracker
      return await checkConsistentTracker(userId);
    case 4: // Budget Master
      return await checkBudgetMaster(userId);
    case 5: // Goal Setter
      return await checkGoalSetter(userId);
    case 6: // Emergency Fund Builder
      return await checkEmergencyFundBuilder(userId);
    case 7: // Savings Champion
      return await checkSavingsChampion(userId);
    case 8: // Goal Completionist
      return await checkGoalCompletionist(userId);
    case 9: // Financial Discipline Master
      return await checkFinancialDisciplineMaster(userId);
    case 10: // Wealth Builder Legend
      return await checkWealthBuilderLegend(userId);
    default:
      return false;
  }
};

// Achievement criteria functions
const checkFirstGoalAchiever = async (userId) => {
  const completedGoals = await Goal.find({
    user: userId,
    status: 'completed'
  });

  // Check if any goal was completed before or on target date and reached target amount
  for (const goal of completedGoals) {
    const completionDate = goal.updatedAt;
    if (completionDate <= goal.targetDate && goal.currentAmount >= goal.targetAmount) {
      return true;
    }
  }
  return false;
};

const checkSavingsImprover = async (userId) => {
  const now = moment();
  const currentMonth = now.startOf('month').toDate();
  const twoMonthsAgo = moment().subtract(2, 'months').startOf('month').toDate();
  const oneMonthAgo = moment().subtract(1, 'months').startOf('month').toDate();

  // Get current month savings
  const [currentIncome, currentExpenses] = await Promise.all([
    Income.aggregate([
      { $match: { user: userId, date: { $gte: currentMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: currentMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  // Get past 2 months average
  const [pastIncome, pastExpenses] = await Promise.all([
    Income.aggregate([
      { $match: { user: userId, date: { $gte: twoMonthsAgo, $lt: oneMonthAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: twoMonthsAgo, $lt: oneMonthAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const currentSavings = (currentIncome[0]?.total || 0) - (currentExpenses[0]?.total || 0);
  const pastAvgSavings = ((pastIncome[0]?.total || 0) - (pastExpenses[0]?.total || 0)) / 2;

  return currentSavings > pastAvgSavings && pastAvgSavings > 0;
};

const checkConsistentTracker = async (userId) => {
  const sevenDaysAgo = moment().subtract(7, 'days').startOf('day').toDate();
  
  // Get all transactions in the last 7 days
  const [incomeEntries, expenseEntries] = await Promise.all([
    Income.find({ user: userId, date: { $gte: sevenDaysAgo } }).sort({ date: 1 }),
    Expense.find({ user: userId, date: { $gte: sevenDaysAgo } }).sort({ date: 1 })
  ]);

  // Check if there's at least one entry for each of the last 7 days
  const allEntries = [...incomeEntries, ...expenseEntries];
  const entryDates = new Set();
  
  allEntries.forEach(entry => {
    entryDates.add(moment(entry.date).format('YYYY-MM-DD'));
  });

  // Check if we have entries for 7 consecutive days
  let consecutiveDays = 0;
  for (let i = 0; i < 7; i++) {
    const checkDate = moment().subtract(i, 'days').format('YYYY-MM-DD');
    if (entryDates.has(checkDate)) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  return consecutiveDays >= 7;
};

const checkBudgetMaster = async (userId) => {
  const startOfMonth = moment().startOf('month').toDate();
  
  const [monthlyIncome, monthlyExpenses] = await Promise.all([
    Income.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const income = monthlyIncome[0]?.total || 0;
  const expenses = monthlyExpenses[0]?.total || 0;

  return income > 0 && (expenses / income) < 0.8;
};

const checkGoalSetter = async (userId) => {
  const activeGoals = await Goal.find({
    user: userId,
    status: 'active'
  });

  // Check if user has 3 active goals with at least one contribution each
  if (activeGoals.length < 3) return false;

  let goalsWithContributions = 0;
  for (const goal of activeGoals) {
    if (goal.contributions && goal.contributions.length > 0) {
      goalsWithContributions++;
    }
  }

  return goalsWithContributions >= 3;
};

const checkEmergencyFundBuilder = async (userId) => {
  const user = await User.findById(userId);
  const threeMonthsAgo = moment().subtract(3, 'months').startOf('month').toDate();

  // Get average monthly expenses over last 3 months
  const avgExpenses = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: threeMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        monthlyTotal: { $sum: '$amount' }
      }
    },
    {
      $group: {
        _id: null,
        avgMonthly: { $avg: '$monthlyTotal' }
      }
    }
  ]);

  const avgMonthlyExpenses = avgExpenses[0]?.avgMonthly || 0;
  const emergencyFundGoal = avgMonthlyExpenses * 3;

  return user.financialSummary.currentBalance >= emergencyFundGoal && emergencyFundGoal > 0;
};

const checkSavingsChampion = async (userId) => {
  // Simplified check for 20%+ savings rate over 3 months
  // For now, check if user has consistent positive savings
  const user = await User.findById(userId);
  const savingsRate = user.financialSummary.savingsRate || 0;
  
  // Simple check: if current savings rate is 20% or higher
  // In a real implementation, you'd check historical data
  return savingsRate >= 20;
};

const checkGoalCompletionist = async (userId) => {
  const completedGoalsCount = await Goal.countDocuments({
    user: userId,
    status: 'completed'
  });

  return completedGoalsCount >= 5;
};

const checkFinancialDisciplineMaster = async (userId) => {
  const thirtyDaysAgo = moment().subtract(30, 'days').startOf('day').toDate();
  
  const expenseEntries = await Expense.find({
    user: userId,
    date: { $gte: thirtyDaysAgo }
  }).sort({ date: 1 });

  // Check if there's at least one expense entry for each of the last 30 days
  const entryDates = new Set();
  expenseEntries.forEach(entry => {
    entryDates.add(moment(entry.date).format('YYYY-MM-DD'));
  });

  let consecutiveDays = 0;
  for (let i = 0; i < 30; i++) {
    const checkDate = moment().subtract(i, 'days').format('YYYY-MM-DD');
    if (entryDates.has(checkDate)) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  return consecutiveDays >= 30;
};

const checkWealthBuilderLegend = async (userId) => {
  const user = await User.findById(userId);
  
  // Get user's first transaction to establish starting point
  const [firstIncome, firstExpense] = await Promise.all([
    Income.findOne({ user: userId }).sort({ date: 1 }),
    Expense.findOne({ user: userId }).sort({ date: 1 })
  ]);

  if (!firstIncome && !firstExpense) return false;

  const startDate = firstIncome && firstExpense 
    ? (firstIncome.date < firstExpense.date ? firstIncome.date : firstExpense.date)
    : (firstIncome ? firstIncome.date : firstExpense.date);

  // Calculate net worth at start (assuming started at 0)
  const startingNetWorth = 0;
  const currentNetWorth = user.financialSummary.currentBalance;

  // Check if current net worth is 50% higher than starting point
  const growthTarget = startingNetWorth + (Math.abs(startingNetWorth) * 0.5);
  
  return currentNetWorth >= growthTarget && currentNetWorth > 1000; // Minimum threshold
};

module.exports = {
  checkAndUnlockAchievements,
  getAllAchievements,
  getAchievementLeaderboard,
  ACHIEVEMENT_DEFINITIONS
};
