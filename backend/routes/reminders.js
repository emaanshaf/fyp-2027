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
      const result = await query('SELECT * FROM reminders ORDER BY created_at DESC');
      return res.json(result.rows);
    }
    const result = await query('SELECT * FROM reminders WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', writeLimiter, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('title').isLength({ max: 255 }),
  body('time').optional().trim().isLength({ max: 20 }),
  body('type').optional().isIn(['prayer', 'custom', 'daily']),
], validate, async (req, res, next) => {
  try {
    const { title, description, time, days, enabled, type } = req.body;
    const result = await query(
      `INSERT INTO reminders (user_id, title, description, time, days, enabled, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, title, description, time, JSON.stringify(days || []), enabled !== false, type || 'custom']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', writeLimiter, async (req, res, next) => {
  try {
    const { title, description, time, days, enabled } = req.body;
    if (req.userRole === 'admin') {
      const result = await query(
        `UPDATE reminders SET title = COALESCE($1, title), description = COALESCE($2, description),
         time = COALESCE($3, time), days = COALESCE($4, days), enabled = COALESCE($5, enabled)
         WHERE id = $6 RETURNING *`,
        [title, description, time, days ? JSON.stringify(days) : null, enabled, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(result.rows[0]);
    }
    const result = await query(
      `UPDATE reminders SET title = COALESCE($1, title), description = COALESCE($2, description),
       time = COALESCE($3, time), days = COALESCE($4, days), enabled = COALESCE($5, enabled)
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [title, description, time, days ? JSON.stringify(days) : null, enabled, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      const result = await query('DELETE FROM reminders WHERE id = $1 RETURNING id', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json({ deleted: true });
    }
    const result = await query('DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

module.exports = router;
