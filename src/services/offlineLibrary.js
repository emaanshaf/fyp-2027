// Persistent offline Quran library.
//
// `cache.js` is deliberately best-effort: entries expire and the least
// recently used ones are evicted. This module has the opposite contract. A
// download is explicit, lives in the app's *documents* directory (not the
// cache directory the OS may purge), survives restarts, and can be resumed
// after an interrupted download.
//
// On web there is no filesystem, so the same trimmed payload is kept in
// AsyncStorage. Each surah is a separate key, which keeps individual writes
// small enough for the browser's storage quota.
//
// Only Quran text and one translation are stored. Recitation audio is large
// (hundreds of megabytes) and stays streaming-only.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { quranApi } from '../config/appConfig';
import { fetchJson } from './cache';

export const OFFLINE_QURAN_VERSION = 1;

const IS_WEB = Platform.OS === 'web';
const MANIFEST_KEY = 'qitab_offline_quran_manifest';
const WEB_CHAPTER_PREFIX = 'qitab_offline_quran_chapter_';
const ROOT_DIR = `${FileSystem.documentDirectory || ''}offline-quran/`;
const MANIFEST_FILE = `${ROOT_DIR}manifest.json`;

// A full Quran with one translation is ~5.7 MB. That is past the usual 5 MB
// localStorage quota, so the browser build uses IndexedDB. AsyncStorage stays
// as the fallback for environments without IndexedDB (including Jest).
const IDB_NAME = 'qitab_offline_quran';
const IDB_CHAPTERS = 'chapters';
const IDB_META = 'meta';
const IDB_MANIFEST_KEY = 'manifest';

const chapterFile = (translationId, chapterId) =>
  `${ROOT_DIR}${translationId}/${chapterId}.json`;

const webChapterKey = (translationId, chapterId) =>
  `${WEB_CHAPTER_PREFIX}${translationId}:${chapterId}`;

const emptyManifest = () => ({
  version: OFFLINE_QURAN_VERSION,
  updatedAt: 0,
  chapters: [],
  packages: {},
});

// ---------------------------------------------------------------------------
// Filesystem / AsyncStorage adapter
// ---------------------------------------------------------------------------

async function ensureParent(uri) {
  const slash = uri.lastIndexOf('/');
  if (slash <= 0) return;
  await FileSystem.makeDirectoryAsync(uri.slice(0, slash + 1), {
    intermediates: true,
  }).catch(() => {
    // Already exists. makeDirectoryAsync rejects rather than overwriting.
  });
}

async function writeText(uri, text) {
  await ensureParent(uri);
  await FileSystem.writeAsStringAsync(uri, text);
}

async function readText(uri) {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info?.exists) return null;
  return FileSystem.readAsStringAsync(uri);
}

async function deletePath(uri) {
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}

// ---------------------------------------------------------------------------
// IndexedDB adapter (web only)
// ---------------------------------------------------------------------------

const hasIndexedDb = () => IS_WEB && typeof indexedDB !== 'undefined';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_CHAPTERS)) db.createObjectStore(IDB_CHAPTERS);
      if (!db.objectStoreNames.contains(IDB_META)) db.createObjectStore(IDB_META);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Offline storage is blocked by another tab.'));
  });
  return dbPromise;
}

function idbGet(store, key) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const request = tx.objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  }));
}

function idbPut(store, key, value) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Offline storage write aborted.'));
  }));
}

function idbDelete(store, key) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

function idbClear(store) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

async function readWebChapter(tid, cid) {
  if (hasIndexedDb()) {
    try {
      const value = await idbGet(IDB_CHAPTERS, `${tid}:${cid}`);
      if (value != null) return value;
    } catch {
      // Fall through to AsyncStorage rather than losing the download.
    }
  }
  return AsyncStorage.getItem(webChapterKey(tid, cid));
}

async function writeWebChapter(tid, cid, payload) {
  if (hasIndexedDb()) {
    try {
      await idbPut(IDB_CHAPTERS, `${tid}:${cid}`, payload);
      return;
    } catch {
      // Fall through to AsyncStorage on quota/private-mode failures.
    }
  }
  await AsyncStorage.setItem(webChapterKey(tid, cid), payload);
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

function normalizeManifest(parsed) {
  if (!parsed || parsed.version !== OFFLINE_QURAN_VERSION) return emptyManifest();
  return {
    version: OFFLINE_QURAN_VERSION,
    updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
    packages: parsed.packages && typeof parsed.packages === 'object' ? parsed.packages : {},
  };
}

async function readManifestRaw() {
  if (!IS_WEB) return readText(MANIFEST_FILE);
  if (hasIndexedDb()) {
    try {
      const value = await idbGet(IDB_META, IDB_MANIFEST_KEY);
      if (value != null) return value;
    } catch {
      // Private mode or a blocked database: try the legacy key below.
    }
  }
  return AsyncStorage.getItem(MANIFEST_KEY);
}

async function writeManifestRaw(raw) {
  if (!IS_WEB) return writeText(MANIFEST_FILE, raw);
  if (hasIndexedDb()) {
    try {
      await idbPut(IDB_META, IDB_MANIFEST_KEY, raw);
      // An old localStorage index would otherwise shadow nothing but waste
      // quota, and could describe chapters that were removed.
      await AsyncStorage.removeItem(MANIFEST_KEY).catch(() => {});
      return;
    } catch {
      // Fall through to AsyncStorage.
    }
  }
  return AsyncStorage.setItem(MANIFEST_KEY, raw);
}

async function readManifest() {
  try {
    const raw = await readManifestRaw();
    if (!raw) return emptyManifest();
    return normalizeManifest(JSON.parse(raw));
  } catch {
    // A corrupt manifest must not make the app unusable. The chapter files
    // are still on disk; the next download will rebuild the index.
    return emptyManifest();
  }
}

// Manifest writes are serialized. Several download workers finish chapters at
// once, and AsyncStorage does not guarantee that overlapping writes land in
// the order they were issued.
let writeQueue = Promise.resolve();

function persistManifest(manifest) {
  const snapshot = JSON.stringify({
    ...manifest,
    version: OFFLINE_QURAN_VERSION,
    updatedAt: Date.now(),
  });
  manifest.updatedAt = Date.now();

  writeQueue = writeQueue
    .then(() => writeManifestRaw(snapshot))
    .catch(e => {
      // Progress bookkeeping failing is not fatal while the download is still
      // running; the chapter payload itself was written separately.
      console.warn('Offline manifest write failed:', e?.message);
    });
  return writeQueue;
}

// ---------------------------------------------------------------------------
// Payload helpers
// ---------------------------------------------------------------------------

/**
 * Keep only the fields the readers use. The API sends word-by-word
 * translations, transliterations and metadata that would roughly quadruple
 * the stored size and are never displayed.
 */
function trimVerse(verse) {
  return {
    id: verse.id,
    verse_key: verse.verse_key,
    verse_number: verse.verse_number,
    text_uthmani: verse.text_uthmani,
    words: Array.isArray(verse.words)
      ? verse.words.map(w => ({ text_uthmani: w.text_uthmani }))
      : undefined,
    translations: Array.isArray(verse.translations)
      ? verse.translations.map(t => ({ text: t.text }))
      : [],
  };
}

async function fetchChapterVerses(chapterId, translationId, signal) {
  const url = page =>
    `${quranApi}/verses/by_chapter/${chapterId}` +
    `?language=en&words=true&word_fields=text_uthmani` +
    `&translations=${translationId}` +
    `&fields=text_uthmani,text_indopak` +
    `&per_page=50&page=${page}`;

  const first = await fetchJson(url(1), { signal });
  const totalPages = first.pagination?.total_pages || 1;

  const rest = totalPages > 1
    ? await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        fetchJson(url(i + 2), { signal })
      )
    )
    : [];

  return [first, ...rest]
    .flatMap(page => page.verses || [])
    .map(trimVerse);
}

async function fetchChapterList() {
  const data = await fetchJson(`${quranApi}/chapters?language=en`);
  return (data.chapters || []).map(c => ({
    id: c.id,
    name_simple: c.name_simple,
    name_arabic: c.name_arabic,
    translated_name: c.translated_name?.name || c.name_simple,
    verses_count: c.verses_count,
    revelation_place: c.revelation_place,
  }));
}

const packageChapters = pkg => (pkg && pkg.chapters ? pkg.chapters : {});

const packageChaptersDownloaded = pkg => Object.keys(packageChapters(pkg)).length;

const packageVersesSaved = pkg =>
  Object.values(packageChapters(pkg)).reduce((sum, c) => sum + (c.verses || 0), 0);

function decorate(pkg) {
  if (!pkg) return null;
  return {
    ...pkg,
    chapterCount: packageChaptersDownloaded(pkg),
    versesSaved: packageVersesSaved(pkg),
  };
}

export function formatBytes(n) {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function cancelledError() {
  const error = new Error('Download cancelled');
  error.name = 'AbortError';
  error.cancelled = true;
  return error;
}

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------

export async function getOfflineManifest() {
  return readManifest();
}

/** Download state for one translation, or null when it was never saved. */
export async function getOfflinePackage(translationId) {
  const manifest = await readManifest();
  return decorate(manifest.packages[String(translationId)]);
}

/** The surah list is shared by every translation package. */
export async function getOfflineChapters() {
  const manifest = await readManifest();
  const hasCompletePackage = Object.values(manifest.packages).some(p => p.complete);
  if (!hasCompletePackage || !manifest.chapters.length) return null;
  return manifest.chapters;
}

/** A downloaded surah, or null so the caller falls back to network/cache. */
export async function readOfflineChapter(chapterId, translationId) {
  const tid = String(translationId);
  const cid = String(chapterId);
  const manifest = await readManifest();
  const pkg = manifest.packages[tid];
  if (!pkg?.chapters?.[cid]) return null;

  try {
    const raw = IS_WEB
      ? await readWebChapter(tid, cid)
      : await readText(chapterFile(tid, cid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.verses) ? parsed.verses : null;
  } catch {
    return null;
  }
}

/** Storage used by every downloaded translation. */
export async function getOfflineStats() {
  const manifest = await readManifest();
  const packages = Object.values(manifest.packages);
  const chapters = packages.reduce((n, p) => n + packageChaptersDownloaded(p), 0);
  const verses = packages.reduce((n, p) => n + packageVersesSaved(p), 0);
  const bytes = packages.reduce((n, p) => n + (p.bytes || 0), 0);

  return {
    packages: packages.length,
    chapters,
    verses,
    bytes,
    readable: formatBytes(bytes),
    updatedAt: manifest.updatedAt,
    packageList: packages.map(p => decorate(p)),
  };
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

/**
 * Download (or resume) the whole Quran in one translation.
 *
 * Existing chapters are skipped, so pressing the button again after a lost
 * connection continues where it stopped. `refresh: true` discards the saved
 * chapters and fetches everything again.
 *
 * @param {object}   opts
 * @param {number}   opts.translationId  quran.com translation id
 * @param {object}   [opts.translation]  label details from TRANSLATIONS
 * @param {Function} [opts.onProgress]   receives progress snapshots
 * @param {AbortSignal} [opts.signal]    cancels the download
 * @param {boolean}  [opts.refresh]      re-download saved chapters
 * @param {number}   [opts.concurrency]  parallel surah requests (default 3)
 */
export async function downloadQuranPackage({
  translationId,
  translation = {},
  onProgress,
  signal,
  refresh = false,
  concurrency = 3,
}) {
  if (!translationId) throw new Error('A translation is required to download the Quran.');
  if (signal?.aborted) throw cancelledError();

  const tid = String(translationId);
  const manifest = await readManifest();

  let pkg = manifest.packages[tid] || {
    translationId: Number(translationId),
    translationName: translation.name || '',
    translationNative: translation.native || '',
    author: translation.author || '',
    chapters: {},
    totalVerses: 0,
    bytes: 0,
    complete: false,
    startedAt: Date.now(),
    updatedAt: 0,
  };

  pkg.translationName = translation.name || pkg.translationName || '';
  pkg.translationNative = translation.native || pkg.translationNative || '';
  pkg.author = translation.author || pkg.author || '';
  pkg.complete = false;
  pkg.updatedAt = Date.now();

  if (refresh) {
    pkg.chapters = {};
    pkg.totalVerses = 0;
    pkg.bytes = 0;
    pkg.startedAt = Date.now();
  }

  let chapterList;
  try {
    chapterList = await fetchChapterList();
  } catch (error) {
    // An existing list is good enough to resume with; a first download needs
    // the live one.
    if (!manifest.chapters.length) throw error;
    chapterList = manifest.chapters;
  }

  manifest.chapters = chapterList;
  manifest.packages[tid] = pkg;
  await persistManifest(manifest);

  const total = chapterList.length;
  let completed = total - chapterList.filter(c => !pkg.chapters[String(c.id)]).length;
  let totalBytes = Object.values(pkg.chapters).reduce((sum, c) => sum + (c.bytes || 0), 0);

  const emit = snapshot => {
    if (typeof onProgress !== 'function') return;
    try {
      onProgress(snapshot);
    } catch {
      // A rendering callback must never kill the download.
    }
  };

  const snapshot = extra => ({
    phase: 'downloading',
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
    bytes: totalBytes,
    bytesReadable: formatBytes(totalBytes),
    ...extra,
  });

  const missing = chapterList.filter(c => !pkg.chapters[String(c.id)]);
  if (!missing.length) {
    pkg.complete = true;
    pkg.totalVerses = packageVersesSaved(pkg);
    pkg.bytes = totalBytes;
    pkg.updatedAt = Date.now();
    await persistManifest(manifest);
    emit({ phase: 'complete', completed: total, total, percent: 100, bytes: totalBytes });
    return decorate(pkg);
  }

  emit(snapshot());

  let cursor = 0;
  let failure = null;

  const worker = async () => {
    while (!failure) {
      if (signal?.aborted) {
        failure = cancelledError();
        return;
      }

      const index = cursor++;
      if (index >= missing.length) return;
      const chapter = missing[index];

      emit(snapshot({
        chapterId: chapter.id,
        chapterName: chapter.name_simple,
      }));

      try {
        const verses = await fetchChapterVerses(chapter.id, translationId, signal);
        const payload = JSON.stringify({
          chapterId: chapter.id,
          translationId: Number(translationId),
          verses,
        });

        if (IS_WEB) {
          await writeWebChapter(tid, chapter.id, payload);
        } else {
          await writeText(chapterFile(tid, chapter.id), payload);
        }

        pkg.chapters[String(chapter.id)] = {
          verses: verses.length,
          bytes: payload.length,
          at: Date.now(),
        };
        completed += 1;
        totalBytes += payload.length;

        emit(snapshot({
          chapterId: chapter.id,
          chapterName: chapter.name_simple,
        }));
        await persistManifest(manifest);
      } catch (error) {
        failure = signal?.aborted ? cancelledError() : error;
        return;
      }
    }
  };

  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, missing.length)) },
    () => worker()
  );
  await Promise.all(workers);

  pkg.bytes = totalBytes;
  pkg.totalVerses = packageVersesSaved(pkg);
  pkg.updatedAt = Date.now();
  pkg.complete = !failure;
  await persistManifest(manifest);

  if (failure) {
    if (failure.cancelled) emit(snapshot({ phase: 'paused' }));
    throw failure;
  }

  emit({ phase: 'complete', completed: total, total, percent: 100, bytes: totalBytes });
  return decorate(pkg);
}

/** Removes every downloaded surah and the index. */
export async function removeOfflineQuran() {
  if (IS_WEB) {
    // Clear both stores: IndexedDB is the primary one, but a download that
    // fell back to AsyncStorage must be removed too.
    if (hasIndexedDb()) {
      await Promise.all([
        idbClear(IDB_CHAPTERS).catch(() => {}),
        idbDelete(IDB_META, IDB_MANIFEST_KEY).catch(() => {}),
      ]);
    }
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys.filter(k => k.startsWith(WEB_CHAPTER_PREFIX)));
      await AsyncStorage.removeItem(MANIFEST_KEY);
    } catch {
      // Nothing in the fallback store.
    }
  } else {
    await deletePath(ROOT_DIR);
  }
  writeQueue = Promise.resolve();
  return true;
}

export default {
  OFFLINE_QURAN_VERSION,
  getOfflinePackage,
  getOfflineChapters,
  getOfflineManifest,
  getOfflineStats,
  readOfflineChapter,
  downloadQuranPackage,
  removeOfflineQuran,
  formatBytes,
};
