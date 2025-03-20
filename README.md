# NCAA Tournament Slack Canvas App

A Slack Canvas App for tracking NCAA basketball tournament games, scores, and statistics in real-time.

## Features

- **Interactive Canvas Display**: Maintains a persistent, always up-to-date view of the tournament
- **Live Game Updates**: Shows in-progress games with current scores
- **Tournament Statistics**: Displays stats, upsets, and closest games
- **Recent Results**: Shows recently completed games
- **Upcoming Schedule**: Lists upcoming tournament matchups
- **Slack Integration**: Responds to mentions and direct messages

## How It Works

This app creates a Slack Canvas that serves as a centralized, visual dashboard for NCAA tournament information. Instead of posting updates as individual messages, all tournament data is organized in one persistent, collaborative document that updates automatically.

The app:
1. Fetches tournament data from a sports API
2. Processes the data to identify important information (close games, upsets, etc.)
3. Updates specific sections of the Canvas with the latest information
4. Maintains statistics and historical records

## Prerequisites

- Node.js (v14+)
- Slack workspace with Canvas feature enabled
- Slack app with appropriate permissions
- Sports data API credentials

## Setup Instructions

### 1. Clone this repository

```bash
git clone https://github.com/mcorpening85/ncaa-tournament-slack-canvas.git
cd ncaa-tournament-slack-canvas
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" and select "From scratch"
3. Name your app (e.g., "NCAA Tournament Tracker") and select your workspace
4. Under "Basic Information," note your Signing Secret

### 4. Configure Slack App Permissions

1. Navigate to "OAuth & Permissions" in the sidebar
2. Under "Scopes," add these Bot Token Scopes:
   - `channels:read`
   - `chat:write`
   - `chat:write.public`
   - `im:history`
   - `im:read`
   - `im:write`
   - `mpim:read`
   - `mpim:write`
   - `groups:read`
   - `groups:write`
   - `canvas:write`
   - `canvas:read`

3. Install the app to your workspace and note the Bot User OAuth Token

### 5. Enable Socket Mode (Optional, for local development)

1. Navigate to "Socket Mode" in the sidebar
2. Enable Socket Mode
3. Generate and note your App-Level Token (starts with `xapp-`)

### 6. Configure Event Subscriptions

1. Navigate to "Event Subscriptions" in the sidebar
2. Enable events
3. If deploying to a server, set your Request URL
4. Subscribe to these bot events:
   - `app_mention`
   - `message.im`

### 7. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your credentials:
   ```
   SLACK_SIGNING_SECRET=your_slack_signing_secret
   SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
   SLACK_APP_TOKEN=xapp-your-slack-app-token (if using Socket Mode)
   SLACK_CHANNEL_ID=C12345678
   SPORTS_API_KEY=your-sports-api-key
   PORT=3000
   UPDATE_FREQUENCY=5
   NOTIFICATION_THRESHOLD=5
   TIMEZONE=America/New_York
   ```

### 8. First Run (Canvas Setup)

1. Start the app:
   ```bash
   npm start
   ```

2. The app will create a new Canvas in your specified channel on first run.

3. After Canvas creation, the console will display a Canvas ID. Add this to your `.env` file:
   ```
   SLACK_CANVAS_ID=your-generated-canvas-id
   ```

4. Restart the app to use the stored Canvas.

## Usage

- The Canvas automatically updates based on your specified frequency
- Mention the bot (`@NCAA Tracker`) in a channel to get basic information
- Send direct messages to the bot for specific information about:
  - Current games
  - Close games
  - Upsets
  - To manually refresh data

## Deployment Options

### Local Development

```bash
npm run dev
```

### Server Deployment

```bash
npm start
```

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t ncaa-tournament-canvas .
   ```

2. Run the container:
   ```bash
   docker run -d --name ncaa-canvas --env-file .env ncaa-tournament-canvas
   ```

### Heroku Deployment

1. Install Heroku CLI and login:
   ```bash
   heroku login
   ```

2. Create a new Heroku app:
   ```bash
   heroku create
   ```

3. Set environment variables:
   ```bash
   heroku config:set SLACK_SIGNING_SECRET=your_slack_signing_secret
   heroku config:set SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
   heroku config:set SLACK_CHANNEL_ID=C12345678
   heroku config:set SPORTS_API_KEY=your-sports-api-key
   heroku config:set UPDATE_FREQUENCY=5
   heroku config:set NOTIFICATION_THRESHOLD=5
   ```

4. Deploy the app:
   ```bash
   git push heroku main
   ```

## Customization

### Update Frequency

Edit the `UPDATE_FREQUENCY` value in the `.env` file (in minutes).

### Close Game Notification Threshold

Edit the `NOTIFICATION_THRESHOLD` value in the `.env` file (in points).

### Canvas Layout

Modify the `updateCanvasStructure` and `updateCanvasContent` functions in `services/canvasService.js` to change the Canvas layout and content.

## License

MIT
