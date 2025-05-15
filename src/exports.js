/**
 * Module exports for the Telegram Bot Khmer project
 */

// Export all modules
module.exports = {
  // Handlers
  commandHandler: require('./handlers/commandHandler'),
  messageHandler: require('./handlers/messageHandler'),
  
  // Models
  User: require('./models/User'),
  
  // Services
  dataService: require('./services/dataService'),
  telegramService: require('./services/telegramService'),
  
  // Utilities
  logger: require('./utils/logger'),
  stringUtils: require('./utils/stringUtils'),
  
  // Configuration
  config: require('../config/botConfig')
};
