module.exports = {
    // Player Config
    PLAYER_ID: '826168', // Your player ID
    PLAYER_NAME: 'John Smith', // Player's name for notifications
    TEAM_ID: '436', // Player's team ID
  
    // League Config
    LEAGUE_LEVEL: '14', // Class A league level
    
    // Notification Config
    SMS_RECIPIENTS: [
      {
        phoneNumber: '1234567890', // Phone number without special characters
        carrier: 'verizon'         // Carrier name (att, tmobile, verizon, etc.)
      }
      // Add more recipients as needed
    ],
    
    // Email Config for Sending SMS
    EMAIL_CONFIG: {
      service: 'gmail',               // Email service (gmail, outlook, etc.)
      auth: {
        user: 'your-email@gmail.com', // Your email address
        pass: 'your-app-password'     // Your email password or app-specific password
      },
      from: 'MiLB Watcher <your-email@gmail.com>' // Sender name and email
    },
    
    // App Config
    CHECK_INTERVAL: 300000, // Check every 5 minutes (300000 ms)
    STOP_AFTER_ENTRY: true, // Stop checking after player enters game
    CHECK_FOR_SCHEDULED_GAMES_ONLY: true // Only run when games are scheduled
  };