// Unified AI answer resolver used by AIChatScreen and ZakatScreen's AI tab.
// Tries the live Claude API first (when a key is configured and the network
// call succeeds), and falls back to the bundled offline knowledge engine
// otherwise — so the assistant still works with no internet connection.

import { searchKnowledgeBase, KNOWLEDGE_BASE } from './islamicKnowledge';
import { askClaude, isClaudeConfigured, claudeStatus } from './claudeClient';

const CLAUDE_TIMEOUT_MS = 15000;

export async function getAIAnswer(question) {
  const q = (question || '').trim();
  if (!q) return null;

  // Retrieval step (RAG): find the most relevant offline knowledge base
  // entries for this question, regardless of whether Claude is available —
  // they either ground Claude's answer or serve as the offline answer itself.
  const retrieved = searchKnowledgeBase(q, 3).map(r => r.entry);
  let liveError = null;

  if (isClaudeConfigured()) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);
      const text = await askClaude(q, { signal: controller.signal, context: retrieved });
      clearTimeout(timer);
      const references = [...new Set(retrieved.flatMap(e => e.references || []))];
      return {
        text,
        topic: retrieved[0]?.topic || 'Islamic AI',
        references,
        source: retrieved.length ? 'claude+rag' : 'claude',
      };
    } catch (e) {
      // No network, CORS (on web), or API error — fall back to offline engine,
      // but keep the reason so the UI can say why instead of pretending the
      // offline answer came from the live assistant.
      liveError = e?.message || 'request failed';
    }
  }

  const top = retrieved[0];
  if (top) {
    return {
      text: top.answer,
      topic: top.topic,
      references: top.references,
      source: 'offline',
      offlineReason: liveError || claudeStatus().message,
    };
  }

  // Nothing retrieved and no live answer: say so rather than returning null,
  // which the chat screen rendered as no reply at all.
  return {
    text:
      "I don't have an answer for that in my offline knowledge base, and the "
      + 'live assistant is unavailable right now.',
    topic: 'Unavailable',
    references: [],
    source: 'unavailable',
    offlineReason: liveError || claudeStatus().message,
  };
}

export { KNOWLEDGE_BASE };
