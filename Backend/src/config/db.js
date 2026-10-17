const mongoose = require('mongoose');
const logger = require('../utils/logger');

let memoryServer = null;

/**
 * Connect to MongoDB instance (supports real MongoDB URI and in-memory server fallback)
 * @param {string} [uri] - Optional MongoDB connection URI override
 */
const connectDB = async (uri = null) => {
  try {
    const mongoUri = uri || process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim() !== '') {
      try {
        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 4000
        });
        logger.success(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      } catch (err) {
        logger.warn(`Could not connect to external MongoDB at ${mongoUri}: ${err.message}`);
        // If external connection fails in development/test, fallback to in-memory instance
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
        logger.info('Falling back to built-in in-memory MongoDB for zero-configuration development...');
      }
    }

    // Initialize in-memory MongoDB if no URI or fallback triggered
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    const conn = await mongoose.connect(memUri);
    logger.success(`Embedded In-Memory MongoDB Started at: ${memUri}`);
    return conn;
  } catch (error) {
    logger.error('CRITICAL: MongoDB Connection Error:', error.message);
    throw error;
  }
};

/**
 * Disconnects from MongoDB and stops in-memory server if active
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    logger.info('MongoDB disconnected cleanly.');
  } catch (err) {
    logger.error('Error disconnecting MongoDB:', err.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
