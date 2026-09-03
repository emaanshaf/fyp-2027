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
      const result = await query('SELECT * FROM notes ORDER BY updated_at DESC');
      return res.json(result.rows);
    }
    const result = await query('SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', writeLimiter, [
  body('title').optional().trim().isLength({ max: 500 }),
  body('content').optional().trim().isLength({ max: 10000 }),
], validate, async (req, res, next) => {
  try {
    const { title, content, category, surah_number, ayah_number } = req.body;
    const result = await query(
      `INSERT INTO notes (user_id, title, content, category, surah_number, ayah_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, title, content, category, surah_number, ayah_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', writeLimiter, async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    if (req.userRole === 'admin') {
      const result = await query(
        `UPDATE notes SET title = COALESCE($1, title), content = COALESCE($2, content),
         category = COALESCE($3, category), updated_at = NOW() WHERE id = $4 RETURNING *`,
        [title, content, category, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(result.rows[0]);
    }
    const result = await query(
      `UPDATE notes SET title = COALESCE($1, title), content = COALESCE($2, content),
       category = COALESCE($3, category), updated_at = NOW()
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [title, content, category, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      const result = await query('DELETE FROM notes WHERE id = $1 RETURNING id', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json({ deleted: true });
    }
    const result = await query('DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

module.exports = router;
