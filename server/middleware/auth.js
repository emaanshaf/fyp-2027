const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { query } = require('../config/database');

// Authenticate - verify JWT token and attach user to req
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;

    // Fetch user role from database
    const result = await query('SELECT id, email, name, role FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    req.userRole = result.rows[0].role || 'user';
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Require specific roles
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Require admin or moderator
const requireModerator = requireRole('admin', 'moderator');
const requireAdmin = requireRole('admin');

// Require admin or self (for profile operations)
function requireAdminOrSelf(req, res, next) {
  if (req.userRole === 'admin' || req.params.userId === req.userId) {
    return next();
  }
  return res.status(403).json({ error: 'Can only access your own data' });
}

// Ensure user can only access their own resources
function requireOwnership(req, res, next) {
  req.ownershipFilter = { user_id: req.userId };
  if (req.userRole === 'admin' || req.userRole === 'moderator') {
    req.ownershipFilter = {};
  }
  next();
}

module.exports = {
  authenticate,
  requireRole,
  requireAdmin,
  requireModerator,
  requireAdminOrSelf,
  requireOwnership,
};
