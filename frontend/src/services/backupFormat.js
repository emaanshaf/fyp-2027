// Backup envelope format.
//
// Deliberately pure: no storage, file-system or crypto imports, so the
// integrity rules can be unit-tested without a native runtime. `backup.js`
// does the I/O around it.
//
// The checksum is an integrity check, not a signature. It proves the file was
// not truncated or edited by accident; it cannot prove who created it. That
// distinction is stated in the Settings copy so users do not treat a backup
// as tamper-proof.

export const BACKUP_FORMAT = 'qitab-e-noor-backup';
export const BACKUP_VERSION = 1;

/** Refuse to parse anything larger than this; a user data file is tiny. */
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

/**
 * Only the user's own data is backed up.
 *
 * Excluded on purpose:
 *  - `qitab_auth_token` and `qitab_app_lock`: credentials and the lock hash
 *    must never travel in a plain JSON file.
 *  - offline Quran chapters and API caches: re-downloadable, and would turn a
 *    small file into megabytes.
 *  - `qitab_landing_seen` and `qitab_last_sync`: device state, not user data.
 */
export const BACKUP_KEYS = Object.freeze([
  // Profile, preferences and settings
  'qitab_user_name',
  'qitab_preferences',
  'qitab_theme_preference',
  'qitab_prayer_city',
  'qitab_prayer_country',
  'qitab_prayer_fiqh',
  'qitab_prayer_lock_enabled',
  'qitab_prayer_lock_delay',

  // Quran reading
  'qitab_bookmarks',
  'qitab_bookmarks_ayah',
  'qitab_notes',
  'qitab_quran_streak',
  'qitab_quran_reminder_settings',
  'quran_journey',
  'khatm_plan',
  'ayah_interests',

  // Worship and tracking
  'good_deeds',
  'reflection_journal',
  'personal_duas',
  'ramadan_state',
  'salawat_total',
  'qitab_fav_duas',
  'qitab_tasbih_history',
  'qitab_tasbih_session',
  'qitab_zakat_history',
  'qitab_prayer_toggles',

  // Reminders
  'qitab_reminders',
  'qitab_notifications_enabled',
  'qitab_prayer_notifications',
  'qitab_reminder_sound_enabled',
  'qitab_reminder_sound_id',

  // Learning, library and assistant
  'qitab_library_seeded',
  'qitab_library_samples',
  'qitab_ai_chat_history_v1',
  'qitab_search_recent',
]);

const BACKUP_KEY_SET = new Set(BACKUP_KEYS);

/**
 * JSON with object keys in a fixed order.
 *
 * `JSON.stringify` preserves insertion order, so two objects with the same
 * data could otherwise produce different strings — and therefore different
 * checksums — depending on how they were built.
 */
export function canonicalJson(value) {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  const entries = Object.keys(value)
    .sort()
    .map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
  return `{${entries.join(',')}}`;
}

/** Keep only whitelisted, string-valued keys, sorted for stable output. */
export function normalisePayload(values) {
  const payload = {};
  for (const key of BACKUP_KEYS) {
    const value = values?.[key];
    if (typeof value === 'string') payload[key] = value;
  }
  return payload;
}

/** The exact string that is hashed: the payload, canonically encoded. */
export function checksumInput(payload) {
  return canonicalJson(normalisePayload(payload));
}

export function createEnvelope({ payload, checksum, createdAt, appVersion, platform }) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt,
    appVersion: appVersion || 'unknown',
    platform: platform || 'unknown',
    keyCount: Object.keys(payload || {}).length,
    checksum: String(checksum || ''),
    payload: payload || {},
  };
}

/**
 * Structural validation only. The checksum is verified separately because
 * hashing is async and this module must stay pure.
 *
 * @returns {{ok: true, envelope: object} | {ok: false, error: string}}
 */
export function parseEnvelope(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: 'The backup file is empty.' };
  }
  if (text.length > MAX_BACKUP_BYTES) {
    return { ok: false, error: 'That file is too large to be a Qitab-e-Noor backup.' };
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'That file is not a Qitab-e-Noor backup.' };
  }
  if (data.format !== BACKUP_FORMAT) {
    return { ok: false, error: 'That file was not created by Qitab-e-Noor.' };
  }
  if (!Number.isInteger(data.version) || data.version < 1) {
    return { ok: false, error: 'The backup has no valid format version.' };
  }
  if (data.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: 'This backup was made by a newer version of the app. Update first.',
    };
  }
  if (!data.payload || typeof data.payload !== 'object' || Array.isArray(data.payload)) {
    return { ok: false, error: 'The backup has no data section.' };
  }
  if (typeof data.checksum !== 'string' || !data.checksum.trim()) {
    return { ok: false, error: 'The backup has no integrity checksum.' };
  }

  for (const [key, value] of Object.entries(data.payload)) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      return { ok: false, error: 'The backup contains an invalid entry.' };
    }
  }

  return { ok: true, envelope: data };
}

/** Compare a stored checksum with one computed now. Accepts an optional `sha256:` prefix. */
export function checksumMatches(envelope, digest) {
  const stored = String(envelope?.checksum || '').trim().toLowerCase();
  const actual = String(digest || '').trim().toLowerCase();
  if (!stored || !actual) return false;
  return stored.replace(/^sha256[:=]/, '') === actual.replace(/^sha256[:=]/, '');
}

/** Shape the payload values for writing; unknown keys are skipped, never written. */
export function restorableEntries(payload) {
  const accepted = [];
  let skipped = 0;
  for (const [key, value] of Object.entries(payload || {})) {
    if (BACKUP_KEY_SET.has(key) && typeof value === 'string') accepted.push([key, value]);
    else skipped += 1;
  }
  return { accepted, skipped };
}

/** Human summary for the confirmation step. */
export function describeEnvelope(envelope) {
  const { accepted, skipped } = restorableEntries(envelope?.payload);
  return {
    createdAt: envelope?.createdAt || null,
    appVersion: envelope?.appVersion || 'unknown',
    platform: envelope?.platform || 'unknown',
    keyCount: Object.keys(envelope?.payload || {}).length,
    restorable: accepted.length,
    skipped,
    keys: accepted.map(([key]) => key),
  };
}

/** `qitab-e-noor-backup-2026-10-24-1830.json` in local time. */
export function backupFilename(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return [
    'qitab-e-noor-backup',
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}${pad(date.getMinutes())}`,
  ].join('-') + '.json';
}
