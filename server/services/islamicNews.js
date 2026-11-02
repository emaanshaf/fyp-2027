// Islamic news aggregation.
//
// The app never calls publishers directly: one request fans out to a small,
// curated set of RSS feeds, normalises the items and caches the merged result.
// A feed that is blocked, slow or returning garbage therefore degrades into a
// missing source rather than a broken screen. Nothing user-supplied reaches
// the outbound request, so this cannot be used as an SSRF proxy.
//
// Only headline, short excerpt, image and a link are republished. The reader
// always opens the original article on the publisher's site.

const { mineNews } = require('./newsTextMining');

// Al Jazeera's main feed is global. Keep the stories that concern Muslims or
// the Muslim world, so this stays an Islamic-news screen rather than a copy of
// a general world wire. Demonyms need a suffix group: `\boman\b` is what keeps
// "woman" out, while `iran\w*` is what lets "Iranian" in.
const MUSLIM_WORLD =
  /\b(?:islam\w*|muslim\w*|mosque\w*|quran\w*|hadith\w*|ramadan\w*|eid|hajj\w*|umrah|hijab\w*|sharia\w*|ummah|gaza|palestin\w*|jerusalem|al[- ]?aqsa|west bank|iran\w*|iraq\w*|syria\w*|leban\w*|egypt\w*|saudi\w*|yemen\w*|sudan\w*|pakistan\w*|bangladesh\w*|afghan\w*|turk\w*|t(?:ü|u)rkiye|indonesia\w*|malaysia\w*|nigeria\w*|somali\w*|morocc\w*|algeri\w*|tunisi\w*|libya\w*|jordan\w*|qatar\w*|kuwait\w*|bahrain\w*|oman|dubai)\b/i;

const FEEDS = [
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    homepage: 'https://www.aljazeera.com',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    // The English site refuses connections from some hosting networks. When
    // the owned RSS feed is unreachable, the same publisher's headlines are
    // read through Google News' site-scoped feed; links still open the story.
    fallbackUrl:
      'https://news.google.com/rss/search?q=site%3Aaljazeera.com+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen',
    stripTitle: /\s*[-–—]\s*Al Jazeera(?: English)?\s*$/i,
    filter: item =>
      MUSLIM_WORLD.test(`${item.title} ${item.summary} ${item.categories.join(' ')}`),
  },
  {
    id: 'middle-east-eye',
    name: 'Middle East Eye',
    homepage: 'https://www.middleeasteye.net',
    url: 'https://www.middleeasteye.net/rss',
  },
  {
    id: 'middle-east-monitor',
    name: 'Middle East Monitor',
    homepage: 'https://www.middleeastmonitor.com',
    url: 'https://www.middleeastmonitor.com/feed/',
  },
  {
    id: 'guardian-islam',
    name: 'The Guardian · Islam',
    homepage: 'https://www.theguardian.com/world/islam',
    url: 'https://www.theguardian.com/world/islam/rss',
  },
  {
    id: 'about-islam',
    name: 'About Islam',
    homepage: 'https://aboutislam.net',
    url: 'https://aboutislam.net/feed/',
  },
  {
    id: 'religion-news',
    name: 'Religion News Service',
    homepage: 'https://religionnews.com',
    url: 'https://religionnews.com/feed/',
    // RNS covers every faith. Keep only the stories that concern Muslims, so
    // the feed stays an Islamic-news feed rather than a general religion wire.
    filter: item =>
      /islam|muslim|mosque|quran|ramadan|eid|hajj|hijab|sharia/i.test(
        `${item.title} ${item.summary} ${item.categories.join(' ')}`
      ),
  },
];

const CACHE_TTL_MS = 10 * 60 * 1000;
const FEED_TIMEOUT_MS = 8000;
const MAX_FEED_BYTES = 2 * 1024 * 1024;
const MAX_ITEMS = 60;
const MAX_ITEMS_PER_FEED = 25;

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  hellip: '…',
  bull: '•',
  middot: '·',
  copy: '©',
  reg: '®',
  trade: '™',
  laquo: '«',
  raquo: '»',
  times: '×',
  divide: '÷',
  deg: '°',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  ccedil: 'ç',
  ouml: 'ö',
  uuml: 'ü',
  auml: 'ä',
  szlig: 'ß',
};

/** Cache of the last merged snapshot, shared by every request in the process. */
let cache = null;
let inflight = null;

/**
 * Last successfully parsed items per feed. Kept separately from the merged
 * cache so one failing source keeps its last-known headlines while the others
 * still refresh.
 */
const lastGoodBySource = new Map();

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCodePoint(Number.parseInt(hex, 16));
      } catch {
        return '';
      }
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCodePoint(Number.parseInt(dec, 10));
      } catch {
        return '';
      }
    })
    .replace(/&([a-z][a-z0-9]+);/gi, (match, name) => {
      const decoded = NAMED_ENTITIES[name.toLowerCase()];
      return decoded === undefined ? match : decoded;
    });
}

function truncate(text, max) {
  if (!text || text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const body = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${body.trim()}…`;
}

/**
 * RSS bodies are HTML inside XML, often escaped once or twice. Strip markup
 * before decoding entities: feeds such as Middle East Monitor put an encoded
 * caption (`&lt;p&gt;…&lt;/p&gt;`) inside an `<img>` attribute, and decoding
 * first would split the tag and leak the caption into the summary. After the
 * raw strip, decode and strip again for double-encoded bodies.
 */
function cleanText(value, maxLength = 400) {
  if (!value) return '';

  let text = String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

  text = text
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<![^>]*>/g, ' ')
    .replace(/<[^>]+>/g, ' ');

  // Two passes cover feeds that entity-encode their markup, including img
  // attributes whose decoded caption would otherwise break a later tag.
  for (let pass = 0; pass < 2; pass += 1) {
    text = decodeEntities(text).replace(/<[^>]+>/g, ' ');
  }

  text = text
    // Middle East Eye prefixes every description with its own byline and
    // timestamp ("Submitted by MEE staff on Mon, 11/02/2026 - 14:57"). The
    // byline can sit behind the headline markup, so this is not anchored.
    .replace(/\bSubmitted by\b[^.]*?\bon\s+[A-Z][a-z]{2},\s*\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}:\d{2}\s*/i, ' ')
    .replace(/The post\b[\s\S]*?appeared first on\b[\s\S]*$/i, ' ')
    .replace(/Continue reading[.…\s]*$/i, ' ')
    .replace(/Read the full (?:story|article)[.…\s]*$/i, ' ')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return truncate(text, maxLength);
}

/** Contents of the first matching element, without decoding it. */
function firstTag(xml, name) {
  const pattern = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i');
  const match = String(xml ?? '').match(pattern);
  return match ? match[1] : '';
}

function attrValue(markup, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i');
  const match = String(markup ?? '').match(pattern);
  return match ? decodeEntities(match[1]) : '';
}

/** Absolute http(s) URL, or null. Rejects data:, javascript: and relative paths. */
function safeUrl(value) {
  const decoded = decodeEntities(String(value ?? '')).trim();
  const absolute = decoded.startsWith('//') ? `https:${decoded}` : decoded;
  return /^https?:\/\/[^\s]+$/i.test(absolute) ? absolute : null;
}

function imageFrom(item) {
  for (const tag of ['media:content', 'media:thumbnail', 'enclosure']) {
    const pattern = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    for (const match of item.matchAll(pattern)) {
      const type = attrValue(match[0], 'type');
      if (type && !/^image\//i.test(type)) continue;
      const url = safeUrl(attrValue(match[0], 'url'));
      if (url) return url;
    }
  }

  // Many feeds only include an <img> inside the (possibly escaped) body.
  const decoded = decodeEntities(item);
  const img = decoded.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  return img ? safeUrl(img[1]) : null;
}

function dateFrom(item) {
  const raw =
    firstTag(item, 'pubDate') ||
    firstTag(item, 'dc:date') ||
    firstTag(item, 'published') ||
    firstTag(item, 'updated');
  if (!raw) return null;

  const time = Date.parse(decodeEntities(raw).trim());
  if (!Number.isFinite(time)) return null;

  // A headline dated years in the future is almost always a feed bug. Keeping
  // it would pin it to the top of every sort, so drop the timestamp instead.
  const oneDayAhead = Date.now() + 24 * 60 * 60 * 1000;
  if (time > oneDayAhead) return null;

  return new Date(time).toISOString();
}

function categoriesFrom(item) {
  const values = [];
  const pattern = /<category\b[^>]*>([\s\S]*?)<\/category>/gi;
  for (const match of item.matchAll(pattern)) {
    const value = cleanText(match[1], 40);
    if (value && !values.includes(value)) values.push(value);
    if (values.length === 4) break;
  }
  return values;
}

/**
 * Turns one RSS document into normalised story objects.
 *
 * The parser is deliberately tolerant rather than a full XML implementation:
 * publisher feeds change shape often, and an unexpected element should cost an
 * optional field, never the whole source.
 */
function parseFeed(xml, feed) {
  if (typeof xml !== 'string' || !xml.trim()) return [];

  const blocks = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
    .map(match => match[1])
    .slice(0, MAX_ITEMS_PER_FEED);

  const items = [];
  for (const item of blocks) {
    let title = cleanText(firstTag(item, 'title'), 220);
    // Google News appends " - Publisher" to every headline.
    if (feed.stripTitle && title) title = title.replace(feed.stripTitle, '').trim();
    const url = safeUrl(firstTag(item, 'link') || attrValue(item, 'link'));
    if (!title || !url) continue;

    const body =
      firstTag(item, 'description') ||
      firstTag(item, 'content:encoded') ||
      firstTag(item, 'summary');
    let summary = cleanText(body, 360);
    if (summary.toLowerCase().startsWith(title.toLowerCase())) {
      summary = summary.slice(title.length).trim();
    }
    if (summary.toLowerCase() === title.toLowerCase()) summary = '';
    // Google News describes every item as a link back to the publisher, which
    // cleans down to just the publisher's name. That is not a summary.
    if (summary.toLowerCase() === feed.name.toLowerCase()) summary = '';

    const story = {
      id: url,
      title,
      summary,
      url,
      image: imageFrom(item),
      publishedAt: dateFrom(item),
      categories: categoriesFrom(item),
      source: { id: feed.id, name: feed.name, homepage: feed.homepage },
    };

    if (feed.filter && !feed.filter(story)) continue;
    items.push(story);
  }

  return items;
}

function sortAndDedupe(items) {
  const seenUrls = new Set();
  const seenTitles = new Set();
  const unique = [];

  for (const item of items) {
    const urlKey = item.url.replace(/#.*$/, '').toLowerCase();
    const titleKey = item.title.toLowerCase();
    if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) continue;
    seenUrls.add(urlKey);
    seenTitles.add(titleKey);
    unique.push(item);
  }

  return unique
    .sort((a, b) => {
      const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return bTime - aTime;
    })
    .slice(0, MAX_ITEMS);
}

/**
 * Al Jazeera is the lead publisher: its newest stories open the feed instead
 * of being buried under whichever wire happened to publish a minute later.
 * The remaining order stays newest-first, so this only lifts the lead block.
 */
const LEAD_SOURCE_ID = 'al-jazeera';
const LEAD_STORIES = 3;

function leadWithSource(items, sourceId = LEAD_SOURCE_ID, count = LEAD_STORIES) {
  const lead = items.filter(item => item.source.id === sourceId).slice(0, count);
  if (!lead.length) return items;
  const lifted = new Set(lead);
  return [...lead, ...items.filter(item => !lifted.has(item))];
}

/**
 * Fetch one publisher. A feed may declare a fallback URL for networks where
 * the owned feed is blocked; the fallback is only used if the primary fails.
 * Returns the stories plus which route produced them.
 */
async function fetchFeed(feed) {
  const attempts = [
    { url: feed.url, via: 'direct' },
    ...(feed.fallbackUrl ? [{ url: feed.fallbackUrl, via: 'fallback' }] : []),
  ];
  let lastError = new Error('request failed');

  for (const attempt of attempts) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);

    try {
      const response = await fetch(attempt.url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.1',
          'User-Agent': 'QitabeNoor/1.0 (+https://qitabe-noor.app)',
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const xml = await response.text();
      if (xml.length > MAX_FEED_BYTES) throw new Error('feed too large');

      const items = parseFeed(xml, feed);
      if (!items.length) throw new Error('no items');
      return { items, via: attempt.via };
    } catch (error) {
      lastError = error;
      if (attempts.length > 1 && attempt.via === 'direct') {
        console.warn(`[news] ${feed.id}: direct feed unavailable (${error.message}), trying fallback`);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

async function refreshFeeds() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const merged = [];
  const sources = [];

  results.forEach((result, index) => {
    const feed = FEEDS[index];
    const fresh = result.status === 'fulfilled' ? result.value.items : [];
    const via = result.status === 'fulfilled' ? result.value.via : null;
    const previous = lastGoodBySource.get(feed.id) || [];

    if (fresh.length) {
      lastGoodBySource.set(feed.id, fresh);
      merged.push(...fresh);
    } else {
      merged.push(...previous);
      const reason =
        result.status === 'rejected'
          ? result.reason?.message || 'request failed'
          : 'returned no items';
      console.warn(`[news] ${feed.id}: ${reason}`);
    }

    sources.push({
      id: feed.id,
      name: feed.name,
      homepage: feed.homepage,
      ok: fresh.length > 0,
      stale: fresh.length === 0 && previous.length > 0,
      count: fresh.length || previous.length,
      // Honest provenance: a fallback route is not the publisher's own feed.
      via: fresh.length ? via : null,
    });
  });

  if (!merged.length) throw new Error('all news sources are unavailable');

  const mined = mineNews(leadWithSource(sortAndDedupe(merged)));

  return {
    at: Date.now(),
    fetchedAt: new Date().toISOString(),
    items: mined.items,
    trending: mined.trending,
    sources,
  };
}

function refreshOnce() {
  if (!inflight) {
    inflight = refreshFeeds().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

const clampLimit = limit => {
  const value = Number.parseInt(limit, 10);
  if (!Number.isFinite(value)) return 40;
  return Math.min(Math.max(value, 1), MAX_ITEMS);
};

function isKnownNewsSource(id) {
  return FEEDS.some(feed => feed.id === id);
}

const NEWS_SOURCE_IDS = FEEDS.map(feed => feed.id);

/**
 * Latest headlines, optionally filtered to one source.
 *
 * A forced refresh that fails still returns the previous snapshot and marks
 * it `stale` — a reader with a signal should not lose yesterday's headlines
 * because one publisher is having a bad afternoon.
 */
async function getIslamicNews({ limit, source, refresh = false } = {}) {
  const requestedLimit = clampLimit(limit);
  const freshCache = cache && Date.now() - cache.at < CACHE_TTL_MS;

  let usedCache = false;
  let refreshFailed = false;

  if (freshCache && !refresh) {
    usedCache = true;
  } else {
    try {
      cache = await refreshOnce();
    } catch (error) {
      if (!cache) throw error;
      usedCache = true;
      refreshFailed = true;
      console.warn(`[news] refresh failed, serving cache: ${error.message}`);
    }
  }

  const selected = source
    ? cache.items.filter(item => item.source.id === source)
    : cache.items;

  const allSourcesStale = cache.sources.length > 0 && cache.sources.every(item => !item.ok);

  return {
    items: selected.slice(0, requestedLimit),
    trending: cache.trending,
    sources: cache.sources.map(item => ({ ...item })),
    fetchedAt: cache.fetchedAt,
    count: Math.min(selected.length, requestedLimit),
    cached: usedCache,
    partial: cache.sources.some(item => !item.ok),
    stale: refreshFailed || allSourcesStale,
  };
}

/** Test hook: reset the process-wide snapshot and per-source fallbacks. */
function __clearNewsCache() {
  cache = null;
  inflight = null;
  lastGoodBySource.clear();
}

module.exports = {
  NEWS_FEEDS: FEEDS,
  NEWS_SOURCE_IDS,
  isKnownNewsSource,
  getIslamicNews,
  parseFeed,
  __clearNewsCache,
};
