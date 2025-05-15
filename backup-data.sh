#!/bin/bash
# Enhanced backup script for Khmer Telegram Bot data

# Configuration
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
# Config - update paths if needed
BACKUP_DIR="./backups"
DATA_DIR="./data"
RETENTION_DAYS=7

# Files to backup individually
BACKUP_FILES=("users.json" "conversations.json")

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Starting backup of Telegram bot data on $(date)..."

# Method 1: Archive entire data directory
echo "1. Creating tar archive of entire data directory..."
tar -czf "$BACKUP_DIR/bot_data_full_$DATE.tar.gz" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"

if [ $? -eq 0 ]; then
  echo "✅ Full backup completed: $BACKUP_DIR/bot_data_full_$DATE.tar.gz"
else
  echo "❌ Full backup failed!"
fi

# Method 2: Individual file backups with timestamp
echo "2. Creating individual file backups..."

# Create backup folder for today's individual files
DAILY_BACKUP_DIR="$BACKUP_DIR/individual_$DATE"
mkdir -p "$DAILY_BACKUP_DIR"

# Copy each file
for file in "${BACKUP_FILES[@]}"; do
  if [ -f "$DATA_DIR/$file" ]; then
    cp "$DATA_DIR/$file" "$DAILY_BACKUP_DIR/$file"
    echo "✅ Backed up $file"
  else
    echo "❌ File $file not found, skipping"
  fi
done

# Cleanup old backups
echo "Cleaning old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "bot_data_full_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -type d -name "individual_*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "bot_data_full_*.tar.gz" | wc -l)
echo "Current full backup count: $BACKUP_COUNT"

echo "Backup process completed successfully on $(date)."
