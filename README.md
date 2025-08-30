# HealthyWallet Backend API

A comprehensive financial management backend system built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based secure authentication
- **Income Management** - Track and categorize income sources
- **Expense Tracking** - Monitor and analyze spending patterns
- **Goal Management** - Set and track financial goals with progress monitoring
- **Reports & Analytics** - Comprehensive financial reporting and insights
- **AI-Powered Insights** - Smart financial analysis and recommendations
- **Data Export** - Export financial data in multiple formats

## 📁 Project Structure

```
src/
├── controllers/          # Route handlers and business logic
├── models/              # MongoDB schemas and models
├── middleware/          # Authentication, validation, error handling
├── routes/              # API route definitions
├── config/              # Database and app configuration
└── server.js            # Main application entry point
```

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthywallet_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthywallet
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Update password

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/settings` - Update user settings
- `GET /api/users/financial-summary` - Get financial overview
- `GET /api/users/achievements` - Get user achievements

### Income Management
- `GET /api/income` - Get all income entries
- `POST /api/income` - Create new income entry
- `GET /api/income/:id` - Get specific income
- `PUT /api/income/:id` - Update income entry
- `DELETE /api/income/:id` - Delete income entry
- `GET /api/income/summary` - Get income summary
- `GET /api/income/by-category` - Get income by category

### Expense Management
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get specific expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Get expense summary
- `GET /api/expenses/top-categories` - Get top spending categories

### Goal Management
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create new goal
- `GET /api/goals/:id` - Get specific goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/contribute` - Add contribution to goal
- `GET /api/goals/summary` - Get goals summary

### Reports & Analytics
- `GET /api/reports/dashboard` - Get dashboard data
- `GET /api/reports/monthly/:year/:month` - Get monthly report
- `GET /api/reports/category-analysis` - Get category analysis
- `GET /api/reports/trend-analysis` - Get trend analysis
- `GET /api/reports/health-score` - Get financial health score
- `GET /api/reports/export` - Export user data

### AI Insights
- `GET /api/ai-insights/spending-analysis` - Get spending pattern analysis
- `GET /api/ai-insights/savings-recommendations` - Get savings recommendations
- `GET /api/ai-insights/goal-forecast/:goalId` - Get goal achievement forecast
- `GET /api/ai-insights/health-insights` - Get financial health insights
- `GET /api/ai-insights/budget-suggestions` - Get budget suggestions

## 🗄 Database Schema

### User Model
- Personal information and settings
- Financial summary and achievements
- Authentication credentials

### Income Model
- Amount, source, and category
- Recurring income support
- Date and description tracking

### Expense Model
- Amount, category, and description
- Location and attachment support
- Recurring expense tracking

### Goal Model
- Target and current amounts
- Progress tracking and milestones
- Contribution history

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for password security
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Joi schema validation
- **CORS Protection** - Cross-origin request security
- **Helmet Security** - Additional security headers

## 🚦 Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "details": "Detailed error information (development only)"
}
```

## 📊 Response Format

All successful API responses follow this format:

```json
{
  "success": true,
  "message": "Operation description (optional)",
  "data": {
    // Response data
  }
}
```

## 🧪 Testing

```bash
npm test
```

## 🔧 Development

```bash
# Run in development mode with auto-restart
npm run dev

# Run linting
npm run lint

# Run database migrations
npm run migrate
```

## 📈 Performance Considerations

- **Database Indexing** - Optimized queries with proper indexes
- **Pagination** - Large datasets are paginated
- **Aggregation Pipelines** - Efficient data processing
- **Caching Strategy** - Ready for Redis integration

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://username:password@cluster.mongodb.net/healthywallet` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | `24h` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-frontend-domain.com` |

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For support and questions, please contact the development team.
