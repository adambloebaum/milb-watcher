const fetch = require('node-fetch');
const moment = require('moment-timezone');

// Test configuration - you can modify these values
const TEST_CONFIG = {
    PLAYER_ID: '571578',  // Example player ID
};

// API endpoints
const MILB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const PLAYER_ENDPOINT = `${MILB_API_BASE}/people/${TEST_CONFIG.PLAYER_ID}?hydrate=currentTeam`;

async function getPlayerTeamInfo() {
    try {
        console.log('\nFetching player information...');
        const response = await fetch(PLAYER_ENDPOINT);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('\nPlayer API Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.people && data.people.length > 0) {
            const player = data.people[0];
            console.log('\nPlayer Details:');
            console.log(`Name: ${player.fullName}`);
            console.log(`Position: ${player.primaryPosition.abbreviation}`);
            if (player.currentTeam) {
                console.log(`Team: ${player.currentTeam.name}`);
                console.log(`Team ID: ${player.currentTeam.id}`);
                
                // Log team details for debugging
                console.log('\nTeam Details:');
                console.log(JSON.stringify(player.currentTeam, null, 2));
                
                // For MLB teams, we know the league level is 1
                if (player.currentTeam.name.includes('Rangers') || 
                    player.currentTeam.name.includes('Angels') ||
                    player.currentTeam.name.includes('Dodgers') ||
                    player.currentTeam.name.includes('Yankees') ||
                    player.currentTeam.name.includes('Red Sox') ||
                    player.currentTeam.name.includes('Cubs') ||
                    player.currentTeam.name.includes('Cardinals') ||
                    player.currentTeam.name.includes('Giants') ||
                    player.currentTeam.name.includes('Mets') ||
                    player.currentTeam.name.includes('Phillies') ||
                    player.currentTeam.name.includes('Braves') ||
                    player.currentTeam.name.includes('Nationals') ||
                    player.currentTeam.name.includes('Marlins') ||
                    player.currentTeam.name.includes('Brewers') ||
                    player.currentTeam.name.includes('Pirates') ||
                    player.currentTeam.name.includes('Reds') ||
                    player.currentTeam.name.includes('Rockies') ||
                    player.currentTeam.name.includes('Diamondbacks') ||
                    player.currentTeam.name.includes('Padres') ||
                    player.currentTeam.name.includes('Mariners') ||
                    player.currentTeam.name.includes('Athletics') ||
                    player.currentTeam.name.includes('Astros') ||
                    player.currentTeam.name.includes('Royals') ||
                    player.currentTeam.name.includes('Twins') ||
                    player.currentTeam.name.includes('White Sox') ||
                    player.currentTeam.name.includes('Indians') ||
                    player.currentTeam.name.includes('Tigers') ||
                    player.currentTeam.name.includes('Blue Jays') ||
                    player.currentTeam.name.includes('Orioles') ||
                    player.currentTeam.name.includes('Rays')) {
                    console.log('MLB team detected, using league level 1');
                    return {
                        teamId: player.currentTeam.id,
                        teamName: player.currentTeam.name,
                        leagueLevel: '1'
                    };
                }
                
                // For minor league teams, try to determine league level
                if (player.currentTeam.sport && player.currentTeam.sport.id) {
                    const leagueLevel = player.currentTeam.sport.id.toString();
                    console.log(`Using sport ID as league level: ${leagueLevel}`);
                    return {
                        teamId: player.currentTeam.id,
                        teamName: player.currentTeam.name,
                        leagueLevel: leagueLevel
                    };
                }
                
                // If we can't determine the league level, use a default
                console.log('Using default league level 1');
                return {
                    teamId: player.currentTeam.id,
                    teamName: player.currentTeam.name,
                    leagueLevel: '1'
                };
            }
        }
        console.log('Could not determine league level');
        return null;
    } catch (error) {
        console.error('Error getting player team info:', error.message);
        return null;
    }
}

async function testScheduleAPI() {
    try {
        console.log('\nTesting Schedule API...');
        
        // First get player's team info to determine league level
        const playerInfo = await getPlayerTeamInfo();
        if (!playerInfo || !playerInfo.leagueLevel) {
            console.log('Could not determine player\'s league level. Skipping schedule test.');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const scheduleUrl = `${MILB_API_BASE}/schedule/games/?sportId=${playerInfo.leagueLevel}&date=${today}`;
        console.log(`Fetching: ${scheduleUrl}`);

        const response = await fetch(scheduleUrl);
        const data = await response.json();
        console.log('\nSchedule API Response:');
        console.log(JSON.stringify(data, null, 2));

        if (data.dates && data.dates.length > 0) {
            const games = data.dates[0].games;
            if (games && games.length > 0) {
                console.log(`\nFound ${games.length} games for today:`);
                games.forEach(game => {
                    console.log(`- ${game.teams.away.team.name} @ ${game.teams.home.team.name}`);
                    console.log(`  Game ID: ${game.gamePk}`);
                    console.log(`  Status: ${game.status.detailedState}`);
                    console.log(`  Start Time: ${game.gameDate}`);
                });
                return games;
            }
        }
        console.log('No games found for today');
        return [];
    } catch (error) {
        console.error('Error testing schedule API:', error);
        return [];
    }
}

async function testGameAPI(playerInfo) {
    try {
        console.log('\nTesting Game API...');
        
        // Get today's games first
        const games = await testScheduleAPI();
        if (games.length === 0) {
            console.log('No games found to test Game API');
            return;
        }

        // Find a game for our team
        const teamGame = games.find(game => 
            game.teams.away.team.id.toString() === playerInfo.teamId.toString() || 
            game.teams.home.team.id.toString() === playerInfo.teamId.toString()
        );

        if (!teamGame) {
            console.log('No games found for your team today');
            return;
        }

        const gameId = teamGame.gamePk;
        const url = `${MILB_API_BASE}${teamGame.link}`;
        console.log(`Fetching: ${url}`);

        const response = await fetch(url);
        const data = await response.json();
        
        console.log('\nGame API Response:');
        console.log(`Game ID: ${gameId}`);
        console.log(`Status: ${teamGame.status.detailedState}`);
        console.log(`Teams: ${teamGame.teams.away.team.name} @ ${teamGame.teams.home.team.name}`);
        
        // Check if our test player is in the game
        const boxscoreUrl = `${MILB_API_BASE}/game/${gameId}/boxscore`;
        const boxscoreResponse = await fetch(boxscoreUrl);
        const boxscoreData = await boxscoreResponse.json();
        
        console.log('\nChecking for player in game...');
        const teams = [boxscoreData.teams.home, boxscoreData.teams.away];
        let playerFound = false;
        
        for (const team of teams) {
            const players = Object.values(team.players || {});
            for (const player of players) {
                if (player.person && player.person.id.toString() === TEST_CONFIG.PLAYER_ID) {
                    playerFound = true;
                    console.log(`Player found in ${team.team.name} lineup`);
                    console.log(`Position: ${player.position.abbreviation}`);
                    if (player.stats) {
                        console.log('Stats:', player.stats);
                    }
                }
            }
        }
        
        if (!playerFound) {
            console.log('Player not found in game');
        }
    } catch (error) {
        console.error('Error testing Game API:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('Starting MLB API Tests...\n');
    
    // First get player and team info
    const playerInfo = await getPlayerTeamInfo();
    if (!playerInfo) {
        console.error('Could not get player information. Tests cannot continue.');
        return;
    }
    
    // Run the rest of the tests with player info
    await testScheduleAPI();
    await testGameAPI(playerInfo);
    console.log('\nTests completed');
}

runAllTests(); 