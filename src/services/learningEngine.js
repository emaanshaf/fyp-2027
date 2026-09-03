// Adaptive learning engine.
//
// Everything the user is trying to retain — a memorised ayah, a dua, one of
// the 99 Names, a quiz fact — is a *card* scheduled by a spaced-repetition
// algorithm (SM-2, with the adjustments noted below). The engine owns three
// things:
//
//   1. Scheduling  — when each card is next due.
//   2. Mastery     — how well the user knows a card, a topic, the whole path.
//   3. Guidance    — what to study next, given prerequisites and weak topics.
//
// State is local-first (AsyncStorage) so review works with no connection, and
// is shaped to sync cleanly: every card is an independent last-write-wins
// record keyed by a stable id.

import storage from './storage';

const CARDS_KEY = 'learn_cards';
const LOG_KEY = 'learn_log';
const PROFILE_KEY = 'learn_profile';

/** How many days of review history to keep for the streak/heatmap. */
const LOG_DAYS = 400;

export const TOPICS = {
  quran: { label: 'Quran', icon: 'book', color: '#d4af37' },
  hadith: { label: 'Hadith', icon: 'shield-checkmark', color: '#10b981' },
  dua: { label: 'Duas & Adhkar', icon: 'heart', color: '#ec4899' },
  names: { label: '99 Names', icon: 'star', color: '#f59e0b' },
  seerah: { label: 'Seerah', icon: 'person', color: '#3b82f6' },
  fiqh: { label: 'Fiqh', icon: 'school', color: '#06b6d4' },
  aqeedah: { label: 'Aqeedah', icon: 'shield', color: '#8b5cf6' },
  arabic: { label: 'Arabic', icon: 'language', color: '#ef4444' },
};

/**
 * Grades the user can give themselves after seeing the answer. These map onto
 * SM-2's 0-5 quality scale; four buttons is the most a phone screen can offer
 * without the choice itself becoming a chore.
 */
export const GRADES = {
  again: { quality: 0, label: 'Again', hint: 'Did not recall', color: '#ef4444' },
  hard: { quality: 3, label: 'Hard', hint: 'Recalled with effort', color: '#f59e0b' },
  good: { quality: 4, label: 'Good', hint: 'Recalled correctly', color: '#10b981' },
  easy: { quality: 5, label: 'Easy', hint: 'Instant recall', color: '#06b6d4' },
};

const DAY = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;
const START_EASE = 2.5;

const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((a - b) / DAY);

/** A brand-new card, due immediately. */
export function newCard(item) {
  return {
    id: item.id,
    type: item.type,
    topic: item.topic,
    ref: item.ref ?? null,
    ease: START_EASE,
    interval: 0,
    reps: 0,
    lapses: 0,
    streak: 0,
    due: Date.now(),
    lastReviewed: null,
    lastQuality: null,
    // Total time spent, in ms — feeds the "difficult for you" signal, which
    // catches cards the user technically passes but always struggles over.
    totalMs: 0,
  };
}

/**
 * SM-2 with three deliberate departures:
 *
 *  - A lapse halves the interval rather than resetting to zero. Resetting a
 *    long-held ayah to day one after a single slip is punishing enough that
 *    people abandon the habit, which is the real failure mode here.
 *  - Intervals get ±15% jitter so a big import doesn't produce a cliff of
 *    hundreds of cards all falling due on the same morning.
 *  - Ease is floored at 1.3 as in the original, but "Hard" nudges it down
 *    without counting as a lapse.
 *
 * @returns {object} the updated card (pure — does not persist).
 */
export function schedule(card, quality, elapsedMs = 0) {
  const next = { ...card };
  const q = Math.max(0, Math.min(5, quality));

  next.ease = Math.max(MIN_EASE, next.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  next.totalMs = (next.totalMs || 0) + elapsedMs;
  next.lastQuality = q;
  next.lastReviewed = Date.now();

  if (q < 3) {
    next.lapses += 1;
    next.reps = 0;
    next.streak = 0;
    next.interval = Math.max(1, Math.round((next.interval || 1) * 0.5));
  } else {
    next.reps += 1;
    next.streak += 1;
    if (next.reps === 1) next.interval = 1;
    else if (next.reps === 2) next.interval = 6;
    else next.interval = Math.round(next.interval * next.ease);
  }

  // Spread the load: ±15% so batches don't clump on one day.
  const jitter = 1 + (Math.random() * 0.3 - 0.15);
  const days = Math.max(1, Math.round(next.interval * jitter));
  next.due = Date.now() + days * DAY;
  next.interval = days;

  return next;
}

/**
 * Mastery of a single card, 0..1.
 *
 * Interval is the honest signal — a card you can still recall after two months
 * is genuinely known — but it's tempered by lapses so a card that keeps
 * breaking never reads as mastered.
 */
export function cardMastery(card) {
  if (!card.reps) return 0;
  const byInterval = Math.min(1, Math.log2(1 + card.interval) / Math.log2(1 + 60));
  const reliability = card.reps / (card.reps + card.lapses * 2);
  return Math.max(0, Math.min(1, byInterval * 0.7 + reliability * 0.3));
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

async function readCards() {
  return storage.getObject(CARDS_KEY, {});
}

async function writeCards(cards) {
  return storage.setJSON(CARDS_KEY, cards);
}

export const learning = {
  /** Every card, as an id-keyed object. */
  async all() {
    return readCards();
  },

  /**
   * Registers items as cards, skipping any that already exist so progress is
   * never clobbered when a deck is re-seeded.
   * @returns {Promise<number>} how many were newly added.
   */
  async enroll(items) {
    const cards = await readCards();
    let added = 0;
    for (const item of items) {
      if (!cards[item.id]) {
        cards[item.id] = newCard(item);
        added += 1;
      }
    }
    if (added) await writeCards(cards);
    return added;
  },

  async remove(ids) {
    const cards = await readCards();
    ids.forEach(id => delete cards[id]);
    await writeCards(cards);
  },

  /**
   * Cards due now, hardest-first so the user meets the material they are
   * actually struggling with while their attention is freshest.
   * @param {object} [opts]
   * @param {number} [opts.limit=20]
   * @param {string} [opts.topic] restrict to one topic
   */
  async due({ limit = 20, topic } = {}) {
    const cards = Object.values(await readCards());
    const now = Date.now();
    return cards
      .filter(c => c.due <= now && (!topic || c.topic === topic))
      .sort((a, b) => cardMastery(a) - cardMastery(b) || a.due - b.due)
      .slice(0, limit);
  },

  /** Cards never studied — the "learn something new" queue. */
  async fresh({ limit = 10, topic } = {}) {
    const cards = Object.values(await readCards());
    return cards.filter(c => c.reps === 0 && (!topic || c.topic === topic)).slice(0, limit);
  },

  /**
   * Records one review and advances the schedule.
   * @param {string} id card id
   * @param {keyof GRADES|number} grade a GRADES key or a raw 0-5 quality
   */
  async review(id, grade, elapsedMs = 0) {
    const cards = await readCards();
    const card = cards[id];
    if (!card) return null;

    const quality = typeof grade === 'number' ? grade : (GRADES[grade]?.quality ?? 4);
    cards[id] = schedule(card, quality, elapsedMs);
    await writeCards(cards);
    await appendLog(quality >= 3);
    return cards[id];
  },

  /** Per-topic and overall progress, for the dashboard. */
  async stats() {
    const cards = Object.values(await readCards());
    const now = Date.now();

    const byTopic = {};
    for (const key of Object.keys(TOPICS)) {
      byTopic[key] = { total: 0, due: 0, learned: 0, mastered: 0, mastery: 0 };
    }

    for (const c of cards) {
      const t = byTopic[c.topic] || (byTopic[c.topic] = { total: 0, due: 0, learned: 0, mastered: 0, mastery: 0 });
      const m = cardMastery(c);
      t.total += 1;
      t.mastery += m;
      if (c.due <= now) t.due += 1;
      if (c.reps > 0) t.learned += 1;
      if (m >= 0.8) t.mastered += 1;
    }

    for (const t of Object.values(byTopic)) {
      t.mastery = t.total ? t.mastery / t.total : 0;
    }

    const total = cards.length;
    const overall = total ? cards.reduce((s, c) => s + cardMastery(c), 0) / total : 0;

    return {
      total,
      due: cards.filter(c => c.due <= now).length,
      learned: cards.filter(c => c.reps > 0).length,
      mastered: cards.filter(c => cardMastery(c) >= 0.8).length,
      overall,
      byTopic,
      streak: await currentStreak(),
    };
  },

  /**
   * What to do next. Ordered by what will help most: clear the backlog first,
   * then shore up the weakest topic, then introduce new material.
   * @returns {Promise<Array<{kind, topic, title, detail, count}>>}
   */
  async recommendations({ limit = 3 } = {}) {
    const stats = await this.stats();
    const out = [];

    if (stats.due > 0) {
      out.push({
        kind: 'review',
        topic: null,
        title: `${stats.due} card${stats.due === 1 ? '' : 's'} due`,
        detail: 'Reviewing on time is what makes memorisation stick.',
        count: stats.due,
      });
    }

    // Weakest topic that has material but isn't yet solid.
    const weak = Object.entries(stats.byTopic)
      .filter(([, t]) => t.total >= 3 && t.learned > 0 && t.mastery < 0.6)
      .sort((a, b) => a[1].mastery - b[1].mastery)[0];

    if (weak) {
      const [key, t] = weak;
      out.push({
        kind: 'strengthen',
        topic: key,
        title: `Strengthen ${TOPICS[key]?.label || key}`,
        detail: `${Math.round(t.mastery * 100)}% mastered — your weakest area right now.`,
        count: t.total - t.mastered,
      });
    }

    const unseen = Object.entries(stats.byTopic)
      .filter(([, t]) => t.total > t.learned)
      .sort((a, b) => b[1].total - b[1].learned - (a[1].total - a[1].learned))[0];

    if (unseen && out.length < limit) {
      const [key, t] = unseen;
      out.push({
        kind: 'learn',
        topic: key,
        title: `Learn new ${TOPICS[key]?.label || key}`,
        detail: `${t.total - t.learned} not started yet.`,
        count: t.total - t.learned,
      });
    }

    return out.slice(0, limit);
  },

  /** Day-by-day review counts, newest last — drives the activity heatmap. */
  async history(days = 30) {
    const log = await storage.getObject(LOG_KEY, {});
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
      out.push({ date: d, ...(log[d] || { reviews: 0, correct: 0 }) });
    }
    return out;
  },

  /** Learner-set preferences (daily goal, etc.). */
  async profile() {
    return storage.getObject(PROFILE_KEY, { dailyGoal: 20, level: 'beginner', completed: {} });
  },

  async setProfile(updates) {
    return storage.updateObject(PROFILE_KEY, updates);
  },

  /** Marks a curriculum lesson complete. Persisted, unlike the old checklist. */
  async completeLesson(lessonId, done = true) {
    const p = await this.profile();
    const completed = { ...p.completed };
    if (done) completed[lessonId] = new Date().toISOString();
    else delete completed[lessonId];
    await this.setProfile({ completed });
    return completed;
  },

  async reset() {
    await Promise.all([storage.remove(CARDS_KEY), storage.remove(LOG_KEY), storage.remove(PROFILE_KEY)]);
  },
};

// ---------------------------------------------------------------------------
// Review log / streak
// ---------------------------------------------------------------------------

async function appendLog(wasCorrect) {
  const log = await storage.getObject(LOG_KEY, {});
  const d = today();
  const entry = log[d] || { reviews: 0, correct: 0 };
  entry.reviews += 1;
  if (wasCorrect) entry.correct += 1;
  log[d] = entry;

  // Trim anything older than the retention window.
  const cutoff = new Date(Date.now() - LOG_DAYS * DAY).toISOString().slice(0, 10);
  for (const key of Object.keys(log)) {
    if (key < cutoff) delete log[key];
  }
  await storage.setJSON(LOG_KEY, log);
}

/**
 * Consecutive days with at least one review. Today not yet being reviewed does
 * not break the streak — the day isn't over.
 */
export async function currentStreak() {
  const log = await storage.getObject(LOG_KEY, {});
  let streak = 0;
  const start = new Date();

  if (!log[today()]) start.setTime(start.getTime() - DAY);

  for (let i = 0; i < LOG_DAYS; i++) {
    const d = new Date(start.getTime() - i * DAY).toISOString().slice(0, 10);
    if (log[d]?.reviews > 0) streak += 1;
    else break;
  }
  return streak;
}

export { daysBetween };
export default learning;
