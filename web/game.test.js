const test = require('node:test');
const assert = require('node:assert');
const Game = require('./game.js');

test('the game module loads', () => {
    assert.strictEqual(typeof Game, 'object');
});

test('createBoard makes an empty 30x30 board by default', () => {
    const board = Game.createBoard();
    assert.strictEqual(board.length, 30);
    for (const row of board) {
        assert.strictEqual(row.length, 30);
        assert.ok(row.every((alive) => alive === false));
    }
});

test('createBoard accepts a custom size', () => {
    assert.deepStrictEqual(Game.createBoard(3, 4), [
        [false, false, false, false],
        [false, false, false, false],
        [false, false, false, false],
    ]);
});

test('toggleCell makes a dead cell alive, then dead again', () => {
    const once = Game.toggleCell(Game.createBoard(), 2, 5);
    assert.strictEqual(once[2][5], true);
    const twice = Game.toggleCell(once, 2, 5);
    assert.strictEqual(twice[2][5], false);
});

test('toggleCell leaves the input board and the other cells unchanged', () => {
    const board = Game.createBoard(3, 3);
    const next = Game.toggleCell(board, 1, 1);
    assert.deepStrictEqual(board, Game.createBoard(3, 3));
    assert.deepStrictEqual(next, [
        [false, false, false],
        [false, true, false],
        [false, false, false],
    ]);
});

test('toggleCell ignores cells outside the board', () => {
    const board = Game.createBoard(3, 3);
    for (const [row, col] of [[-1, 0], [0, -1], [3, 0], [0, 3], [30, 30]]) {
        assert.strictEqual(Game.toggleCell(board, row, col), board);
    }
});
