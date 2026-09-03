const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, requireOwnership } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// ===== HIFZ (Memorization) =====
router.get('/hifz/plans', authenticate, requireOwnership, async (req, res, next) => {
  try {
    const filter = req.ownershipFilter;
    const where = filter.user_id ? `WHERE user_id = '${filter.user_id}'` : '';
    const result = await query(`SELECT * FROM hifz_plans ${where} ORDER BY created_at DESC`, []);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/hifz/plans', authenticate, [
  body('surah_number').isInt({ min: 1, max: 114 }),
  body('target_days').isInt({ min: 1, max: 365 }),
  body('daily_ayahs').isInt({ min: 1, max: 50 }),
], validate, async (req, res, next) => {
  try {
    const { surah_number, target_days, daily_ayahs, notes } = req.body;
    const result = await query(
      'INSERT INTO hifz_plans (user_id, surah_number, target_days, daily_ayahs, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, surah_number, target_days, daily_ayahs, notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/hifz/plans/:id/progress', authenticate, [
  body('ayahs_memorized').isInt({ min: 0 }),
  body('revision_done').optional().isBoolean(),
], validate, async (req, res, next) => {
  try {
    const { ayahs_memorized, revision_done } = req.body;
    const result = await query(
      `UPDATE hifz_plans SET ayahs_memorized = $1, revision_done = COALESCE($2, revision_done),
       completed = (ayahs_memorized >= total_ayahs), updated_at = NOW()
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [ayahs_memorized, revision_done, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/hifz/plans/:id', authenticate, async (req, res, next) => {
  try {
    await query('DELETE FROM hifz_plans WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ===== PERSONAL DUA COLLECTION =====
router.get('/duas/personal', authenticate, requireOwnership, async (req, res, next) => {
  try {
    const filter = req.ownershipFilter;
    const where = filter.user_id ? `WHERE user_id = '${filter.user_id}'` : '';
    const result = await query(`SELECT * FROM personal_duas ${where} ORDER BY created_at DESC`, []);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/duas/personal', authenticate, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('arabic').optional().trim(),
  body('transliteration').optional().trim(),
  body('translation').optional().trim(),
  body('category').optional().trim(),
], validate, async (req, res, next) => {
  try {
    const { title, arabic, transliteration, translation, category, occasion } = req.body;
    const result = await query(
      'INSERT INTO personal_duas (user_id, title, arabic, transliteration, translation, category, occasion) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.userId, title, arabic || '', transliteration || '', translation || '', category || 'custom', occasion || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/duas/personal/:id', authenticate, async (req, res, next) => {
  try {
    await query('DELETE FROM personal_duas WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ===== QURAN REFLECTION JOURNAL =====
router.get('/journal', authenticate, requireOwnership, async (req, res, next) => {
  try {
    const filter = req.ownershipFilter;
    const where = filter.user_id ? `WHERE user_id = '${filter.user_id}'` : '';
    const result = await query(`SELECT * FROM reflections ${where} ORDER BY created_at DESC`, []);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/journal', authenticate, [
  body('surah_number').isInt({ min: 1, max: 114 }),
  body('ayah_number').isInt({ min: 1, max: 286 }),
  body('reflection').trim().notEmpty().withMessage('Reflection text required'),
], validate, async (req, res, next) => {
  try {
    const { surah_number, ayah_number, reflection, mood, tags } = req.body;
    const result = await query(
      'INSERT INTO reflections (user_id, surah_number, ayah_number, reflection, mood, tags) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.userId, surah_number, ayah_number, reflection, mood || '', tags || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/journal/:id', authenticate, async (req, res, next) => {
  try {
    await query('DELETE FROM reflections WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ===== GOOD DEEDS TRACKER =====
router.get('/deeds', authenticate, requireOwnership, async (req, res, next) => {
  try {
    const filter = req.ownershipFilter;
    const where = filter.user_id ? `WHERE user_id = '${filter.user_id}'` : '';
    const result = await query(`SELECT * FROM good_deeds ${where} ORDER BY created_at DESC`, []);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/deeds', authenticate, [
  body('deed_type').trim().notEmpty(),
  body('description').optional().trim(),
], validate, async (req, res, next) => {
  try {
    const { deed_type, description, points } = req.body;
    const result = await query(
      'INSERT INTO good_deeds (user_id, deed_type, description, points) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, deed_type, description || '', points || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.get('/deeds/stats', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT deed_type, COUNT(*) as count, SUM(points) as total_points
       FROM good_deeds WHERE user_id = $1 GROUP BY deed_type ORDER BY count DESC`,
      [req.userId]
    );
    const total = await query(
      'SELECT COUNT(*) as count, SUM(points) as total_points FROM good_deeds WHERE user_id = $1',
      [req.userId]
    );
    res.json({ byType: result.rows, total: total.rows[0] });
  } catch (err) { next(err); }
});

// ===== QURAN TOPIC EXPLORER (Bookmark saved topics) =====
router.get('/topics', authenticate, requireOwnership, async (req, res, next) => {
  try {
    const filter = req.ownershipFilter;
    const where = filter.user_id ? `WHERE user_id = '${filter.user_id}'` : '';
    const result = await query(`SELECT * FROM saved_topics ${where} ORDER BY created_at DESC`, []);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/topics', authenticate, [
  body('topic').trim().notEmpty(),
  body('verses').isArray(),
], validate, async (req, res, next) => {
  try {
    const { topic, verses, notes } = req.body;
    const result = await query(
      'INSERT INTO saved_topics (user_id, topic, verses, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, topic, JSON.stringify(verses), notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
