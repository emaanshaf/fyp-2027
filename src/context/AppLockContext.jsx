import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { AppState } from 'react-native';
import {
  BACKGROUND_GRACE_MS,
  authenticateWithBiometrics,
  clearPinFailures,
  disableAppLock,
  enableAppLock,
  getAppLockState,
  getBiometricCapability,
  setBiometricsEnabled as persistBiometrics,
  verifyPin,
} from '../services/appLock';

const AppLockContext = createContext(null);

const INITIAL_STATE = {
  enabled: false, biometricsEnabled: false, hasPin: false, retryAfterMs: 0,
};
const INITIAL_BIOMETRIC = { available: false, label: 'Biometrics', types: [] };

/**
 * Owns the lock/unlock state for the whole app.
 *
 * The lock is checked on cold start and after the app has been in the
 * background for BACKGROUND_GRACE_MS. Short app switches — sharing a verse,
 * answering a call — do not force a PIN re-entry.
 */
export function AppLockProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState(INITIAL_STATE);
  const [locked, setLocked] = useState(false);
  const [biometric, setBiometric] = useState(INITIAL_BIOMETRIC);

  // Timestamp of leaving the foreground. A ref, not state, because the value
  // is written from the AppState callback and must not cause a re-render.
  const backgroundAt = useRef(null);
  const enabledRef = useRef(false);
  enabledRef.current = state.enabled;

  const refreshState = useCallback(async () => {
    const next = await getAppLockState();
    setState(next);
    return next;
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const next = await getAppLockState();
      if (!active) return;
      setState(next);
      // A cold start with the lock on must never reveal the previous screen.
      setLocked(next.enabled);
      setReady(true);

      getBiometricCapability().then(capability => {
        if (active) setBiometric(capability);
      });
    })();

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (!enabledRef.current) {
        backgroundAt.current = null;
        return;
      }

      if (nextState === 'background') {
        backgroundAt.current = Date.now();
        return;
      }

      if (nextState === 'active') {
        const leftAt = backgroundAt.current;
        backgroundAt.current = null;
        // A missing timestamp means we were already active (e.g. the OS
        // reports 'active' after an 'inactive' blip such as the biometric
        // prompt) — do not lock in that case.
        if (leftAt && Date.now() - leftAt >= BACKGROUND_GRACE_MS) {
          setLocked(true);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  const enable = useCallback(async pin => {
    try {
      await enableAppLock(pin);
      const next = await refreshState();
      setLocked(false);
      return { ok: true, state: next };
    } catch (error) {
      return { ok: false, message: error?.message || 'Could not enable app lock.' };
    }
  }, [refreshState]);

  const disable = useCallback(async pin => {
    const result = await disableAppLock(pin);
    if (!result.ok) return result;

    setState(INITIAL_STATE);
    setLocked(false);
    await refreshState();
    return result;
  }, [refreshState]);

  const unlockWithPin = useCallback(async pin => {
    const result = await verifyPin(pin);
    if (result.ok) setLocked(false);
    return result;
  }, []);

  const unlockWithBiometrics = useCallback(async (promptMessage) => {
    if (!enabledRef.current) {
      return { ok: false, reason: 'disabled', message: 'App lock is not enabled.' };
    }

    const result = await authenticateWithBiometrics(promptMessage);
    if (result.ok) {
      await clearPinFailures();
      setLocked(false);
    }
    return result;
  }, []);

  const setBiometrics = useCallback(async enabled => {
    if (enabled) {
      if (!biometric.available) {
        return {
          ok: false,
          message: `${biometric.label} is not set up on this device.`,
        };
      }

      const auth = await authenticateWithBiometrics(`Enable ${biometric.label} for Qitab-e-Noor`);
      if (!auth.ok) return auth;
    }

    const result = await persistBiometrics(enabled);
    if (result.ok) {
      await refreshState();
    }
    return result;
  }, [biometric.available, biometric.label, refreshState]);

  const lockNow = useCallback(() => {
    if (enabledRef.current) setLocked(true);
  }, []);

  const value = useMemo(() => ({
    ready,
    state,
    locked,
    biometric,
    graceSeconds: Math.round(BACKGROUND_GRACE_MS / 1000),
    enable,
    disable,
    setBiometrics,
    unlockWithPin,
    unlockWithBiometrics,
    lockNow,
    refreshState,
  }), [
    ready, state, locked, biometric, enable, disable, setBiometrics,
    unlockWithPin, unlockWithBiometrics, lockNow, refreshState,
  ]);

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock() {
  const value = useContext(AppLockContext);
  if (!value) throw new Error('useAppLock must be used inside AppLockProvider');
  return value;
}

export default AppLockContext;
