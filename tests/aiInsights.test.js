const request = require('supertest');
const { createAuthenticatedUser, createTestData, createTestGoal, getAuthHeaders, app } = require('./helpers/testHelpers');

describe('AI Insights Endpoints', () => {
  let authData;

  beforeEach(async () => {
    authData = await createAuthenticatedUser();
  });

  describe('GET /api/ai-insights/spending-analysis', () => {
    test('Should get spending pattern analysis', async () => {
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/ai-insights/spending-analysis')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBeDefined();
      expect(response.body.data.spendingPatterns).toBeDefined();
      expect(response.body.data.monthlyTrend).toBeDefined();
      expect(response.body.data.insights).toBeDefined();
      expect(Array.isArray(response.body.data.spendingPatterns)).toBe(true);
      expect(Array.isArray(response.body.data.monthlyTrend)).toBe(true);
      expect(Array.isArray(response.body.data.insights)).toBe(true);
    });

    test('Should support custom period parameter', async () => {
      const response = await request(app())
        .get('/api/ai-insights/spending-analysis?period=6')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.period.months).toBe(6);
    });

    test('Should return empty analysis for new user', async () => {
      const response = await request(app())
        .get('/api/ai-insights/spending-analysis')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.spendingPatterns.length).toBe(0);
      expect(response.body.data.insights.length).toBe(0);
    });
  });

  describe('GET /api/ai-insights/savings-recommendations', () => {
    test('Should get personalized savings recommendations', async () => {
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/ai-insights/savings-recommendations')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentFinancials).toBeDefined();
      expect(response.body.data.expenseBreakdown).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.currentFinancials.totalIncome).toBeGreaterThan(0);
      expect(response.body.data.currentFinancials.totalExpenses).toBeGreaterThan(0);
      expect(response.body.data.currentFinancials.currentSavingsRate).toBeDefined();
      expect(Array.isArray(response.body.data.expenseBreakdown)).toBe(true);
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    test('Should provide recommendations based on spending patterns', async () => {
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/ai-insights/savings-recommendations')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      
      // Should have some recommendations for users with spending data
      if (response.body.data.recommendations.length > 0) {
        const recommendation = response.body.data.recommendations[0];
        expect(recommendation.type || recommendation.category).toBeDefined();
        expect(recommendation.message).toBeDefined();
      }
    });

    test('Should handle user with no financial data', async () => {
      const response = await request(app())
        .get('/api/ai-insights/savings-recommendations')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.currentFinancials.totalIncome).toBe(0);
      expect(response.body.data.currentFinancials.totalExpenses).toBe(0);
    });
  });

  describe('GET /api/ai-insights/goal-forecast/:goalId', () => {
    test('Should get goal achievement forecast', async () => {
      const goal = await createTestGoal(authData.userId, {
        targetAmount: 10000,
        currentAmount: 2000
      });

      // Add some contribution history
      goal.contributions.push(
        { amount: 500, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), source: 'manual' },
        { amount: 500, date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), source: 'manual' },
        { amount: 500, date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), source: 'manual' }
      );
      await goal.save();

      const response = await request(app())
        .get(`/api/ai-insights/goal-forecast/${goal._id}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.goal).toBeDefined();
      expect(response.body.data.contributionAnalysis).toBeDefined();
      expect(response.body.data.scenarios).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
      
      // Check goal data
      expect(response.body.data.goal.id).toBe(goal._id.toString());
      expect(response.body.data.goal.remainingAmount).toBe(8000);
      expect(response.body.data.goal.progressPercentage).toBe(20);
      
      // Check scenarios
      expect(response.body.data.scenarios.conservative).toBeDefined();
      expect(response.body.data.scenarios.realistic).toBeDefined();
      expect(response.body.data.scenarios.optimistic).toBeDefined();
      
      // Check contribution analysis
      expect(response.body.data.contributionAnalysis.avgContribution).toBeGreaterThan(0);
      expect(response.body.data.contributionAnalysis.totalContributions).toBe(3);
    });

    test('Should return 404 for non-existent goal', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app())
        .get(`/api/ai-insights/goal-forecast/${fakeId}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should not access other user\'s goal', async () => {
      // Create another user and their goal
      const otherUser = await createAuthenticatedUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });
      const otherGoal = await createTestGoal(otherUser.userId);

      const response = await request(app())
        .get(`/api/ai-insights/goal-forecast/${otherGoal._id}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should handle goal with no contribution history', async () => {
      const goal = await createTestGoal(authData.userId);

      const response = await request(app())
        .get(`/api/ai-insights/goal-forecast/${goal._id}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.contributionAnalysis.avgContribution).toBe(0);
      expect(response.body.data.contributionAnalysis.totalContributions).toBe(0);
    });
  });

  describe('GET /api/ai-insights/health-insights', () => {
    test('Should get financial health insights', async () => {
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/ai-insights/health-insights')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overallHealthScore).toBeDefined();
      expect(response.body.data.strengths).toBeDefined();
      expect(response.body.data.concerns).toBeDefined();
      expect(response.body.data.actionItems).toBeDefined();
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.goalProgress).toBeDefined();
      
      expect(typeof response.body.data.overallHealthScore).toBe('number');
      expect(Array.isArray(response.body.data.strengths)).toBe(true);
      expect(Array.isArray(response.body.data.concerns)).toBe(true);
      expect(Array.isArray(response.body.data.actionItems)).toBe(true);
      expect(response.body.data.trends.income).toBeDefined();
      expect(response.body.data.trends.expenses).toBeDefined();
    });

    test('Should provide insights for new user', async () => {
      const response = await request(app())
        .get('/api/ai-insights/health-insights')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.overallHealthScore).toBeDefined();
      expect(response.body.data.trends.income.length).toBe(0);
      expect(response.body.data.trends.expenses.length).toBe(0);
    });
  });

  describe('GET /api/ai-insights/budget-suggestions', () => {
    test('Should get AI budget recommendations', async () => {
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/ai-insights/budget-suggestions')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.income).toBeDefined();
      expect(response.body.data.currentSpending).toBeDefined();
      expect(response.body.data.budgetSuggestions).toBeDefined();
      
      expect(response.body.data.income.avgMonthlyIncome).toBeGreaterThan(0);
      expect(response.body.data.income.targetSavingsRate).toBe(20); // default
      expect(response.body.data.income.targetSavings).toBeGreaterThan(0);
      expect(response.body.data.income.budgetForExpenses).toBeGreaterThan(0);
      
      expect(Array.isArray(response.body.data.currentSpending)).toBe(true);
      expect(typeof response.body.data.budgetSuggestions).toBe('object');
    });

    test('Should support custom target savings rate', async () => {
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/ai-insights/budget-suggestions?targetSavingsRate=30')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.income.targetSavingsRate).toBe(30);
    });

    test('Should provide budget suggestions based on spending categories', async () => {
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/ai-insights/budget-suggestions')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      
      // Should have budget suggestions for different categories
      const suggestions = response.body.data.budgetSuggestions;
      if (Object.keys(suggestions).length > 0) {
        const firstCategory = Object.keys(suggestions)[0];
        const suggestion = suggestions[firstCategory];
        
        expect(suggestion.current).toBeDefined();
        expect(suggestion.suggested).toBeDefined();
        expect(suggestion.difference).toBeDefined();
        expect(suggestion.status).toBeDefined();
        expect(['over_budget', 'within_budget']).toContain(suggestion.status);
      }
    });

    test('Should handle user with no spending data', async () => {
      const response = await request(app())
        .get('/api/ai-insights/budget-suggestions')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.income.avgMonthlyIncome).toBe(0);
      expect(response.body.data.currentSpending.length).toBe(0);
    });
  });

  describe('Authentication required for all AI endpoints', () => {
    test('Should require authentication for spending analysis', async () => {
      const response = await request(app())
        .get('/api/ai-insights/spending-analysis');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Should require authentication for savings recommendations', async () => {
      const response = await request(app())
        .get('/api/ai-insights/savings-recommendations');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Should require authentication for goal forecast', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app())
        .get(`/api/ai-insights/goal-forecast/${fakeId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Should require authentication for health insights', async () => {
      const response = await request(app())
        .get('/api/ai-insights/health-insights');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Should require authentication for budget suggestions', async () => {
      const response = await request(app())
        .get('/api/ai-insights/budget-suggestions');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
