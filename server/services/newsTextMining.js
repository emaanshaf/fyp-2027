// Deterministic text mining for the news feed.
//
// The News screen has no AI summarisation (see docs/AI_USAGE.md), so the
// "trending" line is produced with plain lexical analysis: stop-word removal,
// a curated topic lexicon and term frequency over the latest headlines.
// The result is explainable — a term appears because it literally occurs in
// several stories — and works without a key, a model or a connection beyond
// the feed fetch itself.
//
// Only headline, summary and category text is mined. Full articles are never
// downloaded; the reader still opens the publisher's page.

const STOP_WORDS = new Set(
  `a about above after again against all also am amid among an and any are as at
  be because been before being below between both but by came can cannot could
  did do does doing done down during each even ever every few first for from
  further had has have having he her here hers herself him himself his how i if
  in into is it its itself just last least less like made make many may me might
  more most much must my myself near need new next no nor not now of off often
  on once one only or other others our ours ourselves out over own past per
  perhaps put said same say says second she should since so some such than that
  the their theirs them themselves then there these they this those though
  three through thus to too two under until up upon us very via was we well
  were what when where whether which while who whom why will with within without
  would year years day days week weeks month months today yesterday tomorrow
  time times report reports reported story stories latest breaking news world
  according told tells added adds urged warns warned calls called plans plan set
  gets get got give gives given take takes taken come comes came go goes went
  still back just also even now also new first last top live update updates
  updated exclusive video photos watch opinion analysis explainer explain
  islam islamic muslim muslims aljazeera jazeera guardian religion monitor eye
  middle east aboutislam middleeast agency agencies anadolu reuters afp
  associated press photo photos file caption image images subscribe newsletter
  click follow share read monday tuesday wednesday thursday friday saturday
  sunday january february march april may june july august september october
  november december`
    .split(/\s+/)
    .filter(Boolean)
);

/**
 * Curated lexicons. A story is tagged with a topic when any of its patterns
 * appear in the title, summary or categories. Labels are English because the
 * module chrome follows the app's English naming policy.
 */
const TOPIC_RULES = [
  { id: 'gaza', label: 'Gaza', pattern: /\bgaza|rafah|khan younis\b/i },
  {
    id: 'palestine',
    label: 'Palestine',
    pattern: /\bpalestin\w*|west bank|jerusalem|al[- ]?aqsa|intifada\b/i,
  },
  { id: 'ramadan', label: 'Ramadan', pattern: /\bramadan|iftar|suhoor|taraweeh|laylat\b/i },
  { id: 'hajj', label: 'Hajj & Umrah', pattern: /\bhajj|umrah|pilgrims?\b/i },
  { id: 'eid', label: 'Eid', pattern: /\beid\b/i },
  { id: 'quran', label: 'Quran', pattern: /\bquran|qur'an|tafsir|surah|ayah|recitation\b/i },
  { id: 'hadith', label: 'Hadith', pattern: /\bhadith|sunnah|bukhari\b/i },
  { id: 'mosque', label: 'Mosques', pattern: /\bmosque|masjid|minaret|imam\b/i },
  { id: 'zakat', label: 'Zakat & charity', pattern: /\bzakat|sadaqah|charity|donations?\b/i },
  { id: 'hijab', label: 'Hijab & modesty', pattern: /\bhijab|niqab|headscarf|veil|modest\b/i },
  { id: 'sharia', label: 'Sharia & law', pattern: /\bsharia\w*|fatwa|islamic law\b/i },
  {
    id: 'education',
    label: 'Education',
    pattern: /\bschools?|universit\w*|students?|education|exams?|teachers?\b/i,
  },
  {
    id: 'economy',
    label: 'Economy',
    pattern: /\beconom\w*|inflation|markets?|trade|currency|prices?|oil\b/i,
  },
  {
    id: 'conflict',
    label: 'Conflict & aid',
    pattern: /\bwar|ceasefire|conflict|airstrikes?|attacks?|refugees?|humanitarian|\baid\b|siege\b/i,
  },
  {
    id: 'politics',
    label: 'Politics',
    pattern: /\belections?|parliament|government|ministers?|president|vote|votes\b/i,
  },
  {
    id: 'climate',
    label: 'Climate',
    pattern: /\bclimate|floods?|drought|heatwave|earthquakes?|storms?\b/i,
  },
  {
    id: 'technology',
    label: 'Technology',
    pattern: /\btechnolog\w*|digital|artificial intelligence|\bai\b|social media|internet\b/i,
  },
];

const MAX_KEYWORDS_PER_STORY = 4;
const MAX_TOPICS_PER_STORY = 3;
const MAX_TRENDING = 8;

const lower = value => String(value ?? '').toLowerCase().replace(/[\u2019]/g, "'");

/**
 * Stop-word-free words from a piece of text. Keeps only plain tokens: URLs,
 * numbers and punctuation are dropped, as is anything shorter than three
 * characters.
 */
function tokenize(text, maxWords = 400) {
  const words = lower(text)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/['"]s\b/g, '')
    // Contractions must not leave a fragment behind: "doesn't" would tokenize
    // to "doesn", which then shows up as a trending keyword.
    .replace(/n't\b/g, '')
    .split(/[^a-z0-9]+/)
    .filter(
      word =>
        word.length >= 3 &&
        word.length <= 24 &&
        !/^\d+$/.test(word) &&
        !STOP_WORDS.has(word)
    );

  return words.slice(0, maxWords);
}

const titleCase = token => token.charAt(0).toUpperCase() + token.slice(1);

/** Topic labels present in one story's combined text. */
function matchTopics(text) {
  const topics = [];
  for (const rule of TOPIC_RULES) {
    if (rule.pattern.test(text)) topics.push(rule.label);
    if (topics.length === MAX_TOPICS_PER_STORY) break;
  }
  return topics;
}

/**
 * Distinctive words for one story. Title words count double because a
 * headline is the strongest signal; a summary-only word must otherwise appear
 * twice to qualify. Stop words and publisher boilerplate never qualify.
 */
function extractKeywords(item, extraStop = STOP_WORDS) {
  const scores = new Map();

  const add = (token, points) => {
    if (extraStop.has(token)) return;
    scores.set(token, (scores.get(token) || 0) + points);
  };

  tokenize(item.title, 60).forEach(token => add(token, 2));
  tokenize(item.summary, 140).forEach(token => add(token, 1));

  return [...scores.entries()]
    .filter(([, score]) => score >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_KEYWORDS_PER_STORY)
    .map(([token]) => titleCase(token));
}

/**
 * Feed-wide trends: curated topics and frequent tokens, counted once per
 * story so one verbose article cannot dominate. A term must appear in at
 * least two stories, unless the feed is tiny.
 */
function buildTrending(items) {
  const topicCounts = new Map();
  const tokenCounts = new Map();
  const topicDetails = new Map(TOPIC_RULES.map(rule => [rule.id, rule]));

  for (const item of items) {
    const text = `${item.title} ${item.summary || ''} ${(item.categories || []).join(' ')}`;

    for (const rule of TOPIC_RULES) {
      if (!rule.pattern.test(text)) continue;
      topicCounts.set(rule.id, (topicCounts.get(rule.id) || 0) + 1);
    }

    const seen = new Set(
      tokenize(`${item.title} ${item.summary || ''}`, 180).filter(token => !STOP_WORDS.has(token))
    );
    for (const token of seen) {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    }
  }

  const topicLabels = new Set();
  const trending = [];

  for (const [id, count] of topicCounts) {
    const rule = topicDetails.get(id);
    if (!rule) continue;
    topicLabels.add(rule.label.toLowerCase());
    trending.push({ id: `topic:${id}`, label: rule.label, kind: 'topic', count });
  }

  for (const [token, count] of tokenCounts) {
    if (topicLabels.has(token)) continue; // already represented by a topic
    trending.push({ id: `term:${token}`, label: titleCase(token), kind: 'keyword', count });
  }

  const minimum = items.length <= 4 ? 1 : 2;
  return trending
    .filter(entry => entry.count >= minimum)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, MAX_TRENDING);
}

/**
 * Annotate stories with topics and keywords, and derive the feed-wide trends.
 * Returns a new array; the input is not mutated.
 */
function mineNews(items) {
  if (!Array.isArray(items) || !items.length) {
    return { items: [], trending: [] };
  }

  const annotated = items.map(item => {
    const text = `${item.title} ${item.summary || ''} ${(item.categories || []).join(' ')}`;
    return {
      ...item,
      keywords: extractKeywords(item),
      topics: matchTopics(text),
    };
  });

  return { items: annotated, trending: buildTrending(annotated) };
}

module.exports = {
  STOP_WORDS,
  TOPIC_RULES,
  tokenize,
  matchTopics,
  extractKeywords,
  buildTrending,
  mineNews,
};
