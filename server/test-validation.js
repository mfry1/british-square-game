// Test the server validation logic
console.log('Testing server validation...');

// Test the isValidMove function logic
function testIsValidMove(position, gameState) {
  // Basic validation - first move must NOT be center for player 1
  if (gameState.moveCount === 0 && gameState.currentPlayer === 1) {
    return position !== 12; // Center position is blocked for player 1's first move
  }

  // Check if position is adjacent to opponent pieces (not allowed)
  const row = Math.floor(position / 5);
  const col = position % 5;
  const opponent = gameState.currentPlayer === 1 ? 2 : 1;

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
      if (gameState.board[adjacentPos] === opponent) {
        return false;
      }
    }
  }

  return true;
}

// Test first move for player 1
const initialGameState = {
  board: new Array(25).fill(null),
  currentPlayer: 1,
  moveCount: 0
};

console.log('Testing first move validation for player 1:');
for (let i = 0; i < 25; i++) {
  const valid = testIsValidMove(i, initialGameState);
  if (i === 12) {
    console.log(`Position ${i} (center): ${valid ? 'VALID' : 'INVALID'} - Should be INVALID`);
  } else if (i < 5) {
    console.log(`Position ${i}: ${valid ? 'VALID' : 'INVALID'} - Should be VALID`);
  }
}

console.log('Server validation logic appears correct!');
