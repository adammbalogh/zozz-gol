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

// A board built from rows of '#' (alive) and '.' (dead), to keep the patterns readable.
function parse(...rows) {
    return rows.map((row) => [...row].map((ch) => ch === '#'));
}

test('countNeighbors counts the live cells around a cell, not the cell itself', () => {
    const board = parse(
        '###',
        '.#.',
        '#..',
    );
    assert.strictEqual(Game.countNeighbors(board, 1, 1), 4);
    assert.strictEqual(Game.countNeighbors(board, 0, 0), 2);
    assert.strictEqual(Game.countNeighbors(board, 2, 2), 1);
});

test('a live cell with 2 or 3 live neighbours survives', () => {
    const two = Game.nextGeneration(parse(
        '#..',
        '.#.',
        '..#',
    ));
    assert.strictEqual(two[1][1], true);
    const three = Game.nextGeneration(parse(
        '#.#',
        '.#.',
        '..#',
    ));
    assert.strictEqual(three[1][1], true);
});

test('a live cell with fewer than 2 or more than 3 live neighbours dies', () => {
    for (const rows of [
        ['...', '.#.', '...'],
        ['#..', '.#.', '...'],
        ['#.#', '.#.', '#.#'],
        ['###', '.#.', '###'],
    ]) {
        assert.strictEqual(Game.nextGeneration(parse(...rows))[1][1], false, rows.join('/'));
    }
});

test('a dead cell comes alive with exactly 3 live neighbours, and only then', () => {
    assert.strictEqual(Game.nextGeneration(parse('#.#', '...', '#..'))[1][1], true);
    for (const rows of [
        ['#.#', '...', '...'],
        ['#.#', '...', '#.#'],
        ['###', '#.#', '###'],
    ]) {
        assert.strictEqual(Game.nextGeneration(parse(...rows))[1][1], false, rows.join('/'));
    }
});

test('a horizontal blinker turns vertical after one step and back after two', () => {
    const horizontal = parse(
        '.....',
        '.....',
        '.###.',
        '.....',
        '.....',
    );
    const vertical = parse(
        '.....',
        '..#..',
        '..#..',
        '..#..',
        '.....',
    );
    const once = Game.nextGeneration(horizontal);
    assert.deepStrictEqual(once, vertical);
    assert.deepStrictEqual(Game.nextGeneration(once), horizontal);
});

test('the edge of the board is a wall: nothing wraps around to the other side', () => {
    // A blinker in the top row loses the cell that would be above the board.
    assert.deepStrictEqual(Game.nextGeneration(parse(
        '.###.',
        '.....',
        '.....',
        '.....',
        '.....',
    )), parse(
        '..#..',
        '..#..',
        '.....',
        '.....',
        '.....',
    ));
    // A vertical blinker in the left column: nothing appears in the right column.
    assert.deepStrictEqual(Game.nextGeneration(parse(
        '.....',
        '#....',
        '#....',
        '#....',
        '.....',
    )), parse(
        '.....',
        '.....',
        '##...',
        '.....',
        '.....',
    ));
    // A block in the corner stays, and does not feed the opposite corners.
    const corner = parse(
        '....',
        '....',
        '..##',
        '..##',
    );
    assert.deepStrictEqual(Game.nextGeneration(corner), corner);
});

test('a stable block does not change and an empty board stays empty', () => {
    const block = parse(
        '....',
        '.##.',
        '.##.',
        '....',
    );
    assert.deepStrictEqual(Game.nextGeneration(block), block);
    assert.deepStrictEqual(Game.nextGeneration(Game.createBoard()), Game.createBoard());
});

test('nextGeneration works on a non-square board and leaves the input untouched', () => {
    const board = parse(
        '......',
        '.###..',
        '......',
    );
    const next = Game.nextGeneration(board);
    assert.deepStrictEqual(board, parse('......', '.###..', '......'));
    assert.deepStrictEqual(next, parse(
        '..#...',
        '..#...',
        '..#...',
    ));
});
