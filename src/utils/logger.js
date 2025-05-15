/**
 * Logging utilities
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path
const logFilePath = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);

/**
 * Log an info message
 * @param {String} message - The message to log
 * @param {Object} data - Additional data to log
 */
const logInfo = (message, data = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message,
    data
  };
  
  console.log(`INFO: ${message}`, data);
  appendToLogFile(logEntry);
};

/**
 * Log an error message
 * @param {String} message - The error message
 * @param {Object|Error} error - The error object or additional data
 */
const logError = (message, error = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
  };
  
  console.error(`ERROR: ${message}`, error);
  appendToLogFile(logEntry);
};

/**
 * Append a log entry to the log file
 * @param {Object} logEntry - The log entry to append
 */
const appendToLogFile = (logEntry) => {
  try {
    fs.appendFileSync(
      logFilePath,
      `${JSON.stringify(logEntry)}\n`,
      'utf8'
    );
  } catch (err) {
    console.error('Failed to write to log file', err);
  }
};

module.exports = {
  logInfo,
  logError
};
