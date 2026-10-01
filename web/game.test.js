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

test('liveCells lists no cells for an empty board', () => {
    assert.deepStrictEqual(Game.liveCells(Game.createBoard()), []);
});

test('liveCells lists the live cells row by row', () => {
    let board = Game.createBoard(3, 3);
    for (const [row, col] of [[2, 2], [0, 1], [2, 0], [1, 2]]) {
        board = Game.toggleCell(board, row, col);
    }
    assert.deepStrictEqual(Game.liveCells(board), [[0, 1], [1, 2], [2, 0], [2, 2]]);
});

test('patternName trims the spaces around the name', () => {
    assert.strictEqual(Game.patternName('  Sikló '), 'Sikló');
    assert.strictEqual(Game.patternName('Két szó'), 'Két szó');
});

test('patternName is empty for a blank name', () => {
    for (const text of ['', '   ', '\t\n', undefined, null]) {
        assert.strictEqual(Game.patternName(text), '');
    }
});

test('boardFromCells gives back the board the cells were taken from', () => {
    let board = Game.createBoard();
    for (const [row, col] of [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2], [29, 29]]) {
        board = Game.toggleCell(board, row, col);
    }
    assert.deepStrictEqual(Game.boardFromCells(Game.liveCells(board)), board);
});

test('boardFromCells makes an empty 30x30 board from no cells', () => {
    assert.deepStrictEqual(Game.boardFromCells([]), Game.createBoard());
    assert.deepStrictEqual(Game.boardFromCells(undefined), Game.createBoard());
});

test('boardFromCells leaves out the cells that are not on the board', () => {
    const cells = [[1, 1], [-1, 0], [0, 3], [3, 0], [0.5, 1], ['1', 2], [1], null, 'x'];
    assert.deepStrictEqual(Game.boardFromCells(cells, 3, 3), [
        [false, false, false],
        [false, true, false],
        [false, false, false],
    ]);
});

test('formatSavedAt shows the date and time with leading zeros', () => {
    assert.strictEqual(Game.formatSavedAt(new Date(2026, 8, 30, 13, 9)), '2026. 09. 30. 13:09');
    assert.strictEqual(Game.formatSavedAt(new Date(2027, 0, 5, 7, 45).toISOString()), '2027. 01. 05. 07:45');
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

test('automatic play steps 5 generations per second', () => {
    assert.strictEqual(Game.GENERATIONS_PER_SECOND, 5);
    assert.strictEqual(Game.stepInterval(), 200);
    assert.strictEqual(Game.stepInterval(10), 100);
});

test('the speed ranges from 1 to 20 generations per second', () => {
    assert.strictEqual(Game.MIN_SPEED, 1);
    assert.strictEqual(Game.MAX_SPEED, 20);
    assert.strictEqual(Game.stepInterval(1), 1000);
    assert.strictEqual(Game.stepInterval(20), 50);
});

test('speedFromSetting keeps a valid speed', () => {
    assert.strictEqual(Game.speedFromSetting('12'), 12);
    assert.strictEqual(Game.speedFromSetting(1), 1);
    assert.strictEqual(Game.speedFromSetting(20), 20);
    assert.strictEqual(Game.speedFromSetting(' 7 '), 7);
});

test('speedFromSetting gives the default speed for a missing or unreadable setting', () => {
    for (const value of [null, undefined, '', '  ', 'abc', NaN, Infinity, '5x', {}]) {
        assert.strictEqual(Game.speedFromSetting(value), 5, String(value));
    }
});

test('speedFromSetting brings a speed outside the range to the nearest end', () => {
    assert.strictEqual(Game.speedFromSetting(0), 1);
    assert.strictEqual(Game.speedFromSetting('-3'), 1);
    assert.strictEqual(Game.speedFromSetting(99), 20);
    assert.strictEqual(Game.speedFromSetting('21'), 20);
});

test('speedFromSetting rounds to a whole number of generations per second', () => {
    assert.strictEqual(Game.speedFromSetting(7.6), 8);
    assert.strictEqual(Game.speedFromSetting('2.4'), 2);
    assert.strictEqual(Game.speedFromSetting(0.4), 1);
});
