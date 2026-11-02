// Universal search across the app's own content.
//
// Two constraints shape this module:
//
// 1. It has to work offline. Everything bundled — modules, duas, the 99 names,
//    hadith, seerah, the prophets — is indexed locally. The Quran itself is
//    searched through quran.com when a connection exists, because shipping an
//    Arabic search index of the whole mus'haf would add megabytes to the app.
// 2. Arabic and Latin input both have to match. Arabic is written with
//    diacritics and interchangeable alef/ya/ta-marbuta forms, so a user typing
//    "الرحمن" must find "ٱلرَّحۡمَٰنُ"; English input must ignore case, accents
//    and apostrophes ("Qur'an" == "quran").
//
// The scoring is deliberately small and explainable: exact title beats prefix,
// prefix beats anywhere-in-title, and each matched term adds a field weight.
// No tokenizer library and no index file — the dataset is a few hundred items.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODULES, hasAccess } from '../config/routes';
import { DUAS } from '../data/duas';
import { ASMA_UL_HUSNA } from '../data/names';
import { DAILY_HADITH } from '../data/daily';
import { SEERAH_EVENTS } from '../data/seerah';
import { PROPHETS } from '../data/prophets';

export const RECENT_SEARCHES_KEY = 'qitab_search_recent';
export const MAX_RECENT_SEARCHES = 6;

export const SEARCH_GROUPS = {
  modules: { label: 'App', icon: 'grid-outline', accent: 'gold' },
  duas: { label: 'Duas', icon: 'heart-outline', accent: 'pink' },
  names: { label: 'Names', icon: 'sparkles-outline', accent: 'gold' },
  hadith: { label: 'Hadith', icon: 'shield-checkmark-outline', accent: 'emerald' },
  seerah: { label: 'Seerah', icon: 'footsteps-outline', accent: 'blue' },
  prophets: { label: 'Prophets', icon: 'people-outline', accent: 'purple' },
  quran: { label: 'Quran', icon: 'book-outline', accent: 'emerald' },
};

// Names users actually type for modules, beyond the module's own title.
const MODULE_KEYWORDS = {
  Quran: 'quran koran surah ayah recitation read listen mushaf',
  Prayer: 'salah salat namaz prayer times adhan fajr dhuhr asr maghrib isha',
  Duas: 'dua dua supplication adhkar azkar',
  PrayerTracker: 'salah tracker prayer log',
  Tasbih: 'tasbih dhikr counter subhanallah alhamdulillah',
  Qibla: 'qibla direction compass kaaba',
  Zakat: 'zakat ushr charity alms',
  Hadith: 'hadith sunnah bukhari muslim',
  HadithVerify: 'verify hadith authenticity grade',
  NamesOfAllah: 'asma ul husna names of allah',
  Calendar: 'hijri calendar islamic date',
  Reminders: 'reminder notification alarm',
  Bookmarks: 'bookmarks saved library',
  AIChat: 'ai assistant ask question',
  AIQuran: 'quran study quran search tafsir verses',
  Learning: 'learning course study',
  Journal: 'journal reflection diary',
  GoodDeeds: 'good deeds hasanat',
  Ramadan: 'ramadan fasting iftar suhoor',
  Hifz: 'hifz memorisation memorization',
  QuranJourney: 'quran journey progress',
  KhatmPlanner: 'khatm quran completion plan',
  Quiz: 'quiz questions',
  Seerah: 'seerah prophet muhammad life',
  Prophets: 'prophets stories',
  LearnWorship: 'wudhu salah kalima worship',
  Settings: 'settings preferences account',
  Generator: 'content creator',
  AdminPanel: 'admin dashboard',
};

const EXCLUDED_MODULES = new Set(['Search', 'ReviewSession', 'ApiConsole', 'Home']);

// Arabic diacritics, Quranic annotation marks and tatweel.
const ARABIC_MARKS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g;

/** Lowercase, strip Latin accents and Arabic marks, unify Arabic letter forms. */
export function normaliseText(value) {
  let text = String(value == null ? '' : value).toLowerCase();
  if (typeof text.normalize === 'function') {
    text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  }
  text = text
    .replace(ARABIC_MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

/** Query terms, or null when the query is too short to be useful. */
export function searchTerms(query) {
  const normalised = normaliseText(query);
  if (normalised.length < 2) return null;
  return { normalised, terms: normalised.split(' ').filter(Boolean) };
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildIndex() {
  const index = [];

  for (const mod of MODULES) {
    if (EXCLUDED_MODULES.has(mod.name)) continue;
    index.push({
      id: `module-${mod.name}`,
      group: 'modules',
      title: mod.title,
      subtitle: 'Open this section of the app',
      body: `${MODULE_KEYWORDS[mod.name] || ''} ${mod.name} ${mod.path}`,
      route: mod.name,
      roles: mod.roles,
      icon: mod.icon || 'grid-outline',
      accent: mod.accent || 'gold',
    });
  }

  for (const dua of DUAS) {
    index.push({
      id: `dua-${dua.id}`,
      group: 'duas',
      title: dua.title,
      subtitle: `${dua.category} · ${dua.translation}`,
      body: `${dua.transliteration || ''} ${dua.translation || ''} ${dua.benefit || ''}`,
      route: 'Duas',
      params: { id: dua.id },
      icon: 'heart-outline',
      accent: 'pink',
    });
  }

  for (const name of ASMA_UL_HUSNA) {
    index.push({
      id: `name-${name.id}`,
      group: 'names',
      title: name.name,
      subtitle: name.meaning,
      body: `${name.meaning || ''} ${name.desc || ''} ${name.arabic || ''}`,
      route: 'NamesOfAllah',
      params: { id: name.id },
      icon: 'sparkles-outline',
      accent: 'gold',
    });
  }

  DAILY_HADITH.forEach((hadith, i) => {
    index.push({
      id: `hadith-${i}`,
      group: 'hadith',
      title: hadith.reference || 'Hadith',
      subtitle: hadith.text,
      body: `${hadith.text || ''} ${hadith.collection || ''} ${hadith.book || ''} ${hadith.narrator || ''} ${hadith.grade || ''}`,
      route: 'Hadith',
      icon: 'shield-checkmark-outline',
      accent: 'emerald',
    });
  });

  SEERAH_EVENTS.forEach((event, i) => {
    index.push({
      id: `seerah-${i}`,
      group: 'seerah',
      title: event.title,
      subtitle: `${event.year} · ${event.period}`,
      body: event.desc || '',
      route: 'Seerah',
      icon: 'footsteps-outline',
      accent: event.color || 'blue',
    });
  });

  PROPHETS.forEach(prophet => {
    index.push({
      id: `prophet-${prophet.id}`,
      group: 'prophets',
      title: prophet.name,
      subtitle: prophet.title,
      body: `${prophet.desc || ''} ${prophet.lesson || ''}`,
      route: 'Prophets',
      params: { id: prophet.id },
      icon: 'people-outline',
      accent: prophet.color || 'purple',
    });
  });

  return index.map(item => ({
    ...item,
    searchTitle: normaliseText(item.title),
    searchSubtitle: normaliseText(item.subtitle),
    searchBody: normaliseText(item.body),
  }));
}

const INDEX = buildIndex();

function scoreItem(item, normalised, terms) {
  const title = item.searchTitle;
  const subtitle = item.searchSubtitle;
  const body = item.searchBody;
  const haystack = `${title} ${subtitle} ${body}`;
  if (!terms.every(term => haystack.includes(term))) return 0;

  let score = 0;
  if (title === normalised) score += 100;
  else if (title.startsWith(normalised)) score += 60;
  else if (title.includes(normalised)) score += 40;

  for (const term of terms) {
    if (title.includes(term)) score += 12;
    if (subtitle.includes(term)) score += 7;
    if (body.includes(term)) score += 3;
  }

  // A module with a matching name should win over a passing mention in a
  // long hadith or seerah paragraph.
  if (item.group === 'modules') score += 5;
  return score;
}

/**
 * Search all bundled content.
 *
 * @param {string} query
 * @param {{role?: string, limit?: number}} [options]
 * @returns {object[]} matching items, best first
 */
export function searchContent(query, { role = 'user', limit = 50 } = {}) {
  const parsed = searchTerms(query);
  if (!parsed) return [];

  const { normalised, terms } = parsed;
  const results = [];
  for (const item of INDEX) {
    if (item.roles && !hasAccess(role, item.route)) continue;
    const score = scoreItem(item, normalised, terms);
    if (score > 0) results.push({ ...item, score });
  }

  results.sort((a, b) => (
    b.score - a.score
    || a.title.length - b.title.length
    || a.title.localeCompare(b.title)
  ));

  return results.slice(0, limit).map(({ searchTitle, searchSubtitle, searchBody, ...item }) => item);
}

/** Map quran.com search results into the same result shape as local hits. */
export function mapQuranSearchResults(results = []) {
  const seen = new Set();
  const mapped = [];

  for (const result of Array.isArray(results) ? results : []) {
    const key = result?.verse_key;
    if (!key || !/^\d{1,3}:\d{1,3}$/.test(key) || seen.has(key)) continue;
    seen.add(key);

    const translation = stripHtml(result.translations?.[0]?.text);
    const [surah, ayah] = key.split(':').map(Number);
    if (!surah || !ayah) continue;

    mapped.push({
      id: `quran-${key}`,
      group: 'quran',
      title: `Quran ${key}`,
      subtitle: translation || 'Open this verse in the Quran reader',
      body: stripHtml(result.text || ''),
      route: 'Quran',
      params: { surah, ayah },
      icon: 'book-outline',
      accent: 'emerald',
    });
  }

  return mapped;
}

/** Recent queries, newest first. Never throws — storage is best-effort. */
export async function loadRecentSearches() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(item => typeof item === 'string' && item.trim()).slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

/** Store a query, de-duplicated case-insensitively, capped at six entries. */
export async function saveRecentSearch(query) {
  const trimmed = String(query || '').trim();
  if (trimmed.length < 2) return loadRecentSearches();

  const existing = await loadRecentSearches();
  const needle = trimmed.toLowerCase();
  const next = [
    trimmed,
    ...existing.filter(item => item.toLowerCase() !== needle),
  ].slice(0, MAX_RECENT_SEARCHES);

  try {
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // A full or unavailable store should never block a search.
  }
  return next;
}

export async function clearRecentSearches() {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // ignore
  }
  return [];
}

export default { searchContent, mapQuranSearchResults, normaliseText };
