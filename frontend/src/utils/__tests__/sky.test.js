import {
  SKY_PHASES,
  bodyPosition,
  prayerWindows,
  skyLabel,
  skyState,
  skyTint,
} from '../sky';

// Cached timings for a normal mid-latitude day.
const PRAYERS = [
  { name: 'Fajr', mins: 5 * 60 },
  { name: 'Dhuhr', mins: 12 * 60 + 15 },
  { name: 'Asr', mins: 16 * 60 },
  { name: 'Maghrib', mins: 18 * 60 },
  { name: 'Isha', mins: 19 * 60 },
];

const at = (hour, minute = 0) => new Date(2026, 9, 29, hour, minute);

describe('prayerWindows', () => {
  it('needs all four anchor prayers', () => {
    expect(prayerWindows(null)).toBeNull();
    expect(prayerWindows([{ name: 'Fajr', mins: 300 }])).toBeNull();
  });

  it('orders dawn, day, golden, dusk and night', () => {
    const windows = prayerWindows(PRAYERS);
    expect(windows.map(w => w.phase)).toEqual(['dawn', 'day', 'golden', 'dusk', 'night']);
    expect(windows[0].start).toBe(300);
    expect(windows[2].start).toBe(960);
    expect(windows[4].end).toBe(24 * 60 + 300);
  });
});

describe('skyState with prayer times', () => {
  it('puts the sun up through the day', () => {
    const dawn = skyState({ now: at(5, 15), prayers: PRAYERS });
    expect(dawn.phase).toBe('dawn');
    expect(dawn.body).toBe('sun');
    expect(dawn.source).toBe('prayers');

    expect(skyState({ now: at(10), prayers: PRAYERS }).phase).toBe('day');
    expect(skyState({ now: at(17), prayers: PRAYERS }).phase).toBe('golden');
  });

  it('switches to the moon at Maghrib', () => {
    const dusk = skyState({ now: at(18, 30), prayers: PRAYERS });
    expect(dusk.phase).toBe('dusk');
    expect(dusk.body).toBe('moon');
  });

  it('treats the night as one window across midnight', () => {
    const evening = skyState({ now: at(22), prayers: PRAYERS });
    const smallHours = skyState({ now: at(3), prayers: PRAYERS });
    expect(evening.phase).toBe('night');
    expect(smallHours.phase).toBe('night');
    expect(smallHours.progress).toBeGreaterThan(evening.progress);
  });

  it('never returns progress outside 0-1', () => {
    for (let hour = 0; hour < 24; hour++) {
      const state = skyState({ now: at(hour, 30), prayers: PRAYERS });
      expect(state.progress).toBeGreaterThanOrEqual(0);
      expect(state.progress).toBeLessThanOrEqual(1);
    }
  });
});

describe('skyState without prayer times', () => {
  it('falls back to the clock and says so', () => {
    const noon = skyState({ now: at(12) });
    expect(noon.source).toBe('clock');
    expect(noon.phase).toBe('day');
    expect(skyState({ now: at(5) }).phase).toBe('dawn');
    expect(skyState({ now: at(17) }).phase).toBe('golden');
    expect(skyState({ now: at(19) }).phase).toBe('dusk');
    expect(skyState({ now: at(23) }).phase).toBe('night');
    expect(skyState({ now: at(2) }).phase).toBe('night');
  });
});

describe('bodyPosition', () => {
  it('moves the sun east to west and higher in the middle', () => {
    const start = bodyPosition('day', 0);
    const middle = bodyPosition('day', 0.5);
    const end = bodyPosition('day', 1);
    expect(start.x).toBeLessThan(middle.x);
    expect(middle.x).toBeLessThan(end.x);
    expect(middle.y).toBeLessThan(start.y);
  });

  it('clamps out-of-range progress', () => {
    expect(bodyPosition('night', -4).x).toBe(12);
    expect(bodyPosition('night', 9).x).toBe(88);
  });
});

describe('skyTint and skyLabel', () => {
  it('gives every phase a distinct two-stop tint', () => {
    const firsts = SKY_PHASES.map(phase => skyTint(phase)[0]);
    expect(new Set(firsts).size).toBe(SKY_PHASES.length);
    for (const phase of SKY_PHASES) expect(skyTint(phase)).toHaveLength(2);
  });

  it('describes each phase in words', () => {
    for (const phase of SKY_PHASES) expect(skyLabel(phase, 'sun')).toBeTruthy();
  });
});
