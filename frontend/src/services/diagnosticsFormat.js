// Pure formatting and analysis for the system report.
//
// Kept separate from `diagnostics.js` so the rules can be tested without
// loading Expo's native modules.

/**
 * Keys that are expected to hold JSON. A parse failure here means a write was
 * interrupted or storage was corrupted — the rest of the report is still
 * useful, so this is reported rather than thrown.
 */
export const JSON_STORAGE_KEYS = Object.freeze([
  'qitab_preferences',
  'qitab_bookmarks',
  'qitab_bookmarks_ayah',
  'qitab_notes',
  'qitab_fav_duas',
  'qitab_reminders',
  'qitab_prayer_toggles',
  'qitab_tasbih_history',
  'qitab_zakat_history',
  'qitab_search_recent',
  'qitab_ai_chat_history_v1',
  'qitab_quran_reminder_settings',
  'qitab_library_samples',
  'qitab_app_lock',
  'good_deeds',
  'reflection_journal',
  'personal_duas',
  'khatm_plan',
  'quran_journey',
  'ramadan_state',
  'ayah_interests',
]);

const JSON_KEY_SET = new Set(JSON_STORAGE_KEYS);

/** Byte length of a UTF-8 string, including Arabic text. */
export function utf8Size(value) {
  const text = String(value == null ? '' : value);
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).length;
  try {
    return encodeURIComponent(text).replace(/%[0-9A-F]{2}/gi, 'x').length;
  } catch {
    return text.length;
  }
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  return `${Math.round(ms)} ms`;
}

/**
 * Summarise AsyncStorage pairs.
 * @param {Array<[string, string|null]>} entries
 */
export function summariseStorage(entries = []) {
  const list = Array.isArray(entries) ? entries : [];
  let bytes = 0;
  let qitabKeys = 0;
  const malformed = [];

  for (const entry of list) {
    const [key, value] = Array.isArray(entry) ? entry : [];
    if (typeof key !== 'string') continue;
    if (key.startsWith('qitab_')) qitabKeys += 1;
    if (typeof value === 'string') bytes += utf8Size(value);
    if (JSON_KEY_SET.has(key) && typeof value === 'string' && value.trim()) {
      try {
        JSON.parse(value);
      } catch {
        malformed.push(key);
      }
    }
  }

  return {
    totalKeys: list.length,
    qitabKeys,
    bytes,
    readable: formatBytes(bytes),
    malformed: malformed.sort(),
  };
}

/**
 * One-line verdict for the top of the health screen.
 * A missing backend is not a defect — the app is offline-first — but
 * corrupt storage is something the user should act on.
 */
export function assessHealth(report = {}) {
  const malformed = report.storage?.malformed || [];
  if (malformed.length) {
    return {
      level: 'attention',
      title: 'Storage needs attention',
      detail: `${malformed.length} saved item${malformed.length === 1 ? '' : 's'} could not be read. The rest of the app can still be used; export a backup before clearing data.`,
    };
  }
  if (report.backend && !report.backend.ok) {
    return report.backend.reachable
      ? {
        level: 'attention',
        title: 'Backend responded with an error',
        detail: `The app is using local storage. The server returned HTTP ${report.backend.status ?? 'unknown'}.`,
      }
      : {
        level: 'offline',
        title: 'Working offline',
        detail: 'The backend is unreachable, which is expected when there is no connection. Local data and downloaded content still work.',
      };
  }
  return {
    level: 'ok',
    title: 'All systems normal',
    detail: 'The backend is reachable and saved data parsed cleanly.',
  };
}

const orUnknown = value => (value === undefined || value === null || value === '' ? 'unknown' : value);
const yesNo = value => (value ? 'yes' : 'no');

/** Human-readable text for sharing or pasting into a support message. */
export function buildReportText(report = {}) {
  const runtime = report.runtime || {};
  const backend = report.backend || {};
  const storage = report.storage || {};
  const offline = report.offline || {};
  const cache = report.cache || {};
  const notifications = report.notifications || {};
  const appLock = report.appLock || {};
  const prefs = report.preferences || {};
  const ai = report.ai || {};

  const backendLine = backend.ok
    ? `Online — HTTP ${orUnknown(backend.status)} in ${formatDuration(backend.latencyMs)}`
    : backend.reachable
      ? `Reachable but unhealthy — HTTP ${orUnknown(backend.status)}`
      : `Offline${backend.error ? ` — ${backend.error}` : ''}`;

  const storageLine = storage.error
    ? `Unavailable — ${storage.error}`
    : `${orUnknown(storage.totalKeys)} keys · ${orUnknown(storage.readable)} · ${storage.malformed?.length ? `${storage.malformed.length} malformed (${storage.malformed.join(', ')})` : 'no malformed JSON'}`;

  const offlineLine = offline.bytes
    ? `${orUnknown(offline.packages)} package(s) · ${orUnknown(offline.chapters)} surahs · ${orUnknown(offline.readable)}`
    : 'Nothing downloaded';

  const lockLine = appLock.enabled
    ? `Enabled (${[appLock.hasPin && 'PIN', appLock.biometrics && 'biometrics'].filter(Boolean).join(', ') || 'configured'})`
    : 'Disabled';

  return [
    'Qitab-e-Noor — system report',
    `Generated: ${orUnknown(report.generatedAt)}`,
    '',
    `App: ${orUnknown(runtime.appVersion)} · Expo SDK ${orUnknown(runtime.sdkVersion)} · ${orUnknown(runtime.platform)}`,
    `Device: ${orUnknown(runtime.deviceName)} · ${orUnknown(runtime.osName)} ${orUnknown(runtime.osVersion)}`,
    `Engine: ${orUnknown(runtime.engine)} · physical device: ${yesNo(runtime.physical)}`,
    '',
    `Backend: ${backendLine}`,
    `Endpoint: ${orUnknown(backend.url)}`,
    `Storage: ${storageLine}`,
    `Offline Quran: ${offlineLine}`,
    `Cached content: ${orUnknown(cache.entries)} entries · ${orUnknown(cache.readable)}`,
    '',
    `Notifications: ${orUnknown(notifications.status)}`,
    `App lock: ${lockLine}`,
    `Last sync: ${orUnknown(report.lastSyncAt)}`,
    `Reading: ${orUnknown(prefs.translationLanguage)} · reciter ${orUnknown(prefs.reciterId)} · font ${orUnknown(prefs.quranFontSize)}`,
    `AI assistant: ${ai.ok ? 'live' : 'offline knowledge base'}${ai.message ? ` — ${ai.message}` : ''}`,
    '',
    'No auth token, PIN or hash is included in this report.',
  ].join('\n');
}
