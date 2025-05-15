/**
 * Telegram API service wrapper
 */

/**
 * Send a message with Khmer keyboard
 * @param {Object} bot - The bot instance
 * @param {Number} chatId - The chat ID to send the message to
 * @param {String} text - The message text
 * @param {Array} options - Keyboard options
 */
const sendMessageWithKeyboard = (bot, chatId, text, options = []) => {
  const keyboard = [];
  
  // Create rows with 2 buttons each
  for (let i = 0; i < options.length; i += 2) {
    const row = [];
    row.push(options[i]);
    if (options[i + 1]) row.push(options[i + 1]);
    keyboard.push(row);
  }
  
  const markup = {
    reply_markup: {
      keyboard,
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
  
  return bot.sendMessage(chatId, text, markup);
};

/**
 * Remove custom keyboard
 * @param {Object} bot - The bot instance
 * @param {Number} chatId - The chat ID
 * @param {String} text - Optional message to send with keyboard removal
 */
const removeKeyboard = (bot, chatId, text = '') => {
  return bot.sendMessage(chatId, text, {
    reply_markup: {
      remove_keyboard: true
    }
  });
};

module.exports = {
  sendMessageWithKeyboard,
  removeKeyboard
};
