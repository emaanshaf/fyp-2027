import {
  downloadQuranPackage, getOfflineChapters, getOfflinePackage,
  getOfflineStats, readOfflineChapter, removeOfflineQuran,
} from '../offlineLibrary';
import { quranService } from '../quranApi';

const chapters = [
  { id: 1, name_simple: 'Al-Fatihah', name_arabic: 'الفاتحة', translated_name: { name: 'The Opening' }, verses_count: 7, revelation_place: 'makkah' },
  { id: 2, name_simple: 'Al-Baqarah', name_arabic: 'البقرة', translated_name: { name: 'The Cow' }, verses_count: 286, revelation_place: 'madinah' },
];

const verse = (id, key, text, translation) => ({
  id,
  verse_key: key,
  verse_number: Number(key.split(':')[1]),
  text_uthmani: text,
  words: [
    { text_uthmani: text, translation: { text: 'word translation' }, transliteration: { text: 'word' } },
  ],
  translations: [{ text: translation, resource_id: 20 }],
  // Fields the app never stores; the download must drop them.
  audio: { url: 'https://example.test/audio.mp3' },
});

const response = body => ({ ok: true, status: 200, json: async () => body });

function installFetch({ failChapter } = {}) {
  global.fetch = jest.fn(url => {
    if (url.includes('/chapters?')) return Promise.resolve(response({ chapters }));

    const match = url.match(/by_chapter\/(\d+).*page=(\d+)/);
    if (!match) return Promise.reject(new Error(`Unexpected URL ${url}`));
    const chapter = Number(match[1]);
    const page = Number(match[2]);

    if (chapter === failChapter) {
      return Promise.resolve({ ok: false, status: 503, json: async () => ({}) });
    }

    if (chapter === 1) {
      return Promise.resolve(response({
        verses: [verse(1, '1:1', 'بِسْمِ اللَّهِ', 'In the name of Allah')],
        pagination: { total_pages: 1 },
      }));
    }

    return Promise.resolve(response({
      verses: page === 1
        ? [verse(2, '2:1', 'الم', 'Alif Lam Mim')]
        : [verse(3, '2:2', 'ذَٰلِكَ الْكِتَابُ', 'This is the Book')],
      pagination: { total_pages: 2 },
    }));
  });
}

beforeEach(() => {
  global.__resetStorage();
  jest.restoreAllMocks();
});

describe('offline Quran download', () => {
  it('saves every surah with a trimmed payload and reports progress', async () => {
    installFetch();
    const progress = [];
    const result = await downloadQuranPackage({
      translationId: 20,
      translation: { name: 'English', native: 'English', author: 'Saheeh International' },
      onProgress: p => progress.push(p),
      concurrency: 2,
    });

    expect(result.complete).toBe(true);
    expect(result.chapterCount).toBe(2);
    expect(result.versesSaved).toBe(3);
    expect(result.translationName).toBe('English');
    expect(progress.at(-1)).toMatchObject({ phase: 'complete', completed: 2, total: 2, percent: 100 });

    const saved = await readOfflineChapter(1, 20);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toEqual({
      id: 1,
      verse_key: '1:1',
      verse_number: 1,
      text_uthmani: 'بِسْمِ اللَّهِ',
      words: [{ text_uthmani: 'بِسْمِ اللَّهِ' }],
      translations: [{ text: 'In the name of Allah' }],
    });
    // Word translations, transliterations, audio paths and resource ids are
    // deliberately not persisted.
    expect(saved[0].audio).toBeUndefined();
    expect(saved[0].translations[0].resource_id).toBeUndefined();
  });

  it('exposes the surah list and storage totals', async () => {
    installFetch();
    await downloadQuranPackage({
      translationId: 20,
      translation: { name: 'English', author: 'Saheeh International' },
      concurrency: 2,
    });

    const list = await getOfflineChapters();
    expect(list.map(c => c.name_simple)).toEqual(['Al-Fatihah', 'Al-Baqarah']);
    // Only the fields the app needs cross the storage boundary.
    expect(list[0].translated_name).toBe('The Opening');

    const pkg = await getOfflinePackage(20);
    expect(pkg.chapterCount).toBe(2);
    expect(pkg.versesSaved).toBe(3);

    const stats = await getOfflineStats();
    expect(stats.packages).toBe(1);
    expect(stats.chapters).toBe(2);
    expect(stats.verses).toBe(3);
    expect(stats.bytes).toBeGreaterThan(0);
    expect(stats.readable).toMatch(/(B|KB|MB)$/);
  });

  it('serves the reader and surah list with no network after a download', async () => {
    installFetch();
    await downloadQuranPackage({
      translationId: 20,
      translation: { name: 'English' },
      concurrency: 2,
    });

    // Nothing was put in the ordinary cache; only the offline library has it.
    global.fetch = jest.fn(() => Promise.reject(new Error('offline')));

    const verses = await quranService.getVersesByChapter(1, 20);
    expect(verses).toHaveLength(1);
    expect(verses[0].verse_key).toBe('1:1');

    const surahs = await quranService.getChapters();
    expect(surahs.map(c => c.id)).toEqual([1, 2]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('resumes an interrupted download without refetching saved surahs', async () => {
    installFetch({ failChapter: 2 });
    await expect(downloadQuranPackage({
      translationId: 20,
      translation: { name: 'English' },
      concurrency: 1,
    })).rejects.toMatchObject({ status: 503 });

    const partial = await getOfflinePackage(20);
    expect(partial.complete).toBe(false);
    expect(partial.chapterCount).toBe(1);
    expect(await getOfflineChapters()).toBeNull();

    // Second attempt succeeds. Al-Fatihah is already on disk and must not be
    // requested again.
    global.fetch.mockClear();
    installFetch();
    const result = await downloadQuranPackage({
      translationId: 20,
      translation: { name: 'English' },
      concurrency: 1,
    });

    expect(result.complete).toBe(true);
    const fetchedSurahs = global.fetch.mock.calls
      .map(([url]) => url.match(/by_chapter\/(\d+)/)?.[1])
      .filter(Boolean);
    expect(fetchedSurahs).not.toContain('1');
    expect(fetchedSurahs).toContain('2');
  });

  it('stops immediately when the caller has already cancelled', async () => {
    installFetch();
    const controller = new AbortController();
    controller.abort();

    await expect(downloadQuranPackage({
      translationId: 20,
      translation: { name: 'English' },
      signal: controller.signal,
    })).rejects.toMatchObject({ cancelled: true });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('removes the package and returns to an empty state', async () => {
    installFetch();
    await downloadQuranPackage({
      translationId: 20,
      translation: { name: 'English' },
      concurrency: 2,
    });
    expect(await readOfflineChapter(2, 20)).toHaveLength(2);

    await removeOfflineQuran();

    expect(await readOfflineChapter(2, 20)).toBeNull();
    expect(await getOfflineChapters()).toBeNull();
    const stats = await getOfflineStats();
    expect(stats).toMatchObject({ packages: 0, chapters: 0, verses: 0, bytes: 0 });
  });
});
