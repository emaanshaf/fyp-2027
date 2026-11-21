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
      const result = await query('SELECT * FROM tasbih_history ORDER BY created_at DESC LIMIT 100');
      return res.json(result.rows);
    }
    const result = await query('SELECT * FROM tasbih_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [req.userId]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', writeLimiter, [
  body('dhikr').optional().trim().isLength({ max: 255 }),
  body('count').isInt({ min: 0 }).withMessage('count must be a positive integer'),
  body('target').optional().isInt({ min: 1 }),
], validate, async (req, res, next) => {
  try {
    const { dhikr, count, target, completed } = req.body;
    const result = await query(
      `INSERT INTO tasbih_history (user_id, dhikr, count, target, completed)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, dhikr, count || 0, target || 33, completed || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.get('/stats', async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      const result = await query(`SELECT COUNT(*) as total_sessions, SUM(count) as total_count,
        COUNT(*) FILTER (WHERE completed) as completed_sessions FROM tasbih_history`);
      return res.json(result.rows[0]);
    }
    const result = await query(
      `SELECT COUNT(*) as total_sessions, SUM(count) as total_count,
       COUNT(*) FILTER (WHERE completed) as completed_sessions
       FROM tasbih_history WHERE user_id = $1`, [req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      const result = await query('DELETE FROM tasbih_history WHERE id = $1 RETURNING id', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json({ deleted: true });
    }
    const result = await query('DELETE FROM tasbih_history WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

module.exports = router;
