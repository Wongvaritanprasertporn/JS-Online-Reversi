
const board = document.getElementById('board');

let currentPlayer = Math.random() < 0.5 ? "black" : "white"

document.getElementById("turn").innerHTML = currentPlayer

// Initialize the game board
for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('id', i * 8 + j);
        cell.addEventListener('click', () => handleMove(i, j));
        if ((i == 3 && j == 3) || (i == 4 && j == 4)) {
            const disc = document.createElement('div')
            disc.classList.add('black-disc')
            cell.appendChild(disc)
        }
        else if ((i == 3 && j == 4) || (i == 4 && j == 3)) {
            const disc = document.createElement('div')
            disc.classList.add('white-disc')
            cell.appendChild(disc)
        }
        board.appendChild(cell)
    }
}

// Function to handle user move and update the board
function handleMove(row, col) {
    // Implement the game logic here, updating the board and checking for valid moves and flips
    let discsToFlip = isValidMove(row, col)
    if (discsToFlip.length !== 0 && discsToFlip !== false) {
        // Place the current player's disc
        placeDisc(row, col);

        discsToFlip.forEach(disc => {
            const { row, col } = disc;
            flipDisc(row, col);
        });

        // Switch to the other player's turn

        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        document.getElementById("turn").innerHTML = currentPlayer

        if (isGameOver()) {
            // Handle game over logic here
            // Display winner or draw message, etc.
        }

    }
}

// Function to check if a move is valid
function isValidMove(row, col) {
    // Check if the cell is empty
    if (board.children[row * 8 + col].children.length !== 0) {
        return false;
    }

    // Check if the move flips opponent discs in any direction
    let valid = []
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue; // Skip the current cell
            let flipDiscPos = flipsOpponentDiscs(row, col, dr, dc)
            if (flipDiscPos !== false) {
                flipDiscPos.forEach(disc => {
                    valid.push(disc);
                })
            }
        }
    }
    return valid;
}

function flipsOpponentDiscs(row, col, dr, dc) {
    const opponent = currentPlayer === 'black' ? 'white-disc' : 'black-disc';
    let r = row + dr;
    let c = col + dc;
    let discsToFlip = [];

    while (isValidCell(r, c) && board.children[r * 8 + c].children.length !== 0) {
        if (board.children[r * 8 + c].children[0].classList[0] === opponent) {
            discsToFlip.push({ row: r, col: c });
            r += dr;
            c += dc;
        } else { break }
    }

    const currentDisc = currentPlayer === 'black' ? 'black-disc' : 'white-disc'

    if (isValidCell(r, c) && board.children[r * 8 + c].children.length !== 0 && discsToFlip.length > 0) {
        if (board.children[r * 8 + c].children[0].classList[0] === currentDisc) {
            // There are opponent discs to flip in this direction
            // Update the board to flip the discs
            return discsToFlip;
        }
    }

    return false;
}

// Function to place the current player's disc on the board
function placeDisc(row, col) {
    const cell = board.children[row * 8 + col];
    const disc = document.createElement('div')
    disc.classList.add(currentPlayer === 'black' ? 'black-disc' : 'white-disc')
    cell.appendChild(disc)
}

function isValidCell(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function flipDisc(row, col) {
    // Implement the logic to flip the disc appearance on the board
    // For example, you can change the class of the cell to match the new disc color
    const disc = board.children[row * 8 + col];
    disc.children[0].classList.remove('black-disc', 'white-disc');
    disc.children[0].classList.add(currentPlayer === 'black' ? 'black-disc' : 'white-disc');

}

function isGameOver() {
    if (isBoardFull()) {
        return true;
    }

    if (!hasValidMove('black-disc') && !hasValidMove('white-disc')) {
        return true;
    }

    return false;
}

function isBoardFull() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board.children[row * 8 + col].children.length === 0) {
                return false;
            }
        }
    }
    return true;
}

function hasValidMove(player) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (isValidMove(row, col) && board.children[row * 8 + col].children.length === 0) {
                return true;
            }
        }
    }
    return false;
}

function resetGame() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const cell = board.children[i * 8 + j];
            cell.innerHTML = ""
            if ((i == 3 && j == 3) || (i == 4 && j == 4)) {
                const disc = document.createElement('div')
                disc.classList.add('black-disc')
                cell.appendChild(disc)
            }
            else if ((i == 3 && j == 4) || (i == 4 && j == 3)) {
                const disc = document.createElement('div')
                disc.classList.add('white-disc')
                cell.appendChild(disc)
            }
        }
    }
    currentPlayer = Math.random() < 0.5 ? "black" : "white";
    document.getElementById("turn").innerHTML = currentPlayer
}