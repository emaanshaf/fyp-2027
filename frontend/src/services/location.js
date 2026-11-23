// One place that answers "where is the user?" for prayer times, weather and
// the Qibla.
//
// Before this, every screen guessed: Prayer Times defaulted to Islamabad,
// weather geocoded that default, and the Qibla distance was measured from it —
// which is why a user in another city saw Mecca about 3,000 km away and a
// temperature that never matched their own sky. A GPS fix now wins; the saved
// city stays as the honest fallback when GPS is denied or unavailable.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export const LOCATION_KEYS = {
  CITY: 'qitab_prayer_city',
  COUNTRY: 'qitab_prayer_country',
  LATITUDE: 'qitab_prayer_lat',
  LONGITUDE: 'qitab_prayer_lng',
  SAVED_AT: 'qitab_prayer_location_at',
};

const GEOCODE_TIMEOUT_MS = 8000;
const listeners = new Set();

export function isValidCoordinate(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/** Coordinates last saved from a device fix, or nulls when there are none. */
export async function getSavedCoordinates() {
  try {
    const [latRaw, lngRaw] = await Promise.all([
      AsyncStorage.getItem(LOCATION_KEYS.LATITUDE),
      AsyncStorage.getItem(LOCATION_KEYS.LONGITUDE),
    ]);
    const latitude = latRaw === null || latRaw === '' ? NaN : Number(latRaw);
    const longitude = lngRaw === null || lngRaw === '' ? NaN : Number(lngRaw);
    if (!isValidCoordinate(latitude, longitude)) {
      return { latitude: null, longitude: null };
    }
    return { latitude, longitude };
  } catch {
    return { latitude: null, longitude: null };
  }
}

export async function getSavedLocation() {
  try {
    const [[city, country], coords] = await Promise.all([
      Promise.all([
        AsyncStorage.getItem(LOCATION_KEYS.CITY),
        AsyncStorage.getItem(LOCATION_KEYS.COUNTRY),
      ]),
      getSavedCoordinates(),
    ]);
    return { city: city || null, country: country || null, ...coords };
  } catch {
    return { city: null, country: null, latitude: null, longitude: null };
  }
}

/** Forget the GPS fix (used when the user types a different city instead). */
export async function clearSavedCoordinates() {
  try {
    await AsyncStorage.multiRemove([
      LOCATION_KEYS.LATITUDE,
      LOCATION_KEYS.LONGITUDE,
      LOCATION_KEYS.SAVED_AT,
    ]);
    broadcastLocationChange();
  } catch {
    // Storage failure leaves the old fix; the next typed city still shows.
  }
}

/**
 * Notifies weather (and anything else interested) that the user's position or
 * city changed, so the Home hero does not sit on the old reading.
 */
export function subscribeLocationChanges(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function broadcastLocationChange() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch {
      // A listener failing must not break the save.
    }
  });
}

async function fetchJson(url) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS) : null;
  try {
    const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
    if (!response?.ok) throw new Error(`Reverse geocode failed (${response?.status ?? 'no response'})`);
    return await response.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Best-effort name for a coordinate. expo-location's own reverse geocoder is
 * native-only; on web (and when it returns nothing) Open-Meteo's free
 * BigDataCloud lookup names the city. Failure returns null, not an error —
 * coordinates alone are still enough for times, weather and Qibla.
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places?.[0];
    const city = place?.city || place?.subregion || place?.district || place?.region;
    if (city) {
      return { city, country: place?.country || null };
    }
  } catch {
    // Not supported on web, or offline.
  }

  try {
    const data = await fetchJson(
      'https://api.bigdatacloud.net/data/reverse-geocode-client'
      + `?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    const city = data?.city || data?.locality || data?.principalSubdivision;
    if (city) return { city, country: data?.countryName || null };
  } catch {
    // Offline — caller keeps the previous city label.
  }

  return null;
}

/**
 * Stores a position. Names are only overwritten when a lookup succeeded, so an
 * offline fix keeps showing the city the user already knows.
 */
export async function saveLocation({ latitude, longitude, city, country } = {}) {
  if (!isValidCoordinate(latitude, longitude)) return false;

  const pairs = [
    [LOCATION_KEYS.LATITUDE, String(latitude)],
    [LOCATION_KEYS.LONGITUDE, String(longitude)],
    [LOCATION_KEYS.SAVED_AT, new Date().toISOString()],
  ];
  if (city) pairs.push([LOCATION_KEYS.CITY, city]);
  if (country) pairs.push([LOCATION_KEYS.COUNTRY, country]);

  try {
    await AsyncStorage.multiSet(pairs);
  } catch {
    return false;
  }

  broadcastLocationChange();
  return true;
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

/**
 * Asks for permission (when needed), reads a GPS fix and saves it with its
 * city name. Throws with a message that is safe to show the user.
 */
export async function detectLocation({ timeoutMs = 15000 } = {}) {
  let permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) {
    permission = await Location.requestForegroundPermissionsAsync();
  }
  if (!permission.granted) {
    throw new Error('Location permission is needed to work out your prayer times and Qibla.');
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error('Location services are turned off. Turn on GPS and try again.');
  }

  let position = null;
  try {
    position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      timeoutMs,
      'GPS could not find you in time. Try again near a window or outdoors.'
    );
  } catch {
    position = await Location.getLastKnownPositionAsync({ maxAge: 120000, requiredAccuracy: 2000 });
  }

  const latitude = position?.coords?.latitude;
  const longitude = position?.coords?.longitude;
  if (!isValidCoordinate(latitude, longitude)) {
    throw new Error('GPS could not determine your location. Try again near a window or outdoors.');
  }

  const name = await reverseGeocode(latitude, longitude);
  await saveLocation({
    latitude,
    longitude,
    city: name?.city,
    country: name?.country,
  });

  return {
    latitude,
    longitude,
    city: name?.city || null,
    country: name?.country || null,
  };
}

export default {
  detectLocation,
  getSavedLocation,
  getSavedCoordinates,
  saveLocation,
  reverseGeocode,
  clearSavedCoordinates,
  subscribeLocationChanges,
  isValidCoordinate,
};
