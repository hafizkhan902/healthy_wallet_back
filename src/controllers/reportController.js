const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');
const User = require('../models/User');
const moment = require('moment');
const mongoose = require('mongoose');

// Helper function to calculate financial health score
const calculateFinancialHealthScore = (income, expenses, savings) => {
  if (income === 0) return 0;
  
  const savingsRate = (savings / income) * 100;
  const expenseRatio = (expenses / income) * 100;
  
  let score = 50; // Base score
  
  // Savings rate contribution (0-40 points)
  if (savingsRate >= 20) score += 40;
  else if (savingsRate >= 15) score += 30;
  else if (savingsRate >= 10) score += 20;
  else if (savingsRate >= 5) score += 10;
  else if (savingsRate < 0) score -= 20;
  
  // Expense ratio contribution (0-30 points)
  if (expenseRatio <= 50) score += 30;
  else if (expenseRatio <= 70) score += 20;
  else if (expenseRatio <= 90) score += 10;
  else if (expenseRatio > 100) score -= 20;
  
  // Income stability (0-20 points) - simplified for now
  score += 10; // Assume some stability
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Helper function to get financial health status
const getFinancialHealthStatus = (income, expenses, savings) => {
  const score = calculateFinancialHealthScore(income, expenses, savings);
  
  if (score >= 80) return { level: 'Excellent', color: 'green', message: 'Your financial health is excellent!' };
  if (score >= 60) return { level: 'Good', color: 'blue', message: 'Your financial health is good.' };
  if (score >= 40) return { level: 'Fair', color: 'yellow', message: 'Your financial health needs attention.' };
  if (score >= 20) return { level: 'Poor', color: 'orange', message: 'Your financial health needs improvement.' };
  return { level: 'Critical', color: 'red', message: 'Immediate financial attention required.' };
};

// @desc    Get dashboard data
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get current month data
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();
    
    // Get this month's income and expenses
    const [monthlyIncome, monthlyExpenses] = await Promise.all([
      Income.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Expense.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const monthlyIncomeTotal = monthlyIncome[0]?.total || 0;
    const monthlyExpensesTotal = monthlyExpenses[0]?.total || 0;
    const monthlySavings = monthlyIncomeTotal - monthlyExpensesTotal;

    // Get recent transactions
    const [recentIncome, recentExpenses] = await Promise.all([
      Income.find({ user: new mongoose.Types.ObjectId(userId) }).sort({ date: -1 }).limit(5),
      Expense.find({ user: new mongoose.Types.ObjectId(userId) }).sort({ date: -1 }).limit(5)
    ]);

    // Get goals summary
    const activeGoals = await Goal.find({ 
      user: new mongoose.Types.ObjectId(userId), 
      status: 'active' 
    }).sort({ targetDate: 1 }).limit(5);

    // Get top expense categories this month
    const topExpenseCategories = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    // Get additional comprehensive data
    const [yearlyIncome, yearlyExpenses, incomeByCategory, expensesByCategory] = await Promise.all([
      // Yearly totals
      Income.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            date: { 
              $gte: moment().startOf('year').toDate(),
              $lte: moment().endOf('year').toDate()
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        }
      ]),
      Expense.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            date: { 
              $gte: moment().startOf('year').toDate(),
              $lte: moment().endOf('year').toDate()
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        }
      ]),
      // Income by category
      Income.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        },
        { $sort: { total: -1 } }
      ]),
      // All expense categories for the month
      Expense.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        },
        { $sort: { total: -1 } }
      ])
    ]);

    // Calculate additional metrics
    const yearlyIncomeTotal = yearlyIncome[0]?.total || 0;
    const yearlyExpensesTotal = yearlyExpenses[0]?.total || 0;
    const yearlySavings = yearlyIncomeTotal - yearlyExpensesTotal;

    // Calculate percentages for categories
    const incomeWithPercentages = incomeByCategory.map(category => ({
      ...category,
      percentage: monthlyIncomeTotal > 0 ? ((category.total / monthlyIncomeTotal) * 100).toFixed(2) : 0
    }));

    const expensesWithPercentages = expensesByCategory.map(category => ({
      ...category,
      percentage: monthlyExpensesTotal > 0 ? ((category.total / monthlyExpensesTotal) * 100).toFixed(2) : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        monthlyOverview: {
          income: monthlyIncomeTotal,
          expenses: monthlyExpensesTotal,
          savings: monthlySavings,
          savingsRate: monthlyIncomeTotal > 0 ? ((monthlySavings / monthlyIncomeTotal) * 100).toFixed(2) : 0,
          incomeCount: monthlyIncome[0]?.count || 0,
          expenseCount: monthlyExpenses[0]?.count || 0
        },
        yearlyOverview: {
          income: yearlyIncomeTotal,
          expenses: yearlyExpensesTotal,
          savings: yearlySavings,
          savingsRate: yearlyIncomeTotal > 0 ? ((yearlySavings / yearlyIncomeTotal) * 100).toFixed(2) : 0,
          avgMonthlyIncome: yearlyIncomeTotal / 12,
          avgMonthlyExpenses: yearlyExpensesTotal / 12,
          incomeCount: yearlyIncome[0]?.count || 0,
          expenseCount: yearlyExpenses[0]?.count || 0
        },
        categoryBreakdown: {
          income: incomeWithPercentages,
          expenses: expensesWithPercentages
        },
        recentTransactions: {
          income: recentIncome,
          expenses: recentExpenses
        },
        activeGoals: activeGoals.map(goal => ({
          ...goal.toObject(),
          progressPercentage: goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(2) : 0,
          remainingAmount: Math.max(0, goal.targetAmount - goal.currentAmount),
          daysRemaining: goal.targetDate ? Math.max(0, moment(goal.targetDate).diff(moment(), 'days')) : null
        })),
        topExpenseCategories: topExpenseCategories.map(category => ({
          ...category,
          percentage: monthlyExpensesTotal > 0 ? ((category.total / monthlyExpensesTotal) * 100).toFixed(2) : 0
        })),
        financialHealth: {
          score: calculateFinancialHealthScore(monthlyIncomeTotal, monthlyExpensesTotal, monthlySavings),
          status: getFinancialHealthStatus(monthlyIncomeTotal, monthlyExpensesTotal, monthlySavings)
        },
        period: {
          currentMonth: moment().format('MMMM YYYY'),
          currentYear: moment().format('YYYY'),
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly report
// @route   GET /api/reports/monthly/:year/:month
// @access  Private
const getMonthlyReport = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.id;

    const startDate = moment(`${year}-${month.toString().padStart(2, '0')}-01`).startOf('month').toDate();
    const endDate = moment(`${year}-${month.toString().padStart(2, '0')}-01`).endOf('month').toDate();

    // Get monthly income and expenses
    const [incomeData, expenseData] = await Promise.all([
      Income.getIncomeSummary(userId, startDate, endDate),
      Expense.getExpenseSummary(userId, startDate, endDate)
    ]);

    const totalIncome = incomeData.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + item.totalAmount, 0);
    const netSavings = totalIncome - totalExpenses;

    // Get daily breakdown
    const dailyBreakdown = await Promise.all([
      Income.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: '$date' },
            income: { $sum: '$amount' }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: '$date' },
            expenses: { $sum: '$amount' }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: {
          year: parseInt(year),
          month: parseInt(month),
          monthName: moment(`${year}-${month.toString().padStart(2, '0')}-01`).format('MMMM YYYY')
        },
        summary: {
          totalIncome,
          totalExpenses,
          netSavings,
          savingsRate: totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0
        },
        incomeByCategory: incomeData,
        expensesByCategory: expenseData,
        dailyBreakdown: {
          income: dailyBreakdown[0],
          expenses: dailyBreakdown[1]
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category analysis
// @route   GET /api/reports/category-analysis
// @access  Private
const getCategoryAnalysis = async (req, res, next) => {
  try {
    const { period = '12' } = req.query; // months
    const userId = req.user.id;
    
    const startDate = moment().subtract(parseInt(period), 'months').startOf('month').toDate();
    const endDate = moment().endOf('month').toDate();

    const [incomeAnalysis, expenseAnalysis] = await Promise.all([
      Income.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              category: '$category',
              month: { $month: '$date' },
              year: { $year: '$date' }
            },
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.category',
            monthlyData: {
              $push: {
                month: '$_id.month',
                year: '$_id.year',
                amount: '$amount',
                count: '$count'
              }
            },
            totalAmount: { $sum: '$amount' },
            avgMonthly: { $avg: '$amount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              category: '$category',
              month: { $month: '$date' },
              year: { $year: '$date' }
            },
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.category',
            monthlyData: {
              $push: {
                month: '$_id.month',
                year: '$_id.year',
                amount: '$amount',
                count: '$count'
              }
            },
            totalAmount: { $sum: '$amount' },
            avgMonthly: { $avg: '$amount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: {
          months: parseInt(period),
          startDate,
          endDate
        },
        incomeAnalysis,
        expenseAnalysis
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trend analysis
// @route   GET /api/reports/trend-analysis
// @access  Private
const getTrendAnalysis = async (req, res, next) => {
  try {
    const { months = 12 } = req.query;
    const userId = req.user.id;

    const [incomeTrend, expenseTrend] = await Promise.all([
      Income.getMonthlyTrend(userId, parseInt(months)),
      Expense.getMonthlyTrend(userId, parseInt(months))
    ]);

    // Calculate savings trend
    const savingsTrend = incomeTrend.map(incomeMonth => {
      const expenseMonth = expenseTrend.find(
        exp => exp._id.year === incomeMonth._id.year && exp._id.month === incomeMonth._id.month
      );
      
      return {
        _id: incomeMonth._id,
        savings: incomeMonth.totalAmount - (expenseMonth?.totalAmount || 0),
        savingsRate: incomeMonth.totalAmount > 0 
          ? ((incomeMonth.totalAmount - (expenseMonth?.totalAmount || 0)) / incomeMonth.totalAmount) * 100 
          : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        incomeTrend,
        expenseTrend,
        savingsTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get financial health score
// @route   GET /api/reports/health-score
// @access  Private
const getFinancialHealthScore = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Calculate various health metrics
    const savingsRate = user.financialSummary.savingsRate || 0;
    const currentBalance = user.financialSummary.currentBalance || 0;
    
    // Get goals progress
    const goalsData = await Goal.aggregate([
      { $match: { user: userId, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalGoals: { $sum: 1 },
          completedGoals: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgProgress: {
            $avg: {
              $multiply: [
                { $divide: ['$currentAmount', '$targetAmount'] },
                100
              ]
            }
          }
        }
      }
    ]);

    const goalsProgress = goalsData[0]?.avgProgress || 0;
    const goalsCompletionRate = goalsData[0]?.totalGoals > 0 
      ? (goalsData[0].completedGoals / goalsData[0].totalGoals) * 100 
      : 0;

    // Calculate health score (0-100)
    let healthScore = 0;
    const factors = [];

    // Savings rate factor (30% weight)
    if (savingsRate >= 20) {
      healthScore += 30;
      factors.push({ name: 'Savings Rate', score: 30, status: 'excellent' });
    } else if (savingsRate >= 10) {
      healthScore += 20;
      factors.push({ name: 'Savings Rate', score: 20, status: 'good' });
    } else if (savingsRate >= 5) {
      healthScore += 10;
      factors.push({ name: 'Savings Rate', score: 10, status: 'fair' });
    } else {
      factors.push({ name: 'Savings Rate', score: 0, status: 'poor' });
    }

    // Balance factor (25% weight)
    if (currentBalance >= 5000) {
      healthScore += 25;
      factors.push({ name: 'Current Balance', score: 25, status: 'excellent' });
    } else if (currentBalance >= 1000) {
      healthScore += 18;
      factors.push({ name: 'Current Balance', score: 18, status: 'good' });
    } else if (currentBalance >= 0) {
      healthScore += 10;
      factors.push({ name: 'Current Balance', score: 10, status: 'fair' });
    } else {
      factors.push({ name: 'Current Balance', score: 0, status: 'poor' });
    }

    // Goals progress factor (25% weight)
    if (goalsProgress >= 80) {
      healthScore += 25;
      factors.push({ name: 'Goals Progress', score: 25, status: 'excellent' });
    } else if (goalsProgress >= 60) {
      healthScore += 18;
      factors.push({ name: 'Goals Progress', score: 18, status: 'good' });
    } else if (goalsProgress >= 30) {
      healthScore += 10;
      factors.push({ name: 'Goals Progress', score: 10, status: 'fair' });
    } else {
      factors.push({ name: 'Goals Progress', score: 0, status: 'poor' });
    }

    // Goals completion factor (20% weight)
    if (goalsCompletionRate >= 70) {
      healthScore += 20;
      factors.push({ name: 'Goals Completion', score: 20, status: 'excellent' });
    } else if (goalsCompletionRate >= 50) {
      healthScore += 15;
      factors.push({ name: 'Goals Completion', score: 15, status: 'good' });
    } else if (goalsCompletionRate >= 25) {
      healthScore += 8;
      factors.push({ name: 'Goals Completion', score: 8, status: 'fair' });
    } else {
      factors.push({ name: 'Goals Completion', score: 0, status: 'poor' });
    }

    let healthStatus = 'Poor';
    if (healthScore >= 80) healthStatus = 'Excellent';
    else if (healthScore >= 60) healthStatus = 'Good';
    else if (healthScore >= 40) healthStatus = 'Fair';

    res.status(200).json({
      success: true,
      data: {
        healthScore: Math.round(healthScore),
        healthStatus,
        factors,
        recommendations: generateRecommendations(factors, savingsRate, currentBalance)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export user data
// @route   GET /api/reports/export
// @access  Private
const exportData = async (req, res, next) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    const userId = req.user.id;

    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    const [income, expenses, goals, user] = await Promise.all([
      Income.find({ 
        user: userId,
        date: { $gte: start, $lte: end }
      }).sort({ date: -1 }),
      Expense.find({ 
        user: userId,
        date: { $gte: start, $lte: end }
      }).sort({ date: -1 }),
      Goal.find({ user: userId }),
      User.findById(userId)
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        memberSince: user.createdAt
      },
      income,
      expenses,
      goals,
      summary: user.financialSummary
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=healthywallet-export.json');
      res.status(200).json(exportData);
    } else {
      // For CSV format, you would implement CSV conversion here
      res.status(400).json({
        success: false,
        message: 'CSV export not implemented yet'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Helper function to generate recommendations
const generateRecommendations = (factors, savingsRate, currentBalance) => {
  const recommendations = [];

  const poorFactors = factors.filter(f => f.status === 'poor');
  const fairFactors = factors.filter(f => f.status === 'fair');

  if (savingsRate < 10) {
    recommendations.push({
      type: 'savings',
      priority: 'high',
      title: 'Increase Your Savings Rate',
      description: 'Aim to save at least 10-20% of your income. Consider reducing non-essential expenses.'
    });
  }

  if (currentBalance < 1000) {
    recommendations.push({
      type: 'emergency',
      priority: 'high',
      title: 'Build an Emergency Fund',
      description: 'Start building an emergency fund that covers 3-6 months of expenses.'
    });
  }

  if (poorFactors.some(f => f.name === 'Goals Progress')) {
    recommendations.push({
      type: 'goals',
      priority: 'medium',
      title: 'Focus on Your Financial Goals',
      description: 'Review your goals and create a plan to make consistent progress.'
    });
  }

  return recommendations;
};

module.exports = {
  getDashboardData,
  getMonthlyReport,
  getCategoryAnalysis,
  getTrendAnalysis,
  getFinancialHealthScore,
  exportData
};
