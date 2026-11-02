import { apiUrl } from '../config/appConfig';
import { clearAuthToken, getAuthToken, setAuthToken } from './authToken';

// A request must not hang forever behind a captive portal or a TCP connection
// that opened but never answers. The old AbortError branch could never fire
// because no signal and no timer were ever attached.
const DEFAULT_TIMEOUT_MS = 15000;

class BackendService {
  constructor() {
    this.baseUrl = apiUrl;
    this.token = null;
  }

  async getToken() {
    if (this.token) return this.token;
    // The adapter keeps the token in the OS keystore on native and migrates
    // an older AsyncStorage copy on first read.
    this.token = await getAuthToken();
    return this.token;
  }

  async setToken(token) {
    this.token = token;
    if (token) await setAuthToken(token);
    else await clearAuthToken();
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const {
      timeoutMs = DEFAULT_TIMEOUT_MS,
      signal: callerSignal,
      ...fetchOptions
    } = options;

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...fetchOptions.headers,
    };

    const effectiveTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_TIMEOUT_MS;

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, effectiveTimeout);

    const forwardAbort = () => controller.abort();
    if (callerSignal) {
      if (callerSignal.aborted) controller.abort();
      else callerSignal.addEventListener('abort', forwardAbort);
    }

    try {
      let response;
      try {
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });
      } catch (error) {
        // Only a transport failure reaches here. Previously this catch also
        // wrapped the parsing and status checks below, so a caller could not
        // tell "the network is down" from "the server said no".
        if (timedOut) {
          const aborted = new Error('Request timed out');
          aborted.reason = 'timeout';
          throw aborted;
        }
        if (error.name === 'AbortError') {
          const cancelled = new Error('Request was cancelled');
          cancelled.reason = 'cancelled';
          throw cancelled;
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
        // The API sends a machine-readable `reason` alongside the
        // human-readable `error`. Throwing only the message forced callers to
        // match on the prose, so rewording a server message silently changed
        // app behaviour.
        const failure = new Error(data?.error || `Request failed (HTTP ${response.status})`);
        failure.status = response.status;
        failure.reason = data?.reason || null;
        failure.data = data;
        failure.requestId = response.headers?.get?.('x-request-id') || null;
        throw failure;
      }

      return data;
    } finally {
      clearTimeout(timer);
      callerSignal?.removeEventListener?.('abort', forwardAbort);
    }
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

  /**
   * Delete the signed-in account. The server re-checks the password, so a
   * stolen session token alone cannot destroy the account.
   */
  async deleteAccount(password) {
    return this.request('/auth/me', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
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

  // Good Deeds
  async getDeeds(date) {
    const q = date ? `?date=${date}` : '';
    return this.request(`/deeds${q}`);
  }

  async addDeed(deed) {
    return this.request('/deeds', {
      method: 'POST',
      body: JSON.stringify(deed),
    });
  }

  async getDeedStats() {
    return this.request('/deeds/stats');
  }

  async deleteDeed(id) {
    return this.request(`/deeds/${id}`, { method: 'DELETE' });
  }

  // Reflection Journal
  async getJournalEntries() {
    return this.request('/journal');
  }

  async addJournalEntry(entry) {
    return this.request('/journal', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async updateJournalEntry(id, data) {
    return this.request(`/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJournalEntry(id) {
    return this.request(`/journal/${id}`, { method: 'DELETE' });
  }

  // Khatm Planner
  async getKhatmPlan() {
    return this.request('/khatm');
  }

  async saveKhatmPlan(planData) {
    return this.request('/khatm', {
      method: 'PUT',
      body: JSON.stringify(planData),
    });
  }

  async deleteKhatmPlan() {
    return this.request('/khatm', { method: 'DELETE' });
  }

  // Push token
  async registerPushToken(token) {
    return this.request('/auth/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Admin
  async getAdminUsers() {
    return this.request('/auth/users');
  }

  async getAdminStats() {
    return this.request('/auth/stats');
  }

  async updateUserRole(userId, role) {
    return this.request(`/auth/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(userId) {
    return this.request(`/auth/users/${userId}`, { method: 'DELETE' });
  }
}

export const backend = new BackendService();
export default backend;
