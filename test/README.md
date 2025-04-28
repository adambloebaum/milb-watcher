# MiLB Watcher Test Suite

This directory contains test scripts to verify the functionality of the MiLB Watcher application.

## Test Scripts

### test-api.js

Tests the MLB Stats API endpoints used by the application. This script verifies:
- Player information retrieval
- Team information lookup
- Game schedule checking
- Live game data access

#### Usage

1. Update the player ID in the test configuration:
```javascript
const TEST_CONFIG = {
    PLAYER_ID: '123456'  // Your player's ID
};
```

2. Run the test:
```bash
node test-api.js
```

#### Test Flow

1. **Player Information Test**
   - Fetches player details including current team
   - Verifies team information is available
   - Returns team ID and league level

2. **Schedule API Test**
   - Uses player's team ID to find today's games
   - Displays game details including:
     - Game ID
     - Teams playing
     - Game status
     - Start time

3. **Game API Test**
   - Finds a game for the player's team
   - Checks if the player is in the game
   - Displays player's position and stats if available

#### Expected Output

The script will output:
- Player details (name, position, team)
- Today's games for the player's team
- Game details including player participation

### test-notifications.js

Tests the notification system (SMS via email).

#### Usage

1. Configure your email settings in the script:
```javascript
const emailConfig = {
    service: 'gmail',               // Email service (gmail, outlook, etc.)
    auth: {
        user: 'your-email@gmail.com', // Your email address
        pass: 'your-app-password'     // Your email password or app-specific password
    }
};
```

2. Configure SMS recipients:
```javascript
const smsRecipients = [
    {
        phoneNumber: '1234567890', // Phone number without special characters
        carrier: 'verizon'         // Carrier name (att, tmobile, verizon, etc.)
    }
];
```

3. Run the test:
```bash
node test-notifications.js
```

#### Test Flow

1. **Email Transporter Test**
   - Verifies email configuration
   - Tests connection to email server

2. **Notification Test**
   - Sends test notifications to all configured recipients
   - Verifies successful delivery

#### Expected Output

The script will output:
- Email configuration test results
- Notification delivery status for each recipient

## Troubleshooting

### API Tests

If the API tests fail:

1. **Player Not Found**
   - Verify the player ID is correct
   - Check if the player is currently active
   - Try a different player ID

2. **No Games Found**
   - Check if the team has games scheduled
   - Verify the league level is correct
   - Try a different date

3. **API Errors**
   - Check your internet connection
   - Verify the API endpoints are accessible
   - Check for rate limiting

### Notification Tests

If notification tests fail:

1. **Email Configuration**
   - Verify email credentials
   - Check if app password is required
   - Verify email service settings

2. **SMS Delivery**
   - Check carrier email-to-SMS format
   - Verify phone number format
   - Check carrier restrictions

## Best Practices

1. **Test Configuration**
   - Use a test email account
   - Use a test phone number
   - Keep sensitive information secure

2. **Running Tests**
   - Run tests before deployment
   - Test with different player IDs
   - Verify all notification methods

3. **Error Handling**
   - Check error messages
   - Verify API responses
   - Test edge cases

## Running Tests in Production

When running tests on your production server:
1. Stop the milb-watcher service first:
   ```bash
   sudo systemctl stop milb-watcher
   ```
2. Run the tests
3. Restart the service:
   ```bash
   sudo systemctl start milb-watcher
   ```

## Adding New Tests

To add new test scripts:
1. Create a new file in the test directory
2. Follow the existing pattern of using async/await
3. Include proper error handling
4. Add documentation to this README
5. Use the existing test configuration pattern 