/**
 * Data storage service
 * Provides in-memory storage with file persistence
 */

const fs = require('fs');
const path = require('path');
const { JsonDB, Config } = require('node-json-db');
const Conversation = require('../models/Conversation');
const botConfig = require('../../config/botConfig');
const { logError, logInfo } = require('../utils/logger');

// Initialize paths - use absolute paths for reliability
const DATA_DIR = botConfig.storage.dataDir ? 
                 path.resolve(botConfig.storage.dataDir) : 
                 path.join(__dirname, '../../data');
const USERS_DB_PATH = path.join(DATA_DIR, 'users.json');
const CONVERSATIONS_DB_PATH = path.join(DATA_DIR, 'conversations.json');

// Debug paths
logInfo('Using data paths:', {
  DATA_DIR,
  USERS_DB_PATH,
  CONVERSATIONS_DB_PATH
});

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  logInfo(`Created data directory: ${DATA_DIR}`);
}

// Initialize JsonDB instances 
// Parameters: (filepath, autosave, prettySave, separator)
const usersDB = new JsonDB(new Config(USERS_DB_PATH, true, true, '/'));
const conversationsDB = new JsonDB(new Config(CONVERSATIONS_DB_PATH, true, true, '/'));

// Make sure the basic structure exists
try {
  usersDB.getData('/users');
} catch (e) {
  // Create base users structure if it doesn't exist
  usersDB.push('/users', {});
  logInfo('Created initial users structure');
}

try {
  conversationsDB.getData('/conversations');
} catch (e) {
  // Create base conversations structure if it doesn't exist
  conversationsDB.push('/conversations', {});
  logInfo('Created initial conversations structure');
}

// In-memory data store (for faster access)
const dataStore = {
  users: new Map(),
  conversations: new Map()
};

// Load existing data from files on startup
function loadDataFromFiles() {
  try {
    // Load users
    try {
      if (fs.existsSync(USERS_DB_PATH)) {
        const data = fs.readFileSync(USERS_DB_PATH, 'utf8');
        const parsedData = JSON.parse(data);
        
        if (parsedData && parsedData.users && typeof parsedData.users === 'object') {
          Object.keys(parsedData.users).forEach(userId => {
            dataStore.users.set(parseInt(userId), parsedData.users[userId]);
          });
          logInfo(`Loaded ${dataStore.users.size} users from database`);
        } else {
          logInfo('User data file exists but has invalid format');
        }
      } else {
        logInfo('User data file does not exist. Will be created when saving.');
      }
    } catch (error) {
      logError('Error loading users from database:', error);
    }
    
    // Load conversations
    try {
      if (fs.existsSync(CONVERSATIONS_DB_PATH)) {
        const data = fs.readFileSync(CONVERSATIONS_DB_PATH, 'utf8');
        const parsedData = JSON.parse(data);
        
        if (parsedData && parsedData.conversations && typeof parsedData.conversations === 'object') {
          Object.keys(parsedData.conversations).forEach(userId => {
            const convData = parsedData.conversations[userId];
            const conversation = new Conversation(parseInt(userId));
            
            // Restore conversation properties
            if (convData.state) conversation.state = convData.state;
            if (convData.data) conversation.data = convData.data;
            if (convData.lastActivityTime) {
              conversation.lastActivityTime = new Date(convData.lastActivityTime);
              conversation.lastUpdated = new Date(convData.lastActivityTime);
            }
            
            dataStore.conversations.set(parseInt(userId), conversation);
          });
          logInfo(`Loaded ${dataStore.conversations.size} conversations from database`);
        } else {
          logInfo('Conversation data file exists but has invalid format');
        }
      } else {
        logInfo('Conversation data file does not exist. Will be created when saving.');
      }
    } catch (error) {
      logError('Error loading conversations from database:', error);
    }
  } catch (error) {
    logError('Error initializing data service:', error);
  }
}

// Save data to files
function saveDataToFiles() {
  logInfo('Starting to save data to files...');
  try {
    // Save users
    const usersData = {};
    dataStore.users.forEach((user, userId) => {
      usersData[userId] = user;
    });
    
    logInfo(`Preparing to save ${Object.keys(usersData).length} users`);
    
    // Write users directly to file
    const usersDataForFile = { users: usersData };
    fs.writeFileSync(USERS_DB_PATH, JSON.stringify(usersDataForFile, null, 4));
    logInfo(`Users saved to ${USERS_DB_PATH}`);
    
    // Save conversations
    const conversationsData = {};
    dataStore.conversations.forEach((conversation, userId) => {
      // Only save active conversations or those with valuable data
      if (!conversation.isExpired() || Object.keys(conversation.data).length > 0) {
        try {
          conversationsData[userId] = {
            userId: conversation.userId,
            state: conversation.state,
            data: conversation.data,
            lastActivityTime: conversation.lastActivityTime.toISOString()
          };
        } catch (error) {
          logError(`Error processing conversation for userId ${userId}:`, error);
          // Use fallback for timestamps
          conversationsData[userId] = {
            userId: conversation.userId,
            state: conversation.state,
            data: conversation.data,
            lastActivityTime: new Date().toISOString()
          };
        }
      }
    });
    
    logInfo(`Preparing to save ${Object.keys(conversationsData).length} conversations`);
    
    // Write conversations directly to file
    const conversationsDataForFile = { conversations: conversationsData };
    fs.writeFileSync(CONVERSATIONS_DB_PATH, JSON.stringify(conversationsDataForFile, null, 4));
    logInfo(`Conversations saved to ${CONVERSATIONS_DB_PATH}`);
    
    logInfo(`Saved ${dataStore.users.size} users and ${Object.keys(conversationsData).length} conversations to database`);
  } catch (error) {
    logError('Error saving data to files:', error);
  }
}

/**
 * Get a user by ID
 * @param {Number} userId - The user ID
 * @returns {Object|null} The user object or null if not found
 */
function getUser(userId) {
  return dataStore.users.get(userId) || null;
}

/**
 * Check if a user is new (not previously stored)
 * @param {Number} userId - The user ID to check
 * @returns {Boolean} True if the user is new, false otherwise
 */
function isNewUser(userId) {
  return !dataStore.users.has(userId);
}

/**
 * Save a user
 * @param {Object} user - The user object
 */
function saveUser(user) {
  if (!user || !user.id) {
    logError('Invalid user object provided to saveUser:', user);
    return;
  }
  
  logInfo(`Saving user with ID: ${user.id}, name: ${user.firstName || 'Unknown'}`);
  dataStore.users.set(user.id, user);
  
  // Force a full save to ensure data is persisted
  saveDataToFiles();
}

/**
 * Get or create conversation
 * @param {Number} userId - The user ID
 * @returns {Object} The conversation state
 */
function getConversation(userId) {
  if (!dataStore.conversations.has(userId)) {
    dataStore.conversations.set(userId, new Conversation(userId));
  }
  
  const conversation = dataStore.conversations.get(userId);
  
  // Reset expired conversations
  if (conversation.isExpired()) {
    conversation.reset();
  }
  
  return conversation;
}

/**
 * Save a conversation state
 * @param {Number} userId - The user ID
 * @param {Object} conversation - The conversation state
 */
function saveConversation(userId, conversation) {
  dataStore.conversations.set(userId, conversation);
}

// Set up automatic saving at intervals
let saveInterval = null;
function startAutoSave() {
  if (saveInterval === null) {
    const interval = botConfig.storage.flushInterval || 300000;
    saveInterval = setInterval(saveDataToFiles, interval);
    logInfo(`Auto-save started with interval: ${interval}ms`);
  }
}

// Stop auto-save on exit
function stopAutoSave() {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
    logInfo('Auto-save stopped');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logInfo('SIGINT signal received in dataService: Saving data before exit');
  stopAutoSave();
  saveDataToFiles();
});

process.on('SIGTERM', () => {
  logInfo('SIGTERM signal received in dataService: Saving data before exit');
  stopAutoSave();
  saveDataToFiles();
});

// Load data at startup
loadDataFromFiles();
// Start auto-save
startAutoSave();

// Debug function to get all conversations
function getDebugConversations() {
  const conversationsMap = {};
  dataStore.conversations.forEach((conversation, userId) => {
    conversationsMap[userId] = {
      userId: conversation.userId,
      state: conversation.state,
      data: conversation.data,
      lastActivityTime: conversation.lastActivityTime,
      isExpired: conversation.isExpired && conversation.isExpired()
    };
  });
  return conversationsMap;
}

// Export the public API
module.exports = {
  getUser,
  isNewUser,
  saveUser,
  getConversation,
  saveConversation,
  saveDataToFiles,
  stopAutoSave,
  getDebugConversations // Added for debugging
};