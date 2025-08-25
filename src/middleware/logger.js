const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper function to get colored status
const getColoredStatus = (status) => {
  if (status >= 200 && status < 300) return `${colors.green}${status}${colors.reset}`;
  if (status >= 300 && status < 400) return `${colors.yellow}${status}${colors.reset}`;
  if (status >= 400 && status < 500) return `${colors.red}${status}${colors.reset}`;
  if (status >= 500) return `${colors.magenta}${status}${colors.reset}`;
  return status;
};

// Helper function to get method color
const getColoredMethod = (method) => {
  const colors_map = {
    GET: colors.green,
    POST: colors.blue,
    PUT: colors.yellow,
    DELETE: colors.red,
    PATCH: colors.cyan
  };
  const color = colors_map[method] || colors.white;
  return `${color}${method}${colors.reset}`;
};

// Helper function to format JSON
const formatJSON = (obj, maxLength = 500) => {
  if (!obj) return 'null';
  
  try {
    let jsonString = JSON.stringify(obj, null, 2);
    
    // Truncate if too long
    if (jsonString.length > maxLength) {
      jsonString = jsonString.substring(0, maxLength) + '...[truncated]';
    }
    
    return jsonString;
  } catch (error) {
    return '[Unable to stringify object]';
  }
};

// Helper function to sanitize sensitive data
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'session'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[HIDDEN]';
    }
  }
  
  return sanitized;
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  // Add request ID to request object for tracking
  req.requestId = requestId;
  
  // Log incoming request
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
  
  // Store original res.json to intercept response
  const originalJson = res.json;
  const originalSend = res.send;
  
  let responseBody = null;
  
  // Override res.json to capture response data
  res.json = function(data) {
    responseBody = data;
    return originalJson.call(this, data);
  };
  
  // Override res.send to capture response data
  res.send = function(data) {
    if (!responseBody) {
      try {
        responseBody = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (e) {
        responseBody = data;
      }
    }
    return originalSend.call(this, data);
  };
  
  // Log response when request finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    console.log('\n' + '-'.repeat(80));
    console.log(`${colors.cyan}📤 OUTGOING RESPONSE${colors.reset} [ID: ${requestId}]`);
    console.log(`${colors.bright}Timestamp:${colors.reset} ${new Date().toISOString()}`);
    console.log(`${colors.bright}Status:${colors.reset} ${getColoredStatus(res.statusCode)}`);
    console.log(`${colors.bright}Duration:${colors.reset} ${duration}ms`);
    
    // Log response headers
    console.log(`${colors.bright}Response Headers:${colors.reset}`);
    console.log(formatJSON(res.getHeaders(), 200));
    
    // Log response body
    if (responseBody) {
      console.log(`${colors.bright}Response Body:${colors.reset}`);
      const sanitizedResponse = sanitizeData(responseBody);
      console.log(formatJSON(sanitizedResponse, 500));
    }
    
    // Performance indicator
    let performanceIcon = '🟢';
    if (duration > 1000) performanceIcon = '🔴';
    else if (duration > 500) performanceIcon = '🟡';
    
    console.log(`${colors.bright}Performance:${colors.reset} ${performanceIcon} ${duration}ms`);
    console.log('='.repeat(80) + '\n');
  });
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  
  console.log('\n' + '!'.repeat(80));
  console.log(`${colors.red}❌ ERROR OCCURRED${colors.reset} [ID: ${requestId}]`);
  console.log(`${colors.bright}Timestamp:${colors.reset} ${new Date().toISOString()}`);
  console.log(`${colors.bright}Request:${colors.reset} ${getColoredMethod(req.method)} ${req.originalUrl}`);
  console.log(`${colors.bright}Error Name:${colors.reset} ${err.name || 'Unknown Error'}`);
  console.log(`${colors.bright}Error Message:${colors.reset} ${colors.red}${err.message}${colors.reset}`);
  
  // Log error stack in development
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
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
  
  // Log request context for debugging
  if (req.user) {
    console.log(`${colors.bright}User Context:${colors.reset} ID=${req.user.id}, Email=${req.user.email}`);
  }
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`${colors.bright}Request Body (at error):${colors.reset}`);
    const sanitizedBody = sanitizeData(req.body);
    console.log(formatJSON(sanitizedBody, 300));
  }
  
  console.log('!'.repeat(80) + '\n');
  
  // Pass error to next middleware
  next(err);
};

// Database query logger
const dbLogger = {
  logQuery: (operation, collection, query, result = null, duration = 0) => {
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
      let perfIcon = '🟢';
      if (duration > 100) perfIcon = '🔴';
      else if (duration > 50) perfIcon = '🟡';
      
      console.log(`${colors.bright}Duration:${colors.reset} ${perfIcon} ${duration}ms`);
    }
    
    console.log('~'.repeat(60) + '\n');
  }
};

// API endpoint summary logger
const apiSummaryLogger = () => {
  const endpoints = new Map();
  
  return (req, res, next) => {
    const key = `${req.method} ${req.route?.path || req.path}`;
    
    res.on('finish', () => {
      if (!endpoints.has(key)) {
        endpoints.set(key, { count: 0, totalDuration: 0, errors: 0 });
      }
      
      const stats = endpoints.get(key);
      stats.count++;
      
      if (res.statusCode >= 400) {
        stats.errors++;
      }
    });
    
    next();
  };
};

// Startup logger
const logServerStart = (port, environment) => {
  console.log('\n' + '🚀'.repeat(20));
  console.log(`${colors.green}${colors.bright}HealthyWallet API Server Started!${colors.reset}`);
  console.log(`${colors.bright}Port:${colors.reset} ${colors.cyan}${port}${colors.reset}`);
  console.log(`${colors.bright}Environment:${colors.reset} ${colors.yellow}${environment}${colors.reset}`);
  console.log(`${colors.bright}Timestamp:${colors.reset} ${new Date().toISOString()}`);
  console.log(`${colors.bright}Health Check:${colors.reset} http://localhost:${port}/health`);
  console.log(`${colors.bright}Debug Mode:${colors.reset} ${colors.green}ENABLED${colors.reset}`);
  console.log('🚀'.repeat(20) + '\n');
};

// Export all logging utilities
module.exports = {
  requestLogger,
  errorLogger,
  dbLogger,
  apiSummaryLogger,
  logServerStart,
  colors,
  formatJSON,
  sanitizeData
};
