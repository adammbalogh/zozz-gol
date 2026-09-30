// Saved patterns: the live cells of a board, under a name.
const express = require('express');
const { pool } = require('./db');

const MAX_NAME_LENGTH = 50;
const MAX_SIZE = 100;

const isIndex = (value, limit) => Number.isInteger(value) && value >= 0 && value < limit;
const isSize = (value) => Number.isInteger(value) && value >= 1 && value <= MAX_SIZE;

/**
 * Checks a pattern sent by the page: { name, rows, cols, cells: [[row, col], ...] }.
 * Returns { pattern } with the trimmed name, or { error } with what is wrong.
 */
function validatePattern(body) {
    const { name, rows, cols, cells } = body || {};
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (trimmed === '') {
        return { error: 'name_required' };
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
        return { error: 'name_too_long' };
    }
    if (!isSize(rows) || !isSize(cols)) {
        return { error: 'invalid_board' };
    }
    if (!Array.isArray(cells)) {
        return { error: 'invalid_cells' };
    }
    const seen = new Set();
    for (const cell of cells) {
        if (!Array.isArray(cell) || cell.length !== 2 || !isIndex(cell[0], rows) || !isIndex(cell[1], cols)) {
            return { error: 'invalid_cells' };
        }
        const key = `${cell[0]},${cell[1]}`;
        if (seen.has(key)) {
            return { error: 'invalid_cells' };
        }
        seen.add(key);
    }
    return { pattern: { name: trimmed, rows, cols, cells } };
}

const router = express.Router();

// Saves a pattern; a pattern with the same name is replaced.
router.post('/api/patterns', async (req, res) => {
    const { pattern, error } = validatePattern(req.body);
    if (error) {
        return res.status(400).json({ error });
    }
    try {
        const result = await pool.query(
            `INSERT INTO patterns (name, rows, cols, cells) VALUES ($1, $2, $3, $4)
             ON CONFLICT (name) DO UPDATE
             SET rows = EXCLUDED.rows, cols = EXCLUDED.cols, cells = EXCLUDED.cells, updated_at = now()
             RETURNING id, name`,
            [pattern.name, pattern.rows, pattern.cols, JSON.stringify(pattern.cells)],
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(503).json({ error: 'db_unavailable' });
    }
});

// The saved patterns, the most recently saved first.
router.get('/api/patterns', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, jsonb_array_length(cells) AS "cellCount", updated_at AS "updatedAt"
             FROM patterns ORDER BY updated_at DESC, id DESC`,
        );
        res.json(result.rows);
    } catch (err) {
        res.status(503).json({ error: 'db_unavailable' });
    }
});

module.exports = { router, validatePattern };
