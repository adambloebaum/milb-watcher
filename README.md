# milb-watcher

A notification system that alerts you when a MiLB player enters a game. Perfect for friends and family who want to know when their favorite prospect takes the field!

## Features

- Monitors Minor League Baseball (MiLB) games for a specific player
- Automatically detects when a player enters a game
- Sends notifications via:
  - Desktop notifications
  - SMS text messages (via Twilio)
- Resource-efficient:
  - Only runs when games are scheduled
  - Checks periodically (not continuously)
  - Automatically stops after player enters a game (optional)
- Tracks game entry details in logs

## Setup

### Prerequisites

- Node.js (v12 or higher)
- npm
- Twilio account (optional, for SMS notifications)

### Installation

1. Clone this repository:
```
git clone https://github.com/yourusername/ProspectAlert.git
cd ProspectAlert
```

2. Install dependencies:
```
npm install node-fetch notifier node-cron twilio
```

3. Configure the app:
   - Create your own `config.js` with your player's information
   - For SMS notifications, create and configure `twilio.js`

4. Run the application:
```
node index.js
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
  LEAGUE_LEVEL: '12', // Class AA league level
  
  // Notification Config
  PHONE_NUMBERS: [
    '+15551234567'  // Add phone numbers to receive notifications
  ],
  
  // App Config
  CHECK_INTERVAL: 300000, // Check every 5 minutes (300000 ms)
  STOP_AFTER_ENTRY: true, // Stop checking after player enters game
  CHECK_FOR_SCHEDULED_GAMES_ONLY: true // Only run when games are scheduled
};
```

### Twilio Configuration (twilio.js)

For SMS notifications, create a Twilio account and configure:

```javascript
module.exports = {
  // Twilio credentials
  TWILIO_ACCOUNT_SID: 'your_account_sid',
  TWILIO_AUTH_TOKEN: 'your_auth_token',
  
  // Your Twilio phone number
  TWILIO_PHONE_NUMBER: '+15551234567'
};
```

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
- Twilio for SMS notification capabilities