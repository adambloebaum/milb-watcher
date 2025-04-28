# MiLB Player Watcher

A Node.js application that monitors MiLB games and notifies you when a specific player enters the game.

## Features

- Monitors games for a specific player
- Automatically detects player's current team and league level
- Supports both MLB and MiLB teams
- Sends SMS notifications via email-to-SMS
- Detailed logging of game events
- Automatic game time detection and monitoring
- Configurable notification settings

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/milb-watcher.git
   cd milb-watcher
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the application:
   - Copy `config.example.js` to `config.js`
   - Update the configuration with your settings

## Configuration

The application uses a single configuration file (`config.js`) with the following options:

```javascript
module.exports = {
    // Player to monitor
    PLAYER_ID: '123456',  // MLB Stats API player ID
    PLAYER_NAME: 'Player Name',  // For display purposes

    // Notification settings
    EMAIL_CONFIG: {
        service: 'gmail',  // Email service (gmail, outlook, etc.)
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-app-password'
        }
    },
    SMS_RECIPIENTS: [
        {
            phoneNumber: '1234567890',
            carrier: 'verizon'  // att, tmobile, verizon, etc.
        }
    ],

    // Monitoring settings
    CHECK_INTERVAL: 60000,  // How often to check for player entry (in milliseconds)
    STOP_AFTER_ENTRY: true  // Whether to stop monitoring after player enters the game
};
```

## How It Works

1. **Player Detection**
   - Fetches player information from MLB Stats API
   - Automatically determines current team and league level
   - Supports both MLB and MiLB teams

2. **Game Monitoring**
   - Checks daily schedule for player's team
   - Monitors game status and player participation
   - Tracks multiple games per day if needed

3. **Notifications**
   - Sends SMS alerts via email-to-SMS
   - Configurable notification settings
   - Detailed game information in alerts

## Running the Application

1. Start the service:
   ```bash
   sudo systemctl start milb-watcher
   ```

2. Check the status:
   ```bash
   sudo systemctl status milb-watcher
   ```

3. View logs:
   ```bash
   tail -f logs/console-log-$(date +%Y-%m-%d).log
   ```

## Testing

The application includes a comprehensive test suite. See the [test/README.md](test/README.md) for details.

## Logging

The application maintains detailed logs in the `logs` directory:
- Daily console logs
- Player entry logs
- Error logs

Logs are automatically rotated and cleaned up after 30 days.

## Troubleshooting

### Common Issues

1. **Player Not Found**
   - Verify the player ID is correct
   - Check if the player is currently active
   - Try a different player ID

2. **No Games Found**
   - Check if the team has games scheduled
   - Verify the league level is correct
   - Check the logs for API errors

3. **Notification Issues**
   - Verify email configuration
   - Check carrier email-to-SMS format
   - Verify phone number format

### Checking Logs

Logs are stored in the `logs` directory:
- `console-log-YYYY-MM-DD.log`: Daily console output
- `entry-log-YYYY-MM-DD.json`: Player entry records
