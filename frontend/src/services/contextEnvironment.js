// What the sky and the landscape look like around the user, for the Duas card.
//
// Coordinates are the only thing sent to the services below; no account, name
// or device id leaves the phone. Open-Meteo supplies the current weather, the
// 92-day rain history (its maximum) and the elevation; OpenStreetMap's Overpass
// API names nearby rivers, lakes, peaks, woods and coastline. Both are keyless
// and CORS-enabled. Every function resolves to `null` when the network or the
// service fails, so the Duas screen can keep working from the clock and chips.
//
// The 92-day history is the honest reason "no rain for months" is capped at
// "92+ days": that is as far back as the free endpoint goes.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { describeWeatherCode } from './weather';
import { isValidCoordinate } from './location';

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const TIMEOUT_MS = 9000;
const OVERPASS_TIMEOUT_MS = 12000;

/** A day counts as rainy above this much precipitation, in millimetres. */
const RAIN_MM = 0.2;
/** Above this elevation the surroundings read as high ground. */
const HIGHLAND_M = 1200;

export const NATURE_CACHE_PREFIX = 'qitab_nature_cache_';
export const NATURE_TTL_MS = 12 * 60 * 60 * 1000;
export const RAIN_LOOKBACK_DAYS = 92;

async function fetchJson(url, { fetchImpl, init, timeoutMs = TIMEOUT_MS } = {}) {
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!doFetch) return null;

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await doFetch(url, controller ? { ...init, signal: controller.signal } : init);
    if (!response || !response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Days since the last rainy day in an Open-Meteo `daily` block.
 *
 * `past_days=92&forecast_days=1` puts today last, so the scan runs backwards
 * from today. `null` means the response had no usable daily data; `trackedDays`
 * means "no rain at all in this window".
 */
export function summarizeRainHistory(daily) {
  const sums = Array.isArray(daily?.precipitation_sum) ? daily.precipitation_sum : [];
  const usable = sums.filter(value => Number.isFinite(Number(value)));
  if (!usable.length) return { daysSinceRain: null, totalMm: null, trackedDays: 0 };

  const totalMm = usable.reduce((acc, value) => acc + Number(value), 0);
  let daysSinceRain = usable.length;
  for (let i = usable.length - 1; i >= 0; i--) {
    if (Number(usable[i]) >= RAIN_MM) {
      daysSinceRain = usable.length - 1 - i;
      break;
    }
  }
  return {
    daysSinceRain,
    totalMm: Math.round(totalMm * 10) / 10,
    trackedDays: usable.length,
  };
}

export function normalizePointWeather(payload, { now = Date.now() } = {}) {
  const current = payload?.current;
  const temperature = Number(current?.temperature_2m);
  if (!current || !Number.isFinite(temperature)) return null;

  const code = Number(current.weather_code);
  const isDay = current.is_day !== 0;
  const { label, icon } = describeWeatherCode(current.weather_code, isDay);
  const rain = summarizeRainHistory(payload.daily);

  const maybeRound = value => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.round(numeric) : null;
  };

  return {
    code: Number.isFinite(code) ? code : null,
    label,
    icon,
    temperatureC: Math.round(temperature),
    apparentC: maybeRound(current.apparent_temperature),
    humidity: maybeRound(current.relative_humidity_2m),
    windKph: maybeRound(current.wind_speed_10m),
    precipitationMm: Number(current.precipitation) || 0,
    isDay,
    daysSinceRain: rain.daysSinceRain,
    rainTotalMm: rain.totalMm,
    rainTrackedDays: rain.trackedDays,
    fetchedAt: now,
  };
}

/** Current conditions plus the rain history at a point, or null offline. */
export async function getWeatherAtPoint({ latitude, longitude, fetchImpl, now = Date.now() } = {}) {
  if (!isValidCoordinate(latitude, longitude)) return null;

  const params = [
    `latitude=${latitude}`,
    `longitude=${longitude}`,
    'current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day',
    'daily=precipitation_sum',
    `past_days=${RAIN_LOOKBACK_DAYS}`,
    'forecast_days=1',
    'timezone=auto',
  ];

  const payload = await fetchJson(`${WEATHER_URL}?${params.join('&')}`, { fetchImpl });
  return payload ? normalizePointWeather(payload, { now }) : null;
}

async function getElevation({ latitude, longitude, fetchImpl }) {
  const payload = await fetchJson(
    `${ELEVATION_URL}?latitude=${latitude}&longitude=${longitude}`,
    { fetchImpl }
  );
  const value = Number(payload?.elevation?.[0]);
  return Number.isFinite(value) ? Math.round(value) : null;
}

const NATURE_RULES = [
  { kind: 'river', matches: el => /^(river|canal|stream)$/.test(el?.tags?.waterway || '') },
  { kind: 'lake', matches: el => el?.tags?.natural === 'water' },
  { kind: 'mountain', matches: el => el?.tags?.natural === 'peak' },
  { kind: 'forest', matches: el => el?.tags?.natural === 'wood' },
  { kind: 'desert', matches: el => el?.tags?.natural === 'sand' },
  { kind: 'sea', matches: el => el?.tags?.natural === 'coastline' },
];

/** Turn Overpass elements into kinds plus one English name per kind. */
export function parseNatureElements(elements) {
  const kinds = [];
  const names = {};
  if (!Array.isArray(elements)) return { kinds, names };

  for (const element of elements) {
    const tags = element?.tags;
    if (!tags) continue;
    const rule = NATURE_RULES.find(candidate => candidate.matches(element));
    if (!rule) continue;
    if (!kinds.includes(rule.kind)) kinds.push(rule.kind);
    const name = tags['name:en'] || tags.name;
    if (name && !names[rule.kind]) names[rule.kind] = name;
  }
  return { kinds, names };
}

export function buildNatureQuery(latitude, longitude) {
  const around = (metres, selector) => `${selector}(around:${metres},${latitude},${longitude})`;
  return [
    '[out:json][timeout:10];',
    '(',
    `${around(1500, 'way')}[waterway~"^(river|canal|stream)$"];`,
    `${around(2000, 'way')}[natural=water];`,
    `${around(4000, 'node')}[natural=peak];`,
    `${around(2500, 'way')}[natural=wood];`,
    `${around(3000, 'way')}[natural=sand];`,
    `${around(5000, 'way')}[natural=coastline];`,
    ');',
    'out tags 30;',
  ].join('\n');
}

function parseCache(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data || !Number.isFinite(parsed.savedAt)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Rivers, lakes, peaks, woods, desert edge or coastline within a few kilometres.
 *
 * Cached by a ~1 km grid for twelve hours, because Overpass is a shared
 * volunteer service and this is a two-minute curiosity, not a map. Returns
 * null when the point has no notable landscape and nothing could be fetched.
 */
export async function getNearbyNature({
  latitude,
  longitude,
  fetchImpl,
  now = Date.now(),
  storage = AsyncStorage,
} = {}) {
  if (!isValidCoordinate(latitude, longitude)) return null;

  const cacheKey = `${NATURE_CACHE_PREFIX}${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
  try {
    const cached = parseCache(await storage.getItem(cacheKey));
    if (cached && now - cached.savedAt < NATURE_TTL_MS) {
      return cached.data ? { ...cached.data, cached: true } : null;
    }
  } catch {
    // A storage failure only costs a repeat request.
  }

  const [payload, elevation] = await Promise.all([
    fetchJson(OVERPASS_URL, {
      fetchImpl,
      timeoutMs: OVERPASS_TIMEOUT_MS,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(buildNatureQuery(latitude, longitude))}`,
      },
    }),
    getElevation({ latitude, longitude, fetchImpl }),
  ]);

  if (!payload && elevation == null) return null;

  const parsed = parseNatureElements(payload?.elements);
  const data = { kinds: parsed.kinds, names: parsed.names, elevation };

  // A named peak is the best signal, but the terrain alone still says "high
  // ground" when no peak node is mapped nearby.
  if (!data.kinds.length && elevation != null && elevation >= HIGHLAND_M) {
    data.kinds.push('mountain');
    data.terrain = 'highland';
  }
  if (!data.kinds.length) data.kinds = [];

  try {
    await storage.setItem(cacheKey, JSON.stringify({ savedAt: now, data }));
  } catch {
    // Uncacheable results still reach the caller.
  }
  return data;
}

export default {
  getWeatherAtPoint,
  getNearbyNature,
  normalizePointWeather,
  parseNatureElements,
  summarizeRainHistory,
  buildNatureQuery,
};
