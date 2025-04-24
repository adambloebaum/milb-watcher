// Main function to check for player and notify
async function checkAndNotify() {
    try {
      console.log(`[${new Date().toLocaleTimeString()}] Checking for games...`);
      
      // Reset player status at beginning of check if we're not already tracking them in a game
      if (!playerInGame) {
        playerInGame = false;
      }
      
      // Use scheduled games if available, otherwise fetch new data
      let games = scheduledGames.length > 0 ? 
        scheduledGames.filter(game => game.status === 'Live') : 
        await getTodaysGames();
        
      if (games.length === 0) {
        console.log('No live games found to check.');
        return;
      }
      
      console.log(`Found ${games.length} relevant games for league level ${config.LEAGUE_LEVEL}`);
      
      // Check each game for the player
      for (const game of games) {
        if (game.status === 'Live') {
          console.log(`Checking game ${game.id} (${game.detailedState || 'Live'})...`);
          const playerEntered = await checkPlayerInGame(game.id, game.link);
          
          if (playerEntered) {
            await sendNotification(game.id);
            
            // If configured to stop after entry, prepare to stop monitoring
            if (config.STOP_AFTER_ENTRY) {
              console.log("Player has entered the game. Will stop monitoring after this check.");
            }
            
            // Save the entry info to a log file
            const entryInfo = {
              timestamp: new Date().toISOString(),
              gameId: game.id,
              playerName: config.PLAYER_NAME,
              playerId: config.PLAYER_ID
            };
            
            // Create logs directory if it doesn't exist
            if (!fs.existsSync('./logs')) {
              fs.mkdirSync('./logs');
            }
            
            // Write to log file
            const logPath = path.join('./logs', `entry-log-${getTodayDate()}.json`);
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
const notifier = require('node-notifier');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// Import configuration and carrier info
const config = require('./config');
const carriers = require('./carriers');

// Email transporter for SMS notifications
let emailTransporter = null;
if (config.EMAIL_CONFIG && config.EMAIL_CONFIG.auth && config.EMAIL_CONFIG.auth.user) {
  emailTransporter = nodemailer.createTransport(config.EMAIL_CONFIG);
}

// API endpoints
const MILB_API_BASE = 'https://statsapi.mlb.com/api/v1';
// sportId codes: 11=Triple-A, 12=Double-A, 13=Class A Adv, 14=Class A, 15=Class A Short, 16=Rookie, 5442=Dominican Summer League
const SCHEDULE_ENDPOINT = `${MILB_API_BASE}/schedule/games/?sportId=`;
const GAME_ENDPOINT = `${MILB_API_BASE}/game/`;
const PLAYER_ENDPOINT = `${MILB_API_BASE}/people/${config.PLAYER_ID}`;

// Track games we've already found the player in to avoid duplicate notifications
const notifiedGames = new Set();
// Track if player is currently in a game
let playerInGame = false;
// Track active monitoring tasks
let monitoringTask = null;
// Store scheduled games
let scheduledGames = [];

// Function to get today's date in YYYY-MM-DD format
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Function to check if there are games today and schedule monitoring
async function checkForGamesToday() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] Checking for games today...`);
    
    // Get schedule for today
    const response = await fetch(`${SCHEDULE_ENDPOINT}${config.LEAGUE_LEVEL}`);
    
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
          if (config.TEAM_ID && (
              game.teams.away.team.id.toString() === config.TEAM_ID || 
              game.teams.home.team.id.toString() === config.TEAM_ID)) {
            teamHasGame = true;
            games.push({
              id: game.gamePk,
              status: game.status.abstractGameState,
              detailedState: game.status.detailedState,
              link: game.link,
              startTime: new Date(game.gameDate),
              homeTeam: game.teams.home.team.name,
              awayTeam: game.teams.away.team.name
            });
          }
        }
      }
    }
    
    if (teamHasGame) {
      console.log(`Found ${games.length} games for your team today!`);
      
      // Sort games by start time
      games.sort((a, b) => a.startTime - b.startTime);
      
      // Store games globally
      scheduledGames = games;
      
      // Log game details
      games.forEach(game => {
        console.log(`Game: ${game.awayTeam} @ ${game.homeTeam}`);
        console.log(`Status: ${game.detailedState}`);
        console.log(`Start time: ${game.startTime.toLocaleTimeString()}`);
        console.log('---');
      });
      
      // Start monitoring 30 minutes before the first game
      const firstGame = games[0];
      const now = new Date();
      const timeDiff = firstGame.startTime.getTime() - now.getTime();
      const minutesUntilGame = Math.max(timeDiff / 60000, 0);
      
      if (minutesUntilGame > 30) {
        const monitorStartTime = new Date(firstGame.startTime.getTime() - 30 * 60000);
        console.log(`Will start monitoring at ${monitorStartTime.toLocaleTimeString()} (30 minutes before game time)`);
        
        // Schedule the monitoring to start before the game
        setTimeout(() => {
          console.log("Starting game monitoring...");
          startMonitoring();
        }, Math.max(0, monitorStartTime.getTime() - now.getTime()));
      } else {
        // Game is less than 30 minutes away or already started, begin monitoring now
        console.log("Game starting soon or already in progress. Starting monitoring now.");
        startMonitoring();
      }
      
      return true;
    } else {
      console.log("No games scheduled for your team today.");
      return false;
    }
  } catch (error) {
    console.error("Error checking for games:", error.message);
    return false;
  }
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
      console.log(`Player has entered the game. Stopping monitoring as configured.`);
      stopMonitoring();
    } else {
      // Only check if we have live games
      const hasLiveGames = scheduledGames.some(game => game.status === 'Live');
      if (hasLiveGames) {
        checkAndNotify();
      } else {
        // Check if all games are finished
        const allGamesFinished = scheduledGames.every(game => game.status === 'Final');
        if (allGamesFinished) {
          console.log("All games are finished. Stopping monitoring.");
          stopMonitoring();
        } else {
          // Update game statuses in case any have started
          updateGameStatuses();
        }
      }
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
    console.log("Updating game statuses...");
    
    const updatedGames = [];
    
    for (const game of scheduledGames) {
      const response = await fetch(`${MILB_API_BASE}${game.link}`);
      
      if (response.ok) {
        const data = await response.json();
        game.status = data.gameData.status.abstractGameState;
        game.detailedState = data.gameData.status.detailedState;
        
        console.log(`Game ${game.id}: ${game.detailedState}`);
        
        if (game.status === 'Live' && !game.wasLive) {
          console.log(`Game ${game.id} is now live! Starting to check for player entry.`);
          game.wasLive = true;
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
    const response = await fetch(`${SCHEDULE_ENDPOINT}${config.LEAGUE_LEVEL}`);
    
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
              relevantGames.push({
                id: game.gamePk,
                status: game.status.abstractGameState,
                detailedState: game.status.detailedState,
                link: game.link // Store the API link for this game
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
    // Local desktop notification
    notifier.notify({
      title: 'MiLB Player Alert',
      message: `${config.PLAYER_NAME} has entered the game!`,
      sound: true,
      wait: true
    });
    
    console.log(`[${new Date().toLocaleTimeString()}] 🎉 ${config.PLAYER_NAME} has entered game ${gameId}!`);
    
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

// Additional helper function to set up scheduled checks
function setupDailyChecks() {
  // Schedule the daily morning check
  cron.schedule('0 9 * * *', () => {
    console.log('Running scheduled morning check for games today...');
    checkForGamesToday();
  });
  
  console.log('Scheduled daily check set for 9:00 AM');
  
  // Run initial check
  checkForGamesToday();
}

// Main execution
console.log('🔍 Starting MiLB Player Entry Notification Service');
console.log(`Monitoring for player ID: ${config.PLAYER_ID}`);
console.log(`Team ID: ${config.TEAM_ID} (Fredericksburg Nationals)`);
console.log(`League level: ${config.LEAGUE_LEVEL} (Class A)`);

// Use cron for scheduling if configured
if (config.CHECK_FOR_SCHEDULED_GAMES_ONLY) {
  setupDailyChecks();
} else {
  // Start monitoring immediately
  startMonitoring();
}