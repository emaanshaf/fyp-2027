import {
  qiblaBearing, distanceToKaaba, relativeAngle, compassPoint, alignment,
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
