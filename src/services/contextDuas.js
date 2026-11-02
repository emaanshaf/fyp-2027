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
 *  - There is no weather API, so rain is a manual chip, not a sensor reading.
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
 * Priority is deliberate: what the user chose or where they are beats the
 * clock. Falling back to the time-based pick keeps the card filled when the
 * location is unavailable or nothing matches.
 */
export function buildContextRecommendation({
  date = new Date(),
  manualContexts = [],
  place = null,
  speedMps = null,
} = {}) {
  const manual = sanitizeManualContexts(manualContexts);
  const detectedPlace = placeContexts(place?.address || place);
  const detectedMovement = movementContexts(speedMps);

  const sources = [];
  if (manual.length) sources.push('manual');
  if (detectedPlace.contexts.length) sources.push('place');
  if (!manual.length && detectedMovement.contexts.length) sources.push('movement');

  const primary = manual.length
    ? manual
    : detectedPlace.contexts.length
      ? detectedPlace.contexts
      : detectedMovement.contexts;

  let contexts = [...primary];
  let reason;

  if (contexts.length) {
    reason = manual.length
      ? 'Dua for the moment you selected'
      : detectedPlace.label
        ? `You are near ${detectedPlace.label}`
        : 'You appear to be on the move';
  } else {
    const clock = timeContexts(date);
    contexts = [clock.context];
    reason = clock.reason;
    sources.push('time');
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
  };
}
