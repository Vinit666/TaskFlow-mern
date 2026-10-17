require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const brevoConfig = require('./config/brevo');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    // 1. Establish Database Connection
    await connectDB();

    // 2. Announce Brevo Email Integration Status
    if (brevoConfig.isConfigured()) {
      logger.success(`Brevo Email Service: CONFIGURED (Sender: ${brevoConfig.senderEmail})`);
    } else {
      logger.warn(
        'Brevo Email Service: RUNNING IN SIMULATION MODE (Set BREVO_API_KEY in .env for live emails)'
      );
    }

    // 3. Start Listening for HTTP Requests
    server = app.listen(PORT, () => {
      logger.success(`🚀 TaskFlow Backend Server running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // 4. Handle Unhandled Rejections and Uncaught Exceptions
    process.on('unhandledRejection', (reason) => {
      logger.error('UNHANDLED REJECTION! Shutting down gracefully...', reason);
      if (server) {
        server.close(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });

    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
      process.exit(1);
    });

    // 5. Graceful Process Termination (SIGTERM / SIGINT)
    const handleShutdown = async (signal) => {
      logger.info(`Received ${signal}. Gracefully terminating server...`);
      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed.');
          await disconnectDB();
          process.exit(0);
        });
      } else {
        await disconnectDB();
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.error('Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
