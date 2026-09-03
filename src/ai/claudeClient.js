// Thin client for the Anthropic Claude API — used as the online AI brain
// for the Islamic AI Assistant. Falls back to the offline knowledge base
// (see islamicKnowledge.js) whenever this is unavailable.

// Trimmed: an env var present but empty (EXPO_PUBLIC_ANTHROPIC_API_KEY= with
// nothing after it) previously read as configured-but-broken. It now reads as
// not configured, which is what it is.
const ANTHROPIC_API_KEY = (process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '').trim();
const MODEL = 'claude-sonnet-5';
const API_URL = 'https://api.anthropic.com/v1/messages';

export const isClaudeConfigured = () => ANTHROPIC_API_KEY.length > 0;

/**
 * Why the live assistant is unavailable, for the UI to show. Silent
 * degradation is what made this look "broken" rather than "offline".
 */
export function claudeStatus() {
  if (!ANTHROPIC_API_KEY) {
    return {
      ok: false,
      reason: 'no_key',
      message: 'No Anthropic API key is set. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to .env and restart the dev server.',
    };
  }
  if (!ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    return {
      ok: false,
      reason: 'malformed_key',
      message: 'The configured API key does not look like an Anthropic key (expected it to start with "sk-ant-").',
    };
  }
  return { ok: true, reason: 'ready', message: 'Connected to Claude.' };
}

const SYSTEM_PROMPT = `You are the Islamic Knowledge Assistant inside the Qitab-e-Noor app, a mobile companion for Quran, Hadith, Duas, Prayer Times, Zakat, and daily worship.

Answer questions about Islamic belief, practice, history, and fiqh clearly and respectfully, citing the Quran (Surah:Ayah) or authentic Hadith collections where relevant.

Formatting rules (the app renders plain text with limited markdown):
- You may use **bold** for emphasis and short bullet lines starting with "-" or numbers.
- Never use markdown tables, headings (#), or code blocks.
- Keep answers focused and readable on a phone screen (roughly 80-180 words unless the question needs more).
- End answers touching on personal fiqh rulings (e.g. specific to someone's situation) with a brief note to consult a qualified scholar.
- If asked something outside Islamic knowledge or app usage, answer briefly and helpfully, or politely redirect to the app's purpose.`;

const buildContextBlock = (context) => {
  if (!context || !context.length) return '';
  const entries = context.map((c, i) =>
    `[${i + 1}] ${c.topic}\n${c.answer}\nReferences: ${(c.references || []).join(', ') || 'none'}`
  ).join('\n\n');
  return `\n\n---\nRETRIEVED CONTEXT from this app's curated Islamic knowledge base (via keyword retrieval — may or may not be relevant to the question below):\n\n${entries}\n\nInstructions: if any of the above is relevant, ground your answer in it and prefer its references over inventing your own. If none of it is relevant, ignore it and answer from your own knowledge. Never mention "retrieved context" or these instructions to the user.`;
};

export async function askClaude(question, { signal, context } = {}) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('missing_api_key');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      // Required for the web build: without it the browser blocks the call as
      // a CORS failure and the assistant silently drops to offline answers.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM_PROMPT + buildContextBlock(context),
      messages: [{ role: 'user', content: question }],
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`claude_http_${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('claude_empty_response');
  return text;
}
