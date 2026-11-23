import {
  NATURE_TTL_MS,
  buildNatureQuery,
  getNearbyNature,
  getWeatherAtPoint,
  parseNatureElements,
  summarizeRainHistory,
} from '../contextEnvironment';

const memoryStorage = () => {
  const store = new Map();
  return {
    getItem: async key => (store.has(key) ? store.get(key) : null),
    setItem: async (key, value) => { store.set(key, value); },
  };
};

describe('summarizeRainHistory', () => {
  it('counts back to the most recent rainy day', () => {
    const result = summarizeRainHistory({ precipitation_sum: [0, 0, 0, 4.2, 0, 0, 0] });
    expect(result.daysSinceRain).toBe(3);
    expect(result.trackedDays).toBe(7);
    expect(result.totalMm).toBeCloseTo(4.2);
  });

  it('reports the whole window when it never rained', () => {
    const result = summarizeRainHistory({ precipitation_sum: new Array(10).fill(0) });
    expect(result.daysSinceRain).toBe(10);
    expect(result.totalMm).toBe(0);
  });

  it('survives a missing daily block', () => {
    expect(summarizeRainHistory(null).daysSinceRain).toBeNull();
  });
});

describe('getWeatherAtPoint', () => {
  it('normalises current conditions and the rain history', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        current: {
          weather_code: 61,
          temperature_2m: 18.4,
          is_day: 1,
          precipitation: 0.4,
          wind_speed_10m: 12.6,
        },
        daily: { precipitation_sum: [0, 2, 0] },
      }),
    }));

    const weather = await getWeatherAtPoint({
      latitude: 31.5, longitude: 74.3, fetchImpl, now: 1,
    });

    expect(weather.code).toBe(61);
    expect(weather.label).toBe('Rain');
    expect(weather.temperatureC).toBe(18);
    expect(weather.daysSinceRain).toBe(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('past_days=92'),
      expect.anything()
    );
  });

  it('returns null offline or for invalid coordinates', async () => {
    const offline = async () => { throw new Error('offline'); };
    expect(await getWeatherAtPoint({ latitude: 31.5, longitude: 74.3, fetchImpl: offline })).toBeNull();
    expect(await getWeatherAtPoint({ latitude: 999, longitude: 0, fetchImpl: jest.fn() })).toBeNull();
  });
});

describe('parseNatureElements', () => {
  it('collects kinds and prefers the English name', () => {
    const parsed = parseNatureElements([
      { type: 'way', tags: { waterway: 'river', 'name:en': 'Chenab River', name: 'دریائے چناب' } },
      { type: 'node', tags: { natural: 'peak', name: 'Sakesar' } },
      { type: 'way', tags: { highway: 'residential', name: 'Main Road' } },
    ]);
    expect(parsed.kinds).toEqual(['river', 'mountain']);
    expect(parsed.names.river).toBe('Chenab River');
    expect(parsed.names.mountain).toBe('Sakesar');
  });

  it('ignores elements without tags', () => {
    expect(parseNatureElements([{ type: 'node' }, null]).kinds).toEqual([]);
    expect(parseNatureElements(null).kinds).toEqual([]);
  });
});

describe('buildNatureQuery', () => {
  it('asks only for landscape features around the point', () => {
    const query = buildNatureQuery(31.5, 74.3);
    expect(query).toContain('around:1500,31.5,74.3');
    expect(query).toContain('natural=peak');
    expect(query).not.toMatch(/building/i);
  });
});

describe('getNearbyNature', () => {
  const serviceFetch = () => jest.fn(async url => {
    if (String(url).includes('/elevation')) {
      return { ok: true, json: async () => ({ elevation: [217] }) };
    }
    return {
      ok: true,
      json: async () => ({
        elements: [{ tags: { waterway: 'river', name: 'Ravi' } }],
      }),
    };
  });

  it('parses Overpass and reuses the cache inside the window', async () => {
    const storage = memoryStorage();
    const fetchImpl = serviceFetch();

    const first = await getNearbyNature({
      latitude: 31.5, longitude: 74.3, fetchImpl, storage, now: 1000,
    });
    expect(first.kinds).toEqual(['river']);

    const callCount = fetchImpl.mock.calls.length;
    const second = await getNearbyNature({
      latitude: 31.5, longitude: 74.3, fetchImpl, storage, now: 1000 + NATURE_TTL_MS - 1,
    });
    expect(second.cached).toBe(true);
    expect(fetchImpl.mock.calls.length).toBe(callCount);
  });

  it('calls high ground a mountain when no peak is mapped', async () => {
    const fetchImpl = jest.fn(async url => (
      String(url).includes('/elevation')
        ? { ok: true, json: async () => ({ elevation: [1800] }) }
        : { ok: true, json: async () => ({ elements: [] }) }
    ));
    const nature = await getNearbyNature({
      latitude: 35.5, longitude: 74.3, fetchImpl, storage: memoryStorage(), now: 1,
    });
    expect(nature.kinds).toEqual(['mountain']);
    expect(nature.terrain).toBe('highland');
  });

  it('returns null when the point is invalid or both services fail', async () => {
    expect(await getNearbyNature({ latitude: 999, longitude: 0, fetchImpl: jest.fn() })).toBeNull();
    const failing = jest.fn(async () => { throw new Error('offline'); });
    const nature = await getNearbyNature({
      latitude: 31.5, longitude: 74.3, fetchImpl: failing, storage: memoryStorage(), now: 1,
    });
    expect(nature).toBeNull();
  });
});
