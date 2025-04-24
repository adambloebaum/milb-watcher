# milb-watcher

A notification system that alerts you when a MiLB player enters a game.

## Features

- Monitors Minor League Baseball (MiLB) games for a specific player
- Automatically detects when a player enters a game
- Sends notifications via:
  - Desktop notifications
  - SMS text messages (via carrier email-to-SMS gateways)
- Resource-efficient:
  - Only runs when games are scheduled
  - Checks periodically (not continuously)
  - Automatically stops after player enters a game (optional)
- Tracks game entry details in logs

## Setup

### Prerequisites

- Node.js (v12 or higher)
- npm
- Email account for sending SMS notifications

### Installation

1. Clone this repository:
```
git clone https://github.com/yourusername/milb-watcher.git
cd milb-watcher
```

2. Install dependencies:
```
npm install
```

3. Configure the app:
   - Update `config.js` with your player's information and email settings
   - Add SMS recipients with their carriers in `config.js`

4. Run the application:
```
npm start
```

## Configuration

### Main Configuration (config.js)

```javascript
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
```

### Supported Carriers

The application supports many common carriers including:
- AT&T (`att`)
- Verizon (`verizon`)
- T-Mobile (`tmobile`)
- Sprint (`sprint`)
- And many more

For a complete list of supported carriers, check the `carriers.js` file.

## Email-to-SMS Gateway Notes

This application uses email-to-SMS gateways provided by mobile carriers to send text message alerts. Some important notes:

1. For Gmail users, you'll need to use an "App Password" rather than your regular password. See [Google's App Password Guide](https://support.google.com/accounts/answer/185833) for details.

2. Some carriers may have message limits or may filter messages coming from email gateways.

3. Message delivery is dependent on carrier services and may experience delays.

## How It Works

1. The script checks once daily at 9 AM if there are games scheduled
2. If games are found, it monitors starting 30 minutes before game time
3. When the player enters a game, it sends notifications to all configured recipients
4. By default, it stops monitoring after detecting player's entry
5. Logs of game entries are stored in the `logs` directory

## MiLB League Level IDs

- 11 = Triple-A
- 12 = Double-A
- 13 = Class A Advanced
- 14 = Class A
- 15 = Class A Short Season
- 16 = Rookie
- 5442 = Dominican Summer League

## Finding Player and Team IDs

- **Player ID**: Can be found in the player's MiLB.com profile URL
  - Example: `https://www.milb.com/player/john-smith-826168`
  - The ID is the number at the end: `826168`

- **Team ID**: The Fredericksburg Nationals team ID is `436`
  - For other teams, check the team's MiLB.com URL or the API data

## License

MIT

## Acknowledgements

- MLB Stats API for providing the data
- The various carrier email-to-SMS gateways for enabling notifications