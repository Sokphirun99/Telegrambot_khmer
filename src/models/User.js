/**
 * User model
 */
class User {
  /**
   * Create a new user
   * @param {Object} data - User data
   * @param {Number} data.id - Telegram user ID
   * @param {String} data.firstName - User's first name
   * @param {String} data.lastName - User's last name
   * @param {String} data.username - User's username
   */
  constructor(data) {
    this.id = data.id;
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.username = data.username || '';
    this.language = data.language || 'km';
    this.createdAt = data.createdAt || new Date();
    this.lastActive = data.lastActive || new Date();
  }

  /**
   * Get user's full name
   * @returns {String} User's full name
   */
  getFullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Convert Telegram user object to our User model
   * @param {Object} telegramUser - Telegram user object
   * @returns {User} User instance
   */
  static fromTelegramUser(telegramUser) {
    return new User({
      id: telegramUser.id,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      username: telegramUser.username,
      language: telegramUser.language_code === 'km' ? 'km' : 'km', // Default to Khmer
      createdAt: new Date(),
      lastActive: new Date()
    });
  }
}

module.exports = User;
