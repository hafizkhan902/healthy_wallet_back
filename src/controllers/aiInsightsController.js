const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');
const User = require('../models/User');
const moment = require('moment');

// @desc    Get spending analysis with AI insights
// @route   GET /api/ai-insights/spending-analysis
// @access  Private
const getSpendingAnalysis = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = 3 } = req.query; // months

    const startDate = moment().subtract(parseInt(period), 'months').startOf('month').toDate();
    const endDate = moment().endOf('month').toDate();

    // Get spending patterns
    const spendingPatterns = await Expense.aggregate([
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
            dayOfWeek: { $dayOfWeek: '$date' },
            hour: { $hour: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          totalSpent: { $sum: '$totalAmount' },
          transactions: { $sum: '$count' },
          avgTransaction: { $avg: '$avgAmount' },
          patterns: {
            $push: {
              dayOfWeek: '$_id.dayOfWeek',
              hour: '$_id.hour',
              amount: '$totalAmount',
              count: '$count'
            }
          }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    // Analyze spending trends
    const monthlyTrend = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            category: '$category'
          },
          amount: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          monthlyData: {
            $push: {
              year: '$_id.year',
              month: '$_id.month',
              amount: '$amount'
            }
          }
        }
      }
    ]);

    // Generate insights
    const insights = generateSpendingInsights(spendingPatterns, monthlyTrend);

    res.status(200).json({
      success: true,
      data: {
        period: {
          months: parseInt(period),
          startDate,
          endDate
        },
        spendingPatterns,
        monthlyTrend,
        insights
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get savings recommendations
// @route   GET /api/ai-insights/savings-recommendations
// @access  Private
const getSavingsRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Get recent spending data
    const last3Months = moment().subtract(3, 'months').startOf('month').toDate();
    
    const [expenseAnalysis, incomeAnalysis] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: last3Months }
          }
        },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            count: { $sum: 1 },
            maxAmount: { $max: '$amount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),
      Income.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: last3Months }
          }
        },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: '$amount' },
            avgIncome: { $avg: '$amount' }
          }
        }
      ])
    ]);

    const totalIncome = incomeAnalysis[0]?.totalIncome || 0;
    const totalExpenses = expenseAnalysis.reduce((sum, cat) => sum + cat.totalAmount, 0);
    const currentSavingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Generate personalized recommendations
    const recommendations = generateSavingsRecommendations(
      expenseAnalysis, 
      totalIncome, 
      currentSavingsRate, 
      user.settings.currency
    );

    res.status(200).json({
      success: true,
      data: {
        currentFinancials: {
          totalIncome,
          totalExpenses,
          currentSavingsRate: Math.round(currentSavingsRate * 100) / 100,
          potentialMonthlySavings: recommendations.reduce((sum, rec) => sum + (rec.potentialSavings || 0), 0)
        },
        expenseBreakdown: expenseAnalysis,
        recommendations
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get goal achievement forecast
// @route   GET /api/ai-insights/goal-forecast/:goalId
// @access  Private
const getGoalForecast = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const userId = req.user.id;

    const goal = await Goal.findOne({ _id: goalId, user: userId });
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Analyze contribution history
    const contributionHistory = goal.contributions.slice(-12); // Last 12 contributions
    const avgContribution = contributionHistory.length > 0 
      ? contributionHistory.reduce((sum, c) => sum + c.amount, 0) / contributionHistory.length 
      : 0;

    // Calculate forecast scenarios
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const daysToTarget = moment(goal.targetDate).diff(moment(), 'days');

    const scenarios = {
      conservative: {
        monthlyContribution: avgContribution * 0.8,
        achievementDate: null,
        probability: 'Low'
      },
      realistic: {
        monthlyContribution: avgContribution,
        achievementDate: null,
        probability: 'Medium'
      },
      optimistic: {
        monthlyContribution: avgContribution * 1.2,
        achievementDate: null,
        probability: 'High'
      }
    };

    // Calculate achievement dates for each scenario
    Object.keys(scenarios).forEach(scenario => {
      const monthlyAmount = scenarios[scenario].monthlyContribution;
      if (monthlyAmount > 0) {
        const monthsNeeded = Math.ceil(remainingAmount / monthlyAmount);
        scenarios[scenario].achievementDate = moment().add(monthsNeeded, 'months').toDate();
        scenarios[scenario].monthsNeeded = monthsNeeded;
      }
    });

    // Generate recommendations
    const requiredMonthlyContribution = daysToTarget > 0 
      ? remainingAmount / (daysToTarget / 30.44) // Average days per month
      : remainingAmount;

    const recommendations = generateGoalRecommendations(
      goal, 
      avgContribution, 
      requiredMonthlyContribution,
      daysToTarget
    );

    res.status(200).json({
      success: true,
      data: {
        goal: {
          id: goal._id,
          title: goal.title,
          currentAmount: goal.currentAmount,
          targetAmount: goal.targetAmount,
          remainingAmount,
          progressPercentage: goal.progressPercentage,
          daysRemaining: daysToTarget
        },
        contributionAnalysis: {
          avgContribution: Math.round(avgContribution * 100) / 100,
          totalContributions: contributionHistory.length,
          requiredMonthlyContribution: Math.round(requiredMonthlyContribution * 100) / 100
        },
        scenarios,
        recommendations
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get financial health insights
// @route   GET /api/ai-insights/health-insights
// @access  Private
const getFinancialHealthInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Get comprehensive financial data
    const last6Months = moment().subtract(6, 'months').startOf('month').toDate();
    
    const [financialTrends, goalProgress, spendingVolatility] = await Promise.all([
      // Financial trends
      Promise.all([
        Income.getMonthlyTrend(userId, 6),
        Expense.getMonthlyTrend(userId, 6)
      ]),
      // Goal progress
      Goal.aggregate([
        { $match: { user: userId, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
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
      ]),
      // Spending volatility
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: last6Months }
          }
        },
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
            amounts: { $push: '$monthlyTotal' },
            avgMonthly: { $avg: '$monthlyTotal' }
          }
        }
      ])
    ]);

    const [incomeTrend, expenseTrend] = financialTrends;
    
    // Calculate insights
    const insights = generateHealthInsights(
      user,
      incomeTrend,
      expenseTrend,
      goalProgress,
      spendingVolatility[0]
    );

    res.status(200).json({
      success: true,
      data: {
        overallHealthScore: insights.healthScore,
        strengths: insights.strengths,
        concerns: insights.concerns,
        actionItems: insights.actionItems,
        trends: {
          income: incomeTrend,
          expenses: expenseTrend
        },
        goalProgress
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get budget suggestions
// @route   GET /api/ai-insights/budget-suggestions
// @access  Private
const getBudgetSuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { targetSavingsRate = 20 } = req.query;

    // Get historical data
    const last3Months = moment().subtract(3, 'months').startOf('month').toDate();
    
    const [avgIncome, categorySpending] = await Promise.all([
      Income.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: last3Months }
          }
        },
        {
          $group: {
            _id: null,
            avgMonthlyIncome: { $avg: { $sum: '$amount' } }
          }
        }
      ]),
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: last3Months }
          }
        },
        {
          $group: {
            _id: '$category',
            avgMonthlySpending: { $avg: { $sum: '$amount' } },
            totalSpending: { $sum: '$amount' }
          }
        },
        { $sort: { totalSpending: -1 } }
      ])
    ]);

    const monthlyIncome = avgIncome[0]?.avgMonthlyIncome || 0;
    const targetSavings = (monthlyIncome * parseFloat(targetSavingsRate)) / 100;
    const budgetForExpenses = monthlyIncome - targetSavings;

    // Generate budget suggestions
    const budgetSuggestions = generateBudgetSuggestions(
      categorySpending,
      budgetForExpenses,
      monthlyIncome
    );

    res.status(200).json({
      success: true,
      data: {
        income: {
          avgMonthlyIncome: Math.round(monthlyIncome * 100) / 100,
          targetSavingsRate: parseFloat(targetSavingsRate),
          targetSavings: Math.round(targetSavings * 100) / 100,
          budgetForExpenses: Math.round(budgetForExpenses * 100) / 100
        },
        currentSpending: categorySpending,
        budgetSuggestions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions for generating insights
const generateSpendingInsights = (patterns, trends) => {
  const insights = [];

  // Find highest spending category
  if (patterns.length > 0) {
    const topCategory = patterns[0];
    insights.push({
      type: 'spending_pattern',
      category: topCategory._id,
      message: `Your highest spending category is ${topCategory._id} with $${topCategory.totalSpent.toFixed(2)} spent.`,
      severity: 'info'
    });

    // Check for unusual spending patterns
    if (topCategory.totalSpent > topCategory.avgTransaction * topCategory.transactions * 1.5) {
      insights.push({
        type: 'unusual_spending',
        category: topCategory._id,
        message: `You have some unusually high transactions in ${topCategory._id}. Consider reviewing these expenses.`,
        severity: 'warning'
      });
    }
  }

  return insights;
};

const generateSavingsRecommendations = (expenses, income, savingsRate, currency) => {
  const recommendations = [];

  expenses.forEach(category => {
    const monthlyAvg = category.totalAmount / 3; // 3 months average
    
    // Suggest reductions for high-spending categories
    if (monthlyAvg > income * 0.15) { // More than 15% of income
      recommendations.push({
        category: category._id,
        type: 'reduce_spending',
        currentMonthly: Math.round(monthlyAvg * 100) / 100,
        suggestedReduction: Math.round(monthlyAvg * 0.2 * 100) / 100,
        potentialSavings: Math.round(monthlyAvg * 0.2 * 100) / 100,
        message: `Consider reducing ${category._id} spending by 20% to save $${Math.round(monthlyAvg * 0.2 * 100) / 100} monthly.`,
        difficulty: 'medium'
      });
    }
  });

  // Add general recommendations based on savings rate
  if (savingsRate < 10) {
    recommendations.unshift({
      type: 'increase_savings',
      message: 'Your current savings rate is below recommended levels. Aim for at least 10-20% of your income.',
      priority: 'high'
    });
  }

  return recommendations;
};

const generateGoalRecommendations = (goal, avgContribution, requiredContribution, daysRemaining) => {
  const recommendations = [];

  if (requiredContribution > avgContribution * 1.5) {
    recommendations.push({
      type: 'increase_contributions',
      message: `To reach your goal on time, you need to increase contributions to $${requiredContribution.toFixed(2)} per month.`,
      priority: 'high'
    });
  }

  if (daysRemaining < 30 && goal.progressPercentage < 80) {
    recommendations.push({
      type: 'extend_deadline',
      message: 'Consider extending your goal deadline to make it more achievable.',
      priority: 'medium'
    });
  }

  if (avgContribution > 0 && goal.progressPercentage > 50) {
    recommendations.push({
      type: 'on_track',
      message: 'You\'re making good progress! Keep up the consistent contributions.',
      priority: 'low'
    });
  }

  return recommendations;
};

const generateHealthInsights = (user, incomeTrend, expenseTrend, goalProgress, volatility) => {
  const insights = {
    healthScore: 75, // Base score
    strengths: [],
    concerns: [],
    actionItems: []
  };

  // Analyze income stability
  if (incomeTrend.length >= 3) {
    const incomeVariation = calculateVariation(incomeTrend.map(t => t.totalAmount));
    if (incomeVariation < 0.2) {
      insights.strengths.push('Stable income stream');
    } else {
      insights.concerns.push('Income volatility detected');
      insights.actionItems.push('Consider building a larger emergency fund due to income variability');
    }
  }

  // Analyze savings rate
  const savingsRate = user.financialSummary.savingsRate || 0;
  if (savingsRate >= 15) {
    insights.strengths.push('Excellent savings rate');
  } else if (savingsRate < 5) {
    insights.concerns.push('Low savings rate');
    insights.actionItems.push('Focus on increasing monthly savings to at least 10% of income');
  }

  return insights;
};

const generateBudgetSuggestions = (currentSpending, totalBudget, income) => {
  const suggestions = {};
  const totalCurrentSpending = currentSpending.reduce((sum, cat) => sum + cat.totalSpending, 0);
  
  // Standard budget percentages (50/30/20 rule adapted)
  const budgetGuidelines = {
    food: 0.15,
    transport: 0.15,
    bills: 0.25,
    entertainment: 0.10,
    shopping: 0.10,
    healthcare: 0.05,
    education: 0.05,
    travel: 0.05,
    other: 0.10
  };

  currentSpending.forEach(category => {
    const guideline = budgetGuidelines[category._id] || 0.05;
    const suggestedAmount = totalBudget * guideline;
    
    suggestions[category._id] = {
      current: Math.round(category.avgMonthlySpending * 100) / 100,
      suggested: Math.round(suggestedAmount * 100) / 100,
      difference: Math.round((suggestedAmount - category.avgMonthlySpending) * 100) / 100,
      status: category.avgMonthlySpending > suggestedAmount ? 'over_budget' : 'within_budget'
    };
  });

  return suggestions;
};

const calculateVariation = (values) => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / mean;
};

module.exports = {
  getSpendingAnalysis,
  getSavingsRecommendations,
  getGoalForecast,
  getFinancialHealthInsights,
  getBudgetSuggestions
};
