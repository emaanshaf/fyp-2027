import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../config/appConfig';

class BackendService {
  constructor() {
    this.baseUrl = apiUrl;
    this.token = null;
  }

  async getToken() {
    if (this.token) return this.token;
    this.token = await AsyncStorage.getItem('qitab_auth_token');
    return this.token;
  }

  async setToken(token) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('qitab_auth_token', token);
    } else {
      await AsyncStorage.removeItem('qitab_auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    let response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error) {
      // Only a transport failure reaches here. Previously this catch also
      // wrapped the parsing and status checks below, so a caller could not
      // tell "the network is down" from "the server said no".
      if (error.name === 'AbortError') {
        const aborted = new Error('Request timed out');
        aborted.reason = 'timeout';
        throw aborted;
      }
      const offline = new Error('Backend server not available');
      offline.reason = 'offline';
      throw offline;
    }

    // A proxy or platform error page in front of the API answers with HTML,
    // which used to surface to the caller as a JSON syntax error naming a
    // character position — true, and useless.
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      // The API sends a machine-readable `reason` alongside the human-readable
      // `error`. Throwing only the message forced callers to match on the
      // prose, so rewording a server message silently changed app behaviour.
      const failure = new Error(data?.error || `Request failed (HTTP ${response.status})`);
      failure.status = response.status;
      failure.reason = data?.reason || null;
      failure.data = data;
      throw failure;
    }

    return data;
  }

  // Auth
  async register(email, password, name) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    await this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.setToken(data.token);
    return data;
  }

  async logout() {
    await this.setToken(null);
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Bookmarks
  async getBookmarks() {
    return this.request('/bookmarks');
  }

  async addBookmark(bookmark) {
    return this.request('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(bookmark),
    });
  }

  async updateBookmark(id, data) {
    return this.request(`/bookmarks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBookmark(id) {
    return this.request(`/bookmarks/${id}`, { method: 'DELETE' });
  }

  async syncBookmarks(items) {
    return this.request('/bookmarks/sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  // Notes
  async getNotes() {
    return this.request('/notes');
  }

  async addNote(note) {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  async updateNote(id, data) {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id) {
    return this.request(`/notes/${id}`, { method: 'DELETE' });
  }

  async syncNotes(items) {
    return this.request('/notes/sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  // Favorites
  async getFavorites() {
    return this.request('/favorites');
  }

  async addFavorite(favorite) {
    return this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify(favorite),
    });
  }

  async deleteFavorite(id) {
    return this.request(`/favorites/${id}`, { method: 'DELETE' });
  }

  async deleteFavoriteByDuaId(duaId) {
    return this.request(`/favorites/by-dua/${duaId}`, { method: 'DELETE' });
  }

  // Prayer Toggles
  async getPrayerToggles() {
    return this.request('/prayer-toggles');
  }

  async updatePrayerToggles(toggles) {
    return this.request('/prayer-toggles', {
      method: 'PUT',
      body: JSON.stringify({ toggles }),
    });
  }

  // Reminders
  async getReminders() {
    return this.request('/reminders');
  }

  async addReminder(reminder) {
    return this.request('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    });
  }

  async updateReminder(id, data) {
    return this.request(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReminder(id) {
    return this.request(`/reminders/${id}`, { method: 'DELETE' });
  }

  // Tasbih
  async getTasbihHistory() {
    return this.request('/tasbih');
  }

  async addTasbihSession(session) {
    return this.request('/tasbih', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async getTasbihStats() {
    return this.request('/tasbih/stats');
  }

  async deleteTasbihSession(id) {
    return this.request(`/tasbih/${id}`, { method: 'DELETE' });
  }

  // Settings
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Hifz (Memorization)
  async getHifzPlans() {
    return this.request('/modules/hifz/plans');
  }

  async createHifzPlan(plan) {
    return this.request('/modules/hifz/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  async updateHifzProgress(id, data) {
    return this.request(`/modules/hifz/plans/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHifzPlan(id) {
    return this.request(`/modules/hifz/plans/${id}`, { method: 'DELETE' });
  }

  // Personal Dua Collection
  async getPersonalDuas() {
    return this.request('/modules/duas/personal');
  }

  async addPersonalDua(dua) {
    return this.request('/modules/duas/personal', {
      method: 'POST',
      body: JSON.stringify(dua),
    });
  }

  async deletePersonalDua(id) {
    return this.request(`/modules/duas/personal/${id}`, { method: 'DELETE' });
  }

  // Quran Reflection Journal
  async getJournal() {
    return this.request('/modules/journal');
  }

  async addJournalEntry(entry) {
    return this.request('/modules/journal', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async deleteJournalEntry(id) {
    return this.request(`/modules/journal/${id}`, { method: 'DELETE' });
  }

  // Good Deeds Tracker
  async getDeeds() {
    return this.request('/modules/deeds');
  }

  async addDeed(deed) {
    return this.request('/modules/deeds', {
      method: 'POST',
      body: JSON.stringify(deed),
    });
  }

  async getDeedStats() {
    return this.request('/modules/deeds/stats');
  }

  // Saved Topics
  async getSavedTopics() {
    return this.request('/modules/topics');
  }

  async saveTopic(topic) {
    return this.request('/modules/topics', {
      method: 'POST',
      body: JSON.stringify(topic),
    });
  }

  // Role-based access control
  async checkModuleAccess(moduleName) {
    return this.request(`/auth/access/${moduleName}`);
  }

  async getUserRole() {
    const data = await this.request('/auth/me');
    return data.user?.role || 'user';
  }
}

export const backend = new BackendService();
export default backend;
