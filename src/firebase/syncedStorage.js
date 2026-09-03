// Drop-in AsyncStorage.getItem/setItem replacement that also mirrors
// writes to Firestore when a real (non-guest) Firebase user is signed in.
// AsyncStorage is always the source of truth for fast, offline-first reads;
// Firestore sync is best-effort and never blocks or breaks the local write.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';

export async function getItem(key) {
  return AsyncStorage.getItem(key);
}

export async function setItem(key, value) {
  await AsyncStorage.setItem(key, value);
  const uid = auth?.currentUser?.uid;
  if (!isFirebaseConfigured() || !uid) return;
  try {
    await setDoc(doc(db, 'users', uid), { [key]: value }, { merge: true });
  } catch {
    // Offline or blocked by rules — local write already succeeded, ignore.
  }
}

// Pulls the signed-in user's synced doc and fills in any keys missing
// locally (e.g. first login on a new device). Call once after sign-in.
export async function pullSyncedData(uid, keys) {
  if (!isFirebaseConfigured() || !uid) return;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return;
    const remote = snap.data();
    for (const key of keys) {
      if (remote[key] === undefined) continue;
      const local = await AsyncStorage.getItem(key);
      if (local === null) {
        await AsyncStorage.setItem(key, remote[key]);
      }
    }
  } catch {
    // Offline — local data (if any) is used as-is.
  }
}

export const SYNCED_KEYS = [
  'qitab_bookmarks',
  'qitab_notes',
  'qitab_fav_duas',
  'qitab_prayer_toggles',
  'qitab_reminders',
  'qitab_tasbih_history',
];
