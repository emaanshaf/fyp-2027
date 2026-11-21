/**
 * The reminders that belong to today, shared by the in-app popup.
 *
 * The OS notifications scheduled in `services/notifications.js` can only fire
 * once per day. The popup on the main tabs is the in-app counterpart: it
 * re-checks every five minutes, so a reminder that was missed while the app
 * was closed still appears the next time the user looks at the app — and it
 * cannot fire at all without the app being open, which keeps the promise small.
 *
 * All times are minutes since local midnight; comparisons never cross a
 * midnight boundary because the list is rebuilt per day.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QURAN_PRESETS, parseTimeInput } from '../data/quranReminder';

export const REMINDER_POPUP_INTERVAL_MS = 5 * 60 * 1000;

export const CUSTOM_REMINDERS_KEY = 'qitab_reminders';
export const QURAN_SETTINGS_KEY = 'qitab_quran_reminder_settings';
export const REMINDER_POPUP_DISMISSED_KEY = 'qitab_reminder_popup_dismissed';

/** Local YYYY-MM-DD — `toISOString` would shift the day for many time zones. */
export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const minutesOfDay = ({ hour, minute }) => hour * 60 + minute;

/**
 * Custom reminders → normalised rows.
 * Corrupt rows (a bad stored time, a disabled entry) are skipped rather than
 * crashing the popup.
 */
export function customReminderRows(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const rows = [];
  for (const reminder of list) {
    if (!reminder || reminder.enabled === false) continue;
    const time = parseTimeInput(reminder.time);
    if (!time) continue;
    rows.push({
      key: `custom:${reminder.id}`,
      source: 'custom',
      title: reminder.title || 'Reminder',
      message: reminder.message || '',
      time,
    });
  }
  return rows;
}

/** Quran recitation slots → rows at the recitation time itself. */
export function quranReminderRows(raw) {
  if (!raw || raw.enabled === false) return [];
  const rows = [];
  const slots = Array.isArray(raw.slots) ? raw.slots : [];

  for (const preset of QURAN_PRESETS) {
    if (!slots.includes(preset.id)) continue;
    rows.push({
      key: `quran:${preset.id}`,
      source: 'quran',
      title: `Quran · ${preset.label}`,
      message: 'Take a few minutes with the mushaf.',
      time: { hour: preset.hour, minute: preset.minute },
    });
  }

  const custom = parseTimeInput(raw.customTime);
  if (custom) {
    rows.push({
      key: 'quran:custom',
      source: 'quran',
      title: 'Quran · your custom time',
      message: 'Take a few minutes with the mushaf.',
      time: custom,
    });
  }
  return rows;
}

/** Merge both sources into one list ordered by clock time. */
export function todaysReminderRows({ customRaw, quranRaw } = {}) {
  return [...customReminderRows(customRaw), ...quranReminderRows(quranRaw)]
    .sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time));
}

/**
 * Rows whose time has arrived. Once due, a reminder stays due for the rest of
 * the day: the card keeps returning every five minutes until the user acts on
 * it — marked done for today, or switched off in Reminders. The list is rebuilt
 * per day, so an unhandled reminder never fires a day late.
 */
export function dueReminderRows(rows, now = new Date()) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return rows.filter(row => minutesOfDay(row.time) <= nowMinutes);
}

/** Rows strictly ahead today (a due reminder is never also "later"). */
export function remainingReminderRows(rows, dismissed = new Set(), now = new Date()) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return rows.filter(row => minutesOfDay(row.time) > nowMinutes && !dismissed.has(row.key));
}

function parseJson(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Read both reminder sources from local storage. */
export async function loadTodaysReminders() {
  const [customRaw, quranRaw] = await Promise.all([
    AsyncStorage.getItem(CUSTOM_REMINDERS_KEY),
    AsyncStorage.getItem(QURAN_SETTINGS_KEY),
  ]);
  return todaysReminderRows({
    customRaw: parseJson(customRaw),
    quranRaw: parseJson(quranRaw),
  });
}

/**
 * Keys the user marked "done" today. Yesterday's list is discarded on read,
 * so a daily reminder speaks again tomorrow without any cleanup job.
 */
export async function loadDismissedKeys(now = new Date()) {
  const stored = parseJson(await AsyncStorage.getItem(REMINDER_POPUP_DISMISSED_KEY));
  if (!stored || stored.date !== localDateKey(now) || !Array.isArray(stored.keys)) {
    return new Set();
  }
  return new Set(stored.keys);
}

export async function dismissReminderKeys(keys, now = new Date()) {
  const existing = await loadDismissedKeys(now);
  for (const key of keys) existing.add(key);
  await AsyncStorage.setItem(
    REMINDER_POPUP_DISMISSED_KEY,
    JSON.stringify({ date: localDateKey(now), keys: [...existing] }),
  );
  return existing;
}

/** "7:30 AM" from a stored time, without pulling in Intl. */
export function formatReminderTime({ hour, minute }) {
  const h12 = hour % 12 || 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
