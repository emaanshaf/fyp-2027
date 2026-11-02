// Reads the prayer timings PrayerTimesScreen already cached and works out
// which prayer is next.
//
// The dashboard needs the next prayer, but it must not become a second caller
// of api.aladhan.com — that would double the requests and could disagree with
// the prayer screen. So this reads the same cache the prayer screen writes and
// returns null when there is nothing cached yet, letting the caller show a
// "set your location" prompt instead of a wrong time.

import AsyncStorage from '@react-native-async-storage/async-storage';

/** The five obligatory prayers, in the order they fall. */
export const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const DEFAULT_CITY = 'Islamabad';
const DEFAULT_COUNTRY = 'Pakistan';
export { DEFAULT_CITY, DEFAULT_COUNTRY };

/** "05:12" (and "05:12 (PKT)") -> minutes since midnight. */
function toMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || '').trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** "05:12" -> "5:12 AM" */
export function to12Hour(hhmm) {
  const mins = toMinutes(hhmm);
  if (mins === null) return '--:--';
  const h24 = Math.floor(mins / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mins % 60).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/**
 * @returns {Promise<null | {
 *   name: string, time: string, city: string,
 *   minutesAway: number, countdown: string, tomorrow: boolean,
 *   windowMinutes: number, at: Date
 * }>} null when no timings have been cached yet. `at` is the absolute target
 *   instant and `windowMinutes` the gap from the previous prayer, used by the
 *   countdown ring.
 */
export async function getNextPrayer(now = new Date()) {
  const city = (await AsyncStorage.getItem('qitab_prayer_city')) || DEFAULT_CITY;
  const country = (await AsyncStorage.getItem('qitab_prayer_country')) || DEFAULT_COUNTRY;

  const raw = await AsyncStorage.getItem(`qitab_timings_${city}_${country}`);
  if (!raw) return null;

  let timings;
  try {
    timings = JSON.parse(raw);
  } catch {
    return null;
  }

  const nowMins = now.getHours() * 60 + now.getMinutes();

  const schedule = PRAYER_ORDER
    .map(name => ({ name, time: timings[name], mins: toMinutes(timings[name]) }))
    .filter(p => p.mins !== null);
  if (!schedule.length) return null;

  // After Isha the next prayer is tomorrow's Fajr, so wrap rather than
  // returning nothing for the last few hours of every day.
  const nextIndex = schedule.findIndex(p => p.mins > nowMins);
  const upcoming = nextIndex === -1 ? null : schedule[nextIndex];
  const next = upcoming || schedule[0];
  const tomorrow = !upcoming;
  const minutesAway = tomorrow
    ? 24 * 60 - nowMins + next.mins
    : next.mins - nowMins;

  const h = Math.floor(minutesAway / 60);
  const m = minutesAway % 60;

  // The previous prayer sets the length of this interval, which is what a
  // countdown ring fills against. It wraps to yesterday's Isha for Fajr and
  // to today's Isha for tomorrow's Fajr.
  const previous = nextIndex > 0
    ? schedule[nextIndex - 1]
    : schedule[schedule.length - 1];
  const wrapsBack = tomorrow || nextIndex === 0;
  const windowMinutes = wrapsBack
    ? 24 * 60 - previous.mins + next.mins
    : next.mins - previous.mins;

  // Absolute target, so a ring can tick against a real instant instead of
  // re-deriving minutes every second.
  const at = new Date(now);
  at.setHours(0, 0, 0, 0);
  at.setMinutes(next.mins);
  if (tomorrow) at.setDate(at.getDate() + 1);

  return {
    name: next.name,
    time: to12Hour(next.time),
    city,
    minutesAway,
    countdown: h > 0 ? `${h}h ${m}m` : `${m}m`,
    tomorrow,
    windowMinutes: windowMinutes > 0 ? windowMinutes : 60,
    at,
  };
}

/**
 * All five prayers for today, each flagged as past/current/upcoming relative
 * to `now`, for a Islam-360-style prayer strip. Reads the same cache as
 * getNextPrayer() — never a second network caller.
 *
 * @returns {Promise<null | { city: string, prayers: Array<{
 *   name: string, time: string, mins: number, isNext: boolean
 * }> }>} null when nothing is cached yet.
 */
export async function getTodayTimings(now = new Date()) {
  const city = (await AsyncStorage.getItem('qitab_prayer_city')) || DEFAULT_CITY;
  const country = (await AsyncStorage.getItem('qitab_prayer_country')) || DEFAULT_COUNTRY;

  const raw = await AsyncStorage.getItem(`qitab_timings_${city}_${country}`);
  if (!raw) return null;

  let timings;
  try {
    timings = JSON.parse(raw);
  } catch {
    return null;
  }

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const schedule = PRAYER_ORDER
    .map(name => ({ name, time: timings[name], mins: toMinutes(timings[name]) }))
    .filter(p => p.mins !== null);
  if (!schedule.length) return null;

  const upcoming = schedule.find(p => p.mins > nowMins);
  const nextName = (upcoming || schedule[0]).name;

  return {
    city,
    prayers: schedule.map(p => ({
      name: p.name,
      time: to12Hour(p.time),
      mins: p.mins,
      isNext: p.name === nextName,
    })),
  };
}

export default getNextPrayer;
