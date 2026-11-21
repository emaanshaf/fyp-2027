// Prayer lock.
//
// When a prayer time arrives the dashboard shows a reminder. If the prayer is
// still unconfirmed 10 minutes later, the app locks itself: every screen is
// covered until the user confirms they have prayed. The intent is to make the
// app stop competing with the prayer it is reminding you about.
//
// SCOPE — worth being plain about: this locks THIS app only. No app store
// build can disable the user's other apps; that needs device-owner/MDM
// privileges a normal app is never granted. Anything claiming otherwise in a
// consumer app is either lying or is a kiosk-mode enterprise deployment.
//
// The lock is deliberately escapable in two ways, both recorded:
//   - confirming the prayer (the intended path), and
//   - "Not yet — remind me later", which snoozes rather than dismisses.
// A lock with no exit would trap a user who is travelling, unwell, or a woman
// who is excused from praying, and an app must not make that judgement.

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNextPrayer, PRAYER_ORDER } from '../utils/nextPrayer';

const PrayerLockContext = createContext(null);

export const LOCK_SETTINGS_KEY = 'qitab_prayer_lock_enabled';
export const LOCK_DELAY_KEY = 'qitab_prayer_lock_delay';

/** Minutes after the prayer time before the app locks. */
export const DEFAULT_LOCK_DELAY_MIN = 10;

/** How long "remind me later" holds the lock off. */
export const SNOOZE_MIN = 10;

const todayKey = (d = new Date()) =>
  `${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;

const logKey = (d = new Date()) => `prayer_log_${todayKey(d)}`;
const snoozeKey = (prayer, d = new Date()) =>
  `qitab_lock_snooze_${todayKey(d)}_${prayer}`;

/**
 * Which prayer's window we are inside, and how long ago it began.
 * Reads the timings the prayer screen cached — no second API caller.
 */
export async function currentPrayerWindow(now = new Date()) {
  const next = await getNextPrayer(now);
  if (!next) return null;

  // getNextPrayer gives the upcoming prayer; the one in progress is the one
  // before it in the day's order.
  const idx = PRAYER_ORDER.indexOf(next.name);
  const currentIdx = (idx - 1 + PRAYER_ORDER.length) % PRAYER_ORDER.length;
  const current = PRAYER_ORDER[currentIdx];

  // Minutes since the current prayer began = time until next, subtracted from
  // the gap between them. We only have "minutes to next", so derive elapsed
  // from the cached timings directly.
  const raw = await AsyncStorage.getItem(
    `qitab_timings_${next.city}_${await AsyncStorage.getItem('qitab_prayer_country') || 'Pakistan'}`
  );
  if (!raw) return null;

  let timings;
  try { timings = JSON.parse(raw); } catch { return null; }

  const m = /^(\d{1,2}):(\d{2})/.exec(String(timings[current] || ''));
  if (!m) return null;

  const startMins = Number(m[1]) * 60 + Number(m[2]);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  // Isha runs past midnight; treat a negative gap as "yesterday's Isha".
  const elapsed = nowMins >= startMins ? nowMins - startMins : nowMins + 24 * 60 - startMins;

  return { prayer: current, elapsedMin: elapsed, nextPrayer: next.name, city: next.city };
}

export function PrayerLockProvider({ children }) {
  const [enabled, setEnabled] = useState(false);
  const [delayMin, setDelayMin] = useState(DEFAULT_LOCK_DELAY_MIN);
  const [locked, setLocked] = useState(false);
  const [lockedPrayer, setLockedPrayer] = useState(null);
  /** The pre-lock reminder shown on the dashboard. */
  const [pendingPrayer, setPendingPrayer] = useState(null);
  const [ready, setReady] = useState(false);

  const timer = useRef(null);

  useEffect(() => {
    (async () => {
      const [on, delay] = await AsyncStorage.multiGet([LOCK_SETTINGS_KEY, LOCK_DELAY_KEY]);
      setEnabled(on[1] === '1');
      const parsed = parseInt(delay[1] || '', 10);
      setDelayMin(Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LOCK_DELAY_MIN);
      setReady(true);
    })();
  }, []);

  const setLockEnabled = useCallback(async value => {
    setEnabled(value);
    await AsyncStorage.setItem(LOCK_SETTINGS_KEY, value ? '1' : '0');
    if (!value) { setLocked(false); setLockedPrayer(null); }
  }, []);

  const setLockDelay = useCallback(async minutes => {
    setDelayMin(minutes);
    await AsyncStorage.setItem(LOCK_DELAY_KEY, String(minutes));
  }, []);

  /** Marks the prayer prayed in the same log the tracker reads, then unlocks. */
  const confirmPrayed = useCallback(async prayer => {
    const key = logKey();
    const raw = await AsyncStorage.getItem(key);
    const log = raw ? JSON.parse(raw) : {};
    log[String(prayer).toLowerCase()] = true;
    await AsyncStorage.setItem(key, JSON.stringify(log));
    setLocked(false);
    setLockedPrayer(null);
    setPendingPrayer(null);
  }, []);

  /** Holds the lock off without claiming the prayer was offered. */
  const snooze = useCallback(async prayer => {
    await AsyncStorage.setItem(snoozeKey(prayer), String(Date.now()));
    setLocked(false);
    setLockedPrayer(null);
  }, []);

  const dismissReminder = useCallback(() => setPendingPrayer(null), []);

  const evaluate = useCallback(async () => {
    if (!enabled) { setLocked(false); setPendingPrayer(null); return; }

    const window = await currentPrayerWindow();
    if (!window) { setLocked(false); setPendingPrayer(null); return; }

    const { prayer, elapsedMin } = window;

    // Already prayed: nothing to do.
    const raw = await AsyncStorage.getItem(logKey());
    const log = raw ? JSON.parse(raw) : {};
    if (log[prayer.toLowerCase()]) {
      setLocked(false);
      setPendingPrayer(null);
      return;
    }

    // Snoozed recently: hold off, but keep the dashboard reminder visible.
    const snoozedAt = Number(await AsyncStorage.getItem(snoozeKey(prayer)) || 0);
    const snoozeActive = snoozedAt && (Date.now() - snoozedAt) < SNOOZE_MIN * 60 * 1000;

    // A stale window (hours after the prayer began) means the app was closed
    // through it. Locking someone out over a prayer whose time has long passed
    // is punitive, so the lock only applies inside a reasonable window.
    const withinWindow = elapsedMin >= 0 && elapsedMin <= 120;

    setPendingPrayer(withinWindow ? prayer : null);

    if (withinWindow && !snoozeActive && elapsedMin >= delayMin) {
      setLocked(true);
      setLockedPrayer(prayer);
    } else {
      setLocked(false);
      setLockedPrayer(null);
    }
  }, [enabled, delayMin]);

  // Once a minute is enough: the threshold is measured in minutes and a
  // tighter loop would wake the device for nothing.
  useEffect(() => {
    if (!ready) return undefined;
    evaluate();
    timer.current = setInterval(evaluate, 60 * 1000);
    return () => clearInterval(timer.current);
  }, [ready, evaluate]);

  const value = useMemo(() => ({
    enabled, setLockEnabled,
    delayMin, setLockDelay,
    locked, lockedPrayer,
    pendingPrayer, dismissReminder,
    confirmPrayed, snooze,
    refresh: evaluate,
  }), [
    enabled, setLockEnabled, delayMin, setLockDelay, locked, lockedPrayer,
    pendingPrayer, dismissReminder, confirmPrayed, snooze, evaluate,
  ]);

  return (
    <PrayerLockContext.Provider value={value}>
      {children}
    </PrayerLockContext.Provider>
  );
}

/** Safe outside a provider (tests, isolated screens) — reports "not locked". */
export function usePrayerLock() {
  return useContext(PrayerLockContext) || {
    enabled: false, locked: false, lockedPrayer: null, pendingPrayer: null,
    delayMin: DEFAULT_LOCK_DELAY_MIN,
    setLockEnabled: async () => {}, setLockDelay: async () => {},
    confirmPrayed: async () => {}, snooze: async () => {},
    dismissReminder: () => {}, refresh: async () => {},
  };
}

export default PrayerLockContext;
