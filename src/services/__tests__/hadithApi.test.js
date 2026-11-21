import { hadithService, HADITH_COLLECTIONS } from '../hadithApi';
import { invalidateLarge } from '../cache';

/**
 * Fixture shaped exactly like the CDN payload, verified against the real
 * eng-bukhari.json: a top-level { metadata, hadiths }, each hadith carrying
 * `hadithnumber`, `text`, `grades` and `reference`.
 *
 * The previous verification screen assumed endpoints and field names that did
 * not exist (`hadithNumber`, `/search.json`, `/json/{n}.json`), so every
 * search silently failed. These tests pin the real shape.
 */
const hadith = (n, text, grades = []) => ({
  hadithnumber: n,
  arabicnumber: n,
  text,
  grades,
  reference: { book: 1, hadith: n },
});

const collection = {
  metadata: { name: 'Sahih al Bukhari', sections: { 1: 'Revelation' } },
  hadiths: [
    hadith(1, "Narrated 'Umar bin Al-Khattab: The reward of deeds depends upon the intentions."),
    hadith(2, 'Narrated Aisha: The commencement of the Divine Inspiration was in the form of good dreams.'),
    hadith(3, 'Narrated Abu Huraira: Faith has over seventy branches.', [
      { name: 'Al-Albani', grade: 'Sahih' },
    ]),
  ],
};

beforeEach(async () => {
  global.__resetStorage();
  await invalidateLarge();
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: async () => collection })
  );
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('collection metadata', () => {
  it('covers the six canonical collections', () => {
    expect(HADITH_COLLECTIONS).toHaveLength(6);
  });

  it('marks Bukhari and Muslim as having no per-hadith grades', () => {
    // Every hadith in the two Sahihs is accepted as authentic, so the CDN
    // ships them with an empty `grades` array. Rendering "Not graded" for
    // those would be wrong; the collection grade applies.
    const sahihs = HADITH_COLLECTIONS.filter(c => !c.perHadithGrades).map(c => c.id);
    expect(sahihs).toEqual(['eng-bukhari', 'eng-muslim']);
  });

  it('marks the four Sunan as individually graded', () => {
    const sunan = HADITH_COLLECTIONS.filter(c => c.perHadithGrades);
    expect(sunan).toHaveLength(4);
    for (const c of sunan) expect(c.grade).toBe('Varies');
  });

  it('gives each collection a unique id and colour', () => {
    expect(new Set(HADITH_COLLECTIONS.map(c => c.id)).size).toBe(6);
    expect(new Set(HADITH_COLLECTIONS.map(c => c.color)).size).toBe(6);
  });
});

describe('getAllHadiths', () => {
  it('reads the hadiths array from the CDN payload', async () => {
    const all = await hadithService.getAllHadiths('eng-bukhari');
    expect(all).toHaveLength(3);
    expect(all[0].hadithnumber).toBe(1);
  });

  it('downloads a collection only once per session', async () => {
    // Each page of the infinite-scrolling list calls through here. Without
    // the in-memory memo, every page re-downloaded ~5 MB — which is what
    // made the list appear to hang partway through.
    await hadithService.getAllHadiths('eng-bukhari');
    await hadithService.getAllHadiths('eng-bukhari');
    await hadithService.getCollection('eng-bukhari', 2, 50);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown collection id without calling the network', async () => {
    expect(await hadithService.getAllHadiths('eng-nonsense')).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects when the CDN fails and nothing is cached, so the screen can retry', async () => {
    // Returning [] here once made the app claim a collection contained no
    // hadith at all. An empty result is a valid answer; a failed download is
    // not, and the two must stay distinguishable.
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 502 }));
    await expect(hadithService.getAllHadiths('eng-muslim')).rejects.toThrow();
    expect(await hadithService.getAllHadiths('eng-nonsense')).toEqual([]);
  });
});

describe('getCollection paging', () => {
  it('reports the true total and page count', async () => {
    const page = await hadithService.getCollection('eng-bukhari', 1, 2);
    expect(page.total).toBe(3);
    expect(page.totalPages).toBe(2);
    expect(page.hadiths).toHaveLength(2);
  });

  it('returns the remainder on the last page', async () => {
    const page = await hadithService.getCollection('eng-bukhari', 2, 2);
    expect(page.hadiths).toHaveLength(1);
    expect(page.hadiths[0].hadithnumber).toBe(3);
  });

  it('never reports zero pages, so the list renders an empty state', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500 }));
    const page = await hadithService.getCollection('eng-nasai', 1, 50);
    expect(page.totalPages).toBe(1);
    expect(page.hadiths).toEqual([]);
    expect(page.error).toBe(true);
  });

  it('marks a successful empty page as not an error', async () => {
    // An empty array from the CDN is a legitimate (if odd) response, and the
    // screen must not offer a retry for it.
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ metadata: {}, hadiths: [] }) })
    );
    const page = await hadithService.getCollection('eng-nasai', 1, 50);
    expect(page.error).toBe(false);
  });
});

describe('search', () => {
  it('matches on text, case-insensitively', async () => {
    const hits = await hadithService.search('eng-bukhari', 'INTENTIONS');
    expect(hits).toHaveLength(1);
    expect(hits[0].hadithnumber).toBe(1);
  });

  it('matches an exact hadith number', async () => {
    const hits = await hadithService.search('eng-bukhari', '2');
    expect(hits.map(h => h.hadithnumber)).toContain(2);
  });

  it('returns nothing for an empty query instead of everything', async () => {
    expect(await hadithService.search('eng-bukhari', '   ')).toEqual([]);
  });

  it('returns an empty list when nothing matches', async () => {
    expect(await hadithService.search('eng-bukhari', 'zzzzz')).toEqual([]);
  });
});

describe('getByNumber', () => {
  it('finds a hadith by its number', async () => {
    const h = await hadithService.getByNumber('eng-bukhari', 3);
    expect(h.text).toContain('seventy branches');
  });

  it('accepts a numeric string, since the input field yields text', async () => {
    expect(await hadithService.getByNumber('eng-bukhari', '3')).not.toBeNull();
  });

  it('returns null for a number that does not exist', async () => {
    expect(await hadithService.getByNumber('eng-bukhari', 9999)).toBeNull();
  });
});

describe('searchAll', () => {
  it('tags every hit with the collection it came from', async () => {
    const hits = await hadithService.searchAll('faith');
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      expect(h.collectionId).toBeTruthy();
      expect(h.collection).toBeTruthy();
    }
  });

  it('honours the result limit', async () => {
    const hits = await hadithService.searchAll('Narrated', { limit: 4 });
    expect(hits.length).toBeLessThanOrEqual(4);
  });

  it('returns nothing for an empty query', async () => {
    expect(await hadithService.searchAll('  ')).toEqual([]);
  });

  it('reports which collection it is working on', async () => {
    // Six collections at ~5 MB each is a long wait. The screen needs to say
    // where it has got to or it looks frozen.
    const seen = [];
    await hadithService.searchAll('faith', {
      limit: 10,
      onProgress: p => seen.push(`${p.index + 1}/${p.total}:${p.collection.id}`),
    });
    expect(seen.length).toBeGreaterThan(0);
    expect(seen[0]).toBe('1/6:eng-bukhari');
    expect(seen.every(s => /^\d\/6:eng-/.test(s))).toBe(true);
  });
});
