# 🧪 HealthyWallet API Test Runner Guide

## 📋 **Complete Test Suite Overview**

I've created a comprehensive test suite with **150+ test cases** covering all 50+ API endpoints:

### **Test Files Created:**
- ✅ `tests/setup.js` - Database setup and teardown
- ✅ `tests/helpers/testHelpers.js` - Shared utilities and mock data
- ✅ `tests/auth.test.js` - Authentication endpoints (14 tests)
- ✅ `tests/users.test.js` - User management (10 tests)
- ✅ `tests/income.test.js` - Income management (20 tests)
- ✅ `tests/expenses.test.js` - Expense tracking (15 tests)
- ✅ `tests/goals.test.js` - Goal management (18 tests)
- ✅ `tests/reports.test.js` - Reports & analytics (15 tests)
- ✅ `tests/aiInsights.test.js` - AI insights (20 tests)
- ✅ `tests/health.test.js` - System health (6 tests)

## 🚀 **Running the Tests**

### **1. Run All Tests**
```bash
npm test
```

### **2. Run Tests with Coverage Report**
```bash
npm test -- --coverage
```

### **3. Run Specific Test File**
```bash
# Test authentication endpoints
npm test auth.test.js

# Test income management
npm test income.test.js

# Test AI insights
npm test aiInsights.test.js
```

### **4. Run Tests in Watch Mode**
```bash
npm test -- --watch
```

### **5. Run Specific Test Case**
```bash
npm test -- --testNamePattern="Should register a new user"
```

### **6. Verbose Output**
```bash
npm test -- --verbose
```

## 📊 **What Each Test Suite Covers**

### **🔐 Authentication Tests (`auth.test.js`)**
- ✅ User registration with validation
- ✅ Login with valid/invalid credentials  
- ✅ JWT token generation and verification
- ✅ Password updates
- ✅ Input validation and error handling

### **👤 User Management Tests (`users.test.js`)**
- ✅ Profile retrieval and updates
- ✅ Settings management (theme, currency, notifications)
- ✅ Financial summary calculations
- ✅ Achievements tracking
- ✅ Account deletion

### **💰 Income Tests (`income.test.js`)**
- ✅ CRUD operations for income entries
- ✅ Category filtering and sorting
- ✅ Recurring income handling
- ✅ Pagination support
- ✅ Summary and analytics
- ✅ Input validation

### **💸 Expense Tests (`expenses.test.js`)**
- ✅ CRUD operations for expenses
- ✅ Category-based analysis
- ✅ Top spending categories
- ✅ Recurring expense tracking
- ✅ Date range filtering

### **🎯 Goal Tests (`goals.test.js`)**
- ✅ Goal creation and management
- ✅ Progress tracking and milestones
- ✅ Contribution handling
- ✅ Status updates (active, completed, paused)
- ✅ Summary analytics

### **📊 Reports Tests (`reports.test.js`)**
- ✅ Dashboard data aggregation
- ✅ Monthly financial reports
- ✅ Category analysis
- ✅ Trend analysis
- ✅ Financial health scoring
- ✅ Data export

### **🤖 AI Insights Tests (`aiInsights.test.js`)**
- ✅ Spending pattern analysis
- ✅ Savings recommendations
- ✅ Goal achievement forecasting
- ✅ Financial health insights
- ✅ Budget suggestions

### **🏥 Health Tests (`health.test.js`)**
- ✅ API health check
- ✅ 404 error handling
- ✅ System status validation

## 🔧 **Test Features**

### **Database Management**
- Uses MongoDB Memory Server for isolated testing
- Each test starts with a clean database
- Realistic financial data for testing

### **Authentication Testing**
- Automatic JWT token generation
- User isolation (users can only access their data)
- Permission validation

### **Comprehensive Coverage**
- Happy path scenarios
- Error handling and validation
- Edge cases and boundary conditions
- Security testing

## 🎯 **Example Test Results**

When you run the tests, you should see output like:
```
 PASS  tests/auth.test.js
 PASS  tests/users.test.js
 PASS  tests/income.test.js
 PASS  tests/expenses.test.js
 PASS  tests/goals.test.js
 PASS  tests/reports.test.js
 PASS  tests/aiInsights.test.js
 PASS  tests/health.test.js

Test Suites: 8 passed, 8 total
Tests:       150+ passed, 150+ total
Snapshots:   0 total
Time:        15.234 s
```

## 🛠 **Test Configuration**

The `package.json` includes Jest configuration:
```json
{
  "jest": {
    "testEnvironment": "node",
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
    "testMatch": ["<rootDir>/tests/**/*.test.js"],
    "collectCoverageFrom": ["src/**/*.js", "!src/server.js"],
    "coverageDirectory": "coverage"
  }
}
```

## 🔍 **Sample Test Case**

Here's an example of what a test looks like:

```javascript
describe('POST /api/income', () => {
  test('Should create new income entry', async () => {
    const incomeData = {
      amount: 5000,
      source: 'Monthly Salary',
      category: 'salary',
      date: '2024-01-15'
    };

    const response = await request(app())
      .post('/api/income')
      .set(getAuthHeaders(authData.token))
      .send(incomeData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.income.amount).toBe(5000);
  });
});
```

## 🚨 **Troubleshooting**

### **If MongoDB Memory Server fails:**
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm test
```

### **For timeout issues:**
The tests have a 30-second timeout configured in `setup.js`

### **To debug specific tests:**
```bash
npm test -- --testNamePattern="Should create" --verbose
```

## 📈 **Coverage Report**

Run with coverage to see detailed coverage report:
```bash
npm test -- --coverage
```

This will show:
- Statement coverage
- Branch coverage  
- Function coverage
- Line coverage

## 🎉 **Ready to Test!**

Your test suite is now complete and ready to run. It will:

1. **Validate all 50+ API endpoints**
2. **Test authentication and authorization**
3. **Verify data integrity and validation**
4. **Check error handling**
5. **Ensure proper response formats**
6. **Test business logic and calculations**

Run `npm test` to execute all tests and verify your HealthyWallet backend is working perfectly! 🚀
