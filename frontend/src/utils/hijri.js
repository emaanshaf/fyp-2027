// Hijri date, shared by the calendar, the dashboard and the landing page.
//
// Two layers, because neither alone is correct:
//
//   resolveHijriDate()  — asks aladhan for the Umm al-Qura date and caches it
//                         for the day. This is the authoritative answer and is
//                         what the UI should show whenever it can.
//   getHijriDate()      — a synchronous arithmetic (tabular) conversion used
//                         only when that is unavailable. It is close, not
//                         exact: a tabular calendar assumes an even 30-year
//                         cycle while Umm al-Qura is astronomical, so it can
//                         differ by a day or two. The UI labels it as
//                         approximate when it falls back.
//
// The previous arithmetic here was wrong by roughly 45 days — its Julian Day
// step omitted the Gregorian correction (2 - A + A/4) and had an off-by-one in
// the month term, so it was effectively computing a Julian-calendar JD. It
// reported "4 Jumada al-Ula 1448" for a day that was really 21 Rabi' al-Awwal.
// Both faults are fixed below and a test pins the result against known dates.

import AsyncStorage from '@react-native-async-storage/async-storage';

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhul Qi'dah", 'Dhul Hijjah',
];

/** Month names in Arabic, index-aligned with HIJRI_MONTHS. */
export const HIJRI_MONTHS_AR = [
  'مُحَرَّم', 'صَفَر', 'رَبِيعُ ٱلْأَوَّل', 'رَبِيعُ ٱلثَّانِي',
  'جُمَادَىٰ ٱلْأُولَىٰ', 'جُمَادَىٰ ٱلْآخِرَة', 'رَجَب', 'شَعْبَان',
  'رَمَضَان', 'شَوَّال', 'ذُو ٱلْقَعْدَة', 'ذُو ٱلْحِجَّة',
];

/** Arabic-Indic digits, used when rendering a date in Arabic. */
const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const toArabicDigits = n =>
  String(n).replace(/\d/g, d => AR_DIGITS[Number(d)]);

/** Gregorian calendar date -> Julian Day Number. */
function gregorianToJDN(year, month, day) {
  let y = year;
  let m = month; // 1-12
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4); // Gregorian correction — was missing
  return Math.floor(365.25 * (y + 4716)) +
         Math.floor(30.6001 * (m + 1)) + day + b - 1524;
}

/**
 * Arithmetic ("tabular") Hijri date. Approximate — see the note at the top.
 * @returns {{year:number, month:number, day:number, approximate:true}}
 */
export function getHijriDate(date = new Date()) {
  const jdn = gregorianToJDN(date.getFullYear(), date.getMonth() + 1, date.getDate());

  const l0 = jdn - 1948440 + 10632 + 1;
  const n = Math.floor((l0 - 1) / 10631);
  let l = l0 - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
            Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;

  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day, approximate: true };
}

const cacheKey = date =>
  `qitab_hijri_${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}`;

/**
 * The Umm al-Qura date for a day, from aladhan — the same service the app
 * already uses for prayer times, so this adds no new dependency.
 *
 * Cached permanently per calendar day: the Hijri date of a past Gregorian day
 * never changes, so there is nothing to invalidate. Falls back to the
 * arithmetic conversion when offline, flagged `approximate` so the UI can say
 * so rather than presenting a guess as authoritative.
 *
 * @returns {Promise<{year:number, month:number, day:number, approximate:boolean}>}
 */
export async function resolveHijriDate(date = new Date()) {
  const key = cacheKey(date);

  try {
    const hit = await AsyncStorage.getItem(key);
    if (hit) return JSON.parse(hit);
  } catch { /* unreadable cache is not a reason to fail */ }

  try {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const res = await fetch(
      `https://api.aladhan.com/v1/gToH/${dd}-${mm}-${date.getFullYear()}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const h = (await res.json())?.data?.hijri;
    const month = Number(h?.month?.number);
    const day = Number(h?.day);
    const year = Number(h?.year);
    if (!month || !day || !year) throw new Error('unexpected shape');

    const resolved = { year, month, day, approximate: false };
    try { await AsyncStorage.setItem(key, JSON.stringify(resolved)); } catch { /* cache is best-effort */ }
    return resolved;
  } catch {
    return getHijriDate(date);
  }
}

/** "21 Rabi al-Awwal 1448 AH" */
export function formatHijri(h) {
  const d = h && h.month ? h : getHijriDate(h instanceof Date ? h : new Date());
  return `${d.day} ${HIJRI_MONTHS[d.month - 1]} ${d.year} AH`;
}

/** "٢١ رَبِيعُ ٱلْأَوَّل ١٤٤٨ هـ" */
export function formatHijriArabic(h) {
  const d = h && h.month ? h : getHijriDate(h instanceof Date ? h : new Date());
  return `${toArabicDigits(d.day)} ${HIJRI_MONTHS_AR[d.month - 1]} ${toArabicDigits(d.year)} هـ`;
}

export default getHijriDate;
