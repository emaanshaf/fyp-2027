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

jest.mock('expo-file-system', () => ({
  cacheDirectory: '/tmp/',
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
}));

// Exposed so tests can start from a clean slate.
global.__resetStorage = () => mockStore.clear();

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
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date' },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 31.5204, longitude: 74.3587 } })
  ),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([{ city: 'Lahore', country: 'Pakistan' }])),
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
