class BritishSquareGame {
    constructor() {
        this.board = Array(25).fill(null); // 5x5 board
        this.currentPlayer = 1;
        this.gameActive = true;
        this.moveCount = 0;
        this.passCount = 0;
        this.gameMode = 'ai'; // 'pvp' or 'ai'
        this.aiDifficulty = 'medium';
        
        this.initializeGame();
        this.attachEventListeners();
    }

    initializeGame() {
        this.createBoard();
        this.updateDisplay();
        this.updateValidMoves();
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < 25; i++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.dataset.index = i;
            square.addEventListener('click', () => this.handleSquareClick(i));
            gameBoard.appendChild(square);
        }
    }

    handleSquareClick(index) {
        if (!this.gameActive || this.board[index] !== null) {
            return;
        }

        // In AI mode, only allow human player (Player 1) to click
        if (this.gameMode === 'ai' && this.currentPlayer === 2) {
            return;
        }

        // Check if move is valid
        if (!this.isValidMove(index)) {
            this.showMessage("Invalid move! Cannot place next to opponent pieces.", "error");
            return;
        }

        this.makeMove(index);
    }

    makeMove(index) {
        // Place the piece
        this.board[index] = this.currentPlayer;
        this.updateSquareDisplay(index);
        this.moveCount++;

        // Check for game end first
        if (this.checkGameEnd()) {
            this.endGame();
            return;
        }

        // Handle turn switching
        this.switchTurn();

        // If it's AI mode and now AI's turn, make AI move
        if (this.gameMode === 'ai' && this.currentPlayer === 2 && this.gameActive) {
            this.makeAIMove();
        }
    }

    switchTurn() {
        const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
        
        // Check if next player has valid moves
        if (this.hasValidMoves(nextPlayer)) {
            this.currentPlayer = nextPlayer;
            this.updateDisplay();
            this.updateValidMoves();
        } else {
            // Next player can't move, check if current player can continue
            if (this.hasValidMoves(this.currentPlayer)) {
                this.showMessage(`Player ${nextPlayer} has no valid moves. Player ${this.currentPlayer} continues.`, "info");
                this.updateDisplay();
                this.updateValidMoves();
            } else {
                // Neither player can move, game should end
                // This will be caught by checkGameEnd() on the next call
                this.updateDisplay();
                this.updateValidMoves();
            }
        }
    }

    // Test method to check if modal works
    testModal() {
        console.log('Testing modal...');
        this.showWinModal(1, 5, 3, "Test message - Player 1 wins!");
    }

    makeAIMove() {
        // Add a small delay to make AI moves feel more natural
        setTimeout(() => {
            if (!this.gameActive) return;

            const aiMove = this.getAIMove();
            if (aiMove !== -1) {
                this.makeMove(aiMove);
            }
        }, 800); // 800ms delay for AI move
    }

    getAIMove() {
        const validMoves = [];
        for (let i = 0; i < 25; i++) {
            if (this.isValidMove(i)) {
                validMoves.push(i);
            }
        }

        if (validMoves.length === 0) return -1;

        switch (this.aiDifficulty) {
            case 'easy':
                return this.getRandomMove(validMoves);
            case 'medium':
                return this.getMediumMove(validMoves);
            case 'hard':
                return this.getHardMove(validMoves);
            default:
                return this.getRandomMove(validMoves);
        }
    }

    getRandomMove(validMoves) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    getMediumMove(validMoves) {
        // Medium AI: Mix of strategic and random moves
        const strategicMove = this.getStrategicMove(validMoves);
        
        // 70% chance to make strategic move, 30% random
        if (strategicMove !== -1 && Math.random() < 0.7) {
            return strategicMove;
        }
        
        return this.getRandomMove(validMoves);
    }

    getHardMove(validMoves) {
        // Hard AI: Always tries to make the best strategic move
        const strategicMove = this.getStrategicMove(validMoves);
        return strategicMove !== -1 ? strategicMove : this.getRandomMove(validMoves);
    }

    getStrategicMove(validMoves) {
        let bestMove = -1;
        let bestScore = -Infinity;

        for (let move of validMoves) {
            const score = this.evaluateMove(move);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    evaluateMove(moveIndex) {
        // Create a copy of the board to test the move
        const testBoard = [...this.board];
        testBoard[moveIndex] = 2; // AI is player 2

        let score = 0;
        const row = Math.floor(moveIndex / 5);
        const col = moveIndex % 5;

        // 1. Prefer center positions (higher strategic value)
        const distanceFromCenter = Math.abs(row - 2) + Math.abs(col - 2);
        score += (4 - distanceFromCenter) * 2;

        // 2. Count how many opponent moves this blocks
        const blockedMoves = this.countBlockedOpponentMoves(testBoard, moveIndex);
        score += blockedMoves * 5;

        // 3. Count how many future moves this enables for AI
        const enabledMoves = this.countEnabledAIMoves(testBoard, moveIndex);
        score += enabledMoves * 3;

        // 4. Prefer moves that create territory (isolated areas)
        const territoryScore = this.evaluateTerritory(testBoard, moveIndex, 2);
        score += territoryScore * 4;

        // 5. Block opponent from creating large territories
        const blockingScore = this.evaluateOpponentBlocking(testBoard, moveIndex);
        score += blockingScore * 6;

        return score;
    }

    countBlockedOpponentMoves(testBoard, moveIndex) {
        const row = Math.floor(moveIndex / 5);
        const col = moveIndex % 5;
        let blockedCount = 0;

        // Check orthogonal neighbors
        const neighbors = [
            [row - 1, col], [row + 1, col], 
            [row, col - 1], [row, col + 1]
        ];

        for (let [r, c] of neighbors) {
            if (r >= 0 && r < 5 && c >= 0 && c < 5) {
                const neighborIndex = r * 5 + c;
                if (testBoard[neighborIndex] === null) {
                    // This empty square would be blocked for opponent
                    blockedCount++;
                }
            }
        }

        return blockedCount;
    }

    countEnabledAIMoves(testBoard, moveIndex) {
        // Count empty squares that would still be valid for AI after this move
        let enabledCount = 0;
        const row = Math.floor(moveIndex / 5);
        const col = moveIndex % 5;

        for (let i = 0; i < 25; i++) {
            if (testBoard[i] === null && i !== moveIndex) {
                const testRow = Math.floor(i / 5);
                const testCol = i % 5;
                
                // Check if this position would be valid for AI
                let isValid = true;
                const testNeighbors = [
                    [testRow - 1, testCol], [testRow + 1, testCol],
                    [testRow, testCol - 1], [testRow, testCol + 1]
                ];

                for (let [tr, tc] of testNeighbors) {
                    if (tr >= 0 && tr < 5 && tc >= 0 && tc < 5) {
                        const testNeighborIndex = tr * 5 + tc;
                        if (testBoard[testNeighborIndex] === 1) { // Human player
                            isValid = false;
                            break;
                        }
                    }
                }

                if (isValid) enabledCount++;
            }
        }

        return enabledCount;
    }

    evaluateTerritory(testBoard, moveIndex, player) {
        // Simple territory evaluation - count connected empty spaces
        const visited = new Set();
        let territorySize = 0;

        const floodFill = (index) => {
            if (visited.has(index)) return;
            visited.add(index);

            const row = Math.floor(index / 5);
            const col = index % 5;
            const neighbors = [
                [row - 1, col], [row + 1, col],
                [row, col - 1], [row, col + 1]
            ];

            for (let [r, c] of neighbors) {
                if (r >= 0 && r < 5 && c >= 0 && c < 5) {
                    const neighborIndex = r * 5 + c;
                    if (testBoard[neighborIndex] === null) {
                        territorySize++;
                        floodFill(neighborIndex);
                    }
                }
            }
        };

        floodFill(moveIndex);
        return territorySize;
    }

    evaluateOpponentBlocking(testBoard, moveIndex) {
        // Check if this move breaks up opponent territory
        let blockingScore = 0;
        const row = Math.floor(moveIndex / 5);
        const col = moveIndex % 5;

        // Look for opponent pieces that would be isolated by this move
        const neighbors = [
            [row - 1, col], [row + 1, col],
            [row, col - 1], [row, col + 1]
        ];

        for (let [r, c] of neighbors) {
            if (r >= 0 && r < 5 && c >= 0 && c < 5) {
                const neighborIndex = r * 5 + c;
                if (testBoard[neighborIndex] === 1) { // Human player
                    blockingScore += 3; // Good to be next to opponent territory to block it
                }
            }
        }

        return blockingScore;
    }

    isValidMove(index) {
        // Square must be empty
        if (this.board[index] !== null) {
            return false;
        }

        // Special rule: Player 1 cannot use center square (index 12) on first move
        if (this.currentPlayer === 1 && this.moveCount === 0 && index === 12) {
            return false;
        }

        // Check orthogonal adjacency to opponent pieces
        const row = Math.floor(index / 5);
        const col = index % 5;
        const opponent = this.currentPlayer === 1 ? 2 : 1;

        // Check all orthogonal neighbors (up, down, left, right)
        const neighbors = [
            [row - 1, col], // up
            [row + 1, col], // down
            [row, col - 1], // left
            [row, col + 1]  // right
        ];

        for (let [r, c] of neighbors) {
            if (r >= 0 && r < 5 && c >= 0 && c < 5) {
                const neighborIndex = r * 5 + c;
                if (this.board[neighborIndex] === opponent) {
                    return false; // Cannot place next to opponent
                }
            }
        }

        return true;
    }

    updateSquareDisplay(index) {
        const square = document.querySelector(`[data-index="${index}"]`);
        square.classList.add(`player${this.currentPlayer}`, 'occupied');
        square.textContent = this.currentPlayer === 1 ? '●' : '■';
    }

    updateValidMoves() {
        // Clear previous visual indicators
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('invalid', 'center-blocked');
        });

        // Don't show valid move indicators when AI is thinking/making a move
        if (this.gameMode === 'ai' && this.currentPlayer === 2) {
            return;
        }

        // Mark invalid moves
        for (let i = 0; i < 25; i++) {
            if (this.board[i] === null) { // Only check empty squares
                const square = document.querySelector(`[data-index="${i}"]`);
                
                if (!this.isValidMove(i)) {
                    if (this.currentPlayer === 1 && this.moveCount === 0 && i === 12) {
                        square.classList.add('center-blocked');
                    } else {
                        square.classList.add('invalid');
                    }
                }
            }
        }
    }

    hasValidMoves(player) {
        const originalPlayer = this.currentPlayer;
        this.currentPlayer = player;
        
        for (let i = 0; i < 25; i++) {
            if (this.isValidMove(i)) {
                this.currentPlayer = originalPlayer;
                return true;
            }
        }
        
        this.currentPlayer = originalPlayer;
        return false;
    }

    checkGameEnd() {
        const player1HasMoves = this.hasValidMoves(1);
        const player2HasMoves = this.hasValidMoves(2);
        
        // Game ends only when both players have no valid moves
        return !player1HasMoves && !player2HasMoves;
    }

    endGame() {
        this.gameActive = false;
        
        const player1Count = this.board.filter(cell => cell === 1).length;
        const player2Count = this.board.filter(cell => cell === 2).length;
        
        let winner;
        let message;
        
        if (player1Count > player2Count) {
            winner = 1;
            message = `Player 1 wins with ${player1Count} pieces!`;
        } else if (player2Count > player1Count) {
            winner = 2;
            message = `Player 2 wins with ${player2Count} pieces!`;
        } else {
            message = `It's a tie! Both players have ${player1Count} pieces.`;
        }
        
        setTimeout(() => {
            this.showWinModal(winner, player1Count, player2Count, message);
        }, 500);
    }

    showWinModal(winner, p1Score, p2Score, message) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = 'display: block !important;';
        
        let winnerText;
        if (this.gameMode === 'ai') {
            if (winner === 1) {
                winnerText = '🎉 You Win! 🎉';
            } else if (winner === 2) {
                winnerText = '🤖 AI Wins! 🤖';
            } else {
                winnerText = '🤝 It\'s a Tie! 🤝';
            }
        } else {
            winnerText = winner ? `🎉 Player ${winner} Wins! 🎉` : '🤝 It\'s a Tie! 🤝';
        }
        
        const scoreText = this.gameMode === 'ai' ? 
            `Final Score: You: ${p1Score} pieces | AI: ${p2Score} pieces` :
            `Final Score: Player 1: ${p1Score} pieces | Player 2: ${p2Score} pieces`;
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${winnerText}</h2>
                <p>${message}</p>
                <p>${scoreText}</p>
                <button class="btn" onclick="this.parentElement.parentElement.remove(); game.newGame();">Play Again</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showMessage(text, type = "info") {
        const notification = document.createElement('div');
        const bgColor = type === "error" ? "#FF6B6B" : type === "info" ? "#4ECDC4" : "#FFD700";
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1rem;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.5s ease;
            max-width: 300px;
        `;
        notification.textContent = text;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateDisplay() {
        const player1Label = this.gameMode === 'ai' ? 'You' : 'Player 1';
        const player2Label = this.gameMode === 'ai' ? 'AI' : 'Player 2';
        
        document.getElementById('player1-label').textContent = player1Label;
        document.getElementById('player2-label').textContent = player2Label;
        
        const currentPlayerText = this.gameMode === 'ai' ? 
            (this.currentPlayer === 1 ? 'You' : 'AI') : 
            `Player ${this.currentPlayer}`;
        document.getElementById('current-player').textContent = currentPlayerText;
        
        const player1Count = this.board.filter(cell => cell === 1).length;
        const player2Count = this.board.filter(cell => cell === 2).length;
        
        document.getElementById('player1-score').textContent = player1Count;
        document.getElementById('player2-score').textContent = player2Count;

        // Update game status
        const statusElement = document.getElementById('game-status');
        if (!this.gameActive) {
            statusElement.textContent = "Game Over";
        } else if (this.gameMode === 'ai' && this.currentPlayer === 2) {
            statusElement.textContent = "AI is thinking...";
        } else if (this.currentPlayer === 1 && this.moveCount === 0) {
            statusElement.textContent = "Place your first piece (not center)";
        } else if (!this.hasValidMoves(this.currentPlayer)) {
            statusElement.textContent = "No valid moves - passing turn";
        } else {
            const actionText = this.gameMode === 'ai' ? 
                (this.currentPlayer === 1 ? "Your turn - " : "AI turn - ") : "";
            statusElement.textContent = actionText + "Place your piece on any valid square";
        }
    }

    newGame() {
        this.board = Array(25).fill(null);
        this.currentPlayer = 1;
        this.gameActive = true;
        this.moveCount = 0;
        this.passCount = 0;
        this.createBoard();
        this.updateDisplay();
        this.updateValidMoves();
    }

    setGameMode(mode) {
        this.gameMode = mode;
        this.aiDifficulty = document.getElementById('ai-difficulty').value;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${mode}-mode`).classList.add('active');
        
        const aiControls = document.getElementById('ai-controls');
        aiControls.style.display = mode === 'ai' ? 'block' : 'none';
        
        this.newGame();
    }

    attachEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        
        // Game mode buttons
        document.getElementById('pvp-mode').addEventListener('click', () => this.setGameMode('pvp'));
        document.getElementById('ai-mode').addEventListener('click', () => this.setGameMode('ai'));
        
        // AI difficulty selector
        document.getElementById('ai-difficulty').addEventListener('change', (e) => {
            this.aiDifficulty = e.target.value;
        });
    }
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Initialize the game when the page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new BritishSquareGame();
});
