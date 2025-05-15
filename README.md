# Telegram Bot Khmer
A Telegram bot for Khmer language users.

## Setup
1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your bot token: `BOT_TOKEN=your_bot_token_here`
4. Run the bot: `npm start`

> **Note**: This project includes an override for the deprecated `punycode` module to address Node.js deprecation warnings.

## Features
- Khmer language support with proper Unicode handling
- Command handling in Khmer language (/start, /help, /info, etc.)
- Interactive custom keyboards with Khmer text
- User registration and management
- Conversation state management for multi-step interactions
- Comprehensive logging system

## Project Structure
- `src/` - Main source code
  - `handlers/` - Message and command handlers
  - `utils/` - Utility functions
  - `services/` - External service integrations
  - `models/` - Data models
- `config/` - Configuration files
- `data/` - Data storage
- `logs/` - Log files

## License
ISC
