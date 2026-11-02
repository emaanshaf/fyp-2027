const express = require('express');
const { body, query: qv, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/security');
const { validate } = require('../middleware/validate');

const router = express.Router();

// GET /api/deeds?date=YYYY-MM-DD
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { date } = req.query;
    let sql = 'SELECT * FROM good_deeds WHERE user_id = $1';
    const params = [req.userId];
    if (date) {
      sql += ' AND deed_date = $2';
      params.push(date);
    }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json({ deeds: result.rows });
  } catch (err) { next(err); }
});

// POST /api/deeds
router.post('/', authenticate, writeLimiter, [
  body('type').notEmpty().withMessage('Type is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('points').optional().isInt({ min: 1, max: 100 }),
], validate, async (req, res, next) => {
  try {
    const { type, name, points, deed_date, deed_time } = req.body;
    const result = await query(
      'INSERT INTO good_deeds (user_id, type, name, points, deed_date, deed_time) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.userId, type, name, points || 1, deed_date || new Date().toISOString().split('T')[0], deed_time || null]
    );
    res.status(201).json({ deed: result.rows[0] });
  } catch (err) { next(err); }
});

// GET /api/deeds/stats
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [total, todayCount, points, streakData] = await Promise.all([
      query('SELECT COUNT(*) as count FROM good_deeds WHERE user_id=$1', [req.userId]),
      query('SELECT COUNT(*) as count FROM good_deeds WHERE user_id=$1 AND deed_date=$2', [req.userId, today]),
      query('SELECT COALESCE(SUM(points),0) as total FROM good_deeds WHERE user_id=$1', [req.userId]),
      query('SELECT DISTINCT deed_date FROM good_deeds WHERE user_id=$1 ORDER BY deed_date DESC LIMIT 60', [req.userId]),
    ]);
    // Calculate streak
    let streak = 0;
    const dates = streakData.rows.map(r => r.deed_date.toISOString().split('T')[0]);
    const now = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (dates.includes(key)) streak++;
      else if (i > 0) break;
    }
    res.json({
      total: parseInt(total.rows[0].count),
      today: parseInt(todayCount.rows[0].count),
      totalPoints: parseInt(points.rows[0].total),
      streak,
    });
  } catch (err) { next(err); }
});

// DELETE /api/deeds/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM good_deeds WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deed not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

module.exports = router;
