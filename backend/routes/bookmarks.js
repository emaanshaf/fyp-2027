const express = require('express');
const { body } = require('express-validator');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { writeLimiter } = require('../middleware/security');

const router = express.Router();
router.use(authenticate);

function ownerFilter(req) {
  return req.userRole === 'admin' ? '' : 'AND user_id = $1';
}

router.get('/', async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      const result = await query('SELECT * FROM bookmarks ORDER BY created_at DESC');
      return res.json(result.rows);
    }
    const result = await query('SELECT * FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', writeLimiter, [
  body('surah_number').isInt({ min: 1, max: 114 }),
  body('ayah_number').isInt({ min: 1 }),
], validate, async (req, res, next) => {
  try {
    const { surah_number, surah_name, ayah_number, ayah_text, page, juz, note } = req.body;
    const result = await query(
      `INSERT INTO bookmarks (user_id, surah_number, surah_name, ayah_number, ayah_text, page, juz, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.userId, surah_number, surah_name, ayah_number, ayah_text, page, juz, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', writeLimiter, async (req, res, next) => {
  try {
    const { note } = req.body;
    if (req.userRole === 'admin') {
      const result = await query('UPDATE bookmarks SET note = $1 WHERE id = $2 RETURNING *', [note, req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(result.rows[0]);
    }
    const result = await query('UPDATE bookmarks SET note = $1 WHERE id = $2 AND user_id = $3 RETURNING *', [note, req.params.id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      const result = await query('DELETE FROM bookmarks WHERE id = $1 RETURNING id', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json({ deleted: true });
    }
    const result = await query('DELETE FROM bookmarks WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

module.exports = router;
