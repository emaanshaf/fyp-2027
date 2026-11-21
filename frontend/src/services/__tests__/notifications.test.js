import * as Notifications from 'expo-notifications';
import { cancelScheduledIds } from '../notifications';

// expo-notifications exposes only the singular cancellation call. The code
// previously used a plural function that does not exist, so every toggle-off
// path threw (often inside a catch) and the notification kept firing.
describe('cancelScheduledIds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Notifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  });

  it('cancels each identifier through the singular API', async () => {
    await cancelScheduledIds(['prayer-reminder-fajr', 'custom-reminder-42']);

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('prayer-reminder-fajr');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('custom-reminder-42');
  });

  it('de-duplicates identifiers so one id cannot cancel twice', async () => {
    await cancelScheduledIds(['quran-snooze', 'quran-snooze', 'quran-snooze']);

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('skips empty entries in the list', async () => {
    await cancelScheduledIds(['', null, undefined, 'quran-snooze']);

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('quran-snooze');
  });

  it('keeps cancelling the rest when one identifier is already gone', async () => {
    Notifications.cancelScheduledNotificationAsync
      .mockRejectedValueOnce(new Error('not scheduled'))
      .mockResolvedValueOnce(undefined);

    await expect(cancelScheduledIds(['old-id', 'live-id'])).resolves.toBeUndefined();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
  });

  it('does nothing for an empty or missing list', async () => {
    await cancelScheduledIds([]);
    await cancelScheduledIds();
    await cancelScheduledIds(null);

    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });
});
