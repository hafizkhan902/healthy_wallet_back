const os = require('os');

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      // Silent slow request detection (no console output in production)
    }
    
    // Log memory warnings
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 500) { // Warning if using > 500MB
      // Silent high memory usage warning (no console output in production)
    }
  });
  
  next();
};

// System health check
const getSystemHealth = () => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    system: {
      loadAverage: os.loadavg(),
      freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
      totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
      uptime: Math.round(process.uptime()) // seconds
    }
  };
};

// Periodic health monitoring
let healthCheckInterval;

const startHealthMonitoring = () => {
  healthCheckInterval = setInterval(() => {
    const health = getSystemHealth();
    
    // Log warnings for concerning metrics
    if (health.memory.heapUsed > 500) {
      // Silent memory warning (no console output in production)
    }
    
    if (health.system.loadAverage[0] > 2) {
      // Silent CPU warning (no console output in production)
    }
    
    if (health.system.freeMemory < 500) {
      // Silent system memory warning (no console output in production)
    }
    
  }, 30000); // Check every 30 seconds
};

const stopHealthMonitoring = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
};

// Graceful shutdown handler
const setupGracefulShutdown = (server) => {
  const shutdown = (signal) => {
    // Silent graceful shutdown (no console output in production)
    
    stopHealthMonitoring();
    
    server.close((err) => {
      if (err) {
        // Silent error handling (no console output in production)
        process.exit(1);
      }
      
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      // Silent forced shutdown (no console output in production)
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

module.exports = {
  performanceMonitor,
  getSystemHealth,
  startHealthMonitoring,
  stopHealthMonitoring,
  setupGracefulShutdown
};
