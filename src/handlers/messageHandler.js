/**
 * Handle incoming messages
 * @param {Object} bot - The bot instance
 * @param {Object} msg - The message object
 * @param {Object} user - The user object
 * @param {Object} conversation - The conversation state
 */
const handleMessage = (bot, msg, user, conversation) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  
  // Log incoming message
  console.log(`Received message from ${user.getFullName()} (${user.id}): ${text}`);
  
  // Handle based on conversation state
  switch (conversation.state) {
    case 'awaiting_name':
      // If we were waiting for a name
      conversation.data.name = text;
      conversation.state = 'idle';
      
      bot.sendMessage(
        chatId, 
        `សូមអរគុណ ${text}! អ្នកបានចុះឈ្មោះជាមួយ Bot របស់យើងដោយជោគជ័យ។`
      );
      break;
      
    case 'awaiting_feedback':
      // If we were waiting for feedback
      conversation.data.feedback = text;
      conversation.state = 'idle';
      
      bot.sendMessage(
        chatId,
        'សូមអរគុណសម្រាប់មតិរបស់អ្នក! យើងនឹងពិចារណាលើវា។'
      );
      break;
      
    default:
      // Default behavior: echo the message
      const stringUtils = require('../utils/stringUtils');
      const telegramService = require('../services/telegramService');
      
      if (stringUtils.containsKhmer(text)) {
        // If message contains Khmer text
        bot.sendMessage(chatId, `បានទទួលសារ: ${text}`);
      } else {
        // If message is not in Khmer, show some options in Khmer
        telegramService.sendMessageWithKeyboard(
          bot,
          chatId,
          'សូមជ្រើសរើសជម្រើសមួយ:',
          ['ជំនួយ', 'ព័ត៌មាន', 'សួរសំណួរ', 'ផ្ញើមតិ']
        );
      }
  }
};

module.exports = {
  handleMessage
};
