const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/health
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now');
    res.json({ status: 'ok', db_time: result.rows[0].now });
  } catch (err) {
    console.error('DB health check failed:', err);
    res.status(500).json({ status: 'error', message: 'Database unreachable' });
  }
});

module.exports = router;
