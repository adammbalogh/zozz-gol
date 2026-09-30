const test = require('node:test');
const assert = require('node:assert');

// No database here: the checks run before it, and saving says when it is gone.
process.env.DATABASE_URL = 'postgres://nobody:nothing@127.0.0.1:1/none';
const app = require('../server.js');
const { validatePattern } = require('../patterns.js');

const valid = { name: 'Sikló', rows: 30, cols: 30, cells: [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]] };

test('validatePattern accepts a pattern and trims its name', () => {
    assert.deepStrictEqual(validatePattern({ ...valid, name: '  Sikló ' }), { pattern: valid });
});

test('validatePattern accepts an empty board', () => {
    assert.deepStrictEqual(validatePattern({ ...valid, cells: [] }).pattern.cells, []);
});

test('validatePattern wants a name', () => {
    for (const name of [undefined, null, '', '   ', 42]) {
        assert.deepStrictEqual(validatePattern({ ...valid, name }), { error: 'name_required' });
    }
    assert.deepStrictEqual(validatePattern(undefined), { error: 'name_required' });
});

test('validatePattern allows names up to 50 characters', () => {
    assert.ok(validatePattern({ ...valid, name: 'a'.repeat(50) }).pattern);
    assert.deepStrictEqual(validatePattern({ ...valid, name: 'a'.repeat(51) }), { error: 'name_too_long' });
});

test('validatePattern wants a board size between 1 and 100', () => {
    for (const size of [0, 101, 2.5, '30', undefined]) {
        assert.deepStrictEqual(validatePattern({ ...valid, rows: size }), { error: 'invalid_board' });
        assert.deepStrictEqual(validatePattern({ ...valid, cols: size }), { error: 'invalid_board' });
    }
});

test('validatePattern wants distinct cells on the board', () => {
    for (const cells of [undefined, 'x', [[0]], [[0, 1, 2]], [[-1, 0]], [[0, 30]], [[30, 0]], [[0.5, 1]], [['1', 2]], [[1, 2], [1, 2]]]) {
        assert.deepStrictEqual(validatePattern({ ...valid, cells }), { error: 'invalid_cells' }, JSON.stringify(cells));
    }
});

async function post(body) {
    const server = app.listen(0);
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/patterns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    server.close();
    return { status: response.status, body: await response.json() };
}

test('saving without a name is refused before the database', async () => {
    assert.deepStrictEqual(await post({ ...valid, name: ' ' }), { status: 400, body: { error: 'name_required' } });
});

test('saving says when the database cannot be reached', async () => {
    assert.deepStrictEqual(await post(valid), { status: 503, body: { error: 'db_unavailable' } });
});
