// Client for the app's own AI endpoint — used as the online AI brain for the
// Islamic AI Assistant. Falls back to the offline knowledge base (see
// islamicKnowledge.js) whenever this is unavailable.
//
// This used to call api.anthropic.com directly with a key read from
// EXPO_PUBLIC_ANTHROPIC_API_KEY. That cannot be shipped: every EXPO_PUBLIC_*
// value is compiled into the app bundle, so the key was extractable by anyone
// who installed the app and could be spent against our account. The key now
// lives only on the server (see server/routes/ai.js), which authenticates the
// user and rate-limits per account before spending anything.

import { backend } from '../services/backend';

// What the last request or probe learned about the live assistant. claudeStatus()
// is synchronous because the UI reads it while rendering, so it reports the last
// known state rather than blocking on a round trip.
let lastStatus = {
  ok: true,
  reason: 'unknown',
  message: 'Checking the live assistant…',
};

const STATUS_BY_REASON = {
  no_key: 'The live assistant is not configured on the server, so answers come from the offline knowledge base.',
  bad_key: 'The server\'s assistant credentials are not working. Answers come from the offline knowledge base.',
  no_auth: 'Sign in to use the live assistant. Offline answers are still available.',
  upstream_rate_limit: 'The assistant is busy right now. Showing an offline answer instead.',
  rate_limited: 'You have made a lot of assistant requests recently. Showing an offline answer instead.',
  refusal: 'The assistant declined to answer that question.',
  offline: 'No connection to the Qitab-e-Noor server. Answers come from the offline knowledge base.',
};

const setStatus = (ok, reason) => {
  lastStatus = {
    ok,
    reason,
    message: ok
      ? 'Connected to the live assistant.'
      : STATUS_BY_REASON[reason] || 'The live assistant is unavailable right now.',
  };
  return lastStatus;
};

/**
 * Whether it is worth attempting a live call at all. There is no longer a local
 * key to inspect — the server owns that — so this stays true unless a previous
 * call established that the server has no key configured. Any other failure is
 * transient and worth retrying.
 */
export const isClaudeConfigured = () => lastStatus.reason !== 'no_key';

/** Why the live assistant is unavailable, for the UI to show. */
export function claudeStatus() {
  return lastStatus;
}

/**
 * Ask the server whether the live assistant is configured. Cheap, unauthenticated
 * and optional — call it on screen mount so the UI can explain itself before the
 * user types anything.
 */
export async function refreshClaudeStatus() {
  try {
    const data = await backend.request('/ai/status');
    return data?.configured ? setStatus(true, 'ready') : setStatus(false, 'no_key');
  } catch {
    return setStatus(false, 'offline');
  }
}

export async function askClaude(question, { signal, context } = {}) {
  let data;
  try {
    data = await backend.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
      signal,
    });
  } catch (e) {
    const message = e?.message || 'request failed';

    // backend.request throws the server's `error` string, so the machine-readable
    // `reason` is not on it. Map the cases the UI needs to distinguish.
    if (message === 'Backend server not available') {
      setStatus(false, 'offline');
    } else if (message === 'No token provided' || message === 'Token expired'
      || message === 'Invalid token' || message === 'Authentication failed') {
      setStatus(false, 'no_auth');
    } else if (message.startsWith('The live assistant is not configured')) {
      setStatus(false, 'no_key');
    } else if (message.startsWith('The live assistant is misconfigured')) {
      setStatus(false, 'bad_key');
    } else if (message.startsWith('Too many AI requests')) {
      setStatus(false, 'rate_limited');
    } else if (message.startsWith('The assistant is busy')) {
      setStatus(false, 'upstream_rate_limit');
    } else if (message.startsWith('The assistant declined')) {
      setStatus(false, 'refusal');
    } else {
      setStatus(false, 'upstream_error');
    }

    throw e;
  }

  const text = (data?.text || '').trim();
  if (!text) {
    setStatus(false, 'empty_response');
    throw new Error('claude_empty_response');
  }

  setStatus(true, 'ready');
  return text;
}
