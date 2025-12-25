const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');

// Initialize tables if they don't exist
const initTables = async () => {
    let conn;
    try {
        conn = await pool.getConnection();

        // Stats table: single row with ID=1 to store aggregate counts
        await conn.query(`
            CREATE TABLE IF NOT EXISTS visitor_stats (
                id INT PRIMARY KEY,
                visits INT DEFAULT 0,
                clicks INT DEFAULT 0
            )
        `);
        // Initialize row if empty
        await conn.query(`
            INSERT IGNORE INTO visitor_stats (id, visits, clicks) VALUES (1, 0, 0)
        `);

        // IPs table: to check for unique visitors
        // ip_hash is SHA-256 hex string (64 chars)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS visited_ips (
                ip_hash VARCHAR(64) PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Visitor tracking tables initialized');
    } catch (err) {
        console.error('❌ Failed to initialize visitor stats tables:', err);
    } finally {
        if (conn) conn.release();
    }
};

// Run initialization
initTables();

// Helper to hash IP
const hashIP = (ip) => {
    return crypto.createHash('sha256').update(ip).digest('hex');
};

// GET /api/public/stats
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT visits, clicks FROM visitor_stats WHERE id = 1');
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.json({ visits: 0, clicks: 0 });
        }
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// POST /api/public/stats/visit
router.post('/visit', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ipHash = hashIP(ip);

    let conn;
    try {
        conn = await pool.getConnection();

        // Try to insert IP
        try {
            await conn.query('INSERT INTO visited_ips (ip_hash) VALUES (?)', [ipHash]);

            // If successful (no duplicate key error), increment visits
            await conn.query('UPDATE visitor_stats SET visits = visits + 1 WHERE id = 1');

            // Get updated stats
            const [rows] = await conn.query('SELECT visits, clicks FROM visitor_stats WHERE id = 1');
            res.json({ success: true, newVisit: true, ...rows[0] });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                // Already visited
                const [rows] = await conn.query('SELECT visits, clicks FROM visitor_stats WHERE id = 1');
                res.json({ success: true, newVisit: false, ...rows[0] });
            } else {
                throw err;
            }
        }
    } catch (err) {
        console.error('Error recording visit:', err);
        res.status(500).json({ error: 'Failed to record visit' });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/public/stats/click
router.post('/click', async (req, res) => {
    try {
        await pool.query('UPDATE visitor_stats SET clicks = clicks + 1 WHERE id = 1');
        const [rows] = await pool.query('SELECT visits, clicks FROM visitor_stats WHERE id = 1');
        res.json({ success: true, ...rows[0] });
    } catch (err) {
        console.error('Error recording click:', err);
        res.status(500).json({ error: 'Failed to record click' });
    }
});

module.exports = router;
