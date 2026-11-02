import { backend } from '../backend';

const jsonResponse = (body, { status = 200, ok = true, requestId = 'req-abc123' } = {}) => ({
  ok,
  status,
  headers: {
    get: name => (String(name).toLowerCase() === 'x-request-id' ? requestId : null),
  },
  json: jest.fn(async () => body),
});

beforeEach(async () => {
  global.__resetStorage();
  await backend.setToken(null);
  jest.clearAllMocks();
});

describe('backend request client', () => {
  it('sends the session token and returns the parsed body', async () => {
    await backend.setToken('test-token');
    global.fetch = jest.fn(async () => jsonResponse({ ok: true }));

    const data = await backend.request('/bookmarks');

    expect(data).toEqual({ ok: true });
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer test-token');
    expect(options.signal).toBeDefined();
  });

  it('aborts a request that outlives its timeout', async () => {
    global.fetch = jest.fn((url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        reject(error);
      });
    }));

    await expect(backend.request('/slow', { timeoutMs: 15 }))
      .rejects.toMatchObject({ reason: 'timeout' });
  });

  it('carries HTTP status, machine reason and request id on a rejection', async () => {
    global.fetch = jest.fn(async () => jsonResponse(
      { error: 'No token provided', reason: 'unauthorized' },
      { status: 401, ok: false, requestId: 'req-401' }
    ));

    await expect(backend.request('/bookmarks')).rejects.toMatchObject({
      status: 401,
      reason: 'unauthorized',
      requestId: 'req-401',
      message: 'No token provided',
    });
  });

  it('distinguishes a transport failure from an HTTP error', async () => {
    global.fetch = jest.fn(async () => { throw new TypeError('Network request failed'); });

    await expect(backend.request('/health')).rejects.toMatchObject({ reason: 'offline' });
  });
});
