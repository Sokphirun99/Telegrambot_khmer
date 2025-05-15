#!/bin/bash
# Script to kill any running instances of the bot

# Find processes running node with our main file
echo "Looking for running bot instances..."

# Directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOCK_FILE="$DIR/.bot.lock"
PID_FILE="$DIR/.bot.pid"

# Check if lock file exists
if [ -f "$LOCK_FILE" ] && [ -f "$PID_FILE" ]; then
  echo "Found lock files."
  BOT_PID=$(cat "$PID_FILE")
  
  if ps -p "$BOT_PID" > /dev/null; then
    echo "Found running bot with PID: $BOT_PID"
    
    # Try to send SIGTERM first for graceful shutdown
    echo "Sending SIGTERM to process $BOT_PID..."
    kill "$BOT_PID"
    
    # Wait a bit and check if it's still running
    sleep 2
    if ps -p "$BOT_PID" > /dev/null; then
      echo "Process still running. Sending SIGKILL..."
      kill -9 "$BOT_PID"
    fi
    
    echo "Bot process terminated."
  else
    echo "Lock file exists but process $BOT_PID is not running."
    echo "Cleaning up stale lock files."
  fi
  
  # Clean up lock files
  rm -f "$LOCK_FILE" "$PID_FILE"
  echo "Lock files removed."
fi

# As a backup, also search for any node processes running the bot
bot_processes=$(ps aux | grep "[n]ode.*index.js" | awk '{print $2}')

if [ -n "$bot_processes" ]; then
  # Count the number of processes
  process_count=$(echo "$bot_processes" | wc -l)
  echo "Found $process_count additional running bot instance(s)."
  
  # Kill each process
  echo "$bot_processes" | while read -r pid; do
    echo "Killing process: $pid"
    kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
  done
  
  echo "All bot processes have been terminated."
else
  echo "No additional bot instances found."
fi

# Clean up any zombie Node.js processes
zombie_processes=$(ps aux | grep "[n]ode" | grep "defunct" | awk '{print $2}')
if [ -n "$zombie_processes" ]; then
  echo "Cleaning up zombie Node.js processes..."
  echo "$zombie_processes" | while read -r pid; do
    echo "Killing zombie process: $pid"
    kill -9 "$pid" 2>/dev/null
  done
fi

echo "Wait a few seconds before starting a new instance."

# Success
exit 0
