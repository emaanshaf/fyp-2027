import {
  getHijriDate, formatHijri, formatHijriArabic, toArabicDigits,
  HIJRI_MONTHS, HIJRI_MONTHS_AR, resolveHijriDate,
} from '../hijri';

/**
 * The arithmetic conversion was previously wrong by ~45 days — it reported
 * "4 Jumada al-Ula 1448" for a day that was really 21 Rabi' al-Awwal, because
 * its Julian Day step omitted the Gregorian correction. These expectations are
 * taken from aladhan's Umm al-Qura calendar.
 *
 * A tabular calendar cannot match Umm al-Qura exactly, so the tolerance is one
 * day on the day-of-month — but the MONTH and YEAR must be right, which is
 * what actually went wrong before.
 */

const CASES = [
  { g: [2026, 0, 15], hijri: { d: 26, m: 7, y: 1447 } },
  { g: [2026, 2, 15], hijri: { d: 26, m: 9, y: 1447 } },
  { g: [2026, 5, 15], hijri: { d: 29, m: 12, y: 1447 } },
  { g: [2026, 8, 3], hijri: { d: 21, m: 3, y: 1448 } },
  { g: [2026, 11, 15], hijri: { d: 6, m: 7, y: 1448 } },
  { g: [2025, 5, 6], hijri: { d: 10, m: 12, y: 1446 } },
];

describe('arithmetic Hijri conversion', () => {
  it.each(CASES)('converts %o to the right Hijri month and year', ({ g, hijri }) => {
    const out = getHijriDate(new Date(g[0], g[1], g[2]));
    expect({ m: out.month, y: out.year }).toEqual({ m: hijri.m, y: hijri.y });
  });

  it('lands within a day of Umm al-Qura on the day of month', () => {
    for (const { g, hijri } of CASES) {
      const out = getHijriDate(new Date(g[0], g[1], g[2]));
      expect(Math.abs(out.day - hijri.d)).toBeLessThanOrEqual(1);
    }
  });

  it('flags itself approximate so the UI never presents it as authoritative', () => {
    expect(getHijriDate(new Date(2026, 8, 3)).approximate).toBe(true);
  });

  it('produces months in range for four years of days', () => {
    for (let i = 0; i < 365 * 4; i++) {
      const out = getHijriDate(new Date(2024, 0, 1 + i));
      expect(out.month).toBeGreaterThanOrEqual(1);
      expect(out.month).toBeLessThanOrEqual(12);
      expect(out.day).toBeGreaterThanOrEqual(1);
      expect(out.day).toBeLessThanOrEqual(30);
    }
  });

  it('advances monotonically, never jumping backwards', () => {
    let prev = null;
    for (let i = 0; i < 800; i++) {
      const h = getHijriDate(new Date(2025, 0, 1 + i));
      const abs = h.year * 12 * 30 + h.month * 30 + h.day;
      if (prev !== null) {
        expect(abs).toBeGreaterThanOrEqual(prev);
        expect(abs - prev).toBeLessThanOrEqual(2);
      }
      prev = abs;
    }
  });
});

describe('formatting', () => {
  it('renders the English form', () => {
    expect(formatHijri({ day: 21, month: 3, year: 1448 })).toBe('21 Rabi al-Awwal 1448 AH');
  });

  it('renders the Arabic form with Arabic-Indic digits', () => {
    expect(formatHijriArabic({ day: 21, month: 3, year: 1448 }))
      .toBe('٢١ رَبِيعُ ٱلْأَوَّل ١٤٤٨ هـ');
  });

  it('converts digits', () => {
    expect(toArabicDigits(1448)).toBe('١٤٤٨');
    expect(toArabicDigits(4)).toBe('٤');
  });

  it('keeps both month tables aligned', () => {
    expect(HIJRI_MONTHS_AR).toHaveLength(HIJRI_MONTHS.length);
    expect(HIJRI_MONTHS_AR.every(Boolean)).toBe(true);
  });
});

describe('resolveHijriDate', () => {
  beforeEach(() => { global.__resetStorage(); });
  afterEach(() => jest.restoreAllMocks());

  it('prefers the Umm al-Qura answer and marks it authoritative', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: { hijri: { day: '21', month: { number: 3 }, year: '1448' } } }),
    }));
    const h = await resolveHijriDate(new Date(2026, 8, 3));
    expect(h).toEqual({ day: 21, month: 3, year: 1448, approximate: false });
  });

  it('caches so a second read makes no request', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: { hijri: { day: '21', month: { number: 3 }, year: '1448' } } }),
    }));
    const d = new Date(2026, 8, 3);
    await resolveHijriDate(d);
    await resolveHijriDate(d);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to the approximate date offline rather than throwing', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
    const h = await resolveHijriDate(new Date(2026, 8, 3));
    expect(h.approximate).toBe(true);
    expect(h.month).toBe(3);
  });
});
