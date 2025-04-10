// MiLB Player Watcher - Main Entry Point
const path = require('path');
const fs = require('fs');

// Check if all required files exist
const requiredFiles = [
  'config.js',
  'watcher.js'
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

// Import and merge configuration files
const mainConfig = require('./config');
let twilioConfig = {};

// Try to load Twilio config if it exists
try {
  if (fs.existsSync(path.join(__dirname, 'twilioConfig.js'))) {
    twilioConfig = require('./twilioConfig');
    console.log('Loaded Twilio configuration.');
  } else {
    console.log('No Twilio configuration found. SMS notifications will be disabled.');
  }
} catch (error) {
  console.error('Error loading Twilio configuration:', error.message);
}

// Merge configurations
global.config = { ...mainConfig, ...twilioConfig };

// Start the notification script
require('./watcher');