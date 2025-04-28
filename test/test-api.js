const fetch = require('node-fetch');
const moment = require('moment-timezone');

// Test configuration - you can modify these values
const TEST_CONFIG = {
    PLAYER_ID: '826168',  // Example player ID
    TEAM_ID: '436',       // Example team ID
    LEAGUE_LEVEL: '14'    // Class A
};

async function testScheduleAPI() {
    try {
        console.log('Testing Schedule API...');
        const today = moment().format('YYYY-MM-DD');
        const url = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=${TEST_CONFIG.LEAGUE_LEVEL}&date=${today}`;
        
        console.log(`Fetching: ${url}`);
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('\nSchedule API Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.dates && data.dates.length > 0) {
            console.log('\nFound games:');
            data.dates[0].games.forEach(game => {
                console.log(`Game ID: ${game.gamePk}`);
                console.log(`Teams: ${game.teams.away.team.name} @ ${game.teams.home.team.name}`);
                console.log(`Status: ${game.status.detailedState}`);
                console.log(`Time: ${moment(game.gameDate).format('YYYY-MM-DD HH:mm:ss')}`);
                console.log('---');
            });
        } else {
            console.log('No games found for today');
        }
    } catch (error) {
        console.error('Error testing Schedule API:', error);
    }
}

async function testPlayerAPI() {
    try {
        console.log('\nTesting Player API...');
        const url = `https://statsapi.mlb.com/api/v1/people/${TEST_CONFIG.PLAYER_ID}`;
        
        console.log(`Fetching: ${url}`);
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('\nPlayer API Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.people && data.people.length > 0) {
            const player = data.people[0];
            console.log('\nPlayer Details:');
            console.log(`Name: ${player.fullName}`);
            console.log(`Position: ${player.primaryPosition.abbreviation}`);
            console.log(`Team: ${player.currentTeam.name}`);
        }
    } catch (error) {
        console.error('Error testing Player API:', error);
    }
}

async function testGameAPI() {
    try {
        console.log('\nTesting Game API...');
        // First get a game ID from today's schedule
        const today = moment().format('YYYY-MM-DD');
        const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=${TEST_CONFIG.LEAGUE_LEVEL}&date=${today}`;
        const scheduleResponse = await fetch(scheduleUrl);
        const scheduleData = await scheduleResponse.json();
        
        if (scheduleData.dates && scheduleData.dates.length > 0 && scheduleData.dates[0].games.length > 0) {
            const gameId = scheduleData.dates[0].games[0].gamePk;
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
            console.log('No games found to test Game API');
        }
    } catch (error) {
        console.error('Error testing Game API:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('Starting MLB API Tests...\n');
    await testScheduleAPI();
    await testPlayerAPI();
    await testGameAPI();
    console.log('\nTests completed');
}

runAllTests(); 