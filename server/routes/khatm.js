const express = require('express');
const { body } = require('express-validator');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/security');
const { validate } = require('../middleware/validate');

const router = express.Router();

// GET /api/khatm
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM khatm_plans WHERE user_id=$1',
      [req.userId]
    );
    res.json({ plan: result.rows[0] || null });
  } catch (err) { next(err); }
});

// PUT /api/khatm (upsert)
router.put('/', authenticate, writeLimiter, [
  body('plan_id').notEmpty(),
  body('current_page').isInt({ min: 0, max: 604 }),
], validate, async (req, res, next) => {
  try {
    const { plan_id, plan_days, plan_label, current_page, start_date, streak } = req.body;
    const result = await query(
      `INSERT INTO khatm_plans (user_id, plan_id, plan_days, plan_label, current_page, start_date, streak)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id) DO UPDATE SET
         plan_id = EXCLUDED.plan_id,
         plan_days = EXCLUDED.plan_days,
         plan_label = EXCLUDED.plan_label,
         current_page = EXCLUDED.current_page,
         start_date = EXCLUDED.start_date,
         streak = EXCLUDED.streak,
         updated_at = NOW()
       RETURNING *`,
      [req.userId, plan_id, plan_days || 30, plan_label || null, current_page, start_date || new Date().toISOString(), streak || 0]
    );
    res.json({ plan: result.rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/khatm
router.delete('/', authenticate, async (req, res, next) => {
  try {
    await query('DELETE FROM khatm_plans WHERE user_id=$1', [req.userId]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

module.exports = router;
