const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');
const Income = require('../../src/models/Income');
const Expense = require('../../src/models/Expense');
const Goal = require('../../src/models/Goal');

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const testUser2 = {
  name: 'Test User 2',
  email: 'test2@example.com',
  password: 'password123'
};

// Helper function to register and login a user
const createAuthenticatedUser = async (userData = testUser) => {
  // Register user
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send(userData);

  expect(registerResponse.status).toBe(201);
  
  const { token, user } = registerResponse.body.data;
  
  return {
    token,
    user,
    userId: user.id
  };
};

// Helper function to create test income
const createTestIncome = async (userId, overrides = {}) => {
  const incomeData = {
    amount: 5000,
    source: 'Test Salary',
    category: 'salary',
    date: overrides.date || new Date(),
    description: 'Test income entry',
    ...overrides
  };

  return await Income.create({
    ...incomeData,
    user: userId
  });
};

// Helper function to create test expense
const createTestExpense = async (userId, overrides = {}) => {
  const expenseData = {
    amount: 150.50,
    category: 'food',
    date: overrides.date || new Date(),
    description: 'Test expense entry',
    ...overrides
  };

  return await Expense.create({
    ...expenseData,
    user: userId
  });
};

// Helper function to create test goal
const createTestGoal = async (userId, overrides = {}) => {
  const goalData = {
    title: 'Test Goal',
    targetAmount: 10000,
    currentAmount: 1000,
    category: 'emergency',
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    description: 'Test goal description',
    ...overrides
  };

  return await Goal.create({
    ...goalData,
    user: userId
  });
};

// Helper function to create multiple test data
const createTestData = async (userId) => {
  // Create multiple income entries
  const incomes = await Promise.all([
    createTestIncome(userId, { amount: 5000, category: 'salary', source: 'Main Job' }),
    createTestIncome(userId, { amount: 1500, category: 'freelance', source: 'Side Project' }),
    createTestIncome(userId, { amount: 500, category: 'investment', source: 'Dividends' })
  ]);

  // Create multiple expense entries
  const expenses = await Promise.all([
    createTestExpense(userId, { amount: 800, category: 'food', description: 'Groceries' }),
    createTestExpense(userId, { amount: 300, category: 'transport', description: 'Gas' }),
    createTestExpense(userId, { amount: 150, category: 'entertainment', description: 'Movies' }),
    createTestExpense(userId, { amount: 1200, category: 'bills', description: 'Rent' })
  ]);

  // Create multiple goals
  const goals = await Promise.all([
    createTestGoal(userId, { title: 'Emergency Fund', category: 'emergency', targetAmount: 15000 }),
    createTestGoal(userId, { title: 'Vacation', category: 'vacation', targetAmount: 5000 }),
    createTestGoal(userId, { title: 'New Car', category: 'purchase', targetAmount: 25000 })
  ]);

  return { incomes, expenses, goals };
};

// Helper to get auth headers
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

module.exports = {
  testUser,
  testUser2,
  createAuthenticatedUser,
  createTestIncome,
  createTestExpense,
  createTestGoal,
  createTestData,
  getAuthHeaders,
  app: () => app
};
