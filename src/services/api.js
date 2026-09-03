// API Service Layer - Centralized API calls with error handling
import { cached, fetchJson, TTL } from './cache';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  constructor() {
    this.baseUrl = '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  setBaseUrl(url) {
    this.baseUrl = url;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.defaultHeaders,
      ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new ApiError(
          data.message || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        error.message || 'Network error',
        0,
        { originalError: error }
      );
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Prayer Times API
//
// Cached through the offline layer: prayer timings are the one thing that has
// to render when someone opens the app in a basement or on a plane. Timings
// are keyed by date so a stale entry can never show yesterday's Fajr.
const prayerKey = (suffix) => `prayer:${new Date().toISOString().slice(0, 10)}:${suffix}`;

export const prayerApi = {
  async getTimingsByCity(city, country, method = 2) {
    return cached(
      prayerKey(`city:${city}:${country}:${method}`),
      async () => {
        const data = await fetchJson(
          `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}` +
          `&country=${encodeURIComponent(country)}&method=${method}`
        );
        if (data.code !== 200) throw new Error(data.status || 'Failed to fetch prayer times');
        return data.data;
      },
      { ttl: TTL.DAILY }
    );
  },

  async getTimingsByCoordinates(lat, lng, method = 2) {
    // Round to ~1km so small GPS drift doesn't miss the cache on every open.
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    return cached(
      prayerKey(`geo:${key}:${method}`),
      async () => {
        const data = await fetchJson(
          `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${method}`
        );
        if (data.code !== 200) throw new Error(data.status || 'Failed to fetch prayer times');
        return data.data;
      },
      { ttl: TTL.DAILY }
    );
  },

  async getQiblaDirection(lat, lng) {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    return cached(
      `qibla:${key}`,
      async () => {
        const data = await fetchJson(
          `https://api.aladhan.com/v1/qibla?latitude=${lat}&longitude=${lng}`
        );
        if (data.code !== 200) throw new Error(data.status || 'Failed to fetch Qibla direction');
        return data.data;
      },
      // The Qibla from a given point never changes.
      { ttl: TTL.IMMUTABLE }
    );
  },
};

// Export singleton
export const api = new ApiService();
export default api;