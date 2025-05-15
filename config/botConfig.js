/**
 * Configuration file for the bot
 */

module.exports = {
  // Default language settings
  defaultLanguage: 'km', // Khmer
  
  // Available commands
  commands: {
    start: {
      description: 'Start the bot'
    },
    help: {
      description: 'Show help information'
    },
    info: {
      description: 'Show bot information'
    },
    settings: {
      description: 'Change bot settings'
    }
  },
  
  // Response messages
  messages: {
    welcome: 'សូមស្វាគមន៍មកកាន់ Bot ភាសាខ្មែរ!',
    error: 'សូមអភ័យទោស មានបញ្ហាកើតឡើង។',
    commandNotFound: 'រកមិនឃើញពាក្យបញ្ជានេះទេ។ សូមប្រើ /help ដើម្បីមើលពាក្យបញ្ជាទាំងអស់។'
  }
};
