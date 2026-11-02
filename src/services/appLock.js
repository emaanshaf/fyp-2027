import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';

/**
 * Optional app lock: a PIN, optionally backed by the device's biometric
 * sensor, required when the app starts or returns from the background.
 *
 * What this protects against: someone picking up an unlocked phone and
 * opening the app. What it does not do: encrypt the app's data or hide it
 * from the OS. The PIN hash and settings live in SecureStore on native, so
 * they are protected by the platform keystore; the web build has no such
 * store and falls back to AsyncStorage, which is surfaced in Settings.
 */
export const APP_LOCK_KEY = 'qitab_app_lock';
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 8;
export const MAX_PIN_ATTEMPTS = 5;
export const LOCKOUT_MS = 30_000;
export const BACKGROUND_GRACE_MS = 30_000;

const PIN_PATTERN = new RegExp(`^\\d{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`);
const NATIVE = Platform.OS !== 'web';
const SECURE_OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const EMPTY = {
  enabled: false,
  biometricsEnabled: false,
  salt: null,
  hash: null,
  failures: 0,
  lockedUntil: 0,
};

export function isValidPin(pin) {
  return typeof pin === 'string' && PIN_PATTERN.test(pin);
}

function normalize(record) {
  if (!record || typeof record !== 'object') return { ...EMPTY };
  return {
    enabled: record.enabled === true && typeof record.hash === 'string',
    biometricsEnabled: record.biometricsEnabled === true,
    salt: typeof record.salt === 'string' ? record.salt : null,
    hash: typeof record.hash === 'string' ? record.hash : null,
    failures: Number.isFinite(record.failures) ? record.failures : 0,
    lockedUntil: Number.isFinite(record.lockedUntil) ? record.lockedUntil : 0,
  };
}

async function readRecord() {
  try {
    const raw = NATIVE
      ? await SecureStore.getItemAsync(APP_LOCK_KEY, SECURE_OPTIONS)
      : await AsyncStorage.getItem(APP_LOCK_KEY);
    if (!raw) return { ...EMPTY };
    return normalize(JSON.parse(raw));
  } catch (error) {
    console.warn('Could not read app lock settings:', error?.message);
    return { ...EMPTY };
  }
}

async function writeRecord(record) {
  const payload = JSON.stringify(record);
  if (NATIVE) {
    await SecureStore.setItemAsync(APP_LOCK_KEY, payload, SECURE_OPTIONS);
  } else {
    await AsyncStorage.setItem(APP_LOCK_KEY, payload);
  }
}

async function deleteRecord() {
  if (NATIVE) {
    await SecureStore.deleteItemAsync(APP_LOCK_KEY, SECURE_OPTIONS);
  } else {
    await AsyncStorage.removeItem(APP_LOCK_KEY);
  }
}

/** Hash a PIN with a random per-install salt. */
async function hashPin(pin, salt) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `qitab-e-noor:${salt}:${pin}`,
  );
}

/** A summary safe to render — never the salt or hash. */
export async function getAppLockState() {
  const record = await readRecord();
  return {
    enabled: record.enabled,
    biometricsEnabled: record.enabled && record.biometricsEnabled,
    hasPin: Boolean(record.hash),
    // Lets the lock screen restore a running lockout after a restart
    // instead of requiring one doomed attempt to discover it.
    retryAfterMs: Math.max(0, record.lockedUntil - Date.now()),
  };
}

export async function enableAppLock(pin) {
  if (!isValidPin(pin)) {
    throw new Error(`PIN must be ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digits.`);
  }

  const salt = Crypto.randomUUID();
  const hash = await hashPin(pin, salt);
  await writeRecord({
    ...EMPTY,
    enabled: true,
    salt,
    hash,
  });
  return getAppLockState();
}

/**
 * Turn the lock off. Requires the current PIN: a stolen unlocked phone should
 * not let someone disable the lock without proving they know it.
 */
export async function disableAppLock(pin) {
  const result = await verifyPin(pin);
  if (!result.ok) return result;

  await deleteRecord();
  return { ok: true };
}

export async function setBiometricsEnabled(enabled) {
  const record = await readRecord();
  if (!record.enabled) {
    return { ok: false, reason: 'disabled', message: 'Turn on app lock first.' };
  }

  await writeRecord({ ...record, biometricsEnabled: Boolean(enabled) });
  return { ok: true, enabled: Boolean(enabled) };
}

export async function verifyPin(pin) {
  const record = await readRecord();

  if (!record.enabled || !record.hash) {
    return { ok: false, reason: 'disabled', message: 'App lock is not set up.' };
  }

  const now = Date.now();
  if (record.lockedUntil > now) {
    return {
      ok: false,
      reason: 'locked',
      retryAfterMs: record.lockedUntil - now,
      message: 'Too many incorrect attempts.',
    };
  }

  if (!isValidPin(pin)) {
    return {
      ok: false,
      reason: 'invalid',
      message: `Enter your ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digit PIN.`,
    };
  }

  const candidate = await hashPin(pin, record.salt);
  if (candidate === record.hash) {
    if (record.failures || record.lockedUntil) {
      await writeRecord({ ...record, failures: 0, lockedUntil: 0 });
    }
    return { ok: true };
  }

  const failures = record.failures + 1;
  if (failures >= MAX_PIN_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_MS;
    await writeRecord({ ...record, failures: 0, lockedUntil });
    return {
      ok: false,
      reason: 'locked',
      retryAfterMs: LOCKOUT_MS,
      message: 'Too many incorrect attempts.',
    };
  }

  await writeRecord({ ...record, failures });
  return {
    ok: false,
    reason: 'wrong',
    attemptsRemaining: MAX_PIN_ATTEMPTS - failures,
    message: `Incorrect PIN. ${MAX_PIN_ATTEMPTS - failures} attempt${MAX_PIN_ATTEMPTS - failures === 1 ? '' : 's'} remaining.`,
  };
}

/** Biometric success should not leave a PIN lockout running. */
export async function clearPinFailures() {
  const record = await readRecord();
  if (record.enabled && (record.failures || record.lockedUntil)) {
    await writeRecord({ ...record, failures: 0, lockedUntil: 0 });
  }
}

export async function getBiometricCapability() {
  const unavailable = {
    available: false,
    label: 'Biometrics',
    types: [],
  };

  if (!NATIVE) return unavailable;

  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    const list = Array.isArray(types) ? types : [];
    let label = 'Biometrics';
    if (list.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      label = Platform.OS === 'ios' ? 'Face ID' : 'Face unlock';
    } else if (list.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      label = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    } else if (list.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      label = 'Iris unlock';
    }

    return {
      available: Boolean(hasHardware && enrolled),
      label,
      types: list,
    };
  } catch (error) {
    console.warn('Could not query biometrics:', error?.message);
    return unavailable;
  }
}

export async function authenticateWithBiometrics(promptMessage = 'Unlock Qitab-e-Noor') {
  if (!NATIVE) {
    return { ok: false, reason: 'unavailable', message: 'Biometrics are not available in this browser.' };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Use PIN',
      // The OS passcode must not stand in for the app PIN. The user's
      // fallback is the PIN they chose for this app.
      disableDeviceFallback: true,
    });

    if (result.success) return { ok: true };
    return {
      ok: false,
      reason: result.error || 'failed',
      message:
        result.error === 'user_cancel' || result.error === 'system_cancel'
          ? 'Biometric unlock cancelled. Enter your PIN instead.'
          : 'Biometric unlock failed. Enter your PIN instead.',
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'error',
      message: `Biometric unlock unavailable: ${error?.message || 'unknown error'}.`,
    };
  }
}
