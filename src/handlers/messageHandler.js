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
  
  // Import data service for persistence
  const dataService = require('../services/dataService');
  
  // Track user interaction
  user.recordInteraction('message');
  
  // Log incoming message
  console.log(`Received message from ${user.getFullName()} (${user.id}): ${text}`);
  
  // Import necessary services
  const languageService = require('../services/languageService');
  const newsService = require('../services/newsService');
  const telegramService = require('../services/telegramService');
  const stringUtils = require('../utils/stringUtils');
  
  // Handle based on conversation state
  switch (conversation.state) {
    case 'awaiting_name':
      // If we were waiting for a name
      try {
        // Use the setter method to update state properly
        conversation.setData('name', text);
        conversation.setState('idle');
        
        // Update user profile with the name if appropriate
        if (!user.firstName || user.firstName === '') {
          user.firstName = text;
          dataService.saveUser(user);
        }
        
        // Save the conversation state
        dataService.saveConversation(user.id, conversation);
        
        telegramService.sendSafeMarkdownMessage(
          bot,
          chatId, 
          `សូមអរគុណ ${text}\\! អ្នកបានចុះឈ្មោះជាមួយ Bot របស់យើងដោយជោគជ័យ។`
        );
      } catch (error) {
        console.error(`Error handling awaiting_name state: ${error.message}`);
        telegramService.sendSafeMarkdownMessage(bot, chatId, "សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសកើតឡើង។");
      }
      break;
      
    case 'awaiting_feedback':
      // If we were waiting for feedback
      try {
        // Store feedback with timestamp for better tracking
        conversation.setData('feedback', {
          text: text,
          timestamp: new Date().toISOString()
        });
        conversation.setState('idle');
        
        // Save conversation state to persist the feedback
        dataService.saveConversation(user.id, conversation);
        
        // Record the feedback interaction
        user.recordInteraction('feedback');
        dataService.saveUser(user);
        
        telegramService.sendSafeMarkdownMessage(
          bot,
          chatId,
          'សូមអរគុណសម្រាប់មតិរបស់អ្នក\\! យើងនឹងពិចារណាលើវា។'
        );
      } catch (error) {
        console.error(`Error handling feedback: ${error.message}`);
        telegramService.sendSafeMarkdownMessage(bot, chatId, "សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសកើតឡើង។");
      }
      break;
      
    case 'quiz':
      // Handle quiz answers
      try {
        const wordId = conversation.data.wordId;
        const result = languageService.checkAnswer(text, wordId);
        const word = languageService.getWordById(wordId);
        
        // Track quiz results for user statistics
        if (!user.statistics) {
          user.statistics = { quizzes: { correct: 0, incorrect: 0, total: 0 } };
        }
        
        if (result.correct) {
          // Increment correct answer count
          user.statistics.quizzes.correct = (user.statistics.quizzes.correct || 0) + 1;
          user.statistics.quizzes.total = (user.statistics.quizzes.total || 0) + 1;
          
          telegramService.sendSafeMarkdownMessage(
            bot,
            chatId,
            `🎉 ត្រូវហើយ\\! "${word.khmer}" មានន័យថា "${word.english}"`
          );
        } else {
          // Increment incorrect answer count
          user.statistics.quizzes.incorrect = (user.statistics.quizzes.incorrect || 0) + 1;
          user.statistics.quizzes.total = (user.statistics.quizzes.total || 0) + 1;
          
          telegramService.sendSafeMarkdownMessage(
            bot,
            chatId,
            `❌ មិនត្រូវទេ។ "${word.khmer}" មានន័យថា "${word.english}"`
          );
        }
        
        // Save updated user statistics
        dataService.saveUser(user);
        
        // Store quiz attempt in conversation history
        const quizAttempts = conversation.data.quizAttempts || [];
        quizAttempts.push({
          wordId: wordId,
          userAnswer: text,
          correct: result.correct,
          timestamp: new Date().toISOString()
        });
        conversation.setData('quizAttempts', quizAttempts);
        
        // Reset conversation state and save
        conversation.setState('idle');
        dataService.saveConversation(user.id, conversation);
      } catch (error) {
        console.error(`Error handling quiz: ${error.message}`);
        telegramService.sendSafeMarkdownMessage(bot, chatId, "សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសកើតឡើង។");
        conversation.setState('idle');
      }
      break;
      
    case 'news_category':
      // Handle news category selection
      const category = text.toLowerCase();
      const news = newsService.getLatestNews(3, category);
      
      if (news.length > 0) {
        let message = `📰 *ព័ត៌មានក្នុងប្រភេទ "${category}":*\n\n`;
        
        news.forEach(item => {
          message += `*${item.title}*\n`;
          message += `📝 ${item.summary}\n\n`;
        });
        
        telegramService.sendSafeMarkdownMessage(bot, chatId, message);
      } else {
        telegramService.sendSafeMarkdownMessage(bot, chatId, `រកមិនឃើញព័ត៌មានក្នុងប្រភេទ "${category}" ទេ។`);
      }
      
      // Reset conversation state
      conversation.state = 'idle';
      break;

    case 'awaiting_category':
      // Handle category selection for language learning
      const selectedCategory = text.toLowerCase().trim();
      const words = languageService.getWordsByCategory(selectedCategory);
      
      if (words && words.length > 0) {
        let message = `📚 *ពាក្យក្នុងប្រភេទ "${selectedCategory}":*\n\n`;
        
        words.forEach(word => {
          message += `• *${word.khmer}* (${word.latin}) - ${word.english}\n`;
        });
        
        telegramService.sendSafeMarkdownMessage(bot, chatId, message);
      } else {
        telegramService.sendSafeMarkdownMessage(
          bot,
          chatId,
          `រកមិនឃើញប្រភេទ "${selectedCategory}" ទេ។ សូមជ្រើសរើសប្រភេទមួយផ្សេងទៀត។`
        );
      }
      
      // Reset conversation state
      conversation.state = 'idle';
      break;
      
    default:
      // Process messages in default state
      
      // Handle keyboard button selections
      if (text === '📚 រៀនភាសា') {
        const word = languageService.getRandomWord();
        const message = `📝 *រៀនពាក្យថ្មី*\n\nពាក្យខ្មែរ: ${word.khmer}\nការបញ្ចេញសំឡេង: ${word.latin}\nអត្ថន័យជាអង់គ្លេស: ${word.english}`;
        telegramService.sendSafeMarkdownMessage(bot, chatId, message);
        return;
      }
      
      if (text === '📰 ព័ត៌មាន') {
        const news = newsService.getLatestNews();
        let message = '📰 *ព័ត៌មានថ្មីៗ:*\n\n';
        
        news.forEach(item => {
          message += `*${item.title}*\n`;
          message += `📝 ${item.summary}\n\n`;
        });
        
        telegramService.sendSafeMarkdownMessage(bot, chatId, message);
        return;
      }
      
      if (text === '📅 បុណ្យជាតិ') {
        const calendarService = require('../services/calendarService');
        const holidays = calendarService.getUpcomingHolidays();
        let message = '📅 *បុណ្យជាតិខ្មែរឆាប់ៗខាងមុខ:*\n\n';
        
        holidays.forEach(holiday => {
          message += `*${holiday.name}* (${holiday.nameEn})\n`;
          message += `📆 កាលបរិច្ឆេទ៖ ${holiday.approximateDate}\n`;
          message += `ℹ️ ${holiday.description}\n\n`;
        });
        
        telegramService.sendSafeMarkdownMessage(bot, chatId, message);
        return;
      }
      
      if (text === '❓ ជំនួយ') {
        const helpMessage = `
*បញ្ជីពាក្យបញ្ជាទាំងអស់៖*

📱 *មូលដ្ឋាន:*
/start - ចាប់ផ្តើម 
/help - បង្ហាញជំនួយ
/info - ព័ត៌មានអំពី Bot
/register - ចុះឈ្មោះជាមួយ Bot

📚 *រៀនភាសា:*
/learn - រៀនពាក្យថ្មីមួយ
/quiz - ធ្វើតេស្តភាសា
/dailyword - ពាក្យប្រចាំថ្ងៃ
/categories - ប្រភេទពាក្យ

📰 *ព័ត៌មាននិងវប្បធម៌:*
/news - ព័ត៌មានថ្មីៗ
/news_categories - ប្រភេទព័ត៌មាន
/holiday - បុណ្យជាតិខ្មែរ

💬 *ផ្សេងៗ:*
/feedback - ផ្ញើមតិកែលម្អ
`;
        
        telegramService.sendSafeMarkdownMessage(bot, chatId, helpMessage);
        return;
      }
      
      // Default behavior for other messages
      if (stringUtils.containsKhmer(text)) {
        // If message contains Khmer text
        telegramService.sendSafeMarkdownMessage(bot, chatId, `បានទទួលសារ: ${text}`);
      } else {
        // If message is not in Khmer, show some options in Khmer
        telegramService.sendMessageWithKeyboard(
          bot,
          chatId,
          'សូមជ្រើសរើសជម្រើសមួយ:',
          ['📚 រៀនភាសា', '📰 ព័ត៌មាន', '📅 បុណ្យជាតិ', '❓ ជំនួយ']
        );
      }
  }
};

module.exports = {
  handleMessage
};
