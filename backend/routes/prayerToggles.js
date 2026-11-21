const express = require('express');
const { body } = require('express-validator');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { writeLimiter } = require('../middleware/security');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      const result = await query('SELECT * FROM prayer_toggles');
      return res.json(result.rows.length > 0 ? result.rows[0] : { toggles: {} });
    }
    const result = await query('SELECT * FROM prayer_toggles WHERE user_id = $1', [req.userId]);
    res.json(result.rows.length > 0 ? result.rows[0] : { toggles: {} });
  } catch (err) { next(err); }
});

router.put('/', writeLimiter, async (req, res, next) => {
  try {
    const { toggles } = req.body;
    if (!toggles || typeof toggles !== 'object') {
      return res.status(400).json({ error: 'toggles object required' });
    }
    const result = await query(
      `INSERT INTO prayer_toggles (user_id, toggles)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET toggles = $2, updated_at = NOW()
       RETURNING *`,
      [req.userId, JSON.stringify(toggles)]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
