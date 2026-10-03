// The API: everything under /api.
const express = require('express');
const { pool, migrate } = require('./db');

const app = express();
app.use(express.json());

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true, db: true });
    } catch (error) {
        res.status(503).json({ ok: false, db: false });
    }
});

if (require.main === module) {
    const port = Number(process.env.PORT || 3000);
    migrate()
        .then(() => app.listen(port, () => console.log(`API: http://localhost:${port}`)))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = app;
