// On-device AI usage counters.
//
// This records how the assistant answered — live Claude, the offline knowledge
// base, a Quran search, or a failure — so Settings can show an honest usage
// summary. It never sends anything anywhere: the numbers live in AsyncStorage
// with the rest of the local data and can be reset from Settings.
//
// No question text, topic or answer is stored here; only counts by source and
// day.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AI_USAGE_STORAGE_KEY = 'qitab_ai_usage_v1';

// A year of daily buckets is more than the summary needs, and keeps the stored
// object small on old devices.
const MAX_DAYS = 400;
const WEEK_DAYS = 7;

/** Local calendar day, not UTC, so "today" matches the user's clock. */
export function usageDayKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Which counter an assistant source belongs to. */
export function classifyAISource(source) {
  const value = String(source || '');
  if (value.startsWith('claude')) return 'live';
  if (value === 'offline' || value === 'offline+quran') return 'offline';
  return 'other';
}

const emptyUsage = () => ({ total: 0, bySource: {}, byDay: {}, lastAskedAt: null });

function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return emptyUsage();

  const bySource = {};
  if (raw.bySource && typeof raw.bySource === 'object') {
    for (const [key, value] of Object.entries(raw.bySource)) {
      const count = Number(value);
      if (key && Number.isFinite(count) && count > 0) bySource[key] = Math.round(count);
    }
  }

  const byDay = {};
  if (raw.byDay && typeof raw.byDay === 'object') {
    for (const [key, value] of Object.entries(raw.byDay)) {
      const count = Number(value);
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(count) && count > 0) {
        byDay[key] = Math.round(count);
      }
    }
  }

  const total = Number(raw.total);
  return {
    total: Number.isFinite(total) && total > 0 ? Math.round(total) : 0,
    bySource,
    byDay,
    lastAskedAt: Number.isFinite(Date.parse(raw.lastAskedAt)) ? raw.lastAskedAt : null,
  };
}

async function readUsage() {
  try {
    const raw = await AsyncStorage.getItem(AI_USAGE_STORAGE_KEY);
    if (!raw) return emptyUsage();
    return sanitize(JSON.parse(raw));
  } catch {
    return emptyUsage();
  }
}

/** Drop day buckets older than the retention window. */
function pruneDays(byDay) {
  const keys = Object.keys(byDay).sort();
  if (keys.length <= MAX_DAYS) return byDay;
  const keep = new Set(keys.slice(-MAX_DAYS));
  return Object.fromEntries(Object.entries(byDay).filter(([key]) => keep.has(key)));
}

/**
 * Count one answered question. Failures to persist are swallowed: usage
 * statistics must never interfere with asking the assistant.
 */
export async function recordAIUsage(source, now = new Date()) {
  const usage = await readUsage();
  const key = String(source || 'unavailable');
  const day = usageDayKey(now);

  usage.total += 1;
  usage.bySource[key] = (usage.bySource[key] || 0) + 1;
  usage.byDay[day] = (usage.byDay[day] || 0) + 1;
  usage.byDay = pruneDays(usage.byDay);
  usage.lastAskedAt = now.toISOString();

  try {
    await AsyncStorage.setItem(AI_USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // In-memory result is still returned for the caller.
  }

  return summarizeAIUsage(usage, now);
}

/** Aggregate counters for display, including the last seven local days. */
export function summarizeAIUsage(usage, now = new Date()) {
  const safe = sanitize(usage);
  let live = 0;
  let offline = 0;
  let other = 0;

  for (const [source, count] of Object.entries(safe.bySource)) {
    const bucket = classifyAISource(source);
    if (bucket === 'live') live += count;
    else if (bucket === 'offline') offline += count;
    else other += count;
  }

  let last7Days = 0;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let offset = 0; offset < WEEK_DAYS; offset += 1) {
    const day = new Date(today.getTime() - offset * 24 * 60 * 60 * 1000);
    last7Days += safe.byDay[usageDayKey(day)] || 0;
  }

  return {
    total: safe.total,
    live,
    offline,
    other,
    today: safe.byDay[usageDayKey(now)] || 0,
    last7Days,
    bySource: { ...safe.bySource },
    lastAskedAt: safe.lastAskedAt,
  };
}

export async function getAIUsage(now = new Date()) {
  return summarizeAIUsage(await readUsage(), now);
}

/** Clear the statistics; the assistant itself is unaffected. */
export async function resetAIUsage(now = new Date()) {
  try {
    await AsyncStorage.removeItem(AI_USAGE_STORAGE_KEY);
  } catch {
    // Nothing stored means the summary below is already empty.
  }
  return summarizeAIUsage(emptyUsage(), now);
}
