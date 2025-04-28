// MiLB Player Watcher - Main Entry Point
const path = require('path');
const fs = require('fs');

// Check if all required files exist
const requiredFiles = [
  'config.js',
  'watcher.js',
  'carriers.js'
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

// Import and initialize the watcher
const watcher = require('./watcher');

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit immediately, let the process manager handle it
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately, let the process manager handle it
});