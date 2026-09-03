// Storage Service - Unified local storage with type safety
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'qitab_';

export const StorageKeys = {
  USER_NAME: 'user_name',
  GUEST_MODE: 'guest',
  PRAYER_TIMINGS: 'home_timings',
  PRAYER_TIMINGS_TS: 'home_timings_ts',
  BOOKMARKS: 'bookmarks',
  NOTES: 'notes',
  FAV_DUAS: 'fav_duas',
  PRAYER_TOGGLES: 'prayer_toggles',
  REMINDERS: 'reminders',
  TASBIH_HISTORY: 'tasbih_history',
  TASBIH_COUNT: 'tasbih_count',
  TASBIH_TARGET: 'tasbih_target',
  SETTINGS: 'settings',
  THEME: 'theme_preference',
  LAST_OPENED_SURAH: 'last_opened_surah',
  LAST_OPENED_DUA: 'last_opened_dua',
  QURAN_FONT_SIZE: 'quran_font_size',
  QURAN_TRANSLATION: 'quran_translation',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  PRAYER_NOTIFICATIONS: 'prayer_notifications',
};

function getFullKey(key) {
  return `${STORAGE_PREFIX}${key}`;
}

export class StorageService {
  // String operations
  async get(key) {
    try {
      return await AsyncStorage.getItem(getFullKey(key));
    } catch (error) {
      console.warn(`Storage get error for ${key}:`, error);
      return null;
    }
  }

  async set(key, value) {
    try {
      await AsyncStorage.setItem(getFullKey(key), value);
      return true;
    } catch (error) {
      console.warn(`Storage set error for ${key}:`, error);
      return false;
    }
  }

  async remove(key) {
    try {
      await AsyncStorage.removeItem(getFullKey(key));
      return true;
    } catch (error) {
      console.warn(`Storage remove error for ${key}:`, error);
      return false;
    }
  }

  // JSON operations
  async getJSON(key, defaultValue = null) {
    try {
      const value = await this.get(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.warn(`Storage getJSON error for ${key}:`, error);
      return defaultValue;
    }
  }

  async setJSON(key, value) {
    try {
      await this.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Storage setJSON error for ${key}:`, error);
      return false;
    }
  }

  // Array operations
  async getArray(key, defaultValue = []) {
    return this.getJSON(key, defaultValue);
  }

  async pushToArray(key, item) {
    const array = await this.getArray(key);
    array.push(item);
    return this.setJSON(key, array);
  }

  async removeFromArray(key, predicate) {
    const array = await this.getArray(key);
    const filtered = array.filter(item => !predicate(item));
    return this.setJSON(key, filtered);
  }

  async updateInArray(key, predicate, updates) {
    const array = await this.getArray(key);
    const index = array.findIndex(predicate);
    if (index !== -1) {
      array[index] = { ...array[index], ...updates };
      return this.setJSON(key, array);
    }
    return false;
  }

  // Object operations
  async getObject(key, defaultValue = {}) {
    return this.getJSON(key, defaultValue);
  }

  async updateObject(key, updates) {
    const obj = await this.getObject(key);
    const updated = { ...obj, ...updates };
    return this.setJSON(key, updated);
  }

  // Bulk operations
  async multiGet(keys) {
    try {
      const fullKeys = keys.map(getFullKey);
      const result = await AsyncStorage.multiGet(fullKeys);
      return result.reduce((acc, [key, value]) => {
        acc[key.replace(STORAGE_PREFIX, '')] = value;
        return acc;
      }, {});
    } catch (error) {
      console.warn('Storage multiGet error:', error);
      return {};
    }
  }

  async multiSet(keyValuePairs) {
    try {
      const fullPairs = keyValuePairs.map(([key, value]) => [getFullKey(key), value]);
      await AsyncStorage.multiSet(fullPairs);
      return true;
    } catch (error) {
      console.warn('Storage multiSet error:', error);
      return false;
    }
  }

  async multiRemove(keys) {
    try {
      const fullKeys = keys.map(getFullKey);
      await AsyncStorage.multiRemove(fullKeys);
      return true;
    } catch (error) {
      console.warn('Storage multiRemove error:', error);
      return false;
    }
  }

  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
      await AsyncStorage.multiRemove(prefixedKeys);
      return true;
    } catch (error) {
      console.warn('Storage clearAll error:', error);
      return false;
    }
  }

  async getAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(k => k.startsWith(STORAGE_PREFIX))
        .map(k => k.replace(STORAGE_PREFIX, ''));
    } catch (error) {
      console.warn('Storage getAllKeys error:', error);
      return [];
    }
  }

  // Cache with timestamp
  async setWithTimestamp(key, value, ttlMs = 3600000) {
    const data = {
      value,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    return this.setJSON(key, data);
  }

  async getWithTimestamp(key, defaultValue = null) {
    const data = await this.getJSON(key);
    if (!data) return defaultValue;
    if (Date.now() - data.timestamp > data.ttl) {
      await this.remove(key);
      return defaultValue;
    }
    return data.value;
  }
}

export const storage = new StorageService();
export default storage;