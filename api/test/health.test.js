const test = require('node:test');
const assert = require('node:assert');

// No database here: health tells so.
process.env.DATABASE_URL = 'postgres://nobody:nothing@127.0.0.1:1/none';
const app = require('../server.js');

test('health says when the database cannot be reached', async () => {
    const server = app.listen(0);
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    server.close();

    assert.strictEqual(response.status, 503);
    assert.deepStrictEqual(await response.json(), { ok: false, db: false });
});
