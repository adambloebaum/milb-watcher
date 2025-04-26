// MiLB Player Notification Config

module.exports = {
    // Player Config
    PLAYER_ID: process.env.PLAYER_ID || 'PLAYER_ID_HERE', // Your player ID
    PLAYER_NAME: process.env.PLAYER_NAME || 'Player Name', // Player's name for notifications
    TEAM_ID: process.env.TEAM_ID || 'TEAM_ID_HERE', // Player's team ID
  
    // League Config
    LEAGUE_LEVEL: process.env.LEAGUE_LEVEL || '14', // Class A league level
    
    // Notification Config - Parsed from environment variable or empty array
    SMS_RECIPIENTS: process.env.SMS_RECIPIENTS ? JSON.parse(process.env.SMS_RECIPIENTS) : [],
    
    // Email Config for Sending SMS
    EMAIL_CONFIG: {
      service: process.env.EMAIL_SERVICE || 'gmail',               // Email service (gmail, outlook, etc.)
      auth: {
        user: process.env.EMAIL_USER || '', // Your email address
        pass: process.env.EMAIL_PASS || ''  // Your email password or app-specific password
      },
      from: process.env.EMAIL_FROM || 'MiLB Watcher <>' // Sender name and email
    },

    // Time Zone Config - Using server's local time
    USE_SERVER_TIMEZONE: true,  // Always use server's local time zone for all times
    
    // App Config
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL || '60000'), // Check every minute (60000 ms)
    STOP_AFTER_ENTRY: process.env.STOP_AFTER_ENTRY !== 'false', // Stop checking after player enters game
    CHECK_FOR_SCHEDULED_GAMES_ONLY: process.env.CHECK_FOR_SCHEDULED_GAMES_ONLY !== 'false' // Only run when there are scheduled games
  };