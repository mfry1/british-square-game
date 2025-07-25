# British Square Online Multiplayer

This directory contains the WebSocket server for online multiplayer functionality.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

The server will run on `ws://localhost:8080`

## How it Works

- Players can create or join game rooms using room codes
- Each room supports exactly 2 players
- Real-time game state synchronization via WebSocket
- Automatic disconnection handling

## Testing Locally

1. Start the server (`npm start`)
2. Open the main game in multiple browser tabs
3. Click "Online Mode" in one tab, create a room
4. Copy the room code and join from another tab
5. Both players click "Ready" to start the game

## Production Deployment

For production, you'll need to:
1. Deploy the server to a hosting service (Heroku, Railway, etc.)
2. Update the WebSocket URL in `gameonline.js` from `localhost:8080` to your production server
3. Ensure your hosting service supports WebSocket connections
