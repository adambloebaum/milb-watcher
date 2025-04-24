// MiLB Player Watcher - Main Entry Point
const path = require('path');
const fs = require('fs');

// Check if all required files exist
const requiredFiles = [
  'config.js',
  'watcher.js',
  'carriers.js'  // Add the new carriers.js file to the requirements
];

let missingFiles = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error('Missing required files:', missingFiles.join(', '));
  console.error('Please make sure all required files are in the same directory.');
  process.exit(1);
}

// Import configuration
const config = require('./config');

// Validate configuration
if (!config.SMS_RECIPIENTS || config.SMS_RECIPIENTS.length === 0) {
  console.warn('No SMS recipients configured. No SMS notifications will be sent.');
}

if (!config.EMAIL_CONFIG || !config.EMAIL_CONFIG.auth || !config.EMAIL_CONFIG.auth.user || !config.EMAIL_CONFIG.auth.pass) {
  console.warn('Email configuration is incomplete. SMS notifications will be disabled.');
}

// Start the notification script
require('./watcher');