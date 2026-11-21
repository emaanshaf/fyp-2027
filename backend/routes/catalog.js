// Self-documenting API surface.
//
// Public on purpose: knowing which endpoints exist is not sensitive, and the
// in-app Developer Console needs to read it without a session. Individual
// endpoints still enforce their own authentication.

const express = require('express');
const pkg = require('../package.json');
const { buildCatalog } = require('../config/apiCatalog');

const router = express.Router();

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    service: 'qitabe-noor-api',
    version: pkg.version,
    basePath: '/api',
    generatedAt: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    requestId: req.requestId || null,
    ...buildCatalog(),
  });
});

module.exports = router;
