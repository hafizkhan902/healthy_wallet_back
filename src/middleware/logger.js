const crypto = require('crypto');

// Color codes (kept for potential debugging)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
const generateRequestId = () => crypto.randomBytes(4).toString('hex');

const getColoredMethod = (method) => {
  const methodColors = {
    GET: colors.green,
    POST: colors.blue,
    PUT: colors.yellow,
    DELETE: colors.red,
    PATCH: colors.magenta
  };
  return `${methodColors[method] || colors.cyan}${method}${colors.reset}`;
};

const getColoredStatus = (status) => {
  if (status >= 200 && status < 300) return `${colors.green}${status}${colors.reset}`;
  if (status >= 300 && status < 400) return `${colors.yellow}${status}${colors.reset}`;
  if (status >= 400 && status < 500) return `${colors.red}${status}${colors.reset}`;
  if (status >= 500) return `${colors.red}${colors.bright}${status}${colors.reset}`;
  return `${colors.cyan}${status}${colors.reset}`;
};

const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = JSON.parse(JSON.stringify(data));
  
  const sanitizeRecursive = (obj) => {
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeRecursive(obj[key]);
      }
    }
  };
  
  sanitizeRecursive(sanitized);
  return sanitized;
};

const formatJSON = (obj, maxLength = 500) => {
  if (!obj) return 'null';
  let jsonStr = JSON.stringify(obj, null, 2);
  if (jsonStr.length > maxLength) {
    jsonStr = jsonStr.substring(0, maxLength) + '... [truncated]';
  }
  return jsonStr;
};

// Request logging middleware
const requestLogger = () => {
  return (req, res, next) => {
    const requestId = generateRequestId();
    req.requestId = requestId;
    
    const startTime = Date.now();
    req.startTime = startTime;
    
    // Silent request logging (no console output in production)
    if (process.env.ENABLE_REQUEST_LOGGING === 'true' && process.env.NODE_ENV === 'development') {
      // Development logging would go here, but disabled for production
    }

    // Capture response body for logging
    const originalSend = res.send;
    res.send = function(data) {
      res.responseBody = data;
      return originalSend.call(this, data);
    };

    next();
  };
};

// Response logging middleware
const responseLogger = () => {
  return (req, res, next) => {
    res.on('finish', () => {
      const duration = Date.now() - req.startTime;
      const requestId = req.requestId;
      
      // Silent response logging (no console output in production)
      if (process.env.ENABLE_REQUEST_LOGGING === 'true' && process.env.NODE_ENV === 'development') {
        // Development logging would go here, but disabled for production
      }

      // Store metrics for monitoring tools if needed
      req.responseMetrics = {
        requestId,
        duration,
        statusCode: res.statusCode,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };
    });
    
    next();
  };
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  
  // Silent error logging (no console output in production)
  if (process.env.ENABLE_ERROR_LOGGING === 'true' && process.env.NODE_ENV === 'development') {
    // Development error logging would go here, but disabled for production
  }

  // Store error for monitoring tools if needed
  req.errorInfo = {
    requestId,
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode || err.status
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    user: req.user ? { id: req.user.id, email: req.user.email } : null,
    timestamp: new Date().toISOString()
  };

  next(err);
};

// Database query logger
const dbLogger = {
  logQuery: (operation, collection, query, result = null, duration = 0) => {
    // Silent database logging (no console output in production)
    if (process.env.ENABLE_REQUEST_LOGGING === 'true' && process.env.NODE_ENV === 'development') {
      // Development database logging would go here, but disabled for production
    }

    // Store query metrics for monitoring if needed
    return {
      operation,
      collection,
      query: sanitizeData(query),
      resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
      duration,
      timestamp: new Date().toISOString()
    };
  }
};

// API summary logger for development
const apiSummaryLogger = () => {
  const apiCalls = new Map();
  
  return (req, res, next) => {
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    res.on('finish', () => {
      if (!apiCalls.has(endpoint)) {
        apiCalls.set(endpoint, { count: 0, totalTime: 0, errors: 0 });
      }
      
      const stats = apiCalls.get(endpoint);
      stats.count++;
      stats.totalTime += (Date.now() - req.startTime);
      
      if (res.statusCode >= 400) {
        stats.errors++;
      }
    });
    
    next();
  };
};

// Server start logger
const logServerStart = (port, environment) => {
  // Silent server start (no console output in production)
  if (process.env.NODE_ENV === 'development') {
    // Development server start logging would go here, but disabled for production
  }

  // Return server info for monitoring tools
  return {
    port,
    environment,
    timestamp: new Date().toISOString(),
    healthCheck: `${process.env.BASE_URL || `http://localhost:${port}`}/api/health`,
    nodeEnv: process.env.NODE_ENV
  };
};

module.exports = {
  requestLogger,
  responseLogger,
  errorLogger,
  dbLogger,
  apiSummaryLogger,
  logServerStart,
  // Utility functions for potential monitoring integration
  generateRequestId,
  sanitizeData,
  formatJSON
};