// Unified AI answer resolver used by AIChatScreen and ZakatScreen's AI tab.
// Tries the live Claude API first (when a key is configured and the network
// call succeeds), and falls back to the bundled offline knowledge engine
// otherwise — so the assistant still works with no internet connection.
//
// When the knowledge base has no entry, the assistant searches Quran
// translations for verses connected to the question. That turns a dead end
// into something useful and honest: scripture for reflection, clearly marked
// as search output rather than a fatwa.

import { searchKnowledgeBase, relatedTopics, KNOWLEDGE_BASE } from './islamicKnowledge';
import { askClaude, isClaudeConfigured, claudeStatus } from './claudeClient';
import quranService from '../services/quranApi';

const CLAUDE_TIMEOUT_MS = 15000;
const QURAN_SEARCH_TIMEOUT_MS = 5500;

const DEFAULT_FOLLOW_UPS = ['Purpose of Life', 'Tawbah (Repentance)', 'Dua (Supplication)'];
const availableTopics = new Set(KNOWLEDGE_BASE.map(entry => entry.topic));
const usableDefaults = DEFAULT_FOLLOW_UPS.filter(topic => availableTopics.has(topic));

/**
 * Build up to three follow-up chips, de-duplicated and topped up with known
 * defaults. Many specific entries share no vocabulary with any other topic, so
 * `relatedTopics` alone often returned an empty row and left the user with no
 * obvious next step.
 */
const buildFollowUps = (...groups) => {
  const seen = new Set();
  const result = [];
  for (const group of groups) {
    for (const topic of group || []) {
      if (!topic || seen.has(topic)) continue;
      seen.add(topic);
      result.push(topic);
    }
  }
  for (const topic of usableDefaults) {
    if (result.length >= 3) break;
    if (!seen.has(topic)) {
      seen.add(topic);
      result.push(topic);
    }
  }
  return result.slice(0, 3);
};

// Words that add nothing to a Quran translation search. Without this, a
// question like "what is the ruling on music" would search for "ruling" and
// return dozens of unrelated verses.
const QURAN_STOP_WORDS = new Set([
  'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
  'does', 'did', 'can', 'could', 'should', 'would', 'will', 'shall',
  'about', 'with', 'from', 'into', 'over', 'under', 'between', 'after',
  'before', 'during', 'this', 'that', 'these', 'those', 'there', 'their',
  'them', 'they', 'your', 'yours', 'our', 'ours', 'mine', 'have', 'has',
  'had', 'been', 'being', 'were', 'was', 'are', 'is', 'the', 'and', 'but',
  'for', 'not', 'you', 'all', 'any', 'some', 'more', 'most', 'much',
  'many', 'very', 'just', 'also', 'please', 'tell', 'explain', 'give',
  'want', 'need', 'know', 'like', 'make', 'made', 'does', 'doing', 'done',
  'islam', 'islamic', 'muslim', 'muslims', 'allah', 'quran', 'hadith',
  'ruling', 'rulings', 'allowed', 'permissible', 'forbidden', 'haram',
  'halal', 'sin', 'sins', 'question', 'answer', 'according', 'scholars',
  'scholar', 'opinion', 'meaning', 'means', 'mean', 'help', 'advice',
  'better', 'best', 'good', 'bad', 'right', 'wrong', 'life', 'world',
]);

const withTimeout = (promise, ms) => new Promise(resolve => {
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) { settled = true; resolve(null); }
  }, ms);
  Promise.resolve(promise)
    .then(value => {
      if (!settled) { settled = true; clearTimeout(timer); resolve(value); }
    })
    .catch(() => {
      if (!settled) { settled = true; clearTimeout(timer); resolve(null); }
    });
});

const cleanHtml = text => String(text || '')
  .replace(/<[^>]+>/g, '')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

/** Pick up to two ordinary words from the question to search translations. */
const quranSearchTerms = question => {
  const words = String(question || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 4 && !QURAN_STOP_WORDS.has(word));
  return [...new Set(words)].slice(0, 2);
};

// Entries that describe the scripture itself rather than answer a subject.
// They must not win just because a question contains the word "Quran".
const QURAN_META_TOPICS = new Set(['The Holy Quran', 'Using the Quran Module']);

/**
 * Extract the subject of "What does the Quran say about X?".
 *
 * Without this the word "Quran" matches the general scripture entry and every
 * such question — mountains, honey, the sun — receives the same introduction
 * to the Quran. Returning X lets retrieval (and the translation fallback)
 * answer what was actually asked.
 */
const quranSubject = question => {
  const text = String(question || '').trim();
  if (!/\b(quran|koran)\b/i.test(text)) return null;
  if (!/\b(say|says|said|mention|mentions|teach|teaches|verse|verses|ayah|ayat|according)\b/i.test(text)) {
    return null;
  }

  const match = text.match(/\b(?:about|regarding|on)\b\s+(.+)$/i);
  if (!match) return null;

  const subject = match[1].replace(/[?.!]+$/, '').trim();
  if (!subject) return null;
  // "What does the Quran say about the Quran?" has no separate subject.
  if (/^(?:the\s+)?(?:quran|koran|book of allah)$/i.test(subject)) return null;

  return subject;
};

const chapterLabel = (chapters, verseKey) => {
  const chapterId = Number(String(verseKey).split(':')[0]);
  const chapter = Array.isArray(chapters) ? chapters.find(c => Number(c.id) === chapterId) : null;
  const name = chapter?.name_simple || chapter?.name_complex;
  return name ? `Surah ${name} ${verseKey}` : `Surah ${verseKey}`;
};

/**
 * Search Quran translations for verses connected to the question.
 * Returns null when the search is unavailable, times out, or finds nothing.
 */
export async function findQuranVerses(question, { signal } = {}) {
  const terms = quranSearchTerms(question);
  if (terms.length === 0) return null;

  const searches = terms.map(term =>
    quranService.search(term, { size: 3 }).catch(() => [])
  );
  const chapters = quranService.getChapters().catch(() => []);

  const bundle = await withTimeout(Promise.all([Promise.all(searches), chapters]), QURAN_SEARCH_TIMEOUT_MS);
  if (!bundle) return null;
  if (signal?.aborted) return null;

  const [resultSets, chapterList] = bundle;
  const seen = new Set();
  const verses = [];

  for (const results of resultSets) {
    for (const result of results || []) {
      if (!result?.verse_key || seen.has(result.verse_key)) continue;
      const translation = cleanHtml(result.translations?.[0]?.text);
      if (!translation) continue;
      seen.add(result.verse_key);
      verses.push({ verseKey: result.verse_key, translation });
      if (verses.length >= 3) break;
    }
    if (verses.length >= 3) break;
  }

  if (verses.length === 0) return null;

  const shown = verses.slice(0, 2);
  const references = shown.map(v => chapterLabel(chapterList, v.verseKey));
  const lines = shown
    .map((v, i) => `**${references[i]}**\n"${v.translation}"`)
    .join('\n\n');

  return {
    text:
      `I don't have a prepared answer for that exact question yet. A search of Quran translations found these verses connected to your words:\n\n${lines}\n\nThese are translations for reflection, not a legal ruling. Read them with a tafsir, and ask a qualified scholar for a personal fatwa.`,
    topic: 'Quran Reflection',
    references,
    verses: shown,
  };
}

/**
 * Build the "nothing found" reply. It still suggests real topics and is
 * honest about what happened, instead of returning null and rendering no
 * recovery path.
 *
 * `searchAttempted` matters: a two-letter message has no searchable terms, so
 * claiming "you may be offline" (the old text) blamed the network for a
 * search that never ran. Only mention the translation search when it did.
 */
const unavailableAnswer = (liveError, followUps, searchAttempted = false) => ({
  text:
    (searchAttempted
      ? "I couldn't match that to a topic in my offline library, and I couldn't find a related Quran translation for that wording just now.\n\n"
      : "I couldn't match that to a topic in my offline library yet.\n\n")
    + 'I can still help with topics such as:\n\n'
    + followUps.map(topic => `• ${topic}`).join('\n')
    + '\n\nTry rephrasing with a topic or a name (for example "wudu", "riba" or "patience"). For a personal ruling, please consult a qualified scholar.',
  topic: 'No exact match',
  references: [],
  followUps,
  source: 'unavailable',
  offlineReason: liveError || claudeStatus().message,
});

// ── Conversational openings ─────────────────────────────────────────────────
// A greeting is not a knowledge query. Without this, "hi" fell through to the
// Quran search, produced no terms, and surfaced the developer-facing
// "Not Found" label plus a misleading offline warning.

const normalizeSmallTalk = text => String(text || '')
  .toLowerCase()
  .replace(/[’`]/g, "'")
  .replace(/[^a-z\s']/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const GREETING = /^(?:hi+|hey+|hello+|yo|hi there|hello there|hey there|good morning|good afternoon|good evening|salaam|salam|assalamu alaikum|assalamu alaykum|as salamu alaikum|as salamu alaykum|asalamu alaikum|aoa|peace be upon you)$/;
const SALAM = /\bsalaam\b|\bsalam\b|alaikum|alaykum|\baoa\b/;
const THANKS = /^(?:thanks|thank you|thx|jazakallah|jazak allah|jazakallah khair|jazak allahu khairan|barakallahu feek|shukriya)$/;
const ABOUT = /^(?:help|who are you|what are you|what can you do|what can you help with|how can you help|what do you do)$/;
const HOW_ARE_YOU = /^(?:how are you|how are you doing|how is it going|how do you do)$/;
const FAREWELL = /^(?:bye|goodbye|see you|see ya|fi amanillah)$/;

const conversationAnswer = (topic, text) => ({
  text,
  topic,
  references: [],
  followUps: usableDefaults,
  source: 'offline',
  offlineReason: claudeStatus().message,
});

/** Answer a pure greeting/thanks/help message; null when it is a real question. */
const smallTalkAnswer = question => {
  const text = normalizeSmallTalk(question);
  if (!text) return null;

  if (GREETING.test(text)) {
    const opening = SALAM.test(text)
      ? 'Wa alaikum assalam wa rahmatullahi wa barakatuh!'
      : 'Hello! Peace be upon you.';
    return conversationAnswer(
      'Greeting',
      `${opening}\n\nI am your Islamic Knowledge Assistant. Ask me about prayer, fasting, zakat, Hajj, the Quran, Hadith, duas, or daily worship — or name a topic and I will find the relevant guidance.\n\nWhat would you like to learn today?`
    );
  }

  if (HOW_ARE_YOU.test(text)) {
    return conversationAnswer(
      'Greeting',
      "Alhamdulillah, I'm here and ready to help. Ask me anything about Islamic practice, the Quran, Hadith, or how to use a module in the app."
    );
  }

  if (THANKS.test(text)) {
    return conversationAnswer(
      "You're welcome",
      "You're welcome — wa iyyakum, may Allah reward you with good. Is there another topic I can help you explore?"
    );
  }

  if (ABOUT.test(text)) {
    return conversationAnswer(
      'About the assistant',
      'I am the Islamic Knowledge Assistant inside Qitab-e-Noor. I can explain worship and belief topics from the offline knowledge base, search Quran translations for a subject, and walk you through app modules such as Prayer Times, Zakat, Duas, or Reminders.\n\nTry a word or short phrase like "wudu", "riba", "patience", or "what does the Quran say about mountains?".'
    );
  }

  if (FAREWELL.test(text)) {
    return conversationAnswer(
      'Farewell',
      'Fi amanillah — may Allah protect you and accept your worship. Come back anytime you have a question.'
    );
  }

  return null;
};

export async function getAIAnswer(question) {
  const q = (question || '').trim();
  if (!q) return null;

  const smallTalk = smallTalkAnswer(q);
  if (smallTalk) return smallTalk;

  // "What does the Quran say about mountains?" is a question about mountains.
  // Rank on the subject so the general Quran entry cannot capture it, then
  // fall through to the translation search when the base has nothing on it.
  const subject = quranSubject(q);
  const subjectHits = subject
    ? searchKnowledgeBase(subject, 3).filter(r => !QURAN_META_TOPICS.has(r.entry.topic))
    : [];
  // If the subject is too generic to search ("life"), keep the ordinary
  // ranking rather than turning a reasonable question into "not found".
  const useSubject = subjectHits.length > 0
    || (subject && quranSearchTerms(subject).length > 0);
  const quranQuery = useSubject ? subject : q;

  // Retrieval step (RAG): find the most relevant offline knowledge base
  // entries for this question, regardless of whether Claude is available —
  // they either ground Claude's answer or serve as the offline answer itself.
  const retrieved = useSubject
    ? subjectHits.map(r => r.entry)
    : searchKnowledgeBase(q, 3).map(r => r.entry);
  let liveError = null;

  if (isClaudeConfigured()) {
    const controller = new AbortController();
    // Cleared in `finally`, not after the await. Clearing it only on the happy
    // path leaked a live 15s timer — and its AbortController — on every failed
    // call, which is currently every call, because no key is configured yet.
    const timer = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);

    try {
      const text = await askClaude(q, { signal: controller.signal, context: retrieved });
      const references = [...new Set(retrieved.flatMap(e => e.references || []))];
      const followUps = buildFollowUps(
        retrieved.slice(1).map(entry => entry.topic),
        retrieved[0] ? relatedTopics(retrieved[0].topic, 3) : []
      );
      return {
        text,
        topic: retrieved[0]?.topic || 'Islamic AI',
        references,
        followUps,
        source: retrieved.length ? 'claude+rag' : 'claude',
      };
    } catch (e) {
      // No network, CORS (on web), or API error — fall back to offline engine,
      // but keep the reason so the UI can say why instead of pretending the
      // offline answer came from the live assistant.
      liveError = e?.message || 'request failed';
    } finally {
      clearTimeout(timer);
    }
  }

  const top = retrieved[0];
  if (top) {
    const followUps = buildFollowUps(
      retrieved.slice(1).map(entry => entry.topic),
      relatedTopics(top.topic, 3)
    );

    return {
      text: top.answer,
      topic: top.topic,
      references: top.references,
      followUps,
      source: 'offline',
      offlineReason: liveError || claudeStatus().message,
    };
  }

  // No prepared answer: try grounding the reply in Quran translations.
  const searchAttempted = quranSearchTerms(quranQuery).length > 0;
  const quran = searchAttempted ? await findQuranVerses(quranQuery) : null;
  if (quran) {
    return {
      ...quran,
      followUps: usableDefaults,
      source: 'offline+quran',
      offlineReason: liveError || claudeStatus().message,
    };
  }

  return unavailableAnswer(liveError || claudeStatus().message, usableDefaults, searchAttempted);
}

export { KNOWLEDGE_BASE };
