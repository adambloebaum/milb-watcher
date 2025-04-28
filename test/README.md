# MiLB Watcher Test Scripts

This directory contains scripts to test various components of the MiLB Watcher system.

## Test Scripts

### test-api.js

Tests the MLB API endpoints used by the application:
- Schedule API
- Player API
- Game API
- Boxscore API

Usage:
```bash
node test-api.js
```

Before running, modify the `TEST_CONFIG` object in the script with your test values:
```javascript
const TEST_CONFIG = {
    PLAYER_ID: '826168',  // Your player ID
    TEAM_ID: '436',       // Your team ID
    LEAGUE_LEVEL: '14'    // League level
};
```

### test-notifications.js

Tests the notification system by sending test SMS messages:
- Email transporter setup
- Carrier email-to-SMS gateway
- Message delivery

Usage:
```bash
node test-notifications.js
```

Before running, modify the `TEST_CONFIG` object in the script with your test values:
```javascript
const TEST_CONFIG = {
    EMAIL_CONFIG: {
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-app-password'
        },
        from: 'MiLB Watcher <your-email@gmail.com>'
    },
    SMS_RECIPIENTS: [
        {
            phoneNumber: '1234567890',
            carrier: 'verizon'
        }
    ]
};
```

## Troubleshooting

### API Tests

If the API tests fail:
1. Check your internet connection
2. Verify the MLB API is accessible
3. Confirm your player ID and team ID are correct
4. Check if there are any games scheduled for the test date

### Notification Tests

If the notification tests fail:
1. Verify your email configuration
2. Check if your email service allows sending from the specified address
3. Confirm the phone number and carrier are correct
4. Verify the carrier's email-to-SMS gateway is working

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