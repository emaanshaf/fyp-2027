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
