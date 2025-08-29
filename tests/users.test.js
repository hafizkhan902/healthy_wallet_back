const request = require('supertest');
const { createAuthenticatedUser, createTestData, getAuthHeaders, app } = require('./helpers/testHelpers');

describe('User Management Endpoints', () => {
  let authData;

  beforeEach(async () => {
    authData = await createAuthenticatedUser();
  });

  describe('GET /api/users/profile', () => {
    test('Should get user profile', async () => {
      const response = await request(app())
        .get('/api/users/profile')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(authData.userId);
      expect(response.body.data.user.email).toBe(authData.user.email);
      expect(response.body.data.user.name).toBe(authData.user.name);
      expect(response.body.data.user.achievements).toBeDefined();
    });

    test('Should require authentication', async () => {
      const response = await request(app())
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    test('Should update user profile', async () => {
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio description'
      };

      const response = await request(app())
        .put('/api/users/profile')
        .set(getAuthHeaders(authData.token))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.bio).toBe(updateData.bio);
    });

    test('Should validate email format when updating', async () => {
      const response = await request(app())
        .put('/api/users/profile')
        .set(getAuthHeaders(authData.token))
        .send({
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should not allow duplicate email', async () => {
      // Create another user
      const secondUser = await createAuthenticatedUser({
        name: 'Second User',
        email: 'second@example.com',
        password: 'password123'
      });

      // Try to update first user's email to second user's email
      const response = await request(app())
        .put('/api/users/profile')
        .set(getAuthHeaders(authData.token))
        .send({
          email: 'second@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already taken');
    });
  });

  describe('PUT /api/users/settings', () => {
    test('Should update user settings', async () => {
      const settingsData = {
        theme: 'dark',
        notifications: {
          email: false,
          push: true,
          goalReminders: true,
          weeklyReports: false
        },
        privacy: {
          dataSharing: false
        }
      };

      const response = await request(app())
        .put('/api/users/settings')
        .set(getAuthHeaders(authData.token))
        .send(settingsData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.theme).toBe('dark');
      expect(response.body.data.settings.notifications.email).toBe(false);
      expect(response.body.data.settings.privacy.dataSharing).toBe(false);
    });

    test('Should update partial settings', async () => {
      const response = await request(app())
        .put('/api/users/settings')
        .set(getAuthHeaders(authData.token))
        .send({
          theme: 'dark'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.theme).toBe('dark');
    });
  });

  describe('GET /api/users/financial-summary', () => {
    test('Should get financial summary', async () => {
      // Create some test data first
      await createTestData(authData.userId);

      const response = await request(app())
        .get('/api/users/financial-summary')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.financialSummary).toBeDefined();
      expect(response.body.data.financialSummary.totalIncome).toBeGreaterThan(0);
      expect(response.body.data.financialSummary.totalExpenses).toBeGreaterThan(0);
      expect(response.body.data.financialSummary.currentBalance).toBeDefined();
      expect(response.body.data.goals).toBeDefined();
      expect(response.body.data.goals.total).toBeGreaterThan(0);
    });

    test('Should return zero values for new user', async () => {
      const response = await request(app())
        .get('/api/users/financial-summary')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.financialSummary.totalIncome).toBe(0);
      expect(response.body.data.financialSummary.totalExpenses).toBe(0);
    });
  });

  describe('GET /api/users/achievements', () => {
    test('Should get user achievements', async () => {
      const response = await request(app())
        .get('/api/users/achievements')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.achievements).toBeDefined();
      expect(Array.isArray(response.body.data.achievements)).toBe(true);
    });
  });

  describe('DELETE /api/users/account', () => {
    test('Should delete user account and all associated data', async () => {
      // Create some test data first
      await createTestData(authData.userId);

      const response = await request(app())
        .delete('/api/users/account')
        .set(getAuthHeaders(authData.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify user can't access protected routes anymore
      const profileResponse = await request(app())
        .get('/api/users/profile')
        .set(getAuthHeaders(authData.token));

      expect(profileResponse.status).toBe(401);
    });
  });
});
