require('dotenv').config();
const { App } = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');
const express = require('express');
const cron = require('node-cron');
const axios = require('axios');

const sportService = require('./services/sportService');
const canvasService = require('./services/canvasService');

// Initialize Slack App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: !!process.env.SLACK_APP_TOKEN,
});

// Initialize WebClient (used for more advanced API calls)
const web = new WebClient(process.env.SLACK_BOT_TOKEN);

// Configuration
const UPDATE_FREQUENCY = process.env.UPDATE_FREQUENCY || 5; // minutes
const NOTIFICATION_THRESHOLD = process.env.NOTIFICATION_THRESHOLD || 5; // points
const CANVAS_ID = process.env.SLACK_CANVAS_ID;
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

// Store game data
let tournamentData = {
  games: [],
  lastUpdated: null,
  bracket: null,
  upsets: [],
  stats: {}
};

// Initialize the Canvas
async function initializeCanvas() {
  try {
    console.log('Initializing Canvas...');
    
    // Check if Canvas exists, create if needed
    const canvasExists = await canvasService.checkCanvas(web, CANVAS_ID);
    
    if (!canvasExists) {
      console.log('Canvas not found, creating a new one...');
      const newCanvas = await canvasService.createTournamentCanvas(web, CHANNEL_ID);
      console.log(`Created new Canvas with ID: ${newCanvas.canvas.id}`);
      // Update the canvas ID in our app (you'd typically save this to a database or .env)
      // For this example, we'll just log it
      console.log(`Please update your .env file with: SLACK_CANVAS_ID=${newCanvas.canvas.id}`);
    } else {
      console.log('Canvas found, updating with initial content...');
      await canvasService.updateCanvasStructure(web, CANVAS_ID);
    }
    
    // Update the Canvas with initial "loading" content
    await canvasService.updateCanvasContent(web, CANVAS_ID, {
      games: [],
      status: 'initializing',
      lastUpdated: new Date().toISOString(),
      message: 'Loading NCAA tournament data...'
    });
    
    console.log('Canvas initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Canvas:', error.message);
  }
}

// Fetch tournament data and update Canvas
async function updateTournamentData() {
  try {
    console.log('Fetching NCAA tournament data...');
    
    // Get latest game data
    const gameData = await sportService.fetchNcaaGames();
    
    // Process game data
    const currentGames = gameData.filter(game => game.Status === 'InProgress');
    const completedGames = gameData.filter(game => game.Status === 'Final');
    const upcomingGames = gameData.filter(game => game.Status === 'Scheduled');
    
    // Get close games
    const closeGames = currentGames.filter(
      game => Math.abs(game.AwayTeamScore - game.HomeTeamScore) <= NOTIFICATION_THRESHOLD
    );
    
    // Check for upsets
    const upsets = completedGames.filter(game => {
      return (game.AwayTeamSeed > game.HomeTeamSeed && game.AwayTeamScore > game.HomeTeamScore) || 
             (game.HomeTeamSeed > game.AwayTeamSeed && game.HomeTeamScore > game.AwayTeamScore);
    });
    
    // Compile tournament statistics
    const stats = sportService.calculateTournamentStats(gameData);
    
    // Update our data store
    tournamentData = {
      games: gameData,
      currentGames,
      completedGames,
      upcomingGames,
      closeGames,
      upsets,
      stats,
      lastUpdated: new Date().toISOString()
    };
    
    // Update the Canvas
    await canvasService.updateCanvasContent(web, CANVAS_ID, tournamentData);
    
    console.log(`Tournament data updated successfully. ${currentGames.length} in progress, ${completedGames.length} completed, ${upcomingGames.length} upcoming.`);
  } catch (error) {
    console.error('Failed to update tournament data:', error.message);
  }
}

// Handle app_mention events
app.event('app_mention', async ({ event, say }) => {
  try {
    await say({
      text: `Hi <@${event.user}>! I'm tracking the NCAA tournament. Check out our Canvas for the latest updates!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Hi <@${event.user}>! I'm tracking the NCAA tournament. Check out our Canvas for the latest updates!`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "You can ask me for specific information like:\n• *current games*: to see games in progress\n• *close games*: to see tight matchups\n• *upsets*: to see any upsets so far\n• *refresh*: to force a data update"
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error handling app_mention:', error);
  }
});

// Handle direct messages
app.message(async ({ message, say }) => {
  if (message.channel_type !== 'im') return;
  
  const text = message.text.toLowerCase();
  
  try {
    if (text.includes('current') || text.includes('in progress')) {
      const games = tournamentData.currentGames || [];
      await say(`There are ${games.length} games in progress right now.`);
    } else if (text.includes('close')) {
      const closeGames = tournamentData.closeGames || [];
      await say(`There are ${closeGames.length} close games right now.`);
    } else if (text.includes('upset')) {
      const upsets = tournamentData.upsets || [];
      await say(`There have been ${upsets.length} upsets in the tournament so far.`);
    } else if (text.includes('refresh') || text.includes('update')) {
      await say('Fetching the latest tournament data...');
      await updateTournamentData();
      await say('Tournament data has been refreshed! Check the Canvas for updates.');
    } else {
      await say({
        text: "Hi there! I'm tracking the NCAA tournament. Here's what you can ask me:",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Hi there! I'm tracking the NCAA tournament. Here's what you can ask me:"
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "• *current games*: to see games in progress\n• *close games*: to see tight matchups\n• *upsets*: to see any upsets so far\n• *refresh*: to force a data update"
            }
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    await say('Sorry, I encountered an error processing your request.');
  }
});

// Set up scheduled updates
function scheduleUpdates() {
  console.log(`Scheduling updates every ${UPDATE_FREQUENCY} minutes`);
  cron.schedule(`*/${UPDATE_FREQUENCY} * * * *`, async () => {
    console.log('Running scheduled update...');
    await updateTournamentData();
  });
}

// Start the app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ NCAA Tournament Canvas App is running!');
  
  // Initialize Canvas and set up first data sync
  await initializeCanvas();
  await updateTournamentData();
  
  // Schedule regular updates
  scheduleUpdates();
})();
