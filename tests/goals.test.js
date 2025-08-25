const request = require('supertest');
const { createAuthenticatedUser, createTestGoal, getAuthHeaders, app } = require('./helpers/testHelpers');

describe('Goal Management Endpoints', () => {
  let authData;

  beforeEach(async () => {
    authData = await createAuthenticatedUser();
  });

  describe('POST /api/goals', () => {
    test('Should create new goal', async () => {
      const goalData = {
        title: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 1000,
        category: 'emergency',
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Build emergency fund for 6 months expenses'
      };

      const response = await request(app())
        .post('/api/goals')
        .set(getAuthHeaders(authData.token))
        .send(goalData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.goal.title).toBe(goalData.title);
      expect(response.body.data.goal.targetAmount).toBe(goalData.targetAmount);
      expect(response.body.data.goal.category).toBe(goalData.category);
      expect(response.body.data.goal.user).toBe(authData.userId);
      expect(response.body.data.goal.status).toBe('active');
    });

    test('Should validate required fields', async () => {
      const response = await request(app())
        .post('/api/goals')
        .set(getAuthHeaders(authData.token))
        .send({
          title: 'Test Goal'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should validate target date is in future', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      const response = await request(app())
        .post('/api/goals')
        .set(getAuthHeaders(authData.token))
        .send({
          title: 'Test Goal',
          targetAmount: 5000,
          category: 'emergency',
          targetDate: pastDate.toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should validate goal categories', async () => {
      const response = await request(app())
        .post('/api/goals')
        .set(getAuthHeaders(authData.token))
        .send({
          title: 'Test Goal',
          targetAmount: 5000,
          category: 'invalid-category',
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/goals', () => {
    beforeEach(async () => {
      await Promise.all([
        createTestGoal(authData.userId, { title: 'Emergency Fund', category: 'emergency', status: 'active' }),
        createTestGoal(authData.userId, { title: 'Vacation', category: 'vacation', status: 'active' }),
        createTestGoal(authData.userId, { title: 'Car', category: 'purchase', status: 'completed' })
      ]);
    });

    test('Should get all goals for user', async () => {
      const response = await request(app())
        .get('/api/goals')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.goals.length).toBe(3);
    });

    test('Should filter by status', async () => {
      const response = await request(app())
        .get('/api/goals?status=active')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.goals.length).toBe(2);
      expect(response.body.data.goals.every(goal => goal.status === 'active')).toBe(true);
    });

    test('Should filter by category', async () => {
      const response = await request(app())
        .get('/api/goals?category=emergency')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.data.goals.length).toBe(1);
      expect(response.body.data.goals[0].category).toBe('emergency');
    });
  });

  describe('GET /api/goals/:id', () => {
    test('Should get specific goal', async () => {
      const goal = await createTestGoal(authData.userId);

      const response = await request(app())
        .get(`/api/goals/${goal._id}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.goal._id).toBe(goal._id.toString());
      expect(response.body.data.goal.progressPercentage).toBeDefined();
      expect(response.body.data.goal.remainingAmount).toBeDefined();
      expect(response.body.data.goal.daysRemaining).toBeDefined();
    });

    test('Should return 404 for non-existent goal', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app())
        .get(`/api/goals/${fakeId}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/goals/:id', () => {
    test('Should update goal', async () => {
      const goal = await createTestGoal(authData.userId);
      const updateData = {
        title: 'Updated Goal Title',
        targetAmount: 15000,
        description: 'Updated description'
      };

      const response = await request(app())
        .put(`/api/goals/${goal._id}`)
        .set(getAuthHeaders(authData.token))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.goal.title).toBe(updateData.title);
      expect(response.body.data.goal.targetAmount).toBe(updateData.targetAmount);
      expect(response.body.data.goal.description).toBe(updateData.description);
    });
  });

  describe('POST /api/goals/:id/contribute', () => {
    test('Should add contribution to goal', async () => {
      const goal = await createTestGoal(authData.userId, { currentAmount: 1000 });
      const contributionData = {
        amount: 500,
        source: 'manual',
        note: 'Monthly savings contribution'
      };

      const response = await request(app())
        .post(`/api/goals/${goal._id}/contribute`)
        .set(getAuthHeaders(authData.token))
        .send(contributionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.goal.currentAmount).toBe(1500);
      expect(response.body.data.goal.contributions.length).toBeGreaterThan(0);
    });

    test('Should validate contribution amount', async () => {
      const goal = await createTestGoal(authData.userId);

      const response = await request(app())
        .post(`/api/goals/${goal._id}/contribute`)
        .set(getAuthHeaders(authData.token))
        .send({
          amount: -100 // Invalid negative amount
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should not allow contribution to inactive goal', async () => {
      const goal = await createTestGoal(authData.userId, { status: 'paused' });

      const response = await request(app())
        .post(`/api/goals/${goal._id}/contribute`)
        .set(getAuthHeaders(authData.token))
        .send({
          amount: 500
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inactive goal');
    });

    test('Should automatically complete goal when target is reached', async () => {
      const goal = await createTestGoal(authData.userId, { 
        targetAmount: 1000, 
        currentAmount: 800 
      });

      const response = await request(app())
        .post(`/api/goals/${goal._id}/contribute`)
        .set(getAuthHeaders(authData.token))
        .send({
          amount: 200 // This should complete the goal
        });

      expect(response.status).toBe(200);
      expect(response.body.data.goal.currentAmount).toBe(1000);
      expect(response.body.data.goal.status).toBe('completed');
    });
  });

  describe('PUT /api/goals/:id/status', () => {
    test('Should update goal status', async () => {
      const goal = await createTestGoal(authData.userId, { status: 'active' });

      const response = await request(app())
        .put(`/api/goals/${goal._id}/status`)
        .set(getAuthHeaders(authData.token))
        .send({
          status: 'paused'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.goal.status).toBe('paused');
    });

    test('Should validate status values', async () => {
      const goal = await createTestGoal(authData.userId);

      const response = await request(app())
        .put(`/api/goals/${goal._id}/status`)
        .set(getAuthHeaders(authData.token))
        .send({
          status: 'invalid-status'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/goals/summary', () => {
    test('Should get goals summary', async () => {
      await Promise.all([
        createTestGoal(authData.userId, { status: 'active', targetAmount: 10000, currentAmount: 5000 }),
        createTestGoal(authData.userId, { status: 'completed', targetAmount: 5000, currentAmount: 5000 }),
        createTestGoal(authData.userId, { status: 'active', targetAmount: 8000, currentAmount: 2000 })
      ]);

      const response = await request(app())
        .get('/api/goals/summary')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalGoals).toBe(3);
      expect(response.body.data.summary.totalTargetAmount).toBe(23000);
      expect(response.body.data.summary.totalCurrentAmount).toBe(12000);
      expect(response.body.data.summary.overallProgress).toBeCloseTo(52.17, 1);
      expect(response.body.data.summary.byStatus).toBeDefined();
      expect(response.body.data.summary.byCategory).toBeDefined();
    });
  });

  describe('DELETE /api/goals/:id', () => {
    test('Should delete goal', async () => {
      const goal = await createTestGoal(authData.userId);

      const response = await request(app())
        .delete(`/api/goals/${goal._id}`)
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });
  });
});
