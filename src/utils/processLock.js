#!/usr/bin/env node

/**
 * Creates a process lock file to prevent multiple bot instances
 * from running simultaneously.
 */

const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(__dirname, '.bot.lock');
const PID_FILE = path.join(__dirname, '.bot.pid');

function checkLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      // Check if the process is still running
      if (fs.existsSync(PID_FILE)) {
        const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));
        
        try {
          // Check if the process is still running (sending signal 0 tests existence)
          process.kill(pid, 0);
          console.error(`Bot is already running with PID ${pid}`);
          return true;
        } catch (e) {
          // Process doesn't exist
          console.log(`Previous bot process (PID: ${pid}) is no longer running`);
          // Clean up stale lock files
          fs.unlinkSync(LOCK_FILE);
          fs.unlinkSync(PID_FILE);
          return false;
        }
      } else {
        // Lock file exists but no PID file, clean up
        fs.unlinkSync(LOCK_FILE);
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking lock:', error);
    return false;
  }
}

function createLock() {
  try {
    // Create lock file
    fs.writeFileSync(LOCK_FILE, new Date().toISOString());
    // Write current PID
    fs.writeFileSync(PID_FILE, process.pid.toString());
    console.log(`Created lock file for PID ${process.pid}`);
    
    // Set up cleanup handlers
    process.on('exit', removeLock);
    process.on('SIGINT', () => {
      removeLock();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      removeLock();
      process.exit(0);
    });
    
    return true;
  } catch (error) {
    console.error('Error creating lock:', error);
    return false;
  }
}

function removeLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
    console.log('Lock files removed');
  } catch (error) {
    console.error('Error removing lock:', error);
  }
}

module.exports = {
  checkLock,
  createLock,
  removeLock
};

// If script is run directly
if (require.main === module) {
  const isLocked = checkLock();
  console.log(`Bot lock status: ${isLocked ? 'Locked' : 'Unlocked'}`);
}
