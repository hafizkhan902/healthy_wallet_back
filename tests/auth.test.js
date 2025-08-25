const request = require('supertest');
const { testUser, testUser2, createAuthenticatedUser, getAuthHeaders, app } = require('./helpers/testHelpers');

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    test('Should register a new user successfully', async () => {
      const response = await request(app())
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.name).toBe(testUser.name);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    test('Should not register user with duplicate email', async () => {
      // First registration
      await request(app())
        .post('/api/auth/register')
        .send(testUser);

      // Second registration with same email
      const response = await request(app())
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    test('Should validate required fields', async () => {
      const response = await request(app())
        .post('/api/auth/register')
        .send({
          name: 'Test User'
          // Missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should validate email format', async () => {
      const response = await request(app())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should validate password length', async () => {
      const response = await request(app())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before each login test
      await request(app())
        .post('/api/auth/register')
        .send(testUser);
    });

    test('Should login with valid credentials', async () => {
      const response = await request(app())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.lastLogin).toBeDefined();
    });

    test('Should not login with invalid email', async () => {
      const response = await request(app())
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: testUser.password
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('Should not login with invalid password', async () => {
      const response = await request(app())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('Should validate required fields for login', async () => {
      const response = await request(app())
        .post('/api/auth/login')
        .send({
          email: testUser.email
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    test('Should get current user info with valid token', async () => {
      const { token } = await createAuthenticatedUser();

      const response = await request(app())
        .get('/api/auth/me')
        .set(getAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.settings).toBeDefined();
      expect(response.body.data.user.financialSummary).toBeDefined();
    });

    test('Should not get user info without token', async () => {
      const response = await request(app())
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    test('Should not get user info with invalid token', async () => {
      const response = await request(app())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/password', () => {
    test('Should update password with valid credentials', async () => {
      const { token } = await createAuthenticatedUser();

      const response = await request(app())
        .put('/api/auth/password')
        .set(getAuthHeaders(token))
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password updated');

      // Verify can login with new password
      const loginResponse = await request(app())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'newpassword123'
        });

      expect(loginResponse.status).toBe(200);
    });

    test('Should not update password with wrong current password', async () => {
      const { token } = await createAuthenticatedUser();

      const response = await request(app())
        .put('/api/auth/password')
        .set(getAuthHeaders(token))
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Current password is incorrect');
    });

    test('Should validate new password length', async () => {
      const { token } = await createAuthenticatedUser();

      const response = await request(app())
        .put('/api/auth/password')
        .set(getAuthHeaders(token))
        .send({
          currentPassword: testUser.password,
          newPassword: '123' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
