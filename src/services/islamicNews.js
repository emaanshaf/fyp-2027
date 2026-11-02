// Islamic news for the app.
//
// The server does the feed fetching and normalising; this layer adds the two
// things a phone needs: a stale-while-revalidate cache so the last headlines
// survive a lost connection, and a local saved-stories list that works
// entirely offline.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../config/appConfig';
import { cached, TTL } from './cache';

const CACHE_KEY = 'islamic-news';
const SAVED_KEY = 'qitab_news_saved_v1';
const MAX_ITEMS = 60;
const MAX_SAVED = 100;
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Presentation metadata for sources this build knows about.
 *
 * The server is authoritative for which sources exist and their names; this
 * list only supplies a theme accent and a sensible label for saved stories
 * when a source is temporarily unreachable.
 */
export const NEWS_SOURCES = [
  { id: 'al-jazeera', name: 'Al Jazeera', accent: 'amber' },
  { id: 'middle-east-eye', name: 'Middle East Eye', accent: 'cyan' },
  { id: 'middle-east-monitor', name: 'Middle East Monitor', accent: 'emerald' },
  { id: 'guardian-islam', name: 'The Guardian · Islam', accent: 'blue' },
  { id: 'about-islam', name: 'About Islam', accent: 'gold' },
  { id: 'religion-news', name: 'Religion News Service', accent: 'purple' },
];

const ACCENT_BY_SOURCE = Object.fromEntries(
  NEWS_SOURCES.map(source => [source.id, source.accent])
);

/** Theme token for a source dot, falling back to the feature's own accent. */
export const newsAccent = sourceId => ACCENT_BY_SOURCE[sourceId] || 'cyan';

const cleanText = (value, max) => {
  const text = String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return max && text.length > max ? `${text.slice(0, max).trim()}…` : text;
};

const cleanUrl = value => {
  const url = String(value ?? '').trim();
  return /^https?:\/\/[^\s]+$/i.test(url) ? url : null;
};

/** Short label list from the server's text-mining pass, deduplicated. */
const cleanLabels = (value, maxLength, limit) => {
  if (!Array.isArray(value)) return [];
  const labels = [];
  for (const raw of value) {
    const label = cleanText(raw, maxLength);
    if (!label) continue;
    if (labels.some(existing => existing.toLowerCase() === label.toLowerCase())) continue;
    labels.push(label);
    if (labels.length === limit) break;
  }
  return labels;
};

const cleanDate = value => {
  if (!value) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  if (time > Date.now() + 24 * 60 * 60 * 1000) return null;
  return new Date(time).toISOString();
};

function normalizeSource(raw, fallbackId) {
  if (!raw || typeof raw !== 'object') return null;
  const id = cleanText(raw.id || fallbackId, 60);
  if (!id) return null;
  const known = NEWS_SOURCES.find(source => source.id === id);
  return {
    id,
    name: cleanText(raw.name, 80) || known?.name || id,
    homepage: cleanUrl(raw.homepage),
  };
}

/** A single story from the API, or null when required fields are unusable. */
export function normalizeNewsItem(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const url = cleanUrl(raw.url);
  const title = cleanText(raw.title, 240);
  if (!url || !title) return null;

  return {
    // The article URL is the stable identity across refreshes; a non-URL id
    // from a feed must not create a second copy of the same story.
    id: cleanUrl(raw.id) || url,
    title,
    summary: cleanText(raw.summary, 500),
    url,
    image: cleanUrl(raw.image),
    publishedAt: cleanDate(raw.publishedAt),
    categories: Array.isArray(raw.categories)
      ? raw.categories.map(value => cleanText(value, 40)).filter(Boolean).slice(0, 4)
      : [],
    // Deterministic text mining done by the server: descriptive words for the
    // card plus the matched topic labels used for trending filters.
    keywords: cleanLabels(raw.keywords, 30, 4),
    topics: cleanLabels(raw.topics, 40, 3),
    source: normalizeSource(raw.source) || {
      id: 'unknown',
      name: 'News source',
      homepage: null,
    },
  };
}

/**
 * Defensive normalisation of the API payload. A malformed row is dropped, not
 * rendered as a broken card.
 */
export function normalizeNewsPayload(data) {
  const items = Array.isArray(data?.items)
    ? data.items.map(normalizeNewsItem).filter(Boolean).slice(0, MAX_ITEMS)
    : [];

  const sources = Array.isArray(data?.sources)
    ? data.sources
      .map(raw => {
        const source = normalizeSource(raw);
        if (!source) return null;
        return {
          ...source,
          ok: raw.ok !== false,
          stale: raw.stale === true,
          count: Number.isFinite(Number(raw.count)) ? Number(raw.count) : 0,
          // A fallback route means the publisher's own feed was unreachable.
          via: raw.via === 'fallback' ? 'fallback' : 'direct',
        };
      })
      .filter(Boolean)
    : [];

  const trending = Array.isArray(data?.trending)
    ? data.trending
      .map(raw => {
        const label = cleanText(raw?.label, 40);
        if (!label) return null;
        const count = Number(raw?.count);
        return {
          id: cleanText(raw?.id, 60) || label.toLowerCase(),
          label,
          kind: raw?.kind === 'keyword' ? 'keyword' : 'topic',
          count: Number.isFinite(count) && count > 0 ? Math.round(count) : 0,
        };
      })
      .filter(Boolean)
      .slice(0, 8)
    : [];

  return {
    items,
    sources,
    trending,
    fetchedAt: cleanDate(data?.fetchedAt),
    partial: data?.partial === true,
    stale: data?.stale === true,
  };
}

/**
 * Fetch the latest headlines, served from the cache when possible.
 *
 * `forceRefresh` is pull-to-refresh: it asks the server to re-poll the feeds,
 * and still falls back to the previous snapshot if that attempt fails.
 */
export async function fetchIslamicNews({ forceRefresh = false } = {}) {
  const payload = await cached(
    CACHE_KEY,
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(`${apiUrl}/news?limit=${MAX_ITEMS}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          const failure = new Error(`News request failed (HTTP ${response.status})`);
          failure.status = response.status;
          throw failure;
        }

        return normalizeNewsPayload(await response.json());
      } finally {
        clearTimeout(timer);
      }
    },
    { ttl: TTL.SHORT, forceRefresh }
  );

  // A cache entry written by an older build can lack fields added since (the
  // trending list, keyword tags). Normalising again on the way out means the
  // screen can rely on one shape whether the payload came from the network or
  // from disk.
  return normalizeNewsPayload(payload);
}

async function readSaved() {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeNewsItem).filter(Boolean).slice(0, MAX_SAVED);
  } catch {
    return [];
  }
}

async function writeSaved(items) {
  try {
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Could not persist saved news:', error?.message);
  }
  return items;
}

/** Stories the reader has bookmarked, newest first. */
export const getSavedNews = readSaved;

/** Save a story, replacing an older copy with the same id. */
export async function saveNewsItem(item) {
  const story = normalizeNewsItem(item);
  if (!story) return readSaved();

  const current = await readSaved();
  const next = [story, ...current.filter(saved => saved.id !== story.id)].slice(0, MAX_SAVED);
  return writeSaved(next);
}

export async function removeSavedNews(id) {
  const current = await readSaved();
  return writeSaved(current.filter(item => item.id !== id));
}

/** Returns the updated list and whether the story is now saved. */
export async function toggleSavedNews(item) {
  const story = normalizeNewsItem(item);
  if (!story) return { items: await readSaved(), saved: false };

  const current = await readSaved();
  const exists = current.some(saved => saved.id === story.id);
  if (exists) {
    return { items: await removeSavedNews(story.id), saved: false };
  }
  return { items: await saveNewsItem(story), saved: true };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Compact publication time for a card, e.g. "12m ago" or "24 Oct 2026". */
export function newsTimeAgo(value, now = Date.now()) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return '';

  const diff = Math.max(0, now - time);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  const date = new Date(time);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
