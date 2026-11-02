import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  AUTH_TOKEN_KEY,
  clearAuthToken,
  getAuthToken,
  hasAuthToken,
  setAuthToken,
} from '../authToken';

beforeEach(() => {
  global.__resetStorage();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('auth token storage', () => {
  it('writes and reads the token through SecureStore on native', async () => {
    await setAuthToken('jwt-abc');

    expect(await SecureStore.getItemAsync(AUTH_TOKEN_KEY)).toBe('jwt-abc');
    expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(await getAuthToken()).toBe('jwt-abc');
    expect(await hasAuthToken()).toBe(true);
  });

  it('migrates a token left in AsyncStorage by an older build', async () => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'legacy-jwt');

    expect(await getAuthToken()).toBe('legacy-jwt');
    expect(await SecureStore.getItemAsync(AUTH_TOKEN_KEY)).toBe('legacy-jwt');
    // The plaintext copy must be gone after migration.
    expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('handles concurrent reads during migration without losing the token', async () => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'raced-jwt');

    const results = await Promise.all([getAuthToken(), getAuthToken(), getAuthToken()]);
    expect(results).toEqual(['raced-jwt', 'raced-jwt', 'raced-jwt']);
    expect(await SecureStore.getItemAsync(AUTH_TOKEN_KEY)).toBe('raced-jwt');
  });

  it('clears both storage locations on sign out', async () => {
    await setAuthToken('jwt-abc');
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'stray-copy');

    await clearAuthToken();

    expect(await SecureStore.getItemAsync(AUTH_TOKEN_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(await getAuthToken()).toBeNull();
    expect(await hasAuthToken()).toBe(false);
  });
});
