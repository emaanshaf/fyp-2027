// Notification Service - Push notifications for prayer times, reminders, Quran recitation
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from './storage';
import { StorageKeys } from './storage';
import { backend } from './backend';
import {
  QURAN_ADVANCE_MINUTES,
  QURAN_REMINDER_STORAGE_KEY,
  advanceByMinutes,
  formatTime12,
  nextOccurrence,
  parseTimeInput,
  slotObjectsFromSettings,
} from '../data/quranReminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Cancel several scheduled notifications by identifier.
 *
 * expo-notifications only exposes `cancelScheduledNotificationAsync(identifier)`
 * — there is no bulk-by-ids API. The app previously called
 * `cancelScheduledNotificationsAsync(ids)`, which does not exist, so every
 * disable/delete path threw (often inside a catch) and the alarm kept firing.
 * Failures per id are ignored: an id that was never scheduled is not an error.
 */
export const cancelScheduledIds = async identifiers => {
  const ids = [...new Set((identifiers || []).filter(Boolean))];
  await Promise.all(
    ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
  );
};

export class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    // In-app subscribers (App.js shows the Quran popup banner with these).
    this.quranListeners = new Set();
    // Web has no OS scheduler, so the open tab keeps its own timers.
    this.webQuranTimers = new Map();
  }

  async initialize() {
    // The web build has no expo push scheduler; browser notifications use the
    // Notification API and are requested from the Reminders screen instead.
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

      await this.ensureQuranChannel();
    }

    return true;
  }

  /**
   * Android only shows a notification as a heads-up banner (a "popup" over
   * whatever is on screen) when its channel is high importance AND the sound
   * and vibration are enabled. MAX is used so Android 13+ never demotes it to
   * the quiet notification drawer.
   */
  async ensureQuranChannel() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('quran-reminders', {
      name: 'Quran Recitation',
      description: 'Pops up one hour before your chosen recitation time',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#d4af37',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  /** Permission state for Quran popups on both native and web. */
  async getQuranPermission() {
    if (Platform.OS === 'web') {
      if (typeof Notification === 'undefined') return { status: 'denied' };
      return {
        status: Notification.permission === 'granted'
          ? 'granted'
          : Notification.permission === 'denied' ? 'denied' : 'undetermined',
      };
    }
    return Notifications.getPermissionsAsync();
  }

  async requestQuranPermission() {
    if (Platform.OS === 'web') {
      if (typeof Notification === 'undefined') return { status: 'denied' };
      const status = await Notification.requestPermission();
      return { status };
    }
    return Notifications.requestPermissionsAsync();
  }

  async getExpoPushToken() {
    if (this.expoPushToken) return this.expoPushToken;

    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;
      // Register with backend (fire-and-forget; backend may not be online)
      backend.registerPushToken(token).catch(() => {});
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
    await cancelScheduledIds(prayerIds);
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
    await cancelScheduledIds([identifier]);
  }

  async cancelAllNotifications() {
    // Web timers live outside expo-notifications, so they need clearing here
    // too — otherwise "enable notifications off" leaves popups firing.
    this.clearWebQuranTimers();
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Schedule a daily 8 AM reminder to read Quran pages for Khatm planner.
   * @param {number} dailyTarget - number of pages to read today
   */
  async scheduleKhatmReminder(dailyTarget) {
    // Cancel any existing khatm reminders first
    await this.cancelKhatmReminder();

    const trigger = new Date();
    trigger.setHours(8, 0, 0, 0);
    // If 8 AM has passed today, schedule for tomorrow
    if (trigger <= new Date()) {
      trigger.setDate(trigger.getDate() + 1);
    }

    return Notifications.scheduleNotificationAsync({
      identifier: 'khatm-daily-reminder',
      content: {
        title: 'Quran Reading Reminder 📖',
        body: `Your goal today: read ${dailyTarget} page${dailyTarget !== 1 ? 's' : ''} of the Quran. May Allah bless your Khatm!`,
        sound: 'default',
        data: { type: 'khatm' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  }

  async cancelKhatmReminder() {
    await cancelScheduledIds(['khatm-daily-reminder']);
  }

  // ─── Quran Recitation Reminders ─────────────────────────────────────────

  /** 20 rotating motivational messages for Quran reminders */
  getRandomQuranMessage(index = null) {
    const messages = [
      { title: '📖 Time to Recite Quran', body: 'Even one ayah a day brings endless blessings. Open your heart to Allah\'s words.' },
      { title: '🌿 Quran Reminder', body: 'The best of you are those who learn the Quran and teach it. – Prophet ﷺ' },
      { title: '✨ Your Daily Quran Awaits', body: 'Reading Quran brings peace to the heart. Take a few minutes for Allah today.' },
      { title: '📖 Recite & Reflect', body: 'Indeed, this Quran guides to that which is most suitable. (Al-Isra 17:9)' },
      { title: '🤲 Quran Time', body: 'Whoever reads one letter of the Quran will have one reward multiplied by ten. – Prophet ﷺ' },
      { title: '🌙 Open the Quran', body: 'The Quran will intercede for those who recited it. Start your recitation now.' },
      { title: '💫 Daily Quran Reminder', body: 'These are the verses of the clear Book. (Al-Yusuf 12:1) Let its light guide you.' },
      { title: '📖 A Moment With Allah', body: 'Pause everything. Just you and the Quran. Allah is listening.' },
      { title: '🌸 Quran Connection', body: 'Your heart is a mirror. Quran is the light that polishes it. Read today.' },
      { title: '⭐ Recite Quran', body: 'Make Quran a part of your daily routine. Small steps lead to great rewards.' },
      { title: '🕌 Quran Awaits You', body: 'The Quran is a healing for what is in the breasts. (Yunus 10:57). Open it now.' },
      { title: '📿 Daily Tilawah', body: 'Keep your tongue moist with the remembrance of Allah through His holy words.' },
      { title: '🌟 Quran Reminder', body: 'We have sent down to you the Book as clarification for all things. (An-Nahl 16:89)' },
      { title: '📖 Read & Earn Rewards', body: 'Each letter = 10 rewards. Bismillah counts! Start your recitation now.' },
      { title: '🤍 Connect With Quran', body: 'Do they not reflect upon the Quran? (An-Nisa 4:82) Spend a moment today.' },
      { title: '🌺 Quran Recitation Time', body: 'The one who recites the Quran skillfully will be with the noble angels. – Prophet ﷺ' },
      { title: '💎 Precious Moments', body: 'These moments of Quran recitation are treasures stored for you in the Hereafter.' },
      { title: '🏡 Make Quran Your Home', body: 'Make your home a place of light by filling it with Quran recitation.' },
      { title: '📖 Never Miss a Day', body: 'Consistency is key. Even a short daily recitation builds a lifelong bond with Allah.' },
      { title: '🌄 Quran & Barakah', body: 'Start or end your day with Allah\'s words. Barakah follows those who recite.' },
    ];
    const i = index !== null ? index % messages.length : Math.floor(Math.random() * messages.length);
    return messages[i];
  }

  /**
   * Schedule the daily Quran recitation reminders.
   *
   * Every slot fires `QURAN_ADVANCE_MINUTES` before the chosen recitation
   * time (one hour) so the user has time to prepare. On Android the trigger
   * targets the MAX-importance "quran-reminders" channel, which makes it a
   * heads-up popup over the current screen instead of a silent drawer entry.
   * On web the open tab keeps its own timers and raises a browser notification
   * plus the in-app banner (see subscribeQuranReminder).
   *
   * @param {Array<{hour: number, minute: number}>} slots - recitation times
   * @param {number} dayIndex - rotating message day index
   */
  async scheduleQuranReminders(slots = [], dayIndex = 0) {
    await this.cancelQuranReminders();
    if (slots.length === 0) return [];

    if (Platform.OS === 'web') {
      return this.scheduleWebQuranReminders(slots, dayIndex);
    }

    await this.ensureQuranChannel();
    const results = [];
    for (let i = 0; i < slots.length; i++) {
      const recitation = slots[i];
      const popup = advanceByMinutes(recitation.hour, recitation.minute);
      const msg = this.getRandomQuranMessage(dayIndex + i);
      try {
        const id = await Notifications.scheduleNotificationAsync({
          identifier: `quran-reminder-${i}`,
          content: {
            title: '📖 Quran recitation in 1 hour',
            body: `Your recitation is at ${formatTime12(recitation)}. ${msg.body}`,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            data: {
              type: 'quran_reminder',
              slotIndex: i,
              slotTime: formatTime12(recitation),
              advanceMinutes: QURAN_ADVANCE_MINUTES,
            },
          },
          // DAILY repeats every day at the advanced time and handles slots
          // after midnight correctly (00:30 → popup at 23:30 the day before).
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: popup.hour,
            minute: popup.minute,
            channelId: 'quran-reminders',
          },
        });
        results.push(id);
      } catch { /* skip if scheduling fails */ }
    }
    return results;
  }

  // ─── Web scheduler (timers run while the app tab is open) ───────────────

  scheduleWebQuranReminders(slots, dayIndex = 0) {
    this.clearWebQuranTimers();
    slots.forEach((slot, i) => this.scheduleWebQuranSlot(slot, i, dayIndex));
    return slots.map((_, i) => `quran-web-reminder-${i}`);
  }

  scheduleWebQuranSlot(slot, index, dayIndex, fireAt = nextOccurrence(slot)) {
    const delay = Math.max(0, fireAt.getTime() - Date.now());
    const timer = setTimeout(() => {
      this.emitQuranReminder(slot, index + dayIndex);
      // Re-arm for the next day. Skip any days missed while the device slept.
      const next = new Date(fireAt);
      do { next.setDate(next.getDate() + 1); } while (next <= new Date());
      this.scheduleWebQuranSlot(slot, index, dayIndex, next);
    }, delay);
    this.webQuranTimers.set(`quran-web-reminder-${index}`, timer);
  }

  clearWebQuranTimers() {
    for (const timer of this.webQuranTimers.values()) clearTimeout(timer);
    this.webQuranTimers.clear();
  }

  /**
   * Web-only daily reminder for a custom reminder. Native builds use an OS
   * alarm (scheduleDailyReminder in RemindersScreen) and survive the app
   * closing; the browser tab has to keep its own timer, re-armed for the
   * next day after it fires.
   */
  scheduleWebReminder({ identifier, title, body, time }) {
    if (Platform.OS !== 'web') return null;
    const parsed = parseTimeInput(time);
    if (!parsed) return null;
    const existing = this.webQuranTimers.get(identifier);
    if (existing) clearTimeout(existing);
    this.armWebReminder(identifier, parsed, title, body);
    return identifier;
  }

  armWebReminder(identifier, parsed, title, body) {
    const fireAt = nextOccurrence(parsed, 0);
    const delay = Math.max(0, fireAt.getTime() - Date.now());
    const timer = setTimeout(() => {
      this.raiseQuranPopup({ title, body });
      this.armWebReminder(identifier, parsed, title, body);
    }, delay);
    this.webQuranTimers.set(identifier, timer);
  }

  cancelWebReminder(identifier) {
    const timer = this.webQuranTimers.get(identifier);
    if (!timer) return;
    clearTimeout(timer);
    this.webQuranTimers.delete(identifier);
  }

  /** Notify the app (in-app popup banner) and, on web, the browser itself. */
  raiseQuranPopup({ title, body, slotTime = null }) {
    const payload = { title, body, slotTime };

    for (const listener of this.quranListeners) {
      try { listener(payload); } catch { /* a broken listener cannot block others */ }
    }

    if (Platform.OS === 'web'
      && typeof Notification !== 'undefined'
      && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          tag: 'quran-recitation-reminder',
          requireInteraction: true,
        });
      } catch { /* some browsers require a service worker; banner still shows */ }
    }

    return payload;
  }

  emitQuranReminder(slot, messageIndex = 0) {
    const msg = this.getRandomQuranMessage(messageIndex);
    return this.raiseQuranPopup({
      title: '📖 Quran recitation in 1 hour',
      body: `Your recitation is at ${formatTime12(slot)}. ${msg.body}`,
      slotTime: formatTime12(slot),
    });
  }

  /** App.js subscribes here for the guaranteed in-app popup. */
  subscribeQuranReminder(callback) {
    this.quranListeners.add(callback);
    return () => this.quranListeners.delete(callback);
  }

  /**
   * Re-schedule saved reminders on launch. Native notifications survive a
   * restart, but re-creating them keeps the daily trigger in sync after the
   * settings changed; web timers must always be rebuilt.
   */
  async restoreQuranReminders() {
    try {
      const raw = await AsyncStorage.getItem(QURAN_REMINDER_STORAGE_KEY);
      if (!raw) return false;

      const settings = JSON.parse(raw);
      if (!settings.enabled) {
        await this.cancelQuranReminders();
        return false;
      }

      const slots = slotObjectsFromSettings(settings);
      if (slots.length === 0) return false;

      await this.scheduleQuranReminders(slots);
      return true;
    } catch {
      return false;
    }
  }

  async cancelQuranReminders() {
    this.clearWebQuranTimers();
    if (Platform.OS === 'web') return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ids = scheduled
      .filter(n => n.identifier.startsWith('quran-reminder-'))
      .map(n => n.identifier);
    await cancelScheduledIds(ids);
  }

  /**
   * Snooze: push a single Quran reminder N minutes from now.
   * @param {number} minutes - snooze duration
   */
  async scheduleQuranSnooze(minutes = 15) {
    const msg = this.getRandomQuranMessage();
    if (Platform.OS === 'web') {
      const existing = this.webQuranTimers.get('quran-snooze');
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        this.raiseQuranPopup({
          title: `⏰ ${msg.title.replace(/^[\p{Emoji}\s]+/u, '').trim()}`,
          body: msg.body,
        });
      }, minutes * 60 * 1000);
      this.webQuranTimers.set('quran-snooze', timer);
      return 'quran-snooze';
    }

    await this.ensureQuranChannel();
    return Notifications.scheduleNotificationAsync({
      identifier: 'quran-snooze',
      content: {
        title: `⏰ ${msg.title}`,
        body: msg.body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { type: 'quran_snooze' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
        channelId: 'quran-reminders',
      },
    });
  }

  async cancelQuranSnooze() {
    if (Platform.OS === 'web') {
      const timer = this.webQuranTimers.get('quran-snooze');
      if (timer) clearTimeout(timer);
      this.webQuranTimers.delete('quran-snooze');
      return;
    }
    await cancelScheduledIds(['quran-snooze']);
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
    this.notificationListener?.remove?.();
    this.responseListener?.remove?.();
    this.notificationListener = null;
    this.responseListener = null;
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