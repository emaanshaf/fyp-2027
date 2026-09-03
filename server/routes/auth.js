const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/security');

const router = express.Router();

// SQL RETURNING clauses limit columns only when a real database executes them;
// the local fallback store returns whole rows. Every response that carries a
// user is projected through this so a password hash can never reach a client
// regardless of which backend answered.
function publicUser(row) {
  if (!row) return null;
  const { id, email, name, role, created_at } = row;
  return { id, email, name, role, created_at };
}

// Register
router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('name').isLength({ max: 100 }).withMessage('Name too long'),
], validate, async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const hash = await bcrypt.hash(password, 12);

    // First user becomes admin, subsequent users cannot self-register as admin
    const existingUsers = await query('SELECT COUNT(*) as count FROM users');
    const isFirstUser = parseInt(existingUsers.rows[0].count) === 0;
    const userRole = isFirstUser ? 'admin' : (role === 'admin' ? 'user' : (role || 'user'));

    const result = await query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, hash, name, userRole]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

    res.status(201).json({ user: publicUser(user), token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    next(err);
  }
});

// Login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, email, name, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// Forgot password - send reset email (placeholder for email service integration)
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
], validate, async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If an account exists, a reset link has been sent' });
    }

    // TODO: Implement actual email sending with reset token
    // For now, just return success
    res.json({ message: 'If an account exists, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    next(err);
  }
});

// Update current user profile
router.put('/me', authenticate, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('name').optional().isLength({ max: 100 }),
], validate, async (req, res, next) => {
  try {
    const { name } = req.body;
    const result = await query(
      'UPDATE users SET name = COALESCE($1, name) WHERE id = $2 RETURNING id, email, name, role',
      [name, req.userId]
    );
    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

// Change password
router.put('/change-password', authLimiter, authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], validate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

// ADMIN: Get all users
router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows.map(publicUser));
  } catch (err) {
    next(err);
  }
});

// ADMIN: Update user role
router.put('/users/:userId/role', authenticate, requireAdmin, [
  body('role').isIn(['admin', 'moderator', 'user']).withMessage('Role must be admin, moderator, or user'),
], validate, async (req, res, next) => {
  try {
    const { role } = req.body;
    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
      [role, req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

// ADMIN: Delete user
router.delete('/users/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    if (req.params.userId === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ADMIN: System stats
router.get('/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [users, bookmarks, notes, favs, reminders, tasbih] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM bookmarks'),
      query('SELECT COUNT(*) as count FROM notes'),
      query('SELECT COUNT(*) as count FROM favorite_duas'),
      query('SELECT COUNT(*) as count FROM reminders'),
      query('SELECT COUNT(*) as count FROM tasbih_history'),
    ]);

    res.json({
      users: parseInt(users.rows[0].count),
      bookmarks: parseInt(bookmarks.rows[0].count),
      notes: parseInt(notes.rows[0].count),
      favorites: parseInt(favs.rows[0].count),
      reminders: parseInt(reminders.rows[0].count),
      tasbih: parseInt(tasbih.rows[0].count),
    });
  } catch (err) {
    next(err);
  }
});

// Module access control - check if user's role has access to a module
const MODULE_PERMISSIONS = {
  Dashboard: ['user', 'moderator', 'admin'],
  Home: ['user', 'moderator', 'admin'],
  Quran: ['user', 'moderator', 'admin'],
  Hadith: ['user', 'moderator', 'admin'],
  Duas: ['user', 'moderator', 'admin'],
  Prayer: ['user', 'moderator', 'admin'],
  Tafsir: ['user', 'moderator', 'admin'],
  Hifz: ['user', 'moderator', 'admin'],
  AIQuran: ['user', 'moderator', 'admin'],
  AyahOfDay: ['user', 'moderator', 'admin'],
  HadithVerify: ['user', 'moderator', 'admin'],
  NamesOfAllah: ['user', 'moderator', 'admin'],
  Calendar: ['user', 'moderator', 'admin'],
  PrayerTracker: ['user', 'moderator', 'admin'],
  DuaLibrary: ['user', 'moderator', 'admin'],
  Qibla: ['user', 'moderator', 'admin'],
  Ramadan: ['user', 'moderator', 'admin'],
  QuranJourney: ['user', 'moderator', 'admin'],
  KhatmPlanner: ['user', 'moderator', 'admin'],
  Quiz: ['user', 'moderator', 'admin'],
  Seerah: ['user', 'moderator', 'admin'],
  Prophets: ['user', 'moderator', 'admin'],
  Learning: ['user', 'moderator', 'admin'],
  GoodDeeds: ['user', 'moderator', 'admin'],
  Journal: ['user', 'moderator', 'admin'],
  Zakat: ['user', 'moderator', 'admin'],
  Tasbih: ['user', 'moderator', 'admin'],
  Reminders: ['user', 'moderator', 'admin'],
  Generator: ['moderator', 'admin'],
  Bookmarks: ['user', 'moderator', 'admin'],
  Settings: ['user', 'moderator', 'admin'],
  AIChat: ['user', 'moderator', 'admin'],
};

router.get('/access/:module', authenticate, async (req, res, next) => {
  try {
    const { module } = req.params;
    const allowedRoles = MODULE_PERMISSIONS[module] || ['user'];
    const hasAccess = allowedRoles.includes(req.userRole);
    
    res.json({ 
      module,
      role: req.userRole,
      allowedRoles,
      hasAccess,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
