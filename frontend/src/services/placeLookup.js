/**
 * One-shot "where am I" lookup for the contextual duas card.
 *
 * It asks for foreground permission, reads a single position, and — on a real
 * device — asks the *operating system* to turn the coordinates into a short
 * address label. Qitab-e-Noor's own server never receives the coordinates; the
 * label is produced by Apple or Google on the handset, which is disclosed in
 * the privacy policy.
 *
 * The result is deliberately a plain object rather than a thrown error, so the
 * screen can show a calm message and fall back to manual chips.
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';

export const PLACE_LOOKUP_MESSAGES = {
  denied: 'Location permission is off. Choose a place below instead.',
  unsupported: 'This device cannot name places. Choose a place below instead.',
  error: 'Could not read your location. Choose a place below instead.',
};

/**
 * @param {{prompt?: boolean}} [options] - `prompt:false` only reads an
 *   already-granted permission, so opening the Duas screen never shows a
 *   system dialog unless the user actually taps "Use my location".
 * @returns {Promise<{outcome:'ok'|'denied'|'unsupported'|'error'|'skipped', address:object|null, latitude:number|null, longitude:number|null, accuracy:number|null, speedMps:number|null, message:string}>}
 */
export async function lookupCurrentPlace({ prompt = true } = {}) {
  const empty = {
    address: null,
    latitude: null,
    longitude: null,
    accuracy: null,
    speedMps: null,
  };

  let permission;
  try {
    permission = prompt
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();
  } catch {
    return { outcome: 'error', ...empty, message: PLACE_LOOKUP_MESSAGES.error };
  }

  if (permission?.status === 'undetermined' && !prompt) {
    return { outcome: 'skipped', ...empty, message: '' };
  }

  if (permission?.status !== 'granted') {
    return { outcome: 'denied', ...empty, message: PLACE_LOOKUP_MESSAGES.denied };
  }

  let position;
  try {
    position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  } catch {
    return { outcome: 'error', ...empty, message: PLACE_LOOKUP_MESSAGES.error };
  }

  const coords = position?.coords || {};
  const speed = typeof coords.speed === 'number' && coords.speed >= 0 ? coords.speed : null;
  const base = {
    latitude: coords.latitude ?? null,
    longitude: coords.longitude ?? null,
    accuracy: coords.accuracy ?? null,
    speedMps: speed,
  };

  // Web has no reverse geocoder in expo-location, and some Android devices
  // lack the geocoder service entirely. Either way we still have the fix.
  if (Platform.OS === 'web') {
    return { outcome: 'unsupported', ...base, address: null, message: PLACE_LOOKUP_MESSAGES.unsupported };
  }

  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: base.latitude,
      longitude: base.longitude,
    });
    const address = Array.isArray(results) && results.length ? results[0] : null;
    return { outcome: 'ok', ...base, address, message: '' };
  } catch {
    return { outcome: 'unsupported', ...base, address: null, message: PLACE_LOOKUP_MESSAGES.unsupported };
  }
}

/** Names a coordinate the device already has, without taking a new fix. */
export async function describeCoordinates(latitude, longitude) {
  if (Platform.OS === 'web') return null;
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    return Array.isArray(results) && results.length ? results[0] : null;
  } catch {
    return null;
  }
}

/**
 * Follows the device as it moves. Only started after the grant is already in
 * place, so no system dialog appears just because the screen opened. Returns
 * null when permission is missing or the platform refuses to watch.
 */
export async function watchDevicePosition(onFix) {
  let permission;
  try {
    permission = await Location.getForegroundPermissionsAsync();
  } catch {
    return null;
  }
  if (permission?.status !== 'granted') return null;

  try {
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 300,
        timeInterval: 60000,
      },
      position => {
        const coords = position?.coords || {};
        onFix?.({
          latitude: coords.latitude ?? null,
          longitude: coords.longitude ?? null,
          accuracy: coords.accuracy ?? null,
          speedMps: typeof coords.speed === 'number' && coords.speed >= 0 ? coords.speed : null,
        });
      }
    );
  } catch {
    return null;
  }
}

export default lookupCurrentPlace;
