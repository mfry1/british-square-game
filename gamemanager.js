class GameManager {
  constructor() {
    this.is3D = true; // Start with 3D
    this.gameMode = 'ai'; // Default game mode: 'ai', 'human', 'online'
    this.game2D = null;
    this.game3D = null;
    this.gameOnline = null;
    this.currentGame = null;

    this.initializeGames();
    this.attachEventListeners();
  }

  initializeGames() {
    // Initialize based on current game mode
    if (this.gameMode === 'online') {
      this.initializeOnlineGame();
    } else {
      // Initialize 3D game first (since we start in 3D mode)
      this.game3D = new BritishSquare3D();
      this.currentGame = this.game3D;

      // Hide loading message after a brief delay
      setTimeout(() => {
        document.getElementById("loading-message").style.display = "none";
      }, 1000);
    }
  }

  initializeOnlineGame() {
    if (!this.gameOnline) {
      // Ensure DOM elements exist before creating online game
      const gameSetup = document.querySelector('.game-setup');
      if (!gameSetup) {
        console.error('Game setup not found. Delaying online mode initialization.');
        setTimeout(() => this.initializeOnlineGame(), 100);
        return;
      }
      
      this.gameOnline = new BritishSquareOnline();
      this.currentGame = this.gameOnline;
      
      // Hide 3D/2D toggle for online mode
      const toggleBtn = document.getElementById("toggle-3d-btn");
      if (toggleBtn) {
        toggleBtn.style.display = "none";
      }
      
      // Hide 3D canvas and show 2D board for online
      const canvas = document.getElementById("game-canvas");
      const board = document.getElementById("game-board");
      if (canvas) canvas.style.display = "none";
      if (board) board.style.display = "grid";
      
      // Hide loading message
      setTimeout(() => {
        const loadingMessage = document.getElementById("loading-message");
        if (loadingMessage) {
          loadingMessage.style.display = "none";
        }
      }, 1000);
    }
  }

  initialize2DGame() {
    if (!this.game2D) {
      // Create 2D game instance
      this.game2D = new BritishSquareGame();

      // Override the createBoard method to use the existing HTML element
      this.game2D.createBoard = function () {
        const gameBoard = document.getElementById("game-board");
        gameBoard.innerHTML = "";

        for (let i = 0; i < 25; i++) {
          const square = document.createElement("div");
          square.classList.add("square");
          square.dataset.index = i;
          square.addEventListener("click", () => this.handleSquareClick(i));
          gameBoard.appendChild(square);
        }
      }.bind(this.game2D);

      // Initialize the 2D board
      this.game2D.createBoard();

      // Copy current game state from 3D to 2D
      this.copyGameState(this.game3D, this.game2D);
    } else {
      // Just copy the current state
      this.copyGameState(this.game3D, this.game2D);
    }
  }

  copyGameState(fromGame, toGame) {
    // Copy basic game state
    toGame.board = [...fromGame.board];
    toGame.currentPlayer = fromGame.currentPlayer;
    toGame.gameActive = fromGame.gameActive;
    toGame.moveCount = fromGame.moveCount;
    toGame.passCount = fromGame.passCount;
    toGame.gameMode = fromGame.gameMode;
    toGame.aiDifficulty = fromGame.aiDifficulty;

    // Clear and update the board display for 2D game
    if (toGame.updateSquareDisplay && document.getElementById("game-board")) {
      // Clear all squares first
      document.querySelectorAll("#game-board .square").forEach((square) => {
        square.classList.remove("player1", "player2", "occupied");
        square.textContent = "";
      });

      // Update squares with pieces
      for (let i = 0; i < 25; i++) {
        if (fromGame.board[i] !== null) {
          toGame.updateSquareDisplay(i);
        }
      }
    }

    // Update game display
    toGame.updateDisplay();
    toGame.updateValidMoves();
  }

  toggleView() {
    // Don't allow toggle in online mode
    if (this.gameMode === 'online') {
      return;
    }

    const canvas = document.getElementById("game-canvas");
    const board2D = document.getElementById("game-board");
    const toggleBtn = document.getElementById("toggle-3d-btn");
    const header = document.querySelector("header h1");

    if (this.is3D) {
      // Switch to 2D
      this.initialize2DGame();

      // Copy current state from 3D to 2D
      this.copyGameState(this.game3D, this.game2D);

      // Hide 3D, show 2D
      canvas.style.display = "none";
      board2D.style.display = "grid";

      // Update current game reference
      this.currentGame = this.game2D;

      // Update UI
      toggleBtn.textContent = "Switch to 3D";
      header.textContent = "British Square";

      this.is3D = false;
    } else {
      // Switch to 3D
      if (this.game2D) {
        // Copy current state from 2D to 3D
        this.copyGameState(this.game2D, this.game3D);
      }

      // Hide 2D, show 3D
      board2D.style.display = "none";
      canvas.style.display = "block";

      // Update current game reference
      this.currentGame = this.game3D;

      // Update UI
      toggleBtn.textContent = "Switch to 2D";
      header.textContent = "British Square 3D";

      this.is3D = true;
    }

    // Ensure the correct game handles events
    this.updateGameEventHandlers();

    // Update global game reference for compatibility
    game = this.currentGame;
  }

  switchToOnlineMode() {
    this.gameMode = 'online';
    
    // Clean up existing games
    if (this.game3D) {
      // Clean up 3D resources if needed
    }
    
    // Initialize online game
    this.initializeOnlineGame();
    
    // Update UI
    document.querySelector("header h1").textContent = "British Square Online";
  }

  switchToOfflineMode() {
    this.gameMode = 'ai';
    
    // Clean up online game
    if (this.gameOnline && this.gameOnline.ws) {
      this.gameOnline.ws.close();
      this.gameOnline = null;
    }
    
    // Show 3D/2D toggle
    document.getElementById("toggle-3d-btn").style.display = "block";
    
    // Reinitialize 3D game
    this.game3D = new BritishSquare3D();
    this.currentGame = this.game3D;
    this.is3D = true;
    
    // Show 3D canvas
    document.getElementById("game-canvas").style.display = "block";
    document.getElementById("game-board").style.display = "none";
    
    // Update UI
    document.querySelector("header h1").textContent = "British Square 3D";
    document.getElementById("toggle-3d-btn").textContent = "Switch to 2D";
    
    // Update global reference
    game = this.currentGame;
  }

  updateGameEventHandlers() {
    // Update new game button
    const newGameBtn = document.getElementById("new-game-btn");
    newGameBtn.onclick = () => {
      this.currentGame.newGame();
    };

    // Update game mode buttons
    document.getElementById("pvp-mode").onclick = () => {
      if (this.gameMode !== 'online') {
        this.currentGame.setGameMode("pvp");
      }
    };

    document.getElementById("ai-mode").onclick = () => {
      if (this.gameMode !== 'online') {
        this.currentGame.setGameMode("ai");
      }
    };

    // Add online mode button handler
    const onlineModeBtn = document.getElementById("online-mode");
    if (onlineModeBtn) {
      onlineModeBtn.onclick = () => {
        if (this.gameMode === 'online') {
          this.switchToOfflineMode();
          onlineModeBtn.textContent = "Online Mode";
          onlineModeBtn.classList.remove("active");
        } else {
          this.switchToOnlineMode();
          onlineModeBtn.textContent = "Exit Online";
          onlineModeBtn.classList.add("active");
        }
      };
    }

    // Update AI difficulty
    const aiDifficultySelect = document.getElementById("ai-difficulty");
    if (aiDifficultySelect) {
      aiDifficultySelect.onchange = (e) => {
        if (this.currentGame && this.currentGame.aiDifficulty !== undefined) {
          this.currentGame.aiDifficulty = e.target.value;
        }
      };
    }
  }

  attachEventListeners() {
    // Attach toggle button listener
    const toggleBtn = document.getElementById("toggle-3d-btn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.toggleView();
      });
    }

    // Initial event handler setup
    this.updateGameEventHandlers();
  }
}

// Global reference for compatibility
let gameManager;
let game; // For backward compatibility

document.addEventListener("DOMContentLoaded", () => {
  gameManager = new GameManager();
  game = gameManager.currentGame; // For backward compatibility with modal callbacks
});
