// MiLB Player Watcher - Main Entry Point
const path = require('path');
const fs = require('fs');
const http = require('http');

// Simple HTTP server to make the app compatible with Fly.io
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    // Get service status information
    const uptime = process.uptime();
    const status = {
      status: 'ok',
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      timestamp: new Date().toISOString()
    };
    
    res.end(JSON.stringify(status, null, 2));
  } else if (req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    // Get some basic stats about the watched player
    try {
      const config = require('./config');
      const stats = {
        watching: {
          player: config.PLAYER_NAME,
          playerId: config.PLAYER_ID,
          team: config.TEAM_ID
        },
        monitoring: {
          isActive: global.monitoringActive || false,
          checkInterval: `${config.CHECK_INTERVAL / 60000} minute(s)`,
          todaysGamesCount: global.scheduledGames ? global.scheduledGames.length : 0
        }
      };
      
      res.end(JSON.stringify(stats, null, 2));
    } catch (err) {
      res.end(JSON.stringify({ error: 'Could not load stats' }));
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT} - health check available at /health`);
});

// Make monitoring active status globally accessible
global.monitoringActive = false;
global.scheduledGames = [];

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

// Share the scheduled games with our HTTP endpoints
const watcher = require('./watcher');
if (watcher.scheduledGames) {
  global.scheduledGames = watcher.scheduledGames;
}

// Listen for monitoring status changes
if (typeof watcher.setMonitoringStatusCallback === 'function') {
  watcher.setMonitoringStatusCallback((isActive) => {
    global.monitoringActive = isActive;
  });
}

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
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