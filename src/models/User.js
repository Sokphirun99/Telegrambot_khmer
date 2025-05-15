/**
 * User model
 */
class User {
  /**
   * Create a new user
   * @param {Number} id - Telegram user ID
   * @param {String} firstName - User's first name
   * @param {String} lastName - User's last name
   * @param {String} username - User's username
   * @param {String} languageCode - User's language code
   */
  constructor(id, firstName, lastName, username, languageCode) {
    this.id = id;
    this.firstName = firstName || '';
    this.lastName = lastName || '';
    this.username = username || '';
    this.languageCode = languageCode || 'km';
    this.registrationDate = new Date();
    this.lastActive = new Date();
    this.preferences = {};
    this.interactions = {
      commandCount: 0,
      messageCount: 0,
      lastCommand: null,
      lastInteraction: new Date()
    };
  }

  /**
   * Get user's full name
   * @returns {String} User's full name
   */
  getFullName() {
    return this.firstName + (this.lastName ? ' ' + this.lastName : '');
  }

  /**
   * Update user's activity
   * @returns {User} Updated user instance
   */
  updateActivity() {
    this.lastActive = new Date();
    this.interactions.lastInteraction = new Date();
    return this;
  }

  /**
   * Record a command interaction
   * @param {String} command - Command executed by the user
   * @returns {User} Updated user instance
   */
  recordCommand(command) {
    this.interactions.commandCount++;
    this.interactions.lastCommand = command;
    return this.updateActivity();
  }

  /**
   * Record a message interaction
   * @returns {User} Updated user instance
   */
  recordMessage() {
    this.interactions.messageCount++;
    return this.updateActivity();
  }

  /**
   * Set a user preference
   * @param {String} key - Preference key
   * @param {any} value - Preference value
   * @returns {User} Updated user instance
   */
  setPreference(key, value) {
    this.preferences[key] = value;
    return this;
  }

  /**
   * Convert Telegram user object to our User model
   * @param {Object} telegramUser - Telegram user object
   * @returns {User} User instance
   */
  static fromTelegramUser(telegramUser) {
    return new User(
      telegramUser.id,
      telegramUser.first_name,
      telegramUser.last_name,
      telegramUser.username,
      telegramUser.language_code
    );
  }
}

module.exports = User;
