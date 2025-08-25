const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { requestLogger, errorLogger, logServerStart, apiSummaryLogger } = require('./middleware/logger');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expenses');
const goalRoutes = require('./routes/goals');
const reportRoutes = require('./routes/reports');
const aiInsightsRoutes = require('./routes/aiInsights');

const app = express();

// Connect to Database only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Request Logging Middleware (before other middleware)
app.use(requestLogger);

// API Summary Logger
app.use(apiSummaryLogger());

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000, // Increased to 1000 for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting in development
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '::1'
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HealthyWallet API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai-insights', aiInsightsRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler Middleware (must be last)
// Error Logging Middleware (before error handler)
app.use(errorLogger);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logServerStart(PORT, process.env.NODE_ENV || 'development');
  });
}

module.exports = app;
