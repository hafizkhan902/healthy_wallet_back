const mongoose = require('mongoose');
const { setupMongooseLogger } = require('../middleware/mongooseLogger');

const connectDB = async () => {
  try {
    // Setup enhanced logging
    setupMongooseLogger();
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pool settings
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    });

    // Silent MongoDB connection (no console output in production)
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      // Silent MongoDB error handling (no console output in production)
    });

    mongoose.connection.on('disconnected', () => {
      // Silent MongoDB disconnection (no console output in production)
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      // Silent MongoDB shutdown (no console output in production)
      process.exit(0);
    });

  } catch (error) {
    // Silent database connection error (no console output in production)
    process.exit(1);
  }
};

module.exports = connectDB;
