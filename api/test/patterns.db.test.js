const test = require('node:test');
const assert = require('node:assert');

// Runs against the real database (DATABASE_URL); skipped without one.
const app = require('../server.js');
const { pool, migrate } = require('../db.js');

const prefix = `test-${process.pid}-`;

async function request(method, body) {
    const server = app.listen(0);
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/patterns`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body && JSON.stringify(body),
    });
    server.close();
    return { status: response.status, body: await response.json() };
}

test('a saved pattern is kept, and saving the same name replaces it', { skip: !process.env.DATABASE_URL && 'no DATABASE_URL' }, async (t) => {
    await migrate();
    t.after(async () => {
        await pool.query('DELETE FROM patterns WHERE name LIKE $1', [`${prefix}%`]);
        await pool.end();
    });
    const name = `${prefix}Sikló`;

    const first = await request('POST', { name, rows: 30, cols: 30, cells: [[0, 1], [1, 2]] });
    assert.strictEqual(first.status, 201);
    assert.strictEqual(first.body.name, name);

    const second = await request('POST', { name: ` ${name} `, rows: 30, cols: 30, cells: [[0, 1], [1, 2], [2, 0]] });
    assert.deepStrictEqual(second, { status: 201, body: first.body });

    const list = await request('GET');
    assert.strictEqual(list.status, 200);
    const saved = list.body.filter((pattern) => pattern.name === name);
    assert.strictEqual(saved.length, 1);
    assert.strictEqual(saved[0].cellCount, 3);
    assert.strictEqual(list.body[0].name, name);

    const stored = await pool.query('SELECT cells FROM patterns WHERE name = $1', [name]);
    assert.deepStrictEqual(stored.rows[0].cells, [[0, 1], [1, 2], [2, 0]]);
});
