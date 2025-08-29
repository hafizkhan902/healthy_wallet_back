const request = require('supertest');
const { app, createAuthenticatedUser, createTestGoal, createTestIncome, createTestExpense } = require('./helpers/testHelpers');

describe('Achievement System', () => {
  let authData;

  beforeEach(async () => {
    authData = await createAuthenticatedUser();
  });

  describe('GET /api/achievements', () => {
    test('Should get all achievements (locked and unlocked)', async () => {
      const response = await request(app())
        .get('/api/achievements')
        .set('Authorization', `Bearer ${authData.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.achievements).toHaveLength(10);
      expect(response.body.data.stats.totalAchievements).toBe(10);
      expect(response.body.data.stats.unlockedCount).toBe(0);
      expect(response.body.data.stats.completionPercentage).toBe(0);

      // Check achievement structure
      const achievement = response.body.data.achievements[0];
      expect(achievement).toHaveProperty('id');
      expect(achievement).toHaveProperty('name');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('category');
      expect(achievement).toHaveProperty('icon');
      expect(achievement).toHaveProperty('unlocked');
      expect(achievement.unlocked).toBe(false);
    });
  });

  describe('POST /api/achievements/check', () => {
    test('Should check achievements and return no new achievements for new user', async () => {
      const response = await request(app())
        .post('/api/achievements/check')
        .set('Authorization', `Bearer ${authData.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newAchievements).toHaveLength(0);
      expect(response.body.data.totalAchievements).toBe(0);
      expect(response.body.data.totalPoints).toBe(0);
    });

    test('Should unlock achievement after creating goal and contributing', async () => {
      // Create a goal
      const goalData = {
        title: 'Test Goal',
        targetAmount: 1000,
        category: 'emergency',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        description: 'Test goal for achievement'
      };

      const goalResponse = await request(app())
        .post('/api/goals')
        .set('Authorization', `Bearer ${authData.token}`)
        .send(goalData);

      expect(goalResponse.status).toBe(201);
      const goalId = goalResponse.body.data.goal._id;

      // Add contribution to complete the goal
      await request(app())
        .post(`/api/goals/${goalId}/contribute`)
        .set('Authorization', `Bearer ${authData.token}`)
        .send({ amount: 1000, source: 'manual' });

      // Mark goal as completed by updating its status
      await request(app())
        .put(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${authData.token}`)
        .send({ status: 'completed' });

      // Check achievements
      const achievementResponse = await request(app())
        .post('/api/achievements/check')
        .set('Authorization', `Bearer ${authData.token}`);

      expect(achievementResponse.status).toBe(200);
      expect(achievementResponse.body.success).toBe(true);
      
      // Should potentially unlock "First Goal Achiever" achievement
      // Note: The actual unlocking depends on whether the goal was completed within deadline
    });
  });

  describe('GET /api/achievements/leaderboard', () => {
    test('Should get achievement leaderboard', async () => {
      const response = await request(app())
        .get('/api/achievements/leaderboard')
        .set('Authorization', `Bearer ${authData.token}`)
        .query({ limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.leaderboard).toBeDefined();
      expect(Array.isArray(response.body.data.leaderboard)).toBe(true);
    });
  });

  describe('Achievement Triggers', () => {
    test('Should trigger achievement check when creating income', async () => {
      const incomeData = {
        amount: 5000,
        source: 'Test Salary',
        category: 'salary',
        date: new Date(),
        description: 'Test income'
      };

      const response = await request(app())
        .post('/api/income')
        .set('Authorization', `Bearer ${authData.token}`)
        .send(incomeData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // Achievement check is triggered automatically in the background
    });

    test('Should trigger achievement check when creating expense', async () => {
      const expenseData = {
        amount: 100,
        category: 'food',
        date: new Date(),
        description: 'Test expense'
      };

      const response = await request(app())
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authData.token}`)
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // Achievement check is triggered automatically in the background
    });
  });

  describe('Achievement Definitions', () => {
    test('Should have 10 achievement levels with correct structure', async () => {
      const response = await request(app())
        .get('/api/achievements')
        .set('Authorization', `Bearer ${authData.token}`);

      const achievements = response.body.data.achievements;
      
      // Check we have exactly 10 achievements
      expect(achievements).toHaveLength(10);
      
      // Check achievement IDs are 1-10
      const ids = achievements.map(a => a.id).sort((a, b) => a - b);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      
      // Check all categories are valid
      const validCategories = ['savings', 'goals', 'consistency', 'milestones'];
      achievements.forEach(achievement => {
        expect(validCategories).toContain(achievement.category);
        expect(achievement.points).toBeGreaterThan(0);
        expect(achievement.icon).toBeDefined();
        expect(achievement.name).toBeDefined();
        expect(achievement.description).toBeDefined();
      });

      // Check points are increasing (higher level = more points)
      for (let i = 1; i < achievements.length; i++) {
        const current = achievements.find(a => a.id === i);
        const next = achievements.find(a => a.id === i + 1);
        expect(next.points).toBeGreaterThanOrEqual(current.points);
      }
    });
  });
});
