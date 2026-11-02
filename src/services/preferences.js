// User preferences.
//
// Six preference keys were declared in storage.js and never read or written by
// anything — notification toggles, Quran font size, default translation and
// reciter, and the tasbih target. Settings therefore only ever persisted the
// user's name and theme, and every other control the app implied simply did
// not exist.
//
// This is the one place preferences are defined, defaulted, validated and
// synced. Screens read through `usePreferences()` rather than reaching into
// AsyncStorage with ad-hoc keys.

import storage from './storage';
import { backend } from './backend';

const KEY = 'preferences';

/**
 * Every preference, with its default and a validator.
 *
 * Validation matters because these values come back from disk and from the
 * server: a corrupted font size must not be able to render the Quran at 2px.
 */
export const SCHEMA = {
  // Reading
  quranFontSize: { def: 26, validate: v => typeof v === 'number' && v >= 18 && v <= 48 },
  translationLanguage: { def: 'en', validate: v => ['en', 'ur', 'ms', 'fr', 'id'].includes(v) },
  reciterId: { def: 7, validate: v => Number.isInteger(v) && v >= 1 && v <= 12 },
  showTransliteration: { def: true, validate: v => typeof v === 'boolean' },
  autoPlayTarjama: { def: false, validate: v => typeof v === 'boolean' },
  continuousPlay: { def: false, validate: v => typeof v === 'boolean' },

  // Notifications
  notificationsEnabled: { def: true, validate: v => typeof v === 'boolean' },
  prayerNotifications: { def: true, validate: v => typeof v === 'boolean' },
  dailyAyahNotification: { def: true, validate: v => typeof v === 'boolean' },
  reviewReminder: { def: true, validate: v => typeof v === 'boolean' },

  // Tasbih
  tasbihTarget: { def: 33, validate: v => Number.isInteger(v) && v >= 1 && v <= 10000 },
  tasbihHaptics: { def: true, validate: v => typeof v === 'boolean' },
  tasbihKeepCount: { def: true, validate: v => typeof v === 'boolean' },

  // Prayer
  prayerMethod: { def: 2, validate: v => Number.isInteger(v) && v >= 0 && v <= 15 },
  hijriOffset: { def: 0, validate: v => Number.isInteger(v) && v >= -2 && v <= 2 },
};

export const DEFAULTS = Object.fromEntries(
  Object.entries(SCHEMA).map(([k, { def }]) => [k, def])
);

/** Drops anything unknown or invalid, falling back to the default. */
export function sanitise(raw = {}) {
  const out = { ...DEFAULTS };
  for (const [key, value] of Object.entries(raw)) {
    const rule = SCHEMA[key];
    if (rule && rule.validate(value)) out[key] = value;
  }
  return out;
}

let cache = null;
const listeners = new Set();

export const preferences = {
  /** Current preferences, defaults filled in. Cached after the first read. */
  async all() {
    if (cache) return cache;
    cache = sanitise(await storage.getObject(KEY, {}));
    return cache;
  },

  async get(key) {
    return (await this.all())[key];
  },

  /**
   * Updates one or more preferences.
   * Writes locally first so the UI never waits on the network, then syncs.
   */
  async set(updates) {
    const next = sanitise({ ...(await this.all()), ...updates });
    cache = next;
    await storage.setJSON(KEY, next);

    listeners.forEach(fn => {
      try {
        fn(next);
      } catch (e) {
        console.warn('Preference listener failed:', e);
      }
    });

    // Best-effort sync; guest mode has no token and that is fine.
    storage.get('auth_token').then(token => {
      if (token) backend.updateSettings(next).catch(() => {});
    });

    return next;
  },

  /** Pulls server-side preferences after sign-in, merging over local values. */
  async hydrateFromServer() {
    try {
      const remote = await backend.getSettings();
      if (remote && typeof remote === 'object') {
        return this.set(remote);
      }
    } catch {
      // Offline or guest — local values stand.
    }
    return this.all();
  },

  /** Subscribe to changes. Returns an unsubscribe function. */
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  async reset() {
    cache = { ...DEFAULTS };
    await storage.setJSON(KEY, cache);
    listeners.forEach(fn => fn(cache));
    return cache;
  },

  /**
   * Re-read from storage after something outside this service wrote the
   * underlying key — notably a restored backup. Notifies subscribers so live
   * screens update, but does not write or sync, because the stored values are
   * already the source of truth.
   */
  async reload() {
    cache = null;
    const next = await this.all();
    listeners.forEach(fn => {
      try {
        fn(next);
      } catch (e) {
        console.warn('Preference listener failed:', e);
      }
    });
    return next;
  },

  /** Test seam — forces the next read to hit storage. */
  _clearCache() {
    cache = null;
  },
};

export default preferences;
