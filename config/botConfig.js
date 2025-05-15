/**
 * Configuration file for the bot
 */

module.exports = {
  // Default language settings
  defaultLanguage: 'km', // Khmer
  
  // Bot connection settings
  connection: {
    // Mode can be 'polling' or 'webhook'
    mode: process.env.BOT_MODE || 'polling',
    
    // Polling options
    polling: {
      // Default timeout: 30 seconds
      timeout: parseInt(process.env.POLLING_TIMEOUT) || 30,
      
      // Limit number of updates to fetch (1-100)
      limit: parseInt(process.env.POLLING_LIMIT) || 100,
      
      // Number of connection retries
      retryCount: parseInt(process.env.RETRY_COUNT) || 5,
      
      // Only get updates after startup
      allowedUpdates: ['message', 'callback_query', 'inline_query'],
      
      // Parameters to include with each request
      params: {
        // Will be overridden with a random session ID
        session: 'default',
        
        // Add timestamp to help distinguish between instances 
        ts: Date.now()
      }
    },
    
    // Webhook options (for production deployments)
    webhook: {
      // Server port (defaults to PORT environment variable or 3000)
      port: parseInt(process.env.PORT) || 3000,
      
      // Listen on all interfaces
      host: '0.0.0.0',
      
      // Webhook endpoint path
      path: process.env.WEBHOOK_PATH || '/webhook',
      
      // Full URL where Telegram should send updates
      url: process.env.WEBHOOK_URL || '',
      
      // Maximum number of connections (1-100)
      maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 40,
      
      // Only get these types of updates
      allowedUpdates: ['message', 'callback_query', 'inline_query']
    },
  },
  
  // Storage settings
  storage: {
    // Data directory
    dataDir: process.env.DATA_DIR || './data',
    
    // Default storage type
    type: 'file', // 'file', 'memory', or 'database'
    
    // Flush data interval in milliseconds (5 minutes)
    flushInterval: 300000,
  },
  
  // Logger settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || './logs',
  }
};
