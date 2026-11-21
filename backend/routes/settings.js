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
      const result = await query('SELECT * FROM user_settings');
      return res.json(result.rows.length > 0 ? result.rows[0] : {});
    }
    const result = await query('SELECT * FROM user_settings WHERE user_id = $1', [req.userId]);
    res.json(result.rows.length > 0 ? result.rows[0] : {});
  } catch (err) { next(err); }
});

router.put('/', writeLimiter, [
  body('theme').optional().isIn(['default', 'light', 'highContrast']),
  body('language').optional().isIn(['en', 'ur', 'ar']),
  body('font_size').optional().isInt({ min: 10, max: 32 }),
  body('notifications_enabled').optional().isBoolean(),
  body('prayer_notifications').optional().isBoolean(),
  body('calculation_method').optional().trim().isLength({ max: 50 }),
  body('madhab').optional().trim().isLength({ max: 50 }),
], validate, async (req, res, next) => {
  try {
    const { theme, language, font_size, notifications_enabled, prayer_notifications,
            calculation_method, madhab, location } = req.body;

    const result = await query(
      `INSERT INTO user_settings (user_id, theme, language, font_size, notifications_enabled,
         prayer_notifications, calculation_method, madhab, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
         theme = COALESCE($2, user_settings.theme),
         language = COALESCE($3, user_settings.language),
         font_size = COALESCE($4, user_settings.font_size),
         notifications_enabled = COALESCE($5, user_settings.notifications_enabled),
         prayer_notifications = COALESCE($6, user_settings.prayer_notifications),
         calculation_method = COALESCE($7, user_settings.calculation_method),
         madhab = COALESCE($8, user_settings.madhab),
         location = COALESCE($9, user_settings.location),
         updated_at = NOW()
       RETURNING *`,
      [req.userId, theme, language, font_size, notifications_enabled,
       prayer_notifications, calculation_method, madhab,
       location ? JSON.stringify(location) : null]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
