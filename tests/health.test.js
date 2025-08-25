const request = require('supertest');
const { app } = require('./helpers/testHelpers');

describe('System Health Endpoint', () => {
  describe('GET /health', () => {
    test('Should return health status', async () => {
      const response = await request(app())
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('HealthyWallet API is running');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });

    test('Should not require authentication', async () => {
      const response = await request(app())
        .get('/health');

      expect(response.status).toBe(200);
      // Should work without any authorization headers
    });

    test('Should return valid timestamp', async () => {
      const response = await request(app())
        .get('/health');

      expect(response.status).toBe(200);
      
      const timestamp = new Date(response.body.timestamp);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - timestamp.getTime());
      
      // Should be within 5 seconds
      expect(timeDiff).toBeLessThan(5000);
    });
  });

  describe('404 Handler', () => {
    test('Should return 404 for non-existent routes', async () => {
      const response = await request(app())
        .get('/api/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Route not found');
    });

    test('Should return 404 for non-existent nested routes', async () => {
      const response = await request(app())
        .post('/api/some/deep/nested/route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should return 404 for root path variations', async () => {
      const paths = ['/api', '/api/', '/random', '/test'];
      
      for (const path of paths) {
        const response = await request(app())
          .get(path);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      }
    });
  });
});
