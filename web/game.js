// The rules of the game: pure functions, no DOM (tested in game.test.js).
const Game = {};

// The board is SIZE x SIZE cells.
Game.SIZE = 30;

// Automatic play steps this many generations per second.
Game.GENERATIONS_PER_SECOND = 5;

// The time between two generations in automatic play, in milliseconds.
Game.stepInterval = function (perSecond = Game.GENERATIONS_PER_SECOND) {
    return 1000 / perSecond;
};

// A new board (rows x cols) with every cell dead (false).
Game.createBoard = function (rows = Game.SIZE, cols = Game.SIZE) {
    return Array.from({ length: rows }, () => new Array(cols).fill(false));
};

// A new board with the given cell flipped; the input board is left untouched.
// A cell outside the board changes nothing.
Game.toggleCell = function (board, row, col) {
    if (row < 0 || row >= board.length || col < 0 || col >= board[row].length) {
        return board;
    }
    return board.map((cells, r) => r === row
        ? cells.map((alive, c) => c === col ? !alive : alive)
        : cells);
};

// The live cells of a board as [row, col] pairs, row by row.
Game.liveCells = function (board) {
    const cells = [];
    board.forEach((row, r) => row.forEach((alive, c) => {
        if (alive) cells.push([r, c]);
    }));
    return cells;
};

// The name a pattern is saved under: the text without the spaces around it ('' if none is left).
Game.patternName = function (text) {
    return String(text || '').trim();
};

// How many of the 8 neighbours of a cell are alive.
// The edge of the board is a wall: positions outside it count as dead (no wrap-around).
Game.countNeighbors = function (board, row, col) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < board.length && c >= 0 && c < board[r].length && board[r][c]) {
                count++;
            }
        }
    }
    return count;
};

// The next generation as a new board; the input board is left untouched.
// A live cell with 2 or 3 live neighbours survives, a dead cell with exactly 3 comes alive,
// every other cell is dead.
Game.nextGeneration = function (board) {
    return board.map((cells, r) => cells.map((alive, c) => {
        const neighbors = Game.countNeighbors(board, r, c);
        return neighbors === 3 || (alive && neighbors === 2);
    }));
};

if (typeof module !== 'undefined') {
    module.exports = Game;
}
