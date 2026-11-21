import AsyncStorage from '@react-native-async-storage/async-storage';
import { geocodeCity, getSavedPrayerCity } from '../geocode';

const ok = body => ({ ok: true, json: async () => body });

beforeEach(() => {
  global.__resetStorage();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('getSavedPrayerCity', () => {
  it('returns nothing until the user has saved a city', async () => {
    // The fallback must not quietly invent a city for someone who never set
    // one; the Qibla screen keeps saying it has no position in that case.
    expect(await getSavedPrayerCity()).toBeNull();
  });

  it('reads the city Prayer Times stores', async () => {
    await AsyncStorage.setItem('qitab_prayer_city', 'Lahore');
    await AsyncStorage.setItem('qitab_prayer_country', 'Pakistan');
    expect(await getSavedPrayerCity()).toEqual({ city: 'Lahore', country: 'Pakistan' });
  });
});

describe('geocodeCity', () => {
  it('resolves a city to coordinates with its region', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      ok({
        results: [
          {
            latitude: 33.6844,
            longitude: 73.0479,
            name: 'Islamabad',
            admin1: 'Islamabad',
            country: 'Pakistan',
          },
        ],
      })
    );

    expect(await geocodeCity('Islamabad')).toEqual({
      latitude: 33.6844,
      longitude: 73.0479,
      name: 'Islamabad',
      admin1: 'Islamabad',
      country: 'Pakistan',
    });
    expect(global.fetch.mock.calls[0][0]).toContain('name=Islamabad');
  });

  it('caches the result so the Qibla screen can reopen offline', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      ok({ results: [{ latitude: 40.7128, longitude: -74.006, name: 'New York' }] })
    );

    await geocodeCity('New York');
    const again = await geocodeCity('new york');
    expect(again.latitude).toBe(40.7128);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown city instead of returning a default', async () => {
    global.fetch = jest.fn().mockResolvedValue(ok({ results: [] }));
    await expect(geocodeCity('Nowhereville')).rejects.toThrow(/Could not find/);
  });

  it('rejects when the service is unreachable', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
    await expect(geocodeCity('Cairo')).rejects.toThrow();
  });

  it('does not call the network for an empty name', async () => {
    global.fetch = jest.fn();
    await expect(geocodeCity('   ')).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
