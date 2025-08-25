# HealthyWallet API Endpoints

Base URL: `http://localhost:5000/api`

## 🔐 Authentication Endpoints

### Public Routes
| Method | Endpoint | Description | Body Parameters |
|--------|----------|-------------|-----------------|
| `POST` | `/auth/register` | Register new user | `name`, `email`, `password` |
| `POST` | `/auth/login` | User login | `email`, `password` |

### Protected Routes (Requires Bearer Token)
| Method | Endpoint | Description | Body Parameters |
|--------|----------|-------------|-----------------|
| `GET` | `/auth/me` | Get current user info | - |
| `PUT` | `/auth/password` | Update password | `currentPassword`, `newPassword` |

---

## 👤 User Management Endpoints

All routes require authentication (Bearer token)

| Method | Endpoint | Description | Body Parameters |
|--------|----------|-------------|-----------------|
| `GET` | `/users/profile` | Get user profile | - |
| `PUT` | `/users/profile` | Update user profile | `name`, `email`, `bio` |
| `PUT` | `/users/settings` | Update user settings | `currency`, `theme`, `notifications`, `privacy` |
| `GET` | `/users/financial-summary` | Get financial overview | - |
| `GET` | `/users/achievements` | Get user achievements | - |
| `DELETE` | `/users/account` | Delete user account | - |

---

## 💰 Income Management Endpoints

All routes require authentication (Bearer token)

| Method | Endpoint | Description | Query Parameters | Body Parameters |
|--------|----------|-------------|------------------|-----------------|
| `GET` | `/income` | Get all income entries | `page`, `limit`, `category`, `startDate`, `endDate`, `sortBy`, `sortOrder` | - |
| `POST` | `/income` | Create new income entry | - | `amount`, `source`, `category`, `date`, `description`, `isRecurring`, `recurringPeriod` |
| `GET` | `/income/summary` | Get income summary | `startDate`, `endDate` | - |
| `GET` | `/income/by-category` | Get income by category | - | - |
| `GET` | `/income/recurring` | Get recurring incomes | - | - |
| `GET` | `/income/:id` | Get specific income | - | - |
| `PUT` | `/income/:id` | Update income entry | - | `amount`, `source`, `category`, `date`, `description`, `isRecurring`, `recurringPeriod` |
| `DELETE` | `/income/:id` | Delete income entry | - | - |

### Income Categories
- `salary`, `freelance`, `investment`, `business`, `other`

---

## 💸 Expense Management Endpoints

All routes require authentication (Bearer token)

| Method | Endpoint | Description | Query Parameters | Body Parameters |
|--------|----------|-------------|------------------|-----------------|
| `GET` | `/expenses` | Get all expenses | `page`, `limit`, `category`, `startDate`, `endDate`, `sortBy`, `sortOrder` | - |
| `POST` | `/expenses` | Create new expense | - | `amount`, `category`, `date`, `description`, `isRecurring`, `recurringPeriod` |
| `GET` | `/expenses/summary` | Get expense summary | `startDate`, `endDate` | - |
| `GET` | `/expenses/by-category` | Get expenses by category | - | - |
| `GET` | `/expenses/recurring` | Get recurring expenses | - | - |
| `GET` | `/expenses/top-categories` | Get top spending categories | `limit` | - |
| `GET` | `/expenses/:id` | Get specific expense | - | - |
| `PUT` | `/expenses/:id` | Update expense | - | `amount`, `category`, `date`, `description`, `isRecurring`, `recurringPeriod` |
| `DELETE` | `/expenses/:id` | Delete expense | - | - |

### Expense Categories
- `food`, `transport`, `entertainment`, `bills`, `shopping`, `healthcare`, `education`, `travel`, `other`

---

## 🎯 Goal Management Endpoints

All routes require authentication (Bearer token)

| Method | Endpoint | Description | Query Parameters | Body Parameters |
|--------|----------|-------------|------------------|-----------------|
| `GET` | `/goals` | Get all goals | `status`, `category`, `sortBy`, `sortOrder` | - |
| `POST` | `/goals` | Create new goal | - | `title`, `targetAmount`, `currentAmount`, `category`, `targetDate`, `description` |
| `GET` | `/goals/summary` | Get goals summary | - | - |
| `GET` | `/goals/by-category` | Get goals by category | - | - |
| `GET` | `/goals/:id` | Get specific goal | - | - |
| `PUT` | `/goals/:id` | Update goal | - | `title`, `targetAmount`, `currentAmount`, `category`, `targetDate`, `description` |
| `DELETE` | `/goals/:id` | Delete goal | - | - |
| `POST` | `/goals/:id/contribute` | Add contribution to goal | - | `amount`, `source`, `note` |
| `PUT` | `/goals/:id/status` | Update goal status | - | `status` |

### Goal Categories
- `emergency`, `vacation`, `investment`, `purchase`, `other`

### Goal Statuses
- `active`, `completed`, `paused`, `cancelled`

---

## 📊 Reports & Analytics Endpoints

All routes require authentication (Bearer token)

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET` | `/reports/dashboard` | Get dashboard overview data | - |
| `GET` | `/reports/monthly/:year/:month` | Get monthly report | - |
| `GET` | `/reports/category-analysis` | Get category spending analysis | `period` (months) |
| `GET` | `/reports/trend-analysis` | Get financial trends | `months` |
| `GET` | `/reports/health-score` | Get financial health score | - |
| `GET` | `/reports/export` | Export user data | `format`, `startDate`, `endDate` |

---

## 🤖 AI Insights Endpoints

All routes require authentication (Bearer token)

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET` | `/ai-insights/spending-analysis` | Get AI spending pattern analysis | `period` (months) |
| `GET` | `/ai-insights/savings-recommendations` | Get personalized savings tips | - |
| `GET` | `/ai-insights/goal-forecast/:goalId` | Get goal achievement forecast | - |
| `GET` | `/ai-insights/health-insights` | Get financial health insights | - |
| `GET` | `/ai-insights/budget-suggestions` | Get AI budget recommendations | `targetSavingsRate` |

---

## 🏥 System Health Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Check API health status |

---

## 🔑 Authentication

### Headers Required for Protected Routes
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### JWT Token Response Format
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 📝 Standard Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "details": "Detailed error info (development only)"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "current": 1,
      "total": 10,
      "count": 20,
      "totalRecords": 200
    }
  }
}
```

---

## 🚀 Quick Start Examples

### 1. Register a new user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Add Income (with token)
```bash
curl -X POST http://localhost:5000/api/income \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "source": "Monthly Salary",
    "category": "salary",
    "date": "2024-01-15",
    "description": "January salary"
  }'
```

### 4. Add Expense (with token)
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.50,
    "category": "food",
    "date": "2024-01-15",
    "description": "Grocery shopping"
  }'
```

### 5. Create Financial Goal (with token)
```bash
curl -X POST http://localhost:5000/api/goals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Emergency Fund",
    "targetAmount": 10000,
    "category": "emergency",
    "targetDate": "2024-12-31",
    "description": "Build emergency fund for 6 months expenses"
  }'
```

### 6. Get Dashboard Data (with token)
```bash
curl -X GET http://localhost:5000/api/reports/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Environment Setup

Make sure your `.env` file contains:
```env
MONGODB_URI=mongodb://localhost:27017/healthywallet
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## 📱 Frontend Integration

All endpoints are designed to work seamlessly with your frontend modules:

- **Dashboard Module** → `/reports/dashboard`
- **Income Management** → `/income/*`
- **Expense Tracking** → `/expenses/*`
- **Goal Management** → `/goals/*`
- **Reports & Analytics** → `/reports/*`
- **AI Insights** → `/ai-insights/*`
- **Profile Management** → `/users/*`
- **Settings** → `/users/settings`

Total: **50+ API endpoints** covering all your frontend requirements!
