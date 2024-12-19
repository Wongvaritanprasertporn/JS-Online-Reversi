class Reversi {
  constructor() {
    this.currentPlayer = Math.random() < 0.5 ? "black" : "white";
    this.mat = new Array();
    this.isGameOver = false;

    for (let i = 0; i < 8; i++) {
      let col = new Array();
      for (let j = 0; j < 8; j++) {
        if ((i == 3 && j == 3) || (i == 4 && j == 4)) {
          col.push("black");
        } else if ((i == 3 && j == 4) || (i == 4 && j == 3)) {
          col.push("white");
        } else {
          col.push(null);
        }
      }
      this.mat.push(col);
    }
  }

  changeTurn() {
    let oppoTurn = 0;
    let currentTurn = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (
          this.isValidMove(
            row,
            col,
            this.currentPlayer === "black" ? "white" : "black",
          )
        ) {
          oppoTurn++;
        }
        if (this.isValidMove(row, col, this.currentPlayer)) {
          currentTurn++;
        }
      }
    }
    if (oppoTurn !== 0) {
      this.currentPlayer = this.currentPlayer === "black" ? "white" : "black";
    }
    if (oppoTurn === 0 && currentTurn === 0) {
      this.isGameOver = true;
    }
  }

  getCurrentPcs() {
    let white, black;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        white += this.mat[i][j] === "white" ? 1 : 0;
        black += this.mat[i][j] === "black" ? 1 : 0;
      }
    }
    return [white, black];
  }

  isValidMove(row, col, turn) {
    let valid = [];
    if (this.mat[row][col] !== null) {
      return valid;
    }
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        let flipDiscPos = this.flipsOpponentDiscs(
          row,
          col,
          dr,
          dc,
          turn === "black" ? "white" : "black",
        );
        if (flipDiscPos !== false) {
          for (let disc of flipDiscPos) {
            valid.push(disc);
          }
        }
      }
    }
    return valid;
  }

  handleMove(row, col) {
    let discsToFlip = this.isValidMove(row, col, this.currentPlayer);
    if (discsToFlip.length !== 0) {
      this.mat[row][col] = this.currentPlayer;
      for (let disc of discsToFlip) {
        this.mat[disc.row][disc.col] = this.currentPlayer;
      }
      this.changeTurn();
    }
  }

  flipsOpponentDiscs(row, col, dr, dc, opponent) {
    let r = row + dr;
    let c = col + dc;
    let discsToFlip = [];

    while (this.isValidCell(r, c) && this.mat[r][c] !== null) {
      if (this.mat[r][c] === opponent) {
        discsToFlip.push({ row: r, col: c });
        r += dr;
        c += dc;
      } else {
        break;
      }
    }

    if (
      this.isValidCell(r, c) &&
      discsToFlip.length > 0 &&
      this.mat[r][c] === this.currentPlayer
    ) {
      return discsToFlip;
    }
    return false;
  }

  isValidCell(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }
}

module.exports = Reversi;
