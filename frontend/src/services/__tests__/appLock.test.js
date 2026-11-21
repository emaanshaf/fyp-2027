import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  APP_LOCK_KEY,
  LOCKOUT_MS,
  MAX_PIN_ATTEMPTS,
  authenticateWithBiometrics,
  clearPinFailures,
  disableAppLock,
  enableAppLock,
  getAppLockState,
  getBiometricCapability,
  isValidPin,
  setBiometricsEnabled,
  verifyPin,
} from '../appLock';

beforeEach(() => {
  global.__resetStorage();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('isValidPin', () => {
  it('accepts 4 to 8 digits', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('12345678')).toBe(true);
  });

  it('rejects short, long and non-numeric PINs', () => {
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('123456789')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
    expect(isValidPin('')).toBe(false);
    expect(isValidPin(null)).toBe(false);
  });
});

describe('enableAppLock', () => {
  it('stores a salted hash, never the PIN, in secure storage', async () => {
    const state = await enableAppLock('1234');

    expect(state).toMatchObject({ enabled: true, hasPin: true, biometricsEnabled: false });
    const raw = await SecureStore.getItemAsync(APP_LOCK_KEY);
    const record = JSON.parse(raw);
    expect(raw).not.toContain('1234');
    expect(record.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(record.salt).toBeTruthy();
    expect(record.salt).not.toBe('1234');
  });

  it('rejects an invalid PIN instead of storing it', async () => {
    await expect(enableAppLock('12')).rejects.toThrow(/digits/i);
    expect(await SecureStore.getItemAsync(APP_LOCK_KEY)).toBeNull();
  });

  it('reports disabled when nothing has been set up', async () => {
    expect(await getAppLockState()).toMatchObject({
      enabled: false, hasPin: false, biometricsEnabled: false,
    });
    expect((await verifyPin('1234')).reason).toBe('disabled');
  });
});

describe('verifyPin', () => {
  it('accepts the right PIN and rejects a wrong one with a countdown', async () => {
    await enableAppLock('1234');

    expect(await verifyPin('1234')).toEqual({ ok: true });

    const wrong = await verifyPin('0000');
    expect(wrong).toMatchObject({ ok: false, reason: 'wrong', attemptsRemaining: 4 });
    expect(wrong.message).toContain('4 attempts remaining');
  });

  it('locks out after five failures and accepts the PIN once it expires', async () => {
    await enableAppLock('1234');

    for (let i = 0; i < MAX_PIN_ATTEMPTS; i += 1) {
      await verifyPin('0000');
    }

    const lockedOut = await verifyPin('1234');
    expect(lockedOut.ok).toBe(false);
    expect(lockedOut.reason).toBe('locked');
    expect(lockedOut.retryAfterMs).toBeGreaterThan(0);

    const state = await getAppLockState();
    expect(state.retryAfterMs).toBeGreaterThan(0);

    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + LOCKOUT_MS + 1);
    expect(await verifyPin('1234')).toEqual({ ok: true });
  });

  it('clears an earlier lockout when biometrics succeed', async () => {
    await enableAppLock('1234');
    await verifyPin('0000');
    await clearPinFailures();

    expect((await verifyPin('0000')).attemptsRemaining).toBe(4);
  });
});

describe('disableAppLock', () => {
  it('requires the current PIN before removing the lock', async () => {
    await enableAppLock('1234');

    const wrong = await disableAppLock('9999');
    expect(wrong.ok).toBe(false);
    expect(await SecureStore.getItemAsync(APP_LOCK_KEY)).not.toBeNull();

    const right = await disableAppLock('1234');
    expect(right.ok).toBe(true);
    expect(await SecureStore.getItemAsync(APP_LOCK_KEY)).toBeNull();
    expect((await getAppLockState()).enabled).toBe(false);
  });

  it('counts a wrong disable attempt toward the lockout', async () => {
    await enableAppLock('1234');
    const result = await disableAppLock('0000');
    expect(result).toMatchObject({ ok: false, attemptsRemaining: 4 });
  });
});

describe('biometrics', () => {
  it('detects the sensor and labels it for the platform', async () => {
    const capability = await getBiometricCapability();
    expect(capability).toMatchObject({ available: true, label: 'Face ID' });
  });

  it('reports unavailable when the device has no enrolled biometrics', async () => {
    LocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(false);
    expect((await getBiometricCapability()).available).toBe(false);
  });

  it('can only be enabled while app lock is on', async () => {
    expect((await setBiometricsEnabled(true)).reason).toBe('disabled');

    await enableAppLock('1234');
    expect(await setBiometricsEnabled(true)).toEqual({ ok: true, enabled: true });
    expect((await getAppLockState()).biometricsEnabled).toBe(true);
    expect(await setBiometricsEnabled(false)).toEqual({ ok: true, enabled: false });
  });

  it('reports a cancelled prompt without unlocking', async () => {
    LocalAuthentication.authenticateAsync.mockResolvedValueOnce({
      success: false,
      error: 'user_cancel',
    });

    const result = await authenticateWithBiometrics();
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/cancelled/i);
  });
});
