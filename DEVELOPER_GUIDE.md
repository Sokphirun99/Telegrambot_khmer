# Khmer Telegram Bot - Developer Guide

This guide will help you understand how to work with this Telegram bot project for the Khmer language.

## Project Structure

```
telegram-bot-khmer/
├── .env                  # Environment variables (contains your bot token)
├── .gitignore           # Git ignore file
├── package.json         # Project dependencies and scripts
├── README.md            # Project documentation
├── config/              # Configuration files
│   └── botConfig.js     # Bot configuration
├── data/                # Data storage (for future use)
├── logs/                # Log files
└── src/                 # Source code
    ├── index.js         # Main application entry point
    ├── handlers/        # Message and command handlers
    │   ├── commandHandler.js  # Handles bot commands
    │   └── messageHandler.js  # Handles user messages
    ├── models/          # Data models
    │   └── User.js      # User model
    ├── services/        # External service integrations
    │   ├── dataService.js     # Data storage service
    │   └── telegramService.js # Telegram API wrapper
    └── utils/           # Utility functions
        ├── logger.js    # Logging utilities
        └── stringUtils.js     # String utilities for Khmer language
```

## How to Add New Commands

To add a new command to your bot:

1. Open `src/handlers/commandHandler.js`
2. Add a new case to the switch statement:

```javascript
case 'yourcommand':
  // Your command logic here
  bot.sendMessage(chatId, 'Your response here');
  break;
```

3. Update the help command to include your new command.

## How to Add New Message Handlers

To add new message handling logic:

1. Open `src/handlers/messageHandler.js`
2. Add your logic to the function
3. You can use conversation states to handle multi-step interactions

## Working with Conversation State

The bot implements a simple state machine for conversations:

1. Set conversation state:
```javascript
conversation.state = 'your_state_name';
dataService.saveConversation(user.id, conversation);
```

2. Handle responses based on state:
```javascript
switch (conversation.state) {
  case 'your_state_name':
    // Handle this state
    break;
}
```

## Khmer Language Support

The bot is designed to work with Khmer script. You can use the string utilities in `src/utils/stringUtils.js` to:

- Check if text contains Khmer script
- Get time-appropriate greetings in Khmer
- Format strings appropriately

## Keyboards and UI

The telegramService provides utilities for creating keyboards:

```javascript
telegramService.sendMessageWithKeyboard(
  bot,
  chatId,
  'Your message',
  ['Button 1', 'Button 2', 'Button 3', 'Button 4']
);
```

To remove keyboards:

```javascript
telegramService.removeKeyboard(bot, chatId, 'Optional message');
```

## Interacting with BotFather

To update your bot's information with BotFather:

1. Start a chat with BotFather on Telegram (@BotFather)
2. Use `/mybots` to select your bot
3. Use BotFather commands to:
   - Set description: `/setdescription`
   - Set about text: `/setabouttext`
   - Set profile picture: `/setuserpic`
   - Set commands: `/setcommands`

Example of command list to send to BotFather when using `/setcommands`:
```
start - ចាប់ផ្តើមការប្រើប្រាស់ Bot
help - បង្ហាញព័ត៌មានជំនួយ
info - ពត៌មានអំពី Bot
register - ចុះឈ្មោះជាមួយ Bot
feedback - ផ្ញើមតិកែលម្អ
keyboard - បង្ហាញក្តារចុច
hide - លាក់ក្តារចុច
```
