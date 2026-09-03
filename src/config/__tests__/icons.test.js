import glyphMap from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json';
import { MODULES } from '../routes';
import { PRAYERS } from '../../screens/PrayerTrackerScreen';
import { LEVELS as JOURNEY_LEVELS } from '../../screens/QuranJourneyScreen';

/**
 * Ionicons renders an unknown name as an empty box with no warning, so a typo
 * is invisible until someone opens the screen. Quran Journey shipped
 * 'seedling' and 'book-stars' — neither is a glyph — and the Beginner level
 * had a blank icon as a result. This test makes that class of bug loud.
 */

const VALID = new Set(Object.keys(glyphMap));

const expectGlyph = (name, where) => {
  expect({ where, name, valid: VALID.has(name) })
    .toEqual({ where, name, valid: true });
};

describe('Ionicons names are real glyphs', () => {
  it('has a populated glyph map to check against', () => {
    expect(VALID.size).toBeGreaterThan(1000);
    // Guards the test itself: these were the actual bad names.
    expect(VALID.has('seedling')).toBe(false);
    expect(VALID.has('book-stars')).toBe(false);
  });

  it.each(MODULES.map(m => [m.name, m.icon]))('route %s uses a real icon', (name, icon) => {
    expectGlyph(icon, `route ${name}`);
  });

  it('uses real icons for every prayer', () => {
    expect(PRAYERS.length).toBeGreaterThan(0);
    for (const p of PRAYERS) {
      expectGlyph(p.icon, `prayer ${p.name}`);
      // The filled variant is swapped in when a prayer is marked done.
      expectGlyph(p.icon.replace('-outline', ''), `prayer ${p.name} (filled)`);
    }
  });

  it('uses real icons for every Quran Journey level', () => {
    expect(JOURNEY_LEVELS.length).toBeGreaterThan(0);
    for (const l of JOURNEY_LEVELS) {
      expectGlyph(l.icon, `journey level ${l.name}`);
    }
  });
});
