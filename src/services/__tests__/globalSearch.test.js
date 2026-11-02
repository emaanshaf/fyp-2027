import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearRecentSearches,
  loadRecentSearches,
  mapQuranSearchResults,
  normaliseText,
  saveRecentSearch,
  searchContent,
} from '../globalSearch';

describe('normaliseText', () => {
  it('ignores case, accents and apostrophes', () => {
    expect(normaliseText("Qur'an")).toBe('quran');
    expect(normaliseText('Merciful')).toBe('merciful');
    expect(normaliseText('taqwā')).toBe('taqwa');
  });

  it('strips Arabic diacritics and unifies letter forms', () => {
    expect(normaliseText('ٱلرَّحۡمَٰنُ')).toBe('الرحمن');
    expect(normaliseText('الرَّحِيمُ')).toBe('الرحيم');
    expect(normaliseText('إِلَه')).toBe('اله');
  });
});

describe('searchContent', () => {
  it('finds a dua by its English meaning', () => {
    const results = searchContent('hardship');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.group === 'duas')).toBe(true);
  });

  it('finds an Arabic name without the user typing diacritics', () => {
    const results = searchContent('الرحمن');
    expect(results.some(r => r.group === 'names' && r.title === 'Ar-Rahman')).toBe(true);
  });

  it('finds a prophet and a seerah event', () => {
    expect(searchContent('Yusuf').some(r => r.group === 'prophets')).toBe(true);
    expect(searchContent('first revelation').some(r => r.group === 'seerah')).toBe(true);
  });

  it('requires all words in a multi-word query', () => {
    const everything = searchContent('prayer');
    const narrowed = searchContent('prayer times');
    expect(narrowed.length).toBeGreaterThan(0);
    expect(narrowed.length).toBeLessThan(everything.length);
  });

  it('ranks the Quran module above passing mentions', () => {
    const results = searchContent('quran');
    expect(results[0].group).toBe('modules');
    expect(results[0].title).toBe('Quran');
  });

  it('hides admin-only modules from ordinary users', () => {
    const userResults = searchContent('admin', { role: 'user' });
    const adminResults = searchContent('admin', { role: 'admin' });
    expect(userResults.some(r => r.route === 'AdminPanel')).toBe(false);
    expect(adminResults.some(r => r.route === 'AdminPanel')).toBe(true);
  });

  it('returns nothing for one-character or empty queries', () => {
    expect(searchContent('a')).toEqual([]);
    expect(searchContent('   ')).toEqual([]);
  });

  it('caps the result list', () => {
    expect(searchContent('a', { limit: 2 })).toHaveLength(0);
    expect(searchContent('allah', { limit: 3 }).length).toBeLessThanOrEqual(3);
  });
});

describe('mapQuranSearchResults', () => {
  it('turns verses into reader links and removes HTML', () => {
    const mapped = mapQuranSearchResults([
      {
        verse_key: '2:255',
        text: '<span>ٱللَّهُ</span>',
        translations: [{ text: '<b>Allah</b> — there is no deity except Him.' }],
      },
    ]);

    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({
      group: 'quran',
      title: 'Quran 2:255',
      route: 'Quran',
      params: { surah: 2, ayah: 255 },
    });
    expect(mapped[0].subtitle).toContain('Allah');
    expect(mapped[0].subtitle).not.toContain('<b>');
  });

  it('drops malformed and duplicate verses', () => {
    const mapped = mapQuranSearchResults([
      { verse_key: '2:255', translations: [{ text: 'A' }] },
      { verse_key: '2:255', translations: [{ text: 'A again' }] },
      { verse_key: 'not-a-verse', translations: [{ text: 'B' }] },
      null,
    ]);
    expect(mapped).toHaveLength(1);
  });
});

describe('recent searches', () => {
  beforeEach(async () => {
    await AsyncStorage.removeItem('qitab_search_recent');
  });

  it('stores newest first, de-duplicates and caps the list', async () => {
    await saveRecentSearch('mercy');
    await saveRecentSearch('patience');
    await saveRecentSearch('Mercy');

    const deduped = await loadRecentSearches();
    expect(deduped).toEqual(['Mercy', 'patience']);

    for (const q of ['one', 'two', 'three', 'four', 'five', 'six']) {
      await saveRecentSearch(q);
    }

    const recent = await loadRecentSearches();
    expect(recent).toHaveLength(6);
    expect(recent[0]).toBe('six');
  });

  it('clears the list', async () => {
    await saveRecentSearch('mercy');
    await clearRecentSearches();
    expect(await loadRecentSearches()).toEqual([]);
  });
});
