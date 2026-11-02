// Backup and restore I/O.
//
// A backup is a plain JSON file the user owns: no server round-trip, no
// account required, works while offline. The format and whitelist live in
// `backupFormat.js`; this file only moves bytes and verifies the checksum.
//
// Native: write to the cache directory and hand the file to the system share
// sheet, so it can go to Drive, email or the Files app. Restore uses the
// document picker. Web: an anchor download and a hidden file input.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { preferences } from './preferences';
import {
  BACKUP_KEYS, MAX_BACKUP_BYTES,
  checksumInput, checksumMatches, createEnvelope, describeEnvelope,
  normalisePayload, parseEnvelope, restorableEntries, backupFilename,
} from './backupFormat';

export { BACKUP_KEYS, backupFilename } from './backupFormat';

export const LAST_BACKUP_KEY = 'qitab_last_backup_at';
const IS_WEB = Platform.OS === 'web';

const sha256 = text =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);

async function buildBackupText() {
  const pairs = await AsyncStorage.multiGet(BACKUP_KEYS);
  const stored = Object.fromEntries(pairs);
  const payload = normalisePayload(stored);

  if (Object.keys(payload).length === 0) {
    throw new Error('There is no saved data to back up yet. Use the app first, then try again.');
  }

  const checksum = await sha256(checksumInput(payload));
  const envelope = createEnvelope({
    payload,
    checksum: `sha256:${checksum}`,
    createdAt: new Date().toISOString(),
    appVersion: Constants?.expoConfig?.version,
    platform: Platform.OS,
  });

  return { text: JSON.stringify(envelope, null, 2), keyCount: envelope.keyCount };
}

function downloadOnWeb(text, filename) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Create a backup and hand it to the platform's save/share UI.
 * @returns {Promise<{keyCount: number, filename: string, shared: boolean}>}
 */
export async function exportBackup() {
  const { text, keyCount } = await buildBackupText();
  const filename = backupFilename();
  const method = IS_WEB ? 'download' : 'share';

  if (IS_WEB) {
    downloadOnWeb(text, filename);
  } else {
    const uri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(uri, text);

    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Sharing is unavailable on this device, so the backup could not be saved.');
    }
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save your Qitab-e-Noor backup',
      UTI: 'public.json',
    });
  }

  const at = new Date().toISOString();
  await AsyncStorage.setItem(LAST_BACKUP_KEY, at).catch(() => {});
  return { keyCount, filename, method, createdAt: at };
}

function pickOnWeb() {
  return new Promise(resolve => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      if (file.size > MAX_BACKUP_BYTES) {
        finish({ error: 'That file is too large to be a Qitab-e-Noor backup.' });
        return;
      }
      try {
        finish({ text: await file.text(), name: file.name });
      } catch {
        finish({ error: 'The browser could not read that file.' });
      }
    };

    input.oncancel = () => finish(null);

    // `cancel` is not emitted by every browser. When the file dialog closes,
    // focus returns to the window; if nothing was selected, treat it as a
    // cancellation instead of leaving the promise pending forever.
    window.addEventListener('focus', () => {
      setTimeout(() => {
        if (!input.files?.length) finish(null);
      }, 600);
    }, { once: true });

    input.click();
  });
}

async function pickOnNative() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (!result || result.canceled) return null;

  const asset = result.assets?.[0] || result;
  if (!asset?.uri) return null;

  if (asset.size && asset.size > MAX_BACKUP_BYTES) {
    return { error: 'That file is too large to be a Qitab-e-Noor backup.' };
  }

  let text;
  try {
    text = await FileSystem.readAsStringAsync(asset.uri);
  } catch {
    return { error: 'The selected file could not be read.' };
  } finally {
    // The picker copied the file into this app's cache; it is no longer
    // needed once the text is in memory.
    const cacheDir = FileSystem.cacheDirectory;
    if (cacheDir && asset.uri.startsWith(cacheDir)) {
      FileSystem.deleteAsync(asset.uri, { idempotent: true }).catch(() => {});
    }
  }

  if (typeof text !== 'string' || text.length > MAX_BACKUP_BYTES) {
    return { error: 'That file is too large to be a Qitab-e-Noor backup.' };
  }

  return { text, name: asset.name || 'backup.json' };
}

/**
 * Ask the user for a backup file and validate it, without writing anything.
 * @returns {Promise<null | {error: string} | {summary: object, text: string, name: string}>}
 */
export async function inspectBackupFile() {
  const picked = IS_WEB ? await pickOnWeb() : await pickOnNative();
  if (!picked) return null;
  if (picked.error) return { error: picked.error };

  const parsed = parseEnvelope(picked.text);
  if (!parsed.ok) return { error: parsed.error };

  const digest = await sha256(checksumInput(parsed.envelope.payload));
  if (!checksumMatches(parsed.envelope, digest)) {
    return {
      error:
        'This backup is damaged or was edited after it was made: the checksum does not match. Nothing was restored.',
    };
  }

  return {
    text: picked.text,
    name: picked.name,
    summary: describeEnvelope(parsed.envelope),
  };
}

/**
 * Write a previously inspected backup into local storage.
 *
 * Merge semantics: keys in the backup overwrite their local counterparts,
 * everything else is left alone. A restore can therefore never delete data
 * the backup did not know about.
 *
 * @returns {Promise<{restored: number, skipped: number, createdAt: string|null}>}
 */
export async function restoreBackupText(text) {
  const parsed = parseEnvelope(text);
  if (!parsed.ok) throw new Error(parsed.error);

  const digest = await sha256(checksumInput(parsed.envelope.payload));
  if (!checksumMatches(parsed.envelope, digest)) {
    throw new Error('This backup is damaged or was edited after it was made.');
  }

  const { accepted, skipped } = restorableEntries(parsed.envelope.payload);
  if (accepted.length === 0) {
    throw new Error('This backup contains no restorable Qitab-e-Noor data.');
  }

  await AsyncStorage.multiSet(accepted);
  // Preference readers hold an in-memory cache; without this the screen
  // would keep showing the pre-restore values until the app restarts.
  await preferences.reload();

  return {
    restored: accepted.length,
    skipped,
    createdAt: parsed.envelope.createdAt || null,
  };
}

export async function loadLastBackupAt() {
  try {
    return await AsyncStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}

/** Human file size for the Settings summary. */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
