const express = require('express');
const { body } = require('express-validator');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/security');
const { validate } = require('../middleware/validate');

const router = express.Router();

// GET /api/journal
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM reflection_journal WHERE user_id=$1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ entries: result.rows });
  } catch (err) { next(err); }
});

// POST /api/journal
router.post('/', authenticate, writeLimiter, [
  body('reflection').notEmpty().trim().withMessage('Reflection text is required'),
  body('reflection').isLength({ max: 5000 }),
], validate, async (req, res, next) => {
  try {
    const { surah, ayah, reflection, mood } = req.body;
    const result = await query(
      'INSERT INTO reflection_journal (user_id, surah, ayah, reflection, mood) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.userId, surah || null, ayah || null, reflection.trim(), mood || null]
    );
    res.status(201).json({ entry: result.rows[0] });
  } catch (err) { next(err); }
});

// PUT /api/journal/:id  (edit entry)
router.put('/:id', authenticate, writeLimiter, [
  body('reflection').optional().notEmpty().trim(),
  body('reflection').optional().isLength({ max: 5000 }),
], validate, async (req, res, next) => {
  try {
    const { surah, ayah, reflection, mood } = req.body;
    const result = await query(
      `UPDATE reflection_journal SET
        surah = COALESCE($1, surah),
        ayah = COALESCE($2, ayah),
        reflection = COALESCE($3, reflection),
        mood = COALESCE($4, mood),
        updated_at = NOW()
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [surah, ayah, reflection?.trim() || null, mood || null, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json({ entry: result.rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/journal/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM reflection_journal WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

module.exports = router;
