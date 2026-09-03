import { KALIMAS, KALIMAS_NOTE } from '../kalimas';
import {
  SCHOOLS, WUDHU, SALAH, WUDHU_DIFFERENCES, SALAH_DIFFERENCES, FIQH_DISCLAIMER,
} from '../fiqh';
import { FIQH_METHODS, fiqhQuery, fiqhByKey, fiqhCacheSuffix } from '../prayerMethods';
import { SAMPLE_FAV_DUAS, SAMPLE_BOOKMARKS, SAMPLE_NOTES } from '../librarySamples';
import { DUAS } from '../duas';

describe('kalimas', () => {
  it('has all six, each complete', () => {
    expect(KALIMAS).toHaveLength(6);
    for (const k of KALIMAS) {
      expect(k.arabic.length).toBeGreaterThan(10);
      expect(k.transliteration.length).toBeGreaterThan(10);
      expect(k.translation.length).toBeGreaterThan(20);
      // Arabic script, not a transliteration pasted into the Arabic field.
      expect(/[\u0600-\u06FF]/.test(k.arabic)).toBe(true);
    }
  });

  it('numbers them 1-6 without gaps', () => {
    expect(KALIMAS.map(k => k.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('says the six-kalima list is a teaching convention, not scripture', () => {
    expect(KALIMAS_NOTE).toMatch(/convention/i);
  });
});

describe('fiqh guides', () => {
  it('covers both schools for wudhu and salah', () => {
    expect(SCHOOLS.map(s => s.key).sort()).toEqual(['hanafi', 'jafari']);
    for (const key of ['hanafi', 'jafari']) {
      expect(WUDHU[key].steps.length).toBeGreaterThan(4);
      expect(SALAH[key].steps.length).toBeGreaterThan(6);
      expect(WUDHU[key].nullifiers.length).toBeGreaterThan(2);
    }
  });

  it('records the real differences rather than blurring them', () => {
    const feet = WUDHU_DIFFERENCES.find(d => d.point === 'Feet');
    expect(feet.hanafi).toMatch(/[Ww]ashed/);
    expect(feet.jafari).toMatch(/[Ww]iped/);

    const hands = SALAH_DIFFERENCES.find(d => d.point === 'Hands in qiyam');
    expect(hands.hanafi).toMatch(/[Ff]olded/);
    expect(hands.jafari).toMatch(/sides/);
  });

  it('every difference row names both schools', () => {
    for (const row of [...WUDHU_DIFFERENCES, ...SALAH_DIFFERENCES]) {
      expect(row.hanafi).toBeTruthy();
      expect(row.jafari).toBeTruthy();
    }
  });

  it('disclaims being a fatwa', () => {
    expect(FIQH_DISCLAIMER).toMatch(/not a fatwa/i);
    expect(FIQH_DISCLAIMER).toMatch(/teacher/i);
  });
});

describe('prayer calculation methods', () => {
  it('builds the query the aladhan API expects', () => {
    // Verified against api.aladhan.com: school=1 is the Hanafi Asr, and
    // method=0 is the Shia Ithna-Ashari (Qum) calculation.
    expect(fiqhQuery('hanafi')).toBe('method=1&school=1');
    expect(fiqhQuery('jafari')).toBe('method=0');
  });

  it('gives each school a distinct cache suffix', () => {
    const suffixes = FIQH_METHODS.map(m => fiqhCacheSuffix(m.key));
    expect(new Set(suffixes).size).toBe(FIQH_METHODS.length);
  });

  it('falls back to a real method for an unknown key', () => {
    expect(fiqhByKey('nonsense').key).toBe('hanafi');
  });
});

describe('library samples', () => {
  it('seeds dua ids that actually exist', () => {
    const ids = new Set(DUAS.map(d => d.id));
    for (const id of SAMPLE_FAV_DUAS) expect(ids.has(id)).toBe(true);
  });

  it('seeds well-formed verse keys', () => {
    for (const key of SAMPLE_BOOKMARKS) expect(key).toMatch(/^\d{1,3}:\d{1,3}$/);
  });

  it('attaches every sample note to a seeded bookmark', () => {
    for (const key of Object.keys(SAMPLE_NOTES)) {
      expect(SAMPLE_BOOKMARKS).toContain(key);
    }
  });
});
