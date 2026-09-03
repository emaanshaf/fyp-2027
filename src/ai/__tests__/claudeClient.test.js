import { backend } from '../../services/backend';
import { askClaude, claudeStatus, isClaudeConfigured, refreshClaudeStatus } from '../claudeClient';

jest.mock('../../services/backend', () => ({
  backend: { request: jest.fn() },
}));

/** Build the error shape backend.request throws for a failed API response. */
function apiError(message, { status, reason } = {}) {
  const err = new Error(message);
  if (status !== undefined) err.status = status;
  if (reason !== undefined) err.reason = reason;
  return err;
}

beforeEach(async () => {
  // The module caches the last known status; reset it between tests so one
  // test's failure does not decide the next one's starting point.
  backend.request.mockReset();
  backend.request.mockResolvedValue({ configured: true });
  await refreshClaudeStatus();
  // Drop that probe from the call history, so calls[0] in a test is the call
  // the test made.
  backend.request.mockReset();
});

describe('refreshClaudeStatus', () => {
  it('reports ready when the server has a key', async () => {
    backend.request.mockResolvedValue({ configured: true });

    const status = await refreshClaudeStatus();

    expect(backend.request).toHaveBeenCalledWith('/ai/status');
    expect(status.ok).toBe(true);
    expect(claudeStatus().ok).toBe(true);
  });

  it('reports no_key when the server has none, and stops further attempts', async () => {
    backend.request.mockResolvedValue({ configured: false });

    const status = await refreshClaudeStatus();

    expect(status.ok).toBe(false);
    expect(status.reason).toBe('no_key');
    expect(status.message).toMatch(/offline knowledge base/i);
    // assistant.js gates the live call on this, so a server with no key must
    // not be asked on every question.
    expect(isClaudeConfigured()).toBe(false);
  });

  it('reports offline when the probe itself fails', async () => {
    backend.request.mockRejectedValue(apiError('Backend server not available', { reason: 'offline' }));

    const status = await refreshClaudeStatus();

    expect(status.ok).toBe(false);
    expect(status.reason).toBe('offline');
    // Unreachable is transient — unlike no_key, it stays worth retrying.
    expect(isClaudeConfigured()).toBe(true);
  });
});

describe('askClaude', () => {
  it('posts the question and context to the app API, not to Anthropic', async () => {
    backend.request.mockResolvedValue({ text: 'Zakat is 2.5%.' });
    const context = [{ topic: 'Zakat', answer: 'threshold', references: [] }];

    const text = await askClaude('What is zakat?', { context });

    expect(text).toBe('Zakat is 2.5%.');
    const [endpoint, options] = backend.request.mock.calls[0];
    expect(endpoint).toBe('/ai/chat');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ question: 'What is zakat?', context });
  });

  it('passes the abort signal through so the timeout can cancel the request', async () => {
    backend.request.mockResolvedValue({ text: 'ok' });
    const controller = new AbortController();

    await askClaude('q', { signal: controller.signal });

    expect(backend.request.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it('never sends an API key from the app', async () => {
    backend.request.mockResolvedValue({ text: 'ok' });

    await askClaude('q');

    const serialised = JSON.stringify(backend.request.mock.calls[0]);
    expect(serialised).not.toMatch(/sk-ant-/);
    expect(serialised).not.toMatch(/x-api-key/i);
    expect(serialised).not.toMatch(/anthropic\.com/i);
  });

  it('treats a blank answer as a failure rather than an empty reply', async () => {
    backend.request.mockResolvedValue({ text: '   ' });

    await expect(askClaude('q')).rejects.toThrow('claude_empty_response');
    expect(claudeStatus().reason).toBe('empty_response');
  });
});

describe('askClaude failure classification', () => {
  // The API sends `reason`; the client must read that rather than the prose,
  // so rewording a server message cannot change what the app does.
  it.each([
    ['no_key', 503, 'no_key'],
    ['bad_key', 503, 'bad_key'],
    ['upstream_rate_limit', 429, 'upstream_rate_limit'],
    ['refusal', 422, 'refusal'],
    ['upstream_error', 502, 'upstream_error'],
    ['offline', undefined, 'offline'],
    ['timeout', undefined, 'timeout'],
  ])('maps reason %s onto the same status', async (reason, status, expected) => {
    backend.request.mockRejectedValue(apiError('some wording that may change', { status, reason }));

    await expect(askClaude('q')).rejects.toThrow();
    expect(claudeStatus().reason).toBe(expected);
    expect(claudeStatus().ok).toBe(false);
  });

  it.each([
    ['a 401 with no reason', 401, 'no_auth'],
    ['a 429 from the app limiter, which sends no reason', 429, 'rate_limited'],
    ['an unrecognised status', 500, 'upstream_error'],
  ])('falls back to the HTTP status for %s', async (_label, status, expected) => {
    backend.request.mockRejectedValue(apiError('Too many AI requests', { status }));

    await expect(askClaude('q')).rejects.toThrow();
    expect(claudeStatus().reason).toBe(expected);
  });

  it('gives every failure reason a message fit to show a user', async () => {
    for (const reason of ['no_key', 'bad_key', 'no_auth', 'upstream_rate_limit',
      'rate_limited', 'timeout', 'upstream_error', 'empty_response', 'refusal', 'offline']) {
      backend.request.mockRejectedValue(apiError('x', { reason }));
      await expect(askClaude('q')).rejects.toThrow();

      const { message } = claudeStatus();
      expect(typeof message).toBe('string');
      // A reason with no entry would fall through to a generic string; catch
      // that here rather than in front of a user.
      expect(message.length).toBeGreaterThan(20);
    }
  });

  it('rethrows so the assistant can fall back to the offline answer', async () => {
    backend.request.mockRejectedValue(apiError('nope', { status: 502, reason: 'upstream_error' }));

    await expect(askClaude('q')).rejects.toThrow('nope');
  });
});
