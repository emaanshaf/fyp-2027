// Screen suites render whole React Native trees and take 8-15s each under
// parallel load, well past jest's 5s default. This lives here rather than as
// `testTimeout` in the config because Jest 29 silently ignores that key inside
// a `projects` entry — it warns, the tests keep timing out, and the config
// looks correct.
jest.setTimeout(20000);

// Test environment shims.
//
// The learning engine and cache both persist through AsyncStorage, so tests
// run against an in-memory implementation rather than mocking every call site.

const mockStore = new Map();
const mockSecureStore = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(k => Promise.resolve(mockStore.has(k) ? mockStore.get(k) : null)),
  setItem: jest.fn((k, v) => { mockStore.set(k, v); return Promise.resolve(); }),
  removeItem: jest.fn(k => { mockStore.delete(k); return Promise.resolve(); }),
  getAllKeys: jest.fn(() => Promise.resolve([...mockStore.keys()])),
  multiGet: jest.fn(keys => Promise.resolve(keys.map(k => [k, mockStore.get(k) ?? null]))),
  multiSet: jest.fn(pairs => { pairs.forEach(([k, v]) => mockStore.set(k, v)); return Promise.resolve(); }),
  multiRemove: jest.fn(keys => { keys.forEach(k => mockStore.delete(k)); return Promise.resolve(); }),
  clear: jest.fn(() => { mockStore.clear(); return Promise.resolve(); }),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

// In-memory filesystem. The app persists large cache payloads and the
// downloaded Quran through expo-file-system, so tests need to read back what
// they write. SDK 57 exposes the classic API at `expo-file-system/legacy`;
// the package root only exports the class-based API and throws on these
// function names.
const mockFiles = new Map();
const mockFileSystem = {
  documentDirectory: '/documents/',
  cacheDirectory: '/tmp/',
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(uri =>
    Promise.resolve({
      exists: mockFiles.has(uri),
      size: (mockFiles.get(uri) || '').length,
      isDirectory: false,
    })
  ),
  readAsStringAsync: jest.fn(uri =>
    mockFiles.has(uri)
      ? Promise.resolve(mockFiles.get(uri))
      : Promise.reject(new Error(`ENOENT: ${uri}`))
  ),
  writeAsStringAsync: jest.fn((uri, text) => {
    mockFiles.set(uri, text);
    return Promise.resolve();
  }),
  deleteAsync: jest.fn(uri => {
    mockFiles.delete(uri);
    for (const key of [...mockFiles.keys()]) {
      if (key.startsWith(uri)) mockFiles.delete(key);
    }
    return Promise.resolve();
  }),
  readDirectoryAsync: jest.fn(dir => {
    const prefix = dir.endsWith('/') ? dir : `${dir}/`;
    const names = new Set();
    for (const key of mockFiles.keys()) {
      if (!key.startsWith(prefix)) continue;
      names.add(key.slice(prefix.length).split('/')[0]);
    }
    return Promise.resolve([...names]);
  }),
  moveAsync: jest.fn(({ from, to }) => {
    if (!mockFiles.has(from)) return Promise.reject(new Error(`ENOENT: ${from}`));
    mockFiles.set(to, mockFiles.get(from));
    mockFiles.delete(from);
    return Promise.resolve();
  }),
};

jest.mock('expo-file-system', () => mockFileSystem);
jest.mock('expo-file-system/legacy', () => mockFileSystem);

// expo-secure-store is native-only. The mock is an in-memory map with the
// same surface the app uses, so token migration and the app lock can be
// exercised without a device keystore.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(k => Promise.resolve(mockSecureStore.has(k) ? mockSecureStore.get(k) : null)),
  setItemAsync: jest.fn((k, v) => { mockSecureStore.set(k, v); return Promise.resolve(); }),
  deleteItemAsync: jest.fn(k => { mockSecureStore.delete(k); return Promise.resolve(); }),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([2])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

jest.mock('expo-crypto', () => {
  const nodeCrypto = require('crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256', SHA1: 'SHA-1', MD5: 'MD5' },
    digestStringAsync: jest.fn((algorithm, data) =>
      Promise.resolve(nodeCrypto.createHash('sha256').update(data).digest('hex'))
    ),
    randomUUID: jest.fn(() => nodeCrypto.randomUUID()),
  };
});

// Exposed so tests can start from a clean slate. Secure storage is cleared
// too: a leftover lock from one suite must never lock another.
global.__resetStorage = () => {
  mockStore.clear();
  mockSecureStore.clear();
  mockFiles.clear();
};
global.__resetSecureStore = () => mockSecureStore.clear();

// Firebase ships ESM that Jest will not transform, and none of these tests
// exercise it — the app treats Firebase as optional at runtime anyway.
jest.mock('firebase/app', () => ({ initializeApp: jest.fn(), getApps: () => [] }));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  initializeAuth: jest.fn(() => ({ currentUser: null })),
  getReactNativePersistence: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signOut: jest.fn(() => Promise.resolve()),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  onSnapshot: jest.fn(() => jest.fn()),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(),
}));

// @expo/vector-icons touches expo-font's native module registry at construct
// time, which is not present under jest. The icons themselves are not what
// the smoke tests are checking, so they render as plain views.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = ({ name, ...props }) =>
    React.createElement(View, { accessibilityLabel: `icon-${name}`, ...props });
  return new Proxy({}, { get: () => Icon });
});

jest.mock('expo-speech', () => ({
  speak: jest.fn((_, opts) => opts?.onDone?.()),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3 },
  AndroidNotificationPriority: { MAX: 'max', HIGH: 'high', DEFAULT: 'default' },
  SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date', TIME_INTERVAL: 'timeInterval' },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  // The Duas context card checks the existing grant on mount so that opening
  // the screen does not trigger a system dialog (see services/placeLookup.js).
  getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'undetermined' })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 31.5204, longitude: 74.3587 } })
  ),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([{ city: 'Lahore', country: 'Pakistan' }])),
  // The Duas screen follows the user after a grant; the smoke tests only need
  // a subscription they can remove.
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  // The Qibla screen subscribes to this; without it the screen only ever
  // exercises its no-compass fallback and the dial path goes untested.
  watchHeadingAsync: jest.fn(cb => {
    cb({ trueHeading: 0, magHeading: 0, accuracy: 3 });
    return Promise.resolve({ remove: jest.fn() });
  }),
  Accuracy: { Balanced: 3, High: 4 },
}));

jest.mock('expo-sensors', () => ({
  Magnetometer: {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    setUpdateInterval: jest.fn(),
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  },
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: { createAsync: jest.fn(() => Promise.resolve({ sound: {
      playAsync: jest.fn(), pauseAsync: jest.fn(), stopAsync: jest.fn(),
      unloadAsync: jest.fn(), setOnPlaybackStatusUpdate: jest.fn(),
    } })) },
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
}));

// react-native-gesture-handler ships its own jest setup. The hand-rolled mock
// that replaced it was enough for GestureHandlerRootView but not for
// @react-navigation/drawer, which reaches for internals the stub did not have
// ("Cannot read properties of undefined (reading 'loadUnpackers')").
require('react-native-gesture-handler/jestSetup');

// Reanimated 4 moved its runtime into react-native-worklets, which on import
// reads globalThis.__workletsModuleProxy — installed by the native module, and
// therefore absent under jest. Without it the import throws "Cannot read
// properties of undefined (reading 'loadUnpackers')", and since
// @react-navigation/drawer imports Reanimated, that takes the app's whole boot
// path with it.
//
// react-native-reanimated/mock is not a way out: it imports the real Reanimated
// and hits the same line. Standing the proxy up instead lets the real module
// load, with every native call a no-op.
// Each call returns a fresh object rather than undefined: some of the return
// values are used as WeakMap keys, and undefined is not a valid one.
globalThis.__workletsModuleProxy = new Proxy(
  {},
  { get: () => () => ({}) }
);

// React 19 reports uncaught render errors through window.dispatchEvent. The
// jest environment has a `window` without it, so the reporter itself threw and
// replaced the real error with "window.dispatchEvent is not a function" —
// hiding whatever actually failed.
if (typeof globalThis.window === 'object' && typeof globalThis.window.dispatchEvent !== 'function') {
  globalThis.window.dispatchEvent = () => true;
  globalThis.window.addEventListener = globalThis.window.addEventListener || (() => {});
  globalThis.window.removeEventListener = globalThis.window.removeEventListener || (() => {});
}
