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
      console.warn(`🐌 SLOW REQUEST DETECTED:`);
      console.warn(`   URL: ${req.method} ${req.originalUrl}`);
      console.warn(`   Duration: ${duration}ms`);
      console.warn(`   Memory Delta: ${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Log memory warnings
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 500) { // Warning if using > 500MB
      console.warn(`⚠️  HIGH MEMORY USAGE: ${heapUsedMB.toFixed(2)}MB`);
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
      console.warn(`⚠️  Memory Warning: ${health.memory.heapUsed}MB heap used`);
    }
    
    if (health.system.loadAverage[0] > 2) {
      console.warn(`⚠️  CPU Warning: Load average ${health.system.loadAverage[0].toFixed(2)}`);
    }
    
    if (health.system.freeMemory < 500) {
      console.warn(`⚠️  System Memory Warning: Only ${health.system.freeMemory}MB free`);
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
    console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);
    
    stopHealthMonitoring();
    
    server.close((err) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
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
