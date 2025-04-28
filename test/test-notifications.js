const nodemailer = require('nodemailer');
const carriers = require('../carriers');

// Test configuration - modify these values
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
        // Add more test recipients as needed
    ]
};

async function testEmailTransporter() {
    try {
        console.log('Testing email transporter...');
        const transporter = nodemailer.createTransport(TEST_CONFIG.EMAIL_CONFIG);
        
        // Test the connection
        await transporter.verify();
        console.log('Email transporter verified successfully');
        return transporter;
    } catch (error) {
        console.error('Error testing email transporter:', error);
        throw error;
    }
}

async function sendTestNotification(transporter, recipient) {
    try {
        const smsEmail = carriers.getEmailAddress(recipient.phoneNumber, recipient.carrier);
        const message = {
            from: TEST_CONFIG.EMAIL_CONFIG.from,
            to: smsEmail,
            subject: 'MiLB Watcher Test',
            text: 'This is a test notification from MiLB Watcher. If you receive this, your notification system is working correctly!'
        };

        console.log(`Sending test notification to ${recipient.phoneNumber} (${recipient.carrier})...`);
        const info = await transporter.sendMail(message);
        console.log(`Test notification sent successfully: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`Error sending test notification to ${recipient.phoneNumber}:`, error);
        throw error;
    }
}

async function testAllRecipients() {
    try {
        const transporter = await testEmailTransporter();
        console.log('\nTesting all recipients...');
        
        for (const recipient of TEST_CONFIG.SMS_RECIPIENTS) {
            await sendTestNotification(transporter, recipient);
        }
        
        console.log('\nAll test notifications sent successfully');
    } catch (error) {
        console.error('Error in notification tests:', error);
    }
}

// Run the tests
testAllRecipients(); 