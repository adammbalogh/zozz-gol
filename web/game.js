// The rules of the game: pure functions, no DOM (tested in game.test.js).
const Game = {};

// The board is SIZE x SIZE cells.
Game.SIZE = 30;

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

if (typeof module !== 'undefined') {
    module.exports = Game;
}
