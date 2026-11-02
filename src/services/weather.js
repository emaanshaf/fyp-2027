/**
 * Current weather for the dashboard.
 *
 * Islam 360-style dashboards show the weather next to the prayer times, so the
 * Home hero does too. The data comes from Open-Meteo, which needs no API key:
 * the app geocodes the city the prayer screen already saved, then asks for the
 * current conditions. Nothing here requires an account, and only the city name
 * leaves the device — never the user's coordinates or identity.
 *
 * The result is cached for 30 minutes. If a refresh fails, yesterday's cached
 * reading is returned marked `stale` so the row can say "offline" rather than
 * disappearing or pretending to be current. With no cache and no network the
 * call returns null and the row is simply not rendered.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CITY, DEFAULT_COUNTRY } from '../utils/nextPrayer';

export const WEATHER_CACHE_KEY = 'qitab_weather_cache';
export const WEATHER_TTL_MS = 30 * 60 * 1000;

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 8000;

/**
 * WMO weather interpretation codes, as used by Open-Meteo.
 * https://open-meteo.com/en/docs#weathervariables
 */
const WMO = [
  { codes: [0], label: 'Clear sky', icon: 'sunny', nightIcon: 'moon' },
  { codes: [1], label: 'Mainly clear', icon: 'partly-sunny', nightIcon: 'cloudy-night' },
  { codes: [2], label: 'Partly cloudy', icon: 'partly-sunny', nightIcon: 'cloudy-night' },
  { codes: [3], label: 'Overcast', icon: 'cloudy' },
  { codes: [45, 48], label: 'Fog', icon: 'cloudy-outline' },
  { codes: [51, 53, 55], label: 'Drizzle', icon: 'rainy-outline' },
  { codes: [56, 57], label: 'Freezing drizzle', icon: 'rainy-outline' },
  { codes: [61, 63, 65], label: 'Rain', icon: 'rainy' },
  { codes: [66, 67], label: 'Freezing rain', icon: 'rainy' },
  { codes: [71, 73, 75], label: 'Snowfall', icon: 'snow' },
  { codes: [77], label: 'Snow grains', icon: 'snow' },
  { codes: [80, 81, 82], label: 'Rain showers', icon: 'rainy' },
  { codes: [85, 86], label: 'Snow showers', icon: 'snow' },
  { codes: [95], label: 'Thunderstorm', icon: 'thunderstorm' },
  { codes: [96, 99], label: 'Thunderstorm with hail', icon: 'thunderstorm' },
];

/** A WMO code → { label, icon }. Unknown codes stay honest rather than guess. */
export function describeWeatherCode(code, isDay = true) {
  const numeric = Number(code);
  const entry = WMO.find(group => group.codes.includes(numeric));
  if (!entry) return { label: 'Unknown conditions', icon: 'cloud-outline' };
  return {
    label: entry.label,
    icon: !isDay && entry.nightIcon ? entry.nightIcon : entry.icon,
  };
}

const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);
const round = value => (isFiniteNumber(value) ? Math.round(value) : null);

/** Normalise the Open-Meteo response into what the dashboard renders. */
export function normalizeWeather(payload, { city, country, fetchedAt }) {
  const current = payload?.current;
  if (!current || !isFiniteNumber(current.temperature_2m)) return null;

  const isDay = current.is_day !== 0;
  const { label, icon } = describeWeatherCode(current.weather_code, isDay);

  return {
    city,
    country: country || '',
    temperatureC: round(current.temperature_2m),
    apparentC: round(current.apparent_temperature),
    humidity: round(current.relative_humidity_2m),
    windKph: round(current.wind_speed_10m),
    code: isFiniteNumber(current.weather_code) ? current.weather_code : null,
    condition: label,
    icon,
    isDay,
    highC: round(payload?.daily?.temperature_2m_max?.[0]),
    lowC: round(payload?.daily?.temperature_2m_min?.[0]),
    fetchedAt,
  };
}

function buildGeocodeUrl(city) {
  return `${GEOCODE_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
}

function buildForecastUrl({ latitude, longitude }) {
  const params = [
    `latitude=${latitude}`,
    `longitude=${longitude}`,
    'current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    'daily=temperature_2m_max,temperature_2m_min',
    'timezone=auto',
    'forecast_days=1',
  ];
  return `${FORECAST_URL}?${params.join('&')}`;
}

/** fetch + JSON with a timeout, so a dead connection cannot hang the dashboard. */
async function fetchJson(fetchImpl, url) {
  if (typeof fetchImpl !== 'function') throw new Error('Network unavailable');

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;
  try {
    const response = await fetchImpl(url, controller ? { signal: controller.signal } : undefined);
    if (!response || !response.ok) {
      throw new Error(`Weather request failed (${response?.status ?? 'no response'})`);
    }
    return await response.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function parseCache(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.weather || !isFiniteNumber(parsed.savedAt)) return null;
    if (!isFiniteNumber(parsed.weather.temperatureC)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * The dashboard's weather reading.
 *
 * @param {object} [options]
 * @param {Date} [options.now] Clock injection for tests.
 * @param {Function} [options.fetchImpl] Fetch implementation for tests.
 * @param {boolean} [options.force] Skip a fresh cache (pull-to-refresh).
 * @returns {Promise<null | {
 *   city: string, country: string, temperatureC: number, apparentC: number|null,
 *   humidity: number|null, windKph: number|null, code: number|null,
 *   condition: string, icon: string, isDay: boolean,
 *   highC: number|null, lowC: number|null, fetchedAt: number, stale: boolean
 * }>} null when no location is known (no saved city and no cached timings),
 *   the network fails and nothing is cached, or the stored cache is unusable.
 */
export async function getHomeWeather({ now = new Date(), fetchImpl, force = false } = {}) {
  const [savedCity, savedCountry] = await Promise.all([
    AsyncStorage.getItem('qitab_prayer_city'),
    AsyncStorage.getItem('qitab_prayer_country'),
  ]);

  // No city yet means the hero is already asking for a location; inventing one
  // would show weather for somewhere the user is not. The exception is a device
  // that has cached prayer timings under the default city: the hero is already
  // naming that city, so its weather matches what the screen claims.
  let city = savedCity;
  let country = savedCountry;
  if (!city) {
    const cachedTimings = await AsyncStorage.getItem(
      `qitab_timings_${DEFAULT_CITY}_${DEFAULT_COUNTRY}`,
    );
    const cachedHanafi = await AsyncStorage.getItem(
      `qitab_timings_${DEFAULT_CITY}_${DEFAULT_COUNTRY}_hanafi`,
    );
    if (!cachedTimings && !cachedHanafi) return null;
    city = DEFAULT_CITY;
    country = savedCountry || DEFAULT_COUNTRY;
  }

  const cacheKey = `${city}|${country || ''}`;
  const cached = parseCache(await AsyncStorage.getItem(WEATHER_CACHE_KEY));
  const cachedForCity = cached && cached.key === cacheKey ? cached : null;

  if (!force && cachedForCity && now.getTime() - cachedForCity.savedAt < WEATHER_TTL_MS) {
    return { ...cachedForCity.weather, stale: false };
  }

  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);

  try {
    const geocode = await fetchJson(doFetch, buildGeocodeUrl(city));
    const place = geocode?.results?.[0];
    if (!place || !isFiniteNumber(place.latitude) || !isFiniteNumber(place.longitude)) {
      throw new Error(`Could not find ${city}`);
    }

    const forecast = await fetchJson(doFetch, buildForecastUrl(place));
    const weather = normalizeWeather(forecast, {
      city,
      country,
      fetchedAt: now.getTime(),
    });
    if (!weather) throw new Error('Weather response was incomplete');

    await AsyncStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify({ key: cacheKey, savedAt: now.getTime(), weather }),
    );
    return { ...weather, stale: false };
  } catch {
    // A failed refresh is not an error state for the dashboard: keep the last
    // known reading if there is one, clearly marked as not current.
    if (cachedForCity) return { ...cachedForCity.weather, stale: true };
    return null;
  }
}

export default getHomeWeather;
