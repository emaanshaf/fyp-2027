import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchIslamicNews,
  getSavedNews,
  newsAccent,
  newsTimeAgo,
  normalizeNewsPayload,
  removeSavedNews,
  saveNewsItem,
  toggleSavedNews,
} from '../islamicNews';

const story = overrides => ({
  id: 'https://example.com/story',
  title: 'A story from the Muslim world',
  summary: 'Short summary.',
  url: 'https://example.com/story',
  image: 'https://example.com/image.jpg',
  publishedAt: '2026-10-24T12:00:00.000Z',
  categories: ['Islam', 'Community'],
  source: {
    id: 'about-islam',
    name: 'About Islam',
    homepage: 'https://aboutislam.net',
  },
  ...overrides,
});

beforeEach(() => {
  global.__resetStorage();
});

describe('normalizeNewsPayload', () => {
  it('keeps usable rows and drops broken or unsafe ones', () => {
    const payload = normalizeNewsPayload({
      items: [
        story(),
        story({ id: 'no-url', url: 'javascript:alert(1)' }),
        story({ id: 'no-title', title: '   ' }),
        story({ id: 'http', url: 'http://example.com/plain-http' }),
      ],
      sources: [
        { id: 'about-islam', name: 'About Islam', homepage: 'https://aboutislam.net', ok: true, count: 2 },
        { id: '', name: 'Broken' },
      ],
      fetchedAt: '2026-10-24T13:00:00.000Z',
      partial: true,
      stale: false,
    });

    expect(payload.items.map(item => item.id)).toEqual([
      'https://example.com/story',
      'http://example.com/plain-http',
    ]);
    expect(payload.items[0]).toMatchObject({
      summary: 'Short summary.',
      categories: ['Islam', 'Community'],
      source: { id: 'about-islam', name: 'About Islam' },
    });
    expect(payload.sources).toHaveLength(1);
    expect(payload.sources[0]).toMatchObject({ ok: true, count: 2 });
    expect(payload.partial).toBe(true);
    expect(payload.fetchedAt).toBe('2026-10-24T13:00:00.000Z');
  });

  it('tolerates a missing payload', () => {
    expect(normalizeNewsPayload(null)).toEqual({
      items: [],
      sources: [],
      trending: [],
      fetchedAt: null,
      partial: false,
      stale: false,
    });
  });

  it('keeps mined topics, keywords and trends while dropping junk', () => {
    const payload = normalizeNewsPayload({
      items: [
        story({
          keywords: ['Gaza', '  gaza ', '', 'Ceasefire', 'Talks', 'Extra'],
          topics: ['Gaza', 'Conflict & aid', 'Gaza', 'Fourth'],
        }),
        story({ id: 'no-mine', url: 'https://example.com/no-mine' }),
      ],
      trending: [
        { id: 'topic:gaza', label: 'Gaza', kind: 'topic', count: '3' },
        { id: 'term:ceasefire', label: 'Ceasefire', kind: 'keyword', count: 2 },
        { label: '   ' },
        { label: 'Bad count', count: 'nope' },
      ],
    });

    expect(payload.items[0].keywords).toEqual(['Gaza', 'Ceasefire', 'Talks', 'Extra']);
    expect(payload.items[0].topics).toEqual(['Gaza', 'Conflict & aid', 'Fourth']);
    expect(payload.items[1].keywords).toEqual([]);
    expect(payload.items[1].topics).toEqual([]);
    expect(payload.trending).toEqual([
      { id: 'topic:gaza', label: 'Gaza', kind: 'topic', count: 3 },
      { id: 'term:ceasefire', label: 'Ceasefire', kind: 'keyword', count: 2 },
      { id: 'bad count', label: 'Bad count', kind: 'topic', count: 0 },
    ]);
  });

  it('marks a source that used a fallback route', () => {
    const payload = normalizeNewsPayload({
      sources: [
        { id: 'al-jazeera', name: 'Al Jazeera', ok: true, count: 4, via: 'fallback' },
        { id: 'about-islam', name: 'About Islam', ok: true, count: 2 },
      ],
    });

    expect(payload.sources[0].via).toBe('fallback');
    expect(payload.sources[1].via).toBe('direct');
  });

  it('drops dates far in the future', () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const payload = normalizeNewsPayload({ items: [story({ publishedAt: future })] });
    expect(payload.items[0].publishedAt).toBeNull();
  });

  it('repairs a cache entry written before trends and tags existed', async () => {
    // A payload persisted by an older build has no `trending`, `keywords` or
    // `topics`. Reading it back must not hand the screen an undefined array.
    await AsyncStorage.setItem(
      'qitab_cache_islamic-news',
      JSON.stringify({
        at: Date.now(),
        ttl: 15 * 60 * 1000,
        value: { items: [story()], sources: [], fetchedAt: null, partial: false, stale: false },
      })
    );

    const payload = await fetchIslamicNews();

    expect(payload.trending).toEqual([]);
    expect(payload.items[0].keywords).toEqual([]);
    expect(payload.items[0].topics).toEqual([]);
  });
});

describe('newsTimeAgo', () => {
  const now = Date.parse('2026-10-24T12:30:00.000Z');

  it('formats recent publication times', () => {
    expect(newsTimeAgo('2026-10-24T12:29:40.000Z', now)).toBe('Just now');
    expect(newsTimeAgo('2026-10-24T12:00:00.000Z', now)).toBe('30m ago');
    expect(newsTimeAgo('2026-10-24T10:30:00.000Z', now)).toBe('2h ago');
    expect(newsTimeAgo('2026-10-22T12:30:00.000Z', now)).toBe('2d ago');
    expect(newsTimeAgo('2026-10-14T12:00:00.000Z', now)).toBe('14 Oct 2026');
  });

  it('returns an empty label for an invalid date', () => {
    expect(newsTimeAgo('not a date', now)).toBe('');
  });
});

describe('saved news', () => {
  it('round-trips bookmarks and moves a re-saved story to the top', async () => {
    await saveNewsItem(story());
    await saveNewsItem(story({
      id: 'https://example.com/second',
      url: 'https://example.com/second',
      title: 'Second story',
    }));

    let saved = await getSavedNews();
    expect(saved.map(item => item.title)).toEqual([
      'Second story',
      'A story from the Muslim world',
    ]);

    await saveNewsItem(story({ title: 'Updated title' }));
    saved = await getSavedNews();
    expect(saved[0].title).toBe('Updated title');
    expect(saved).toHaveLength(2);
  });

  it('toggles a story off', async () => {
    const on = await toggleSavedNews(story());
    expect(on.saved).toBe(true);
    expect(on.items).toHaveLength(1);

    const off = await toggleSavedNews(story());
    expect(off.saved).toBe(false);
    expect(off.items).toHaveLength(0);
  });

  it('removes a bookmark directly', async () => {
    await saveNewsItem(story());
    const remaining = await removeSavedNews('https://example.com/story');
    expect(remaining).toEqual([]);
    expect(await getSavedNews()).toEqual([]);
  });
});

describe('newsAccent', () => {
  it('maps known publishers to theme tokens', () => {
    expect(newsAccent('middle-east-eye')).toBe('cyan');
    expect(newsAccent('about-islam')).toBe('gold');
    expect(newsAccent('not-a-source')).toBe('cyan');
  });
});
