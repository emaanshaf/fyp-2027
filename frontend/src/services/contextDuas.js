/**
 * Context engine behind "Duas for where you are".
 *
 * Everything here is pure: give it a clock, a reverse-geocoded place label, a
 * movement speed and the chips the user tapped, and it returns the single best
 * dua plus a plain-language reason. Keeping it side-effect free means the
 * screen can recompute freely and the rules are unit-testable.
 *
 * Honest limits worth remembering when editing:
 *  - GPS knows coordinates, not buildings. A mosque, market or graveyard is
 *    only inferred from the *label* the device geocoder returns (Apple or
 *    Google, on the device), and that lookup is best-effort.
 *  - Weather comes from Open-Meteo and landscape names from OpenStreetMap
 *    (see contextEnvironment.js). The rain history reaches back 92 days, so a
 *    long dry spell is reported as "92+ days", never as an exact figure.
 *  - The moon phase is an astronomical approximation from the mean synodic
 *    month; the local crescent sighting can differ by a day.
 *  - Movement is judged from speed alone; a fast train reads the same as a car.
 * Coordinates are never sent to the Qitab-e-Noor server.
 */

import { DUAS } from '../data/duas';

/** Chips the user can tap when the automatic guess is wrong. */
export const MANUAL_CONTEXTS = [
  { id: 'mosque',    label: 'At a mosque',   icon: 'business-outline' },
  { id: 'home',      label: 'At home',       icon: 'home-outline' },
  { id: 'market',    label: 'In the market', icon: 'cart-outline' },
  { id: 'travel',    label: 'Travelling',    icon: 'car-outline' },
  { id: 'rain',      label: 'It is raining', icon: 'rainy-outline' },
  { id: 'river',     label: 'Near water',    icon: 'water-outline' },
  { id: 'mountain',  label: 'In mountains',  icon: 'triangle-outline' },
  { id: 'drought',   label: 'Dry spell',     icon: 'sunny-outline' },
  { id: 'illness',   label: 'Feeling unwell', icon: 'medkit-outline' },
  { id: 'exam',      label: 'Study or exam', icon: 'school-outline' },
  { id: 'anxiety',   label: 'Worried',       icon: 'pulse-outline' },
];

export const MANUAL_CONTEXT_IDS = MANUAL_CONTEXTS.map(c => c.id);

/** Above ~25 km/h you are almost certainly in a vehicle, not walking. */
export const TRAVEL_SPEED_MPS = 7;

const TIME_WINDOWS = [
  { from: 4,  to: 11, context: 'morning',     reason: 'Good morning — begin the day with remembrance' },
  { from: 11, to: 15, context: 'gratitude',   reason: 'Midday — a moment to give thanks' },
  { from: 15, to: 18, context: 'protection',  reason: 'Afternoon — ask Allah to protect the rest of your day' },
  { from: 18, to: 20, context: 'evening',     reason: 'Evening has arrived' },
  { from: 20, to: 23, context: 'forgiveness', reason: 'Night — a good time for Istighfar' },
];

/** Context implied by the clock (and Friday, which overrides the hour). */
export function timeContexts(date = new Date()) {
  if (date.getDay() === 5 && date.getHours() < 19) {
    return { context: 'friday', reason: "It's Jumu'ah (Friday) — a Sunnah reminder for you" };
  }
  const hour = date.getHours();
  const window = TIME_WINDOWS.find(w => hour >= w.from && hour < w.to);
  if (window) return { context: window.context, reason: window.reason };
  return { context: 'sleep', reason: 'Late night — a dua before you rest' };
}

/**
 * Words a geocoder may return for each kind of place. Matched case-insensitively
 * against name, street, district, city and region, in both English and the
 * transliterations Western map providers commonly use.
 */
const PLACE_RULES = [
  { context: 'mosque', label: 'a mosque', patterns: [/\bmasjid\b/i, /\bmosque\b/i, /\bjamia\b/i, /\bmussalla\b/i, /\bidgah\b/i] },
  { context: 'market', label: 'a market', patterns: [/\bmarket\b/i, /\bbazaar\b/i, /\bbazar\b/i, /\bsou?q\b/i, /\bmall\b/i, /\bmandi\b/i] },
  { context: 'graveyard', label: 'a graveyard', patterns: [/\bgraveyard\b/i, /\bcemetery\b/i, /\bqabristan\b/i, /\bmaqbara\b/i] },
  { context: 'illness', label: 'a hospital', patterns: [/\bhospital\b/i, /\bclinic\b/i, /\bdispensary\b/i, /\bmedical\b/i, /\bhealth ?care\b/i] },
  { context: 'exam', label: 'a school', patterns: [/\bschool\b/i, /\bcollege\b/i, /\buniversity\b/i, /\bacademy\b/i, /\bcampus\b/i, /\bexam\b/i] },
];

/** Turn a reverse-geocoded address object into context ids + a readable label. */
export function placeContexts(address) {
  if (!address || typeof address !== 'object') return { contexts: [], label: '' };

  const parts = [address.name, address.street, address.district, address.subregion, address.city, address.region]
    .filter(part => typeof part === 'string' && part.trim());

  const contexts = [];
  let label = '';
  for (const rule of PLACE_RULES) {
    if (rule.patterns.some(re => parts.some(part => re.test(part)))) {
      contexts.push(rule.context);
      if (!label) label = rule.label;
    }
  }
  return { contexts, label };
}

/** Speed-only movement guess. */
export function movementContexts(speedMps) {
  if (typeof speedMps !== 'number' || Number.isNaN(speedMps)) return { contexts: [], label: '' };
  return speedMps >= TRAVEL_SPEED_MPS
    ? { contexts: ['travel'], label: 'you appear to be travelling' }
    : { contexts: [], label: '' };
}

// WMO codes as returned by Open-Meteo. Hail is its own group because 96/99
// mean a thunderstorm that is already producing hail.
const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];
const HAIL_CODES = [96, 99];
const STORM_CODES = [95];

/** After this many dry days the card offers the prayer for rain (Istisqa). */
export const DROUGHT_DAYS = 60;

/**
 * Contexts implied by the current weather reading from contextEnvironment.js.
 * Only the conditions with a clear Sunnah dua are turned into contexts; snow,
 * fog and heat fall through to the clock or the place instead of guessing.
 */
export function weatherContexts(weather) {
  if (!weather || !Number.isFinite(Number(weather.code))) {
    return { contexts: [], reason: '' };
  }
  const code = Number(weather.code);

  if (HAIL_CODES.includes(code)) {
    return { contexts: ['hail', 'storm'], reason: 'Hail or a thunderstorm where you are' };
  }
  if (STORM_CODES.includes(code)) {
    return { contexts: ['storm'], reason: 'A thunderstorm where you are' };
  }
  if (RAIN_CODES.includes(code)) {
    return { contexts: ['rain'], reason: 'It is raining where you are' };
  }

  const dryDays = Number(weather.daysSinceRain);
  if (Number.isFinite(dryDays) && dryDays >= DROUGHT_DAYS) {
    const tracked = Number(weather.rainTrackedDays);
    const windowExhausted = Number.isFinite(tracked) && dryDays >= tracked;
    return {
      contexts: ['drought'],
      reason: `No rain here for ${windowExhausted ? `${tracked}+` : dryDays} days`,
    };
  }
  return { contexts: [], reason: '' };
}

const SYNODIC_DAYS = 29.530588853;
// A known new moon: 6 January 2000, 18:14 UTC.
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14);
/** Half a day either side — close enough to prompt the dua, labelled approximate. */
const NEW_MOON_TOLERANCE = 0.025;

/** Lunar phase from the clock alone: 0 at new moon, 0.5 at full. */
export function moonPhase(date = new Date()) {
  const days = (date.getTime() - NEW_MOON_EPOCH) / 86400000;
  const phase = (((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS) / SYNODIC_DAYS;
  return { phase, illumination: (1 - Math.cos(2 * Math.PI * phase)) / 2 };
}

export function moonContext(date = new Date()) {
  const { phase, illumination } = moonPhase(date);
  const distance = Math.min(phase, 1 - phase);
  const isNew = distance <= NEW_MOON_TOLERANCE;
  return {
    phase,
    illumination,
    isNew,
    reason: isNew
      ? 'The moon is at its new phase (approximate) — the Sunnah dua for the crescent'
      : '',
  };
}

const NATURE_ORDER = ['river', 'sea', 'lake', 'mountain', 'forest', 'desert'];

function natureReason(kind, name) {
  const named = name ? `the ${name}` : null;
  switch (kind) {
    case 'river': return named ? `You are near ${named}` : 'You are near a river';
    case 'sea': return 'You are near the coast';
    case 'lake': return named ? `You are near ${named}` : 'You are near a lake or pond';
    case 'mountain': return 'You are in the mountains';
    case 'forest': return named ? `You are near ${named}` : 'You are in a forest';
    case 'desert': return 'You are in a desert area';
    default: return '';
  }
}

/**
 * Landscape contexts from contextEnvironment.js. All detected kinds are kept
 * for matching (a riverside forest matches both), while the reason names the
 * first by a fixed priority so the wording is stable.
 */
export function natureContexts(nature) {
  const kinds = Array.isArray(nature?.kinds)
    ? NATURE_ORDER.filter(kind => nature.kinds.includes(kind))
    : [];
  if (!kinds.length) return { contexts: [], reason: '' };
  const primary = kinds[0];
  return {
    contexts: kinds,
    reason: natureReason(primary, nature?.names?.[primary]),
  };
}

/** Keep only ids we know, so bad stored/manual input cannot break the screen. */
export function sanitizeManualContexts(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.filter(id => MANUAL_CONTEXT_IDS.includes(id));
}

/** Duas tagged with any of the given contexts, best overlap first, then id. */
export function matchDuas(contexts = []) {
  const wanted = contexts.filter(Boolean);
  if (!wanted.length) return [];
  return DUAS
    .map(dua => ({
      dua,
      score: (dua.contexts || []).filter(tag => wanted.includes(tag)).length,
    }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.dua.id - b.dua.id)
    .map(entry => entry.dua);
}

/**
 * Pick the dua that best fits right now.
 *
 * Priority is deliberate: what the user chose, the sky, a long dry spell and
 * the moon beat a place label, which in turn beats the landscape and the
 * clock. Weather outranks place because rain or hail changes what the moment
 * calls for even when the geocoder already named a mosque. Falling back to the
 * time-based pick keeps the card filled when nothing else is known.
 */
export function buildContextRecommendation({
  date = new Date(),
  manualContexts = [],
  place = null,
  speedMps = null,
  weather = null,
  nature = null,
} = {}) {
  const manual = sanitizeManualContexts(manualContexts);
  const detectedPlace = placeContexts(place?.address || place);
  const detectedMovement = movementContexts(speedMps);
  const detectedWeather = weatherContexts(weather);
  const detectedNature = natureContexts(nature);
  const moon = moonContext(date);

  const sources = [];
  let contexts;
  let reason;

  if (manual.length) {
    sources.push('manual');
    contexts = [...manual];
    reason = 'Dua for the moment you selected';
  } else if (detectedWeather.contexts.length) {
    sources.push('weather');
    contexts = [...detectedWeather.contexts];
    reason = detectedWeather.reason;
  } else if (moon.isNew) {
    sources.push('moon');
    contexts = ['newmoon', 'moon'];
    reason = moon.reason;
  } else if (detectedPlace.contexts.length) {
    sources.push('place');
    contexts = [...detectedPlace.contexts];
    reason = `You are near ${detectedPlace.label}`;
  } else if (detectedNature.contexts.length) {
    sources.push('nature');
    contexts = [...detectedNature.contexts];
    reason = detectedNature.reason;
  } else if (detectedMovement.contexts.length) {
    sources.push('movement');
    contexts = [...detectedMovement.contexts];
    reason = 'You appear to be on the move';
  } else {
    const clock = timeContexts(date);
    sources.push('time');
    contexts = [clock.context];
    reason = clock.reason;
  }

  const matches = matchDuas(contexts);
  if (!matches.length) {
    const clock = timeContexts(date);
    if (!sources.includes('time')) sources.push('time');
    const fallback = matchDuas([clock.context]);
    return {
      dua: fallback[0] || DUAS[0],
      reason: clock.reason,
      contexts: [clock.context],
      sources,
      placeLabel: detectedPlace.label,
      moon,
    };
  }

  // Rotate through the equally best matches by day of month, so standing in
  // the same spot does not always surface the same dua.
  const bestScore = Math.max(...matches.map(d => (d.contexts || []).filter(tag => contexts.includes(tag)).length));
  const topBand = matches.filter(d => (d.contexts || []).filter(tag => contexts.includes(tag)).length === bestScore);
  const dua = topBand[date.getDate() % topBand.length] || matches[0];

  return {
    dua,
    reason,
    contexts,
    sources,
    placeLabel: detectedPlace.label,
    moon,
  };
}
