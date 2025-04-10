// Twilio configuration for SMS notifications
// See https://www.twilio.com/docs/sms/quickstart/node for setup instructions

module.exports = {
    // Your Twilio credentials - get these from your Twilio dashboard
    TWILIO_ACCOUNT_SID: 'your_account_sid_here',
    TWILIO_AUTH_TOKEN: 'your_auth_token_here',
    
    // Your Twilio phone number (must be purchased through Twilio)
    TWILIO_PHONE_NUMBER: '+15551234567'  // Replace with your Twilio number
  };