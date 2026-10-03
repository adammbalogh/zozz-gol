const test = require('node:test');
const assert = require('node:assert');
const Game = require('./game.js');

test('the game module loads', () => {
    assert.strictEqual(typeof Game, 'object');
});
