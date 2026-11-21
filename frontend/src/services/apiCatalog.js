// Reads the backend's self-documenting catalogue and runs the few endpoints
// that are safe to invoke from a docs screen.
//
// The catalogue is cached after a successful read so the Developer Console
// still explains the API when the server is down — the moment it is most
// useful — with the screen marking the data as stale.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../config/appConfig';

export const API_CATALOG_CACHE_KEY = 'qitab_api_catalog_cache';
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_PREVIEW_CHARS = 1400;

function isCatalog(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && Array.isArray(value.groups)
    && value.groups.every(
      group => group
        && typeof group.id === 'string'
        && typeof group.title === 'string'
        && Array.isArray(group.endpoints)
    )
  );
}

async function requestJson(path, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    return {
      response,
      text,
      data,
      latencyMs: Date.now() - startedAt,
      requestId: response.headers?.get?.('x-request-id') || null,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeout = new Error(`The API did not answer within ${Math.round(timeoutMs / 1000)} seconds.`);
      timeout.reason = 'timeout';
      throw timeout;
    }
    const offline = new Error('Could not reach the API. Check that the backend is running.');
    offline.reason = 'offline';
    throw offline;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Absolute browser address for an endpoint in the catalogue.
 *
 * The catalogue documents paths relative to the /api mount, so joining them
 * with the configured base keeps the link correct on a phone (LAN address) and
 * in the web preview (localhost). Returns null for anything that is not a
 * plain path, which keeps malformed catalogue data out of Linking.
 */
export function getEndpointUrl(endpoint) {
  if (!endpoint || typeof endpoint.path !== 'string' || !endpoint.path.startsWith('/')) {
    return null;
  }
  return `${apiUrl.replace(/\/+$/, '')}${endpoint.path}`;
}

/** Fetch the live catalogue and remember it for the next offline visit. */
export async function fetchApiCatalog() {
  const result = await requestJson('/', DEFAULT_TIMEOUT_MS);

  if (!result.response.ok) {
    throw new Error(`The API answered HTTP ${result.response.status}.`);
  }
  if (!isCatalog(result.data)) {
    throw new Error('The API catalogue was not in the expected format.');
  }

  const payload = {
    catalog: result.data,
    latencyMs: result.latencyMs,
    requestId: result.requestId,
    fetchedAt: Date.now(),
  };

  try {
    await AsyncStorage.setItem(API_CATALOG_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // A cache write failure must not hide a perfectly good live catalogue.
  }

  return payload;
}

/** The last successful catalogue, or null if there has never been one. */
export async function readCachedApiCatalog() {
  try {
    const raw = await AsyncStorage.getItem(API_CATALOG_CACHE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!isCatalog(payload?.catalog)) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Invoke a public, parameter-free GET from the catalogue.
 *
 * The guards are repeated here rather than trusted to the UI: this is the one
 * function that turns a rendered row into a network request, and a write route
 * must never be reachable through it.
 */
export async function testApiEndpoint(endpoint) {
  const allowed = endpoint
    && endpoint.method === 'GET'
    && endpoint.auth === 'public'
    && endpoint.testable === true
    && typeof endpoint.path === 'string'
    && endpoint.path.startsWith('/')
    && !endpoint.path.includes(':');

  if (!allowed) {
    throw new Error('Only public, parameter-free GET endpoints can be tested here.');
  }

  const result = await requestJson(endpoint.path, DEFAULT_TIMEOUT_MS);
  const body = result.data !== null
    ? JSON.stringify(result.data, null, 2)
    : (result.text || '(empty response)');

  return {
    status: result.response.status,
    ok: result.response.ok,
    latencyMs: result.latencyMs,
    requestId: result.requestId,
    preview: body.length > MAX_PREVIEW_CHARS
      ? `${body.slice(0, MAX_PREVIEW_CHARS)}\n…`
      : body,
  };
}
