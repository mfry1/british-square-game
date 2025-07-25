const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8081 });

// Game rooms storage
const gameRooms = new Map();
const playerRooms = new Map(); // Maps player ID to room ID

class GameRoom {
  constructor(roomId) {
    this.id = roomId;
    this.players = [];
    this.gameState = {
      board: new Array(25).fill(null),
      currentPlayer: 1,
      gameActive: true,
      moveCount: 0
    };
    this.spectators = [];
  }

  addPlayer(ws, playerId) {
    if (this.players.length < 2) {
      const player = {
        id: playerId,
        ws: ws,
        playerNumber: this.players.length + 1,
        ready: false
      };
      this.players.push(player);
      playerRooms.set(playerId, this.id);
      
      // Notify all players in room about new player
      this.broadcast({
        type: 'player_joined',
        playerId: playerId,
        playerNumber: player.playerNumber,
        playersCount: this.players.length
      });
      
      return player;
    }
    return null;
  }

  removePlayer(playerId) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      this.players.splice(playerIndex, 1);
      playerRooms.delete(playerId);
      
      // Notify remaining players
      this.broadcast({
        type: 'player_left',
        playerId: playerId,
        playersCount: this.players.length
      });
      
      // If game was in progress, end it
      if (this.gameState.gameActive && this.players.length === 1) {
        this.broadcast({
          type: 'game_ended',
          reason: 'opponent_disconnected',
          winner: this.players[0] ? this.players[0].playerNumber : null
        });
      }
    }
  }

  broadcast(message, excludePlayerId = null) {
    [...this.players, ...this.spectators].forEach(participant => {
      if (participant.id !== excludePlayerId && participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.send(JSON.stringify(message));
      }
    });
  }

  makeMove(playerId, position) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || !this.gameState.gameActive) {
      return false;
    }

    // Check if it's the player's turn
    if (player.playerNumber !== this.gameState.currentPlayer) {
      return false;
    }

    // Check if position is valid
    if (position < 0 || position >= 25 || this.gameState.board[position] !== null) {
      return false;
    }

    // Basic move validation (simplified - you can expand this)
    if (!this.isValidMove(position)) {
      return false;
    }

    // Make the move
    this.gameState.board[position] = this.gameState.currentPlayer;
    this.gameState.moveCount++;

    // Check for game end
    const validMovesRemain = this.hasValidMoves();
    if (!validMovesRemain) {
      this.gameState.gameActive = false;
      const winner = this.determineWinner();
      
      this.broadcast({
        type: 'game_ended',
        board: this.gameState.board,
        winner: winner,
        reason: 'no_moves'
      });
    } else {
      // Switch turns
      this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
      
      this.broadcast({
        type: 'move_made',
        position: position,
        player: player.playerNumber,
        board: this.gameState.board,
        currentPlayer: this.gameState.currentPlayer,
        moveCount: this.gameState.moveCount
      });
    }

    return true;
  }

  isValidMove(position) {
    // Basic validation - first move must NOT be center for player 1
    if (this.gameState.moveCount === 0 && this.gameState.currentPlayer === 1) {
      return position !== 12; // Center position is blocked for player 1's first move
    }

    // Check if position is adjacent to opponent pieces (not allowed)
    const row = Math.floor(position / 5);
    const col = position % 5;
    const opponent = this.gameState.currentPlayer === 1 ? 2 : 1;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 5) {
        const adjacentPos = newRow * 5 + newCol;
        if (this.gameState.board[adjacentPos] === opponent) {
          return false;
        }
      }
    }

    return true;
  }

  hasValidMoves() {
    for (let i = 0; i < 25; i++) {
      if (this.gameState.board[i] === null && this.isValidMove(i)) {
        return true;
      }
    }
    return false;
  }

  determineWinner() {
    const player1Count = this.gameState.board.filter(cell => cell === 1).length;
    const player2Count = this.gameState.board.filter(cell => cell === 2).length;
    
    if (player1Count > player2Count) return 1;
    if (player2Count > player1Count) return 2;
    return null; // Tie
  }

  startGame() {
    if (this.players.length === 2 && this.players.every(p => p.ready)) {
      this.gameState = {
        board: new Array(25).fill(null),
        currentPlayer: 1,
        gameActive: true,
        moveCount: 0
      };

      this.broadcast({
        type: 'game_started',
        gameState: this.gameState
      });
    }
  }
}

wss.on('connection', (ws) => {
  const playerId = uuidv4();
  console.log(`Player ${playerId} connected`);

  ws.send(JSON.stringify({
    type: 'connected',
    playerId: playerId
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, playerId, data);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`Player ${playerId} disconnected`);
    const roomId = playerRooms.get(playerId);
    if (roomId) {
      const room = gameRooms.get(roomId);
      if (room) {
        room.removePlayer(playerId);
        // Clean up empty rooms
        if (room.players.length === 0) {
          gameRooms.delete(roomId);
        }
      }
    }
  });
});

function handleMessage(ws, playerId, data) {
  switch (data.type) {
    case 'create_room':
      createRoom(ws, playerId, data.roomId);
      break;
    
    case 'join_room':
      joinRoom(ws, playerId, data.roomId);
      break;
    
    case 'player_ready':
      setPlayerReady(playerId, data.ready);
      break;
    
    case 'make_move':
      makeMove(playerId, data.position);
      break;
    
    case 'leave_room':
      leaveRoom(playerId);
      break;
    
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }));
  }
}

function createRoom(ws, playerId, roomId = null) {
  if (!roomId) {
    roomId = uuidv4().substring(0, 8).toUpperCase();
  }

  if (gameRooms.has(roomId)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Room already exists'
    }));
    return;
  }

  const room = new GameRoom(roomId);
  gameRooms.set(roomId, room);
  
  const player = room.addPlayer(ws, playerId);
  
  ws.send(JSON.stringify({
    type: 'room_created',
    roomId: roomId,
    playerId: playerId,
    playerNumber: player.playerNumber
  }));
}

function joinRoom(ws, playerId, roomId) {
  const room = gameRooms.get(roomId);
  
  if (!room) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Room not found'
    }));
    return;
  }

  if (room.players.length >= 2) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Room is full'
    }));
    return;
  }

  const player = room.addPlayer(ws, playerId);
  
  ws.send(JSON.stringify({
    type: 'room_joined',
    roomId: roomId,
    playerId: playerId,
    playerNumber: player.playerNumber,
    gameState: room.gameState
  }));
}

function setPlayerReady(playerId, ready) {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return;

  const room = gameRooms.get(roomId);
  if (!room) return;

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.ready = ready;
    
    room.broadcast({
      type: 'player_ready_changed',
      playerId: playerId,
      ready: ready
    });

    // Start game if both players are ready
    if (room.players.length === 2 && room.players.every(p => p.ready)) {
      room.startGame();
    }
  }
}

function makeMove(playerId, position) {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return;

  const room = gameRooms.get(roomId);
  if (!room) return;

  const success = room.makeMove(playerId, position);
  
  if (!success) {
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.ws.send(JSON.stringify({
        type: 'invalid_move',
        position: position
      }));
    }
  }
}

function leaveRoom(playerId) {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return;

  const room = gameRooms.get(roomId);
  if (!room) return;

  room.removePlayer(playerId);
  
  // Clean up empty rooms
  if (room.players.length === 0) {
    gameRooms.delete(roomId);
  }
}

console.log('British Square multiplayer server running on port 8081');
