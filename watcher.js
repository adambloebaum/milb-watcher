// Main function to check for player and notify
async function checkAndNotify() {
    try {
      const timestamp = formatTime(new Date());
      // console.log(`[${timestamp}] Checking for player...`); // Reduce console spam
      
      // Reset player status at beginning of check if we're not already tracking them in a game
      if (!playerInGame) {
        playerInGame = false;
      }
      
      // Use scheduled games if available, otherwise fetch new data
      let games = scheduledGames.length > 0 ? 
        scheduledGames.filter(game => game.status === 'Live') : 
        await getTodaysGames();
        
      if (games.length === 0) {
        return; // Silent return to reduce console spam
      }
      
      // Check each game for the player
      for (const game of games) {
        if (game.status === 'Live') {
          const playerEntered = await checkPlayerInGame(game.id, game.link);
          
          if (playerEntered) {
            await sendNotification(game.id);
            
            // If configured to stop after entry, prepare to stop monitoring
            if (config.STOP_AFTER_ENTRY) {
              console.log("Player has entered the game. Will stop monitoring until tomorrow's check.");
            }
            
            // Save the entry info to a log file
            const entryInfo = {
              timestamp: new Date().toISOString(),
              localTimestamp: new Date().toLocaleString(),
              gameId: game.id,
              playerName: config.PLAYER_NAME,
              playerId: config.PLAYER_ID
            };
            
            // Create logs directory if it doesn't exist
            if (!fs.existsSync('./logs')) {
              fs.mkdirSync('./logs');
            }
            
            // Write to log file
            const logPath = path.join('./logs', `entry-log-${getTodayDateString()}.json`);
            let logs = [];
            
            // Read existing logs if file exists
            if (fs.existsSync(logPath)) {
              try {
                logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
              } catch (e) {
                console.error('Error reading log file:', e.message);
              }
            }
            
            // Add new entry and write to file
            logs.push(entryInfo);
            fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
          }
        } else {
          console.log(`Game ${game.id} not started yet (${game.detailedState || 'Preview'}). Will check later.`);
        }
      }
      
      if (!playerInGame) {
        console.log(`${config.PLAYER_NAME} has not entered any games yet. Will check again later.`);
      }
    } catch (error) {
      console.error('Error in check and notify process:', error.message);
    }
  }

// MiLB Player Game Entry Notification Script
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// Import configuration and carrier info
const config = require('./config');
const carriers = require('./carriers');

// Create logs directory if it doesn't exist
const logsDir = '/data/logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Set up daily log file for terminal output
const today = new Date();
const logFileName = `console-log-${getTodayDateString()}.log`;
const logFilePath = path.join(logsDir, logFileName);

// Create a write stream for the log file
const logFileStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Override console.log, console.error, etc. to write to both console and log file
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = function() {
  const timestamp = new Date().toISOString();
  const args = Array.from(arguments);
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  
  logFileStream.write(`[${timestamp}] ${message}\n`);
  originalConsoleLog.apply(console, arguments);
};

console.error = function() {
  const timestamp = new Date().toISOString();
  const args = Array.from(arguments);
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  
  logFileStream.write(`[${timestamp}] ERROR: ${message}\n`);
  originalConsoleError.apply(console, arguments);
};

console.warn = function() {
  const timestamp = new Date().toISOString();
  const args = Array.from(arguments);
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  
  logFileStream.write(`[${timestamp}] WARNING: ${message}\n`);
  originalConsoleWarn.apply(console, arguments);
};

// Function to clean up old log files (older than 30 days)
function cleanupOldLogs() {
  try {
    console.log("Checking for old log files to clean up...");
    
    const files = fs.readdirSync(logsDir);
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      
      // Skip if not a file
      if (!fs.statSync(filePath).isFile()) continue;
      
      // Check if it's a log file
      if (file.startsWith('console-log-') || file.startsWith('entry-log-')) {
        const stats = fs.statSync(filePath);
        
        // If file is older than 30 days, delete it
        if (stats.mtime < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} log files older than 30 days.`);
    } else {
      console.log("No old log files to clean up.");
    }
  } catch (error) {
    console.error("Error cleaning up old logs:", error.message);
  }
}

// Email transporter for SMS notifications
let emailTransporter = null;
if (config.EMAIL_CONFIG && config.EMAIL_CONFIG.auth && config.EMAIL_CONFIG.auth.user) {
  emailTransporter = nodemailer.createTransport(config.EMAIL_CONFIG);
}

// API endpoints
const MILB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const PLAYER_ENDPOINT = `${MILB_API_BASE}/people/${config.PLAYER_ID}?hydrate=currentTeam`;

// Track games we've already found the player in to avoid duplicate notifications
const notifiedGames = new Set();
// Track if player is currently in a game
let playerInGame = false;
// Track active monitoring tasks
let monitoringTask = null;
// Store scheduled games
let scheduledGames = [];
// Track if current day games are done
let todaysGamesCompleted = false;

// Get server's local time zone
const serverTimeZone = moment.tz.guess();
console.log(`Server time zone detected as: ${serverTimeZone}`);

// Function to convert UTC ISO date to server local time
function convertToServerTime(dateString) {
  return new Date(dateString);
}

// Function to format time for display
function formatTime(date) {
  return date.toLocaleTimeString();
}

// Function to get today's date in YYYY-MM-DD format
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Function to get today's date string for filenames (YYYY-MM-DD)
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Function to get player's current team and league level
async function getPlayerTeamInfo() {
  try {
    const response = await fetch(PLAYER_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Failed to fetch player data: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.people && data.people.length > 0) {
      const player = data.people[0];
      return {
        teamId: player.currentTeam?.id,
        teamName: player.currentTeam?.name,
        leagueLevel: player.currentTeam?.parentOrgId ? '14' : null // Default to Class A if in minors
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting player team info:', error.message);
    return null;
  }
}

// Function to check if there are games today and schedule monitoring
async function checkForGamesToday() {
  try {
    const now = new Date();
    console.log(`[${formatTime(now)}] Checking for games today...`);
    
    // Reset tracking variables for a new day
    playerInGame = false;
    notifiedGames.clear();
    todaysGamesCompleted = false;
    scheduledGames = [];
    
    // Get player's team info
    const playerInfo = await getPlayerTeamInfo();
    if (!playerInfo || !playerInfo.teamId) {
      console.log('Could not determine player\'s team. Will check again later.');
      return false;
    }
    
    // Get schedule for today
    const todayDate = getTodayDate();
    const response = await fetch(`${MILB_API_BASE}/schedule/games/?sportId=${playerInfo.leagueLevel}&date=${todayDate}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schedule: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if our team has a game today
    let teamHasGame = false;
    let games = [];
    
    if (data.dates && data.dates.length > 0) {
      for (const date of data.dates) {
        for (const game of date.games) {
          // Check if our team is playing
          if (game.teams.away.team.id.toString() === playerInfo.teamId.toString() || 
              game.teams.home.team.id.toString() === playerInfo.teamId.toString()) {
            teamHasGame = true;
            
            // Convert game time from UTC to server local time
            const gameDateTime = convertToServerTime(game.gameDate);
            
            games.push({
              id: game.gamePk,
              status: game.status.abstractGameState,
              detailedState: game.status.detailedState,
              link: game.link,
              startTime: gameDateTime,
              homeTeam: game.teams.home.team.name,
              awayTeam: game.teams.away.team.name,
              rawStartTime: game.gameDate
            });
          }
        }
      }
    }
    
    if (teamHasGame) {
      console.log(`Found ${games.length} games for ${playerInfo.teamName} today!`);
      
      // Sort games by start time
      games.sort((a, b) => a.startTime - b.startTime);
      
      // Store games globally
      scheduledGames = games;
      
      // Log game details
      games.forEach(game => {
        console.log(`Game: ${game.awayTeam} @ ${game.homeTeam}`);
        console.log(`Status: ${game.detailedState}`);
        console.log(`Start time: ${formatTime(game.startTime)} (server local time)`);
        console.log('---');
      });
      
      // Schedule monitoring to start at game time
      const firstGame = games[0];
      const nowMs = Date.now();
      const gameTimeMs = firstGame.startTime.getTime();
      const timeDiff = gameTimeMs - nowMs;
      
      if (timeDiff > 0) {
        console.log(`Will start monitoring at ${formatTime(firstGame.startTime)} - ${Math.round(timeDiff / 60000)} minutes from now`);
        
        // Schedule the monitoring to start at game time
        setTimeout(() => {
          console.log(`Starting game monitoring at ${formatTime(new Date())}...`);
          startMonitoring();
        }, timeDiff);
      } else {
        // Game is already in progress, begin monitoring now
        console.log(`Game already in progress. Starting monitoring now at ${formatTime(new Date())}.`);
        startMonitoring();
      }
      
      // Also set up a midnight timeout to stop everything if we're still running
      scheduleMidnightShutdown();
      
      return true;
    } else {
      console.log(`No games scheduled for ${playerInfo.teamName} today (${todayDate}).`);
      todaysGamesCompleted = true;
      return false;
    }
  } catch (error) {
    console.error("Error checking for games:", error.message);
    return false;
  }
}

// Function to schedule a shutdown at midnight
function scheduleMidnightShutdown() {
  // Calculate time until midnight server time
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 0);
  
  const timeUntilMidnight = midnight.getTime() - now.getTime();
  
  // Set a timeout to stop monitoring at midnight
  setTimeout(() => {
    console.log(`It's midnight. Stopping all monitoring until tomorrow's check.`);
    stopMonitoring();
    todaysGamesCompleted = true;
  }, timeUntilMidnight);
}

// Function to start the continuous monitoring
function startMonitoring() {
  if (monitoringTask) {
    console.log("Monitoring already in progress.");
    return;
  }
  
  console.log(`Starting continuous monitoring every ${config.CHECK_INTERVAL / 60000} minutes.`);
  
  // Initial check
  checkAndNotify();
  
  // Set up interval for regular checking
  monitoringTask = setInterval(() => {
    // Check if the game is over or if player has entered
    if (playerInGame && config.STOP_AFTER_ENTRY) {
      console.log(`Player has entered the game. Stopping monitoring until tomorrow's check.`);
      stopMonitoring();
      todaysGamesCompleted = true;
    } else {
      // Update game statuses before checking
      updateGameStatuses().then(() => {
        // Only check if we have live games
        const hasLiveGames = scheduledGames.some(game => game.status === 'Live');
        
        if (hasLiveGames) {
          checkAndNotify();
        } else {
          // Check if all games are finished
          const allGamesFinished = scheduledGames.every(game => 
            game.status === 'Final' || game.status === 'Completed' || game.status === 'Cancelled');
            
          if (allGamesFinished) {
            console.log("All games are finished. Stopping monitoring until tomorrow's check.");
            stopMonitoring();
            todaysGamesCompleted = true;
          }
        }
      });
    }
  }, config.CHECK_INTERVAL);
}

// Function to stop monitoring
function stopMonitoring() {
  if (monitoringTask) {
    clearInterval(monitoringTask);
    monitoringTask = null;
    console.log("Monitoring stopped.");
  }
}

// Function to update game statuses
async function updateGameStatuses() {
  try {
    // console.log("Updating game statuses..."); // Reduce console spam
    
    const updatedGames = [];
    
    for (const game of scheduledGames) {
      const response = await fetch(`${MILB_API_BASE}${game.link}`);
      
      if (response.ok) {
        const data = await response.json();
        const oldStatus = game.status;
        game.status = data.gameData.status.abstractGameState;
        game.detailedState = data.gameData.status.detailedState;
        
        // Only log if status changed
        if (oldStatus !== game.status) {
          console.log(`Game ${game.id} status changed: ${game.detailedState}`);
          
          if (game.status === 'Live' && oldStatus !== 'Live') {
            console.log(`Game ${game.id} is now live! Starting to check for player entry.`);
          }
          
          if (game.status === 'Final' && oldStatus !== 'Final') {
            console.log(`Game ${game.id} has ended.`);
          }
        }
      }
      
      updatedGames.push(game);
    }
    
    scheduledGames = updatedGames;
  } catch (error) {
    console.error("Error updating game statuses:", error.message);
  }
}

// Function to fetch schedule for today's games
async function getTodaysGames() {
  try {
    // Based on the MLB API documentation, we're using the correct endpoint for the league level
    const todayDate = getTodayDate();
    const response = await fetch(`${MILB_API_BASE}/schedule/games/?sportId=${config.LEAGUE_LEVEL}&date=${todayDate}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schedule: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter for games that are live or about to start
    const relevantGames = [];
    if (data.dates && data.dates.length > 0) {
      for (const date of data.dates) {
        for (const game of date.games) {
          // Filter for team if specified
          if (config.TEAM_ID === 'TEAM_ID_HERE' || 
              game.teams.away.team.id.toString() === config.TEAM_ID || 
              game.teams.home.team.id.toString() === config.TEAM_ID) {
            
            if (game.status.abstractGameState === 'Live' || 
                game.status.abstractGameState === 'Preview') {
              
              // Convert game time to server local time
              const gameDateTime = convertToServerTime(game.gameDate);
              
              relevantGames.push({
                id: game.gamePk,
                status: game.status.abstractGameState,
                detailedState: game.status.detailedState,
                link: game.link, // Store the API link for this game
                startTime: gameDateTime,
                rawStartTime: game.gameDate
              });
            }
          }
        }
      }
    }
    return relevantGames;
  } catch (error) {
    console.error('Error fetching games:', error.message);
    return [];
  }
}

// Function to check if player is in a specific game
async function checkPlayerInGame(gameId, gameLink) {
  try {
    // Skip games we've already found the player in
    if (notifiedGames.has(gameId)) {
      return false;
    }
    
    // First, try to use the direct boxscore endpoint
    const boxscoreUrl = `${MILB_API_BASE}${gameLink ? gameLink.replace(/\/$/, '') : `/game/${gameId}`}/boxscore`;
    const response = await fetch(boxscoreUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch game data: ${response.status}`);
    }
    
    const data = await response.json();
    const teams = [data.teams.home, data.teams.away];
    
    // Check if player is in the game (either as starter or entered as substitute)
    for (const team of teams) {
      // Check active players (already in the game)
      const activePlayers = Object.values(team.players || {});
      for (const player of activePlayers) {
        if (player.person && player.person.id && player.person.id.toString() === config.PLAYER_ID) {
          // Also check if player is in a batting position or has entered the game
          const hasEntered = player.gameStatus && player.gameStatus.isCurrentBatter || 
                             player.stats && player.stats.batting && 
                             (player.stats.batting.atBats > 0 || player.stats.batting.hits > 0 || 
                             player.stats.batting.baseOnBalls > 0);
                               
          if (!playerInGame && hasEntered) {
            // Player just entered the game
            playerInGame = true;
            notifiedGames.add(gameId);
            return true;
          }
          // Player was already in game or hasn't entered yet
          if (hasEntered) {
            playerInGame = true;
          }
          return false;
        }
      }
      
      // Check substitutions if available
      if (team.substitutions) {
        for (const sub of team.substitutions) {
          if (sub.incomingPlayer && sub.incomingPlayer.id && sub.incomingPlayer.id.toString() === config.PLAYER_ID) {
            if (!playerInGame) {
              // Player just entered the game
              playerInGame = true;
              notifiedGames.add(gameId);
              return true;
            }
            // Player was already in game
            playerInGame = true;
            return false;
          }
        }
      }
      
      // Also check bench players who might have entered the game
      const benchPlayers = team.bench || [];
      for (const player of benchPlayers) {
        if (player.id && player.id.toString() === config.PLAYER_ID) {
          // Check if there's any indication they've entered the game
          if (player.battingOrder || player.stats) {
            if (!playerInGame) {
              playerInGame = true;
              notifiedGames.add(gameId);
              return true;
            }
            playerInGame = true;
            return false;
          }
        }
      }
    }
    
    // Try to check the live feed as an alternative source of data
    try {
      const liveFeedUrl = `${MILB_API_BASE}${gameLink ? gameLink.replace(/\/$/, '') : `/game/${gameId}`}/feed/live`;
      const liveFeedResponse = await fetch(liveFeedUrl);
      
      if (liveFeedResponse.ok) {
        const liveFeedData = await liveFeedResponse.json();
        
        // Check if our player appears in any play events
        if (liveFeedData.plays && liveFeedData.plays.allPlays) {
          for (const play of liveFeedData.plays.allPlays) {
            // Check if our player is involved in any play
            if (play.matchup && 
                ((play.matchup.batter && play.matchup.batter.id.toString() === config.PLAYER_ID) || 
                 (play.matchup.pitcher && play.matchup.pitcher.id.toString() === config.PLAYER_ID))) {
              if (!playerInGame) {
                playerInGame = true;
                notifiedGames.add(gameId);
                return true;
              }
              playerInGame = true;
              return false;
            }
            
            // Check if player is mentioned in any play events
            if (play.playEvents) {
              for (const event of play.playEvents) {
                if (event.player && event.player.id && event.player.id.toString() === config.PLAYER_ID) {
                  if (!playerInGame) {
                    playerInGame = true;
                    notifiedGames.add(gameId);
                    return true;
                  }
                  playerInGame = true;
                  return false;
                }
              }
            }
          }
        }
      }
    } catch (liveFeedError) {
      console.error(`Error checking live feed for game ${gameId}:`, liveFeedError.message);
    }
    
    // Player not found in this game
    return false;
  } catch (error) {
    console.error(`Error checking player in game ${gameId}:`, error.message);
    return false;
  }
}

// Function to send a notification
async function sendNotification(gameId) {
  try {
    const timeNow = formatTime(new Date());
    console.log(`[${timeNow}] 🎉 ${config.PLAYER_NAME} has entered game ${gameId}!`);
    
    // Send SMS notifications via email-to-SMS if configured
    if (emailTransporter && config.SMS_RECIPIENTS && config.SMS_RECIPIENTS.length > 0) {
      console.log(`Sending SMS alerts to ${config.SMS_RECIPIENTS.length} recipients...`);
      
      // Find the game details
      const gameDetails = scheduledGames.find(game => game.id.toString() === gameId.toString());
      const gameInfo = gameDetails 
        ? `${gameDetails.awayTeam} @ ${gameDetails.homeTeam}`
        : `Game #${gameId}`;
      
      // Message body
      const messageBody = `${config.PLAYER_NAME} has entered the game! (${gameInfo})`;
      
      // Send email-to-SMS to each recipient
      const messagePromises = config.SMS_RECIPIENTS.map(recipient => {
        // Get the email-to-SMS address for this carrier
        const smsEmail = carriers.getEmailAddress(recipient.phoneNumber, recipient.carrier);
        
        // Send the email
        return emailTransporter.sendMail({
          from: config.EMAIL_CONFIG.from,
          to: smsEmail,
          subject: 'MiLB Alert',
          text: messageBody,
          // No HTML for SMS
        });
      });
      
      await Promise.all(messagePromises);
      console.log('All SMS notifications sent successfully!');
    } else if (config.SMS_RECIPIENTS && config.SMS_RECIPIENTS.length > 0) {
      console.log('⚠️ SMS notifications requested but email configuration not properly set up.');
    }
  } catch (error) {
    console.error('Error sending notifications:', error.message);
  }
}

// Setup daily check at 9 AM local server time
function setupDailyCheck() {
  // Schedule for 9 AM server time
  const cronSchedule = '0 9 * * *';
  
  // Schedule the daily morning check
  cron.schedule(cronSchedule, () => {
    console.log(`=== Running scheduled 9:00 AM check for games today (${formatTime(new Date())}) ===`);
    
    // If there are no games today or all games are done, todaysGamesCompleted will be true
    if (todaysGamesCompleted) {
      // Create a new log file for today if we're starting a new day
      // Close the current log file stream and create a new one
      if (logFileStream) {
        logFileStream.end();
      }
      
      const newLogFileName = `console-log-${getTodayDateString()}.log`;
      const newLogFilePath = path.join(logsDir, newLogFileName);
      logFileStream = fs.createWriteStream(newLogFilePath, { flags: 'a' });
      
      console.log(`Created new log file for today: ${newLogFileName}`);
      
      // Clean up old log files
      cleanupOldLogs();
      
      // Check for games
      checkForGamesToday();
    } else {
      console.log('Previous day games are still being processed. Skipping new check.');
    }
  });
  
  console.log(`Scheduled daily check set for 9:00 AM (server time: ${serverTimeZone})`);
  
  // Also schedule log cleanup to run daily at 1 AM
  cron.schedule('0 1 * * *', () => {
    console.log("Running scheduled cleanup of old log files...");
    cleanupOldLogs();
  });
  
  // Run initial log cleanup
  cleanupOldLogs();
  
  // Run initial check on startup
  checkForGamesToday();
}

// Main execution
console.log('=== Starting MiLB Player Entry Notification Service ===');
console.log(`Server running in time zone: ${serverTimeZone}`);
console.log(`Monitoring for player: ${config.PLAYER_NAME} (ID: ${config.PLAYER_ID})`);
console.log(`Team ID: ${config.TEAM_ID}`);
console.log(`League level: ${config.LEAGUE_LEVEL}`);
console.log(`Checking interval: every ${config.CHECK_INTERVAL / 60000} minute(s)`);
console.log(`All times will be displayed in server's local time.`);
console.log(`Console logs are being saved to: ${logFilePath}`);

// Process termination handling
process.on('SIGINT', () => {
  console.log('Process terminated. Closing log file.');
  if (logFileStream) {
    logFileStream.end();
  }
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('Process terminated. Closing log file.');
  if (logFileStream) {
    logFileStream.end();
  }
  process.exit();
});

// Set up the daily check at 9 AM
setupDailyCheck();

// Export the scheduled games and a callback to track monitoring status
let monitorStatusCallback = null;

// Function to set the monitoring status callback
function setMonitoringStatusCallback(callback) {
  monitorStatusCallback = callback;
  // Initialize with current status
  if (callback && typeof callback === 'function') {
    callback(monitoringTask !== null);
  }
}

// Update the monitor status when it changes
const originalStartMonitoring = startMonitoring;
startMonitoring = function() {
  originalStartMonitoring.apply(this, arguments);
  if (monitorStatusCallback && typeof monitorStatusCallback === 'function') {
    monitorStatusCallback(monitoringTask !== null);
  }
};

const originalStopMonitoring = stopMonitoring;
stopMonitoring = function() {
  originalStopMonitoring.apply(this, arguments);
  if (monitorStatusCallback && typeof monitorStatusCallback === 'function') {
    monitorStatusCallback(monitoringTask !== null);
  }
};

// Export the necessary variables and functions
module.exports = {
  scheduledGames,
  setMonitoringStatusCallback
};