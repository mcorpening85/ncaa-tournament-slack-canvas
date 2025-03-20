/**
 * Service for handling sports data fetching and processing
 */
const axios = require('axios');

/**
 * Fetch NCAA tournament games from sports API
 * @returns {Promise<Array>} List of games with details
 */
async function fetchNcaaGames() {
  try {
    // This would use a real sports API in production
    // For example: SportRadar, ESPN API, or another sports data provider
    const response = await axios.get(`https://api.sportsdata.io/v3/cbb/scores/json/Tournament/2025`, {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.SPORTS_API_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching NCAA games:', error.message);
    // Return mock data for development or when API fails
    return getMockTournamentData();
  }
}

/**
 * Calculate various tournament statistics
 * @param {Array} games List of all tournament games
 * @returns {Object} Various tournament statistics
 */
function calculateTournamentStats(games) {
  // Filter games to get relevant subsets
  const completedGames = games.filter(game => game.Status === 'Final');
  const inProgressGames = games.filter(game => game.Status === 'InProgress');
  const upcomingGames = games.filter(game => game.Status === 'Scheduled');
  
  // Calculate upsets (lower seed beating higher seed)
  const upsets = completedGames.filter(game => {
    return (game.AwayTeamSeed > game.HomeTeamSeed && game.AwayTeamScore > game.HomeTeamScore) || 
           (game.HomeTeamSeed > game.AwayTeamSeed && game.HomeTeamScore > game.AwayTeamScore);
  });
  
  // Calculate average points per game
  const totalPoints = completedGames.reduce((sum, game) => 
    sum + game.AwayTeamScore + game.HomeTeamScore, 0);
  const avgPointsPerGame = completedGames.length ? 
    Math.round((totalPoints / completedGames.length) * 10) / 10 : 0;
  
  // Calculate top scoring teams
  const teamScores = {};
  completedGames.forEach(game => {
    if (!teamScores[game.AwayTeam]) teamScores[game.AwayTeam] = { points: 0, games: 0 };
    if (!teamScores[game.HomeTeam]) teamScores[game.HomeTeam] = { points: 0, games: 0 };
    
    teamScores[game.AwayTeam].points += game.AwayTeamScore;
    teamScores[game.AwayTeam].games += 1;
    
    teamScores[game.HomeTeam].points += game.HomeTeamScore;
    teamScores[game.HomeTeam].games += 1;
  });
  
  // Calculate top scoring teams (average per game)
  const teamsWithAvg = Object.entries(teamScores)
    .map(([team, data]) => ({
      team,
      avgPoints: data.games ? Math.round((data.points / data.games) * 10) / 10 : 0,
      totalPoints: data.points,
      games: data.games
    }))
    .filter(team => team.games > 0)
    .sort((a, b) => b.avgPoints - a.avgPoints);
  
  // Get top 5 scoring teams
  const topScoringTeams = teamsWithAvg.slice(0, 5);
  
  // Calculate closest games
  const marginOfVictory = completedGames.map(game => ({
    awayTeam: game.AwayTeam,
    homeTeam: game.HomeTeam,
    awayScore: game.AwayTeamScore,
    homeScore: game.HomeTeamScore,
    margin: Math.abs(game.AwayTeamScore - game.HomeTeamScore),
    winner: game.AwayTeamScore > game.HomeTeamScore ? game.AwayTeam : game.HomeTeam,
    loser: game.AwayTeamScore > game.HomeTeamScore ? game.HomeTeam : game.AwayTeam
  }));
  
  const closestGames = [...marginOfVictory].sort((a, b) => a.margin - b.margin).slice(0, 5);
  
  // Return compiled stats
  return {
    totalGames: games.length,
    completedGames: completedGames.length,
    inProgressGames: inProgressGames.length,
    upcomingGames: upcomingGames.length,
    upsets: upsets.length,
    avgPointsPerGame,
    topScoringTeams,
    closestGames
  };
}

/**
 * Get mock tournament data for development purposes
 * @returns {Array} Mock tournament games
 */
function getMockTournamentData() {
  return [
    {
      GameID: 1001,
      Season: 2025,
      SeasonType: 3,
      Status: "Final",
      Day: "2025-03-19T00:00:00",
      DateTime: "2025-03-19T19:15:00",
      AwayTeam: "Virginia",
      HomeTeam: "Colorado",
      AwayTeamID: 100,
      HomeTeamID: 101,
      AwayTeamSeed: 9,
      HomeTeamSeed: 8,
      AwayTeamScore: 57,
      HomeTeamScore: 63,
      TimeRemainingMinutes: 0,
      TimeRemainingSeconds: 0,
      Period: "2H",
      IsClosed: true,
      Round: 1,
      Tournament: "NCAA"
    },
    {
      GameID: 1002,
      Season: 2025,
      SeasonType: 3,
      Status: "Final",
      Day: "2025-03-19T00:00:00",
      DateTime: "2025-03-19T12:15:00",
      AwayTeam: "Duquesne",
      HomeTeam: "BYU",
      AwayTeamID: 102,
      HomeTeamID: 103,
      AwayTeamSeed: 11,
      HomeTeamSeed: 6,
      AwayTeamScore: 71,
      HomeTeamScore: 69,
      TimeRemainingMinutes: 0,
      TimeRemainingSeconds: 0,
      Period: "2H",
      IsClosed: true,
      Round: 1,
      Tournament: "NCAA"
    },
    {
      GameID: 1003,
      Season: 2025,
      SeasonType: 3,
      Status: "InProgress",
      Day: "2025-03-20T00:00:00",
      DateTime: "2025-03-20T14:30:00",
      AwayTeam: "NC State",
      HomeTeam: "Texas Tech",
      AwayTeamID: 104,
      HomeTeamID: 105,
      AwayTeamSeed: 10,
      HomeTeamSeed: 7,
      AwayTeamScore: 45,
      HomeTeamScore: 42,
      TimeRemainingMinutes: 12,
      TimeRemainingSeconds: 34,
      Period: "2H",
      IsClosed: false,
      Round: 1,
      Tournament: "NCAA"
    },
    {
      GameID: 1004,
      Season: 2025,
      SeasonType: 3,
      Status: "Scheduled",
      Day: "2025-03-20T00:00:00",
      DateTime: "2025-03-20T19:20:00",
      AwayTeam: "Marquette",
      HomeTeam: "Western Kentucky",
      AwayTeamID: 106,
      HomeTeamID: 107,
      AwayTeamSeed: 2,
      HomeTeamSeed: 15,
      AwayTeamScore: 0,
      HomeTeamScore: 0,
      TimeRemainingMinutes: null,
      TimeRemainingSeconds: null,
      Period: null,
      IsClosed: false,
      Round: 1,
      Tournament: "NCAA"
    },
    {
      GameID: 1005,
      Season: 2025,
      SeasonType: 3,
      Status: "Scheduled",
      Day: "2025-03-20T00:00:00",
      DateTime: "2025-03-20T21:30:00",
      AwayTeam: "Kentucky",
      HomeTeam: "Oakland",
      AwayTeamID: 108,
      HomeTeamID: 109,
      AwayTeamSeed: 3,
      HomeTeamSeed: 14,
      AwayTeamScore: 0,
      HomeTeamScore: 0,
      TimeRemainingMinutes: null,
      TimeRemainingSeconds: null,
      Period: null,
      IsClosed: false,
      Round: 1,
      Tournament: "NCAA"
    }
  ];
}

module.exports = {
  fetchNcaaGames,
  calculateTournamentStats
};
