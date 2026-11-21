import {
  quranService, TRANSLATIONS, RECITERS, TARJAMA_AUDIO, LANGUAGE_KEYS,
  hasRecitedTranslation,
} from '../quranApi';

beforeEach(() => {
  global.__resetStorage();
});

describe('translations', () => {
  it('offers exactly the five reading languages', () => {
    expect(LANGUAGE_KEYS).toEqual(['en', 'ur', 'ms', 'fr', 'id']);
  });

  it('pins the quran.com resource id verified for each language', () => {
    // These were read from /resources/translations, not guessed. A wrong id
    // silently serves a different translation, which is worse than an error.
    expect(TRANSLATIONS.en.id).toBe(20);   // Saheeh International
    expect(TRANSLATIONS.ur.id).toBe(234);  // Fatah Muhammad Jalandhari
    expect(TRANSLATIONS.ms.id).toBe(39);   // Abdullah Muhammad Basmeih
    expect(TRANSLATIONS.fr.id).toBe(31);   // Muhammad Hamidullah
    expect(TRANSLATIONS.id.id).toBe(134);  // King Fahad Quran Complex
  });

  it('gives every language a native name, author and TTS locale', () => {
    for (const [key, t] of Object.entries(TRANSLATIONS)) {
      expect(t.native).toBeTruthy();
      expect(t.author).toBeTruthy();
      // The locale is what the device voice needs when there is no recitation.
      expect(t.locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      expect(typeof t.rtl).toBe('boolean');
      expect(LANGUAGE_KEYS).toContain(key);
    }
  });

  it('marks Urdu as right-to-left and the rest as left-to-right', () => {
    expect(TRANSLATIONS.ur.rtl).toBe(true);
    expect(TRANSLATIONS.en.rtl).toBe(false);
    expect(TRANSLATIONS.id.rtl).toBe(false);
  });

  it('uses unique resource ids', () => {
    const ids = Object.values(TRANSLATIONS).map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('reciters', () => {
  it('carries all twelve qaris quran.com publishes', () => {
    // The catalogue now also holds islamic.network qaris, so this asserts the
    // quran.com subset rather than the total — dropping one of the twelve
    // would otherwise be hidden by adding an unrelated CDN reciter.
    expect(RECITERS.filter(r => r.source === 'quran.com')).toHaveLength(12);
    expect(RECITERS.filter(r => r.source === 'quran.com').map(r => r.id).sort((a, b) => a - b))
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('uses unique recitation ids', () => {
    const ids = RECITERS.map(r => String(r.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('distinguishes reciters who appear in more than one style', () => {
    // AbdulBaset, Husary and Minshawi each publish two styles; without the
    // style in the label the picker would show duplicate names.
    const dup = RECITERS.filter(r => r.name === 'AbdulBaset AbdulSamad');
    expect(dup).toHaveLength(2);
    expect(dup.every(r => r.source === 'quran.com')).toBe(true);
    expect(new Set(dup.map(quranService.getReciterLabel)).size).toBe(2);
  });

  it('labels a single-style reciter without a suffix', () => {
    const afasy = RECITERS.find(r => r.id === 7);
    expect(quranService.getReciterLabel(afasy)).toBe('Mishari Rashid al-Afasy');
  });
});

describe('tarjama audio', () => {
  it('builds a CDN URL from the global ayah number', () => {
    // Ayat al-Kursi (2:255) is global ayah 262.
    expect(quranService.getTarjamaAudioUrl('en', 262)).toBe(
      'https://cdn.islamic.network/quran/audio/192/en.walk/262.mp3'
    );
  });

  it('uses the one bitrate each edition is actually published at', () => {
    // Every other bitrate returns 403 for these editions, so they are pinned
    // per edition rather than sharing a single default.
    expect(TARJAMA_AUDIO.en.bitrate).toBe(192);
    expect(TARJAMA_AUDIO.ur.bitrate).toBe(64);
    expect(TARJAMA_AUDIO.fr.bitrate).toBe(128);
  });

  it('returns null for languages with no recited translation', () => {
    // Malay and Indonesian fall back to device text-to-speech.
    expect(quranService.getTarjamaAudioUrl('ms', 262)).toBeNull();
    expect(quranService.getTarjamaAudioUrl('id', 262)).toBeNull();
  });

  it('returns null without a valid ayah number rather than a broken URL', () => {
    expect(quranService.getTarjamaAudioUrl('en', null)).toBeNull();
    expect(quranService.getTarjamaAudioUrl('en', 0)).toBeNull();
  });

  it('reports which languages are recited', () => {
    expect(hasRecitedTranslation('en')).toBe(true);
    expect(hasRecitedTranslation('ur')).toBe(true);
    expect(hasRecitedTranslation('fr')).toBe(true);
    expect(hasRecitedTranslation('ms')).toBe(false);
    expect(hasRecitedTranslation('id')).toBe(false);
  });

  it('only lists editions for languages the reader offers', () => {
    for (const key of Object.keys(TARJAMA_AUDIO)) {
      expect(LANGUAGE_KEYS).toContain(key);
    }
  });
});

describe('fetching', () => {
  const ok = body => ({ ok: true, json: async () => body });

  it('returns all chapters and caches them', async () => {
    global.fetch = jest.fn().mockResolvedValue(ok({ chapters: [{ id: 1 }, { id: 2 }] }));

    expect(await quranService.getChapters()).toHaveLength(2);
    await quranService.getChapters();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to an empty list rather than throwing when offline', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await quranService.getChapters()).toEqual([]);
  });

  it('requests the translation id it was given', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      ok({ verses: [{ id: 8, verse_number: 1 }], pagination: { total_pages: 1 } })
    );

    await quranService.getVersesByChapter(2, TRANSLATIONS.ur.id);
    expect(global.fetch.mock.calls[0][0]).toContain('translations=234');
  });

  it('pages through a long surah and concatenates every verse', async () => {
    // Al-Baqarah is 286 verses over six pages of 50.
    global.fetch = jest.fn(url => {
      const page = Number(new URL(url).searchParams.get('page'));
      return Promise.resolve(
        ok({
          verses: Array.from({ length: page === 6 ? 36 : 50 }, (_, i) => ({
            id: (page - 1) * 50 + i + 8,
            verse_number: (page - 1) * 50 + i + 1,
          })),
          pagination: { total_pages: 6 },
        })
      );
    });

    const verses = await quranService.getVersesByChapter(2, 20);
    expect(verses).toHaveLength(286);
    expect(global.fetch).toHaveBeenCalledTimes(6);
  });

  it('keeps the global ayah id, which the tarjama CDN is keyed by', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      ok({ verses: [{ id: 262, verse_number: 255 }], pagination: { total_pages: 1 } })
    );

    const [verse] = await quranService.getVersesByChapter(2, 20);
    expect(verse.id).toBe(262);
    expect(quranService.getTarjamaAudioUrl('ur', verse.id)).toContain('/262.mp3');
  });

  it('does not call the API for an empty search', async () => {
    global.fetch = jest.fn();
    expect(await quranService.search('   ')).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('searchVerses', () => {
  const ok = body => ({ ok: true, json: async () => body });

  const mockSearch = (results, chapters = [{ id: 13, name_simple: "Ar-Ra'd" }]) =>
    jest.fn(url => {
      if (String(url).includes('/chapters')) {
        return Promise.resolve(ok({ chapters }));
      }
      return Promise.resolve(ok({ search: { total_results: 195, results } }));
    });

  it('returns the whole verse, not just its reference', async () => {
    // The study screen used to answer with "the most relevant verses are
    // 2:153, 2:45" — a list of coordinates with no text. A reader cannot
    // study that. This pins Arabic, translation and the surah name.
    global.fetch = mockSearch([
      {
        verse_key: '13:28',
        text: 'ٱلَّذِينَ ءَامَنُوا۟',
        translations: [
          { text: 'Those who have <em>believed</em>', resource_id: 84, name: 'T. Usmani' },
        ],
      },
    ]);

    const { verses, total } = await quranService.searchVerses('patience', { size: 6 });
    expect(total).toBe(195);
    expect(verses).toHaveLength(1);
    expect(verses[0]).toMatchObject({
      key: '13:28',
      surah: 13,
      ayah: 28,
      surahName: "Ar-Ra'd",
      arabic: 'ٱلَّذِينَ ءَامَنُوا۟',
      translation: 'Those who have believed',
      translator: 'T. Usmani',
    });
  });

  it('prefers the Saheeh International text the reader shows', async () => {
    // quran.com returns several English translations per hit; picking the
    // first would quote a different translation from the reader's.
    global.fetch = mockSearch([
      {
        verse_key: '2:153',
        text: 'يَـٰٓأَيُّهَا ٱلَّذِينَ',
        translations: [
          { text: 'Other translation', resource_id: 84, name: 'T. Usmani' },
          { text: 'Saheeh text', resource_id: 20, name: 'Saheeh International' },
        ],
      },
    ]);

    const { verses } = await quranService.searchVerses('patience');
    expect(verses[0].translation).toBe('Saheeh text');
    expect(verses[0].translator).toBe('Saheeh International');
  });

  it('marks the query in the cache key so two searches do not collide', async () => {
    global.fetch = mockSearch([
      { verse_key: '1:1', text: 'بِسْمِ', translations: [{ text: 'In the name', resource_id: 20 }] },
    ]);
    await quranService.searchVerses('mercy');
    await quranService.searchVerses('justice');
    expect(global.fetch.mock.calls.filter(([u]) => String(u).includes('/search')).length).toBe(2);
  });

  it('does not call the API for an empty query', async () => {
    global.fetch = jest.fn();
    expect(await quranService.searchVerses('   ')).toEqual({ verses: [], total: 0 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects when the service is unreachable, so the screen can say so', async () => {
    // No `fallback`: an empty result would be indistinguishable from "the
    // Quran has nothing on this", which is a false religious claim.
    global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
    await expect(quranService.searchVerses('patience')).rejects.toThrow();
  });
});
