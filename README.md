# British Square - Classic Board Game (1978)

A web-based implementation of the classic British Square board game by Gabriel Games from 1978.

## Game Features

- **Authentic 1978 Rules**: Faithful recreation of the original Gabriel Games board game
- **Two Game Modes**:
  - Player vs Player (local multiplayer)
  - Player vs AI (with 3 difficulty levels)
- **5x5 Grid**: Classic board layout
- **Strategic Gameplay**: Territory control with orthogonal adjacency rules
- **Visual Indicators**: Shows valid/invalid moves in real-time
- **Responsive Design**: Works on desktop and mobile devices

## How to Play

1. **Goal**: Place the most pieces on the 5×5 board
2. **Placement**: Click any empty square to place your piece
3. **Key Rule**: Cannot place next to opponent pieces (up/down/left/right)
4. **Diagonal**: You CAN place diagonally next to opponents
5. **Special**: Player 1 cannot use center square on first turn
6. **End**: Game ends when both players cannot move
7. **Winner**: Player with the most pieces wins!

## AI Difficulty Levels

- **Easy**: Random moves with basic strategy
- **Medium**: Mix of strategic and random moves (recommended)
- **Hard**: Always makes the best strategic move available
- **Hard v2**: Advanced minimax with alpha-beta pruning and enhanced evaluation (inspired by nullprogram.com analysis)

### Hard v2 Features

The Hard v2 AI mode implements advanced game-playing techniques inspired by the complete solution analysis from [nullprogram.com](https://nullprogram.com/blog/2020/10/19/):

**Core Engine:**

- **Deep Minimax Search**: Searches up to 8 moves ahead with iterative deepening
- **Alpha-Beta Pruning**: Dramatically reduces search space by eliminating inferior branches
- **Transposition Table**: Advanced caching with depth-aware storage and symmetry reduction
- **Quiescence Search**: Extends search in tactical positions to avoid horizon effects

**Strategic Intelligence:**

- **Opening Book**: Uses proven strong opening moves to counter first-player advantage
- **Move Ordering**: Employs killer move heuristic and positional scoring for better pruning
- **Enhanced Position Evaluation**: Multi-layered analysis including territory, influence, and patterns
- **Perfect Play Insights**: Incorporates knowledge that first player wins by 2 points optimally

**Advanced Analysis:**

- **Territory Control**: Sophisticated flood-fill analysis of controlled areas
- **Influence Mapping**: Evaluates potential control over empty squares
- **Endgame Patterns**: Recognizes winning formations like edge walls and corner control
- **Connectivity Analysis**: Values piece coordination and formation strength

## Technologies Used

- HTML5
- CSS3 (with responsive design and animations)
- Vanilla JavaScript (ES6+)
- No external dependencies

## Game Strategy

Based on computer analysis, this game features:

- First player advantage (can win by 2 points with perfect play)
- Deep strategic territory control
- Blocking and area denial mechanics
- Endgame timing considerations

## History

British Square was originally published by Gabriel Games in 1978. This digital version recreates the authentic gameplay experience with modern web technologies.

## Play Online

[Play British Square Game](https://mattf.github.io/british-square-game/)

---

_Enjoy this classic strategy game brought to the modern web!_
