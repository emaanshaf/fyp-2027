// The learning path, as a prerequisite graph rather than a flat checklist.
//
// Each lesson declares what it depends on, so the path unlocks in an order
// that actually makes sense — you are not offered Hadith sciences before you
// can read Arabic script, and Hifz is gated behind correct recitation.
// `screen` points a lesson at the module that teaches it, so the path is a
// way into the app rather than a separate island of content.

export const LEVELS = [
  { id: 'beginner', name: 'Beginner', color: '#10b981', blurb: 'The foundations every Muslim needs.' },
  { id: 'intermediate', name: 'Intermediate', color: '#3b82f6', blurb: 'Deepening practice and understanding.' },
  { id: 'advanced', name: 'Advanced', color: '#8b5cf6', blurb: 'Study of the sciences and sustained memorisation.' },
];

/**
 * @typedef {object} Lesson
 * @property {string}   id
 * @property {string}   level
 * @property {string}   title
 * @property {string}   desc
 * @property {string}   icon      Ionicons name
 * @property {string[]} requires  ids of lessons that must be done first
 * @property {string}   [screen]  route to open for this lesson
 * @property {string}   [deck]    deck to enroll when the lesson starts
 * @property {string}   [topic]   learning-engine topic this contributes to
 * @property {number}   minutes   rough time to work through it
 */
export const LESSONS = [
  // ── Beginner ──────────────────────────────────────────────────────────────
  {
    id: 'shahadah', level: 'beginner', title: 'The Shahadah',
    desc: 'The declaration of faith and what accepting it means.',
    icon: 'heart', requires: [], topic: 'aqeedah', minutes: 10,
  },
  {
    id: 'pillars-islam', level: 'beginner', title: 'The Five Pillars',
    desc: 'Shahadah, Salah, Zakat, Sawm and Hajj.',
    icon: 'build', requires: ['shahadah'], topic: 'aqeedah', minutes: 15,
  },
  {
    id: 'pillars-iman', level: 'beginner', title: 'The Six Articles of Faith',
    desc: 'What a Muslim believes about Allah, angels, books, messengers, the Last Day and divine decree.',
    icon: 'shield', requires: ['shahadah'], topic: 'aqeedah', minutes: 15,
  },
  {
    id: 'wudu', level: 'beginner', title: 'How to Perform Wudu',
    desc: 'Step-by-step purification before prayer.',
    icon: 'water', requires: ['pillars-islam'], topic: 'fiqh', minutes: 10,
  },
  {
    id: 'salah', level: 'beginner', title: 'How to Pray (Salah)',
    desc: 'The five daily prayers, rak\'ah by rak\'ah.',
    icon: 'hand-left', requires: ['wudu'], screen: 'PrayerTracker', topic: 'fiqh', minutes: 25,
  },
  {
    id: 'names', level: 'beginner', title: 'The 99 Names of Allah',
    desc: 'Learn Allah\'s names and their meanings.',
    icon: 'star', requires: ['shahadah'], screen: 'NamesOfAllah', deck: 'names',
    topic: 'names', minutes: 30,
  },
  {
    id: 'daily-duas', level: 'beginner', title: 'Daily Adhkar & Duas',
    desc: 'Supplications for morning, evening, sleep and travel.',
    icon: 'heart-circle', requires: ['salah'], screen: 'Duas', deck: 'duas',
    topic: 'dua', minutes: 20,
  },
  {
    id: 'recitation', level: 'beginner', title: 'Basic Quran Recitation',
    desc: 'Reading the Arabic script with correct pronunciation.',
    icon: 'book', requires: ['salah'], screen: 'Quran', topic: 'quran', minutes: 40,
  },

  // ── Intermediate ──────────────────────────────────────────────────────────
  {
    id: 'seerah', level: 'intermediate', title: 'Seerah of the Prophet ﷺ',
    desc: 'The life of the final messenger, from birth to the Farewell Sermon.',
    icon: 'person', requires: ['pillars-iman'], screen: 'Seerah', topic: 'seerah', minutes: 45,
  },
  {
    id: 'prophets', level: 'intermediate', title: 'Stories of the Prophets',
    desc: 'The messengers named in the Quran and the lesson each life carries.',
    icon: 'people', requires: ['pillars-iman'], screen: 'Prophets', topic: 'seerah', minutes: 40,
  },
  {
    id: 'juz-amma', level: 'intermediate', title: 'Memorise Juz Amma',
    desc: 'The last thirty-seventh of the Quran — the short surahs used in daily prayer.',
    icon: 'mic', requires: ['recitation'], screen: 'Hifz', topic: 'quran', minutes: 90,
  },
  {
    id: 'zakat', level: 'intermediate', title: 'Zakat & Sadaqah',
    desc: 'Who pays, on what, and how much.',
    icon: 'cash', requires: ['pillars-islam'], screen: 'Zakat', topic: 'fiqh', minutes: 25,
  },
  {
    id: 'adab', level: 'intermediate', title: 'Islamic Etiquette (Adab)',
    desc: 'Manners in speech, eating, visiting and dealing with others.',
    icon: 'people-circle', requires: ['daily-duas'], topic: 'fiqh', minutes: 25,
  },
  {
    id: 'tafsir-basics', level: 'intermediate', title: 'Understanding Tafsir',
    desc: 'How scholars explain a verse, and how to read commentary well.',
    icon: 'search', requires: ['recitation'], screen: 'Tafsir', topic: 'quran', minutes: 35,
  },
  {
    id: 'quiz-knowledge', level: 'intermediate', title: 'Test Your Knowledge',
    desc: 'Check what has actually stuck across every topic so far.',
    icon: 'help-circle', requires: ['seerah', 'zakat'], screen: 'Quiz', deck: 'knowledge',
    topic: 'quran', minutes: 15,
  },

  // ── Advanced ──────────────────────────────────────────────────────────────
  {
    id: 'aqeedah', level: 'advanced', title: 'Aqeedah in Depth',
    desc: 'Tawhid, its categories, and what negates it.',
    icon: 'school', requires: ['pillars-iman', 'seerah'], topic: 'aqeedah', minutes: 60,
  },
  {
    id: 'hadith-sciences', level: 'advanced', title: 'Hadith Sciences',
    desc: 'Chains of narration, grading, and how authenticity is established.',
    icon: 'library', requires: ['seerah'], screen: 'HadithVerify', topic: 'hadith', minutes: 60,
  },
  {
    id: 'fiqh', level: 'advanced', title: 'Fiqh Essentials',
    desc: 'The sources of law and how rulings are derived.',
    icon: 'document-text', requires: ['zakat', 'adab'], topic: 'fiqh', minutes: 60,
  },
  {
    id: 'arabic', level: 'advanced', title: 'Classical Arabic',
    desc: 'Enough grammar and vocabulary to follow the text unaided.',
    icon: 'language', requires: ['recitation'], topic: 'arabic', minutes: 120,
  },
  {
    id: 'hifz', level: 'advanced', title: 'Quran Memorisation (Hifz)',
    desc: 'A sustained, scheduled memorisation plan.',
    icon: 'mic-circle', requires: ['juz-amma', 'tafsir-basics'], screen: 'Hifz',
    topic: 'quran', minutes: 240,
  },
  {
    id: 'tazkiyah', level: 'advanced', title: 'Tazkiyah (Purification of the Self)',
    desc: 'Working on sincerity, humility and the diseases of the heart.',
    icon: 'flower', requires: ['aqeedah'], screen: 'Journal', topic: 'aqeedah', minutes: 60,
  },
];

export const lessonById = id => LESSONS.find(l => l.id === id);

/**
 * Annotates every lesson with its unlock state given what's been completed.
 * A lesson is unlocked once all of its prerequisites are done.
 * @param {Record<string, string>} completed map of lessonId -> ISO timestamp
 */
export function withProgress(completed = {}) {
  return LESSONS.map(lesson => {
    const missing = lesson.requires.filter(r => !completed[r]);
    return {
      ...lesson,
      done: Boolean(completed[lesson.id]),
      unlocked: missing.length === 0,
      missing,
      blockedBy: missing.map(id => lessonById(id)?.title).filter(Boolean),
    };
  });
}

/** Per-level completion, for the level tabs. */
export function levelProgress(completed = {}) {
  return LEVELS.map(level => {
    const lessons = LESSONS.filter(l => l.level === level.id);
    const done = lessons.filter(l => completed[l.id]).length;
    return {
      ...level,
      done,
      total: lessons.length,
      pct: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
    };
  });
}

/**
 * The single lesson to do next: the first unlocked, unfinished lesson in
 * level order. Returns null once the whole path is complete.
 */
export function nextLesson(completed = {}) {
  const order = { beginner: 0, intermediate: 1, advanced: 2 };
  return (
    withProgress(completed)
      .filter(l => l.unlocked && !l.done)
      .sort((a, b) => order[a.level] - order[b.level])[0] || null
  );
}

export default LESSONS;
