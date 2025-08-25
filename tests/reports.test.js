const request = require('supertest');
const { createAuthenticatedUser, createTestData, getAuthHeaders, app } = require('./helpers/testHelpers');

describe('Reports & Analytics Endpoints', () => {
  let authData;

  beforeEach(async () => {
    authData = await createAuthenticatedUser();
  });

  describe('GET /api/reports/dashboard', () => {
    test('Should get dashboard data', async () => {
      // Create test data
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/reports/dashboard')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.monthlyOverview).toBeDefined();
      expect(response.body.data.monthlyOverview.income).toBeGreaterThan(0);
      expect(response.body.data.monthlyOverview.expenses).toBeGreaterThan(0);
      expect(response.body.data.monthlyOverview.savings).toBeDefined();
      expect(response.body.data.monthlyOverview.savingsRate).toBeDefined();
      expect(response.body.data.recentTransactions).toBeDefined();
      expect(response.body.data.activeGoals).toBeDefined();
      expect(response.body.data.topExpenseCategories).toBeDefined();
    });

    test('Should return empty data for new user', async () => {
      const response = await request(app())
        .get('/api/reports/dashboard')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.monthlyOverview.income).toBe(0);
      expect(response.body.data.monthlyOverview.expenses).toBe(0);
    });
  });

  describe('GET /api/reports/monthly/:year/:month', () => {
    test('Should get monthly report', async () => {
      await createTestData(authData.userId);
      
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const response = await request(app())
        .get(`/api/reports/monthly/${year}/${month}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.period.year).toBe(year);
      expect(response.body.data.period.month).toBe(month);
      expect(response.body.data.period.monthName).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalIncome).toBeGreaterThan(0);
      expect(response.body.data.summary.totalExpenses).toBeGreaterThan(0);
      expect(response.body.data.incomeByCategory).toBeDefined();
      expect(response.body.data.expensesByCategory).toBeDefined();
      expect(response.body.data.dailyBreakdown).toBeDefined();
    });

    test('Should handle future months', async () => {
      const futureYear = new Date().getFullYear() + 1;
      const month = 1;

      const response = await request(app())
        .get(`/api/reports/monthly/${futureYear}/${month}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.summary.totalIncome).toBe(0);
      expect(response.body.data.summary.totalExpenses).toBe(0);
    });
  });

  describe('GET /api/reports/category-analysis', () => {
    test('Should get category analysis', async () => {
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/reports/category-analysis')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBeDefined();
      expect(response.body.data.incomeAnalysis).toBeDefined();
      expect(response.body.data.expenseAnalysis).toBeDefined();
      expect(Array.isArray(response.body.data.incomeAnalysis)).toBe(true);
      expect(Array.isArray(response.body.data.expenseAnalysis)).toBe(true);
    });

    test('Should support custom period', async () => {
      const response = await request(app())
        .get('/api/reports/category-analysis?period=6')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.period.months).toBe(6);
    });
  });

  describe('GET /api/reports/trend-analysis', () => {
    test('Should get trend analysis', async () => {
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/reports/trend-analysis')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.incomeTrend).toBeDefined();
      expect(response.body.data.expenseTrend).toBeDefined();
      expect(response.body.data.savingsTrend).toBeDefined();
      expect(Array.isArray(response.body.data.incomeTrend)).toBe(true);
      expect(Array.isArray(response.body.data.expenseTrend)).toBe(true);
      expect(Array.isArray(response.body.data.savingsTrend)).toBe(true);
    });

    test('Should support custom months parameter', async () => {
      const response = await request(app())
        .get('/api/reports/trend-analysis?months=6')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/reports/health-score', () => {
    test('Should get financial health score', async () => {
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/reports/health-score')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.healthScore).toBeDefined();
      expect(response.body.data.healthStatus).toBeDefined();
      expect(response.body.data.factors).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
      expect(typeof response.body.data.healthScore).toBe('number');
      expect(response.body.data.healthScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.healthScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(response.body.data.factors)).toBe(true);
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    test('Should provide health status categories', async () => {
      const response = await request(app())
        .get('/api/reports/health-score')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(['Poor', 'Fair', 'Good', 'Excellent']).toContain(response.body.data.healthStatus);
    });
  });

  describe('GET /api/reports/export', () => {
    test('Should export user data in JSON format', async () => {
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/reports/export?format=json')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.exportDate).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.income).toBeDefined();
      expect(response.body.expenses).toBeDefined();
      expect(response.body.goals).toBeDefined();
      expect(response.body.summary).toBeDefined();
      expect(Array.isArray(response.body.income)).toBe(true);
      expect(Array.isArray(response.body.expenses)).toBe(true);
      expect(Array.isArray(response.body.goals)).toBe(true);
    });

    test('Should support date range filtering', async () => {
      await createTestData(authData.userId);
      
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();

      const response = await request(app())
        .get(`/api/reports/export?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.income).toBeDefined();
      expect(response.body.expenses).toBeDefined();
    });

    test('Should return error for unsupported format', async () => {
      const response = await request(app())
        .get('/api/reports/export?format=csv')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('CSV export not implemented');
    });

    test('Should export empty data for new user', async () => {
      const response = await request(app())
        .get('/api/reports/export')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.income.length).toBe(0);
      expect(response.body.expenses.length).toBe(0);
      expect(response.body.goals.length).toBe(0);
    });
  });

  describe('Authentication required for all endpoints', () => {
    test('Should require authentication for dashboard', async () => {
      const response = await request(app())
        .get('/api/reports/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Should require authentication for monthly report', async () => {
      const response = await request(app())
        .get('/api/reports/monthly/2024/1');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Should require authentication for health score', async () => {
      const response = await request(app())
        .get('/api/reports/health-score');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
