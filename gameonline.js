class BritishSquareOnline extends BritishSquareGame {
  constructor() {
    super();

    // WebSocket connection
    this.ws = null;
    this.playerId = null;
    this.playerNumber = null;
    this.roomId = null;
    this.isConnected = false;
    this.isInRoom = false;
    this.opponentReady = false;
    this.playerReady = false;

    // Create the 2D board for online mode
    this.createBoard();

    // UI elements for online mode
    this.createOnlineUI();

    // Connect to server
    this.connect();
  }

  createOnlineUI() {
    const controlsContainer = document.querySelector(".game-setup");

    if (!controlsContainer) {
      console.error(
        "Game setup container not found. Make sure the page is fully loaded."
      );
      return;
    }

    // Remove AI difficulty controls (not needed for online)
    const aiDifficulty = document.getElementById("ai-difficulty");
    if (aiDifficulty) {
      aiDifficulty.style.display = "none";
    }

    // Create online controls
    const onlineControls = document.createElement("div");
    onlineControls.className = "online-controls";
    onlineControls.innerHTML = `
      <div class="connection-status">
        <span id="connection-status">Connecting...</span>
      </div>
      
      <div class="room-controls" id="room-controls" style="display: none;">
        <div class="room-join">
          <input type="text" id="room-code" placeholder="Enter room code" maxlength="8">
          <button id="join-room-btn" class="btn">Join Room</button>
        </div>
        <div class="room-create">
          <button id="create-room-btn" class="btn">Create New Room</button>
        </div>
      </div>
      
      <div class="room-info" id="room-info" style="display: none;">
        <div class="room-code-display">
          Room Code: <span id="current-room-code"></span>
          <button id="copy-room-code" class="btn btn-small">Copy</button>
        </div>
        <div class="players-status">
          <div class="player-status">
            <span id="player1-status">Player 1: Waiting...</span>
          </div>
          <div class="player-status">
            <span id="player2-status">Player 2: Waiting...</span>
          </div>
        </div>
        <div class="ready-controls">
          <button id="ready-btn" class="btn">Ready</button>
          <button id="leave-room-btn" class="btn btn-secondary">Leave Room</button>
        </div>
      </div>
      
      <div class="game-status" id="online-game-status" style="display: none;">
        <div id="turn-indicator">Waiting for game to start...</div>
        <div id="opponent-info">Opponent: Connected</div>
      </div>
    `;

    controlsContainer.appendChild(onlineControls);

    // Add event listeners
    this.setupOnlineEventListeners();
  }

  setupOnlineEventListeners() {
    const createRoomBtn = document.getElementById("create-room-btn");
    const joinRoomBtn = document.getElementById("join-room-btn");
    const roomCodeInput = document.getElementById("room-code");
    const readyBtn = document.getElementById("ready-btn");
    const leaveRoomBtn = document.getElementById("leave-room-btn");
    const copyRoomCodeBtn = document.getElementById("copy-room-code");

    if (createRoomBtn) {
      createRoomBtn.addEventListener("click", () => {
        this.createRoom();
      });
    }

    if (joinRoomBtn) {
      joinRoomBtn.addEventListener("click", () => {
        const roomCode =
          roomCodeInput && roomCodeInput.value
            ? roomCodeInput.value.trim().toUpperCase()
            : "";
        if (roomCode) {
          this.joinRoom(roomCode);
        }
      });
    }

    if (roomCodeInput) {
      roomCodeInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const roomCode = e.target.value.trim().toUpperCase();
          if (roomCode) {
            this.joinRoom(roomCode);
          }
        }
      });
    }

    if (readyBtn) {
      readyBtn.addEventListener("click", () => {
        this.toggleReady();
      });
    }

    if (leaveRoomBtn) {
      leaveRoomBtn.addEventListener("click", () => {
        this.leaveRoom();
      });
    }

    if (copyRoomCodeBtn) {
      copyRoomCodeBtn.addEventListener("click", () => {
        const roomCodeSpan = document.getElementById("current-room-code");
        if (roomCodeSpan) {
          const roomCode = roomCodeSpan.textContent;
          navigator.clipboard.writeText(roomCode).then(() => {
            this.showMessage("Room code copied to clipboard!", "success");
          });
        }
      });
    }
  }

  connect() {
    try {
      // Dynamic WebSocket URL configuration
      let wsUrl;
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        // Development
        wsUrl = "ws://localhost:8081";
      } else {
        // Production - you'll need to replace this with your actual deployed server URL
        wsUrl = "wss://web-production-57049.up.railway.app"; // Replace with your server URL
      }

      console.log("Connecting to WebSocket at:", wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("Connected to multiplayer server");
        this.isConnected = true;
        this.updateConnectionStatus("Connected");
        document.getElementById("room-controls").style.display = "block";
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleServerMessage(data);
      };

      this.ws.onclose = () => {
        console.log("Disconnected from server");
        this.isConnected = false;
        this.updateConnectionStatus(
          "Disconnected - Attempting to reconnect..."
        );

        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            this.connect();
          }
        }, 3000);
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.updateConnectionStatus("Connection error");
      };
    } catch (error) {
      console.error("Failed to connect:", error);
      this.updateConnectionStatus("Failed to connect to server");
    }
  }

  handleServerMessage(data) {
    switch (data.type) {
      case "connected":
        this.playerId = data.playerId;
        break;

      case "room_created":
        this.roomId = data.roomId;
        this.playerNumber = data.playerNumber;
        this.isInRoom = true;
        this.showRoomInfo();
        document.getElementById("current-room-code").textContent = data.roomId;
        this.updatePlayerStatus();
        break;

      case "room_joined":
        this.roomId = data.roomId;
        this.playerNumber = data.playerNumber;
        this.isInRoom = true;
        this.showRoomInfo();
        document.getElementById("current-room-code").textContent = data.roomId;
        this.updatePlayerStatus();
        // Update game state if game is in progress
        if (data.gameState) {
          this.syncGameState(data.gameState);
        }
        break;

      case "player_joined":
        this.updatePlayerStatus();
        this.showMessage(`Player ${data.playerNumber} joined the room`, "info");
        break;

      case "player_left":
        this.updatePlayerStatus();
        this.showMessage("Player left the room", "info");
        this.hideGameStatus();
        break;

      case "player_ready_changed":
        if (data.playerId !== this.playerId) {
          this.opponentReady = data.ready;
        }
        this.updatePlayerStatus();
        break;

      case "game_started":
        this.syncGameState(data.gameState);
        this.showGameStatus();
        this.showMessage("Game started!", "success");
        
        // Ensure game is marked as active
        this.gameActive = true;
        this.updateValidMoves();
        break;

      case "move_made":
        this.handleOpponentMove(data);
        break;

      case "game_ended":
        this.handleGameEnd(data);
        break;

      case "invalid_move":
        this.showMessage("Invalid move!", "error");
        break;

      case "error":
        this.showMessage(data.message, "error");
        break;
    }
  }

  createRoom() {
    if (this.ws && this.isConnected) {
      this.ws.send(
        JSON.stringify({
          type: "create_room",
        })
      );
    }
  }

  joinRoom(roomId) {
    if (this.ws && this.isConnected) {
      this.ws.send(
        JSON.stringify({
          type: "join_room",
          roomId: roomId,
        })
      );
    }
  }

  leaveRoom() {
    if (this.ws && this.isConnected && this.isInRoom) {
      this.ws.send(
        JSON.stringify({
          type: "leave_room",
        })
      );

      this.isInRoom = false;
      this.roomId = null;
      this.playerNumber = null;
      this.playerReady = false;
      this.opponentReady = false;

      this.hideRoomInfo();
      this.hideGameStatus();
      document.getElementById("room-controls").style.display = "block";

      // Reset game
      this.newGame();
    }
  }

  toggleReady() {
    if (this.ws && this.isConnected && this.isInRoom) {
      this.playerReady = !this.playerReady;

      this.ws.send(
        JSON.stringify({
          type: "player_ready",
          ready: this.playerReady,
        })
      );

      const readyBtn = document.getElementById("ready-btn");
      readyBtn.textContent = this.playerReady ? "Not Ready" : "Ready";
      readyBtn.className = this.playerReady ? "btn btn-secondary" : "btn";
    }
  }

  makeMove(index) {
    // Override parent method to send moves to server
    if (!this.isInRoom) {
      this.showMessage("You're not in a room", "error");
      return;
    }

    if (!this.gameActive) {
      this.showMessage("Game is not active", "error");
      return;
    }

    // Check if it's our turn
    if (this.currentPlayer !== this.playerNumber) {
      this.showMessage("It's not your turn!", "error");
      return;
    }

    if (this.ws && this.isConnected) {
      this.ws.send(
        JSON.stringify({
          type: "make_move",
          position: index,
        })
      );
    }
  }

  handleOpponentMove(data) {
    // Update local game state
    this.board[data.position] = data.player;
    this.currentPlayer = data.currentPlayer;
    this.moveCount = data.moveCount;

    // Update display
    this.updateSquareDisplay(data.position);
    this.updateValidMoves();
    this.updateTurnIndicator();

    this.showMessage(`Opponent placed on square ${data.position + 1}`, "info");
  }

  syncGameState(gameState) {
    this.board = [...gameState.board];
    this.currentPlayer = gameState.currentPlayer;
    this.gameActive = gameState.gameActive;
    this.moveCount = gameState.moveCount;

    // Update all displays
    this.updateDisplay();
    this.updateValidMoves();
    this.updateTurnIndicator();
  }

  handleGameEnd(data) {
    this.gameActive = false;

    let message = "";
    let winner = null;

    if (data.reason === "opponent_disconnected") {
      message = "Opponent disconnected. You win!";
      winner = this.playerNumber;
    } else if (data.winner === this.playerNumber) {
      message = "You won!";
      winner = this.playerNumber;
    } else if (data.winner === null) {
      message = "It's a tie!";
      winner = null;
    } else {
      message = "You lost!";
      winner = data.winner;
    }

    // Calculate scores for the modal
    const player1Count = this.board.filter((cell) => cell === 1).length;
    const player2Count = this.board.filter((cell) => cell === 2).length;

    // Use the base class method with proper parameters
    this.showWinModal(winner, player1Count, player2Count, message);
  }

  updateConnectionStatus(status) {
    const connectionStatus = document.getElementById("connection-status");
    if (connectionStatus) {
      connectionStatus.textContent = status;
    }
  }

  showRoomInfo() {
    const roomControls = document.getElementById("room-controls");
    const roomInfo = document.getElementById("room-info");
    if (roomControls) roomControls.style.display = "none";
    if (roomInfo) roomInfo.style.display = "block";
  }

  hideRoomInfo() {
    const roomInfo = document.getElementById("room-info");
    const roomControls = document.getElementById("room-controls");
    if (roomInfo) roomInfo.style.display = "none";
    if (roomControls) roomControls.style.display = "block";
  }

  showGameStatus() {
    document.getElementById("online-game-status").style.display = "block";
    this.updateTurnIndicator();
  }

  hideGameStatus() {
    document.getElementById("online-game-status").style.display = "none";
  }

  updatePlayerStatus() {
    const player1Status = document.getElementById("player1-status");
    const player2Status = document.getElementById("player2-status");

    // Update based on current room state
    if (this.playerNumber === 1) {
      player1Status.textContent = `Player 1 (You): ${
        this.playerReady ? "Ready" : "Not Ready"
      }`;
      player2Status.textContent =
        this.roomId && this.getOpponentCount() > 0
          ? `Player 2: ${this.opponentReady ? "Ready" : "Not Ready"}`
          : "Player 2: Waiting...";
    } else if (this.playerNumber === 2) {
      player1Status.textContent =
        this.roomId && this.getOpponentCount() > 0
          ? `Player 1: ${this.opponentReady ? "Ready" : "Not Ready"}`
          : "Player 1: Waiting...";
      player2Status.textContent = `Player 2 (You): ${
        this.playerReady ? "Ready" : "Not Ready"
      }`;
    }
  }

  updateTurnIndicator() {
    const turnIndicator = document.getElementById("turn-indicator");
    if (turnIndicator) {
      if (!this.gameActive) {
        turnIndicator.textContent = "Game ended";
      } else if (this.currentPlayer === this.playerNumber) {
        turnIndicator.textContent = "Your turn";
        turnIndicator.className = "your-turn";
      } else {
        turnIndicator.textContent = "Opponent's turn";
        turnIndicator.className = "opponent-turn";
      }
    }
  }

  getOpponentCount() {
    // This is a simplified check - in a real implementation,
    // you'd track this from server messages
    return 1; // Assume opponent exists if we're in a room
  }

  newGame() {
    // Override to prevent local new game in online mode
    if (this.isInRoom && this.gameActive) {
      this.showMessage(
        "Cannot start new game while online game is active",
        "error"
      );
      return;
    }

    super.newGame();
  }

  // Disable AI mode controls in online mode
  updateDisplay() {
    super.updateDisplay();

    // Hide AI-specific UI elements
    const aiDifficulty = document.getElementById("ai-difficulty");
    if (aiDifficulty) {
      aiDifficulty.style.display = "none";
    }
  }

  // Override to create the 2D board for online mode
  createBoard() {
    const gameBoard = document.getElementById("game-board");
    if (!gameBoard) {
      console.error("Game board element not found");
      return;
    }

    gameBoard.innerHTML = "";

    for (let i = 0; i < 25; i++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.dataset.index = i;
      square.addEventListener("click", () => this.handleSquareClick(i));
      gameBoard.appendChild(square);
    }
  }

  // Handle square clicks for online mode
  handleSquareClick(index) {
    if (!this.isInRoom) {
      this.showMessage("You're not in a room", "error");
      return;
    }

    if (!this.gameActive) {
      this.showMessage("Game is not active", "error");
      return;
    }

    // Check if it's our turn
    if (this.currentPlayer !== this.playerNumber) {
      this.showMessage("It's not your turn!", "error");
      return;
    }

    // Check if square is empty
    if (this.board[index] !== null) {
      this.showMessage("Square is already occupied", "error");
      return;
    }

    // Check if move is valid using the same logic as the base game
    if (!this.isValidMove(index)) {
      this.showMessage("Invalid move! Cannot place next to opponent pieces.", "error");
      return;
    }

    // Send move to server (server will validate)
    this.makeMove(index);
  }
}
