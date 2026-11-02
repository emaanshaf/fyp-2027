/**
 * Quran recitation reminder configuration shared by the Reminders screen and
 * the notification service.
 *
 * A reminder is never delivered at the recitation time itself: it fires
 * QURAN_ADVANCE_MINUTES earlier, so the user has time to make wudu, find a
 * quiet place and open the mushaf. Because a slot one hour after midnight
 * pushes the popup into the previous day, every calculation here uses minutes
 * since midnight modulo 24h.
 */

export const QURAN_REMINDER_STORAGE_KEY = 'qitab_quran_reminder_settings';
export const QURAN_ADVANCE_MINUTES = 60;

// Preset Quran recitation time slots
export const QURAN_PRESETS = [
  { id: 'fajr_after',    label: 'After Fajr',   icon: 'sunny-outline',        hour: 5,  minute: 30 },
  { id: 'morning',       label: 'Morning',      icon: 'partly-sunny-outline', hour: 8,  minute: 0  },
  { id: 'dhuhr_after',   label: 'After Dhuhr',  icon: 'sunny',                hour: 13, minute: 30 },
  { id: 'afternoon',     label: 'Afternoon',    icon: 'cloudy-outline',       hour: 16, minute: 0  },
  { id: 'maghrib_after', label: 'After Maghrib', icon: 'moon-outline',        hour: 19, minute: 30 },
  { id: 'night',         label: 'Night',        icon: 'moon',                 hour: 21, minute: 0  },
];

/** Parse "07:30", "7:30 AM" or "7:30 PM" into 24h hour/minute. */
export const parseTimeInput = value => {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour > 23 || minute > 59) return null;

  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return { hour, minute };
};

/** Shift a time backwards (or forwards for negative values) within a day. */
export const advanceByMinutes = (hour, minute, delta = QURAN_ADVANCE_MINUTES) => {
  const total = (((hour * 60 + minute - delta) % 1440) + 1440) % 1440;
  return { hour: Math.floor(total / 60), minute: total % 60 };
};

/** 24h time → "7:00 AM" (the label shown in the popup copy). */
export const formatTime12 = ({ hour, minute }) => {
  const h12 = hour % 12 || 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

/** Preset ids + optional custom input → concrete slot objects. */
export const slotObjectsFromSettings = ({ slots = [], customTime = '' } = {}) => {
  const result = QURAN_PRESETS
    .filter(preset => slots.includes(preset.id))
    .map(({ hour, minute }) => ({ hour, minute }));

  const custom = parseTimeInput(customTime);
  if (custom) result.push(custom);

  return result;
};

/**
 * The next moment a reminder should fire, i.e. `offsetMinutes` before the
 * panel time. If that instant already passed today, roll over to tomorrow.
 */
export const nextOccurrence = ({ hour, minute }, offsetMinutes = QURAN_ADVANCE_MINUTES, from = new Date()) => {
  const target = new Date(from);
  target.setHours(hour, minute, 0, 0);
  target.setMinutes(target.getMinutes() - offsetMinutes);
  // The one-hour-early instant can land on the previous day; keep rolling
  // forward until it is genuinely in the future.
  while (target <= from) target.setDate(target.getDate() + 1);
  return target;
};
