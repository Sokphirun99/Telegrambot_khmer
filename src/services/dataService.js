/**
 * Data storage service
 * Simple in-memory storage for now, can be expanded to use a database later
 */

const Conversation = require('../models/Conversation');

// In-memory data store
const dataStore = {
  users: new Map(),
  conversations: new Map()
};

/**
 * Get a user by ID
 * @param {Number} userId - The user ID
 * @returns {Object|null} The user object or null if not found
 */
const getUser = (userId) => {
  return dataStore.users.get(userId) || null;
};

/**
 * Check if a user is new (not previously stored)
 * @param {Number} userId - The user ID to check
 * @returns {Boolean} True if the user is new, false otherwise
 */
const isNewUser = (userId) => {
  return !dataStore.users.has(userId);
};

/**
 * Save a user
 * @param {Object} user - The user object
 */
const saveUser = (user) => {
  dataStore.users.set(user.id, user);
};

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

module.exports = {
  getUser,
  isNewUser,
  saveUser,
  getConversation,
  saveConversation
};

