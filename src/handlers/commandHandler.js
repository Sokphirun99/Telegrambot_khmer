const messages = require('../utils/messages');
const { logInfo, logError } = require('../utils/logger');
const languageService = require('../services/languageService');
const calendarService = require('../services/calendarService');
const newsService = require('../services/newsService');
const telegramService = require('../services/telegramService');
const dataService = require('../services/dataService');

// Command handler functions
const commands = {
  start: (bot, msg, user) => {
    logInfo(`User ${user.getFullName()} (${user.id}) issued /start command`);
    
    // First send welcome message
    telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, messages.commands.start);
    
    // Then show main options as keyboard
    setTimeout(() => {
      telegramService.sendMessageWithKeyboard(
        bot,
        msg.chat.id,
        'សូមជ្រើសរើសជម្រើសមួយខាងក្រោម៖',
        ['📚 រៀនភាសា', '📰 ព័ត៌មាន', '📅 បុណ្យជាតិ', '❓ ជំនួយ']
      );
    }, 500);
  },
  
  help: (bot, msg, user) => {
    logInfo(`User ${user.getFullName()} (${user.id}) issued /help command`);
    
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
/holiday - បុណ្យជាតិខ្មែរ
/news_categories - ប្រភេទព័ត៌មាន

💬 *ផ្សេងៗ:*
/feedback - ផ្ញើមតិកែលម្អ
`;
    
    telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, helpMessage);
  },
  
  info: (bot, msg, user) => {
    logInfo(`User ${user.getFullName()} (${user.id}) issued /info command`);
    telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, messages.commands.info);
  },
  
  learn: (bot, msg, user) => {
    try {
      logInfo(`User ${user.getFullName()} (${user.id}) started language learning`);
      
      // Get a random word
      const word = languageService.getRandomWord();
      
      // Track this learning session in the user's history
      if (!user.learning) {
        user.learning = { wordsLearned: [] };
      }
      
      user.learning.wordsLearned = user.learning.wordsLearned || [];
      user.learning.wordsLearned.push({
        wordId: word.id,
        khmer: word.khmer,
        english: word.english,
        timestamp: new Date().toISOString()
      });
      
      // Keep only the most recent 50 words to avoid excessive data
      if (user.learning.wordsLearned.length > 50) {
        user.learning.wordsLearned = user.learning.wordsLearned.slice(-50);
      }
      
      // Save user data with the updated learning history
      dataService.saveUser(user);
      
      const message = `📝 *រៀនពាក្យថ្មី*\n\nពាក្យខ្មែរ: ${word.khmer}\nការបញ្ចេញសំឡេង: ${word.latin}\nអត្ថន័យជាអង់គ្លេស: ${word.english}`;
      
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, message);
    } catch (error) {
      logError(`Error in learn command: ${error.message}`);
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, "សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសកើតឡើង។");
    }
  },
  
  quiz: (bot, msg, user) => {
    try {
      logInfo(`User ${user.getFullName()} (${user.id}) started a language quiz`);
      
      // Initialize quiz statistics if they don't exist
      if (!user.statistics) {
        user.statistics = { quizzes: { started: 0, completed: 0, correct: 0, incorrect: 0 } };
      }
      
      // Update quiz statistics
      user.statistics.quizzes = user.statistics.quizzes || {};
      user.statistics.quizzes.started = (user.statistics.quizzes.started || 0) + 1;
      
      // Save user data with the updated statistics
      dataService.saveUser(user);
      
      // Start a quiz session
      const quiz = languageService.generateQuiz();
      const conversation = dataService.getConversation(user.id);
      
      // Store the quiz start time and quiz data
      conversation.setState('quiz');
      conversation.setData('wordId', quiz.wordId);
      conversation.setData('quizStartTime', new Date().toISOString());
      
      // Save conversation state
      dataService.saveConversation(user.id, conversation);
      
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, quiz.question);
    } catch (error) {
      logError(`Error in quiz command: ${error.message}`);
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, "សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសកើតឡើង។");
    }
  },
  
  holiday: (bot, msg, user) => {
    logInfo(`User ${user.getFullName()} (${user.id}) requested holiday information`);
    
    const holidays = calendarService.getUpcomingHolidays();
    let message = '📅 *បុណ្យជាតិខ្មែរឆាប់ៗខាងមុខ:*\n\n';
    
    holidays.forEach(holiday => {
      message += `*${holiday.name}* (${holiday.nameEn})\n`;
      message += `📆 កាលបរិច្ឆេទ៖ ${holiday.approximateDate}\n`;
      message += `ℹ️ ${holiday.description}\n\n`;
    });
    
    telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, message);
  },
  
  news: (bot, msg, user) => {
    try {
      logInfo(`User ${user.getFullName()} (${user.id}) requested news`);
      
      // Track news requests in user preferences
      if (!user.preferences) {
        user.preferences = {};
      }
      
      // Update news view count and last viewed timestamp
      user.preferences.newsViewCount = (user.preferences.newsViewCount || 0) + 1;
      user.preferences.lastNewsView = new Date().toISOString();
      
      // Save user preferences
      dataService.saveUser(user);
      
      const news = newsService.getLatestNews();
      let message = '📰 *ព័ត៌មានថ្មីៗ:*\n\n';
      
      news.forEach(item => {
        message += `*${item.title}*\n`;
        message += `📝 ${item.summary}\n`;
        message += `📅 កាលបរិច្ឆេទ៖ ${item.date}\n\n`;
      });
      
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, message);
    } catch (error) {
      logError(`Error in news command: ${error.message}`);
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, "សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសកើតឡើង។");
    }
  },
  
  news_categories: (bot, msg, user) => {
    try {
      logInfo(`User ${user.getFullName()} (${user.id}) requested news categories`);
      
      // Track user's interaction with categories
      if (!user.preferences) {
        user.preferences = {};
      }
      
      user.preferences.hasViewedCategories = true;
      user.preferences.lastCategoriesView = new Date().toISOString();
      
      // Save user preferences
      dataService.saveUser(user);
      
      const categories = newsService.getCategories();
      const conversation = dataService.getConversation(user.id);
      
      let message = '📰 *ប្រភេទព័ត៌មានដែលមាន៖*\n\n';
      categories.forEach(category => {
        message += `• ${category}\n`;
      });
      
      message += '\nសូមជ្រើសរើសប្រភេទដើម្បីមើលព័ត៌មានចុងក្រោយ។';
      
      // Store categories in the conversation so we can reference them later
      conversation.setData('availableCategories', categories);
      
      // Set conversation state to await category selection
      conversation.setState('news_category');
      dataService.saveConversation(user.id, conversation);
      
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, message);
    } catch (error) {
      logError(`Error in news_categories command: ${error.message}`);
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, "សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសកើតឡើង។");
    }
  },
  
  register: (bot, msg, user) => {
    try {
      logInfo(`User ${user.getFullName()} (${user.id}) started registration process`);
      
      // Record this interaction
      user.recordInteraction('command', { command: 'register' });
      dataService.saveUser(user);
      
      // Set up the conversation for registration
      const conversation = dataService.getConversation(user.id);
      conversation.setState('awaiting_name');
      
      // Save conversation state for persistence
      dataService.saveConversation(user.id, conversation);
      
      telegramService.sendSafeMarkdownMessage(
        bot,
        msg.chat.id,
        'សូមស្វាគមន៍\\! សូមប្រាប់យើងឈ្មោះអ្នក ដើម្បីយើងអាចទាក់ទងអ្នកបានត្រឹមត្រូវ៖'
      );
    } catch (error) {
      logError(`Error in register command: ${error.message}`);
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, "សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសកើតឡើង។");
    }
  },
  
  dailyword: (bot, msg, user) => {
    logInfo(`User ${user.getFullName()} (${user.id}) requested daily word`);
    
    const dailyWord = languageService.getDailyWord();
    const message = `📅 *ពាក្យប្រចាំថ្ងៃ*\n\n` +
                   `📝 *${dailyWord.khmer}*\n` +
                   `🔊 ការបញ្ចេញសំឡេង: ${dailyWord.latin}\n` +
                   `🇬🇧 អត្ថន័យ: ${dailyWord.english}\n` +
                   `🏷️ ប្រភេទ: ${dailyWord.category}`;
    
    telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, message);
  },
  
  categories: (bot, msg, user, dataService) => {
    logInfo(`User ${user.getFullName()} (${user.id}) requested word categories`);
    
    const categories = languageService.getCategories();
    const conversation = dataService.getConversation(user.id);
    
    let message = '*ប្រភេទពាក្យដែលមាន៖*\n\n';
    categories.forEach(category => {
      message += `• ${category}\n`;
    });
    
    message += '\nសូមជ្រើសរើសប្រភេទដើម្បីរៀនពាក្យ។';
    
    // Set conversation state to await category selection
    conversation.setState('awaiting_category');
    dataService.saveConversation(user.id, conversation);
    
    telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, message);
  },
  
  feedback: (bot, msg, user) => {
    try {
      logInfo(`User ${user.getFullName()} (${user.id}) started feedback process`);
      
      // Record this interaction
      user.recordInteraction('command', { command: 'feedback' });
      dataService.saveUser(user);
      
      // Initialize the feedback conversation
      const conversation = dataService.getConversation(user.id);
      
      // Track feedback sessions
      const feedbackHistory = conversation.data.feedbackHistory || [];
      conversation.setData('feedbackHistory', feedbackHistory);
      
      // Set state to await feedback
      conversation.setState('awaiting_feedback');
      dataService.saveConversation(user.id, conversation);
      
      telegramService.sendSafeMarkdownMessage(
        bot,
        msg.chat.id,
        'យើងចង់ឮមតិយោបល់របស់អ្នក។ សូមប្រាប់យើងថា តើអ្នកគិតយ៉ាងណាចំពោះ Bot របស់យើង៖'
      );
    } catch (error) {
      logError(`Error in feedback command: ${error.message}`);
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, "សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសកើតឡើង។");
    }
  },
};

// Main handler function
function handleCommand(bot, msg, command, user) {
  try {
    // Extract command name and parameters
    const parts = command.split(' ');
    const commandName = parts[0];
    const params = parts.slice(1);
    
    // Track command in user history
    user.recordInteraction('command', { command: commandName, params: params });
    
    // Persist the user data after recording this interaction
    dataService.saveUser(user);
    
    // Log the command being processed
    logInfo(`User ${user.getFullName()} (${user.id}) issued ${commandName} command`);
    
    // Check if command exists
    if (commands[commandName]) {
      commands[commandName](bot, msg, user, params);
    } else {
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, `ពាក្យបញ្ជា "${commandName}" មិនត្រូវបានស្គាល់។ សូមប្រើ /help`);
    }
  } catch (error) {
    logError(`Error in command handler for command "${command}"`, error);
    
    // Add safety check for msg.chat.id
    if (msg && msg.chat && msg.chat.id) {
      telegramService.sendSafeMarkdownMessage(bot, msg.chat.id, messages.errors.general);
    }
  }
}

module.exports = { 
  handleCommand,
  // Export individual commands for testing
  commands
};
