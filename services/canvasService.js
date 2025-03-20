/**
 * Service for handling Slack Canvas operations
 */

/**
 * Check if a Canvas exists by ID
 * @param {Object} web Slack WebClient instance
 * @param {string} canvasId Canvas ID to check
 * @returns {Promise<boolean>} Whether the Canvas exists
 */
async function checkCanvas(web, canvasId) {
  try {
    if (!canvasId) return false;
    
    // Attempt to get the Canvas
    const result = await web.canvas.get({
      canvas_id: canvasId
    });
    
    return !!result.canvas;
  } catch (error) {
    console.error('Error checking Canvas:', error.message);
    return false;
  }
}

/**
 * Create a new tournament tracking Canvas
 * @param {Object} web Slack WebClient instance
 * @param {string} channelId Channel ID where to create the Canvas
 * @returns {Promise<Object>} Created Canvas details
 */
async function createTournamentCanvas(web, channelId) {
  try {
    // Create a new Canvas in the specified channel
    const result = await web.canvas.create({
      channel_id: channelId,
      title: "NCAA Tournament Tracker 2025",
      initial_blocks: [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "🏀 NCAA Tournament Tracker 2025 🏀",
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Loading tournament data..."
          }
        }
      ]
    });
    
    // Return the created Canvas
    return result;
  } catch (error) {
    console.error('Error creating Canvas:', error.message);
    throw error;
  }
}

/**
 * Update the Canvas with the basic structure
 * @param {Object} web Slack WebClient instance
 * @param {string} canvasId Canvas ID to update
 * @returns {Promise<Object>} Updated Canvas details
 */
async function updateCanvasStructure(web, canvasId) {
  try {
    // Update the Canvas with the tournament tracker sections
    const result = await web.canvas.update({
      canvas_id: canvasId,
      blocks: [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "🏀 NCAA Tournament Tracker 2025 🏀",
            "emoji": true
          }
        },
        {
          "type": "divider"
        },
        // Games in progress section
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "Games In Progress",
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Loading games..."
          }
        },
        {
          "type": "divider"
        },
        // Recent completed games section
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "Recently Completed Games",
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Loading completed games..."
          }
        },
        {
          "type": "divider"
        },
        // Upcoming games section
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "Upcoming Games",
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Loading upcoming games..."
          }
        },
        {
          "type": "divider"
        },
        // Tournament statistics section
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "Tournament Statistics",
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Loading statistics..."
          }
        },
        {
          "type": "divider"
        },
        // Footer section
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": "Last updated: Loading..."
            }
          ]
        }
      ]
    });
    
    return result;
  } catch (error) {
    console.error('Error updating Canvas structure:', error.message);
    throw error;
  }
}

/**
 * Format a game for display
 * @param {Object} game Game data
 * @param {boolean} isDetailed Whether to show detailed info
 * @returns {string} Formatted game string
 */
function formatGameForDisplay(game, isDetailed = false) {
  // Format game status
  let statusEmoji = '';
  let statusText = '';
  
  switch (game.Status) {
    case 'Final':
      statusEmoji = '🏁';
      statusText = 'FINAL';
      break;
    case 'InProgress':
      statusEmoji = '🏀';
      statusText = `${game.Period} ${game.TimeRemainingMinutes}:${String(game.TimeRemainingSeconds).padStart(2, '0')}`;
      break;
    case 'Scheduled':
      statusEmoji = '📅';
      const gameDate = new Date(game.DateTime);
      statusText = gameDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZoneName: 'short'
      });
      break;
    default:
      statusEmoji = '❓';
      statusText = game.Status;
  }
  
  // Check if it's an upset (lower seed beating higher seed)
  const isUpset = (game.Status === 'Final') && 
    ((game.AwayTeamSeed > game.HomeTeamSeed && game.AwayTeamScore > game.HomeTeamScore) || 
     (game.HomeTeamSeed > game.AwayTeamSeed && game.HomeTeamScore > game.AwayTeamScore));
  
  // Format the game line
  let gameText = `${statusEmoji} `;
  
  // Add seed numbers
  gameText += `(${game.AwayTeamSeed}) *${game.AwayTeam}* `;
  
  // Add scores if game has started
  if (game.Status !== 'Scheduled') {
    gameText += `${game.AwayTeamScore} - ${game.HomeTeamScore} `;
  } else {
    gameText += `vs `;
  }
  
  gameText += `*${game.HomeTeam}* (${game.HomeTeamSeed})`;
  
  // Add upset indicator
  if (isUpset) {
    gameText += ` 🚨 UPSET! 🚨`;
  }
  
  // Add detailed status
  gameText += `\n└ _${statusText}`;
  
  // Add round info
  gameText += ` | Round ${game.Round}_`;
  
  return gameText;
}

/**
 * Format tournament statistics for display
 * @param {Object} stats Tournament statistics
 * @returns {string} Formatted statistics string
 */
function formatStatisticsForDisplay(stats) {
  let statsText = `*Tournament Progress*: ${stats.completedGames} completed, ${stats.inProgressGames} in progress, ${stats.upcomingGames} upcoming\n`;
  
  if (stats.upsets > 0) {
    statsText += `*Upsets*: ${stats.upsets} so far\n`;
  }
  
  statsText += `*Average Points*: ${stats.avgPointsPerGame} points per game\n\n`;
  
  // Top scoring teams
  if (stats.topScoringTeams && stats.topScoringTeams.length > 0) {
    statsText += `*Top Scoring Teams (Avg)*:\n`;
    stats.topScoringTeams.forEach((team, index) => {
      statsText += `${index + 1}. ${team.team}: ${team.avgPoints} ppg\n`;
    });
    statsText += `\n`;
  }
  
  // Closest games
  if (stats.closestGames && stats.closestGames.length > 0) {
    statsText += `*Closest Games*:\n`;
    stats.closestGames.forEach((game, index) => {
      statsText += `${index + 1}. ${game.winner} def. ${game.loser} by ${game.margin} (${game.awayScore}-${game.homeScore})\n`;
    });
  }
  
  return statsText;
}

/**
 * Update Canvas content with tournament data
 * @param {Object} web Slack WebClient instance
 * @param {string} canvasId Canvas ID to update
 * @param {Object} data Tournament data
 * @returns {Promise<Object>} Updated Canvas details
 */
async function updateCanvasContent(web, canvasId, data) {
  try {
    // Format games in progress
    let currentGamesText = data.currentGames && data.currentGames.length > 0
      ? data.currentGames.map(game => formatGameForDisplay(game)).join('\n\n')
      : 'No games currently in progress.';
    
    // Format completed games (show most recent 5)
    const recentCompletedGames = data.completedGames 
      ? [...data.completedGames].sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime)).slice(0, 5)
      : [];
    
    let completedGamesText = recentCompletedGames.length > 0
      ? recentCompletedGames.map(game => formatGameForDisplay(game)).join('\n\n')
      : 'No completed games yet.';
    
    // Format upcoming games (show next 5)
    const upcomingGames = data.upcomingGames 
      ? [...data.upcomingGames].sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime)).slice(0, 5)
      : [];
    
    let upcomingGamesText = upcomingGames.length > 0
      ? upcomingGames.map(game => formatGameForDisplay(game)).join('\n\n')
      : 'No upcoming games scheduled.';
    
    // Format statistics
    let statsText = data.stats 
      ? formatStatisticsForDisplay(data.stats)
      : 'Statistics not available yet.';
    
    // Format last updated timestamp
    const lastUpdated = data.lastUpdated 
      ? new Date(data.lastUpdated).toLocaleString('en-US', { 
          dateStyle: 'medium', 
          timeStyle: 'medium'
        })
      : 'Unknown';
    
    // Prepare Canvas blocks for update
    const updatedBlocks = [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "🏀 NCAA Tournament Tracker 2025 🏀",
          "emoji": true
        }
      },
      {
        "type": "divider"
      },
      // Games in progress section
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "Games In Progress",
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": currentGamesText
        }
      },
      {
        "type": "divider"
      },
      // Recent completed games section
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "Recently Completed Games",
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": completedGamesText
        }
      },
      {
        "type": "divider"
      },
      // Upcoming games section
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "Upcoming Games",
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": upcomingGamesText
        }
      },
      {
        "type": "divider"
      },
      // Tournament statistics section
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "Tournament Statistics",
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": statsText
        }
      },
      {
        "type": "divider"
      },
      // Footer section
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": `Last updated: ${lastUpdated}`
          }
        ]
      }
    ];
    
    // Add specific blocks for special situations
    
    // Close games alert
    if (data.closeGames && data.closeGames.length > 0) {
      // Insert after the main header
      updatedBlocks.splice(2, 0, 
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `🔥 *CLOSE GAME ALERT* 🔥\n${data.closeGames.map(game => formatGameForDisplay(game)).join('\n\n')}`
          }
        },
        {
          "type": "divider"
        }
      );
    }
    
    // Update the Canvas with the new content
    const result = await web.canvas.update({
      canvas_id: canvasId,
      blocks: updatedBlocks
    });
    
    return result;
  } catch (error) {
    console.error('Error updating Canvas content:', error.message);
    throw error;
  }
}

module.exports = {
  checkCanvas,
  createTournamentCanvas,
  updateCanvasStructure,
  updateCanvasContent
};
