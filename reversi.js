class Reversi {
  constructor() {
    this.currentPlayer = Math.random() < 0.5 ? "black" : "white";
    this.isGameOver = false;

    this.mat = Array(8).fill(0).map(x => Array(8).fill(null))
    this.mat[3][3] = this.mat[4][4] = 'black'
    this.mat[3][4] = this.mat[4][3] = 'white'
  }

  getCurrentPcs() {
    let white = 0;
    let black = 0;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (this.mat[i][j] === 'black') {
          black++
        } else if (this.mat[i][j] === 'white') {
          white++
        }
      }
    }
    return { white, black };
  }

  // Function to check if a move is valid
  isValidMove(row, col) {
    // Check if the cell is empty
    if (this.mat[row][col] !== null) {
      return false;
    }

    // Check if the move flips opponent discs in any direction
    let valid = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) {
          continue; // Skip the current cell
        }
        let flipDiscPos = this.flipsOpponentDiscs(row, col, dr, dc);
        if (flipDiscPos !== false) {
          valid.push(...flipDiscPos);
        }
      }
    }
    return valid;
  }

  // Function to handle user move and update the board
  handleMove(row, col) {
    // Implement the game logic here, updating the board and checking for valid moves and flips
    let discsToFlip = this.isValidMove(row, col);
    if (discsToFlip === false || discsToFlip.length === 0) {
      return
    }

    // Place the current player's disc
    this.mat[row][col] = this.currentPlayer;
    for (let disc of discsToFlip) {
      this.mat[disc.row][disc.col] = this.currentPlayer;
    }

    // Switch to the other player's turn
    this.currentPlayer = this.currentPlayer === "black" ? "white" : "black";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.isValidMove(row, col)) {
          return
        }
      }
    }
    this.isGameOver = true;
  }

  flipsOpponentDiscs(row, col, dr, dc) {
    const opponent = this.currentPlayer === "black" ? "white" : "black";
    let r = row + dr;
    let c = col + dc;
    if (!this.isValidCell(r, c)) {
      return false
    }
    let discsToFlip = [];
    while (this.mat[r][c] !== null) {
      if (this.mat[r][c] !== opponent) {
        break
      }        
      discsToFlip.push({ row: r, col: c });
      r += dr;
      c += dc;
      if (!this.isValidCell(r, c)) {
        return false
      }
    }

    if (discsToFlip.length > 0 && this.mat[r][c] === this.currentPlayer) {
      return discsToFlip;
    }
    return false;
  }

  isValidCell(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }
}

module.exports = Reversi;
