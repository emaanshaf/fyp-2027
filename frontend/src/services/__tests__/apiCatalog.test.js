import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../../config/appConfig';
import {
  API_CATALOG_CACHE_KEY,
  fetchApiCatalog,
  getEndpointUrl,
  readCachedApiCatalog,
  testApiEndpoint,
} from '../apiCatalog';

const catalog = {
  service: 'qitabe-noor-api',
  version: '1.0.0',
  basePath: '/api',
  uptimeSeconds: 90,
  groups: [
    {
      id: 'system',
      title: 'System',
      description: 'Liveness.',
      endpoints: [
        {
          method: 'GET',
          path: '/health',
          auth: 'public',
          testable: true,
          summary: 'Liveness probe.',
          group: 'system',
          fullPath: '/api/health',
        },
      ],
    },
  ],
  counts: { groups: 1, endpoints: 1, public: 1, session: 0, admin: 0, testable: 1 },
};

const response = (body, { status = 200, ok = true, requestId = 'req-live' } = {}) => ({
  ok,
  status,
  headers: {
    get: name => (String(name).toLowerCase() === 'x-request-id' ? requestId : null),
  },
  text: async () => JSON.stringify(body),
});

beforeEach(() => {
  global.__resetStorage();
  jest.clearAllMocks();
});

describe('API catalogue client', () => {
  it('reads the live catalogue from the API root and caches it', async () => {
    global.fetch = jest.fn(async () => response(catalog));

    const result = await fetchApiCatalog();

    expect(global.fetch).toHaveBeenCalledWith(
      `${apiUrl}/`,
      expect.objectContaining({ method: 'GET' })
    );
    expect(result.catalog.groups[0].title).toBe('System');
    expect(result.requestId).toBe('req-live');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);

    const cached = JSON.parse(await AsyncStorage.getItem(API_CATALOG_CACHE_KEY));
    expect(cached.catalog.counts.endpoints).toBe(1);
  });

  it('rejects a response that is not a catalogue', async () => {
    global.fetch = jest.fn(async () => response({ error: 'not found' }));

    await expect(fetchApiCatalog()).rejects.toThrow(/expected format/);
    expect(await AsyncStorage.getItem(API_CATALOG_CACHE_KEY)).toBeNull();
  });

  it('reports an HTTP failure instead of caching it', async () => {
    global.fetch = jest.fn(async () => response(
      { error: 'boom' },
      { status: 500, ok: false }
    ));

    await expect(fetchApiCatalog()).rejects.toThrow(/HTTP 500/);
    expect(await AsyncStorage.getItem(API_CATALOG_CACHE_KEY)).toBeNull();
  });

  it('returns the last saved catalogue when one exists', async () => {
    await AsyncStorage.setItem(API_CATALOG_CACHE_KEY, JSON.stringify({
      catalog,
      latencyMs: 12,
      requestId: 'req-cache',
      fetchedAt: 123,
    }));

    const cached = await readCachedApiCatalog();

    expect(cached.catalog.version).toBe('1.0.0');
    expect(cached.requestId).toBe('req-cache');
  });

  it('ignores a corrupt cache entry', async () => {
    await AsyncStorage.setItem(API_CATALOG_CACHE_KEY, '{not json');
    expect(await readCachedApiCatalog()).toBeNull();
  });
});

describe('browser addresses for endpoints', () => {
  it('joins the API base with the documented path', () => {
    expect(getEndpointUrl({ path: '/health' })).toBe(`${apiUrl}/health`);
    expect(getEndpointUrl({ path: '/modules/hifz/plans' })).toBe(`${apiUrl}/modules/hifz/plans`);
    expect(getEndpointUrl({ path: '/' })).toBe(`${apiUrl}/`);
  });

  it('refuses entries without a plain path', () => {
    expect(getEndpointUrl(null)).toBeNull();
    expect(getEndpointUrl({})).toBeNull();
    expect(getEndpointUrl({ path: 'health' })).toBeNull();
    expect(getEndpointUrl({ path: 42 })).toBeNull();
  });
});

describe('testing an endpoint', () => {
  const endpoint = catalog.groups[0].endpoints[0];

  it('returns status, timing, request id and a response preview', async () => {
    global.fetch = jest.fn(async () => response({ status: 'ok' }, { requestId: 'req-health' }));

    const result = await testApiEndpoint(endpoint);

    expect(global.fetch).toHaveBeenCalledWith(
      `${apiUrl}/health`,
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toMatchObject({
      status: 200,
      ok: true,
      requestId: 'req-health',
    });
    expect(result.preview).toContain('"status": "ok"');
  });

  it('refuses to invoke a non-testable route without touching the network', async () => {
    global.fetch = jest.fn();

    await expect(testApiEndpoint({
      ...endpoint,
      method: 'POST',
      testable: false,
    })).rejects.toThrow(/Only public/);

    await expect(testApiEndpoint({
      ...endpoint,
      path: '/bookmarks/:id',
      testable: true,
    })).rejects.toThrow(/Only public/);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('surfaces a timeout with a readable message', async () => {
    global.fetch = jest.fn((url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        reject(error);
      });
    }));

    // The public helper uses an 8s timeout; this test asserts the mapping,
    // so it waits out the real timer rather than mocking it.
    jest.useFakeTimers();
    const pending = testApiEndpoint(endpoint);
    jest.advanceTimersByTime(8100);
    await expect(pending).rejects.toThrow(/did not answer/);
    jest.useRealTimers();
  }, 15000);
});
