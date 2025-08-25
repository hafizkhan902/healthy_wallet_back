const request = require('supertest');
const { createAuthenticatedUser, createTestIncome, getAuthHeaders, app } = require('./helpers/testHelpers');

describe('Income Management Endpoints', () => {
  let authData;

  beforeEach(async () => {
    authData = await createAuthenticatedUser();
  });

  describe('POST /api/income', () => {
    test('Should create new income entry', async () => {
      const incomeData = {
        amount: 5000,
        source: 'Monthly Salary',
        category: 'salary',
        date: '2024-01-15',
        description: 'January salary payment'
      };

      const response = await request(app())
        .post('/api/income')
        .set(getAuthHeaders(authData.token))
        .send(incomeData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.income.amount).toBe(incomeData.amount);
      expect(response.body.data.income.source).toBe(incomeData.source);
      expect(response.body.data.income.category).toBe(incomeData.category);
      expect(response.body.data.income.user).toBe(authData.userId);
    });

    test('Should create recurring income', async () => {
      const incomeData = {
        amount: 5000,
        source: 'Monthly Salary',
        category: 'salary',
        date: '2024-01-15',
        isRecurring: true,
        recurringPeriod: 'monthly'
      };

      const response = await request(app())
        .post('/api/income')
        .set(getAuthHeaders(authData.token))
        .send(incomeData);

      expect(response.status).toBe(201);
      expect(response.body.data.income.isRecurring).toBe(true);
      expect(response.body.data.income.recurringPeriod).toBe('monthly');
      expect(response.body.data.income.nextRecurringDate).toBeDefined();
    });

    test('Should validate required fields', async () => {
      const response = await request(app())
        .post('/api/income')
        .set(getAuthHeaders(authData.token))
        .send({
          source: 'Test Source'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should validate amount is positive', async () => {
      const response = await request(app())
        .post('/api/income')
        .set(getAuthHeaders(authData.token))
        .send({
          amount: -100,
          source: 'Test Source',
          category: 'salary',
          date: '2024-01-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should validate category enum', async () => {
      const response = await request(app())
        .post('/api/income')
        .set(getAuthHeaders(authData.token))
        .send({
          amount: 1000,
          source: 'Test Source',
          category: 'invalid-category',
          date: '2024-01-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should require authentication', async () => {
      const response = await request(app())
        .post('/api/income')
        .send({
          amount: 1000,
          source: 'Test Source',
          category: 'salary',
          date: '2024-01-15'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/income', () => {
    beforeEach(async () => {
      // Create test income entries
      await Promise.all([
        createTestIncome(authData.userId, { amount: 5000, category: 'salary' }),
        createTestIncome(authData.userId, { amount: 1500, category: 'freelance' }),
        createTestIncome(authData.userId, { amount: 500, category: 'investment' })
      ]);
    });

    test('Should get all income entries for user', async () => {
      const response = await request(app())
        .get('/api/income')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.incomes).toBeDefined();
      expect(response.body.data.incomes.length).toBe(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('Should filter by category', async () => {
      const response = await request(app())
        .get('/api/income?category=salary')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.incomes.length).toBe(1);
      expect(response.body.data.incomes[0].category).toBe('salary');
    });

    test('Should support pagination', async () => {
      const response = await request(app())
        .get('/api/income?page=1&limit=2')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.incomes.length).toBe(2);
      expect(response.body.data.pagination.current).toBe(1);
      expect(response.body.data.pagination.totalRecords).toBe(3);
    });

    test('Should support sorting', async () => {
      const response = await request(app())
        .get('/api/income?sortBy=amount&sortOrder=asc')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.incomes[0].amount).toBe(500);
      expect(response.body.data.incomes[2].amount).toBe(5000);
    });
  });

  describe('GET /api/income/:id', () => {
    test('Should get specific income entry', async () => {
      const income = await createTestIncome(authData.userId);

      const response = await request(app())
        .get(`/api/income/${income._id}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.income._id).toBe(income._id.toString());
    });

    test('Should return 404 for non-existent income', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app())
        .get(`/api/income/${fakeId}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should not get income from another user', async () => {
      // Create another user and their income
      const otherUser = await createAuthenticatedUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });
      const otherIncome = await createTestIncome(otherUser.userId);

      const response = await request(app())
        .get(`/api/income/${otherIncome._id}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/income/:id', () => {
    test('Should update income entry', async () => {
      const income = await createTestIncome(authData.userId);
      const updateData = {
        amount: 6000,
        source: 'Updated Salary',
        description: 'Updated description'
      };

      const response = await request(app())
        .put(`/api/income/${income._id}`)
        .set(getAuthHeaders(authData.token))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.income.amount).toBe(updateData.amount);
      expect(response.body.data.income.source).toBe(updateData.source);
      expect(response.body.data.income.description).toBe(updateData.description);
    });

    test('Should return 404 for non-existent income', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app())
        .put(`/api/income/${fakeId}`)
        .set(getAuthHeaders(authData.token))
        .send({ amount: 1000 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/income/:id', () => {
    test('Should delete income entry', async () => {
      const income = await createTestIncome(authData.userId);

      const response = await request(app())
        .delete(`/api/income/${income._id}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify income is deleted
      const getResponse = await request(app())
        .get(`/api/income/${income._id}`)
        .set(getAuthHeaders(authData.token));

      expect(getResponse.status).toBe(404);
    });
  });

  describe('GET /api/income/summary', () => {
    test('Should get income summary', async () => {
      await Promise.all([
        createTestIncome(authData.userId, { amount: 5000, category: 'salary' }),
        createTestIncome(authData.userId, { amount: 1500, category: 'freelance' }),
        createTestIncome(authData.userId, { amount: 500, category: 'investment' })
      ]);

      const response = await request(app())
        .get('/api/income/summary')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalIncome).toBe(7000);
      expect(response.body.data.summary.byCategory).toBeDefined();
      expect(response.body.data.summary.monthlyTrend).toBeDefined();
    });
  });

  describe('GET /api/income/by-category', () => {
    test('Should get income grouped by category', async () => {
      await Promise.all([
        createTestIncome(authData.userId, { amount: 5000, category: 'salary' }),
        createTestIncome(authData.userId, { amount: 1500, category: 'freelance' }),
        createTestIncome(authData.userId, { amount: 500, category: 'investment' })
      ]);

      const response = await request(app())
        .get('/api/income/by-category')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.incomeByCategory).toBeDefined();
      expect(response.body.data.incomeByCategory.length).toBe(3);
    });
  });

  describe('GET /api/income/recurring', () => {
    test('Should get recurring income entries', async () => {
      await Promise.all([
        createTestIncome(authData.userId, { isRecurring: true, recurringPeriod: 'monthly' }),
        createTestIncome(authData.userId, { isRecurring: false }),
        createTestIncome(authData.userId, { isRecurring: true, recurringPeriod: 'weekly' })
      ]);

      const response = await request(app())
        .get('/api/income/recurring')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recurringIncomes).toBeDefined();
      expect(response.body.data.recurringIncomes.length).toBe(2);
      expect(response.body.data.recurringIncomes.every(income => income.isRecurring)).toBe(true);
    });
  });
});
