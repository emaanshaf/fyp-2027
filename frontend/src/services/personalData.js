// Per-account isolation of the personal data on this device.
//
// All screens read and write plain `qitab_*` keys, which is what makes the app
// work offline. The flip side is that the keys outlive a sign-out: the next
// account created on the same phone inherited the previous user's bookmarks,
// prayer log, saved city and name. Signing out used to only drop the token.
//
// The rule here is one identity owns the plain keys at a time. Switching to a
// different account moves the current keys into `qitab_account_<id>_<key>`
// (the same namespace sync.js uses), restores that account's own stash if this
// device has seen it before, and leaves a brand-new account with defaults.
// The cloud copy is then pulled by the login screen as before.

import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACTIVE_ACCOUNT_KEY = 'qitab_active_account_id';

// Also used by sync.js for its per-uid copies, so the two stay consistent.
const ACCOUNT_PREFIX = 'qitab_account_';

// Session plumbing, device onboarding and downloaded public content: never
// stashed or wiped here.
const SHARED_KEYS = new Set([
  ACTIVE_ACCOUNT_KEY,
  'qitab_auth_token',
  'qitab_landing_seen',
  'qitab_api_catalog_cache',
]);
const SHARED_PREFIXES = [ACCOUNT_PREFIX, 'qitab_cache_', 'qitab_offline_quran', 'qitab_library_'];

const PERSONAL_PATTERN = /^(qitab_|prayer_log_|salawat_|bookmark|journal_|hifz_)/;

export function isPersonalKey(key) {
  if (SHARED_KEYS.has(key)) return false;
  if (SHARED_PREFIXES.some(prefix => key.startsWith(prefix))) return false;
  return PERSONAL_PATTERN.test(key);
}

async function getKeysBy(predicate) {
  const keys = await AsyncStorage.getAllKeys();
  return keys.filter(predicate);
}

/** Removes every personal key from the signed-out view of the device. */
export async function clearPersonalData() {
  const mine = await getKeysBy(isPersonalKey);
  if (mine.length) await AsyncStorage.multiRemove(mine);
  return mine;
}

async function stash(accountId) {
  const mine = await getKeysBy(isPersonalKey);
  if (!mine.length) return;

  const pairs = await AsyncStorage.multiGet(mine);
  const stashPrefix = `${ACCOUNT_PREFIX}${accountId}_`;

  await AsyncStorage.multiSet(
    pairs.map(([key, value]) => [`${stashPrefix}${key}`, value ?? ''])
  );
  await AsyncStorage.multiRemove(mine);
}

async function restore(accountId) {
  const prefix = `${ACCOUNT_PREFIX}${accountId}_`;
  const mine = await getKeysBy(key => key.startsWith(prefix));
  if (!mine.length) return false;

  const pairs = await AsyncStorage.multiGet(mine);
  await AsyncStorage.multiSet(
    pairs.map(([key, value]) => [key.slice(prefix.length), value ?? ''])
  );
  return true;
}

/**
 * Makes `accountId` the owner of the device's plain keys.
 *
 * Called after a successful sign-in. Returns `false` when the same account was
 * already active (nothing moved), so callers can skip unnecessary refreshing.
 */
export async function activateAccount(accountId) {
  const next = accountId ? String(accountId) : null;
  if (!next) return false;

  const previous = await AsyncStorage.getItem(ACTIVE_ACCOUNT_KEY);
  if (previous === next) return false;

  if (previous) {
    await stash(previous);
  } else {
    // Guest data belongs to no account. Starting an account starts clean,
    // which is what a person signing up expects to see.
    await clearPersonalData();
  }

  await restore(next);
  await AsyncStorage.setItem(ACTIVE_ACCOUNT_KEY, next);
  return true;
}

/**
 * Sign-out: puts the account's data aside for its next sign-in and leaves the
 * device at guest defaults. Cloud-synced categories were already mirrored on
 * every write, so nothing is lost.
 */
export async function deactivateAccount() {
  const previous = await AsyncStorage.getItem(ACTIVE_ACCOUNT_KEY);
  // A guest session was never tied to an account, so there is nothing to put
  // aside — and deleting the keys would silently wipe reminders the person
  // saved without ever signing in.
  if (!previous) return false;

  await stash(previous);
  await AsyncStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  return true;
}

export async function getActiveAccount() {
  return AsyncStorage.getItem(ACTIVE_ACCOUNT_KEY);
}

export default {
  activateAccount,
  deactivateAccount,
  getActiveAccount,
  clearPersonalData,
  isPersonalKey,
  ACTIVE_ACCOUNT_KEY,
};
