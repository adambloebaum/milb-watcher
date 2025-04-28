# milb-watcher

A notification system that alerts you when a MiLB player enters a game.

## Features

- Monitors Minor League Baseball (MiLB) games for a specific player
- Automatically detects when a player enters a game
- Sends notifications via SMS text messages (via carrier email-to-SMS gateways)
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
   - Use the test scripts in the `test` directory to verify API and notification functionality

3. **Permission issues**:
   - Ensure the `milbwatcher` user owns the application directory:
     ```bash
     sudo chown -R milbwatcher:milbwatcher /opt/milb-watcher
     ```

4. **Disk space issues**:
   - Monitor log file sizes
   - Set up log rotation if needed

### Testing and Debugging

The application includes test scripts to help diagnose issues:

1. **API Testing**:
   ```bash
   cd /opt/milb-watcher/test
   node test-api.js
   ```
   This will test all MLB API endpoints used by the application.

2. **Notification Testing**:
   ```bash
   cd /opt/milb-watcher/test
   node test-notifications.js
   ```
   This will send test notifications to verify the SMS system is working.

Before running the tests:
1. Stop the service: `sudo systemctl stop milb-watcher`
2. Update the test configuration in the respective test files
3. Run the tests
4. Restart the service: `sudo systemctl start milb-watcher`

For more information about the test scripts, see the [test/README.md](test/README.md) file.

### Security Considerations

1. **File Permissions**:
   - Keep `config.js` readable only by the service user
   - Restrict access to the application directory

2. **Service User**:
   - Use a dedicated service user with minimal permissions
   - Don't run the service as root

## Configuration

### Main Configuration (config.js)

```javascript
module.exports = {
  // Player Config
  PLAYER_ID: '826168', // Your player ID
  PLAYER_NAME: 'John Smith', // Player's name for notifications
  
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
    }
  },
  
  // App Config
  CHECK_INTERVAL: 60000, // Check every minute (60000 ms)
  STOP_AFTER_ENTRY: true // Stop checking after player enters game
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
   - It checks if your player's team has any games scheduled for the current day
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

## Finding Player ID

- **Player ID**: Can be found in the player's MiLB.com profile URL
  - Example: `https://www.milb.com/player/john-smith-826168`
  - The ID is the number at the end: `826168`