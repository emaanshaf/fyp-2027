import { preferences, DEFAULTS, SCHEMA, sanitise } from '../preferences';

beforeEach(() => {
  global.__resetStorage();
  preferences._clearCache();
});

describe('schema', () => {
  it('defines a default and a validator for every preference', () => {
    for (const [key, rule] of Object.entries(SCHEMA)) {
      expect(rule.def).toBeDefined();
      expect(typeof rule.validate).toBe('function');
      expect(rule.validate(rule.def)).toBe(true);
      expect(DEFAULTS[key]).toBe(rule.def);
    }
  });

  it('covers the keys that were declared but never used', () => {
    // storage.js listed these for months while nothing read or wrote them, so
    // Settings silently persisted only the name and theme.
    for (const key of [
      'notificationsEnabled', 'prayerNotifications',
      'quranFontSize', 'translationLanguage', 'tasbihTarget',
    ]) {
      expect(SCHEMA[key]).toBeDefined();
    }
  });
});

describe('sanitise', () => {
  it('fills in defaults for anything missing', () => {
    expect(sanitise({})).toEqual(DEFAULTS);
  });

  it('keeps valid values', () => {
    expect(sanitise({ quranFontSize: 32 }).quranFontSize).toBe(32);
  });

  it('rejects a font size that would make the Quran unreadable', () => {
    // These values arrive from disk and from the server, so a corrupt one
    // must not be able to render scripture at 2px or 900px.
    expect(sanitise({ quranFontSize: 2 }).quranFontSize).toBe(DEFAULTS.quranFontSize);
    expect(sanitise({ quranFontSize: 900 }).quranFontSize).toBe(DEFAULTS.quranFontSize);
    expect(sanitise({ quranFontSize: 'big' }).quranFontSize).toBe(DEFAULTS.quranFontSize);
  });

  it('rejects a translation language the app does not ship', () => {
    expect(sanitise({ translationLanguage: 'de' }).translationLanguage).toBe('en');
    expect(sanitise({ translationLanguage: 'ur' }).translationLanguage).toBe('ur');
  });

  it('rejects a reciter id outside the twelve published', () => {
    expect(sanitise({ reciterId: 99 }).reciterId).toBe(DEFAULTS.reciterId);
    expect(sanitise({ reciterId: 3 }).reciterId).toBe(3);
  });

  it('rejects a non-boolean toggle', () => {
    expect(sanitise({ notificationsEnabled: 'yes' }).notificationsEnabled).toBe(true);
    expect(sanitise({ notificationsEnabled: false }).notificationsEnabled).toBe(false);
  });

  it('drops unknown keys instead of storing them', () => {
    expect(sanitise({ somethingElse: 1 }).somethingElse).toBeUndefined();
  });
});

describe('read and write', () => {
  it('starts at the defaults', async () => {
    expect(await preferences.all()).toEqual(DEFAULTS);
  });

  it('persists a change', async () => {
    await preferences.set({ tasbihTarget: 100 });
    preferences._clearCache();
    expect((await preferences.all()).tasbihTarget).toBe(100);
  });

  it('merges rather than replacing', async () => {
    await preferences.set({ tasbihTarget: 100 });
    await preferences.set({ quranFontSize: 30 });
    const p = await preferences.all();
    expect(p.tasbihTarget).toBe(100);
    expect(p.quranFontSize).toBe(30);
  });

  it('reads a single preference', async () => {
    await preferences.set({ reciterId: 3 });
    expect(await preferences.get('reciterId')).toBe(3);
  });

  it('refuses to store an invalid value', async () => {
    await preferences.set({ quranFontSize: 999 });
    expect(await preferences.get('quranFontSize')).toBe(DEFAULTS.quranFontSize);
  });

  it('resets everything back to defaults', async () => {
    await preferences.set({ tasbihTarget: 500, quranFontSize: 40 });
    await preferences.reset();
    expect(await preferences.all()).toEqual(DEFAULTS);
  });

  it('recovers from a corrupt stored blob', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('qitab_preferences', '{not json');
    preferences._clearCache();
    expect(await preferences.all()).toEqual(DEFAULTS);
  });
});

describe('subscriptions', () => {
  it('notifies subscribers so other screens stay in sync', async () => {
    const seen = jest.fn();
    const unsubscribe = preferences.subscribe(seen);

    await preferences.set({ tasbihTarget: 99 });

    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen.mock.calls[0][0].tasbihTarget).toBe(99);
    unsubscribe();
  });

  it('stops notifying after unsubscribe', async () => {
    const seen = jest.fn();
    preferences.subscribe(seen)();
    await preferences.set({ tasbihTarget: 34 });
    expect(seen).not.toHaveBeenCalled();
  });

  it('survives a listener that throws', async () => {
    preferences.subscribe(() => { throw new Error('bad listener'); });
    const good = jest.fn();
    preferences.subscribe(good);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(preferences.set({ tasbihTarget: 33 })).resolves.toBeDefined();
    expect(good).toHaveBeenCalled();
  });
});
