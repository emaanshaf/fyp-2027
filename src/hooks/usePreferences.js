import { useState, useEffect, useCallback } from 'react';
import { preferences, DEFAULTS } from '../services/preferences';

/**
 * Reads and writes user preferences, staying in sync across screens.
 *
 * Every subscriber is notified on write, so changing the default translation
 * in Settings updates the Quran reader without a remount.
 *
 * @returns {[object, Function, boolean]} [prefs, setPrefs, ready]
 */
export function usePreferences() {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    preferences.all().then(p => {
      if (alive) {
        setPrefs(p);
        setReady(true);
      }
    });
    const unsubscribe = preferences.subscribe(next => {
      if (alive) setPrefs(next);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const update = useCallback(updates => preferences.set(updates), []);

  return [prefs, update, ready];
}

/** A single preference, for screens that only need one. */
export function usePreference(key) {
  const [prefs, update] = usePreferences();
  const set = useCallback(value => update({ [key]: value }), [key, update]);
  return [prefs[key], set];
}

export default usePreferences;
