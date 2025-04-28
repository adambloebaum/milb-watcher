const fetch = require('node-fetch');
const moment = require('moment-timezone');

// Test configuration - you can modify these values
const TEST_CONFIG = {
    PLAYER_ID: '123456',  // Example player ID
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
                return {
                    teamId: player.currentTeam.id,
                    teamName: player.currentTeam.name,
                    leagueLevel: player.currentTeam.parentOrgId ? '14' : null // Default to Class A if in minors
                };
            }
        }
        return null;
    } catch (error) {
        console.error('Error getting player team info:', error.message);
        return null;
    }
}

async function testScheduleAPI(playerInfo) {
    try {
        console.log('\nTesting Schedule API...');
        const today = moment().format('YYYY-MM-DD');
        const url = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=${playerInfo.leagueLevel}&date=${today}`;
        
        console.log(`Fetching: ${url}`);
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('\nSchedule API Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.dates && data.dates.length > 0) {
            console.log('\nFound games:');
            data.dates[0].games.forEach(game => {
                if (game.teams.away.team.id.toString() === playerInfo.teamId.toString() || 
                    game.teams.home.team.id.toString() === playerInfo.teamId.toString()) {
                    console.log(`Game ID: ${game.gamePk}`);
                    console.log(`Teams: ${game.teams.away.team.name} @ ${game.teams.home.team.name}`);
                    console.log(`Status: ${game.status.detailedState}`);
                    console.log(`Time: ${moment(game.gameDate).format('YYYY-MM-DD HH:mm:ss')}`);
                    console.log('---');
                }
            });
        } else {
            console.log('No games found for today');
        }
    } catch (error) {
        console.error('Error testing Schedule API:', error);
    }
}

async function testGameAPI(playerInfo) {
    try {
        console.log('\nTesting Game API...');
        // First get a game ID from today's schedule
        const today = moment().format('YYYY-MM-DD');
        const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=${playerInfo.leagueLevel}&date=${today}`;
        const scheduleResponse = await fetch(scheduleUrl);
        const scheduleData = await scheduleResponse.json();
        
        if (scheduleData.dates && scheduleData.dates.length > 0 && scheduleData.dates[0].games.length > 0) {
            // Find a game for our team
            const teamGame = scheduleData.dates[0].games.find(game => 
                game.teams.away.team.id.toString() === playerInfo.teamId.toString() || 
                game.teams.home.team.id.toString() === playerInfo.teamId.toString()
            );
            
            if (teamGame) {
                const gameId = teamGame.gamePk;
                const url = `https://statsapi.mlb.com/api/v1/game/${gameId}/feed/live`;
                
                console.log(`Fetching: ${url}`);
                const response = await fetch(url);
                const data = await response.json();
                
                console.log('\nGame API Response:');
                console.log(`Game ID: ${gameId}`);
                console.log(`Status: ${data.gameData.status.detailedState}`);
                console.log(`Teams: ${data.gameData.teams.away.name} @ ${data.gameData.teams.home.name}`);
                
                // Check if our test player is in the game
                const boxscoreUrl = `https://statsapi.mlb.com/api/v1/game/${gameId}/boxscore`;
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
            } else {
                console.log('No games found for your team today');
            }
        } else {
            console.log('No games found to test Game API');
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
    await testScheduleAPI(playerInfo);
    await testGameAPI(playerInfo);
    console.log('\nTests completed');
}

runAllTests(); 