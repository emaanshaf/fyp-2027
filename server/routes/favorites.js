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
      const result = await query('SELECT * FROM favorite_duas ORDER BY created_at DESC');
      return res.json(result.rows);
    }
    const result = await query('SELECT * FROM favorite_duas WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', writeLimiter, [
  body('dua_id').notEmpty().withMessage('dua_id required'),
  body('dua_title').optional().trim().isLength({ max: 255 }),
], validate, async (req, res, next) => {
  try {
    const { dua_id, dua_title, dua_text, dua_category, source } = req.body;
    const result = await query(
      `INSERT INTO favorite_duas (user_id, dua_id, dua_title, dua_text, dua_category, source)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, dua_id, dua_title, dua_text, dua_category, source]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already favorited' });
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      const result = await query('DELETE FROM favorite_duas WHERE id = $1 RETURNING id', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json({ deleted: true });
    }
    const result = await query('DELETE FROM favorite_duas WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

router.delete('/by-dua/:duaId', async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      const result = await query('DELETE FROM favorite_duas WHERE dua_id = $1 RETURNING id', [req.params.duaId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json({ deleted: true });
    }
    const result = await query('DELETE FROM favorite_duas WHERE dua_id = $1 AND user_id = $2 RETURNING id', [req.params.duaId, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

module.exports = router;
