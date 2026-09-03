import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend } from './backend';
import { StorageKeys } from './storage';
import { apiUrl } from '../config/appConfig';

const SYNCED_KEYS = {
  [StorageKeys.BOOKMARKS]: { api: 'bookmarks', sync: 'syncBookmarks' },
  [StorageKeys.NOTES]: { api: 'notes', sync: 'syncNotes' },
  [StorageKeys.FAV_DUAS]: { api: 'favorites', sync: null },
  [StorageKeys.PRAYER_TOGGLES]: { api: 'prayerToggles', sync: 'updatePrayerToggles' },
  [StorageKeys.REMINDERS]: { api: 'reminders', sync: null },
  [StorageKeys.TASBIH_HISTORY]: { api: 'tasbihHistory', sync: null },
};

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
  }

  async isOnline() {
    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        timeout: 3000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async syncAll() {
    if (this.isSyncing) return;
    
    const token = await AsyncStorage.getItem('qitab_auth_token');
    if (!token) return;

    this.isSyncing = true;
    try {
      for (const [storageKey, config] of Object.entries(SYNCED_KEYS)) {
        await this.syncKey(storageKey, config);
      }
      this.lastSyncTime = Date.now();
      await AsyncStorage.setItem('qitab_last_sync', this.lastSyncTime.toString());
    } catch (error) {
      console.warn('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncKey(storageKey, config) {
    try {
      const localData = await AsyncStorage.getItem(`qitab_${storageKey}`);
      if (!localData) return;

      const items = JSON.parse(localData);
      if (!Array.isArray(items) || items.length === 0) return;

      if (config.sync) {
        await backend[config.sync](items);
      }
    } catch (error) {
      console.warn(`Sync failed for ${storageKey}:`, error);
    }
  }

  async pullAll() {
    const token = await AsyncStorage.getItem('qitab_auth_token');
    if (!token) return;

    try {
      for (const [storageKey, config] of Object.entries(SYNCED_KEYS)) {
        await this.pullKey(storageKey, config);
      }
      this.lastSyncTime = Date.now();
    } catch (error) {
      console.warn('Pull failed:', error);
    }
  }

  async pullKey(storageKey, config) {
    try {
      const remoteData = await backend[config.api]();
      if (remoteData && Array.isArray(remoteData)) {
        await AsyncStorage.setItem(`qitab_${storageKey}`, JSON.stringify(remoteData));
      }
    } catch (error) {
      console.warn(`Pull failed for ${storageKey}:`, error);
    }
  }

  async onLogin() {
    await this.pullAll();
  }

  async onLogout() {
    this.lastSyncTime = null;
  }
}

export const syncService = new SyncService();
export default syncService;
