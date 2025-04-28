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

## Server Setup

### Prerequisites

- A Linux server (Ubuntu/Debian recommended)
- Node.js (v12 or higher)
- npm
- Email account for sending SMS notifications
- Git (for deployment)

### Installation Steps

1. **Install Node.js and npm**:
   ```bash
   # For Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Create a service user** (recommended for security):
   ```bash
   sudo useradd -r -s /bin/false milbwatcher
   ```

3. **Clone the repository**:
   ```bash
   sudo mkdir -p /opt/milb-watcher
   sudo chown milbwatcher:milbwatcher /opt/milb-watcher
   sudo -u milbwatcher git clone https://github.com/yourusername/milb-watcher.git /opt/milb-watcher
   ```

4. **Install dependencies**:
   ```bash
   cd /opt/milb-watcher
   sudo -u milbwatcher npm install
   ```

5. **Configure the application**:
   ```bash
   sudo -u milbwatcher cp example_config.js config.js
   sudo -u milbwatcher nano config.js  # Edit with your settings
   ```

6. **Set up the systemd service**:
   ```bash
   # Copy the service file
   sudo cp milb-watcher.service /etc/systemd/system/
   
   # Edit the service file with correct paths
   sudo nano /etc/systemd/system/milb-watcher.service
   ```
   
   Update these lines in the service file:
   ```ini
   User=milbwatcher
   WorkingDirectory=/opt/milb-watcher
   ExecStart=/usr/bin/node /opt/milb-watcher/index.js
   ```

7. **Enable and start the service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable milb-watcher
   sudo systemctl start milb-watcher
   ```

8. **Verify the service is running**:
   ```bash
   sudo systemctl status milb-watcher
   ```

### Managing the Service

- **Start the service**: `sudo systemctl start milb-watcher`
- **Stop the service**: `sudo systemctl stop milb-watcher`
- **Restart the service**: `sudo systemctl restart milb-watcher`
- **Check service status**: `sudo systemctl status milb-watcher`
- **View service logs**: `sudo journalctl -u milb-watcher -f`

### Logging

The service logs to the system journal by default. You can view logs with:
```bash
# View all logs
sudo journalctl -u milb-watcher

# Follow logs in real-time
sudo journalctl -u milb-watcher -f

# View logs from today
sudo journalctl -u milb-watcher --since today
```

Application-specific logs are still written to the `logs` directory in the application folder.

### Updating the Application

1. **Stop the service**:
   ```bash
   sudo systemctl stop milb-watcher
   ```

2. **Update the code**:
   ```bash
   cd /opt/milb-watcher
   sudo -u milbwatcher git pull
   sudo -u milbwatcher npm install
   ```

3. **Restart the service**:
   ```bash
   sudo systemctl start milb-watcher
   ```

### Troubleshooting

1. **Service won't start**:
   - Check logs: `sudo journalctl -u milb-watcher`
   - Verify permissions: `sudo ls -la /opt/milb-watcher`
   - Check Node.js version: `node -v`

2. **No notifications**:
   - Verify email configuration in `config.js`
   - Check service logs for errors
   - Test email configuration manually

3. **Permission issues**:
   - Ensure the `milbwatcher` user owns the application directory:
     ```bash
     sudo chown -R milbwatcher:milbwatcher /opt/milb-watcher
     ```

4. **Disk space issues**:
   - Monitor log file sizes
   - Set up log rotation if needed

### Security Considerations

1. **File Permissions**:
   - Keep `config.js` readable only by the service user
   - Restrict access to the application directory

2. **Network Security**:
   - The service runs an HTTP server on port 8080 by default
   - Consider using a reverse proxy (nginx/apache) for production
   - Implement firewall rules to restrict access

3. **Service User**:
   - Use a dedicated service user with minimal permissions
   - Don't run the service as root

## Setup

### Prerequisites

- Node.js (v12 or higher)
- npm
- Email account for sending SMS notifications
- A server to run the service (Linux recommended)

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
   - Copy `example_config.js` to `config.js`
   - Update `config.js` with your player's information and email settings
   - Add SMS recipients with their carriers in `config.js`

4. Run the application:
```
npm start
```

### Running as a Service

#### Linux (systemd)

1. Create a service file at `/etc/systemd/system/milb-watcher.service`:
```ini
[Unit]
Description=MiLB Player Game Entry Notification Service
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/path/to/milb-watcher
ExecStart=/usr/bin/node /path/to/milb-watcher/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. Enable and start the service:
```bash
sudo systemctl enable milb-watcher.service
sudo systemctl start milb-watcher.service
```

3. Check status:
```bash
sudo systemctl status milb-watcher.service
```

#### Windows

1. Install the service using NSSM (Non-Sucking Service Manager):
```bash
nssm install milb-watcher "C:\Program Files\nodejs\node.exe" "C:\path\to\milb-watcher\index.js"
nssm set milb-watcher AppDirectory "C:\path\to\milb-watcher"
nssm set milb-watcher DisplayName "MiLB Watcher"
nssm set milb-watcher Description "Monitors MiLB games for player entry"
nssm start milb-watcher
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

### Log Management

- All console output is saved to daily log files in the `logs` directory
- Log files older than 30 days are automatically deleted
- Game entry events are stored in separate JSON log files

### Troubleshooting

- **Service not starting**: Check system logs for errors
- **No notifications**: Verify your email configuration in `config.js`
- **Wrong game times**: Ensure your server's system clock is correct
- **Permission issues**: Make sure the service user has proper permissions to the application directory

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