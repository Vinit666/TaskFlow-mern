/**
 * Application Logger Utility
 * Provides structured, timestamped console logs with semantic color indicators for easy debugging.
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

const formatTime = () => new Date().toISOString();

const logger = {
  info: (message, meta = '') => {
    console.log(`${colors.cyan}[INFO]${colors.reset} [${formatTime()}] ${message}`, meta ? meta : '');
  },
  success: (message, meta = '') => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} [${formatTime()}] ${message}`, meta ? meta : '');
  },
  warn: (message, meta = '') => {
    console.warn(`${colors.yellow}[WARN]${colors.reset} [${formatTime()}] ${message}`, meta ? meta : '');
  },
  error: (message, error = '') => {
    console.error(`${colors.red}[ERROR]${colors.reset} [${formatTime()}] ${message}`, error ? error : '');
  },
  debug: (message, meta = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${colors.magenta}[DEBUG]${colors.reset} [${formatTime()}] ${message}`, meta ? meta : '');
    }
  }
};

module.exports = logger;
