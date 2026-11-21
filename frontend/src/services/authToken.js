import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * The API session token is a bearer credential: anyone who reads it can act as
 * this user against the backend. It used to live in AsyncStorage, which is a
 * plain file (or localStorage on web) and is included in device backups.
 *
 * On native it now lives in the OS keystore through expo-secure-store: the
 * Keychain on iOS and EncryptedSharedPreferences on Android. The key is marked
 * THIS_DEVICE_ONLY so a token is never restored onto another device from an
 * iCloud or Android backup.
 *
 * Browsers have no keystore an app may use, so the web build keeps using
 * AsyncStorage. That limitation is real and is surfaced in Settings rather
 * than papered over.
 */
export const AUTH_TOKEN_KEY = 'qitab_auth_token';

const NATIVE = Platform.OS !== 'web';

const SECURE_OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// One migration at a time. Several screens ask for the token during startup;
// without this, each could see "not in SecureStore yet", read the same legacy
// value, and race to write and delete it.
let migration = null;

async function migrateLegacyToken() {
  if (!NATIVE) return AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (migration) return migration;

  migration = (async () => {
    // A token written by an older build. Move it, then delete the plaintext.
    const legacy = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!legacy) {
      // A concurrent caller may have migrated the token while this one was
      // checking AsyncStorage. Re-read before concluding there is none.
      return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    }

    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, legacy, SECURE_OPTIONS);
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      return legacy;
    } catch (error) {
      // Never delete the only copy because the keystore refused the write.
      // The token keeps working until the next successful migration, and the
      // failure is visible in the logs rather than silent.
      console.warn('Could not migrate auth token to secure storage:', error?.message);
      return legacy;
    }
  })();

  // Clear the in-flight guard once it settles, so a later legacy write (or a
  // fresh test) is still picked up. Concurrent callers share this promise.
  try {
    return await migration;
  } finally {
    migration = null;
  }
}

export async function getAuthToken() {
  if (!NATIVE) return AsyncStorage.getItem(AUTH_TOKEN_KEY);

  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (token) return token;
  } catch (error) {
    // Fail closed on reads: returning a token from an insecure fallback after
    // the keystore failed would defeat the point of the migration.
    console.warn('Secure storage read failed:', error?.message);
    return null;
  }

  return migrateLegacyToken();
}

export async function setAuthToken(token) {
  if (!token) return clearAuthToken();

  if (NATIVE) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, SECURE_OPTIONS);
    // Clean up a legacy plaintext copy if one is still around.
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
    return;
  }

  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  if (NATIVE) {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.warn('Secure storage delete failed:', error?.message);
    }
  }
  // Always clear the legacy location too, including on web.
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
}

export async function hasAuthToken() {
  return Boolean(await getAuthToken());
}
