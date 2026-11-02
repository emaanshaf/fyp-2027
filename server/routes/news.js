// Public headline feed for the Islamic News screen.
//
// No authentication: reading the news should work before sign-in, like the
// health check and the API catalogue. The service caches the merged result,
// so a busy client cannot turn every pull-to-refresh into ten outbound calls.

const express = require('express');
const { getIslamicNews, isKnownNewsSource } = require('../services/islamicNews');

const router = express.Router();

router.get('/', async (req, res) => {
  const source = typeof req.query.source === 'string' && req.query.source.trim()
    ? req.query.source.trim()
    : null;

  if (source && !isKnownNewsSource(source)) {
    return res.status(400).json({
      error: 'Unknown news source',
      reason: 'unknown_source',
    });
  }

  const refresh = req.query.refresh === '1' || req.query.refresh === 'true';

  try {
    const payload = await getIslamicNews({ limit: req.query.limit, source, refresh });
    res.set('Cache-Control', payload.stale ? 'no-store' : 'public, max-age=300');
    return res.json(payload);
  } catch (error) {
    console.warn(`[news] aggregation unavailable: ${error.message}`);
    res.set('Retry-After', '120');
    return res.status(503).json({
      error: 'News feeds are temporarily unavailable',
      reason: 'news_unavailable',
    });
  }
});

module.exports = router;
