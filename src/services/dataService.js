/**
 * Data storage service
 * Simple in-memory storage for now, can be expanded to use a database later
 */

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
 * Save a user
 * @param {Object} user - The user object
 */
const saveUser = (user) => {
  dataStore.users.set(user.id, user);
};

/**
 * Get a conversation state
 * @param {Number} userId - The user ID
 * @returns {Object} The conversation state
 */
const getConversation = (userId) => {
  return dataStore.conversations.get(userId) || { state: 'idle', data: {} };
};

/**
 * Save a conversation state
 * @param {Number} userId - The user ID
 * @param {Object} conversation - The conversation state
 */
const saveConversation = (userId, conversation) => {
  dataStore.conversations.set(userId, conversation);
};

module.exports = {
  getUser,
  saveUser,
  getConversation,
  saveConversation
};
