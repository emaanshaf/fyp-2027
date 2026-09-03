import { cached, isCached, invalidate, prefetch, fetchJson, TTL } from '../cache';

beforeEach(() => {
  global.__resetStorage();
  jest.restoreAllMocks();
});

describe('cached', () => {
  it('goes to the network on a miss and serves the cache after', async () => {
    const fetcher = jest.fn().mockResolvedValue({ v: 1 });

    expect(await cached('k', fetcher, { ttl: TTL.SCRIPTURE })).toEqual({ v: 1 });
    expect(await cached('k', fetcher, { ttl: TTL.SCRIPTURE })).toEqual({ v: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('bypasses the cache when forceRefresh is set', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce({ v: 1 }).mockResolvedValueOnce({ v: 2 });

    await cached('k', fetcher);
    const second = await cached('k', fetcher, { forceRefresh: true });

    expect(second).toEqual({ v: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('serves a stale entry rather than failing when the network is down', async () => {
    // The whole point of the layer: a dropped connection must degrade
    // freshness, never function.
    await cached('k', jest.fn().mockResolvedValue({ v: 'saved' }), { ttl: 1 });
    await new Promise(r => setTimeout(r, 5));

    const failing = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await cached('k', failing, { ttl: 1 })).toEqual({ v: 'saved' });
  });

  it('falls back to the provided value when there is nothing cached', async () => {
    const failing = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await cached('cold', failing, { fallback: [] })).toEqual([]);
  });

  it('rethrows when there is neither a cache nor a fallback', async () => {
    const failing = jest.fn().mockRejectedValue(new Error('offline'));
    await expect(cached('cold', failing)).rejects.toThrow('offline');
  });

  it('collapses concurrent misses into a single request', async () => {
    let calls = 0;
    const fetcher = () => {
      calls += 1;
      return new Promise(r => setTimeout(() => r({ v: calls }), 10));
    };

    const results = await Promise.all([
      cached('dedupe', fetcher),
      cached('dedupe', fetcher),
      cached('dedupe', fetcher),
    ]);

    expect(calls).toBe(1);
    expect(results.every(r => r.v === 1)).toBe(true);
  });

  it('survives a corrupt cache entry by refetching', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('qitab_cache_bad', 'not json{{');

    const fetcher = jest.fn().mockResolvedValue({ v: 'fresh' });
    expect(await cached('bad', fetcher)).toEqual({ v: 'fresh' });
  });
});

describe('isCached / invalidate', () => {
  it('reports whether a key can be served offline', async () => {
    expect(await isCached('k')).toBe(false);
    await cached('k', jest.fn().mockResolvedValue(1));
    expect(await isCached('k')).toBe(true);
  });

  it('clears only the namespace it is given', async () => {
    await cached('quran:1', jest.fn().mockResolvedValue(1));
    await cached('hadith:1', jest.fn().mockResolvedValue(2));

    await invalidate('quran:');

    expect(await isCached('quran:1')).toBe(false);
    expect(await isCached('hadith:1')).toBe(true);
  });
});

describe('prefetch', () => {
  it('warms a cold key', async () => {
    expect(await prefetch('warm', jest.fn().mockResolvedValue(1))).toBe(true);
    expect(await isCached('warm')).toBe(true);
  });

  it('reports failure without throwing', async () => {
    const failing = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await prefetch('cold', failing)).toBe(false);
  });

  it('does not refetch something already cached', async () => {
    await cached('warm', jest.fn().mockResolvedValue(1));
    const fetcher = jest.fn();
    expect(await prefetch('warm', fetcher)).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('fetchJson', () => {
  it('throws with the status attached on a non-2xx response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(fetchJson('https://example.test')).rejects.toMatchObject({ status: 503 });
  });

  it('returns the parsed body on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: 1 }) });
    expect(await fetchJson('https://example.test')).toEqual({ ok: 1 });
  });

  it('aborts rather than hanging forever', async () => {
    // A captive-portal network leaves requests open indefinitely; without the
    // timeout the UI spins with no way out.
    global.fetch = jest.fn(
      (url, { signal }) =>
        new Promise((_, reject) =>
          signal.addEventListener('abort', () => reject(new Error('Aborted')))
        )
    );
    await expect(fetchJson('https://example.test', { timeout: 20 })).rejects.toThrow();
  });
});
