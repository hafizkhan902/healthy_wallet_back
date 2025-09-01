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
    
    // Debug request logging (enabled via environment variable)
    if (process.env.ENABLE_DEBUG_LOGGING === 'true') {
      console.log('\n' + '='.repeat(80));
      console.log(`${colors.cyan}📥 INCOMING REQUEST${colors.reset} [ID: ${requestId}]`);
      console.log(`${colors.bright}Timestamp:${colors.reset} ${new Date().toISOString()}`);
      console.log(`${colors.bright}Method:${colors.reset} ${getColoredMethod(req.method)}`);
      console.log(`${colors.bright}URL:${colors.reset} ${req.originalUrl}`);
      console.log(`${colors.bright}IP:${colors.reset} ${req.ip || req.connection.remoteAddress}`);
      console.log(`${colors.bright}User-Agent:${colors.reset} ${req.get('User-Agent') || 'Unknown'}`);
      
      // Log headers (sanitized)
      const sanitizedHeaders = sanitizeData(req.headers);
      console.log(`${colors.bright}Headers:${colors.reset}`);
      console.log(formatJSON(sanitizedHeaders, 300));
      
      // Log query parameters
      if (Object.keys(req.query).length > 0) {
        console.log(`${colors.bright}Query Params:${colors.reset}`);
        console.log(formatJSON(req.query, 200));
      }
      
      // Log request body (sanitized)
      if (req.body && Object.keys(req.body).length > 0) {
        console.log(`${colors.bright}Request Body:${colors.reset}`);
        const sanitizedBody = sanitizeData(req.body);
        console.log(formatJSON(sanitizedBody, 400));
      }
      
      // Log route parameters
      if (req.params && Object.keys(req.params).length > 0) {
        console.log(`${colors.bright}Route Params:${colors.reset}`);
        console.log(formatJSON(req.params, 100));
      }
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
      
      // Debug response logging (enabled via environment variable)
      if (process.env.ENABLE_DEBUG_LOGGING === 'true') {
        console.log('\n' + '-'.repeat(80));
        console.log(`${colors.cyan}📤 OUTGOING RESPONSE${colors.reset} [ID: ${requestId}]`);
        console.log(`${colors.bright}Timestamp:${colors.reset} ${new Date().toISOString()}`);
        console.log(`${colors.bright}Status:${colors.reset} ${getColoredStatus(res.statusCode)}`);
        console.log(`${colors.bright}Duration:${colors.reset} ${duration}ms`);
        
        // Log response headers
        console.log(`${colors.bright}Response Headers:${colors.reset}`);
        console.log(formatJSON(res.getHeaders(), 200));
        
        // Log response body (sanitized and truncated)
        if (res.responseBody) {
          console.log(`${colors.bright}Response Body:${colors.reset}`);
          try {
            const responseData = typeof res.responseBody === 'string' ? JSON.parse(res.responseBody) : res.responseBody;
            const sanitizedResponse = sanitizeData(responseData);
            console.log(formatJSON(sanitizedResponse, 500));
          } catch (parseError) {
            console.log(res.responseBody.toString().substring(0, 500) + '...');
          }
        }
        
        // Performance indicator
        const performanceIcon = duration < 100 ? '⚡' : duration < 500 ? '🐎' : duration < 1000 ? '🐌' : '🔥';
        console.log(`${colors.bright}Performance:${colors.reset} ${performanceIcon} ${duration}ms`);
        console.log('='.repeat(80) + '\n');
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
  
  // Debug error logging (enabled via environment variable)
  if (process.env.ENABLE_DEBUG_LOGGING === 'true') {
    console.log('\n' + '!'.repeat(80));
    console.log(`${colors.red}❌ ERROR OCCURRED${colors.reset} [ID: ${requestId}]`);
    console.log(`${colors.bright}Timestamp:${colors.reset} ${new Date().toISOString()}`);
    console.log(`${colors.bright}Request:${colors.reset} ${getColoredMethod(req.method)} ${req.originalUrl}`);
    console.log(`${colors.bright}Error Name:${colors.reset} ${err.name || 'Unknown Error'}`);
    console.log(`${colors.bright}Error Message:${colors.reset} ${colors.red}${err.message}${colors.reset}`);
    
    // Show stack trace in development
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG_LOGGING === 'true') {
      console.log(`${colors.bright}Stack Trace:${colors.reset}`);
      console.log(`${colors.dim}${err.stack}${colors.reset}`);
    }
    
    // Log additional error details
    if (err.code) {
      console.log(`${colors.bright}Error Code:${colors.reset} ${err.code}`);
    }
    
    if (err.statusCode || err.status) {
      console.log(`${colors.bright}Status Code:${colors.reset} ${getColoredStatus(err.statusCode || err.status)}`);
    }
    
    // Log user context if available
    if (req.user) {
      console.log(`${colors.bright}User Context:${colors.reset} ID=${req.user.id}, Email=${req.user.email}`);
    }
    
    // Log request body that caused the error (sanitized)
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`${colors.bright}Request Body (at error):${colors.reset}`);
      const sanitizedBody = sanitizeData(req.body);
      console.log(formatJSON(sanitizedBody, 300));
    }
    
    console.log('!'.repeat(80) + '\n');
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
    // Debug database logging (enabled via environment variable)
    if (process.env.ENABLE_DEBUG_LOGGING === 'true') {
      console.log('\n' + '~'.repeat(60));
      console.log(`${colors.magenta}🗄️  DATABASE OPERATION${colors.reset}`);
      console.log(`${colors.bright}Timestamp:${colors.reset} ${new Date().toISOString()}`);
      console.log(`${colors.bright}Operation:${colors.reset} ${operation.toUpperCase()}`);
      console.log(`${colors.bright}Collection:${colors.reset} ${collection}`);
      console.log(`${colors.bright}Query:${colors.reset}`);
      console.log(formatJSON(query, 300));
      
      if (result !== null) {
        console.log(`${colors.bright}Result Count:${colors.reset} ${Array.isArray(result) ? result.length : (result ? 1 : 0)}`);
      }
      
      if (duration > 0) {
        const perfIcon = duration < 50 ? '⚡' : duration < 200 ? '🐎' : duration < 500 ? '🐌' : '🔥';
        console.log(`${colors.bright}Duration:${colors.reset} ${perfIcon} ${duration}ms`);
      }
      
      console.log('~'.repeat(60) + '\n');
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
  // Debug server start logging (enabled via environment variable)
  if (process.env.ENABLE_DEBUG_LOGGING === 'true') {
    console.log('\n' + '🚀'.repeat(20));
    console.log(`${colors.green}${colors.bright}HealthyWallet API Server Started!${colors.reset}`);
    console.log(`${colors.bright}Port:${colors.reset} ${colors.cyan}${port}${colors.reset}`);
    console.log(`${colors.bright}Environment:${colors.reset} ${colors.yellow}${environment}${colors.reset}`);
    console.log(`${colors.bright}Timestamp:${colors.reset} ${new Date().toISOString()}`);
    console.log(`${colors.bright}Health Check:${colors.reset} ${process.env.BASE_URL || `http://localhost:${port}`}/api/health`);
    console.log(`${colors.bright}Debug Mode:${colors.reset} ${colors.green}ENABLED${colors.reset}`);
    console.log('🚀'.repeat(20) + '\n');
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