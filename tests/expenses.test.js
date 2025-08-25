const request = require('supertest');
const { createAuthenticatedUser, createTestExpense, getAuthHeaders, app } = require('./helpers/testHelpers');

describe('Expense Management Endpoints', () => {
  let authData;

  beforeEach(async () => {
    authData = await createAuthenticatedUser();
  });

  describe('POST /api/expenses', () => {
    test('Should create new expense entry', async () => {
      const expenseData = {
        amount: 150.50,
        category: 'food',
        date: '2024-01-15',
        description: 'Grocery shopping'
      };

      const response = await request(app())
        .post('/api/expenses')
        .set(getAuthHeaders(authData.token))
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expense.amount).toBe(expenseData.amount);
      expect(response.body.data.expense.category).toBe(expenseData.category);
      expect(response.body.data.expense.user).toBe(authData.userId);
    });

    test('Should create recurring expense', async () => {
      const expenseData = {
        amount: 1200,
        category: 'bills',
        date: '2024-01-01',
        description: 'Monthly rent',
        isRecurring: true,
        recurringPeriod: 'monthly'
      };

      const response = await request(app())
        .post('/api/expenses')
        .set(getAuthHeaders(authData.token))
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body.data.expense.isRecurring).toBe(true);
      expect(response.body.data.expense.recurringPeriod).toBe('monthly');
      expect(response.body.data.expense.nextRecurringDate).toBeDefined();
    });

    test('Should validate required fields', async () => {
      const response = await request(app())
        .post('/api/expenses')
        .set(getAuthHeaders(authData.token))
        .send({
          category: 'food'
          // Missing amount and date
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should validate expense categories', async () => {
      const response = await request(app())
        .post('/api/expenses')
        .set(getAuthHeaders(authData.token))
        .send({
          amount: 100,
          category: 'invalid-category',
          date: '2024-01-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/expenses', () => {
    beforeEach(async () => {
      await Promise.all([
        createTestExpense(authData.userId, { amount: 800, category: 'food' }),
        createTestExpense(authData.userId, { amount: 300, category: 'transport' }),
        createTestExpense(authData.userId, { amount: 150, category: 'entertainment' }),
        createTestExpense(authData.userId, { amount: 1200, category: 'bills' })
      ]);
    });

    test('Should get all expenses for user', async () => {
      const response = await request(app())
        .get('/api/expenses')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expenses.length).toBe(4);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('Should filter by category', async () => {
      const response = await request(app())
        .get('/api/expenses?category=food')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.expenses.length).toBe(1);
      expect(response.body.data.expenses[0].category).toBe('food');
    });

    test('Should support date range filtering', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app())
        .get(`/api/expenses?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/expenses/summary', () => {
    test('Should get expense summary', async () => {
      await Promise.all([
        createTestExpense(authData.userId, { amount: 800, category: 'food' }),
        createTestExpense(authData.userId, { amount: 300, category: 'transport' }),
        createTestExpense(authData.userId, { amount: 150, category: 'entertainment' })
      ]);

      const response = await request(app())
        .get('/api/expenses/summary')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalExpenses).toBe(1250);
      expect(response.body.data.summary.byCategory).toBeDefined();
      expect(response.body.data.summary.monthlyTrend).toBeDefined();
    });
  });

  describe('GET /api/expenses/top-categories', () => {
    test('Should get top spending categories', async () => {
      await Promise.all([
        createTestExpense(authData.userId, { amount: 800, category: 'food' }),
        createTestExpense(authData.userId, { amount: 300, category: 'transport' }),
        createTestExpense(authData.userId, { amount: 150, category: 'entertainment' })
      ]);

      const response = await request(app())
        .get('/api/expenses/top-categories?limit=2')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.topCategories.length).toBe(2);
      expect(response.body.data.topCategories[0].totalAmount).toBeGreaterThanOrEqual(
        response.body.data.topCategories[1].totalAmount
      );
    });
  });

  describe('PUT /api/expenses/:id', () => {
    test('Should update expense entry', async () => {
      const expense = await createTestExpense(authData.userId);
      const updateData = {
        amount: 200,
        description: 'Updated description'
      };

      const response = await request(app())
        .put(`/api/expenses/${expense._id}`)
        .set(getAuthHeaders(authData.token))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expense.amount).toBe(updateData.amount);
      expect(response.body.data.expense.description).toBe(updateData.description);
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    test('Should delete expense entry', async () => {
      const expense = await createTestExpense(authData.userId);

      const response = await request(app())
        .delete(`/api/expenses/${expense._id}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });
  });

  describe('GET /api/expenses/recurring', () => {
    test('Should get recurring expenses', async () => {
      await Promise.all([
        createTestExpense(authData.userId, { isRecurring: true, recurringPeriod: 'monthly' }),
        createTestExpense(authData.userId, { isRecurring: false }),
        createTestExpense(authData.userId, { isRecurring: true, recurringPeriod: 'weekly' })
      ]);

      const response = await request(app())
        .get('/api/expenses/recurring')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recurringExpenses.length).toBe(2);
      expect(response.body.data.recurringExpenses.every(expense => expense.isRecurring)).toBe(true);
    });
  });
});
