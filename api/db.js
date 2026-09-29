// The database: a connection pool, and the migrations that run at start.
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Runs the SQL files of migrations/ that have not run yet, in order. */
async function migrate() {
    await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, ran_at timestamptz NOT NULL DEFAULT now())');
    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir).filter((file) => file.endsWith('.sql')).sort();
    for (const file of files) {
        const done = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
        if (done.rowCount > 0) {
            continue;
        }
        await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
        await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        console.log(`migration: ${file}`);
    }
}

module.exports = { pool, migrate };
