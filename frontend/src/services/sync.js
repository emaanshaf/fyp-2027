
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase/config';
import { backend } from './backend';
import { hasAuthToken } from './authToken';
import { StorageKeys } from './storage';

const SYNCED_KEYS = {
  [StorageKeys.BOOKMARKS]: {
    getRemote: 'getBookmarks',
    syncRemote: 'syncBookmarks',
    type: 'array',
  },
  [StorageKeys.NOTES]: {
    getRemote: 'getNotes',
    syncRemote: 'syncNotes',
    type: 'array',
  },
  [StorageKeys.FAV_DUAS]: {
    getRemote: 'getFavorites',
    syncRemote: null,
    type: 'array',
  },
  [StorageKeys.PRAYER_TOGGLES]: {
    getRemote: 'getPrayerToggles',
    syncRemote: 'updatePrayerToggles',
    type: 'object',
  },
  [StorageKeys.REMINDERS]: {
    getRemote: 'getReminders',
    syncRemote: null,
    type: 'array',
  },
  [StorageKeys.TASBIH_HISTORY]: {
    getRemote: 'getTasbihHistory',
    syncRemote: null,
    type: 'array',
  },
};

// Keep sync locks separated by Firebase UID.
const syncLocks = new Set();

function getUID() {
  return auth?.currentUser?.uid || null;
}

function getLocalKey(storageKey, uid = getUID()) {
  if (!uid) return null;
  return `qitab_account_${uid}_${storageKey}`;
}

async function getLocalData(storageKey, uid = getUID()) {
  const key = getLocalKey(storageKey, uid);
  if (!key) return null;

  const raw = await AsyncStorage.getItem(key);

  if (raw === null) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setLocalData(storageKey, data, uid = getUID()) {
  const key = getLocalKey(storageKey, uid);
  if (!key) return;

  await AsyncStorage.setItem(key, JSON.stringify(data));
}

function isValidData(data, type) {
  if (type === 'array') return Array.isArray(data);

  if (type === 'object') {
    return data !== null && typeof data === 'object' && !Array.isArray(data);
  }

  return false;
}

function isCurrentAccount(uid) {
  return !!uid && getUID() === uid;
}

export const syncService = {
  // ---------------- PUSH LOCAL DATA ----------------

  async syncAll() {
    const uid = getUID();

    if (!uid || !(await hasAuthToken())) return;

    if (syncLocks.has(uid)) return;

    syncLocks.add(uid);

    try {
      for (const storageKey of Object.keys(SYNCED_KEYS)) {
        if (!isCurrentAccount(uid)) break;
        await this.syncKey(storageKey, uid);
      }

      if (isCurrentAccount(uid)) {
        await AsyncStorage.setItem(
          `qitab_account_${uid}_last_sync`,
          new Date().toISOString()
        );
      }
    } catch (error) {
      console.warn('Sync error:', error?.message);
    } finally {
      syncLocks.delete(uid);
    }
  },

  async syncKey(storageKey, uid = getUID()) {
    if (!uid || !isCurrentAccount(uid)) return;
    if (!(await hasAuthToken())) return;

    const config = SYNCED_KEYS[storageKey];

    if (!config || !config.syncRemote) return;

    try {
      const data = await getLocalData(storageKey, uid);

      if (!isCurrentAccount(uid)) return;
      if (!isValidData(data, config.type)) return;

      const syncMethod = backend[config.syncRemote];

      if (typeof syncMethod !== 'function') return;

      await syncMethod.call(backend, data);
    } catch (error) {
      console.warn(`Sync ${storageKey} error:`, error?.message);
    }
  },

  // ---------------- PULL REMOTE DATA ----------------

  async pullAll() {
    const uid = getUID();

    if (!uid || !(await hasAuthToken())) return;

    try {
      for (const storageKey of Object.keys(SYNCED_KEYS)) {
        if (!isCurrentAccount(uid)) break;
        await this.pullKey(storageKey, uid);
      }
    } catch (error) {
      console.warn('Pull error:', error?.message);
    }
  },

  async pullKey(storageKey, uid = getUID()) {
    if (!uid || !isCurrentAccount(uid)) return;
    if (!(await hasAuthToken())) return;

    const config = SYNCED_KEYS[storageKey];

    if (!config) return;

    try {
      const apiMethod = backend[config.getRemote];

      if (typeof apiMethod !== 'function') return;

      const remoteData = await apiMethod.call(backend);

      // Stop if the account changed while the request was in progress.
      if (!isCurrentAccount(uid)) return;

      if (!isValidData(remoteData, config.type)) return;

      const localData = await getLocalData(storageKey, uid);

      if (!isCurrentAccount(uid)) return;

      // Restore only when this category has no local copy.
      if (localData === null) {
        await setLocalData(storageKey, remoteData, uid);
      }
    } catch (error) {
      console.warn(`Pull ${storageKey} error:`, error?.message);
    }
  },

  // ---------------- AUTH LIFECYCLE ----------------

  async onLogin() {
    const uid = getUID();

    if (!uid) return;

    await this.pullAll();
  },

  async onLogout() {
    const uid = getUID();

    if (uid) {
      syncLocks.delete(uid);
    }
  },

  // ---------------- UTILITIES ----------------

  getCurrentUID() {
    return getUID();
  },

  async getAccountData(storageKey) {
    const uid = getUID();
    if (!uid) return null;

    return getLocalData(storageKey, uid);
  },

  async saveAccountData(storageKey, data) {
    const uid = getUID();
    if (!uid) return;

    return setLocalData(storageKey, data, uid);
  },
};

export default syncService;
