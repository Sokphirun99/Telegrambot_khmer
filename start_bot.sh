#!/bin/bash
# Safe script to start the bot with error handling

# Directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Function to check if it's safe to start
check_safe_to_start() {
  # Check if lock file exists without using Node.js
  if [ -f "$DIR/.bot.lock" ]; then
    echo "Lock file exists, checking if bot is actually running..."
    
    if [ -f "$DIR/.bot.pid" ]; then
      BOT_PID=$(cat "$DIR/.bot.pid")
      
      if ps -p "$BOT_PID" > /dev/null; then
        echo "ERROR: Bot is already running with PID: $BOT_PID"
        echo "Use kill_bot_instances.sh to stop it first."
        return 1
      else
        echo "Stale lock file found. Cleaning up..."
        rm -f "$DIR/.bot.lock" "$DIR/.bot.pid"
      fi
    fi
  fi
  
  return 0
}

# First, kill any existing instances
echo "Checking for existing bot instances..."
./kill_bot_instances.sh

# Wait a few seconds
echo "Waiting for connections to close..."
sleep 3

# Make sure it's safe to start
check_safe_to_start || exit 1

# Set up environment variables based on mode
if [ "$1" == "webhook" ]; then
  echo "Starting bot in webhook mode..."
  export BOT_MODE=webhook
  # Check if WEBHOOK_URL is set
  if [ -z "$WEBHOOK_URL" ]; then
    echo "ERROR: WEBHOOK_URL environment variable must be set for webhook mode."
    exit 1
  fi
else
  echo "Starting bot in polling mode..."
  export BOT_MODE=polling
fi

# Start the bot
echo "Starting bot..."

# Run in background if requested
if [ "$2" == "background" ]; then
  echo "Running in background mode..."
  nohup npm start > bot.log 2>&1 &
  echo "Bot started with PID: $!"
  echo "Log output redirected to bot.log"
else
  # Run in foreground
  npm start
fi

echo "Done"
exit 0
