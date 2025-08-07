class BritishSquareGame {
  constructor() {
    this.board = Array(25).fill(null); // 5x5 board
    this.currentPlayer = 1;
    this.gameActive = true;
    this.moveCount = 0;
    this.passCount = 0;
    this.gameMode = "ai"; // 'pvp' or 'ai'
    this.aiDifficulty = "hardv3"; // default to newest elite AI
    // Multi-round match: cumulative net difference points, first to break 7 wins
    this.matchScore = { 1: 0, 2: 0 };
    this.roundNumber = 1;
  this.lastRoundStarter = 1; // track previous round's starter for alternation

    this.initializeGame();
    this.attachEventListeners();
  }

  initializeGame() {
    this.createBoard();
    this.updateDisplay();
    this.updateValidMoves();
  }

  createBoard() {
    const gameBoard = document.getElementById("game-board");
    gameBoard.innerHTML = "";

    for (let i = 0; i < 25; i++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.dataset.index = i;
      square.addEventListener("click", () => this.handleSquareClick(i));
      gameBoard.appendChild(square);
    }
  }

  handleSquareClick(index) {
    if (!this.gameActive || this.board[index] !== null) {
      return;
    }

    // In AI mode, only allow human player (Player 1) to click
    if (this.gameMode === "ai" && this.currentPlayer === 2) {
      return;
    }

    // Check if move is valid
    if (!this.isValidMove(index)) {
      this.showMessage(
        "Invalid move! Cannot place next to opponent pieces.",
        "error"
      );
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
    if (this.gameMode === "ai" && this.currentPlayer === 2 && this.gameActive) {
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
        this.showMessage(
          `Player ${nextPlayer} has no valid moves. Player ${this.currentPlayer} continues.`,
          "info"
        );
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

  // (Removed deprecated testModal that referenced old single-round modal)

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
      case "easy":
        return this.getRandomMove(validMoves);
      case "medium":
        return this.getMediumMove(validMoves);
      case "hard":
        return this.getHardMove(validMoves);
      case "hardv2":
        return this.getHardV2Move(validMoves);
      case "hardv3":
        return this.getHardV3Move(validMoves);
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
    return strategicMove !== -1
      ? strategicMove
      : this.getRandomMove(validMoves);
  }

  getHardV2Move(validMoves) {
    // Hard v2 AI: Ultra-aggressive AI with deep calculation
    // This AI will be extremely difficult to beat

    this.transpositionTable = this.transpositionTable || new Map();
    this.killerMoves = this.killerMoves || new Map();
    this.searchStartTime = Date.now();
    this.maxSearchTime = 3000; // 3 seconds for deeper thinking

    // Use opening book for early game advantage
    if (this.moveCount <= 3) {
      const openingMove = this.getOpeningBookMove(validMoves);
      if (openingMove !== -1) return openingMove;
    }

    // Enhanced strategic evaluation with aggressive weights
    let bestMove = -1;
    let bestScore = -Infinity;

    // Evaluate each move with enhanced criteria
    for (let move of validMoves) {
      let score = this.evaluateAdvancedMove(move);

      // Add deep lookahead bonus for promising moves
      if (score > 50) {
        score += this.getLookaheadBonus(move, 3);
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    // If we found a very strong move (score > 100), take it immediately
    if (bestScore > 100) {
      return bestMove;
    }

    // For critical positions, use deeper analysis
    if (this.moveCount > 10 || this.isPositionCritical()) {
      const minimaxMove = this.getMinimaxMove(validMoves, 5);
      if (minimaxMove !== -1) {
        return minimaxMove;
      }
    }

    // Default to best evaluated move
    return bestMove !== -1 ? bestMove : this.getStrategicMove(validMoves);
  }

  getMinimaxMove(validMoves, maxDepth) {
    let bestMove = -1;
    let bestScore = -Infinity;

    try {
      for (let move of validMoves) {
        // Save game state
        const originalBoard = [...this.board];
        const originalPlayer = this.currentPlayer;
        const originalMoveCount = this.moveCount;

        // Make the move
        this.board[move] = this.currentPlayer;
        this.moveCount++;
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

        // Evaluate with minimax
        const score = this.minimax(maxDepth - 1, -Infinity, Infinity, false);

        // Restore state
        this.board = originalBoard;
        this.currentPlayer = originalPlayer;
        this.moveCount = originalMoveCount;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    } catch (error) {
      console.log("Minimax calculation error:", error);
      return -1;
    }

    return bestMove;
  }

  // ========================= HARD V3 (ELITE) AI =========================
  // Completely new engine: iterative deepening negamax with alpha-beta, TT, killer moves,
  // history heuristic, late move reduction, aspiration windows & enhanced evaluation.
  // Goal: Significantly stronger play within a time budget.
  getHardV3Move(validMoves) {
    if (!this.hardV3) this.initHardV3Engine();

    // Opening book still leveraged from earlier routine for first few plies
    if (this.moveCount <= 4) {
      const book = this.getOpeningBookMove(validMoves);
      if (book !== -1) return book;
    }

    // Endgame exact solver when few empty squares remain
    const empties = this.countEmptySquares();
    if (empties <= 6) {
      const exact = this.solveEndgame(validMoves, empties);
      if (exact.move !== -1) return exact.move;
    }

    const timeLimitMs = 3200; // slightly longer thinking time
    const startTime = performance.now();
    const deadline = startTime + timeLimitMs;

    // Iterative deepening
    let bestMove = validMoves[0];
    let bestScore = -Infinity;
    let aspirationWindow = 50; // initial aspiration window size
    let lastScore = 0;
    const MAX_DEPTH = 20; // board small; practical depth limited by time

    // Principal Variation storage
    this.hardV3.pv = [];

    let prevBest = null;

    for (let depth = 1; depth <= MAX_DEPTH; depth++) {
      if (performance.now() > deadline) break;

      let alpha = lastScore - aspirationWindow;
      let beta = lastScore + aspirationWindow;
      let score;
      let move;

      // Aspiration window re-search logic
      while (true) {
        const result = this.negamaxRoot(
          depth,
          alpha,
          beta,
          deadline,
          validMoves,
          prevBest
        );
        score = result.score;
        move = result.move;

        if (score <= alpha) {
          // fail-low
          alpha -= aspirationWindow * 2;
        } else if (score >= beta) {
          // fail-high
          beta += aspirationWindow * 2;
        } else {
          break;
        }
        aspirationWindow *= 2;
        if (performance.now() > deadline) break;
      }

      if (performance.now() > deadline) break;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      lastScore = score;
      prevBest = bestMove;

      // If decisive score found (very large), stop early
      if (Math.abs(bestScore) > 9000) break;
    }

    return bestMove;
  }

  initHardV3Engine() {
    const rand64 = () => {
      // Build 64-bit BigInt from 4 x 16 random bits
      let r = 0n;
      for (let i = 0; i < 4; i++) {
        r = (r << 16n) ^ BigInt(Math.floor(Math.random() * 0x10000));
      }
      return r;
    };
    const zobristTable = Array.from({ length: 25 }, () => ({
      p1: rand64(),
      p2: rand64(),
    }));
    this.hardV3 = {
      zobristTable,
      killer: Array.from({ length: 64 }, () => []), // killer moves per depth
      history: new Map(), // move -> score
      tt: new Map(), // zobrist string -> {depth, flag, score, move}
      nodes: 0,
      pv: [],
    };
  }

  computeZobristKey() {
    let key = 0n;
    for (let i = 0; i < 25; i++) {
      if (this.board[i] === 1) key ^= this.hardV3.zobristTable[i].p1;
      else if (this.board[i] === 2) key ^= this.hardV3.zobristTable[i].p2;
    }
    // Include side to move
    if (this.currentPlayer === 2) key ^= 0x12345n; // simple side key
    return key.toString();
  }

  negamaxRoot(depth, alpha, beta, deadline, rootMoves, prevBest) {
    let bestScore = -Infinity;
    let bestMove = rootMoves[0];
    const ordered = this.orderRootMoves(rootMoves, depth, prevBest);
    for (let move of ordered) {
      if (performance.now() > deadline) break;
      const state = this.pushMove(move);
      const score = -this.negamax(depth - 1, -beta, -alpha, deadline, 1);
      this.popMove(state);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      if (bestScore > alpha) alpha = bestScore;
      if (alpha >= beta) {
        this.storeKillerV3(move, 0);
        break;
      }
    }
    return { move: bestMove, score: bestScore };
  }

  pushMove(move) {
    const snapshot = {
      board: this.board[move],
      currentPlayer: this.currentPlayer,
      moveCount: this.moveCount,
    };
    this.board[move] = this.currentPlayer;
    this.moveCount++;
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    return { move, snapshot };
  }

  popMove(state) {
    const { move, snapshot } = state;
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1; // revert turn first
    this.moveCount--;
    this.board[move] = snapshot.board;
    // currentPlayer already reverted above
  }

  negamax(depth, alpha, beta, deadline, ply) {
    // Time check
    if (performance.now() > deadline) return this.evaluateV3Position();

    // Terminal / depth base
    if (this.checkGameEnd()) {
      return this.evaluateEndForV3();
    }
    if (depth === 0) {
      return this.quiescenceV3(alpha, beta, deadline);
    }

    const originalAlpha = alpha;
    const originalBeta = beta;

    const zobrist = this.computeZobristKey();
    const ttEntry = this.hardV3.tt.get(zobrist);
    if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === "EXACT") return ttEntry.score;
      else if (ttEntry.flag === "LOWER" && ttEntry.score > alpha)
        alpha = ttEntry.score;
      else if (ttEntry.flag === "UPPER" && ttEntry.score < beta)
        beta = ttEntry.score;
      if (alpha >= beta) return ttEntry.score;
    }

    // Null move pruning (conservative). Avoid in endgame (few empties) or shallow depth.
    if (depth >= 3 && this.countEmptySquares() > 8) {
      // Try a null move: skip turn (if passing is legal conceptually). We simulate by toggling player without placing.
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      const nullScore = -this.negamax(
        depth - 3,
        -beta,
        -beta + 1,
        deadline,
        ply + 1
      ); // reduction R=2 (depth-1-2)
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      if (nullScore >= beta) {
        return beta; // fail-hard beta cutoff
      }
    }

    let moves = this.getValidMovesForPlayer(this.currentPlayer);
    if (moves.length === 0) {
      // Pass turn
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      const score = -this.negamax(depth - 1, -beta, -alpha, deadline, ply + 1);
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      return score;
    }

    // Move ordering
    moves = this.orderHardV3Moves(moves, depth, ttEntry ? ttEntry.move : null);

    let bestMove = moves[0];
    let value = -Infinity;
    let legalCount = 0;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const state = this.pushMove(move);

      // Selective / extension heuristics
      let extension = 0;
      // Extension: taking center late, or move blocks >=3 opponent moves
      if (
        (move === 12 && this.board[12] === null) ||
        this.countBlockedOpponentMoves([...this.board], move) >= 3
      ) {
        extension = 1;
      }

      // Late Move Reduction (skip or reduce depth for later, less-promising moves)
      let newDepth = depth - 1;
      if (i > 4 && depth > 2 && extension === 0) newDepth = depth - 2; // reduce
      if (extension) newDepth = depth - 1 + extension; // extend

      let score = -this.negamax(newDepth, -beta, -alpha, deadline, ply + 1);

      // If reduced search triggers potential improvement, research at full depth
      if (newDepth !== depth - 1 && score > alpha) {
        score = -this.negamax(depth - 1, -beta, -alpha, deadline, ply + 1);
      }

      this.popMove(state);
      legalCount++;

      if (score > value) {
        value = score;
        bestMove = move;
      }
      if (value > alpha) {
        alpha = value;
      }
      if (alpha >= beta) {
        this.storeKillerV3(move, ply);
        this.updateHistoryHeuristic(move, depth);
        break;
      }
      this.updateHistoryHeuristic(move, depth);
      if (performance.now() > deadline) break;
    }

    // Store TT entry
    let flag = "EXACT";
    if (value <= originalAlpha) flag = "UPPER"; // fail-low
    else if (value >= originalBeta) flag = "LOWER"; // fail-high
    this.hardV3.tt.set(zobrist, { depth, flag, score: value, move: bestMove });
    return value;
  }

  quiescenceV3(alpha, beta, deadline) {
    // For this placement game, we approximate 'noisy' moves as those that heavily block opponent.
    const standPat = this.evaluateV3Position();
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    const tacticalMoves = this.getTacticalMoves().slice(0, 6); // limit
    for (let move of tacticalMoves) {
      if (performance.now() > deadline) break;
      const state = this.pushMove(move);
      const score = -this.quiescenceV3(-beta, -alpha, deadline);
      this.popMove(state);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  orderHardV3Moves(moves, depth, ttMove) {
    const scored = moves.map((m) => ({
      move: m,
      score: 0,
    }));
    for (let obj of scored) {
      if (ttMove === obj.move) obj.score += 50000;
      // Killer moves heuristic
      if (
        this.hardV3.killer[depth] &&
        this.hardV3.killer[depth].includes(obj.move)
      )
        obj.score += 30000;
      // History heuristic
      obj.score += this.hardV3.history.get(obj.move) || 0;
      // Static evaluation ordering
      obj.score += this.evaluateMove(obj.move);
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.map((o) => o.move);
  }

  storeKillerV3(move, depth) {
    const list = this.hardV3.killer[depth];
    if (!list.includes(move)) {
      list.unshift(move);
      if (list.length > 2) list.pop();
    }
  }

  updateHistoryHeuristic(move, depth) {
    const prev = this.hardV3.history.get(move) || 0;
    this.hardV3.history.set(move, prev + depth * depth);
  }

  evaluateV3Position() {
    // Enhanced evaluation tuned for Hard v3
    // Components: material (piece count), mobility, territory, centrality, opponent blocking, pattern bonuses.
    const p1 = this.board.filter((c) => c === 1).length;
    const p2 = this.board.filter((c) => c === 2).length;
    const empties = this.countEmptySquares();
    // Game phase factor (0 = opening, 1 = endgame)
    const phase = 1 - empties / 25;
    let score = (p2 - p1) * (120 + phase * 40); // piece importance grows slightly

    // Mobility (future options)
    const p1Mob = this.getValidMovesForPlayer(1).length;
    const p2Mob = this.getValidMovesForPlayer(2).length;
    score += (p2Mob - p1Mob) * (15 + phase * 30); // mobility weight increases midgame

    // Central control & strategic squares
    const strategicWeights = [12, 7, 11, 13, 17, 6, 8, 16, 18];
    for (let idx of strategicWeights) {
      if (this.board[idx] === 2) score += 18;
      else if (this.board[idx] === 1) score -= 18;
    }

    // Territory (reuse existing advanced territory)
    score +=
      (this.evaluateAdvancedTerritory(2) - this.evaluateAdvancedTerritory(1)) *
      15;

    // Influence map difference
    score += (this.evaluateInfluenceMap(2) - this.evaluateInfluenceMap(1)) * 10;

    // Edge wall potential
    score +=
      (this.evaluateEdgeWalls(2) - this.evaluateEdgeWalls(1)) *
      (8 + phase * 10);

    // Penalty if AI lags midgame
    if (this.moveCount > 8 && p2 < p1) score -= (p1 - p2) * 40;

    // Tempo bonus: whose turn (favor side to move slightly)
    if (this.currentPlayer === 2) score += 6;

    // Compactness / clustering: reward AI for connected groups
    score += this.evaluateClusterBonus(2) - this.evaluateClusterBonus(1);

    return score;
  }

  evaluateClusterBonus(player) {
    // Counts adjacent (orthogonal) friendly pairs to encourage cohesive shape
    let bonus = 0;
    for (let i = 0; i < 25; i++) {
      if (this.board[i] !== player) continue;
      const r = Math.floor(i / 5),
        c = i % 5;
      const neighbors = [
        [r + 1, c],
        [r, c + 1],
      ]; // avoid double-counting by only down/right
      for (let [nr, nc] of neighbors) {
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
          const ni = nr * 5 + nc;
          if (this.board[ni] === player) bonus += 3;
        }
      }
    }
    return bonus;
  }

  orderRootMoves(moves, depth, prevBest) {
    // Prioritize previous best, then transposition-guided ordering
    const scored = moves.map((m) => ({ move: m, score: 0 }));
    for (let obj of scored) {
      if (prevBest === obj.move) obj.score += 60000;
      obj.score += this.evaluateMove(obj.move);
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.map((o) => o.move);
  }

  countEmptySquares() {
    let c = 0;
    for (let i = 0; i < 25; i++) if (this.board[i] === null) c++;
    return c;
  }

  solveEndgame(validMoves, empties) {
    // Perform exact DFS search of remaining game tree (small) to select optimal move.
    let bestMove = -1;
    let bestScore = -Infinity;
    for (let move of validMoves) {
      const state = this.pushMove(move);
      const score = -this.endgameDFS(empties - 1);
      this.popMove(state);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return { move: bestMove, score: bestScore };
  }

  endgameDFS(remaining) {
    if (this.checkGameEnd() || remaining === 0) {
      return this.evaluateEndForV3();
    }
    const moves = this.getValidMovesForPlayer(this.currentPlayer);
    if (moves.length === 0) {
      // Pass
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      const score = -this.endgameDFS(remaining);
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      return score;
    }
    let value = -Infinity;
    for (let move of moves) {
      const state = this.pushMove(move);
      const score = -this.endgameDFS(remaining - 1);
      this.popMove(state);
      if (score > value) value = score;
    }
    return value;
  }

  evaluateEndForV3() {
    const p1 = this.board.filter((c) => c === 1).length;
    const p2 = this.board.filter((c) => c === 2).length;
    if (p2 > p1) return 10000 + (p2 - p1) * 200;
    if (p1 > p2) return -10000 - (p1 - p2) * 200;
    return 0;
  }

  minimax(depth, alpha, beta, isMaximizing) {
    // Check for game end
    if (this.checkGameEnd()) {
      return this.evaluateGameEnd();
    }

    if (depth === 0) {
      return this.evaluatePosition();
    }

    const validMoves = this.getValidMovesForPlayer(this.currentPlayer);

    if (validMoves.length === 0) {
      // Pass turn
      const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
      if (this.hasValidMoves(nextPlayer)) {
        this.currentPlayer = nextPlayer;
        const score = this.minimax(depth, alpha, beta, !isMaximizing);
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        return score;
      } else {
        return this.evaluateGameEnd();
      }
    }

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let move of validMoves) {
        const originalBoard = [...this.board];
        const originalPlayer = this.currentPlayer;
        const originalMoveCount = this.moveCount;

        this.board[move] = this.currentPlayer;
        this.moveCount++;
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

        const score = this.minimax(depth - 1, alpha, beta, false);

        this.board = originalBoard;
        this.currentPlayer = originalPlayer;
        this.moveCount = originalMoveCount;

        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);

        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let move of validMoves) {
        const originalBoard = [...this.board];
        const originalPlayer = this.currentPlayer;
        const originalMoveCount = this.moveCount;

        this.board[move] = this.currentPlayer;
        this.moveCount++;
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

        const score = this.minimax(depth - 1, alpha, beta, true);

        this.board = originalBoard;
        this.currentPlayer = originalPlayer;
        this.moveCount = originalMoveCount;

        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);

        if (beta <= alpha) break;
      }
      return minScore;
    }
  }

  evaluateGameEnd() {
    const player1Count = this.board.filter((cell) => cell === 1).length;
    const player2Count = this.board.filter((cell) => cell === 2).length;

    if (player2Count > player1Count) {
      return 10000 + (player2Count - player1Count) * 100; // AI wins
    } else if (player1Count > player2Count) {
      return -10000 - (player1Count - player2Count) * 100; // AI loses
    } else {
      return 0; // Tie
    }
  }

  isPositionCritical() {
    // Position is critical if game is near end or if territory is highly contested
    const emptySquares = this.board.filter((cell) => cell === null).length;
    return emptySquares < 8 || this.moveCount > 15;
  }

  evaluateAdvancedMove(moveIndex) {
    // Much more sophisticated move evaluation
    const testBoard = [...this.board];
    testBoard[moveIndex] = 2; // AI is player 2

    let score = 0;
    const row = Math.floor(moveIndex / 5);
    const col = moveIndex % 5;

    // 1. Aggressive territory control (heavily weighted)
    const territoryControl = this.evaluateAdvancedTerritoryControl(
      testBoard,
      moveIndex
    );
    score += territoryControl * 20;

    // 2. Blocking opponent moves (very important)
    const blockedMoves = this.countBlockedOpponentMoves(testBoard, moveIndex);
    score += blockedMoves * 25;

    // 3. Strategic position value with enhanced weights
    const positionValue = this.getEnhancedPositionValue(row, col);
    score += positionValue * 15;

    // 4. Deny opponent key positions
    const denialScore = this.evaluateOpponentDenial(testBoard, moveIndex);
    score += denialScore * 30;

    // 5. Create winning patterns
    const patternScore = this.evaluateWinningPatterns(testBoard, moveIndex);
    score += patternScore * 25;

    // 6. Endgame optimization
    if (this.moveCount > 12) {
      const endgameScore = this.evaluateEndgameAdvantage(testBoard, moveIndex);
      score += endgameScore * 40;
    }

    // 7. Mobility advantage
    const mobilityScore = this.evaluateMobilityAdvantage(testBoard, moveIndex);
    score += mobilityScore * 10;

    return score;
  }

  getEnhancedPositionValue(row, col) {
    let value = 0;

    // Center control is crucial
    const centerDistance = Math.abs(row - 2) + Math.abs(col - 2);
    value += (4 - centerDistance) * 5;

    // Key strategic positions
    const keyPositions = [
      { row: 1, col: 1, value: 15 },
      { row: 1, col: 3, value: 15 },
      { row: 3, col: 1, value: 15 },
      { row: 3, col: 3, value: 15 }, // Inner corners
      { row: 2, col: 2, value: 20 }, // Center
      { row: 1, col: 2, value: 12 },
      { row: 3, col: 2, value: 12 }, // Vertical center
      { row: 2, col: 1, value: 12 },
      { row: 2, col: 3, value: 12 }, // Horizontal center
    ];

    for (let pos of keyPositions) {
      if (row === pos.row && col === pos.col) {
        value += pos.value;
        break;
      }
    }

    // Corner positions are valuable in endgame
    if ((row === 0 || row === 4) && (col === 0 || col === 4)) {
      value += this.moveCount > 10 ? 10 : 5;
    }

    return value;
  }

  evaluateAdvancedTerritoryControl(testBoard, moveIndex) {
    // Advanced territory evaluation
    let score = 0;
    const row = Math.floor(moveIndex / 5);
    const col = moveIndex % 5;

    // Count controlled empty squares around this position
    for (let r = Math.max(0, row - 2); r <= Math.min(4, row + 2); r++) {
      for (let c = Math.max(0, col - 2); c <= Math.min(4, col + 2); c++) {
        const index = r * 5 + c;
        if (testBoard[index] === null) {
          const distance = Math.abs(r - row) + Math.abs(c - col);
          if (distance <= 2) {
            // Check if opponent can reach this square
            if (!this.canOpponentReachSquare(index, testBoard)) {
              score += 3 - distance; // Closer squares worth more
            }
          }
        }
      }
    }

    return score;
  }

  canOpponentReachSquare(squareIndex, testBoard) {
    const row = Math.floor(squareIndex / 5);
    const col = squareIndex % 5;

    // Check if placing here would be adjacent to any opponent piece
    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    for (let [r, c] of neighbors) {
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        const neighborIndex = r * 5 + c;
        if (testBoard[neighborIndex] === 1) {
          // Opponent piece
          return false; // Opponent cannot place here
        }
      }
    }

    return true; // Opponent could potentially place here
  }

  evaluateOpponentDenial(testBoard, moveIndex) {
    // Evaluate how much this move hurts the opponent
    let denialScore = 0;

    // Count opponent pieces that become more isolated
    for (let i = 0; i < 25; i++) {
      if (this.board[i] === 1) {
        // Opponent piece
        const originalMobility = this.countAdjacentEmpty(i, this.board);
        const newMobility = this.countAdjacentEmpty(i, testBoard);
        denialScore += (originalMobility - newMobility) * 3;
      }
    }

    return denialScore;
  }

  countAdjacentEmpty(index, board) {
    const row = Math.floor(index / 5);
    const col = index % 5;
    let count = 0;

    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    for (let [r, c] of neighbors) {
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        const neighborIndex = r * 5 + c;
        if (board[neighborIndex] === null) {
          count++;
        }
      }
    }

    return count;
  }

  evaluateWinningPatterns(testBoard, moveIndex) {
    // Look for patterns that lead to winning positions
    let patternScore = 0;
    const row = Math.floor(moveIndex / 5);
    const col = moveIndex % 5;

    // Cross pattern control
    if (row === 2 || col === 2) {
      patternScore += 5;
    }

    // Diagonal strength
    if (row === col || row + col === 4) {
      patternScore += 3;
    }

    // Edge blocking patterns
    if (this.isEdgeBlockingPosition(row, col)) {
      patternScore += 8;
    }

    return patternScore;
  }

  isEdgeBlockingPosition(row, col) {
    // Positions that effectively block opponent edge strategies
    const blockingPositions = [
      { row: 1, col: 0 },
      { row: 1, col: 4 }, // Block top corners
      { row: 3, col: 0 },
      { row: 3, col: 4 }, // Block bottom corners
      { row: 0, col: 1 },
      { row: 0, col: 3 }, // Block left corners
      { row: 4, col: 1 },
      { row: 4, col: 3 }, // Block right corners
      { row: 2, col: 0 },
      { row: 2, col: 4 }, // Block center edges
      { row: 0, col: 2 },
      { row: 4, col: 2 }, // Block center edges
    ];

    return blockingPositions.some((pos) => pos.row === row && pos.col === col);
  }

  evaluateEndgameAdvantage(testBoard, moveIndex) {
    // In endgame, focus on piece count maximization
    let endgameScore = 0;

    // Prefer moves that guarantee more pieces
    const aiPieces = testBoard.filter((cell) => cell === 2).length;
    const humanPieces = testBoard.filter((cell) => cell === 1).length;

    endgameScore += (aiPieces - humanPieces) * 10;

    // Prefer moves that limit opponent's future expansion
    const opponentFutureMoves = this.countPotentialOpponentMoves(testBoard);
    endgameScore += 10 - opponentFutureMoves; // Fewer opponent moves is better

    return endgameScore;
  }

  countPotentialOpponentMoves(testBoard) {
    let count = 0;
    for (let i = 0; i < 25; i++) {
      if (testBoard[i] === null) {
        if (this.isValidMoveForPlayer(i, 1, testBoard)) {
          count++;
        }
      }
    }
    return count;
  }

  isValidMoveForPlayer(index, player, board) {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const opponent = player === 1 ? 2 : 1;

    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    for (let [r, c] of neighbors) {
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        const neighborIndex = r * 5 + c;
        if (board[neighborIndex] === opponent) {
          return false;
        }
      }
    }

    return true;
  }

  evaluateMobilityAdvantage(testBoard, moveIndex) {
    // Calculate future mobility advantage
    const aiFutureMoves = this.countPotentialMoves(testBoard, 2);
    const humanFutureMoves = this.countPotentialMoves(testBoard, 1);

    return (aiFutureMoves - humanFutureMoves) * 2;
  }

  countPotentialMoves(testBoard, player) {
    let count = 0;
    for (let i = 0; i < 25; i++) {
      if (testBoard[i] === null) {
        if (this.isValidMoveForPlayer(i, player, testBoard)) {
          count++;
        }
      }
    }
    return count;
  }

  getLookaheadBonus(moveIndex, depth) {
    if (depth === 0) return 0;

    // Simple lookahead to see if this move leads to good positions
    const originalBoard = [...this.board];
    const originalPlayer = this.currentPlayer;

    this.board[moveIndex] = this.currentPlayer;
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

    const futureScore = this.evaluatePosition();

    this.board = originalBoard;
    this.currentPlayer = originalPlayer;

    return Math.max(0, futureScore / 10); // Small bonus for good future positions
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

  // Minimax implementation inspired by nullprogram.com article
  minimaxWithOptimizations(
    moveIndex,
    depth,
    alpha,
    beta,
    isMaximizing,
    plyDepth
  ) {
    // Time cutoff check
    if (
      this.searchStartTime &&
      Date.now() - this.searchStartTime > this.maxSearchTime
    ) {
      return this.evaluatePosition();
    }

    // Create game state representation for memoization
    const gameState = this.encodeGameState(moveIndex, isMaximizing);

    // Check transposition table for previously computed results
    if (this.transpositionTable.has(gameState)) {
      const cached = this.transpositionTable.get(gameState);
      if (cached.depth >= depth) {
        return cached.score;
      }
    }

    // Save original state
    const originalBoard = [...this.board];
    const originalPlayer = this.currentPlayer;
    const originalMoveCount = this.moveCount;

    // Make the move
    this.board[moveIndex] = this.currentPlayer;
    this.moveCount++;
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

    let result;

    // Terminal conditions - check for game end
    if (this.checkGameEnd()) {
      result = this.evaluateTerminalPosition();
      // Restore state
      this.board = originalBoard;
      this.currentPlayer = originalPlayer;
      this.moveCount = originalMoveCount;

      this.transpositionTable.set(gameState, { score: result, depth: depth });
      return result;
    }

    // Depth limit reached - use evaluation
    if (depth === 0) {
      result = this.evaluatePosition();
      // Restore state
      this.board = originalBoard;
      this.currentPlayer = originalPlayer;
      this.moveCount = originalMoveCount;

      this.transpositionTable.set(gameState, { score: result, depth: 0 });
      return result;
    }

    const validMoves = this.getValidMovesForPlayer(this.currentPlayer);

    if (validMoves.length === 0) {
      // No moves available, switch player or end game
      const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
      const nextValidMoves = this.getValidMovesForPlayer(nextPlayer);

      if (nextValidMoves.length === 0) {
        // Game ends
        result = this.evaluateTerminalPosition();
        // Restore state
        this.board = originalBoard;
        this.currentPlayer = originalPlayer;
        this.moveCount = originalMoveCount;

        this.transpositionTable.set(gameState, { score: result, depth: depth });
        return result;
      } else {
        // Switch to next player and continue with same depth
        this.currentPlayer = nextPlayer;
        // Continue search with flipped maximizing since we switched players
        result = this.minimaxWithOptimizations(
          -1,
          depth,
          alpha,
          beta,
          !isMaximizing,
          plyDepth
        );
        // Restore state
        this.board = originalBoard;
        this.currentPlayer = originalPlayer;
        this.moveCount = originalMoveCount;

        this.transpositionTable.set(gameState, { score: result, depth: depth });
        return result;
      }
    }

    // Order moves for better alpha-beta pruning
    const orderedMoves = this.orderMovesForSearch(validMoves, plyDepth);

    let value;
    // Simple approach: AI (player 2) maximizes, human (player 1) minimizes
    if (this.currentPlayer === 2) {
      // AI turn - maximize
      value = -Infinity;
      for (let move of orderedMoves) {
        const eval_score = this.minimaxWithOptimizations(
          move,
          depth - 1,
          alpha,
          beta,
          true,
          plyDepth + 1
        );
        value = Math.max(value, eval_score);
        alpha = Math.max(alpha, eval_score);

        if (beta <= alpha) {
          this.storeKillerMove(move, plyDepth);
          break; // Alpha-beta pruning
        }
      }
    } else {
      // Human turn - minimize
      value = Infinity;
      for (let move of orderedMoves) {
        const eval_score = this.minimaxWithOptimizations(
          move,
          depth - 1,
          alpha,
          beta,
          false,
          plyDepth + 1
        );
        value = Math.min(value, eval_score);
        beta = Math.min(beta, eval_score);

        if (beta <= alpha) {
          this.storeKillerMove(move, plyDepth);
          break; // Alpha-beta pruning
        }
      }
    }

    // Restore game state
    this.board = originalBoard;
    this.currentPlayer = originalPlayer;
    this.moveCount = originalMoveCount;

    // Store in transposition table with depth information
    this.transpositionTable.set(gameState, { score: value, depth: depth });
    return value;
  }

  // Opening book based on strong positions from analysis
  getOpeningBookMove(validMoves) {
    // Ultra-aggressive opening moves for AI (player 2) - prioritize center control and blocking

    // First, check if we can take center (very strong if available)
    if (
      this.moveCount === 1 &&
      validMoves.includes(12) &&
      this.board[12] === null
    ) {
      return 12; // Take center if human didn't
    }

    // Prioritized opening moves based on game theory and blocking strategies
    const aggressiveOpenings = [
      // Tier 1: Center and near-center control (highest priority)
      12, // Center (if available)
      7,
      11,
      13,
      17, // Cross positions (block center access)

      // Tier 2: Inner corners (excellent positional value)
      6,
      8,
      16,
      18,

      // Tier 3: Strategic blocking positions
      1,
      3,
      21,
      23, // Corner-adjacent positions
      2,
      10,
      14,
      22, // Edge centers (strong control)

      // Tier 4: Corner positions (good for endgame)
      0,
      4,
      20,
      24,

      // Tier 5: Other edges (still valuable)
      5,
      9,
      15,
      19,
    ];

    // Filter to only valid moves and prioritize by tier
    for (let move of aggressiveOpenings) {
      if (validMoves.includes(move) && this.board[move] === null) {
        // Special logic for countering human's first move
        if (this.moveCount === 1) {
          const humanFirstMove = this.board.findIndex((cell) => cell === 1);
          if (humanFirstMove !== -1) {
            const counterMove = this.getCounterMove(humanFirstMove, validMoves);
            if (counterMove !== -1) {
              return counterMove;
            }
          }
        }

        return move;
      }
    }

    // If no predefined opening available, choose strategically
    return this.getStrategicOpening(validMoves);
  }

  getCounterMove(humanMove, validMoves) {
    // Specific counter-strategies for human's opening move
    const row = Math.floor(humanMove / 5);
    const col = humanMove % 5;

    // If human takes edge, counter with center control
    if (row === 0 || row === 4 || col === 0 || col === 4) {
      const centerMoves = [12, 7, 11, 13, 17]; // Center and cross
      for (let move of centerMoves) {
        if (validMoves.includes(move)) return move;
      }
    }

    // If human takes inner position, block their expansion aggressively
    if (row >= 1 && row <= 3 && col >= 1 && col <= 3) {
      // Take position that blocks maximum expansion
      const blockingMoves = [
        6,
        8,
        16,
        18, // Inner corners
        7,
        11,
        13,
        17, // Cross positions
      ];
      for (let move of blockingMoves) {
        if (
          validMoves.includes(move) &&
          this.isGoodBlockingMove(move, humanMove)
        ) {
          return move;
        }
      }
    }

    return -1; // No specific counter found
  }

  isGoodBlockingMove(aiMove, humanMove) {
    // Check if AI move effectively blocks human expansion
    const aiRow = Math.floor(aiMove / 5);
    const aiCol = aiMove % 5;
    const humanRow = Math.floor(humanMove / 5);
    const humanCol = humanMove % 5;

    // Good blocking moves are close enough to interfere but not adjacent
    const distance = Math.abs(aiRow - humanRow) + Math.abs(aiCol - humanCol);
    return distance >= 2 && distance <= 3;
  }

  getStrategicOpening(validMoves) {
    // If no book moves available, choose the most strategic position
    let bestMove = -1;
    let bestScore = -Infinity;

    for (let move of validMoves) {
      const score = this.evaluateOpeningMove(move);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  evaluateOpeningMove(moveIndex) {
    const row = Math.floor(moveIndex / 5);
    const col = moveIndex % 5;
    let score = 0;

    // Center control is paramount
    const centerDistance = Math.abs(row - 2) + Math.abs(col - 2);
    score += (4 - centerDistance) * 10;

    // Bonus for key strategic squares
    if (moveIndex === 12) score += 20; // Center
    if ([6, 8, 16, 18].includes(moveIndex)) score += 15; // Inner corners
    if ([7, 11, 13, 17].includes(moveIndex)) score += 12; // Cross

    // Penalty for edge positions in opening (unless strategic)
    if (row === 0 || row === 4 || col === 0 || col === 4) {
      score -= 5;
    }

    return score;
  }

  orderMoves(validMoves, previousBest) {
    // Simple move ordering - put previous best first
    if (previousBest !== -1 && validMoves.includes(previousBest)) {
      return [previousBest, ...validMoves.filter((m) => m !== previousBest)];
    }
    return validMoves;
  }

  orderMovesForSearch(validMoves, plyDepth) {
    // Advanced move ordering for better alpha-beta pruning
    const moveScores = validMoves.map((move) => ({
      move: move,
      score: this.getMoveOrderingScore(move, plyDepth),
    }));

    // Sort by score descending
    moveScores.sort((a, b) => b.score - a.score);
    return moveScores.map((ms) => ms.move);
  }

  getMoveOrderingScore(move, plyDepth) {
    let score = 0;

    // Killer move heuristic
    if (
      this.killerMoves.has(plyDepth) &&
      this.killerMoves.get(plyDepth).includes(move)
    ) {
      score += 1000;
    }

    // Quick positional evaluation
    const row = Math.floor(move / 5);
    const col = move % 5;

    // Center control bonus
    const centerDistance = Math.abs(row - 2) + Math.abs(col - 2);
    score += (4 - centerDistance) * 10;

    // Strategic positions
    const corners = [0, 4, 20, 24];
    const innerCorners = [6, 8, 16, 18];

    if (corners.includes(move)) score += 15;
    if (innerCorners.includes(move)) score += 20;

    return score;
  }

  storeKillerMove(move, plyDepth) {
    if (!this.killerMoves.has(plyDepth)) {
      this.killerMoves.set(plyDepth, []);
    }
    const killers = this.killerMoves.get(plyDepth);
    if (!killers.includes(move)) {
      killers.unshift(move);
      if (killers.length > 2) killers.pop(); // Keep only 2 killer moves per depth
    }
  }

  quiescenceSearch(alpha, beta, isMaximizing, depth) {
    // Quiescence search to avoid horizon effects in tactical positions
    if (depth === 0) {
      return this.evaluatePosition();
    }

    const standPat = this.evaluatePosition();

    if (isMaximizing) {
      if (standPat >= beta) return beta;
      alpha = Math.max(alpha, standPat);
    } else {
      if (standPat <= alpha) return alpha;
      beta = Math.min(beta, standPat);
    }

    // Only search "tactical" moves in quiescence
    const tacticalMoves = this.getTacticalMoves();

    for (let move of tacticalMoves) {
      const originalBoard = [...this.board];
      const originalPlayer = this.currentPlayer;
      const originalMoveCount = this.moveCount;

      this.board[move] = this.currentPlayer;
      this.moveCount++;
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

      const score = this.quiescenceSearch(
        alpha,
        beta,
        !isMaximizing,
        depth - 1
      );

      // Restore state
      this.board = originalBoard;
      this.currentPlayer = originalPlayer;
      this.moveCount = originalMoveCount;

      if (isMaximizing) {
        alpha = Math.max(alpha, score);
        if (alpha >= beta) break;
      } else {
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
    }

    return isMaximizing ? alpha : beta;
  }

  getTacticalMoves() {
    // Return moves that are likely to be tactically important
    const validMoves = this.getValidMovesForPlayer(this.currentPlayer);
    const tacticalMoves = [];

    for (let move of validMoves) {
      // Consider moves that block many opponent moves as tactical
      const blockedCount = this.countBlockedOpponentMoves(
        [...this.board],
        move
      );
      if (blockedCount >= 2) {
        tacticalMoves.push(move);
      }

      // Consider moves near opponent pieces as tactical
      const row = Math.floor(move / 5);
      const col = move % 5;
      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];

      for (let [r, c] of neighbors) {
        if (r >= 0 && r < 5 && c >= 0 && c < 5) {
          const neighborIndex = r * 5 + c;
          if (
            this.board[neighborIndex] === (this.currentPlayer === 1 ? 2 : 1)
          ) {
            if (!tacticalMoves.includes(move)) {
              tacticalMoves.push(move);
            }
            break;
          }
        }
      }
    }

    return tacticalMoves.length > 0 ? tacticalMoves : validMoves.slice(0, 3);
  }

  evaluatePosition() {
    // Enhanced position evaluation for quiescence search
    const player1Count = this.board.filter((cell) => cell === 1).length;
    const player2Count = this.board.filter((cell) => cell === 2).length;

    let score = (player2Count - player1Count) * 100;

    // Add positional factors
    score += this.evaluateControlledTerritory(2) * 15;
    score -= this.evaluateControlledTerritory(1) * 15;
    score += this.evaluateStrategicPositions(2) * 8;
    score -= this.evaluateStrategicPositions(1) * 8;

    // Mobility evaluation
    const aiMobility = this.getValidMovesForPlayer(2).length;
    const humanMobility = this.getValidMovesForPlayer(1).length;
    score += (aiMobility - humanMobility) * 5;

    return score;
  }

  // Helper methods for Hard v2 AI
  encodeGameState(lastMove, isMaximizing) {
    // Enhanced state encoding inspired by nullprogram.com bitboard approach
    // Create a more sophisticated hash that captures game state better
    let hash = 0n; // Use BigInt for larger hash space

    // Encode board state using base-3 representation (null=0, player1=1, player2=2)
    for (let i = 0; i < 25; i++) {
      hash = hash * 3n;
      if (this.board[i] === 1) hash += 1n;
      else if (this.board[i] === 2) hash += 2n;
    }

    // Add move count and current player
    hash = hash * 100n + BigInt(this.moveCount);
    hash = hash * 10n + BigInt(this.currentPlayer);

    // Add some symmetry reduction (basic canonicalization)
    const symmetryHash = this.getSymmetryReducedHash();
    hash = hash * 1000n + BigInt(symmetryHash);

    // Convert to string for Map key (JavaScript Map can handle BigInt but string is safer)
    return hash.toString();
  }

  getSymmetryReducedHash() {
    // Basic symmetry reduction - check if horizontal flip gives smaller representation
    let originalHash = 0;
    let flippedHash = 0;

    for (let i = 0; i < 25; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const flippedCol = 4 - col;
      const flippedIndex = row * 5 + flippedCol;

      originalHash = originalHash * 3 + (this.board[i] || 0);
      flippedHash = flippedHash * 3 + (this.board[flippedIndex] || 0);
    }

    return Math.min(originalHash, flippedHash);
  }

  evaluateTerminalPosition() {
    // Enhanced terminal evaluation based on nullprogram insights
    const player1Count = this.board.filter((cell) => cell === 1).length;
    const player2Count = this.board.filter((cell) => cell === 2).length;

    // Base score difference (AI is player 2) - heavily weighted
    let score = (player2Count - player1Count) * 1000;

    // Perfect game analysis: first player can win by 2 points
    // So AI must be extra aggressive to overcome this disadvantage
    if (player2Count > player1Count) {
      score += 500; // Bonus for actually winning as second player
    } else if (player1Count > player2Count) {
      // Heavy penalty for losing, scaled by margin
      score -= 200 * (player1Count - player2Count);
    }

    // Territory control bonuses - more sophisticated analysis
    const ai_territory = this.evaluateAdvancedTerritory(2);
    const human_territory = this.evaluateAdvancedTerritory(1);
    score += (ai_territory - human_territory) * 50;

    // Connectivity and influence analysis
    const ai_influence = this.evaluateInfluenceMap(2);
    const human_influence = this.evaluateInfluenceMap(1);
    score += (ai_influence - human_influence) * 30;

    // Strategic position control with enhanced weights
    score += this.evaluateStrategicPositions(2) * 25;
    score -= this.evaluateStrategicPositions(1) * 25;

    // Endgame pattern recognition
    score += this.evaluateEndgamePatterns();

    return score;
  }

  evaluateAdvancedTerritory(player) {
    // More sophisticated territory evaluation using flood fill
    let territoryScore = 0;
    const visited = new Set();

    for (let i = 0; i < 25; i++) {
      if (this.board[i] === player) {
        territoryScore += this.floodFillTerritory(i, player, visited);
      }
    }

    return territoryScore;
  }

  floodFillTerritory(startIndex, player, visited) {
    if (visited.has(startIndex)) return 0;

    const stack = [startIndex];
    const territory = new Set();
    let territorySize = 0;

    while (stack.length > 0) {
      const index = stack.pop();
      if (visited.has(index)) continue;

      visited.add(index);
      territory.add(index);

      const row = Math.floor(index / 5);
      const col = index % 5;
      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];

      for (let [r, c] of neighbors) {
        if (r >= 0 && r < 5 && c >= 0 && c < 5) {
          const neighborIndex = r * 5 + c;
          if (!visited.has(neighborIndex)) {
            if (this.board[neighborIndex] === player) {
              stack.push(neighborIndex);
            } else if (this.board[neighborIndex] === null) {
              // Empty space controlled by this territory
              const opponent = player === 1 ? 2 : 1;
              if (!this.isAdjacentToPlayer(neighborIndex, opponent)) {
                territorySize++;
                territory.add(neighborIndex);
              }
            }
          }
        }
      }
    }

    // Bonus for larger connected territories
    return territory.size + (territory.size > 3 ? territory.size * 2 : 0);
  }

  isAdjacentToPlayer(index, player) {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    for (let [r, c] of neighbors) {
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        const neighborIndex = r * 5 + c;
        if (this.board[neighborIndex] === player) {
          return true;
        }
      }
    }
    return false;
  }

  evaluateInfluenceMap(player) {
    // Calculate influence/control over empty squares
    let influence = 0;

    for (let i = 0; i < 25; i++) {
      if (this.board[i] === null) {
        const playerDistance = this.getMinDistanceToPlayer(i, player);
        const opponentDistance = this.getMinDistanceToPlayer(
          i,
          player === 1 ? 2 : 1
        );

        if (playerDistance < opponentDistance) {
          influence += opponentDistance - playerDistance;
        }
      }
    }

    return influence;
  }

  getMinDistanceToPlayer(squareIndex, player) {
    let minDistance = Infinity;
    const row = Math.floor(squareIndex / 5);
    const col = squareIndex % 5;

    for (let i = 0; i < 25; i++) {
      if (this.board[i] === player) {
        const pieceRow = Math.floor(i / 5);
        const pieceCol = i % 5;
        const distance = Math.abs(row - pieceRow) + Math.abs(col - pieceCol);
        minDistance = Math.min(minDistance, distance);
      }
    }

    return minDistance === Infinity ? 10 : minDistance;
  }

  evaluateEndgamePatterns() {
    // Recognize specific endgame patterns that favor one side
    let patternScore = 0;

    // Corner control patterns
    const corners = [0, 4, 20, 24];
    let aiCorners = 0,
      humanCorners = 0;

    for (let corner of corners) {
      if (this.board[corner] === 2) aiCorners++;
      if (this.board[corner] === 1) humanCorners++;
    }

    // Corner control is very powerful in endgame
    patternScore += (aiCorners - humanCorners) * 40;

    // Edge wall patterns - continuous edge control
    patternScore += this.evaluateEdgeWalls(2) * 30;
    patternScore -= this.evaluateEdgeWalls(1) * 30;

    // Center + cross patterns
    if (this.board[12] === 2) {
      // AI controls center
      const crossPositions = [7, 11, 13, 17];
      let crossControl = 0;
      for (let pos of crossPositions) {
        if (this.board[pos] === 2) crossControl++;
      }
      patternScore += crossControl * 20;
    }

    return patternScore;
  }

  evaluateEdgeWalls(player) {
    let wallScore = 0;

    // Check each edge for consecutive pieces
    const edges = [
      [0, 1, 2, 3, 4], // Top
      [20, 21, 22, 23, 24], // Bottom
      [0, 5, 10, 15, 20], // Left
      [4, 9, 14, 19, 24], // Right
    ];

    for (let edge of edges) {
      let consecutive = 0;
      let maxConsecutive = 0;

      for (let pos of edge) {
        if (this.board[pos] === player) {
          consecutive++;
          maxConsecutive = Math.max(maxConsecutive, consecutive);
        } else {
          consecutive = 0;
        }
      }

      // Bonus for longer consecutive runs
      wallScore += maxConsecutive > 1 ? maxConsecutive * maxConsecutive : 0;
    }

    return wallScore;
  }

  getValidMovesForPlayer(player) {
    const originalPlayer = this.currentPlayer;
    this.currentPlayer = player;

    const validMoves = [];
    for (let i = 0; i < 25; i++) {
      if (this.isValidMove(i)) {
        validMoves.push(i);
      }
    }

    this.currentPlayer = originalPlayer;
    return validMoves;
  }

  evaluateControlledTerritory(player) {
    // Count squares that are effectively controlled by a player
    // (empty squares that only that player can reach)
    let controlledSquares = 0;

    for (let i = 0; i < 25; i++) {
      if (this.board[i] === null) {
        const canPlayerReach = this.canPlayerReachSquare(i, player);
        const canOpponentReach = this.canPlayerReachSquare(
          i,
          player === 1 ? 2 : 1
        );

        if (canPlayerReach && !canOpponentReach) {
          controlledSquares++;
        }
      }
    }

    return controlledSquares;
  }

  canPlayerReachSquare(squareIndex, player) {
    // Simple reachability check - can player place adjacent to this square?
    const row = Math.floor(squareIndex / 5);
    const col = squareIndex % 5;
    const opponent = player === 1 ? 2 : 1;

    // Check if placing here would be valid for the player
    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    for (let [r, c] of neighbors) {
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        const neighborIndex = r * 5 + c;
        if (this.board[neighborIndex] === opponent) {
          return false; // Blocked by opponent
        }
      }
    }

    return true;
  }

  evaluateStrategicPositions(player) {
    // Evaluate control of key strategic positions
    let score = 0;

    // Center control
    if (this.board[12] === player) score += 3;

    // Corner control
    const corners = [0, 4, 20, 24];
    for (let corner of corners) {
      if (this.board[corner] === player) score += 2;
    }

    // Edge control
    const edges = [1, 2, 3, 5, 9, 10, 14, 15, 19, 21, 22, 23];
    for (let edge of edges) {
      if (this.board[edge] === player) score += 1;
    }

    return score;
  }

  evaluateMove(moveIndex) {
    // Create a copy of the board to test the move
    const testBoard = [...this.board];
    testBoard[moveIndex] = 2; // AI is player 2

    let score = 0;
    const row = Math.floor(moveIndex / 5);
    const col = moveIndex % 5;

    // 1. Enhanced center/edge positioning strategy
    const centerValue = this.getCenterControlValue(row, col);
    score += centerValue;

    // 2. Anti-edge strategy: Block opponent edge formations
    const edgeBlockingScore = this.evaluateEdgeBlocking(testBoard, moveIndex);
    score += edgeBlockingScore;

    // 3. Count how many opponent moves this blocks
    const blockedMoves = this.countBlockedOpponentMoves(testBoard, moveIndex);
    score += blockedMoves * 5;

    // 4. Count how many future moves this enables for AI
    const enabledMoves = this.countEnabledAIMoves(testBoard, moveIndex);
    score += enabledMoves * 3;

    // 5. Prefer moves that create territory (isolated areas)
    const territoryScore = this.evaluateTerritory(testBoard, moveIndex, 2);
    score += territoryScore * 4;

    // 6. Block opponent from creating large territories
    const blockingScore = this.evaluateOpponentBlocking(testBoard, moveIndex);
    score += blockingScore * 6;

    // 7. Counter opponent edge control patterns
    const edgeCounterScore = this.evaluateEdgeCounterStrategy(
      testBoard,
      moveIndex
    );
    score += edgeCounterScore;

    // 8. Prevent opponent corner control
    const cornerDefenseScore = this.evaluateCornerDefense(testBoard, moveIndex);
    score += cornerDefenseScore;

    return score;
  }

  getCenterControlValue(row, col) {
    // Enhanced center control that considers edge pressure
    const distanceFromCenter = Math.abs(row - 2) + Math.abs(col - 2);
    const centerScore = (4 - distanceFromCenter) * 2;

    // Bonus for key strategic positions that control center while countering edges
    const keyPositions = [
      { row: 1, col: 1 },
      { row: 1, col: 3 },
      { row: 3, col: 1 },
      { row: 3, col: 3 }, // Inner corners
      { row: 2, col: 1 },
      { row: 2, col: 3 },
      { row: 1, col: 2 },
      { row: 3, col: 2 }, // Center edges
    ];

    for (let pos of keyPositions) {
      if (row === pos.row && col === pos.col) {
        return centerScore + 8; // Extra bonus for key control positions
      }
    }

    return centerScore;
  }

  evaluateEdgeBlocking(testBoard, moveIndex) {
    let blockingScore = 0;
    const row = Math.floor(moveIndex / 5);
    const col = moveIndex % 5;

    // Check if this move blocks opponent edge formations
    const opponentEdgeSquares = this.getOpponentEdgeSquares();

    // If opponent has edge pieces, prioritize moves that limit their expansion
    if (opponentEdgeSquares.length > 0) {
      // High value for moves that cut off edge expansion routes
      const edgeExpansionBlocked = this.countsBlockedEdgeExpansion(
        testBoard,
        moveIndex,
        opponentEdgeSquares
      );
      blockingScore += edgeExpansionBlocked * 12;

      // Bonus for moves that force opponent away from edges
      if (this.isStrategicEdgeBlocker(row, col, opponentEdgeSquares)) {
        blockingScore += 15;
      }
    }

    return blockingScore;
  }

  getOpponentEdgeSquares() {
    const edgeSquares = [];
    for (let i = 0; i < 25; i++) {
      if (this.board[i] === 1) {
        // Human player
        const row = Math.floor(i / 5);
        const col = i % 5;
        // Check if it's on an edge
        if (row === 0 || row === 4 || col === 0 || col === 4) {
          edgeSquares.push({ index: i, row, col });
        }
      }
    }
    return edgeSquares;
  }

  countsBlockedEdgeExpansion(testBoard, moveIndex, opponentEdgeSquares) {
    let blockedRoutes = 0;
    const row = Math.floor(moveIndex / 5);
    const col = moveIndex % 5;

    for (let edgeSquare of opponentEdgeSquares) {
      // Check if this move blocks potential expansion from this edge square
      const distance =
        Math.abs(row - edgeSquare.row) + Math.abs(col - edgeSquare.col);
      if (distance <= 2) {
        // Close enough to interfere
        blockedRoutes++;
      }
    }

    return blockedRoutes;
  }

  isStrategicEdgeBlocker(row, col, opponentEdgeSquares) {
    // Returns true if this position strategically blocks multiple edge routes
    let routesBlocked = 0;

    for (let edgeSquare of opponentEdgeSquares) {
      // Check if this position is on a key path from edge to center
      if (this.isOnKeyPath(row, col, edgeSquare.row, edgeSquare.col)) {
        routesBlocked++;
      }
    }

    return routesBlocked >= 2;
  }

  isOnKeyPath(row, col, edgeRow, edgeCol) {
    // Simple path checking - is this position between edge and center?
    const centerRow = 2,
      centerCol = 2;

    // Check if position is roughly on the path from edge to center
    const isOnRowPath =
      row >= Math.min(edgeRow, centerRow) &&
      row <= Math.max(edgeRow, centerRow);
    const isOnColPath =
      col >= Math.min(edgeCol, centerCol) &&
      col <= Math.max(edgeCol, centerCol);

    return isOnRowPath && isOnColPath;
  }

  evaluateEdgeCounterStrategy(testBoard, moveIndex) {
    let counterScore = 0;
    const row = Math.floor(moveIndex / 5);
    const col = moveIndex % 5;

    // Count opponent pieces on edges
    let opponentEdgeCount = 0;
    let opponentCornerCount = 0;

    for (let i = 0; i < 25; i++) {
      if (this.board[i] === 1) {
        const r = Math.floor(i / 5);
        const c = i % 5;

        if ((r === 0 || r === 4) && (c === 0 || c === 4)) {
          opponentCornerCount++; // Corner
        } else if (r === 0 || r === 4 || c === 0 || c === 4) {
          opponentEdgeCount++; // Edge (not corner)
        }
      }
    }

    // If opponent is playing edge strategy, counter with center control
    if (opponentEdgeCount >= 2) {
      const distanceFromCenter = Math.abs(row - 2) + Math.abs(col - 2);
      counterScore += (4 - distanceFromCenter) * 5; // Strong center preference
    }

    // If opponent has corners, block their edge connections
    if (opponentCornerCount >= 1) {
      if (this.isEdgeConnectionBlocker(row, col)) {
        counterScore += 20;
      }
    }

    return counterScore;
  }

  isEdgeConnectionBlocker(row, col) {
    // Key positions that block corner-to-corner or corner-to-edge connections
    const keyBlockers = [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 }, // Top edge connectors
      { row: 4, col: 1 },
      { row: 4, col: 2 },
      { row: 4, col: 3 }, // Bottom edge connectors
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 3, col: 0 }, // Left edge connectors
      { row: 1, col: 4 },
      { row: 2, col: 4 },
      { row: 3, col: 4 }, // Right edge connectors
    ];

    return keyBlockers.some((pos) => pos.row === row && pos.col === col);
  }

  evaluateCornerDefense(testBoard, moveIndex) {
    let defenseScore = 0;
    const row = Math.floor(moveIndex / 5);
    const col = moveIndex % 5;

    // Check if opponent is threatening corner control
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: 4 },
      { row: 4, col: 0 },
      { row: 4, col: 4 },
    ];

    for (let corner of corners) {
      const cornerIndex = corner.row * 5 + corner.col;
      if (this.board[cornerIndex] === null) {
        // Corner is empty, check if opponent can reach it
        if (this.canOpponentReachCorner(corner)) {
          // This move should block access to that corner
          const distance =
            Math.abs(row - corner.row) + Math.abs(col - corner.col);
          if (distance <= 2) {
            defenseScore += 10;
          }
        }
      }
    }

    return defenseScore;
  }

  canOpponentReachCorner(corner) {
    // Check if opponent has pieces that could potentially reach this corner
    for (let i = 0; i < 25; i++) {
      if (this.board[i] === 1) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const distance =
          Math.abs(row - corner.row) + Math.abs(col - corner.col);
        if (distance <= 3) {
          return true; // Close enough to threaten
        }
      }
    }
    return false;
  }

  countBlockedOpponentMoves(testBoard, moveIndex) {
    const row = Math.floor(moveIndex / 5);
    const col = moveIndex % 5;
    let blockedCount = 0;

    // Check orthogonal neighbors
    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
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
          [testRow - 1, testCol],
          [testRow + 1, testCol],
          [testRow, testCol - 1],
          [testRow, testCol + 1],
        ];

        for (let [tr, tc] of testNeighbors) {
          if (tr >= 0 && tr < 5 && tc >= 0 && tc < 5) {
            const testNeighborIndex = tr * 5 + tc;
            if (testBoard[testNeighborIndex] === 1) {
              // Human player
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
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
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
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    for (let [r, c] of neighbors) {
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        const neighborIndex = r * 5 + c;
        if (testBoard[neighborIndex] === 1) {
          // Human player
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

    // Special rule: Center square (index 12) cannot be taken on the very first move of a round (regardless of who starts)
    if (this.moveCount === 0 && index === 12) {
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
      [row, col + 1], // right
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
    const player = this.board[index];
    square.classList.add(`player${player}`, "occupied");
    square.textContent = player === 1 ? "●" : "■";
  }

  updateValidMoves() {
    // Clear previous visual indicators
    document.querySelectorAll(".square").forEach((square) => {
      square.classList.remove("invalid", "center-blocked");
    });

    // Visual indicators for invalid moves are now hidden for a cleaner look
    // The game still validates moves internally when clicked
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

    const player1Count = this.board.filter((cell) => cell === 1).length;
    const player2Count = this.board.filter((cell) => cell === 2).length;

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

    // Compute round net difference
    let net = 0;
    if (winner === 1) net = player1Count - player2Count;
    else if (winner === 2) net = player2Count - player1Count;
    if (net < 0) net = 0; // safety guard
    if (winner) this.matchScore[winner] += net; // ties score nothing

    const target = 7; // must exceed 7
    const matchWinner =
      this.matchScore[1] > target ? 1 : this.matchScore[2] > target ? 2 : null;

    setTimeout(() => {
      this.showRoundModal({
        round: this.roundNumber,
        roundWinner: winner,
        p1Pieces: player1Count,
        p2Pieces: player2Count,
        netAwarded: net,
        matchScore: { ...this.matchScore },
        matchWinner,
        message,
      });
    }, 400);
  }
  showRoundModal(ctx) {
    const {
      round,
      roundWinner,
      p1Pieces,
      p2Pieces,
      netAwarded,
      matchScore,
      matchWinner,
      message,
    } = ctx;
  const modal = document.createElement("div");
  // Use lightweight floating summary instead of full-screen overlay so board stays visible
  modal.className = "round-summary-overlay";
  modal.style.cssText = `position:fixed; right:15px; top:15px; z-index:1100; background:rgba(255,255,255,0.97); border:2px solid #1e3c72; border-radius:14px; padding:18px 20px; max-width:340px; box-shadow:0 10px 35px rgba(0,0,0,0.25); font-family:inherit;`;
    const p1Label = this.gameMode === "ai" ? "You" : "Player 1";
    const p2Label = this.gameMode === "ai" ? "AI" : "Player 2";
    let header;
    if (roundWinner === 1) header = `${p1Label} wins the round!`;
    else if (roundWinner === 2) header = `${p2Label} wins the round!`;
    else header = "Round is a tie.";
    const piecesLine = `Pieces — ${p1Label}: ${p1Pieces} | ${p2Label}: ${p2Pieces}`;
    const netLine = roundWinner
      ? `Net points awarded: +${netAwarded} to ${
          roundWinner === 1 ? p1Label : p2Label
        }`
      : "No points awarded (tie).";
    const matchLine = `Match Score — ${p1Label}: ${matchScore[1]} | ${p2Label}: ${matchScore[2]} (First to break 7 wins)`;
    const finalLine = matchWinner
      ? `<h3>🏆 ${
          matchWinner === 1 ? p1Label : p2Label
        } wins the match! 🏆</h3>`
      : "";
    const button = matchWinner
      ? `<button class='btn' onclick="this.closest('.modal').remove(); if(typeof gameManager!=='undefined'){ gameManager.currentGame.resetMatch(); } else { game.resetMatch(); }">New Match</button>`
      : `<button class='btn' onclick="this.closest('.modal').remove(); if(typeof gameManager!=='undefined'){ gameManager.currentGame.newRound(); } else { game.newRound(); }">Next Round</button>`;
    modal.innerHTML = `<div style='display:flex; flex-direction:column; gap:6px;'>
      <div style='font-size:1.15rem; font-weight:700; color:#1e3c72;'>Round ${round} Complete</div>
      <div style='font-weight:600;'>${header}</div>
      <div style='font-size:0.9rem; color:#444;'>${message}</div>
      <div style='font-size:0.9rem;'>${piecesLine}</div>
      <div style='font-size:0.85rem; color:#333;'>${netLine}</div>
      <div style='font-size:0.85rem; color:#333;'>${matchLine}</div>
      ${finalLine}
      <div style='margin-top:4px; display:flex; gap:8px; flex-wrap:wrap;'>${button}</div>
      <div style='font-size:0.65rem; opacity:0.6; margin-top:4px;'>Proceed to continue the match</div>
    </div>`;
    document.body.appendChild(modal);
    this.updateDisplay();
  }

  showMessage(text, type = "info") {
    const notification = document.createElement("div");
    const bgColor =
      type === "error" ? "#FF6B6B" : type === "info" ? "#4ECDC4" : "#FFD700";

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
    const player1Label = this.gameMode === "ai" ? "You" : "Player 1";
    const player2Label = this.gameMode === "ai" ? "AI" : "Player 2";

    document.getElementById("player1-label").textContent = player1Label;
    document.getElementById("player2-label").textContent = player2Label;

    const currentPlayerText =
      this.gameMode === "ai"
        ? this.currentPlayer === 1
          ? "You"
          : "AI"
        : `Player ${this.currentPlayer}`;
    document.getElementById("current-player").textContent = currentPlayerText;

    const player1Count = this.board.filter((cell) => cell === 1).length;
    const player2Count = this.board.filter((cell) => cell === 2).length;

    document.getElementById("player1-score").textContent = player1Count;
    document.getElementById("player2-score").textContent = player2Count;

    // Match / Round indicators (if elements exist)
    const roundEl = document.getElementById("round-indicator");
    if (roundEl) roundEl.textContent = `Round ${this.roundNumber}`;
    const p1MatchEl = document.getElementById("match-score-p1");
    const p2MatchEl = document.getElementById("match-score-p2");
    if (p1MatchEl)
      p1MatchEl.textContent = `${player1Label}: ${this.matchScore[1]}`;
    if (p2MatchEl)
      p2MatchEl.textContent = `${player2Label}: ${this.matchScore[2]}`;

    // Overall cumulative pieces line (per-round live piece counts)
    const overallCumEl = document.getElementById('overall-cumulative');
    if (overallCumEl) {
      overallCumEl.textContent = `Round Pieces — ${player1Label}: ${player1Count} | ${player2Label}: ${player2Count}`;
    }

    // Update game status
    const statusElement = document.getElementById("game-status");
    if (!this.gameActive) {
      statusElement.textContent = "Game Over";
    } else if (this.gameMode === "ai" && this.currentPlayer === 2) {
      statusElement.textContent = "AI is thinking...";
    } else if (this.currentPlayer === 1 && this.moveCount === 0) {
      statusElement.textContent = "Place your first piece (not center)";
    } else if (!this.hasValidMoves(this.currentPlayer)) {
      statusElement.textContent = "No valid moves - passing turn";
    } else {
      const actionText =
        this.gameMode === "ai"
          ? this.currentPlayer === 1
            ? "Your turn - "
            : "AI turn - "
          : "";
      statusElement.textContent =
        actionText + "Place your piece on any valid square";
    }
  }

  newGame() {
    this.board = Array(25).fill(null);
  // Base game start always begins with Player 1; only reset alternation if first round
  this.currentPlayer = 1;
  if (this.roundNumber === 1) this.lastRoundStarter = 1;
    this.gameActive = true;
    this.moveCount = 0;
    this.passCount = 0;
    this.createBoard();
    this.updateDisplay();
    this.updateValidMoves();
  }

  newRound() {
    this.board = Array(25).fill(null);
    // Alternate starting player each round
    if (this.lastRoundStarter === 1) {
      this.currentPlayer = 2;
      this.lastRoundStarter = 2;
    } else {
      this.currentPlayer = 1;
      this.lastRoundStarter = 1;
    }
    this.gameActive = true;
    this.moveCount = 0;
    this.passCount = 0;
    this.roundNumber += 1;
    this.createBoard();
    this.updateDisplay();
    this.updateValidMoves();
    // If AI should start this round, immediately schedule its move
    if (this.gameMode === 'ai' && this.currentPlayer === 2) {
      this.makeAIMove();
    }
  }

  resetMatch() {
    this.matchScore = { 1: 0, 2: 0 };
    this.roundNumber = 1;
  this.lastRoundStarter = 1;
    this.newGame();
  }

  setGameMode(mode) {
    this.gameMode = mode;
    this.aiDifficulty = document.getElementById("ai-difficulty").value;

    // Update UI
    document
      .querySelectorAll(".mode-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document.getElementById(`${mode}-mode`).classList.add("active");

    const aiControls = document.getElementById("ai-controls");
    aiControls.style.display = mode === "ai" ? "block" : "none";

    this.newGame();
  }

  attachEventListeners() {
    document
      .getElementById("new-game-btn")
      .addEventListener("click", () => this.newGame());

    // Game mode buttons
    document
      .getElementById("pvp-mode")
      .addEventListener("click", () => this.setGameMode("pvp"));
    document
      .getElementById("ai-mode")
      .addEventListener("click", () => this.setGameMode("ai"));

    // AI difficulty selector
    document.getElementById("ai-difficulty").addEventListener("change", (e) => {
      this.aiDifficulty = e.target.value;
    });
  }
}

// Add CSS animation for notifications
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Game initialization is now handled by GameManager
// This file contains the base BritishSquareGame class
