# milb-watcher

A notification system that alerts you when a MiLB player enters a game.

## Features

- Monitors Minor League Baseball (MiLB) games for a specific player
- Automatically detects when a player enters a game
- Sends notifications via:
  - Desktop notifications
  - SMS text messages (via carrier email-to-SMS gateways)
- Smart scheduling:
  - Only runs when games are scheduled
  - Checks periodically (not continuously)
  - Automatically stops after player enters a game
- Simple time handling:
  - All dates and times are in the server's local time zone
  - Game times from the API are automatically converted from UTC
  - No complicated time zone management needed
- Logging & Monitoring:
  - Tracks game entry details in logs
  - Logs all console output to daily log files 
  - Automatically cleans up log files older than 30 days
  - Provides HTTP endpoints for health checks and status
- Cloud-ready:
  - Easy deployment to Fly.io (see DEPLOYMENT.md)
  - Includes health check endpoints

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

### HTTP Endpoints

The application includes a simple HTTP server that provides:

- **Health check**: `GET /health` - Returns status information including uptime
- **Stats**: `GET /stats` - Returns information about the player being monitored and current monitoring status

By default, the server runs on port 8080, but you can change it by setting the `PORT` environment variable.

### Time Zone Handling

The script handles all time conversions automatically:

1. The MLB API returns all dates and times in UTC (Coordinated Universal Time)
2. The script automatically converts these to the server's local time zone
3. All times displayed in logs and console output use the server's local time

This approach ensures consistency regardless of team locations or travel schedules, and is particularly helpful when monitoring teams that play across multiple time zones.

### Running on Different Machines

#### Running as a Persistent Service

For the script to function as intended, it needs to run continuously so it can perform daily checks at 9 AM and monitor games when they occur. Here are setup instructions for different platforms:

##### Windows

1. **Using Task Scheduler:**
   - Open Task Scheduler
   - Create a new task that runs on system startup
   - Action: Start a program
   - Program/script: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "C:\path\to\milb-watcher\startup.ps1"`
   - Create a startup.ps1 file with:
     ```powershell
     cd C:\path\to\milb-watcher
     npm start
     ```

2. **Alternative using PM2 for Windows:**
   - Install PM2 globally: `npm install -g pm2 pm2-windows-startup`
   - Set up PM2 to start on boot: `pm2-startup install`
   - Start the script: `pm2 start index.js --name "milb-watcher"`
   - Save the process list: `pm2 save`

##### macOS

1. **Using LaunchAgents:**
   - Create a plist file at `~/Library/LaunchAgents/com.user.milbwatcher.plist`:
     ```xml
     <?xml version="1.0" encoding="UTF-8"?>
     <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
     <plist version="1.0">
     <dict>
         <key>Label</key>
         <string>com.user.milbwatcher</string>
         <key>ProgramArguments</key>
         <array>
             <string>/usr/local/bin/node</string>
             <string>/path/to/milb-watcher/index.js</string>
         </array>
         <key>RunAtLoad</key>
         <true/>
         <key>KeepAlive</key>
         <true/>
         <key>StandardOutPath</key>
         <string>/path/to/milb-watcher/logs/stdout.log</string>
         <key>StandardErrorPath</key>
         <string>/path/to/milb-watcher/logs/stderr.log</string>
     </dict>
     </plist>
     ```
   - Load the service: `launchctl load ~/Library/LaunchAgents/com.user.milbwatcher.plist`

2. **Using PM2:**
   - Install PM2 globally: `npm install -g pm2`
   - Start the script: `pm2 start index.js --name "milb-watcher"`
   - Set up PM2 to start on boot: `pm2 startup`
   - Save the process list: `pm2 save`

##### Linux

1. **Using systemd (recommended):**
   - Create a service file at `/etc/systemd/system/milb-watcher.service`:
     ```
     [Unit]
     Description=MiLB Watcher Service
     After=network.target
     
     [Service]
     Type=simple
     User=yourusername
     WorkingDirectory=/path/to/milb-watcher
     ExecStart=/usr/bin/node /path/to/milb-watcher/index.js
     Restart=on-failure
     
     [Install]
     WantedBy=multi-user.target
     ```
   - Enable and start the service:
     ```
     sudo systemctl enable milb-watcher.service
     sudo systemctl start milb-watcher.service
     ```
   - Check status with: `sudo systemctl status milb-watcher.service`

2. **Using PM2:**
   - Install PM2 globally: `npm install -g pm2`
   - Start the script: `pm2 start index.js --name "milb-watcher"`
   - Set up PM2 to start on boot: `pm2 startup`
   - Save the process list: `pm2 save`

#### Cloud Deployment

For deploying to Fly.io or other cloud providers, see the [DEPLOYMENT.md](DEPLOYMENT.md) guide.

#### Viewing Logs

- **Console output:** The script logs important events to the console and daily log files in the `logs` directory
- **Daily log files:** Console output is saved to `logs/console-log-YYYY-MM-DD.log`
- **Entry logs:** Game entry events are saved in `logs/entry-log-YYYY-MM-DD.json`
- **PM2 logs:** If using PM2, view logs with `pm2 logs milb-watcher`
- **System logs:** For systemd, use `journalctl -u milb-watcher.service`

#### Troubleshooting

- **Script not running:** Check if Node.js is properly installed with `node -v`
- **No notifications:** Verify your email configuration in `config.js`
- **Process dies unexpectedly:** If using PM2, it will automatically restart the process
- **Wrong game times:** Ensure your server's system clock is correct

### MLB API Documentation

Documentation for the MLB API can be found at the following link: https://github.com/brianhaferkamp/mlbapidata

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
  
  // Time Zone Config
  USE_SERVER_TIMEZONE: true,  // Always use server's local time zone
  
  // App Config
  CHECK_INTERVAL: 60000, // Check every minute (60000 ms)
  STOP_AFTER_ENTRY: true, // Stop checking after player enters game
  CHECK_FOR_SCHEDULED_GAMES_ONLY: true // Only run when there are scheduled games
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

1. For Gmail users, you may need to use an "App Password" rather than your regular password. See [Google's App Password Guide](https://support.google.com/accounts/answer/185833) for details.

2. Some carriers may have message limits or may filter messages coming from email gateways.

3. Message delivery is dependent on carrier services and may experience delays.

## How It Works

1. **Daily Schedule Check**:
   - The script runs automatically once per day at 9:00 AM (server's local time)
   - It checks if your team has any games scheduled for the current day
   - If no games are found, the script remains dormant until the next day's check

2. **Game Day Monitoring**:
   - When a game is found, the script schedules itself to start monitoring at the exact game time
   - Game times from the MLB API (in UTC) are converted to the server's local time
   - Once the game begins, the script checks every minute (or your configured interval) for player entry
   - If multiple games are scheduled in one day, the script monitors all of them

3. **When Player Enters Game**:
   - As soon as the player enters the game, the script sends notifications to all configured recipients
   - A notification is logged in the `logs` directory with a timestamp and game details
   - By default, the script then stops monitoring until the next day's check

4. **Automatic Shutdown**:
   - If the player doesn't enter the game, monitoring stops automatically when the game ends
   - If for any reason monitoring is still running at midnight, it will automatically stop
   - Each day is treated as a separate cycle with a clean slate

5. **Log Management**:
   - All console output is saved to daily log files in the `logs` directory
   - Log files older than 30 days are automatically deleted
   - Game entry events are stored in separate JSON log files

## MiLB League Level IDs

- 11 = Triple-A
- 12 = Double-A
- 13 = Class A Advanced
- 14 = Class A
- 15 = Class A Short Season (no longer exists)
- 16 = Rookie
- 5442 = Dominican Summer League

## Finding Player and Team IDs

- **Player ID**: Can be found in the player's MiLB.com profile URL
  - Example: `https://www.milb.com/player/john-smith-826168`
  - The ID is the number at the end: `826168`

- **Team ID**: Check the team's MiLB.com URL or the API data