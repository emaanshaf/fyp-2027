const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Helmet - sets secure HTTP headers
const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

// Rate limiter - general (100 requests per 15 min)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Rate limiter - auth endpoints (10 requests per 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
});

// Rate limiter - write endpoints (30 requests per 15 min)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please try again later' },
});

// Fields that must be passed through byte-for-byte. Rewriting a password
// silently changes the credential — a user whose password contains '<' would
// register one value and then be unable to log in with it.
const RAW_FIELDS = new Set(['password', 'newPassword', 'currentPassword', 'confirmPassword']);

// Sanitize input - strip all HTML tags and dangerous patterns
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (RAW_FIELDS.has(key)) continue;
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/<[^>]*>/g, '')           // Strip all HTML tags
          .replace(/javascript:/gi, '')       // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, '')         // Remove on* event handlers
          .replace(/data:/gi, '')             // Remove data: protocol
          .replace(/vbscript:/gi, '')         // Remove vbscript: protocol
          .trim();
      }
    }
  }
  next();
}

// Request size limiter
function requestSizeCheck(maxBytes = 1024 * 100) {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > maxBytes) {
      return res.status(413).json({ error: 'Request too large' });
    }
    next();
  };
}

// Security logging
function securityLogger(req, res, next) {
  const suspicious = [
    '../', '..\\', 'union select', 'drop table', 'insert into',
    '<script', 'javascript:', 'onerror=', 'onload=',
    'eval(', 'exec(', 'cmd.exe', '/bin/sh',
  ];
  // Only the URL is inspected. Scanning the body meant a user saving a
  // reflection note that quoted '<script' got a 403 on their own content.
  const url = decodeURIComponent(req.url).toLowerCase();
  for (const pattern of suspicious) {
    if (url.includes(pattern.toLowerCase())) {
      console.warn(`[SECURITY] Suspicious request blocked: ${req.method} ${req.url} from ${req.ip}`);
      return res.status(403).json({ error: 'Request blocked for security reasons' });
    }
  }
  next();
}

module.exports = {
  securityHeaders,
  generalLimiter,
  authLimiter,
  writeLimiter,
  sanitizeInput,
  requestSizeCheck,
  securityLogger,
};
