const express = require('express');
const request = require('supertest');

const ORIGINAL_FETCH = global.fetch;

const rss = entries =>
  `<?xml version="1.0" encoding="utf-8"?><rss version="2.0"><channel><title>Test feed</title>${entries.join('')}</channel></rss>`;

const feedItem = ({
  title = 'Story',
  link = 'https://example.com/story',
  description = '',
  pubDate = '',
  media = '',
}) => `<item>
  <title><![CDATA[${title}]]></title>
  <link>${link}</link>
  <description><![CDATA[${description}]]></description>
  ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
  ${media}
</item>`;

function genericFeed(feed) {
  return rss([
    feedItem({
      title: `${feed.name} Islamic headline`,
      link: `https://example.com/${feed.id}/headline`,
      description: `<p>Latest reporting from ${feed.name}.</p>`,
      pubDate: 'Sat, 24 Oct 2026 10:00:00 GMT',
    }),
  ]);
}

function buildApp() {
  jest.resetModules();
  const router = require('../routes/news');
  const service = require('../services/islamicNews');
  service.__clearNewsCache();

  const app = express();
  app.use('/api/news', router);
  return { app, service };
}

/**
 * Replaces fetch with a per-feed map. A string is a successful feed body,
 * null simulates an unreachable publisher, and { status } simulates HTTP 403.
 */
function mockFeeds(service, overrides = {}) {
  global.fetch = jest.fn(url => {
    const feed = service.NEWS_FEEDS.find(
      candidate => candidate.url === url || candidate.fallbackUrl === url
    );
    if (!feed) return Promise.reject(new Error('unexpected URL'));

    const override = overrides[feed.id];
    if (override === null) return Promise.reject(new Error('offline'));
    if (override && typeof override === 'object') {
      return Promise.resolve({
        ok: false,
        status: override.status || 500,
        text: async () => '',
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      text: async () => (typeof override === 'string' ? override : genericFeed(feed)),
    });
  });
}

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  global.fetch = ORIGINAL_FETCH;
});

describe('GET /api/news', () => {
  it('normalises RSS into clean, sorted stories', async () => {
    const { app, service } = buildApp();
    mockFeeds(service, {
      'middle-east-eye': rss([
        feedItem({
          title: 'Hajj season begins',
          link: 'https://example.com/hajj',
          description:
            '<p>Millions of pilgrims &amp; visitors arrive.</p>' +
            '<p>The post <a href="#">Hajj</a> appeared first on <a href="#">About</a>.</p>' +
            '<script>alert(1)</script>',
          pubDate: 'Sat, 24 Oct 2026 12:00:00 GMT',
          media: '<media:content url="https://cdn.example.com/hajj.jpg" type="image/jpeg" />',
        }),
      ]),
      'guardian-islam': rss([
        feedItem({
          title: 'Muslim community opens new centre',
          link: 'https://example.com/community',
          description: '<p>A new community centre opens this week.</p><p>Continue reading...</p>',
          pubDate: 'Sat, 24 Oct 2026 13:00:00 GMT',
        }),
      ]),
    });

    const res = await request(app).get('/api/news').expect(200);

    expect(res.body.cached).toBe(false);
    expect(res.body.partial).toBe(false);
    expect(res.body.stale).toBe(false);
    expect(res.body.sources).toHaveLength(6);
    // Al Jazeera is the lead source, so it opens the feed even when another
    // wire has published more recently.
    expect(res.body.items[0].source.id).toBe('al-jazeera');

    const hajj = res.body.items.find(item => item.title === 'Hajj season begins');
    expect(hajj).toMatchObject({
      url: 'https://example.com/hajj',
      image: 'https://cdn.example.com/hajj.jpg',
      publishedAt: '2026-10-24T12:00:00.000Z',
      source: { id: 'middle-east-eye', name: 'Middle East Eye' },
    });
    expect(hajj.summary).toBe('Millions of pilgrims & visitors arrive.');
    expect(hajj.summary).not.toMatch(/<|appeared first/);

    const community = res.body.items.find(item => item.title === 'Muslim community opens new centre');
    expect(community.summary).toBe('A new community centre opens this week.');
  });

  it('lifts the three newest Al Jazeera stories above the rest', async () => {
    const { app, service } = buildApp();
    const aj = (index, hour) =>
      feedItem({
        title: `Gaza report ${index}`,
        link: `https://example.com/aj-${index}`,
        description: '<p>Reporting from Gaza.</p>',
        pubDate: `Sat, 24 Oct 2026 0${hour}:00:00 GMT`,
      });

    mockFeeds(service, {
      'al-jazeera': rss([aj(1, 8), aj(2, 9), aj(3, 10), aj(4, 11)]),
      'middle-east-eye': rss([
        feedItem({
          title: 'A newer story from another wire',
          link: 'https://example.com/newer',
          pubDate: 'Sat, 24 Oct 2026 13:00:00 GMT',
        }),
      ]),
    });

    const res = await request(app).get('/api/news').expect(200);
    const lead = res.body.items.slice(0, 3);

    expect(lead.every(item => item.source.id === 'al-jazeera')).toBe(true);
    expect(lead.map(item => item.title)).toEqual([
      'Gaza report 4',
      'Gaza report 3',
      'Gaza report 2',
    ]);
    expect(res.body.items[3].source.id).not.toBe('al-jazeera');
  });

  it('strips the Middle East Eye byline prefix from summaries', async () => {
    const { app, service } = buildApp();
    mockFeeds(service, {
      'middle-east-eye': rss([
        feedItem({
          title: 'A bylined headline',
          link: 'https://example.com/bylined',
          description:
            '<h2><span>A bylined headline</span></h2>' +
            '<footer>Submitted by MEE staff on Mon, 11/02/2026 - 14:57</footer>' +
            '<div>The actual first sentence.</div>',
          pubDate: 'Sat, 24 Oct 2026 12:00:00 GMT',
        }),
      ]),
    });

    const res = await request(app).get('/api/news').expect(200);
    const item = res.body.items.find(entry => entry.url === 'https://example.com/bylined');
    expect(item.summary).toBe('The actual first sentence.');
  });

  it('drops unsafe links and markup', async () => {
    const { app, service } = buildApp();
    mockFeeds(service, {
      'middle-east-eye': rss([
        feedItem({
          title: 'Safe story',
          link: 'https://example.com/safe',
          description: '<p>Readable text.</p>',
          pubDate: 'Sat, 24 Oct 2026 12:00:00 GMT',
          media: '<media:content url="javascript:alert(1)" type="image/jpeg" />',
        }),
        feedItem({
          title: 'Unsafe story',
          link: 'javascript:alert(1)',
          description: '<p>Should never appear.</p>',
          pubDate: 'Sat, 24 Oct 2026 12:00:00 GMT',
        }),
      ]),
    });

    const res = await request(app).get('/api/news').expect(200);
    const titles = res.body.items.map(item => item.title);

    expect(titles).toContain('Safe story');
    expect(titles).not.toContain('Unsafe story');
    expect(res.body.items.find(item => item.title === 'Safe story').image).toBeNull();
  });

  it('deduplicates the same story syndicated by two sources', async () => {
    const { app, service } = buildApp();
    const duplicate = feedItem({
      title: 'Shared headline',
      link: 'https://example.com/shared',
      description: '<p>One story, two feeds.</p>',
      pubDate: 'Sat, 24 Oct 2026 11:00:00 GMT',
    });

    mockFeeds(service, {
      'middle-east-eye': rss([duplicate]),
      'guardian-islam': rss([duplicate]),
    });

    const res = await request(app).get('/api/news').expect(200);
    expect(res.body.items.filter(item => item.url === 'https://example.com/shared')).toHaveLength(1);
  });

  it('keeps working when one publisher fails', async () => {
    const { app, service } = buildApp();
    mockFeeds(service, {
      'middle-east-eye': rss([
        feedItem({
          title: 'Surviving story',
          link: 'https://example.com/survive',
          pubDate: 'Sat, 24 Oct 2026 12:00:00 GMT',
        }),
      ]),
      'about-islam': null,
      'guardian-islam': { status: 403 },
      'religion-news': null,
    });

    const res = await request(app).get('/api/news').expect(200);

    expect(res.body.items.some(item => item.title === 'Surviving story')).toBe(true);
    expect(res.body.partial).toBe(true);
    expect(res.body.stale).toBe(false);
    expect(res.body.sources.find(source => source.id === 'about-islam')).toMatchObject({
      ok: false,
      stale: false,
    });
  });

  it('serves the snapshot from cache until refresh is requested', async () => {
    const { app, service } = buildApp();
    mockFeeds(service);

    await request(app).get('/api/news').expect(200);
    expect(global.fetch).toHaveBeenCalledTimes(6);

    const cached = await request(app).get('/api/news').expect(200);
    expect(cached.body.cached).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(6);

    await request(app).get('/api/news?refresh=1').expect(200);
    expect(global.fetch).toHaveBeenCalledTimes(12);
  });

  it('falls back to earlier headlines when every refresh fails', async () => {
    const { app, service } = buildApp();
    mockFeeds(service);
    const first = await request(app).get('/api/news').expect(200);
    expect(first.body.items.length).toBeGreaterThan(0);

    global.fetch = jest.fn(() => Promise.reject(new Error('network down')));
    const res = await request(app).get('/api/news?refresh=1').expect(200);

    expect(res.body.items.length).toBe(first.body.items.length);
    expect(res.body.stale).toBe(true);
    expect(res.body.partial).toBe(true);
  });

  it('returns 503 when no source has ever loaded', async () => {
    const { app, service } = buildApp();
    mockFeeds(service, {
      'al-jazeera': null,
      'middle-east-eye': null,
      'middle-east-monitor': null,
      'guardian-islam': null,
      'about-islam': null,
      'religion-news': null,
    });

    const res = await request(app).get('/api/news').expect(503);
    expect(res.body.reason).toBe('news_unavailable');
    expect(res.headers['retry-after']).toBe('120');
  });

  it('filters by source and clamps the limit', async () => {
    const { app, service } = buildApp();
    mockFeeds(service, {
      'middle-east-eye': rss([
        feedItem({
          title: 'First MEE story',
          link: 'https://example.com/mee-1',
          pubDate: 'Sat, 24 Oct 2026 13:00:00 GMT',
        }),
        feedItem({
          title: 'Second MEE story',
          link: 'https://example.com/mee-2',
          pubDate: 'Sat, 24 Oct 2026 12:00:00 GMT',
        }),
      ]),
    });

    const res = await request(app)
      .get('/api/news?source=middle-east-eye&limit=1')
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].source.id).toBe('middle-east-eye');
    expect(res.body.count).toBe(1);

    const unknown = await request(app).get('/api/news?source=not-a-feed').expect(400);
    expect(unknown.body.reason).toBe('unknown_source');
  });

  it('falls back to Al Jazeera through Google News when the owned feed is blocked', async () => {
    const { app, service } = buildApp();
    const alJazeera = service.NEWS_FEEDS.find(feed => feed.id === 'al-jazeera');

    global.fetch = jest.fn(url => {
      if (url === alJazeera.url) return Promise.reject(new Error('connection reset'));
      if (url === alJazeera.fallbackUrl) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => rss([
            feedItem({
              title: 'Gaza ceasefire talks resume - Al Jazeera',
              link: 'https://news.google.com/rss/articles/abc',
              pubDate: 'Sat, 24 Oct 2026 14:00:00 GMT',
            }),
          ]),
        });
      }
      const feed = service.NEWS_FEEDS.find(candidate => candidate.url === url);
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => genericFeed(feed),
      });
    });

    const res = await request(app).get('/api/news').expect(200);
    const story = res.body.items.find(item => item.source.id === 'al-jazeera');

    expect(story.title).toBe('Gaza ceasefire talks resume');
    expect(res.body.sources.find(source => source.id === 'al-jazeera')).toMatchObject({
      ok: true,
      via: 'fallback',
    });
  });

  it('mines topics, keywords and trends from the merged headlines', async () => {
    const { app, service } = buildApp();
    mockFeeds(service, {
      'middle-east-eye': rss([
        feedItem({
          title: 'Gaza aid convoy reaches the north',
          link: 'https://example.com/gaza-aid',
          description: '<p>Humanitarian teams deliver medical supplies.</p>',
          pubDate: 'Sat, 24 Oct 2026 13:00:00 GMT',
        }),
        feedItem({
          title: 'Gaza hospitals face fuel shortages',
          link: 'https://example.com/gaza-hospitals',
          description: '<p>Medics warn of a growing crisis.</p>',
          pubDate: 'Sat, 24 Oct 2026 12:00:00 GMT',
        }),
      ]),
      'about-islam': rss([
        feedItem({
          title: 'Ramadan preparation guide for families',
          link: 'https://example.com/ramadan',
          description: '<p>Mosques announce community iftar programmes.</p>',
          pubDate: 'Sat, 24 Oct 2026 11:00:00 GMT',
        }),
      ]),
    });

    const res = await request(app).get('/api/news').expect(200);
    const gaza = res.body.items.find(item => item.title === 'Gaza aid convoy reaches the north');

    expect(gaza.topics).toContain('Gaza');
    expect(gaza.keywords).toContain('Gaza');
    expect(res.body.trending).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Gaza', count: 2 })])
    );
    expect(res.body.trending.every(entry => entry.count >= 1)).toBe(true);
  });
});
