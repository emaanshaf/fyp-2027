// Notification Service - Push notifications for prayer times, reminders
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { storage } from './storage';
import { StorageKeys } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    if (!Device.isDevice) {
      console.warn('Notifications require physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prayer-times', {
        name: 'Prayer Times',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#d4af37',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#d4af37',
      });
    }

    return true;
  }

  async getExpoPushToken() {
    if (this.expoPushToken) return this.expoPushToken;

    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;
      return token;
    } catch (error) {
      console.warn('Failed to get Expo push token:', error);
      return null;
    }
  }

  async schedulePrayerNotification(prayerName, prayerTime, triggerDate) {
    const enabled = await storage.get(StorageKeys.PRAYER_NOTIFICATIONS);
    if (enabled === 'false') return null;

    const identifier = `prayer-${prayerName}-${triggerDate.getTime()}`;

    return Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `Time for ${prayerName}`,
        body: `It's ${prayerTime} - Time to pray ${prayerName}`,
        sound: 'default',
        data: { type: 'prayer', prayer: prayerName },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }

  async scheduleDailyPrayerNotifications(timings) {
    // Cancel existing prayer notifications
    await this.cancelPrayerNotifications();

    const now = new Date();
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const prayer of prayers) {
      if (!timings[prayer]) continue;

      const [hours, minutes] = timings[prayer].split(':').map(Number);
      const triggerDate = new Date();
      triggerDate.setHours(hours, minutes, 0, 0);

      // If time has passed, schedule for tomorrow
      if (triggerDate <= now) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      await this.schedulePrayerNotification(prayer, timings[prayer], triggerDate);
    }
  }

  async cancelPrayerNotifications() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const prayerIds = scheduled
      .filter(n => n.identifier.startsWith('prayer-'))
      .map(n => n.identifier);
    await Notifications.cancelScheduledNotificationsAsync(prayerIds);
  }

  async scheduleReminderNotification(title, body, triggerDate, data = {}) {
    const identifier = `reminder-${Date.now()}`;

    return Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: 'default',
        data: { type: 'reminder', ...data },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }

  async cancelReminderNotification(identifier) {
    await Notifications.cancelScheduledNotificationsAsync([identifier]);
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  onNotificationReceived(callback) {
    this.notificationListener = Notifications.addNotificationReceivedListener(callback);
    return this.notificationListener;
  }

  onNotificationResponse(callback) {
    this.responseListener = Notifications.addNotificationResponseReceivedListener(callback);
    return this.responseListener;
  }

  removeListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  async getBadgeCount() {
    return Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count) {
    return Notifications.setBadgeCountAsync(count);
  }
}

export const notificationService = new NotificationService();
export default notificationService;