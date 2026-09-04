import {
  qiblaBearing, distanceToKaaba, relativeAngle, compassPoint, alignment,
  normalizeAngle, smoothAngle, compassAccuracyLevel,
  KAABA_LAT, KAABA_LNG,
} from '../qibla';

/**
 * Bearings below are the widely published Qibla directions for each city.
 * A 1-degree tolerance covers rounding in the published figures; the screen
 * previously hardcoded Islamabad's location, so every one of these except
 * Islamabad was wrong in the app regardless of the maths.
 */
const CITIES = [
  { name: 'Islamabad',   lat: 33.6844,  lng: 73.0479,   bearing: 255.9 },
  { name: 'London',      lat: 51.5074,  lng: -0.1278,   bearing: 118.9 },
  { name: 'New York',    lat: 40.7128,  lng: -74.0060,  bearing: 58.5 },
  { name: 'Jakarta',     lat: -6.2088,  lng: 106.8456,  bearing: 295.1 },
  { name: 'Cape Town',   lat: -33.9249, lng: 18.4241,   bearing: 23.4 },
  { name: 'Sydney',      lat: -33.8688, lng: 151.2093,  bearing: 277.5 },
  { name: 'Istanbul',    lat: 41.0082,  lng: 28.9784,   bearing: 151.6 },
];

describe('qibla bearing', () => {
  it.each(CITIES)('points the right way from $name', ({ lat, lng, bearing }) => {
    expect(qiblaBearing(lat, lng)).toBeCloseTo(bearing, 0);
  });

  it('always returns a bearing in [0, 360)', () => {
    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lng = -180; lng < 180; lng += 30) {
        const b = qiblaBearing(lat, lng);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThan(360);
        expect(Number.isNaN(b)).toBe(false);
      }
    }
  });

  it('points due north from directly south of the Kaaba', () => {
    expect(qiblaBearing(KAABA_LAT - 20, KAABA_LNG)).toBeCloseTo(0, 1);
  });

  it('points due south from directly north of the Kaaba', () => {
    expect(qiblaBearing(KAABA_LAT + 20, KAABA_LNG)).toBeCloseTo(180, 1);
  });
});

describe('qibla bearing, cross-checked against an independent formula', () => {
  // A from-scratch implementation of the spec's atan2 bearing formula,
  // written independently of qiblaBearing()'s algebraic rearrangement, so
  // this is a real cross-check rather than the same code compared to itself.
  const toRad = d => (d * Math.PI) / 180;
  const toDeg = r => (r * 180) / Math.PI;
  function referenceBearing(lat, lng) {
    const phi1 = toRad(lat);
    const phi2 = toRad(KAABA_LAT);
    const dLambda = toRad(KAABA_LNG - lng);
    const y = Math.sin(dLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  const PLACES = [
    ['Islamabad', 33.6844, 73.0479],
    ['Lahore', 31.5497, 74.3436],
    ['Karachi', 24.8607, 67.0011],
    ['London', 51.5074, -0.1278],
    ['New York', 40.7128, -74.0060],
  ];

  it.each(PLACES)('matches the reference atan2 formula for %s', (_name, lat, lng) => {
    expect(qiblaBearing(lat, lng)).toBeCloseTo(referenceBearing(lat, lng), 6);
  });
});

describe('distance', () => {
  it('is zero at the Kaaba', () => {
    expect(distanceToKaaba(KAABA_LAT, KAABA_LNG)).toBeCloseTo(0, 1);
  });

  it('matches known great-circle distances', () => {
    // Cross-checked against an independently written haversine.
    expect(distanceToKaaba(33.6844, 73.0479)).toBeCloseTo(3528, -2);   // Islamabad
    expect(distanceToKaaba(51.5074, -0.1278)).toBeCloseTo(4794, -2);   // London
    expect(distanceToKaaba(40.7128, -74.0060)).toBeCloseTo(10306, -2); // New York
  });
});

describe('relative angle', () => {
  it('is zero when the heading already faces the qibla', () => {
    expect(relativeAngle(255, 255)).toBe(0);
  });

  it('takes the short way round the compass', () => {
    // 350 -> 10 is a 20 degree right turn, not 340 to the left.
    expect(relativeAngle(10, 350)).toBe(20);
    expect(relativeAngle(350, 10)).toBe(-20);
  });

  it('stays within (-180, 180]', () => {
    for (let b = 0; b < 360; b += 7) {
      for (let h = 0; h < 360; h += 11) {
        const r = relativeAngle(b, h);
        expect(r).toBeGreaterThan(-181);
        expect(r).toBeLessThanOrEqual(180);
      }
    }
  });
});

describe('normalizeAngle', () => {
  it.each([
    [0, 0], [360, 0], [359, 359], [-1, 359], [720, 0], [-361, 359], [180, 180],
  ])('normalizes %d to %d', (input, expected) => {
    expect(normalizeAngle(input)).toBeCloseTo(expected, 9);
  });

  it('always returns a value in [0, 360)', () => {
    for (let d = -1000; d <= 1000; d += 37) {
      const n = normalizeAngle(d);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(360);
    }
  });
});

describe('smoothAngle', () => {
  it('takes the raw value on the first call (no previous angle)', () => {
    expect(smoothAngle(null, 47)).toBeCloseTo(47, 9);
    expect(smoothAngle(undefined, 47)).toBeCloseTo(47, 9);
  });

  it('moves partway toward the new reading, not all the way', () => {
    const next = smoothAngle(0, 100, 0.15);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(100);
    expect(next).toBeCloseTo(15, 9);
  });

  it('crosses the 359 -> 0 seam the short way, not almost a full circle', () => {
    // Naive averaging of the raw numbers (359, 0) pulls toward ~180 — the
    // wrong way round the dial. The angle-aware step must instead continue
    // forward past 360/0.
    const next = smoothAngle(359, 0.5, 0.5);
    // Expected: shortest turn from 359 to 0.5 is +1.5 degrees; half of that
    // is +0.75, landing at 359.75 (i.e. just before the seam), not ~180.
    expect(next).toBeCloseTo(359.75, 9);
    expect(Math.abs(next - 180)).toBeGreaterThan(100);
  });

  it('converges toward a steady heading over repeated updates', () => {
    let smoothed = null;
    for (let i = 0; i < 50; i++) smoothed = smoothAngle(smoothed, 200, 0.15);
    expect(smoothed).toBeCloseTo(200, 3);
  });

  it('stays within [0, 360) across the wrap', () => {
    let smoothed = 355;
    for (let i = 0; i < 20; i++) {
      smoothed = smoothAngle(smoothed, 5, 0.3);
      expect(smoothed).toBeGreaterThanOrEqual(0);
      expect(smoothed).toBeLessThan(360);
    }
  });
});

describe('compassAccuracyLevel', () => {
  it('treats a missing reading as unknown, regardless of platform', () => {
    expect(compassAccuracyLevel(null, 'ios')).toBe('unknown');
    expect(compassAccuracyLevel(undefined, 'android')).toBe('unknown');
    expect(compassAccuracyLevel(NaN, 'ios')).toBe('unknown');
  });

  it('reads iOS degrees where LOWER is better', () => {
    expect(compassAccuracyLevel(1, 'ios')).toBe('high');   // tight fix
    expect(compassAccuracyLevel(5, 'ios')).toBe('high');
    expect(compassAccuracyLevel(10, 'ios')).toBe('medium');
    expect(compassAccuracyLevel(30, 'ios')).toBe('low');   // loose fix
    expect(compassAccuracyLevel(-1, 'ios')).toBe('unknown'); // invalid heading
  });

  it('reads Android categories where HIGHER is better', () => {
    expect(compassAccuracyLevel(3, 'android')).toBe('high');
    expect(compassAccuracyLevel(2, 'android')).toBe('medium');
    expect(compassAccuracyLevel(1, 'android')).toBe('low');
    expect(compassAccuracyLevel(0, 'android')).toBe('low'); // unreliable
  });

  it('does not confuse the two scales', () => {
    // A value of 1 means "excellent" on iOS but "poor" on Android — the same
    // number, opposite verdicts. This is the bug the level classifier exists
    // to prevent.
    expect(compassAccuracyLevel(1, 'ios')).toBe('high');
    expect(compassAccuracyLevel(1, 'android')).toBe('low');
  });
});

describe('presentation helpers', () => {
  it('names compass points', () => {
    expect(compassPoint(0)).toBe('N');
    expect(compassPoint(90)).toBe('E');
    expect(compassPoint(180)).toBe('S');
    expect(compassPoint(270)).toBe('W');
    expect(compassPoint(255.9)).toBe('WSW'); // Islamabad's qibla
  });

  it('reports alignment with an honest tolerance', () => {
    expect(alignment(0).state).toBe('aligned');
    expect(alignment(4).state).toBe('aligned');
    expect(alignment(12).state).toBe('close');
    expect(alignment(90).state).toBe('far');
    expect(alignment(90).label).toBe('Turn right');
    expect(alignment(-90).label).toBe('Turn left');
  });
});
