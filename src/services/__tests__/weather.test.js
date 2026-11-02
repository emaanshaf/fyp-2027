import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WEATHER_CACHE_KEY,
  WEATHER_TTL_MS,
  describeWeatherCode,
  getHomeWeather,
  normalizeWeather,
} from '../weather';

const ok = body => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

const forecastBody = (overrides = {}) => ({
  current: {
    temperature_2m: 23.6,
    apparent_temperature: 25.1,
    relative_humidity_2m: 47,
    is_day: 1,
    weather_code: 2,
    wind_speed_10m: 11.4,
    ...overrides.current,
  },
  daily: {
    temperature_2m_max: [29.7],
    temperature_2m_min: [16.2],
    ...overrides.daily,
  },
});

const fetchImpl = (weather = forecastBody()) => jest.fn(url => {
  if (url.includes('geocoding-api')) {
    return Promise.resolve(ok({ results: [{ latitude: 33.69, longitude: 73.06 }] }));
  }
  return Promise.resolve(ok(weather));
});

const saveCity = async (city = 'Islamabad', country = 'Pakistan') => {
  await AsyncStorage.setItem('qitab_prayer_city', city);
  await AsyncStorage.setItem('qitab_prayer_country', country);
};

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('describeWeatherCode', () => {
  it('labels clear skies and picks the moon at night', () => {
    expect(describeWeatherCode(0, true)).toEqual({ label: 'Clear sky', icon: 'sunny' });
    expect(describeWeatherCode(0, false)).toEqual({ label: 'Clear sky', icon: 'moon' });
  });

  it('maps cloud, rain, snow and storm codes', () => {
    expect(describeWeatherCode(2, true).label).toBe('Partly cloudy');
    expect(describeWeatherCode(63, true)).toEqual({ label: 'Rain', icon: 'rainy' });
    expect(describeWeatherCode(75, true).icon).toBe('snow');
    expect(describeWeatherCode(99, true).label).toBe('Thunderstorm with hail');
  });

  it('does not invent a condition for an unknown code', () => {
    expect(describeWeatherCode(1234, true)).toEqual({
      label: 'Unknown conditions',
      icon: 'cloud-outline',
    });
  });
});

describe('normalizeWeather', () => {
  it('rounds values and keeps the day high/low', () => {
    const weather = normalizeWeather(forecastBody(), {
      city: 'Islamabad',
      country: 'Pakistan',
      fetchedAt: 1000,
    });
    expect(weather).toMatchObject({
      city: 'Islamabad',
      country: 'Pakistan',
      temperatureC: 24,
      apparentC: 25,
      humidity: 47,
      windKph: 11,
      code: 2,
      condition: 'Partly cloudy',
      icon: 'partly-sunny',
      isDay: true,
      highC: 30,
      lowC: 16,
      fetchedAt: 1000,
    });
  });

  it('rejects a response with no current temperature', () => {
    expect(normalizeWeather({}, { city: 'Islamabad', fetchedAt: 1 })).toBeNull();
  });
});

describe('getHomeWeather', () => {
  it('returns nothing until a location is known', async () => {
    const fetchSpy = fetchImpl();
    expect(await getHomeWeather({ fetchImpl: fetchSpy })).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses the default city when only its cached prayer timings exist', async () => {
    // The hero already names Islamabad from this cache, so the weather must
    // match it rather than vanishing because no city key was ever written.
    await AsyncStorage.setItem(
      'qitab_timings_Islamabad_Pakistan',
      JSON.stringify({ Fajr: '04:56', Dhuhr: '11:52', Asr: '15:46', Maghrib: '17:24', Isha: '18:47' }),
    );
    const weather = await getHomeWeather({ fetchImpl: fetchImpl() });

    expect(weather).toMatchObject({ city: 'Islamabad', country: 'Pakistan', temperatureC: 24 });
  });

  it('geocodes the saved city, then reports current conditions', async () => {
    await saveCity();
    const fetchSpy = fetchImpl();

    const weather = await getHomeWeather({ now: new Date('2026-10-29T10:00:00'), fetchImpl: fetchSpy });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][0]).toContain('name=Islamabad');
    expect(weather).toMatchObject({
      city: 'Islamabad',
      temperatureC: 24,
      condition: 'Partly cloudy',
      highC: 30,
      lowC: 16,
      stale: false,
    });
    const cached = JSON.parse(await AsyncStorage.getItem(WEATHER_CACHE_KEY));
    expect(cached.key).toBe('Islamabad|Pakistan');
  });

  it('serves a fresh cache without another request', async () => {
    await saveCity();
    const fetchSpy = fetchImpl();
    const now = new Date('2026-10-29T10:00:00');

    await getHomeWeather({ now, fetchImpl: fetchSpy });
    const second = await getHomeWeather({
      now: new Date(now.getTime() + WEATHER_TTL_MS - 60000),
      fetchImpl: fetchSpy,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(second.temperatureC).toBe(24);
    expect(second.stale).toBe(false);
  });

  it('refetches once the cache is older than thirty minutes', async () => {
    await saveCity();
    const now = new Date('2026-10-29T10:00:00');
    await getHomeWeather({ now, fetchImpl: fetchImpl() });

    const fetchSpy = fetchImpl(forecastBody({ current: { temperature_2m: 18.2 } }));
    const later = await getHomeWeather({
      now: new Date(now.getTime() + WEATHER_TTL_MS + 60000),
      fetchImpl: fetchSpy,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(later.temperatureC).toBe(18);
  });

  it('falls back to the last reading when the network is gone', async () => {
    await saveCity();
    const now = new Date('2026-10-29T10:00:00');
    await getHomeWeather({ now, fetchImpl: fetchImpl() });

    const offline = jest.fn(() => Promise.reject(new Error('offline')));
    const stale = await getHomeWeather({
      now: new Date(now.getTime() + WEATHER_TTL_MS + 60000),
      fetchImpl: offline,
    });

    expect(stale).toMatchObject({ temperatureC: 24, stale: true });
  });

  it('honours an explicit refresh even inside the cache window', async () => {
    await saveCity();
    const now = new Date('2026-10-29T10:00:00');
    await getHomeWeather({ now, fetchImpl: fetchImpl() });

    const fetchSpy = fetchImpl(forecastBody({ current: { weather_code: 61 } }));
    const refreshed = await getHomeWeather({ now, fetchImpl: fetchSpy, force: true });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(refreshed.condition).toBe('Rain');
  });

  it('returns nothing on a first-run network failure', async () => {
    await saveCity();
    const offline = jest.fn(() => Promise.reject(new Error('offline')));
    expect(await getHomeWeather({ fetchImpl: offline })).toBeNull();
  });

  it('ignores a city the geocoder cannot find', async () => {
    await saveCity('Nowhere', 'Neverland');
    const fetchSpy = jest.fn(() => Promise.resolve(ok({ results: [] })));
    expect(await getHomeWeather({ fetchImpl: fetchSpy })).toBeNull();
  });

  it('does not reuse a cache saved for another city', async () => {
    await saveCity('Karachi', 'Pakistan');
    const now = new Date('2026-10-29T10:00:00');
    const first = fetchImpl();
    await getHomeWeather({ now, fetchImpl: first });

    await saveCity('Lahore', 'Pakistan');
    const fetchSpy = fetchImpl(forecastBody({ current: { temperature_2m: 19.0 } }));
    const second = await getHomeWeather({ now, fetchImpl: fetchSpy });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(second).toMatchObject({ city: 'Lahore', temperatureC: 19 });
  });
});
