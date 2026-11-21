// City geocoding for the Qibla fallback.
//
// The Qibla needs a position. GPS is the right source, but a phone that has
// refused location permission — or a desktop browser with no geolocation at
// all — used to leave the screen with nothing to show. The prayer screen
// already stores the city the user chose, so we can look that up and compute
// the bearing for it, labelled as approximate rather than pretending it is a
// device fix.
//
// Open-Meteo needs no key, and only the city name leaves the device.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { cached, fetchJson, TTL } from './cache';

export const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
export const SAVED_CITY_KEY = 'qitab_prayer_city';
export const SAVED_COUNTRY_KEY = 'qitab_prayer_country';

/**
 * The city saved by Prayer Times, if any. No default is invented here — with
 * no saved city the Qibla screen keeps saying it has no position rather than
 * quietly picking Islamabad.
 */
export async function getSavedPrayerCity() {
  try {
    const [city, country] = await Promise.all([
      AsyncStorage.getItem(SAVED_CITY_KEY),
      AsyncStorage.getItem(SAVED_COUNTRY_KEY),
    ]);
    if (!city) return null;
    return { city, country: country || '' };
  } catch {
    return null;
  }
}

/**
 * Resolve a city name to coordinates.
 *
 * @returns {Promise<{ latitude: number, longitude: number, name: string,
 *   admin1: string|null, country: string|null }>} rejects when the name is not
 *   found or the service is unreachable, so the caller can say which happened.
 */
export async function geocodeCity(city) {
  const name = String(city || '').trim();
  if (!name) throw new Error('No city name');

  return cached(
    `geocode:${name.toLowerCase()}`,
    async () => {
      const data = await fetchJson(
        `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
      );
      const place = data?.results?.[0];
      if (
        !place ||
        typeof place.latitude !== 'number' ||
        typeof place.longitude !== 'number'
      ) {
        throw new Error(`Could not find ${name}`);
      }
      return {
        latitude: place.latitude,
        longitude: place.longitude,
        name: place.name || name,
        admin1: place.admin1 || null,
        country: place.country || null,
      };
    },
    // Coordinates of a city do not change. A failure is not cached, so a
    // retry after reconnecting still reaches the network.
    { ttl: TTL.IMMUTABLE }
  );
}

export default geocodeCity;
