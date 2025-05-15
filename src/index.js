require('dotenv').config();

// Import the Telegram Bot API
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;

// Import process lock utility to prevent multiple instances
const processLock = require('./utils/processLock');

// Check if another instance is already running
if (processLock.checkLock()) {
  console.error('Another instance of the bot is already running. Exiting...');
  process.exit(1);
}

// Create process lock
processLock.createLock();

// Import handlers
const messageHandler = require('./handlers/messageHandler');
const commandHandler = require('./handlers/commandHandler');
const { logError, logInfo } = require('./utils/logger');

// Import models and services
const User = require('./models/User');
const dataService = require('./services/dataService');
const telegramService = require('./services/telegramService');

// Import messages utility
const messages = require('./utils/messages');

// Debug information for troubleshooting
console.log('Environment variables loaded');

// Import bot configuration
const botConfig = require('../config/botConfig');

// Bot token from environment variables
const token = process.env.BOT_TOKEN;
console.log('BOT_TOKEN exists:', !!token);

// Check if token is provided
if (!token) {
  console.error('BOT_TOKEN is not set in environment variables');
  processLock.removeLock();
  process.exit(1);
}

// Set up global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled rejection', { 
    reason: reason instanceof Error ? { 
      message: reason.message,
      stack: reason.stack,
      code: reason.code 
    } : reason, 
    promise 
  });
});

process.on('uncaughtException', (error) => {
  logError('Uncaught exception', error);
  // For uncaught exceptions, we should exit after cleanup
  processLock.removeLock();
  process.exit(1);
});

// Variable to track reconnect attempts
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10; // Increased from 5 to 10
let reconnectTimeout = null;
let dnsCheckInterval = null;

/**
 * Check if the Telegram API is reachable
 * @returns {Promise<boolean>} True if API is reachable, false otherwise
 */
async function checkTelegramApiReachable() {
  try {
    // Try to resolve the Telegram API hostname
    await dns.lookup('api.telegram.org');
    return true;
  } catch (error) {
    logError('Telegram API unreachable: DNS lookup failed', error);
    return false;
  }
}

// Create singleton bot instance with proper options based on mode
let bot;
const connectionMode = botConfig.connection.mode;

/**
 * Initialize the bot with proper configuration
 */
async function initializeBot() {
  try {
    // Check if Telegram API is reachable before initializing
    const isApiReachable = await checkTelegramApiReachable();
    if (!isApiReachable) {
      logInfo('Telegram API is unreachable. Will retry in 30 seconds...');
      
      // Set up a periodic check for API reachability
      if (!dnsCheckInterval) {
        dnsCheckInterval = setInterval(async () => {
          const check = await checkTelegramApiReachable();
          if (check) {
            logInfo('Telegram API is now reachable. Initializing bot...');
            clearInterval(dnsCheckInterval);
            dnsCheckInterval = null;
            initializeBot();
          }
        }, 30000); // Check every 30 seconds
      }
      return;
    }
    
    if (connectionMode === 'webhook' && process.env.WEBHOOK_URL) {
      // Webhook mode for production
      logInfo(`Starting bot in webhook mode on port ${botConfig.connection.webhook.port}`);
      
      bot = new TelegramBot(token, {
        webHook: {
          port: botConfig.connection.webhook.port,
          host: botConfig.connection.webhook.host
        }
      });
      
      // Set webhook path
      const webhookUrl = botConfig.connection.webhook.url + botConfig.connection.webhook.path;
      bot.setWebHook(webhookUrl);
      
      logInfo(`Webhook set to: ${webhookUrl}`);
    } else {
      // Polling mode (default, for development)
      logInfo('Starting bot in polling mode');
      
      // Try to get custom session ID to make this instance unique
      const sessionId = Math.random().toString(36).substring(2, 15);
      
      bot = new TelegramBot(token, {
        polling: {
          ...botConfig.connection.polling,
          // Add an extra parameter to help distinguish between instances
          params: {
            session: sessionId,
            ts: Date.now()
          }
        }
      });
      
      // Handle polling errors
      bot.on('polling_error', async (error) => {
        logError(`Polling error: ${error.message}`);
        
        // If we get a network connectivity error
        if (error.message.includes('ENOTFOUND') || 
            error.message.includes('ETIMEDOUT') || 
            error.message.includes('ECONNRESET') || 
            error.message.includes('ECONNREFUSED')) {
          
          logInfo('Network connectivity issue detected. Will check connectivity periodically.');
          
          // Stop current polling
          try {
            await bot.stopPolling();
            
            // Set up a periodic check for API reachability if not already running
            if (!dnsCheckInterval) {
              dnsCheckInterval = setInterval(async () => {
                const check = await checkTelegramApiReachable();
                if (check) {
                  logInfo('Telegram API is now reachable. Restarting bot...');
                  clearInterval(dnsCheckInterval);
                  dnsCheckInterval = null;
                  reconnectAttempts = 0;
                  initializeBot();
                }
              }, 30000); // Check every 30 seconds
            }
          } catch (err) {
            logError('Failed to stop polling:', err);
          }
          return;
        }
        
        // If we get a 409 conflict error, we need to reset the connection
        if (error.message.includes('409 Conflict')) {
          logInfo(`Conflict detected (attempt ${reconnectAttempts+1}/${MAX_RECONNECT_ATTEMPTS}).`);
          
          // Clear any previous timeout
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }
          
          // Stop polling, wait, then restart
          bot.stopPolling()
            .then(() => {
              // Exponential backoff for retries
              const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 60000);
              
              reconnectAttempts++;
              logInfo(`Will attempt to reconnect in ${delay/1000} seconds...`);
              
              reconnectTimeout = setTimeout(() => {
                if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                  logError('Maximum reconnection attempts reached. Exiting.');
                  gracefulShutdown('Too many reconnection attempts');
                  return;
                }
                
                initializeBot();
              }, delay);
            })
            .catch(err => {
              logError('Failed to stop polling:', err);
              gracefulShutdown('Failed to reset polling');
            });
        }
      });
      
      // Reset reconnect attempts when we successfully receive an update
      bot.on('message', () => {
        if (reconnectAttempts > 0) {
          logInfo('Connection stable, resetting reconnect attempts');
          reconnectAttempts = 0;
        }
      });
    }
    
    setUpMessageHandling();
    // Log when bot is started
    logInfo('Bot is running successfully');
  
  } catch (error) {
    logError('Error initializing bot', error);
    
    // If this is a startup error, try again after a delay
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 60000);
      logInfo(`Will retry initialization in ${delay/1000} seconds (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      
      reconnectTimeout = setTimeout(() => {
        initializeBot();
      }, delay);
    } else {
      logError('Failed to initialize bot after multiple attempts. Exiting.');
      gracefulShutdown('Failed to initialize');
    }
  }
}

/**
 * Set up message and command handling for the bot
 */
function setUpMessageHandling() {
  // Handle commands
  bot.onText(/\/(.+)/, (msg, match) => {
    // Define command outside try block with a default value
    let command = 'unknown';
    
    try {
      // Extract command
      command = match[1];
      
      // Get or create user
      const user = new User(
        msg.from.id, 
        msg.from.first_name,
        msg.from.last_name,
        msg.from.username,
        msg.from.language_code
      );
      
      // Log new user registration
      if (dataService.isNewUser(user.id)) {
        logInfo(`New user registered: ${user.getFullName()} (${user.id})`);
      }
      
      // Save or update user data
      dataService.saveUser(user);
      
      // Force a save to disk
      logInfo(`Forcing data save for user ${user.id}`);
      dataService.saveDataToFiles();
      
      // Process command
      commandHandler.handleCommand(bot, msg, command, user, dataService);
    } catch (error) {
      logError(`Error handling command "${command}" from user ${msg.from ? msg.from.id : 'unknown'}`, error);
      
      // Send error message if we have a valid chat ID
      try {
        if (msg.chat && msg.chat.id) {
          bot.sendMessage(msg.chat.id, messages.errors.general);
        } else {
          logError('Could not send error message to user - chat.id is missing');
        }
      } catch (sendError) {
        logError('Error sending error message', sendError);
      }
    }
  });

  // Handle messages that aren't commands
  bot.on('message', (msg) => {
    // Commands are handled separately
    if (msg.text && msg.text.startsWith('/')) return;
    
    // Save or update user
    const user = new User(
      msg.from.id,
      msg.from.first_name,
      msg.from.last_name,
      msg.from.username,
      msg.from.language_code
    );
    
    dataService.saveUser(user);
    
    try {
      // Get conversation state or create new one
      const conversation = dataService.getConversation(user.id);
      
      // Process message
      messageHandler.handleMessage(bot, msg, user, conversation);
      
      // Save updated conversation state
      dataService.saveConversation(user.id, conversation);
    } catch (error) {
      logError('Error in message handler', error);
      
      try {
        // Send generic error message
        const message = messages.errors.general;
        bot.sendMessage(msg.chat.id, message);
      } catch (sendError) {
        logError('Failed to send error message', sendError);
      }
    }
  });

  // Handle other errors
  bot.on('webhook_error', (error) => {
    logError('Webhook error', error);
  });
}

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

/**
 * Gracefully shut down the bot
 * @param {String} signal - The signal that triggered the shutdown
 */
async function gracefulShutdown(signal) {
  logInfo(`Shutting down bot (${signal})`);
  
  // Clear any intervals or timeouts
  if (dnsCheckInterval) {
    clearInterval(dnsCheckInterval);
    dnsCheckInterval = null;
  }
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  // Save all data to disk before exiting
  try {
    logInfo('Saving user and conversation data before shutdown...');
    // Stop auto-save mechanism first
    dataService.stopAutoSave();
    // Then manually trigger a final save
    dataService.saveDataToFiles();
    logInfo('Data saved successfully.');
  } catch (error) {
    logError('Error saving data during shutdown:', error);
  }
  
  // Remove our process lock
  processLock.removeLock();
  
  if (bot) {
    if (connectionMode === 'webhook') {
      // Remove webhook before shutting down
      try {
        await bot.deleteWebHook();
        logInfo('Webhook removed successfully');
      }
      catch (error) {
        logError('Error removing webhook', error);
      }
    } else {
      // Stop polling
      try {
        await bot.stopPolling();
        logInfo('Polling stopped successfully');
      }
      catch (error) {
        logError('Error stopping polling', error);
      }
    }
  }

  // Wait a bit to ensure data is flushed to disk
  setTimeout(() => {
    logInfo('Exiting process.');
    process.exit(0);
  }, 1000);
}

// Start the bot
initializeBot();

