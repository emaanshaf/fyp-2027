import * as Notifications from 'expo-notifications';
import { scheduleDailyReminder } from '../RemindersScreen';

// A reminder toggled on must fire every day, not once. The previous code
// scheduled a one-off `{ seconds }` trigger, so the only reminder a user ever
// received was the first one.
describe('scheduleDailyReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Notifications.scheduleNotificationAsync.mockResolvedValue('scheduled-id');
    Notifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  });

  it('uses a DAILY trigger at the chosen time', async () => {
    await scheduleDailyReminder({
      identifier: 'prayer-reminder-fajr',
      title: 'Time for Fajr',
      body: 'It is time for prayer.',
      time: '05:30 AM',
      data: { kind: 'prayer', prayer: 'fajr' },
    });

    const request = Notifications.scheduleNotificationAsync.mock.calls[0][0];
    expect(request.identifier).toBe('prayer-reminder-fajr');
    expect(request.trigger).toMatchObject({
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 5,
      minute: 30,
      channelId: 'reminders',
    });
    expect(request.content.data).toMatchObject({ type: 'reminder', kind: 'prayer', prayer: 'fajr' });
  });

  it('cancels the same identifier before re-scheduling it', async () => {
    await scheduleDailyReminder({
      identifier: 'custom-reminder-42',
      title: 'Read Quran',
      body: 'Open the Quran for ten minutes.',
      time: '19:30',
    });

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('custom-reminder-42');
    expect(Notifications.cancelScheduledNotificationAsync.mock.invocationCallOrder[0])
      .toBeLessThan(Notifications.scheduleNotificationAsync.mock.invocationCallOrder[0]);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('returns null and schedules nothing when the time cannot be parsed', async () => {
    const result = await scheduleDailyReminder({
      identifier: 'custom-reminder-1',
      title: 'Reminder',
      body: 'Body',
      time: 'not a time',
    });

    expect(result).toBeNull();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('returns the scheduler identifier for callers to confirm success', async () => {
    const result = await scheduleDailyReminder({
      identifier: 'custom-reminder-7',
      title: 'Reminder',
      body: 'Body',
      time: '7:05 pm',
    });

    expect(result).toBe('scheduled-id');
  });
});
