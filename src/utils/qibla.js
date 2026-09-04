// Qibla direction and distance to the Kaaba.
//
// Split out of QiblaFinderScreen so the maths can be tested against known
// bearings for real cities. The screen previously had three faults that
// together made it point the wrong way almost everywhere:
//
//   1. The device location was hardcoded to Islamabad ("simulated location"),
//      so the bearing was right only for one city and silently wrong for
//      every other user.
//   2. The compass heading state existed but nothing ever wrote to it — there
//      was no sensor subscription at all, so the needle never moved.
//   3. Magnetic declination was ignored, which is worth 10-20 degrees in much
//      of the world even once a heading is read.
//
// The bearing formula itself was correct and is kept.

export const KAABA_LAT = 21.4225;
export const KAABA_LNG = 39.8262;

// Centralised, not a magic number sprinkled through the screen: below this,
// getCurrentPositionAsync's own accuracy report says the fix is loose enough
// that the bearing could be off by a visible amount at typical walking
// distance from where the reading was taken.
export const MIN_LOCATION_ACCURACY_M = 50;

// Smoothing factor for the heading's exponential moving average — see
// smoothAngle(). Lower is smoother but laggier; this value settles within
// half a second of sensor updates (which arrive a few times a second) while
// still killing single-sample jitter.
export const HEADING_SMOOTHING_FACTOR = 0.15;

const toRad = d => (d * Math.PI) / 180;
const toDeg = r => (r * 180) / Math.PI;

/**
 * Initial great-circle bearing from a point to the Kaaba, in degrees clockwise
 * from true north.
 *
 * This is the shortest path over the sphere, which is what "facing the Kaaba"
 * means — not the constant-compass-course (rhumb line) direction, which for
 * distant locations can differ by tens of degrees.
 */
export function qiblaBearing(lat, lng) {
  const φ = toRad(lat);
  const κ = toRad(KAABA_LAT);
  const Δλ = toRad(KAABA_LNG - lng);

  const y = Math.sin(Δλ);
  const x = Math.cos(φ) * Math.tan(κ) - Math.sin(φ) * Math.cos(Δλ);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Great-circle distance to the Kaaba in kilometres. */
export function distanceToKaaba(lat, lng) {
  const R = 6371;
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA_LAT);
  const Δφ = toRad(KAABA_LAT - lat);
  const Δλ = toRad(KAABA_LNG - lng);

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Smallest signed turn from `heading` to `bearing`, in (-180, 180]. */
export function relativeAngle(bearing, heading) {
  return ((((bearing - heading) % 360) + 540) % 360) - 180;
}

/** Any real number -> [0, 360). Handles negative and multi-wrap inputs. */
export function normalizeAngle(deg) {
  return ((deg % 360) + 360) % 360;
}

/**
 * One step of an exponential moving average over a compass angle.
 *
 * A plain `prev + factor * (next - prev)` breaks at the 0/360 seam: going
 * from 359 to 0 is a 1-degree turn, but the naive difference is -359 and the
 * needle would sweep almost all the way round instead. This takes the
 * shortest signed turn from `prev` to `next` (via relativeAngle, which is
 * exactly that) and steps along it instead of along the raw values.
 *
 * @param {number} prev - the smoothed angle from the last update, in degrees.
 * @param {number} next - the new raw sensor reading, in degrees.
 * @param {number} [factor] - 0..1, how much of the gap to close per update.
 *   Defaults to HEADING_SMOOTHING_FACTOR.
 * @returns {number} the new smoothed angle, normalized to [0, 360).
 */
export function smoothAngle(prev, next, factor = HEADING_SMOOTHING_FACTOR) {
  if (prev === null || prev === undefined || Number.isNaN(prev)) {
    return normalizeAngle(next);
  }
  const delta = relativeAngle(next, prev); // shortest signed turn prev -> next
  return normalizeAngle(prev + factor * delta);
}

/**
 * Classifies expo-location's heading `accuracy` field into a comparable
 * "how much should the user trust this" level.
 *
 * The field means two different things on the two platforms this app ships
 * to, and treating them the same is a real bug, not a simplification:
 *   - iOS reports `headingAccuracy` in DEGREES of maximum deviation, where
 *     LOWER is BETTER (0-1 is excellent, >15 is poor, negative is invalid).
 *   - Android reports a CATEGORY (0-3), where HIGHER is BETTER (3 = high,
 *     2 = medium, 1 = low, 0 = unreliable/uncalibrated).
 * A single `accuracy < 2` check, applied to both, reads a near-perfect iOS
 * fix as "low" and a genuinely poor Android one as "fine" — the opposite of
 * what each number means.
 *
 * @param {number|null} accuracy
 * @param {'ios'|'android'|string} platformOS
 * @returns {'unknown'|'low'|'medium'|'high'}
 */
export function compassAccuracyLevel(accuracy, platformOS) {
  if (accuracy === null || accuracy === undefined || Number.isNaN(accuracy)) {
    return 'unknown';
  }
  if (platformOS === 'ios') {
    if (accuracy < 0) return 'unknown'; // negative = invalid heading on iOS
    if (accuracy <= 5) return 'high';
    if (accuracy <= 15) return 'medium';
    return 'low';
  }
  // Android (and anything else reporting the same 0-3 category scale).
  if (accuracy >= 3) return 'high';
  if (accuracy === 2) return 'medium';
  return 'low'; // 0 (unreliable) or 1 (low)
}

/** N / NNE / NE ... for a bearing. */
export function compassPoint(deg) {
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return points[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

/**
 * How close the user is to facing the Kaaba.
 * The 5-degree band is deliberately generous: consumer magnetometers are not
 * accurate beyond a few degrees, and implying more precision than the hardware
 * has would be misleading in a religious context.
 */
export function alignment(offsetDeg) {
  const off = Math.abs(offsetDeg);
  if (off <= 5) return { state: 'aligned', label: 'Facing the Qibla' };
  if (off <= 20) return { state: 'close', label: 'Almost — keep turning' };
  return { state: 'far', label: offsetDeg > 0 ? 'Turn right' : 'Turn left' };
}
