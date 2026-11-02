const express = require('express');
const cors = require('cors');
const { port, corsOrigin, isProduction } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { ready: dbReady } = require('./config/database');
const {
  requestContext, securityHeaders, generalLimiter, writeLimiter,
  sanitizeInput, securityLogger,
} = require('./middleware/security');

const catalogRoutes = require('./routes/catalog');
const authRoutes = require('./routes/auth');
const bookmarkRoutes = require('./routes/bookmarks');
const noteRoutes = require('./routes/notes');
const favoriteRoutes = require('./routes/favorites');
const prayerToggleRoutes = require('./routes/prayerToggles');
const reminderRoutes = require('./routes/reminders');
const tasbihRoutes = require('./routes/tasbih');
const settingsRoutes = require('./routes/settings');
const moduleRoutes = require('./routes/modules');
const aiRoutes = require('./routes/ai');
const deedsRoutes = require('./routes/deeds');
const journalRoutes = require('./routes/journal');
const khatmRoutes = require('./routes/khatm');
const newsRoutes = require('./routes/news');

const app = express();

// Rate limiters key off req.ip, which is the proxy's address unless Express is
// told to trust the forwarding header. Without this, one abusive client behind
// a load balancer rate-limits everybody.
app.set('trust proxy', isProduction ? 1 : false);

// Request identity first, so every response — including rejected ones — can
// be traced back to one line in the server log.
app.use(requestContext);
app.use(securityHeaders);
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Without this the browser hides the header from the app; native fetch
    // does not impose that restriction.
    exposedHeaders: ['X-Request-Id'],
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeInput);
app.use(securityLogger);
app.use(generalLimiter);

// The catalogue sits above the routers so GET /api is not answered by the
// 404 handler. It is public, rate-limited like everything else, and reads
// nothing from the database.
app.use('/api', catalogRoutes);

// Health check (no auth needed)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'qitabe-noor-api',
    timestamp: new Date().toISOString(),
  });
});

// Routes.
//
// Write-heavy routes get the tighter limiter. These limiters existed in
// security.js but were never mounted, so every endpoint sat on the general
// 100-per-15-minutes allowance.
//
// The credential limiter is applied inside routes/auth.js to the specific
// endpoints that verify a secret. Applying it to the whole auth router would
// also throttle GET /auth/me, which the app calls on every launch — ten app
// opens in fifteen minutes is normal use, not an attack.
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', writeLimiter, bookmarkRoutes);
app.use('/api/notes', writeLimiter, noteRoutes);
app.use('/api/favorites', writeLimiter, favoriteRoutes);
app.use('/api/prayer-toggles', writeLimiter, prayerToggleRoutes);
app.use('/api/reminders', writeLimiter, reminderRoutes);
app.use('/api/tasbih', writeLimiter, tasbihRoutes);
app.use('/api/settings', writeLimiter, settingsRoutes);
app.use('/api/modules', moduleRoutes);
// The AI router applies its own auth and limiter per endpoint: /ai/status is
// public so the app can explain an offline assistant without a login.
app.use('/api/ai', aiRoutes);
app.use('/api/deeds', writeLimiter, deedsRoutes);
app.use('/api/journal', writeLimiter, journalRoutes);
app.use('/api/khatm', writeLimiter, khatmRoutes);
// Public and cache-backed: a feed refresh is one outbound fan-out server-side,
// not one per reader.
app.use('/api/news', newsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Error handler
app.use(errorHandler);

// Wait for the database probe before accepting traffic. In production an
// unreachable database exits the process from inside that probe, and binding
// the port first would mean serving requests against the fallback store for
// the couple of seconds before that happened.
let server;
dbReady.then(() => {
  server = app.listen(port, () => {
    console.log(`Qitabe Noor API running on http://localhost:${port}`);
    console.log(`  catalogue: GET /api — every endpoint, grouped and documented`);
    console.log(`  security : helmet, rate limiting, input sanitisation`);
    console.log(`  auth     : JWT + bcrypt, RBAC (admin/moderator/user)`);
    const corsLabel = Array.isArray(corsOrigin)
      ? corsOrigin.join(', ')
      : (corsOrigin.description || String(corsOrigin));
    console.log(`  cors     : ${corsLabel}`);
  });
});

// Let the process exit cleanly so nodemon/--watch restarts don't leak the port.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`\n${signal} received, shutting down.`);
    // `server` is only assigned once the database probe resolves, so a signal
    // arriving during startup would otherwise throw on undefined.
    if (server) return server.close(() => process.exit(0));
    process.exit(0);
  });
}

module.exports = app;
