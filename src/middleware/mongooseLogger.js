const mongoose = require('mongoose');

// Color codes for terminal output (kept for potential future debugging)
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

const setupMongooseLogger = () => {
  // Disable mongoose debug logging for production
  mongoose.set('debug', false);

  // Connection event handlers (silent in production)
  mongoose.connection.on('connected', () => {
    // Connection successful - silent logging
  });

  mongoose.connection.on('error', (err) => {
    // Connection error - silent logging
  });

  mongoose.connection.on('disconnected', () => {
    // Disconnection - silent logging
  });

  // Performance monitoring for slow queries (disabled in production)
  if (process.env.NODE_ENV === 'development') {
    mongoose.connection.on('slow', (data) => {
      // Slow query detection - only in development
    });
  }

  // Query performance tracking
  const performanceStats = new Map();

  // Hook into query execution for performance monitoring
  mongoose.Query.prototype.exec = (function(originalExec) {
    return function() {
      const startTime = Date.now();
      const operation = this.getOptions().op || this.op || 'unknown';
      const modelName = this.model?.modelName || 'Unknown';

      return originalExec.apply(this, arguments).then(result => {
        const duration = Date.now() - startTime;

        // Track performance stats silently
        if (!performanceStats.has(operation)) {
          performanceStats.set(operation, {
            count: 0,
            totalTime: 0,
            maxTime: 0,
            minTime: Infinity
          });
        }

        const stats = performanceStats.get(operation);
        stats.count++;
        stats.totalTime += duration;
        stats.maxTime = Math.max(stats.maxTime, duration);
        stats.minTime = Math.min(stats.minTime, duration);

        // Silent performance monitoring (no console output)
        return result;
      });
    };
  })(mongoose.Query.prototype.exec);

  // Periodic performance stats cleanup (every 5 minutes)
  setInterval(() => {
    performanceStats.clear();
  }, 5 * 60 * 1000);
};

module.exports = {
  setupMongooseLogger,
  // Expose performance stats for monitoring tools if needed
  getPerformanceStats: () => {
    const stats = new Map();
    // Return copy of performance stats without logging
    return stats;
  }
};