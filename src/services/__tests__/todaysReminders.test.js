import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  customReminderRows,
  dismissReminderKeys,
  dueReminderRows,
  formatReminderTime,
  loadDismissedKeys,
  loadTodaysReminders,
  localDateKey,
  quranReminderRows,
  remainingReminderRows,
  todaysReminderRows,
} from '../todaysReminders';

const at = (hour, minute) => new Date(2026, 9, 29, hour, minute);

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('customReminderRows', () => {
  it('keeps enabled reminders with a readable time', () => {
    const rows = customReminderRows([
      { id: 1, title: 'Read Quran', time: '7:30 PM', enabled: true },
      { id: 2, title: 'Off', time: '8:00 AM', enabled: false },
      { id: 3, title: 'Broken', time: 'later', enabled: true },
    ]);
    expect(rows).toEqual([
      expect.objectContaining({ key: 'custom:1', title: 'Read Quran', time: { hour: 19, minute: 30 } }),
    ]);
  });

  it('tolerates corrupt storage', () => {
    expect(customReminderRows(null)).toEqual([]);
    expect(customReminderRows('not-an-array')).toEqual([]);
  });
});

describe('quranReminderRows', () => {
  it('maps enabled presets to their recitation time', () => {
    const rows = quranReminderRows({ enabled: true, slots: ['fajr_after'], customTime: '06:15' });
    expect(rows.map(r => r.key)).toEqual(['quran:fajr_after', 'quran:custom']);
    expect(rows[0].time).toEqual({ hour: 5, minute: 30 });
    expect(rows[1].time).toEqual({ hour: 6, minute: 15 });
  });

  it('returns nothing when the Quran reminder is off', () => {
    expect(quranReminderRows({ enabled: false, slots: ['night'] })).toEqual([]);
  });
});

describe('dueReminderRows', () => {
  const rows = todaysReminderRows({
    customRaw: [{ id: 1, title: 'Early', time: '07:00', enabled: true }],
    quranRaw: { enabled: true, slots: ['morning'], customTime: '' },
  });

  it('sorts the day by clock time', () => {
    expect(rows.map(r => r.time)).toEqual([{ hour: 7, minute: 0 }, { hour: 8, minute: 0 }]);
  });

  it('includes a reminder that just passed', () => {
    const due = dueReminderRows(rows, at(7, 20));
    expect(due.map(r => r.key)).toEqual(['custom:1']);
  });

  it('keeps a passed reminder due for the rest of the day', () => {
    const due = dueReminderRows(rows, at(23, 0));
    // Both the 7:00 custom reminder and the 8:00 Quran slot stay due until the
    // user marks them done or turns them off; only a new day clears them.
    expect(due.map(r => r.key)).toEqual(['custom:1', 'quran:morning']);
  });

  it('drops a due reminder once it is marked done', () => {
    const due = dueReminderRows(rows, at(23, 0))
      .filter(row => !new Set(['custom:1']).has(row.key));
    expect(due.map(r => r.key)).toEqual(['quran:morning']);
  });

  it('never shows a reminder before its time', () => {
    expect(dueReminderRows(rows, at(6, 59))).toEqual([]);
  });
});

describe('remainingReminderRows', () => {
  it('lists what is still ahead, minus anything dismissed', () => {
    const rows = todaysReminderRows({
      customRaw: [
        { id: 1, title: 'A', time: '18:00', enabled: true },
        { id: 2, title: 'B', time: '20:00', enabled: true },
      ],
    });
    const remaining = remainingReminderRows(rows, new Set(['custom:1']), at(17, 0));
    expect(remaining.map(r => r.key)).toEqual(['custom:2']);
  });
});

describe('dismissals', () => {
  it('remembers a key for today and forgets it tomorrow', async () => {
    const today = at(12, 0);
    await dismissReminderKeys(['custom:1'], today);
    expect([...(await loadDismissedKeys(today))]).toEqual(['custom:1']);

    const tomorrow = new Date(2026, 9, 30, 9, 0);
    expect((await loadDismissedKeys(tomorrow)).size).toBe(0);
  });

  it('uses the local calendar day, not UTC', () => {
    expect(localDateKey(new Date(2026, 0, 1, 23, 30))).toBe('2026-01-01');
  });

  it('survives unreadable storage', async () => {
    await AsyncStorage.setItem('qitab_reminder_popup_dismissed', '{not json');
    expect((await loadDismissedKeys(at(9, 0))).size).toBe(0);
  });
});

describe('loadTodaysReminders', () => {
  it('merges both stored sources', async () => {
    await AsyncStorage.setItem('qitab_reminders', JSON.stringify([
      { id: 9, title: 'Notes', time: '21:00', enabled: true },
    ]));
    await AsyncStorage.setItem('qitab_quran_reminder_settings', JSON.stringify({
      enabled: true, slots: ['night'], customTime: '',
    }));
    const rows = await loadTodaysReminders();
    expect(rows.map(r => r.source)).toEqual(['custom', 'quran']);
  });
});

describe('formatReminderTime', () => {
  it('formats 24h to a 12h label', () => {
    expect(formatReminderTime({ hour: 7, minute: 5 })).toBe('7:05 AM');
    expect(formatReminderTime({ hour: 19, minute: 30 })).toBe('7:30 PM');
    expect(formatReminderTime({ hour: 0, minute: 0 })).toBe('12:00 AM');
  });
});
