const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { requestLogger, errorLogger, logServerStart, apiSummaryLogger } = require('./middleware/logger');
const { concurrencyLimiter } = require('./middleware/concurrencyControl');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expenses');
const goalRoutes = require('./routes/goals');
const reportRoutes = require('./routes/reports');
const aiInsightsRoutes = require('./routes/aiInsights');
const settingsRoutes = require('./routes/settings');
const achievementRoutes = require('./routes/achievements');

const app = express();

// Trust proxy for rate limiting (when behind frontend proxy)
app.set('trust proxy', 1);

// Connect to Database only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Request Logging Middleware (before other middleware)
app.use(requestLogger);

// Performance Monitoring
// app.use(performanceMonitor);

// API Summary Logger
app.use(apiSummaryLogger());

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for localhost in development only
  skip: (req) => process.env.SKIP_RATE_LIMIT_FOR_LOCALHOST === 'true' && 
                 process.env.NODE_ENV === 'development' && 
                 (req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === 'localhost')
});
app.use(limiter);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.FRONTEND_URL ? 
      process.env.FRONTEND_URL.split(',').map(url => url.trim()) : 
      ['https://healthywallet.app'];

    // Silent CORS origin checking (no console output in production)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes (with concurrency control for data-heavy endpoints)
// Health Check Route moved to /api/health for consistency
app.get('/api/health', (req, res) => {
  try {
    const dbState = require('mongoose').connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    
    res.status(200).json({
      success: true,
      message: 'HealthyWallet API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        status: dbStatus,
        readyState: dbState
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reports', concurrencyLimiter, reportRoutes); // Reports can be resource-intensive
app.use('/api/ai-insights', concurrencyLimiter, aiInsightsRoutes); // AI operations are heavy
app.use('/api/settings', settingsRoutes);
app.use('/api/achievements', achievementRoutes);

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
  const server = app.listen(PORT, () => {
    logServerStart(PORT, process.env.NODE_ENV || 'development');
  });
  
  // Handle server errors
  server.on('error', (error) => {
    // Silent server error handling (no console output in production)
  });
}

module.exports = app;
