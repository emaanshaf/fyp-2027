import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Switch, Modal, Platform, Animated, Alert, ScrollView, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasAuthToken } from '../services/authToken';
import { getItem, setItem } from '../firebase/syncedStorage';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { backend } from '../services/backend';
import notificationService from '../services/notifications';
import {
  DEFAULT_REMINDER_SOUND_ID,
  REMINDER_SOUNDS,
  getReminderSound,
  getReminderSoundId,
  setReminderSoundId,
  isReminderSoundEnabled,
  setReminderSoundEnabled,
  previewReminderSound,
} from '../services/reminderSound';
import {
  QURAN_REMINDER_STORAGE_KEY,
  QURAN_PRESETS,
  advanceByMinutes,
  formatTime12,
  parseTimeInput,
  slotObjectsFromSettings,
} from '../data/quranReminder';

// The notification handler lives in services/notifications.js so every screen
// gets the same foreground behaviour (banner + list + sound). Re-registering a
// second, older-style handler here silently replaced it.

const REMINDER_CHANNEL_ID = 'reminders';

// Android needs a channel for a heads-up reminder, and its sound/importance is
// fixed when the channel is first created.
const ensureReminderChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Reminders',
    description: 'Prayer and custom reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#d4af37',
  });
};

const cancelNotificationId = async identifier => {
  notificationService.cancelWebReminder(identifier);
  if (Platform.OS === 'web') return;
  try {
    // expo-notifications has no bulk-by-ids cancel; the singular call is the
    // only one that actually removes the alarm.
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Nothing scheduled under this id.
  }
};

/**
 * Schedule a repeating daily reminder with a stable identifier.
 *
 * The old code scheduled a single one-off notification `{ seconds }` in the
 * future, so a prayer reminder fired once and then silently never again.
 * Cancelling the identifier first also stops toggling a reminder on twice from
 * stacking duplicate notifications.
 */
export const scheduleDailyReminder = async ({ identifier, title, body, time, data = {} }) => {
  if (Platform.OS === 'web') return null;
  const parsed = parseTimeInput(time);
  if (!parsed) return null;

  await ensureReminderChannel();
  await cancelNotificationId(identifier);
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body, sound: 'default', data: { type: 'reminder', ...data } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: parsed.hour,
      minute: parsed.minute,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
};

const getPerms  = async () => {
  return notificationService.getQuranPermission();
};
const requestPerms = async () => {
  return notificationService.requestQuranPermission();
};

// ── Constants ──────────────────────────────────────────────────────────────
const PRAYER_REMINDERS = [
  { id: 'fajr',    name: 'Fajr',    icon: 'partly-sunny-outline', color: '#a78bfa' },
  { id: 'dhuhr',   name: 'Dhuhr',   icon: 'sunny',                color: '#fbbf24' },
  { id: 'asr',     name: 'Asr',     icon: 'partly-sunny',         color: '#34d399' },
  { id: 'maghrib', name: 'Maghrib', icon: 'cloudy-night-outline',  color: '#f87171' },
  { id: 'isha',    name: 'Isha',    icon: 'moon-outline',          color: '#818cf8' },
];

// Preset Quran recitation time slots are shared with the notification service,
// which pops the reminder up one hour before each slot.

const QURAN_MESSAGES_PREVIEW = [
  { emoji: '📖', text: 'The best of you are those who learn the Quran and teach it.' },
  { emoji: '✨', text: 'Whoever reads one letter of the Quran will have one reward multiplied by ten.' },
  { emoji: '🌿', text: 'The Quran is a healing for what is in the breasts. (Yunus 10:57)' },
  { emoji: '💫', text: 'Indeed, this Quran guides to that which is most suitable. (Al-Isra 17:9)' },
];

const STORAGE_KEY_QURAN  = QURAN_REMINDER_STORAGE_KEY;
const STORAGE_KEY_STREAK = 'qitab_quran_streak';

// ── Time picker ─────────────────────────────────────────────────────────────
// Typing "7:08 pm" by hand was the only way to set a reminder time. This is a
// tappable field that opens hour / minute / AM-PM pickers and hands back the
// same "7:08 PM" string the scheduler already understands.
function TimeField({ value, onChange, placeholder = 'Select time', inline = false }) {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [open, setOpen] = useState(false);
  const [draftHour, setDraftHour] = useState(7);
  const [draftMinute, setDraftMinute] = useState(0);

  const openPicker = () => {
    const parsed = parseTimeInput(value) || { hour: 7, minute: 0 };
    setDraftHour(parsed.hour);
    setDraftMinute(parsed.minute);
    setOpen(true);
  };

  const hour12 = draftHour % 12 || 12;
  const isPm = draftHour >= 12;

  const pickHour = h => setDraftHour((h % 12) + (isPm ? 12 : 0));
  const pickPeriod = pm => setDraftHour((draftHour % 12) + (pm ? 12 : 0));

  const confirm = () => {
    onChange(formatTime12({ hour: draftHour, minute: draftMinute }));
    setOpen(false);
  };

  // A Modal inside another Modal (Add Reminder) is unreliable on Android, so
  // the picker can expand inline instead of stacking a second sheet.
  const pickerBody = (
    <View style={inline ? styles.inlinePicker : undefined}>
      <View style={[globalStyles.spaceBetween, { marginBottom: 16 }]}>
        <Text style={{ color: COLORS.textPrimary, fontWeight: '900', fontSize: 20 }}>Choose Time</Text>
        <TouchableOpacity onPress={() => setOpen(false)}>
          <Ionicons name="close-circle" size={26} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 18 }}>
        <Text style={{ color: COLORS.gold, fontSize: 38, fontWeight: '900', letterSpacing: 1 }}>
          {String(hour12).padStart(2, '0')}:{String(draftMinute).padStart(2, '0')}
        </Text>
        <View style={{ flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.glassBorder }}>
          {[false, true].map(pm => (
            <TouchableOpacity
              key={pm ? 'PM' : 'AM'}
              onPress={() => pickPeriod(pm)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8,
                backgroundColor: isPm === pm ? COLORS.primary : 'transparent',
              }}
            >
              <Text style={{ color: isPm === pm ? '#fff' : COLORS.textSecondary, fontWeight: '800' }}>
                {pm ? 'PM' : 'AM'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionLabel}>HOUR</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 12 }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
          <TouchableOpacity
            key={h}
            onPress={() => pickHour(h)}
            style={[styles.timeChip, h === hour12 && styles.timeChipActive]}
          >
            <Text style={[styles.timeChipText, h === hour12 && styles.timeChipTextActive]}>
              {String(h).padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>MINUTE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 16 }}>
        {Array.from({ length: 60 }, (_, m) => m).map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => setDraftMinute(m)}
            style={[styles.timeChip, m === draftMinute && styles.timeChipActive]}
          >
            <Text style={[styles.timeChipText, m === draftMinute && styles.timeChipTextActive]}>
              {String(m).padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={globalStyles.btnPrimary} onPress={confirm}>
        <Ionicons name="checkmark" size={18} color="#fff" />
        <Text style={[globalStyles.btnPrimaryText, { color: '#fff' }]}>
          Set {formatTime12({ hour: draftHour, minute: draftMinute })}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={[globalStyles.input, { marginBottom: 14 }]}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={value ? `Reminder time ${value}. Tap to change` : 'Choose reminder time'}
      >
        <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
        <Text style={{
          flex: 1, marginLeft: 8, fontSize: 15,
          color: value ? COLORS.textPrimary : COLORS.textSecondary,
        }}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {inline ? (open ? pickerBody : null) : (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View style={[styles.modal, { backgroundColor: COLORS.bgSecondary, maxHeight: '90%' }]}>
              <View style={[styles.modalHandle, { backgroundColor: COLORS.glassBorder }]} />
              <ScrollView showsVerticalScrollIndicator={false}>
                {pickerBody}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function RemindersScreen() {
  const COLORS       = useColors();
  const globalStyles = useGlobalStyles();
  const styles       = useThemedStyles(makeStyles);

  // ── State ────────────────────────────────────────────────────────────────
  const [permGranted,    setPermGranted]    = useState(false);
  const [permBlocked,    setPermBlocked]    = useState(false);
  const [prayerToggles,  setPrayerToggles]  = useState({});
  const [reminders,      setReminders]      = useState([]);
  const [addModal,       setAddModal]       = useState(false);
  const [newTitle,       setNewTitle]       = useState('');
  const [newTime,        setNewTime]        = useState('');
  const [newMsg,         setNewMsg]         = useState('');

  // Quran reminder state
  const [quranEnabled,   setQuranEnabled]   = useState(false);
  const [quranSlots,     setQuranSlots]     = useState([]);    // array of preset ids
  const [quranCustomTime,setQuranCustomTime]= useState('');
  const [quranStreak,    setQuranStreak]    = useState(0);
  const [msgPreviewIdx,  setMsgPreviewIdx]  = useState(0);
  const [quranSaving,    setQuranSaving]    = useState(false);
  const [quranSaved,     setQuranSaved]     = useState(false);
  const [quranNotice,    setQuranNotice]    = useState('');
  const [reminderSound,  setReminderSound]  = useState(true);
  const [soundId,        setSoundId]        = useState(DEFAULT_REMINDER_SOUND_ID);
  const [activeTab,      setActiveTab]      = useState('quran'); // 'quran' | 'prayer' | 'custom'

  // Animations
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const msgAnim    = useRef(new Animated.Value(1)).current;
  const msgTimer   = useRef(null);

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    checkPermission();
    loadData();
    loadQuranSettings();
    loadQuranStreak();
    isReminderSoundEnabled().then(setReminderSound).catch(() => {});
    getReminderSoundId().then(setSoundId).catch(() => {});

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Rotate preview messages every 3 s
  useEffect(() => {
    msgTimer.current = setInterval(() => {
      Animated.sequence([
        Animated.timing(msgAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(msgAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setMsgPreviewIdx(i => (i + 1) % QURAN_MESSAGES_PREVIEW.length);
    }, 3000);
    return () => clearInterval(msgTimer.current);
  }, []);

  // ── Data loading ─────────────────────────────────────────────────────────
  const loadData = async () => {
    let localToggles = null;
    let localReminders = [];
    try {
      const [togglesRaw, remindersRaw] = await Promise.all([
        getItem('qitab_prayer_toggles'),
        getItem('qitab_reminders'),
      ]);
      if (togglesRaw) localToggles = JSON.parse(togglesRaw);
      if (remindersRaw) localReminders = JSON.parse(remindersRaw) || [];
    } catch { /* unreadable local data — start from defaults */ }

    if (localToggles) setPrayerToggles(localToggles);
    if (localReminders.length) setReminders(localReminders);
    armWebReminders(localReminders);

    // This device's data wins; the backend only seeds a fresh install. A
    // successful-but-empty backend response used to erase reminders that had
    // just been saved locally, which looked like "my reminder didn't save".
    let hasToken = false;
    try { hasToken = await hasAuthToken(); } catch { /* treat as guest */ }
    if (!hasToken) return;

    try {
      const [apiToggles, apiReminders] = await Promise.all([
        backend.getPrayerToggles(),
        backend.getReminders(),
      ]);
      if (!localToggles && apiToggles?.toggles) {
        setPrayerToggles(apiToggles.toggles);
        await setItem('qitab_prayer_toggles', JSON.stringify(apiToggles.toggles));
      }
      if (!localReminders.length && apiReminders?.length) {
        setReminders(apiReminders);
        await setItem('qitab_reminders', JSON.stringify(apiReminders));
        armWebReminders(apiReminders);
      }
    } catch { /* offline — local data already shown */ }
  };

  const loadQuranSettings = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_QURAN);
    if (raw) {
      const settings = JSON.parse(raw);
      setQuranEnabled(settings.enabled ?? false);
      setQuranSlots(settings.slots ?? []);
      setQuranCustomTime(settings.customTime ?? '');
    }
  };

  const loadQuranStreak = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STREAK);
    if (raw) {
      const data = JSON.parse(raw);
      let streak = data.streak || 0;
      // If last log was yesterday, keep streak; if today, keep; else reset
      if (data.lastDate) {
        const last = new Date(data.lastDate);
        const diff = Math.floor((new Date() - last) / 86400000);
        if (diff > 1) streak = 0;
      }
      setQuranStreak(streak);
    }
  };

  const checkPermission = async () => {
    const { status } = await getPerms();
    setPermGranted(status === 'granted');
    setPermBlocked(status === 'denied');
  };

  const requestPerm = async () => {
    const { status } = await requestPerms();
    setPermGranted(status === 'granted');
    setPermBlocked(status === 'denied');
    if (status === 'granted') return;

    // Once the user has blocked notifications, the OS/browser never shows the
    // prompt again — the app must point them at where to re-enable it.
    if (Platform.OS === 'web') {
      Alert.alert(
        'Notifications are blocked',
        'Allow notifications for this site to receive reminder popups: click the icon next to the address bar → Site settings → Notifications → Allow, then reload the page.'
      );
    } else {
      Alert.alert(
        'Notifications are blocked',
        'Allow notifications for Qitab-e-Noor in your device settings to receive reminder popups.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) },
        ]
      );
    }
  };

  const toggleReminderSound = async val => {
    setReminderSound(val);
    // Play before awaiting storage: browsers only allow audio to start while
    // the user's gesture is still fresh, and enabling is an explicit gesture.
    if (val) previewReminderSound(soundId).catch(() => {});
    await setReminderSoundEnabled(val);
  };

  const selectSound = async id => {
    setSoundId(id);
    // Audition immediately, before any await, so the click still counts as the
    // audio permission gesture. This works while the master toggle is off.
    previewReminderSound(id).catch(() => {});
    await setReminderSoundId(id);
  };

  const previewSound = () => {
    previewReminderSound(soundId).catch(() => {});
  };

  const selectedSound = getReminderSound(soundId);

  // ── Quran reminder helpers ───────────────────────────────────────────────
  const toggleQuranEnabled = async (val) => {
    setQuranEnabled(val);
    setQuranSaved(false);
    setQuranNotice('');
    if (!val) {
      await notificationService.cancelQuranReminders();
    } else if (quranSlots.length > 0 || quranCustomTime.trim()) {
      await saveAndScheduleQuranReminders(quranSlots, quranCustomTime, val);
    }
    await persistQuranSettings(val, quranSlots, quranCustomTime);
  };

  const toggleQuranSlot = async (presetId) => {
    const next = quranSlots.includes(presetId)
      ? quranSlots.filter(s => s !== presetId)
      : [...quranSlots, presetId];
    setQuranSlots(next);
    setQuranSaved(false);
    setQuranNotice('');
    if (quranEnabled) await saveAndScheduleQuranReminders(next, quranCustomTime, true);
    await persistQuranSettings(quranEnabled, next, quranCustomTime);
  };

  const saveAndScheduleQuranReminders = async (slots, customTime, enabled) => {
    setQuranNotice('');
    setQuranSaved(false);
    if (!enabled) {
      await notificationService.cancelQuranReminders();
      await persistQuranSettings(false, slots, customTime);
      setQuranNotice('Times saved. Turn on the Quran reminder switch to receive popups.');
      return;
    }

    setQuranSaving(true);
    try {
      // Android/iOS need notification permission. On the web the in-app popup
      // works regardless; the browser prompt is only for OS-level popups.
      if (Platform.OS === 'web') {
        const existing = await notificationService.getQuranPermission();
        if (existing.status === 'undetermined') {
          const { status } = await notificationService.requestQuranPermission();
          if (status === 'granted') setPermGranted(true);
        }
      } else if (!permGranted) {
        const { status } = await notificationService.requestQuranPermission();
        if (status !== 'granted') {
          Alert.alert(
            'Notifications are off',
            'Allow notifications in your device settings to receive Quran popups one hour before your chosen time.'
          );
          return;
        }
        setPermGranted(true);
      }

      const slotObjects = slotObjectsFromSettings({ slots, customTime });
      if (slotObjects.length > 0) {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        await notificationService.scheduleQuranReminders(slotObjects, dayOfYear);
        setQuranSaved(true);
      } else {
        setQuranNotice('Choose at least one time, then save.');
      }
      // Persist here too: a typed custom time must survive a reload even when
      // the user taps Save without blurring the input first.
      await persistQuranSettings(true, slots, customTime);
    } catch {
      Alert.alert('Could not schedule reminders', 'Please try again.');
    } finally {
      setQuranSaving(false);
    }
  };

  const persistQuranSettings = async (enabled, slots, customTime) => {
    await AsyncStorage.setItem(STORAGE_KEY_QURAN, JSON.stringify({ enabled, slots, customTime }));
  };

  const markQuranRecited = async () => {
    const today = new Date().toDateString();
    const raw   = await AsyncStorage.getItem(STORAGE_KEY_STREAK);
    const data  = raw ? JSON.parse(raw) : { streak: 0, lastDate: null };
    if (data.lastDate === today) return; // already logged today
    const last = data.lastDate ? new Date(data.lastDate) : null;
    const diff = last ? Math.floor((new Date() - last) / 86400000) : 2;
    const newStreak = diff <= 1 ? data.streak + 1 : 1;
    await AsyncStorage.setItem(STORAGE_KEY_STREAK, JSON.stringify({ streak: newStreak, lastDate: today }));
    setQuranStreak(newStreak);
  };

  // ── Prayer reminders ─────────────────────────────────────────────────────
  const ensureAlertPermission = async () => {
    if (Platform.OS === 'web') return false;
    if (permGranted) return true;
    const { status } = await requestPerms();
    const granted = status === 'granted';
    setPermGranted(granted);
    return granted;
  };

  const togglePrayer = async (id, val) => {
    const next = { ...prayerToggles, [id]: val };
    const prayerName = PRAYER_REMINDERS.find(p => p.id === id)?.name || id;
    setPrayerToggles(next);
    await setItem('qitab_prayer_toggles', JSON.stringify(next));
    const hasToken = await hasAuthToken();
    if (hasToken) {
      try { await backend.updatePrayerToggles(next); } catch { /* ok */ }
    }

    const identifier = `prayer-reminder-${id}`;
    if (!val) {
      await cancelNotificationId(identifier);
      return;
    }
    if (Platform.OS === 'web') return;
    if (!(await ensureAlertPermission())) return;

    try {
      const timingsRaw = await AsyncStorage.getItem('qitab_home_timings');
      if (!timingsRaw) {
        Alert.alert(
          'Load prayer times first',
          'Open Prayer Times once so this reminder can use the adhan time for your city.'
        );
        return;
      }
      const prayerTime = JSON.parse(timingsRaw)[prayerName];
      if (!prayerTime) {
        Alert.alert('Prayer time unavailable', 'Open Prayer Times once to refresh today\'s timings, then try again.');
        return;
      }
      const scheduled = await scheduleDailyReminder({
        identifier,
        title: `🕌 Time for ${prayerName}`,
        body: 'It is time for prayer. May Allah accept your salah.',
        time: prayerTime,
        data: { kind: 'prayer', prayer: id },
      });
      if (!scheduled) {
        Alert.alert('Could not read the prayer time', 'Open Prayer Times once to refresh the timings.');
      }
    } catch {
      Alert.alert('Could not schedule reminder', 'Please try again.');
    }
  };

  // ── Custom reminders ─────────────────────────────────────────────────────
  const customReminderPayload = reminder => ({
    identifier: `custom-reminder-${reminder.id}`,
    title: `🔔 ${reminder.title}`,
    body: reminder.message || 'Time for your scheduled reminder.',
    time: reminder.time,
  });

  // On web there is no OS alarm; the open tab keeps a daily timer instead.
  const armWebReminders = list => {
    if (Platform.OS !== 'web') return;
    list.filter(r => r.enabled).forEach(r => notificationService.scheduleWebReminder(customReminderPayload(r)));
  };

  const scheduleCustomReminder = async reminder => {
    const payload = customReminderPayload(reminder);
    if (Platform.OS === 'web') return notificationService.scheduleWebReminder(payload);
    if (!(await ensureAlertPermission())) return null;
    return scheduleDailyReminder({
      ...payload,
      data: { kind: 'custom', id: reminder.id },
    });
  };

  const addReminder = async () => {
    const title = newTitle.trim();
    const time = newTime.trim();
    const message = newMsg.trim() || 'Time for your scheduled reminder.';

    if (!title || !time) {
      Alert.alert('Missing details', 'Add a title and a time for this reminder.');
      return;
    }
    if (!parseTimeInput(time)) {
      Alert.alert('Time not recognised', 'Use a format like 07:30 AM, 7:30 PM or 19:30.');
      return;
    }

    const r = {
      id: Date.now(),
      title,
      time,
      message,
      enabled: true,
    };
    const next = [...reminders, r];
    setReminders(next);
    await setItem('qitab_reminders', JSON.stringify(next));
    const hasToken = await hasAuthToken();
    if (hasToken) {
      try {
        await backend.addReminder({ title: r.title, time: r.time, description: r.message, enabled: true, type: 'custom' });
      } catch { /* ok */ }
    }
    try {
      await scheduleCustomReminder(r);
    } catch {
      Alert.alert('Reminder saved', 'It was saved, but the notification could not be scheduled. Enable notifications and toggle it on again.');
    }
    setNewTitle(''); setNewTime(''); setNewMsg('');
    setAddModal(false);
  };

  const deleteReminder = async (id) => {
    const next = reminders.filter(r => r.id !== id);
    setReminders(next);
    await setItem('qitab_reminders', JSON.stringify(next));
    await cancelNotificationId(`custom-reminder-${id}`);
  };

  const toggleCustom = async (id, val) => {
    const next = reminders.map(r => r.id === id ? { ...r, enabled: val } : r);
    setReminders(next);
    await setItem('qitab_reminders', JSON.stringify(next));

    if (!val) {
      await cancelNotificationId(`custom-reminder-${id}`);
      return;
    }
    const reminder = next.find(r => r.id === id);
    if (!reminder) return;
    try {
      const scheduled = await scheduleCustomReminder(reminder);
      if (Platform.OS !== 'web' && !scheduled && permGranted) {
        Alert.alert('Could not schedule reminder', 'Check the time format, then delete and re-create this reminder.');
      }
    } catch {
      Alert.alert('Could not schedule reminder', 'Please try again.');
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────
  const currentMsg = QURAN_MESSAGES_PREVIEW[msgPreviewIdx];
  const activePresets = QURAN_PRESETS.filter(p => quranSlots.includes(p.id));
  const activeSlotCount = activePresets.length + (parseTimeInput(quranCustomTime) ? 1 : 0);

  const TabBtn = ({ id, label, icon }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(id)}
      style={[styles.tabBtn, activeTab === id && { backgroundColor: COLORS.primary }]}
    >
      <Ionicons name={icon} size={14} color={activeTab === id ? '#fff' : COLORS.textSecondary} />
      <Text style={[styles.tabBtnText, { color: activeTab === id ? '#fff' : COLORS.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <Animated.ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >

        {/* ════ Permission Banner ════════════════════════════════════════════ */}
        {!permGranted && (
          <TouchableOpacity onPress={requestPerm} style={styles.permBanner}>
            <View style={[styles.permIconWrap, { backgroundColor: `${COLORS.amber}20` }]}>
              <Ionicons name="notifications-off" size={20} color={COLORS.amber} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: COLORS.amber, fontWeight: '800', fontSize: 14 }}>
                {permBlocked ? 'Notifications Blocked' : 'Notifications Disabled'}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>
                {permBlocked
                  ? Platform.OS === 'web'
                    ? 'Blocked by the browser. Tap to see how to allow them.'
                    : 'Blocked in device settings. Tap to allow them.'
                  : 'Tap to enable push notifications for all reminders.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.amber} />
          </TouchableOpacity>
        )}

        {/* ════ Tabs ═══════════════════════════════════════════════════════ */}
        <View style={styles.tabRow}>
          <TabBtn id="quran"  label="Quran"   icon="book-outline" />
          <TabBtn id="prayer" label="Prayer"  icon="moon-outline" />
          <TabBtn id="custom" label="Custom"  icon="alarm-outline" />
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            TAB: QURAN RECITATION REMINDERS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'quran' && (
          <View>
            {/* ── Hero Card ─────────────────────────────────────────────── */}
            <View style={[styles.quranHero, { backgroundColor: COLORS.primary }]}>
              {/* Decorative moon */}
              <Ionicons name="moon" size={100} color="rgba(255,255,255,0.06)"
                style={{ position: 'absolute', top: -20, right: -20 }} />
              <Ionicons name="star" size={10} color="rgba(255,255,255,0.25)"
                style={{ position: 'absolute', top: 18, right: 50 }} />
              <Ionicons name="star" size={7} color="rgba(255,255,255,0.20)"
                style={{ position: 'absolute', top: 35, right: 70 }} />

              <View style={styles.quranHeroTop}>
                <View style={styles.quranHeroIconWrap}>
                  <View style={styles.quranHeroPulse} />
                  <View style={styles.quranHeroIcon}>
                    <Ionicons name="book" size={28} color="#fff" />
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.quranHeroTitle}>Quran Recitation</Text>
                  <Text style={styles.quranHeroSub}>Daily tilawah reminders</Text>
                </View>
                <Switch
                  value={quranEnabled}
                  onValueChange={toggleQuranEnabled}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.45)' }}
                  thumbColor={quranEnabled ? '#fff' : 'rgba(255,255,255,0.7)'}
                />
              </View>

              {/* Rotating motivational message */}
              <Animated.View style={[styles.quranHeroMsg, { opacity: msgAnim }]}>
                <Text style={styles.quranHeroMsgEmoji}>{currentMsg.emoji}</Text>
                <Text style={styles.quranHeroMsgText} numberOfLines={2}>
                  {currentMsg.text}
                </Text>
              </Animated.View>

              {/* Streak pill */}
              <View style={styles.streakRow}>
                <TouchableOpacity style={styles.streakPill} onPress={markQuranRecited}>
                  <Ionicons name="flame" size={14} color="#fbbf24" />
                  <Text style={styles.streakNum}>{quranStreak}</Text>
                  <Text style={styles.streakLabel}>day streak</Text>
                </TouchableOpacity>
                <View style={styles.streakPill}>
                  <Ionicons name="checkmark-circle" size={14} color="#34d399" />
                  <Text style={[styles.streakLabel, { color: 'rgba(255,255,255,0.85)' }]}>
                    {activeSlotCount} slot{activeSlotCount !== 1 ? 's' : ''} active
                  </Text>
                </View>
                <TouchableOpacity style={styles.streakBadge} onPress={markQuranRecited}>
                  <Text style={styles.streakBadgeText}>✓ Recited Today</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Choose Time Slots ─────────────────────────────────────── */}
            <Text style={[styles.sectionLabel, { color: COLORS.textSecondary, marginTop: 20, marginBottom: 10 }]}>
              CHOOSE REMINDER TIMES
            </Text>
            <View style={styles.presetGrid}>
              {QURAN_PRESETS.map(preset => {
                const isOn = quranSlots.includes(preset.id);
                const popupTime = advanceByMinutes(preset.hour, preset.minute);
                return (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => toggleQuranSlot(preset.id)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isOn ? `${COLORS.primary}22` : COLORS.glass,
                        borderColor:     isOn ? COLORS.primary         : COLORS.glassBorder,
                      },
                    ]}
                  >
                    <View style={[styles.presetDot, { backgroundColor: isOn ? COLORS.primary : COLORS.glassBorder }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.presetLabel, { color: isOn ? COLORS.primary : COLORS.textPrimary }]}>
                        {preset.label}
                      </Text>
                      <Text style={[styles.presetTime, { color: COLORS.textSecondary }]}>
                        {preset.hour.toString().padStart(2, '0')}:{preset.minute.toString().padStart(2, '0')}
                        {'  ·  '}
                        popup {formatTime12(popupTime)}
                      </Text>
                    </View>
                    <Ionicons
                      name={isOn ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={isOn ? COLORS.primary : COLORS.glassBorder}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Custom Time ───────────────────────────────────────────── */}
            <Text style={[styles.sectionLabel, { color: COLORS.textSecondary, marginTop: 18, marginBottom: 8 }]}>
              CUSTOM TIME (OPTIONAL)
            </Text>
            <TimeField
              value={quranCustomTime}
              placeholder="Tap to choose a time"
              onChange={async next => {
                setQuranCustomTime(next);
                await persistQuranSettings(quranEnabled, quranSlots, next);
                if (quranEnabled) {
                  await saveAndScheduleQuranReminders(quranSlots, next, true);
                } else {
                  setQuranSaved(false);
                  setQuranNotice('Time saved. Turn on the Quran reminder switch to receive popups.');
                }
              }}
            />
            {quranCustomTime ? (
              <TouchableOpacity
                onPress={async () => {
                  setQuranCustomTime('');
                  await persistQuranSettings(quranEnabled, quranSlots, '');
                  if (quranEnabled) await saveAndScheduleQuranReminders(quranSlots, '', true);
                }}
                style={{ alignSelf: 'flex-end', marginBottom: 6 }}
              >
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Clear custom time</Text>
              </TouchableOpacity>
            ) : null}

            {/* ── Save Button ───────────────────────────────────────────── */}
            <TouchableOpacity
              style={[globalStyles.btnPrimary, { marginTop: 14, opacity: quranSaving ? 0.7 : 1 }]}
              onPress={() => saveAndScheduleQuranReminders(quranSlots, quranCustomTime, quranEnabled)}
              disabled={quranSaving}
            >
              <Ionicons name={quranSaving ? 'hourglass-outline' : 'notifications-outline'} size={18} color="#fff" />
              <Text style={[globalStyles.btnPrimaryText, { color: '#fff' }]}>
                {quranSaving ? 'Scheduling…' : 'Save & Schedule Popups'}
              </Text>
            </TouchableOpacity>

            {quranSaved && (
              <View style={[styles.savedNote, { borderColor: `${COLORS.emerald}40`, backgroundColor: `${COLORS.emerald}12` }]}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.emerald} />
                <Text style={{ color: COLORS.emerald, fontSize: 12.5, fontWeight: '700', flex: 1 }}>
                  Popup reminders set — one hour before each selected time.
                </Text>
              </View>
            )}

            {quranNotice ? (
              <View style={[styles.savedNote, { borderColor: `${COLORS.amber}40`, backgroundColor: `${COLORS.amber}12` }]}>
                <Ionicons name="information-circle" size={16} color={COLORS.amber} />
                <Text style={{ color: COLORS.amber, fontSize: 12.5, fontWeight: '700', flex: 1 }}>
                  {quranNotice}
                </Text>
              </View>
            ) : null}

            {/* ── Reminder chime ────────────────────────────────────────── */}
            <View style={[styles.soundCard, { backgroundColor: COLORS.glass, borderColor: COLORS.glassBorder }]}>
              <View style={styles.soundRow}>
                <View style={[styles.soundIcon, {
                  backgroundColor: reminderSound ? `${COLORS.primary}1F` : `${COLORS.textSecondary}14`,
                }]}>
                  <Ionicons
                    name={reminderSound ? 'volume-high' : 'volume-mute'}
                    size={20}
                    color={reminderSound ? COLORS.primary : COLORS.textSecondary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 14 }}>
                    Reminder Chime
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 16, marginTop: 2 }}>
                    {reminderSound
                      ? `${selectedSound.name} plays when a reminder pops up.`
                      : 'Popup sound is off. Choose a chime to audition it.'}
                  </Text>
                </View>
                <Switch
                  value={reminderSound}
                  onValueChange={toggleReminderSound}
                  trackColor={{ false: COLORS.glassBorder, true: `${COLORS.primary}80` }}
                  thumbColor={reminderSound ? COLORS.primary : '#cbd5e1'}
                />
              </View>

              <Text style={[styles.soundPickerLabel, { color: COLORS.textSecondary }]}>
                CHOOSE A CHIME
              </Text>
              <View style={styles.soundGrid}>
                {REMINDER_SOUNDS.map(sound => {
                  const isSelected = sound.id === soundId;
                  return (
                    <TouchableOpacity
                      key={sound.id}
                      onPress={() => selectSound(sound.id)}
                      style={[styles.soundOption, {
                        backgroundColor: isSelected ? `${COLORS.primary}1A` : COLORS.bgSecondary,
                        borderColor: isSelected ? COLORS.primary : COLORS.glassBorder,
                      }]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${sound.name}: ${sound.description}`}
                    >
                      <View style={styles.soundOptionTop}>
                        <View style={[styles.soundOptionIcon, {
                          backgroundColor: isSelected ? `${COLORS.primary}24` : COLORS.glass,
                        }]}>
                          <Ionicons
                            name={sound.icon}
                            size={16}
                            color={isSelected ? COLORS.primary : COLORS.textSecondary}
                          />
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />}
                      </View>
                      <Text
                        style={[styles.soundOptionName, { color: isSelected ? COLORS.primary : COLORS.textPrimary }]}
                        numberOfLines={1}
                      >
                        {sound.name}
                      </Text>
                      <Text style={[styles.soundOptionDesc, { color: COLORS.textSecondary }]} numberOfLines={1}>
                        {sound.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={previewSound}
                style={[styles.previewBtn, { borderColor: `${COLORS.primary}40`, backgroundColor: `${COLORS.primary}0F` }]}
                accessibilityRole="button"
                accessibilityLabel={`Preview ${selectedSound.name}`}
              >
                <Ionicons name="play-circle" size={17} color={COLORS.primary} />
                <Text style={{ color: COLORS.primary, fontSize: 12.5, fontWeight: '700' }}>
                  Preview {selectedSound.name}
                </Text>
              </TouchableOpacity>

              {!reminderSound && (
                <Text style={{ color: COLORS.textSecondary, fontSize: 10.5, marginTop: 8, textAlign: 'center', lineHeight: 15 }}>
                  Chime is off — turn it on above to hear it at reminder time. System notifications use your device sound.
                </Text>
              )}
            </View>

            {/* ── Tips card ─────────────────────────────────────────────── */}
            <View style={[styles.tipsCard, { marginTop: 18 }]}>
              <View style={styles.tipsHeader}>
                <Ionicons name="information-circle" size={16} color={COLORS.primary} />
                <Text style={[styles.sectionLabel, { color: COLORS.primary, marginBottom: 0, marginLeft: 6 }]}>
                  HOW IT WORKS
                </Text>
              </View>
              {[
                'Pick one or more time slots for Quran recitation.',
                'A popup notification appears ONE HOUR BEFORE each slot, so you can prepare.',
                'Each popup shows a rotating Hadith or Ayah as motivation.',
                'Choose from four chimes; your pick is saved on this device.',
                Platform.OS === 'web'
                  ? 'Keep this tab open — popups appear while the app is open, and allow browser notifications for system popups.'
                  : 'Popups repeat daily, even when the app is closed.',
                Platform.OS === 'web'
                  ? 'Tap a chime or Preview once so the browser allows the reminder sound.'
                  : 'The selected chime plays with the in-app popup; scheduled system notifications use your device sound.',
                'Tap "✓ Recited Today" on the card above to maintain your streak.',
              ].map((tip, i) => (
                <View key={i} style={[globalStyles.row, { alignItems: 'flex-start', marginTop: 8, gap: 8 }]}>
                  <Ionicons name="checkmark-circle" size={15} color={COLORS.primary} style={{ marginTop: 2 }} />
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12.5, flex: 1, lineHeight: 19 }}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: PRAYER REMINDERS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'prayer' && (
          <View>
            <Text style={[styles.sectionLabel, { color: COLORS.textSecondary, marginBottom: 12 }]}>
              5 DAILY PRAYERS
            </Text>
            {PRAYER_REMINDERS.map(p => (
              <View key={p.id} style={styles.reminderRow}>
                <View style={[styles.prayerIcon, { backgroundColor: `${p.color}18`, borderColor: `${p.color}40` }]}>
                  <Ionicons name={p.icon} size={22} color={p.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 }}>{p.name}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                    {prayerToggles[p.id] ? '🔔 Reminder active' : 'Reminder disabled'}
                  </Text>
                </View>
                <Switch
                  value={!!prayerToggles[p.id]}
                  onValueChange={v => togglePrayer(p.id, v)}
                  trackColor={{ false: COLORS.glassBorder, true: `${p.color}80` }}
                  thumbColor={prayerToggles[p.id] ? p.color : '#cbd5e1'}
                />
              </View>
            ))}

            <View style={[styles.tipsCard, { marginTop: 16 }]}>
              <View style={styles.tipsHeader}>
                <Ionicons name="information-circle" size={16} color={COLORS.emerald} />
                <Text style={[styles.sectionLabel, { color: COLORS.emerald, marginBottom: 0, marginLeft: 6 }]}>TIPS</Text>
              </View>
              {[
                'Prayer reminders notify you at adhan time when timings are loaded.',
                'Grant location access for accurate prayer times in your city.',
                'Enable all 5 prayers to never miss a Salah.',
              ].map((tip, i) => (
                <View key={i} style={[globalStyles.row, { alignItems: 'flex-start', marginTop: 8, gap: 8 }]}>
                  <Ionicons name="checkmark-circle" size={15} color={COLORS.emerald} style={{ marginTop: 2 }} />
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12.5, flex: 1, lineHeight: 19 }}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: CUSTOM REMINDERS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'custom' && (
          <View>
            <View style={[globalStyles.spaceBetween, { marginBottom: 12 }]}>
              <Text style={[styles.sectionLabel, { color: COLORS.textSecondary }]}>MY REMINDERS</Text>
              <TouchableOpacity onPress={() => setAddModal(true)} style={styles.addBtn}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add New</Text>
              </TouchableOpacity>
            </View>

            {reminders.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: `${COLORS.primary}15` }]}>
                  <Ionicons name="alarm-outline" size={36} color={COLORS.primary} />
                </View>
                <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 16, marginTop: 14 }}>
                  No Reminders Yet
                </Text>
                <Text style={{ color: COLORS.textSecondary, marginTop: 6, textAlign: 'center', fontSize: 13, lineHeight: 19 }}>
                  Create custom reminders for Dhikr, Dua, reading, or any Islamic activity.
                </Text>
                <TouchableOpacity
                  style={[globalStyles.btnPrimary, { marginTop: 20, alignSelf: 'center', paddingHorizontal: 24 }]}
                  onPress={() => setAddModal(true)}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={[globalStyles.btnPrimaryText, { color: '#fff' }]}>Create First Reminder</Text>
                </TouchableOpacity>
              </View>
            ) : reminders.map(r => (
              <View key={r.id} style={styles.customRow}>
                <View style={[styles.customRowDot, { backgroundColor: r.enabled ? COLORS.primary : COLORS.glassBorder }]} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 }}>{r.title}</Text>
                  <View style={globalStyles.row}>
                    <Ionicons name="time-outline" size={12} color={COLORS.gold} />
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginLeft: 4 }}>{r.time}</Text>
                  </View>
                  {r.message ? (
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      {r.message}
                    </Text>
                  ) : null}
                </View>
                <Switch
                  value={!!r.enabled}
                  onValueChange={v => toggleCustom(r.id, v)}
                  trackColor={{ false: COLORS.glassBorder, true: `${COLORS.primary}80` }}
                  thumbColor={r.enabled ? COLORS.primary : '#cbd5e1'}
                />
                <TouchableOpacity onPress={() => deleteReminder(r.id)} style={{ marginLeft: 10 }}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </Animated.ScrollView>

      {/* ════ Add Reminder Modal ══════════════════════════════════════════ */}
      <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => setAddModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={[styles.modal, { backgroundColor: COLORS.bgSecondary, maxHeight: '90%' }]}>
            {/* Handle */}
            <View style={[styles.modalHandle, { backgroundColor: COLORS.glassBorder }]} />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={[globalStyles.spaceBetween, { marginBottom: 20 }]}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '900', fontSize: 20 }}>New Reminder</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Ionicons name="close-circle" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>TITLE</Text>
            <View style={[globalStyles.input, { marginBottom: 14 }]}>
              <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15, marginLeft: 8 }}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Morning Dhikr"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <Text style={styles.sectionLabel}>TIME</Text>
            <TimeField value={newTime} onChange={setNewTime} placeholder="Tap to choose a time" inline />

            <Text style={styles.sectionLabel}>MESSAGE (OPTIONAL)</Text>
            <View style={[globalStyles.input, { marginBottom: 24 }]}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15, marginLeft: 8 }}
                value={newMsg}
                onChangeText={setNewMsg}
                placeholder="Custom notification message"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <TouchableOpacity style={globalStyles.btnPrimary} onPress={addReminder}>
              <Ionicons name="notifications-outline" size={18} color="#fff" />
              <Text style={[globalStyles.btnPrimaryText, { color: '#fff' }]}>Create Reminder</Text>
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = COLORS => StyleSheet.create({
  // Tab bar
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    padding: 5,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: 12,
  },
  tabBtnText: { fontSize: 12, fontWeight: '700' },

  // Permission banner
  permBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    backgroundColor: `${COLORS.amber}12`,
    borderRadius: 16, borderWidth: 1, borderColor: `${COLORS.amber}40`, marginBottom: 16,
  },
  permIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Section label
  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1, color: COLORS.textSecondary, marginBottom: 0,
  },

  // Quran hero card
  quranHero: {
    borderRadius: 24, overflow: 'hidden', padding: 20, marginBottom: 4,
  },
  quranHeroTop: { flexDirection: 'row', alignItems: 'center' },
  quranHeroIconWrap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  quranHeroPulse: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  quranHeroIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  quranHeroTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  quranHeroSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  quranHeroMsg: {
    marginTop: 16, padding: 12, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  },
  quranHeroMsgEmoji: { fontSize: 18, marginTop: 1 },
  quranHeroMsgText:  { color: 'rgba(255,255,255,0.9)', fontSize: 12.5, flex: 1, lineHeight: 19, fontStyle: 'italic' },
  streakRow: { flexDirection: 'row', marginTop: 14, gap: 8, flexWrap: 'wrap' },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  streakNum:   { color: '#fbbf24', fontWeight: '900', fontSize: 15 },
  streakLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  streakBadge: {
    backgroundColor: 'rgba(52,211,153,0.25)', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)',
  },
  streakBadgeText: { color: '#34d399', fontSize: 12, fontWeight: '700' },

  // Preset grid
  presetGrid: { gap: 8 },
  presetChip: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 16, borderWidth: 1, gap: 12,
  },
  presetDot: { width: 8, height: 8, borderRadius: 4 },
  presetLabel: { fontSize: 14, fontWeight: '700' },
  presetTime:  { fontSize: 11, fontWeight: '600', marginTop: 2 },
  savedNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 10,
  },

  // Reminder chime
  soundCard: {
    borderRadius: 18, borderWidth: 1, padding: 14, marginTop: 14,
  },
  soundRow: { flexDirection: 'row', alignItems: 'center' },
  soundIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  soundPickerLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 14, marginBottom: 8,
  },
  soundGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  soundOption: {
    width: '48%', flexGrow: 1, padding: 10,
    borderRadius: 12, borderWidth: 1,
  },
  soundOptionTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  soundOptionIcon: {
    width: 28, height: 28, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  soundOptionName: { fontSize: 12, fontWeight: '800', marginTop: 8 },
  soundOptionDesc: { fontSize: 10, marginTop: 2 },
  previewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderRadius: 12,
    paddingVertical: 9, marginTop: 12,
  },

  // Prayer rows
  reminderRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    backgroundColor: COLORS.glass, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.glassBorder, marginBottom: 10,
  },
  prayerIcon: {
    width: 46, height: 46, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Custom reminder rows
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  emptyState: {
    alignItems: 'center', padding: 36,
    backgroundColor: COLORS.glass, borderRadius: 24, borderWidth: 1,
    borderColor: COLORS.glassBorder, borderStyle: 'dashed',
  },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  customRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    backgroundColor: COLORS.glass, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.glassBorder, marginBottom: 10, gap: 10,
  },
  customRowDot: { width: 6, height: 32, borderRadius: 3 },

  // Add modal
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  // Time picker
  inlinePicker: {
    borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 16,
    backgroundColor: COLORS.glass, padding: 14, marginBottom: 14,
  },
  timeChip: {
    minWidth: 48, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass, alignItems: 'center',
  },
  timeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timeChipText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
  timeChipTextActive: { color: '#fff' },

  // Tips card
  tipsCard: {
    padding: 16, backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
});
