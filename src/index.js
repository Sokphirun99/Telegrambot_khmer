require('dotenv').config();

// Import the Telegram Bot API
const TelegramBot = require('node-telegram-bot-api');

// Import handlers
const messageHandler = require('./handlers/messageHandler');
const commandHandler = require('./handlers/commandHandler');
const { logError, logInfo } = require('./utils/logger');

// Import models and services
const User = require('./models/User');
const dataService = require('./services/dataService');
const telegramService = require('./services/telegramService');

// Debug information for troubleshooting
console.log('Environment variables loaded');

// Bot token from environment variables
const token = process.env.BOT_TOKEN;
console.log('BOT_TOKEN exists:', !!token);

// Check if token is provided
if (!token) {
  console.error('BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Log when bot is started
console.log('Bot is running...');

// Handle commands
bot.onText(/\/(.+)/, (msg, match) => {
  try {
    const command = match[1];
    
    // Save or update user
    const telegramUser = msg.from;
    let user = dataService.getUser(telegramUser.id);
    
    if (!user) {
      user = User.fromTelegramUser(telegramUser);
      dataService.saveUser(user);
      logInfo(`New user registered: ${user.getFullName()} (${user.id})`);
    } else {
      // Update last active timestamp
      user.lastActive = new Date();
      dataService.saveUser(user);
    }
    
    commandHandler.handleCommand(bot, msg, command, user);
  } catch (error) {
    logError('Error handling command', error);
    bot.sendMessage(msg.chat.id, 'សូមអភ័យទោស មានបញ្ហាកើតឡើង។');
  }
});

// Handle messages
bot.on('message', (msg) => {
  try {
    // Skip commands as they're handled separately
    if (msg.text && msg.text.startsWith('/')) return;
    
    // Save or update user
    const telegramUser = msg.from;
    let user = dataService.getUser(telegramUser.id);
    
    if (!user) {
      user = User.fromTelegramUser(telegramUser);
      dataService.saveUser(user);
      logInfo(`New user registered: ${user.getFullName()} (${user.id})`);
    } else {
      // Update last active timestamp
      user.lastActive = new Date();
      dataService.saveUser(user);
    }
    
    // Get conversation state
    const conversation = dataService.getConversation(user.id);
    
    messageHandler.handleMessage(bot, msg, user, conversation);
    
    // Save updated conversation state if needed
    dataService.saveConversation(user.id, conversation);
  } catch (error) {
    logError('Error handling message', error);
    bot.sendMessage(msg.chat.id, 'សូមអភ័យទោស មានបញ្ហាកើតឡើង។');
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  logError('Polling error', error);
});

// Handle other errors
process.on('uncaughtException', (error) => {
  logError('Uncaught exception', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled rejection', { reason, promise });
});
