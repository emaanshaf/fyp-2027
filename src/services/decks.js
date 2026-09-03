// Deck builders.
//
// Turns the content the app already ships — the 99 Names, the dua collection,
// the quiz bank, and whatever the user is memorising in Hifz — into review
// cards for the learning engine.
//
// Card ids are deterministic and namespaced (`name:12`, `dua:4`) so re-seeding
// a deck after a content update never duplicates a card or resets its history.

import { ASMA_UL_HUSNA } from '../data/names';
import { DUAS } from '../data/duas';
import { QUIZ_DATA } from '../data/quiz';
import { learning, TOPICS } from './learningEngine';

/** Maps a quiz category onto a learning-engine topic. */
const QUIZ_TOPIC = {
  quran: 'quran',
  hadith: 'hadith',
  seerah: 'seerah',
  prophets: 'seerah',
  history: 'seerah',
  fiqh: 'fiqh',
};

export const DECKS = {
  names: {
    id: 'names',
    label: '99 Names of Allah',
    topic: 'names',
    description: 'Recall each Name and its meaning.',
    build: () =>
      ASMA_UL_HUSNA.map(n => ({
        id: `name:${n.id}`,
        type: 'name',
        topic: 'names',
        ref: n.id,
        prompt: n.arabic,
        subPrompt: n.name,
        answer: n.meaning,
        detail: n.desc,
      })),
  },

  duas: {
    id: 'duas',
    label: 'Duas & Adhkar',
    topic: 'dua',
    description: 'Recall each supplication from its occasion.',
    build: () =>
      DUAS.map(d => ({
        id: `dua:${d.id}`,
        type: 'dua',
        topic: 'dua',
        ref: d.id,
        prompt: d.title,
        subPrompt: d.category,
        answer: d.arabic,
        detail: d.translation,
        transliteration: d.transliteration,
      })),
  },

  knowledge: {
    id: 'knowledge',
    label: 'Islamic Knowledge',
    topic: 'quran',
    description: 'Facts from the Quran, Hadith, Seerah and Fiqh.',
    build: () =>
      Object.entries(QUIZ_DATA).flatMap(([cat, questions]) =>
        questions.map((q, i) => ({
          id: `quiz:${cat}:${i}`,
          type: 'quiz',
          topic: QUIZ_TOPIC[cat] || 'quran',
          ref: `${cat}:${i}`,
          prompt: q.q,
          answer: q.options[q.answer],
          // Carried through so a review card teaches, not just tests.
          detail: q.explanation,
          options: q.options,
          correctIndex: q.answer,
        }))
      ),
  },
};

/** Every card definition across every deck, id-keyed for lookup. */
export function allItems() {
  const out = {};
  for (const deck of Object.values(DECKS)) {
    for (const item of deck.build()) out[item.id] = item;
  }
  return out;
}

/** The content behind a scheduled card. */
export function itemFor(cardId, index = null) {
  const idx = index || allItems();
  return idx[cardId] || null;
}

/**
 * Builds cards for ayahs the user is memorising in Hifz, so Hifz progress
 * feeds the same scheduler as everything else.
 * @param {Array<{id, surah, ayah, text, translation}>} entries
 */
export function hifzItems(entries = []) {
  return entries.map(e => ({
    id: `hifz:${e.id ?? `${e.surah}:${e.ayah}`}`,
    type: 'hifz',
    topic: 'quran',
    ref: e.id ?? `${e.surah}:${e.ayah}`,
    prompt: e.reference || `Surah ${e.surah}, Ayah ${e.ayah}`,
    answer: e.text || e.arabic || '',
    detail: e.translation || '',
  }));
}

/** Enrolls one deck. Returns how many cards were newly added. */
export async function enrollDeck(deckId) {
  const deck = DECKS[deckId];
  if (!deck) return 0;
  return learning.enroll(deck.build());
}

/** Enrolls every built-in deck — used on first run of the learning hub. */
export async function enrollAll() {
  let added = 0;
  for (const id of Object.keys(DECKS)) added += await enrollDeck(id);
  return added;
}

/** Deck-level progress for the hub's deck list. */
export async function deckSummaries() {
  const cards = await learning.all();
  return Object.values(DECKS).map(deck => {
    const items = deck.build();
    const enrolled = items.filter(i => cards[i.id]);
    const learned = enrolled.filter(i => cards[i.id].reps > 0).length;
    const dueNow = enrolled.filter(i => cards[i.id].due <= Date.now()).length;
    return {
      ...deck,
      color: TOPICS[deck.topic]?.color,
      icon: TOPICS[deck.topic]?.icon,
      total: items.length,
      enrolled: enrolled.length,
      learned,
      due: dueNow,
      progress: items.length ? learned / items.length : 0,
    };
  });
}

export default DECKS;
