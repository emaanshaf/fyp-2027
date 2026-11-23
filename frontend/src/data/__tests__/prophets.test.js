import { PROPHETS, refLabel } from '../prophets';
import { PROPHET_I18N, STORY_UI, localiseProphet } from '../prophetsI18n';

const TRANSLATED = ['ur', 'ms', 'fr', 'id'];
const LANGUAGE_KEYS = ['en', ...TRANSLATED];

describe('prophet stories data', () => {
  it('lists the twenty-five prophets named in the Quran', () => {
    expect(PROPHETS).toHaveLength(25);
    expect(new Set(PROPHETS.map(p => p.id)).size).toBe(25);
  });

  it('gives every prophet at least one valid Quran reference', () => {
    for (const p of PROPHETS) {
      expect(p.refs.length).toBeGreaterThan(0);
      for (const ref of p.refs) {
        expect(Number.isInteger(ref.surah)).toBe(true);
        expect(ref.surah).toBeGreaterThanOrEqual(1);
        expect(ref.surah).toBeLessThanOrEqual(114);
        expect(ref.from).toBeGreaterThanOrEqual(1);
        expect(ref.to).toBeGreaterThanOrEqual(ref.from);
        expect(ref.name.length).toBeGreaterThan(2);
      }
    }
  });

  it('labels references with surah and ayah', () => {
    expect(refLabel({ name: 'Al-Baqarah', surah: 2, from: 30, to: 39 })).toBe('Al-Baqarah 2:30–39');
    expect(refLabel({ name: 'Sad', surah: 38, from: 48, to: 48 })).toBe('Sad 38:48');
  });

  it('translates every prophet into each of the four other reading languages', () => {
    for (const lang of TRANSLATED) {
      expect(Object.keys(PROPHET_I18N[lang]).sort()).toEqual(PROPHETS.map(p => p.id).sort());
      for (const p of PROPHETS) {
        const t = PROPHET_I18N[lang][p.id];
        expect(t.title.length).toBeGreaterThan(2);
        expect(t.desc.length).toBeGreaterThan(20);
        expect(t.lesson.length).toBeGreaterThan(5);
      }
    }
  });

  it('writes Urdu names in Arabic script', () => {
    for (const p of PROPHETS) {
      expect(/[\u0600-\u06FF]/.test(PROPHET_I18N.ur[p.id].name)).toBe(true);
    }
  });

  it('has reader labels for all five reading languages', () => {
    const keys = ['language', 'inQuran', 'refs', 'readFull', 'storyTitle', 'lesson',
      'loading', 'retry', 'openInQuran', 'close', 'loadFailed', 'note'];
    for (const lang of LANGUAGE_KEYS) {
      expect(STORY_UI[lang]).toBeTruthy();
      for (const key of keys) {
        expect(typeof STORY_UI[lang][key]).toBe('string');
        expect(STORY_UI[lang][key].length).toBeGreaterThan(1);
      }
    }
  });

  it('falls back to English when a language has no entry', () => {
    const adam = PROPHETS[0];
    expect(localiseProphet(adam, 'en')).toEqual(adam);
    expect(localiseProphet(adam, 'ur').title).toBe(PROPHET_I18N.ur.adam.title);
  });
});
