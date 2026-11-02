// Offline-first data layer.
//
// Every remote read in the app goes through `cached()`. The contract is that
// a screen ALWAYS gets something to render if it has ever loaded that data
// before — a dropped connection degrades freshness, never function. That
// matters here more than in most apps: someone opening the Quran on a train
// should still get their surah.
//
// Strategy is stale-while-revalidate:
//   1. Fresh cache hit  -> return immediately, no request.
//   2. Stale cache hit  -> return immediately, refresh in the background.
//   3. No cache         -> await the network, then persist.
//   4. Network fails    -> fall back to stale cache at any age; only throw
//                          if we have genuinely never seen this data.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
// SDK 57 moved the classic function API behind `expo-file-system/legacy`.
// Importing the package root now exposes only the File/Directory classes and
// the old function names throw at runtime — which silently turned every
// filesystem cache write into a failed write on a real phone.
import * as FileSystem from 'expo-file-system/legacy';

const CACHE_PREFIX = 'qitab_cache_';
const META_KEY = 'qitab_cache_meta';

export const TTL = {
  /** Surah lists, reciter lists — effectively immutable. */
  IMMUTABLE: 1000 * 60 * 60 * 24 * 90,
  /** Verse text, tafsir, hadith bodies — revised very rarely. */
  SCRIPTURE: 1000 * 60 * 60 * 24 * 30,
  /** Prayer timings — recomputed daily. */
  DAILY: 1000 * 60 * 60 * 12,
  /** Search results and other volatile reads. */
  SHORT: 1000 * 60 * 15,
};

/** Cap on cached payloads so a full-Quran cache can't grow unbounded. */
const MAX_ENTRIES = 400;

// ---------------------------------------------------------------------------
// Connectivity
// ---------------------------------------------------------------------------

let online = true;
const listeners = new Set();

NetInfo.addEventListener(state => {
  // `isInternetReachable` is null until the first probe resolves; treat that
  // as online so a cold start is never wrongly reported as offline.
  const next = state.isConnected !== false && state.isInternetReachable !== false;
  if (next !== online) {
    online = next;
    listeners.forEach(fn => {
      try {
        fn(online);
      } catch (e) {
        console.warn('Connectivity listener failed:', e);
      }
    });
  }
});

export const isOnline = () => online;

/** Subscribe to connectivity changes. Returns an unsubscribe function. */
export function onConnectivityChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const keyFor = key => `${CACHE_PREFIX}${key}`;

async function readEntry(key) {
  try {
    const raw = await AsyncStorage.getItem(keyFor(key));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.at !== 'number') return null;
    return entry;
  } catch {
    // A corrupt entry is not worth surfacing — drop it and refetch.
    return null;
  }
}

async function writeEntry(key, value, ttl) {
  try {
    await AsyncStorage.setItem(keyFor(key), JSON.stringify({ at: Date.now(), ttl, value }));
    await touch(key);
    return true;
  } catch (e) {
    console.warn(`Cache write failed for ${key}:`, e?.message);
    return false;
  }
}

/** Records access order so eviction can drop the least-recently-used entries. */
async function touch(key) {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    let order = raw ? JSON.parse(raw) : [];
    order = order.filter(k => k !== key);
    order.push(key);

    if (order.length > MAX_ENTRIES) {
      const evict = order.splice(0, order.length - MAX_ENTRIES);
      await AsyncStorage.multiRemove(evict.map(keyFor));
    }
    await AsyncStorage.setItem(META_KEY, JSON.stringify(order));
  } catch {
    // Bookkeeping is best-effort; losing it only costs us LRU accuracy.
  }
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/** In-flight requests, so N screens mounting at once make one network call. */
const inflight = new Map();

function dedupe(key, fetcher) {
  if (inflight.has(key)) return inflight.get(key);
  const p = Promise.resolve()
    .then(fetcher)
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/**
 * Read `key` through the cache.
 *
 * @param {string}   key      Stable cache key; include every parameter that
 *                            changes the response (translation id, page, ...).
 * @param {Function} fetcher  Async function performing the network read.
 * @param {object}   [opts]
 * @param {number}   [opts.ttl]       Freshness window. Default TTL.SCRIPTURE.
 * @param {boolean}  [opts.forceRefresh]  Skip the cache read (pull-to-refresh).
 * @param {*}        [opts.fallback]  Returned instead of throwing when there is
 *                                    no cache and the network is unavailable.
 * @returns {Promise<*>} The value. Inspect `cached.lastMeta` for provenance.
 */
export async function cached(key, fetcher, opts = {}) {
  const { ttl = TTL.SCRIPTURE, forceRefresh = false, fallback } = opts;

  const entry = forceRefresh ? null : await readEntry(key);
  const age = entry ? Date.now() - entry.at : Infinity;
  const fresh = entry && age < (entry.ttl ?? ttl);

  if (fresh) return entry.value;

  // Stale but usable: serve it now, refresh behind the user's back.
  if (entry && online) {
    dedupe(key, fetcher)
      .then(value => writeEntry(key, value, ttl))
      .catch(() => {
        /* Background refresh failing is not the user's problem. */
      });
    return entry.value;
  }

  if (entry && !online) return entry.value;

  // Nothing cached — we have to go to the network.
  try {
    const value = await dedupe(key, fetcher);
    await writeEntry(key, value, ttl);
    return value;
  } catch (err) {
    // A stale entry beats an error screen, even past its TTL.
    const salvage = entry || (await readEntry(key));
    if (salvage) return salvage.value;
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

/** True when `key` can be served without a network round-trip. */
export async function isCached(key) {
  return (await readEntry(key)) !== null;
}

/** Warms the cache without caring about the result — used by prefetching. */
export async function prefetch(key, fetcher, opts = {}) {
  if (!online) return false;
  if (await isCached(key)) return true;
  try {
    await cached(key, fetcher, opts);
    return true;
  } catch {
    return false;
  }
}

/** Drops cached entries. Pass a prefix to clear one namespace, e.g. 'quran:'. */
export async function invalidate(prefix = '') {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const target = keys.filter(
      k => k.startsWith(CACHE_PREFIX) && k.slice(CACHE_PREFIX.length).startsWith(prefix)
    );
    if (target.length) await AsyncStorage.multiRemove(target);

    const raw = await AsyncStorage.getItem(META_KEY);
    if (raw) {
      const order = JSON.parse(raw).filter(k => !k.startsWith(prefix));
      await AsyncStorage.setItem(META_KEY, JSON.stringify(order));
    }
    return target.length;
  } catch (e) {
    console.warn('Cache invalidate failed:', e?.message);
    return 0;
  }
}

/** Size and entry count, for the Storage section of Settings. */
export async function cacheStats() {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(CACHE_PREFIX));
    const pairs = await AsyncStorage.multiGet(keys);
    const small = pairs.reduce((sum, [, v]) => sum + (v ? v.length : 0), 0);
    const bytes = small + (await largeCacheBytes());
    return { entries: keys.length, bytes, readable: formatBytes(bytes) };
  } catch {
    return { entries: 0, bytes: 0, readable: '0 B' };
  }
}

// ---------------------------------------------------------------------------
// Large payloads
// ---------------------------------------------------------------------------
//
// A full hadith collection is several megabytes of JSON. AsyncStorage is
// SQLite-backed and starts failing on values that size, so anything large
// goes to the filesystem instead. The interface mirrors `cached()`.

const BIG_DIR = `${FileSystem.cacheDirectory}qitab/`;
let bigDirReady = null;

async function ensureBigDir() {
  if (!bigDirReady) {
    bigDirReady = FileSystem.makeDirectoryAsync(BIG_DIR, { intermediates: true }).catch(() => {});
  }
  return bigDirReady;
}

/** Filesystem-safe filename for an arbitrary cache key. */
const bigPath = key => `${BIG_DIR}${key.replace(/[^a-z0-9]/gi, '_')}.json`;

/**
 * Session-lifetime memo for large payloads.
 *
 * A hadith collection is ~5 MB. On web the persistent store is localStorage,
 * whose quota this blows straight past, so the write fails and every caller
 * re-downloads the whole collection — which is what made the Hadith list
 * appear to load forever while paging. Holding the parsed array in memory
 * makes it one download per session on every platform.
 */
const largeMemo = new Map();

/** As `cached()`, but persists to the filesystem. Use for payloads over ~1 MB. */
export async function cachedLarge(key, fetcher, opts = {}) {
  const { ttl = TTL.SCRIPTURE, forceRefresh = false, fallback } = opts;

  if (forceRefresh) largeMemo.delete(key);
  else if (largeMemo.has(key)) return largeMemo.get(key);

  const remember = value => {
    if (value !== undefined && value !== null) largeMemo.set(key, value);
    return value;
  };

  if (Platform.OS === 'web') {
    // No filesystem on web. localStorage cannot hold a payload this size, so
    // the memo above is what actually prevents repeat downloads there.
    return remember(await cached(key, fetcher, opts));
  }

  await ensureBigDir();
  const path = bigPath(key);

  let entry = null;
  if (!forceRefresh) {
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        const raw = await FileSystem.readAsStringAsync(path);
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.at === 'number') entry = parsed;
      }
    } catch {
      // Unreadable or truncated file — treat as a miss.
    }
  }

  if (entry && Date.now() - entry.at < (entry.ttl ?? ttl)) return remember(entry.value);

  try {
    const value = await dedupe(key, fetcher);
    FileSystem.writeAsStringAsync(path, JSON.stringify({ at: Date.now(), ttl, value })).catch(e =>
      console.warn(`Large cache write failed for ${key}:`, e?.message)
    );
    return remember(value);
  } catch (err) {
    if (entry) return remember(entry.value);
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

/** Clears the filesystem cache. Counterpart to `invalidate()`. */
export async function invalidateLarge() {
  largeMemo.clear();
  if (Platform.OS === 'web') return 0;
  try {
    const files = await FileSystem.readDirectoryAsync(BIG_DIR).catch(() => []);
    await Promise.all(files.map(f => FileSystem.deleteAsync(`${BIG_DIR}${f}`, { idempotent: true })));
    return files.length;
  } catch {
    return 0;
  }
}

async function largeCacheBytes() {
  if (Platform.OS === 'web') return 0;
  try {
    const files = await FileSystem.readDirectoryAsync(BIG_DIR).catch(() => []);
    const infos = await Promise.all(files.map(f => FileSystem.getInfoAsync(`${BIG_DIR}${f}`)));
    return infos.reduce((sum, i) => sum + (i.size || 0), 0);
  } catch {
    return 0;
  }
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Network helper
// ---------------------------------------------------------------------------

/**
 * `fetch` with a timeout and a JSON body. Without the timeout a captive-portal
 * Wi-Fi network leaves requests hanging indefinitely and the UI spins forever.
 */
export async function fetchJson(url, { timeout = 15000, signal, ...init } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  // Let callers cancel a long download without waiting for the timeout. The
  // controller is local so the timeout and the caller's signal can both stop
  // the same request.
  const forwardAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', forwardAbort, { once: true });
  }

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} for ${url}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', forwardAbort);
  }
}

/** Clears every cache the app keeps. Wired to Settings > Clear cached content. */
export async function clearAllCaches() {
  const [entries] = await Promise.all([invalidate(), invalidateLarge()]);
  return entries;
}

export default {
  cached,
  cachedLarge,
  prefetch,
  invalidate,
  invalidateLarge,
  clearAllCaches,
  isCached,
  cacheStats,
  isOnline,
  TTL,
};
