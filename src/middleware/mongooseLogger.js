const mongoose = require('mongoose');
const { dbLogger, colors } = require('./logger');

// Enhanced Mongoose operation logger
const setupMongooseLogger = () => {
  // Only enable in development or when DEBUG is set
  if (process.env.NODE_ENV === 'production' && !process.env.DEBUG_DB) {
    return;
  }

  // Log all Mongoose queries
  mongoose.set('debug', (collectionName, method, query, doc, options) => {
    const startTime = Date.now();
    
    // Format the query for better readability
    let formattedQuery = query;
    if (typeof query === 'object') {
      formattedQuery = JSON.stringify(query, null, 2);
    }

    console.log('\n' + '~'.repeat(60));
    console.log(`${colors.magenta}🗄️  MONGOOSE OPERATION${colors.reset}`);
    console.log(`${colors.bright}Timestamp:${colors.reset} ${new Date().toISOString()}`);
    console.log(`${colors.bright}Collection:${colors.reset} ${collectionName}`);
    console.log(`${colors.bright}Method:${colors.reset} ${colors.cyan}${method}${colors.reset}`);
    console.log(`${colors.bright}Query:${colors.reset}`);
    console.log(formattedQuery);
    
    if (doc && Object.keys(doc).length > 0) {
      console.log(`${colors.bright}Document:${colors.reset}`);
      console.log(JSON.stringify(doc, null, 2));
    }
    
    if (options && Object.keys(options).length > 0) {
      console.log(`${colors.bright}Options:${colors.reset}`);
      console.log(JSON.stringify(options, null, 2));
    }
    
    console.log('~'.repeat(60) + '\n');
  });

  // Log connection events
  mongoose.connection.on('connected', () => {
    console.log(`${colors.green}✅ MongoDB Connected Successfully${colors.reset}`);
    console.log(`${colors.bright}Host:${colors.reset} ${mongoose.connection.host}`);
    console.log(`${colors.bright}Database:${colors.reset} ${mongoose.connection.name}`);
    console.log(`${colors.bright}Port:${colors.reset} ${mongoose.connection.port}\n`);
  });

  mongoose.connection.on('error', (err) => {
    console.log(`${colors.red}❌ MongoDB Connection Error:${colors.reset}`);
    console.log(`${colors.red}${err.message}${colors.reset}\n`);
  });

  mongoose.connection.on('disconnected', () => {
    console.log(`${colors.yellow}⚠️  MongoDB Disconnected${colors.reset}\n`);
  });

  // Log slow queries (> 100ms)
  mongoose.connection.on('slow', (data) => {
    console.log(`${colors.yellow}🐌 SLOW QUERY DETECTED${colors.reset}`);
    console.log(`${colors.bright}Duration:${colors.reset} ${data.ms}ms`);
    console.log(`${colors.bright}Collection:${colors.reset} ${data.collectionName}`);
    console.log(`${colors.bright}Operation:${colors.reset} ${data.method}`);
    console.log(`${colors.bright}Query:${colors.reset} ${JSON.stringify(data.query, null, 2)}\n`);
  });
};

// Custom query performance tracker
const trackQueryPerformance = (schema, modelName) => {
  const performanceStats = new Map();

  schema.pre(/^find/, function() {
    this._startTime = Date.now();
  });

  schema.post(/^find/, function(result) {
    if (this._startTime) {
      const duration = Date.now() - this._startTime;
      const operation = this.op || 'find';
      
      const key = `${modelName}.${operation}`;
      if (!performanceStats.has(key)) {
        performanceStats.set(key, { count: 0, totalTime: 0, maxTime: 0, minTime: Infinity });
      }
      
      const stats = performanceStats.get(key);
      stats.count++;
      stats.totalTime += duration;
      stats.maxTime = Math.max(stats.maxTime, duration);
      stats.minTime = Math.min(stats.minTime, duration);
      
      // Log slow queries
      if (duration > 100) {
        console.log(`${colors.yellow}🐌 SLOW ${modelName} QUERY${colors.reset}`);
        console.log(`${colors.bright}Operation:${colors.reset} ${operation}`);
        console.log(`${colors.bright}Duration:${colors.reset} ${duration}ms`);
        console.log(`${colors.bright}Query:${colors.reset} ${JSON.stringify(this.getQuery(), null, 2)}`);
        console.log(`${colors.bright}Result Count:${colors.reset} ${Array.isArray(result) ? result.length : (result ? 1 : 0)}\n`);
      }
    }
  });

  // Periodically log performance stats (every 10 minutes in development)
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      if (performanceStats.size > 0) {
        console.log(`${colors.cyan}📊 QUERY PERFORMANCE STATS${colors.reset}`);
        console.log(`${colors.bright}Timestamp:${colors.reset} ${new Date().toISOString()}`);
        
        for (const [operation, stats] of performanceStats) {
          const avgTime = (stats.totalTime / stats.count).toFixed(2);
          console.log(`${colors.bright}${operation}:${colors.reset} ${stats.count} queries, avg: ${avgTime}ms, max: ${stats.maxTime}ms, min: ${stats.minTime}ms`);
        }
        
        console.log('');
        performanceStats.clear(); // Reset stats
      }
    }, 10 * 60 * 1000); // 10 minutes
  }
};

module.exports = {
  setupMongooseLogger,
  trackQueryPerformance,
  dbLogger
};
