# File-Based Persistence for Khmer Telegram Bot

This document describes the implementation details for the file-based persistence solution used by the Khmer Telegram bot.

## Overview

The bot uses a simple file-based persistence mechanism that stores user data and conversation states in JSON files in the `data` directory. This ensures that user information and conversation states persist between bot restarts.

## Implementation Details

### File Structure

- **data/users.json**: Stores user information, including registration date, last activity, and preferences
- **data/conversations.json**: Stores conversation states, including current state and associated data

### Key Components

1. **dataService.js**: The main service handling data persistence
   - Provides in-memory storage with file persistence
   - Implements auto-save functionality
   - Handles loading data at startup

2. **User Model**: Represents a user with properties like ID, name, and preferences

3. **Conversation Model**: Manages conversation state and associated data

## How It Works

1. **Data Loading**:
   - On startup, the bot loads data from files into memory
   - File paths are configured in `botConfig.js`

2. **In-Memory Storage**:
   - Data is kept in memory for fast access using JavaScript Maps
   - `users` map stores user objects by user ID
   - `conversations` map stores conversation objects by user ID

3. **Data Saving**:
   - Data is automatically saved at configurable intervals (default: 5 minutes)
   - Data is saved on graceful shutdown (SIGINT, SIGTERM)
   - Data can be manually saved via `saveDataToFiles()`
   - Critical operations, like user registration, force immediate saves

## Configuration

The storage behavior can be configured in `config/botConfig.js`:

```javascript
storage: {
  dataDir: './data',        // Directory where data files are stored
  flushInterval: 300000     // Auto-save interval in milliseconds (5 minutes)
}
```

## Testing

Several test scripts are included to verify persistence functionality:

1. **test-file-access.js**: Tests basic file read/write operations
2. **test-force-save.js**: Tests adding a user and saving to disk
3. **test-get-user.js**: Tests retrieving a user from persistent storage
4. **test-conversation.js**: Tests conversation state persistence
5. **test-verify-persistence.js**: Verifies data persistence across restarts

## Backup Recommendations

1. **Regular Backups**:
   - Create a backup script that copies the data directory to a safe location
   - Use a cronjob to schedule regular backups

2. **Manual Backup Before Updates**:
   - Always back up the data directory before deploying updates

## Example Backup Script

```bash
#!/bin/bash
# Simple backup script for Khmer Telegram Bot data

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/path/to/backups"
DATA_DIR="/path/to/bot/data"

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/bot_data_$DATE.tar.gz" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"

# Keep only the last 7 backups
ls -t "$BACKUP_DIR/bot_data_"*.tar.gz | tail -n +8 | xargs -I {} rm {}

echo "Backup completed: $BACKUP_DIR/bot_data_$DATE.tar.gz"
```

## Troubleshooting

If persistence issues occur:

1. Check file permissions for the data directory
2. Verify the data files contain valid JSON
3. Check disk space
4. Review logs for any error messages
