import {
  QURAN_ADVANCE_MINUTES,
  QURAN_PRESETS,
  advanceByMinutes,
  formatTime12,
  nextOccurrence,
  parseTimeInput,
  slotObjectsFromSettings,
} from '../quranReminder';

describe('quran reminder timing', () => {
  it('advances reminders by exactly one hour', () => {
    expect(QURAN_ADVANCE_MINUTES).toBe(60);
    expect(advanceByMinutes(5, 30)).toEqual({ hour: 4, minute: 30 });
    expect(advanceByMinutes(8, 0)).toEqual({ hour: 7, minute: 0 });
    expect(advanceByMinutes(21, 0)).toEqual({ hour: 20, minute: 0 });
  });

  it('wraps past midnight into the previous day', () => {
    expect(advanceByMinutes(0, 30)).toEqual({ hour: 23, minute: 30 });
    expect(advanceByMinutes(1, 0)).toEqual({ hour: 0, minute: 0 });
    expect(advanceByMinutes(0, 0)).toEqual({ hour: 23, minute: 0 });
  });

  it('formats 24h times for popup copy', () => {
    expect(formatTime12({ hour: 0, minute: 30 })).toBe('12:30 AM');
    expect(formatTime12({ hour: 4, minute: 5 })).toBe('4:05 AM');
    expect(formatTime12({ hour: 12, minute: 0 })).toBe('12:00 PM');
    expect(formatTime12({ hour: 19, minute: 30 })).toBe('7:30 PM');
  });
});

describe('parseTimeInput', () => {
  it('parses 24h and 12h input', () => {
    expect(parseTimeInput('07:30')).toEqual({ hour: 7, minute: 30 });
    expect(parseTimeInput('7:05 AM')).toEqual({ hour: 7, minute: 5 });
    expect(parseTimeInput('7:05 pm')).toEqual({ hour: 19, minute: 5 });
    expect(parseTimeInput('12:15 AM')).toEqual({ hour: 0, minute: 15 });
    expect(parseTimeInput('12:15 PM')).toEqual({ hour: 12, minute: 15 });
  });

  it('rejects malformed or out-of-range values', () => {
    expect(parseTimeInput('')).toBeNull();
    expect(parseTimeInput('25:00')).toBeNull();
    expect(parseTimeInput('10:60')).toBeNull();
    expect(parseTimeInput('abc')).toBeNull();
  });
});

describe('slotObjectsFromSettings', () => {
  it('returns preset times in preset order plus the custom time', () => {
    const slots = slotObjectsFromSettings({
      slots: ['night', 'morning'],
      customTime: '4:45 PM',
    });
    expect(slots).toEqual([
      { hour: 8, minute: 0 },
      { hour: 21, minute: 0 },
      { hour: 16, minute: 45 },
    ]);
    expect(slots).toHaveLength(3);
  });

  it('returns an empty array when nothing is selected', () => {
    expect(slotObjectsFromSettings()).toEqual([]);
    expect(slotObjectsFromSettings({ slots: [], customTime: 'oops' })).toEqual([]);
  });

  it('every preset can be scheduled', () => {
    const all = slotObjectsFromSettings({ slots: QURAN_PRESETS.map(p => p.id) });
    expect(all).toHaveLength(QURAN_PRESETS.length);
  });
});

describe('nextOccurrence', () => {
  const at = (iso) => new Date(iso);

  it('fires one hour before the recitation on the same day', () => {
    const next = nextOccurrence({ hour: 19, minute: 30 }, 60, at('2026-10-24T10:00:00'));
    expect(next.getHours()).toBe(18);
    expect(next.getMinutes()).toBe(30);
    expect(next.getDate()).toBe(24);
  });

  it('rolls to tomorrow when the one-hour-early moment has passed', () => {
    const next = nextOccurrence({ hour: 8, minute: 0 }, 60, at('2026-10-24T09:00:00'));
    expect(next.getDate()).toBe(25);
    expect(next.getHours()).toBe(7);
    expect(next.getMinutes()).toBe(0);
  });

  it('handles slots shortly after midnight by firing late the evening before', () => {
    const next = nextOccurrence({ hour: 0, minute: 30 }, 60, at('2026-10-24T10:00:00'));
    expect(next.getDate()).toBe(24);
    expect(next.getHours()).toBe(23);
    expect(next.getMinutes()).toBe(30);
  });

  it('rolls ahead when the previous-day window was missed', () => {
    const next = nextOccurrence({ hour: 0, minute: 30 }, 60, at('2026-10-24T23:45:00'));
    expect(next.getDate()).toBe(25);
    expect(next.getHours()).toBe(23);
    expect(next.getMinutes()).toBe(30);
  });
});
