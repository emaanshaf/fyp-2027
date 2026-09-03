// Prayer time calculation by school of fiqh.
//
// The two schools genuinely disagree on when prayers begin, and the gaps are
// large enough to matter:
//
//   Asr     — Hanafi begins when an object's shadow is twice its length;
//             the Shafi'i/Ja'fari reckoning uses one length. In Islamabad
//             that is 16:42 against 15:44 — nearly an hour apart.
//   Maghrib — the Ja'fari school waits until the redness has passed the
//             zenith (the API models this as the sun ~4 degrees below the
//             horizon) rather than at sunset. Roughly 15 minutes later.
//
// Both parameter sets below were checked against api.aladhan.com rather than
// assumed. `school=1` selects the Hanafi Asr; method 0 is the Shia
// Ithna-Ashari (Leva Institute, Qum) calculation.

export const FIQH_METHODS = [
  {
    key: 'hanafi',
    name: 'Hanafi',
    arabic: 'ٱلْحَنَفِي',
    // Karachi is the convention used across the subcontinent.
    params: { method: 1, school: 1 },
    summary: 'University of Islamic Sciences, Karachi · Hanafi Asr (shadow ×2)',
    detail:
      'Asr begins when an object\'s shadow reaches twice its own length, which '
      + 'is later than the other schools. Fajr 18°, Isha 18°.',
  },
  {
    key: 'jafari',
    name: "Ja'fari",
    arabic: 'ٱلْجَعْفَرِي',
    params: { method: 0 },
    summary: 'Shia Ithna-Ashari, Leva Institute, Qum',
    detail:
      'Asr uses the single-shadow reckoning. Maghrib is delayed until the '
      + 'redness passes the zenith, so it falls later than sunset. Fajr 16°, '
      + 'Maghrib 4°, Isha 14°.',
  },
  {
    key: 'standard',
    name: 'Standard',
    arabic: 'ٱلْقِيَاسِيّ',
    params: { method: 2, school: 0 },
    summary: 'Islamic Society of North America (ISNA) · single-shadow Asr',
    detail:
      'A widely used general default. Asr at one shadow length, Maghrib at '
      + 'sunset. Fajr 15°, Isha 15°.',
  },
];

export const DEFAULT_FIQH = 'hanafi';

export const fiqhByKey = key =>
  FIQH_METHODS.find(m => m.key === key) || FIQH_METHODS[0];

/** Query string fragment for api.aladhan.com, e.g. "method=1&school=1". */
export function fiqhQuery(key) {
  const { params } = fiqhByKey(key);
  return Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
}

/** Cache key suffix so switching school does not read the other's cache. */
export const fiqhCacheSuffix = key => `_${fiqhByKey(key).key}`;
