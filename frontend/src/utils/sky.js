/**
 * Where we are in the sky right now.
 *
 * The dashboard hero has one job here: show whether the sun or the moon is up,
 * how far through its arc it is, and tint the banner to match the hour. This
 * module is pure maths so the rule can be tested without rendering anything —
 * the drawing lives in `components/SkyBackdrop.jsx`.
 *
 * Honesty about precision:
 *  - With cached prayer times the windows are the prayers themselves (Fajr,
 *    Asr, Maghrib, Isha), which is more meaningful than clock hours.
 *  - Without them we fall back to rough local-clock windows.
 *  - `dawn` ends about 70 minutes after Fajr because the app does not cache
 *    sunrise; this is a visual approximation, not a prayer ruling.
 *  - The moon's phase comes from the Hijri day, the same approximation the
 *    calendar already discloses.
 */

/** Phase order through a day. */
export const SKY_PHASES = ['dawn', 'day', 'golden', 'dusk', 'night'];

/** Rough local-clock windows, used only when no prayer times are cached. */
const CLOCK_WINDOWS = [
  { phase: 'dawn', start: 4.5 * 60, end: 6 * 60 },
  { phase: 'day', start: 6 * 60, end: 15.5 * 60 },
  { phase: 'golden', start: 15.5 * 60, end: 18 * 60 },
  { phase: 'dusk', start: 18 * 60, end: 19.5 * 60 },
];

const minutesOfDay = date => date.getHours() * 60 + date.getMinutes();

const findMins = (prayers, name) => {
  const match = Array.isArray(prayers)
    ? prayers.find(p => p && p.name === name && Number.isFinite(p.mins))
    : null;
  return match ? match.mins : null;
};

/**
 * Prayer-driven windows. `dawn` is an approximation after Fajr because sunrise
 * is not cached; everything else follows the prayers exactly.
 *
 * @returns {Array<{phase:string,start:number,end:number}>|null} null when the
 *   cached timings are missing anything needed.
 */
export function prayerWindows(prayers) {
  const fajr = findMins(prayers, 'Fajr');
  const asr = findMins(prayers, 'Asr');
  const maghrib = findMins(prayers, 'Maghrib');
  const isha = findMins(prayers, 'Isha');
  if ([fajr, asr, maghrib, isha].some(v => v === null)) return null;

  const dawnEnd = Math.min(fajr + 70, asr - 60);
  if (dawnEnd <= fajr) return null;

  return [
    { phase: 'dawn', start: fajr, end: dawnEnd },
    { phase: 'day', start: dawnEnd, end: asr },
    { phase: 'golden', start: asr, end: maghrib },
    { phase: 'dusk', start: maghrib, end: isha },
    // Night wraps past midnight; handled in skyState.
    { phase: 'night', start: isha, end: 24 * 60 + fajr },
  ];
}

/** Progress 0-1 through a window, clamped at both ends. */
const progressIn = (mins, start, end) => {
  if (end <= start) return 0;
  return Math.min(1, Math.max(0, (mins - start) / (end - start)));
};

/**
 * Sun/moon position as percentages of the banner box.
 *
 * The body follows a shallow arc: it enters near the horizon, peaks around a
 * third of the way down, and leaves near the opposite horizon. Night runs from
 * Isha to Fajr, so the moon starts on the right and sets on the left, matching
 * the sun's direction closely enough for a decorative backdrop.
 */
export function bodyPosition(phase, progress) {
  const p = Math.min(1, Math.max(0, progress));
  const isNight = phase === 'dusk' || phase === 'night';
  return {
    body: isNight ? 'moon' : 'sun',
    x: 12 + p * 76,
    y: 34 - Math.sin(Math.PI * p) * 22,
  };
}

/**
 * @param {{now?: Date, prayers?: Array<{name:string, mins:number}>}} options
 * @returns {{
 *   phase: 'dawn'|'day'|'golden'|'dusk'|'night',
 *   progress: number,
 *   body: 'sun'|'moon',
 *   x: number,
 *   y: number,
 *   source: 'prayers'|'clock',
 * }}
 */
export function skyState({ now = new Date(), prayers = null } = {}) {
  const mins = minutesOfDay(now);
  const windows = prayerWindows(prayers);
  const source = windows ? 'prayers' : 'clock';

  if (windows) {
    const night = windows.find(w => w.phase === 'night');
    for (const window of windows) {
      if (window.phase === 'night') {
        // The night window spans midnight: after Isha today, or before Fajr.
        const inEvening = mins >= night.start;
        const inMorning = mins < night.end - 24 * 60;
        if (inEvening || inMorning) {
          const progress = inEvening
            ? progressIn(mins, night.start, night.end)
            : progressIn(mins + 24 * 60, night.start, night.end);
          return { phase: 'night', progress, ...bodyPosition('night', progress), source };
        }
        continue;
      }
      if (mins >= window.start && mins < window.end) {
        const progress = progressIn(mins, window.start, window.end);
        return { phase: window.phase, progress, ...bodyPosition(window.phase, progress), source };
      }
    }
    // Between the last window and the first is impossible with Fajr < Asr, but
    // fall through to the clock rather than returning nothing.
  }

  for (const window of CLOCK_WINDOWS) {
    if (mins >= window.start && mins < window.end) {
      const progress = progressIn(mins, window.start, window.end);
      return { phase: window.phase, progress, ...bodyPosition(window.phase, progress), source };
    }
  }

  // Night wraps midnight on the clock fallback too.
  const progress = mins >= 19.5 * 60
    ? progressIn(mins, 19.5 * 60, 24 * 60 + 4.5 * 60)
    : progressIn(mins + 24 * 60, 19.5 * 60, 24 * 60 + 4.5 * 60);
  return { phase: 'night', progress, ...bodyPosition('night', progress), source };
}

/** A tint laid over the brand gradient so the hero follows the hour. */
export function skyTint(phase) {
  switch (phase) {
    case 'dawn':
      return ['rgba(255, 176, 120, 0.26)', 'rgba(255, 120, 90, 0.02)'];
    case 'day':
      return ['rgba(255, 238, 180, 0.18)', 'rgba(255, 238, 180, 0.00)'];
    case 'golden':
      return ['rgba(255, 196, 92, 0.28)', 'rgba(255, 148, 58, 0.02)'];
    case 'dusk':
      return ['rgba(158, 116, 208, 0.26)', 'rgba(90, 62, 150, 0.03)'];
    default:
      return ['rgba(70, 104, 178, 0.30)', 'rgba(24, 36, 78, 0.05)'];
  }
}

/** Short description for accessibility and the small caption. */
export function skyLabel(phase, body) {
  const labels = {
    dawn: 'Sunrise light',
    day: 'Daylight',
    golden: 'Afternoon sun',
    dusk: 'Dusk',
    night: 'Night sky',
  };
  return labels[phase] || (body === 'moon' ? 'Night sky' : 'Daylight');
}
