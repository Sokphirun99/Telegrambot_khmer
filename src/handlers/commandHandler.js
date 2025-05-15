/**
 * Handle bot commands
 * @param {Object} bot - The bot instance
 * @param {Object} msg - The message object
 * @param {String} command - The command without the leading slash
 * @param {Object} user - The user object
 */
const handleCommand = (bot, msg, command, user) => {
  const chatId = msg.chat.id;
  
  // Log the command
  console.log(`Received command /${command} from ${user.getFullName()} (${user.id})`);
  
  // Import required services
  const telegramService = require('../services/telegramService');
  const dataService = require('../services/dataService');
  const stringUtils = require('../utils/stringUtils');
  
  // Handle different commands
  switch (command) {
    case 'start':
      const greeting = stringUtils.getKhmerGreeting();
      
      // Send greeting with keyboard
      telegramService.sendMessageWithKeyboard(
        bot,
        chatId,
        `${greeting}\n\n` +
        `សួស្តី ${user.getFullName()}! អរគុណសម្រាប់ការប្រើប្រាស់ Bot របស់យើង។\n\n` +
        'សូមប្រើប្រាស់ពាក្យបញ្ជា /help ដើម្បីមើលជំនួយ។',
        ['ជំនួយ', 'ព័ត៌មាន', 'កំណត់', 'ទំនាក់ទំនង']
      );
      break;
      
    case 'help':
      bot.sendMessage(
        chatId,
        'ពាក្យបញ្ជាដែលអាចប្រើបាន:\n\n' +
        '/start - ចាប់ផ្តើមប្រើប្រាស់ Bot\n' +
        '/help - បង្ហាញជំនួយ\n' +
        '/info - ព័ត៌មានអំពី Bot\n' +
        '/register - ចុះឈ្មោះជាមួយ Bot\n' +
        '/feedback - ផ្ញើមតិកែលម្អ\n' +
        '/keyboard - បង្ហាញក្តារចុច\n' +
        '/hide - លាក់ក្តារចុច'
      );
      break;
      
    case 'info':
      bot.sendMessage(
        chatId,
        'Bot នេះត្រូវបានបង្កើតឡើងដើម្បីជួយសម្រួលដល់ការប្រើប្រាស់ភាសាខ្មែរលើ Telegram។'
      );
      break;
      
    case 'register':
      // Start registration process
      const conversation = dataService.getConversation(user.id);
      conversation.state = 'awaiting_name';
      dataService.saveConversation(user.id, conversation);
      
      bot.sendMessage(
        chatId,
        'សូមវាយឈ្មោះពេញរបស់អ្នក:'
      );
      break;
      
    case 'feedback':
      // Start feedback process
      const feedbackConversation = dataService.getConversation(user.id);
      feedbackConversation.state = 'awaiting_feedback';
      dataService.saveConversation(user.id, feedbackConversation);
      
      bot.sendMessage(
        chatId,
        'សូមវាយបញ្ចូលមតិកែលម្អរបស់អ្នកសម្រាប់ Bot របស់យើង:'
      );
      break;
      
    case 'keyboard':
      // Show keyboard with options
      telegramService.sendMessageWithKeyboard(
        bot,
        chatId,
        'សូមជ្រើសរើសជម្រើសមួយ:',
        ['ជំនួយ', 'ព័ត៌មាន', 'ការកំណត់', 'ទំនាក់ទំនង']
      );
      break;
      
    case 'hide':
      // Hide keyboard
      telegramService.removeKeyboard(
        bot,
        chatId,
        'បានលាក់ក្តារចុច។'
      );
      break;
      
    default:
      bot.sendMessage(
        chatId,
        `សូមទោស ពាក្យបញ្ជា /${command} មិនត្រូវបានស្គាល់ទេ។ សូមប្រើ /help ដើម្បីមើលពាក្យបញ្ជាដែលអាចប្រើបាន។`
      );
  }
};

module.exports = {
  handleCommand
};
