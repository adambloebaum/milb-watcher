# MiLB Player Watcher Test Suite

This directory contains test scripts for the MiLB Player Watcher application.

## Test Files

### test-api.js
Tests the MLB Stats API integration, including:
- Player information retrieval
- Schedule checking
- Game status monitoring
- Player lineup checking

### test-notifications.js
Tests the notification system, including:
- Email/SMS configuration
- Notification delivery
- Error handling

## API Testing

The test suite verifies the following MLB Stats API endpoints:

1. **Player API**
   - Endpoint: `/api/v1/people/{playerId}?hydrate=currentTeam`
   - Retrieves player information including current team
   - Determines league level automatically based on team type

2. **Schedule API**
   - Endpoint: `/api/v1/schedule/games/?sportId={leagueLevel}&date={date}`
   - Fetches games for the player's current team
   - League level is determined automatically:
     - MLB teams: sportId = 1
     - Minor league teams: uses specific sport ID

3. **Game API**
   - Endpoint: `/api/v1/game/{gameId}/feed/live`
   - Monitors game status and player participation
   - Checks boxscore for player lineup information

## Configuration

The test suite uses the following configuration:

```javascript
const TEST_CONFIG = {
    PLAYER_ID: '571578',  // Example player ID
};
```

## Running Tests

1. Navigate to the test directory:
   ```bash
   cd test
   ```

2. Run the API tests:
   ```bash
   node test-api.js
   ```

3. Run the notification tests:
   ```bash
   node test-notifications.js
   ```

## Test Output

The test suite provides detailed output including:
- Player information
- Team details
- Game schedules
- Game status
- Player lineup information
- Notification delivery status

## Error Handling

The test suite includes comprehensive error handling for:
- API connection issues
- Invalid player IDs
- Missing team information
- Game status changes
- Notification delivery failures

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