const rateLimit = require('express-rate-limit');

// Request queue to handle concurrent requests per user
const userRequestQueues = new Map();
const MAX_CONCURRENT_REQUESTS_PER_USER = 5;

// Concurrency limiter middleware
const concurrencyLimiter = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  
  if (!userRequestQueues.has(userId)) {
    userRequestQueues.set(userId, { active: 0, queue: [] });
  }
  
  const userQueue = userRequestQueues.get(userId);
  
  // If under limit, process immediately
  if (userQueue.active < MAX_CONCURRENT_REQUESTS_PER_USER) {
    userQueue.active++;
    
    // Cleanup when request finishes
    res.on('finish', () => {
      userQueue.active--;
      processQueue(userId);
    });
    
    res.on('close', () => {
      userQueue.active--;
      processQueue(userId);
    });
    
    next();
  } else {
    // Queue the request
    userQueue.queue.push({ req, res, next });
    
    // Set timeout for queued requests
    const timeout = setTimeout(() => {
      const index = userQueue.queue.findIndex(item => item.req === req);
      if (index !== -1) {
        userQueue.queue.splice(index, 1);
        res.status(503).json({
          success: false,
          message: 'Server too busy, please try again later',
          retryAfter: 2
        });
      }
    }, 10000); // 10 second timeout
    
    req.queueTimeout = timeout;
  }
};

// Process queued requests
const processQueue = (userId) => {
  const userQueue = userRequestQueues.get(userId);
  if (!userQueue || userQueue.queue.length === 0) return;
  
  if (userQueue.active < MAX_CONCURRENT_REQUESTS_PER_USER) {
    const { req, res, next } = userQueue.queue.shift();
    
    // Clear timeout
    if (req.queueTimeout) {
      clearTimeout(req.queueTimeout);
    }
    
    userQueue.active++;
    
    // Cleanup when request finishes
    res.on('finish', () => {
      userQueue.active--;
      processQueue(userId);
    });
    
    res.on('close', () => {
      userQueue.active--;
      processQueue(userId);
    });
    
    next();
  }
};

// Cleanup old user queues
setInterval(() => {
  for (const [userId, queue] of userRequestQueues.entries()) {
    if (queue.active === 0 && queue.queue.length === 0) {
      userRequestQueues.delete(userId);
    }
  }
}, 60000); // Cleanup every minute

// Database operation timeout wrapper
const withTimeout = (promise, timeoutMs = 30000, operation = 'Database operation') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// Circuit breaker for database operations
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - too many failures');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Global circuit breaker for database operations
const dbCircuitBreaker = new CircuitBreaker(5, 60000);

module.exports = {
  concurrencyLimiter,
  withTimeout,
  dbCircuitBreaker
};
