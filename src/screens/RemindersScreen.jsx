import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Switch, Modal, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { getItem, setItem } from '../firebase/syncedStorage';
import { COLORS, globalStyles } from '../theme';
import { backend } from '../services/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const scheduleNotif = async (content, trigger) => {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({ content, trigger });
};
const getPerms = async () => {
  if (Platform.OS === 'web') return { status: 'granted' };
  return Notifications.getPermissionsAsync();
};
const requestPerms = async () => {
  if (Platform.OS === 'web') return { status: 'granted' };
  return Notifications.requestPermissionsAsync();
};

const PRAYER_REMINDERS = [
  { id: 'fajr', name: 'Fajr', icon: 'partly-sunny-outline', color: '#ffffff' },
  { id: 'dhuhr', name: 'Dhuhr', icon: 'sunny', color: '#ffffff' },
  { id: 'asr', name: 'Asr', icon: 'partly-sunny', color: '#ffffff' },
  { id: 'maghrib', name: 'Maghrib', icon: 'cloudy-night-outline', color: '#ff4444' },
  { id: 'isha', name: 'Isha', icon: 'moon-outline', color: '#ffffff' },
];

export default function RemindersScreen() {
  const [permGranted, setPermGranted] = useState(false);
  const [prayerToggles, setPrayerToggles] = useState({});
  const [reminders, setReminders] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newMsg, setNewMsg] = useState('');

  useEffect(() => {
    checkPermission();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const hasToken = await AsyncStorage.getItem('qitab_auth_token');
      if (hasToken) {
        try {
          const [apiToggles, apiReminders] = await Promise.all([
            backend.getPrayerToggles(),
            backend.getReminders(),
          ]);
          if (apiToggles?.toggles) setPrayerToggles(apiToggles.toggles);
          if (apiReminders) setReminders(apiReminders);
          return;
        } catch (e) { /* fall through to local */ }
      }
      getItem('qitab_prayer_toggles').then(v => v && setPrayerToggles(JSON.parse(v)));
      getItem('qitab_reminders').then(v => v && setReminders(JSON.parse(v)));
    } catch (e) {
      getItem('qitab_prayer_toggles').then(v => v && setPrayerToggles(JSON.parse(v)));
      getItem('qitab_reminders').then(v => v && setReminders(JSON.parse(v)));
    }
  };

  const checkPermission = async () => {
    const { status } = await getPerms();
    setPermGranted(status === 'granted');
  };

  const requestPerm = async () => {
    const { status } = await requestPerms();
    setPermGranted(status === 'granted');
  };

  const togglePrayer = async (id, val) => {
    const next = { ...prayerToggles, [id]: val };
    setPrayerToggles(next);
    await setItem('qitab_prayer_toggles', JSON.stringify(next));

    // Also save to backend if logged in
    const hasToken = await AsyncStorage.getItem('qitab_auth_token');
    if (hasToken) {
      try { await backend.updatePrayerToggles(next); } catch (e) { /* backend unavailable */ }
    }

    if (val && permGranted) {
      // Schedule notification at actual prayer time if we have timing data
      try {
        const timingsRaw = await AsyncStorage.getItem('qitab_home_timings');
        if (timingsRaw) {
          const timings = JSON.parse(timingsRaw);
          const prayerTime = timings[PRAYER_REMINDERS.find(p => p.id === id)?.name];
          if (prayerTime) {
            const [h, m] = prayerTime.split(':');
            const now = new Date();
            const scheduled = new Date();
            scheduled.setHours(parseInt(h), parseInt(m), 0, 0);
            if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1);
            const secondsUntil = Math.floor((scheduled - now) / 1000);
            await scheduleNotif({
              title: `🕌 Time for ${PRAYER_REMINDERS.find(p => p.id === id)?.name || id}`,
              body: 'It is time for prayer. May Allah accept your salah.',
              sound: true,
            }, { seconds: Math.min(secondsUntil, 86400) });
            return;
          }
        }
        // Fallback: schedule a test notification in 60 seconds
        await scheduleNotif({
          title: `🕌 ${PRAYER_REMINDERS.find(p => p.id === id)?.name || id} reminder enabled`,
          body: 'You will be notified at prayer time when prayer times are loaded.',
          sound: true,
        }, { seconds: 60 });
      } catch (e) {
        await scheduleNotif({
          title: `🕌 ${PRAYER_REMINDERS.find(p => p.id === id)?.name || id} reminder enabled`,
          body: 'You will be notified at prayer time.',
          sound: true,
        }, { seconds: 60 });
      }
    }
  };

  const addReminder = async () => {
    if (!newTitle.trim() || !newTime.trim()) return;
    const r = {
      id: Date.now(),
      title: newTitle.trim(),
      time: newTime.trim(),
      message: newMsg.trim() || 'Time for your scheduled reminder.',
      enabled: true,
    };
    const next = [...reminders, r];
    setReminders(next);
    await setItem('qitab_reminders', JSON.stringify(next));

    // Also save to backend if logged in
    const hasToken = await AsyncStorage.getItem('qitab_auth_token');
    if (hasToken) {
      try {
        await backend.addReminder({
          title: r.title,
          time: r.time,
          description: r.message,
          enabled: true,
          type: 'custom',
        });
      } catch (e) { /* backend unavailable */ }
    }

    if (permGranted) {
      // Parse the time string and schedule at that time today or tomorrow
      try {
        const timeMatch = newTime.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const ampm = timeMatch[3]?.toUpperCase();
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          if (!ampm && hours < 12) hours += 12; // assume PM if no indicator and < 12

          const now = new Date();
          const scheduled = new Date();
          scheduled.setHours(hours, minutes, 0, 0);
          if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1);
          const secondsUntil = Math.floor((scheduled - now) / 1000);
          await scheduleNotif({
            title: `🔔 ${r.title}`,
            body: r.message,
            sound: true,
          }, { seconds: Math.min(secondsUntil, 86400) });
        } else {
          // Fallback: test notification in 60s
          await scheduleNotif({
            title: `🔔 ${r.title}`,
            body: r.message,
            sound: true,
          }, { seconds: 60 });
        }
      } catch (e) {
        await scheduleNotif({
          title: `🔔 ${r.title}`,
          body: r.message,
          sound: true,
        }, { seconds: 60 });
      }
    }
    setNewTitle(''); setNewTime(''); setNewMsg('');
    setAddModal(false);
  };

  const deleteReminder = async (id) => {
    const next = reminders.filter(r => r.id !== id);
    setReminders(next);
    await setItem('qitab_reminders', JSON.stringify(next));
  };

  const toggleCustom = async (id, val) => {
    const next = reminders.map(r => r.id === id ? { ...r, enabled: val } : r);
    setReminders(next);
    await setItem('qitab_reminders', JSON.stringify(next));
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Permission Banner */}
        {!permGranted && (
          <TouchableOpacity onPress={requestPerm} style={styles.permBanner}>
            <Ionicons name="notifications-off-outline" size={22} color={COLORS.amber} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: COLORS.amber, fontWeight: '800' }}>Notifications Disabled</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>Tap to enable notifications for prayer reminders.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.amber} />
          </TouchableOpacity>
        )}

        {/* Prayer Reminders */}
        <Text style={[globalStyles.sectionTitle, { marginBottom: 12 }]}>Prayer Reminders</Text>
        {PRAYER_REMINDERS.map(p => (
          <View key={p.id} style={styles.reminderRow}>
            <View style={[styles.prayerIcon, { backgroundColor: `${p.color}18` }]}>
              <Ionicons name={p.icon} size={22} color={p.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 }}>{p.name}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                {prayerToggles[p.id] ? 'Reminder enabled' : 'Reminder disabled'}
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

        {/* Custom Reminders */}
        <View style={[globalStyles.spaceBetween, { marginTop: 24, marginBottom: 12 }]}>
          <Text style={globalStyles.sectionTitle}>Custom Reminders</Text>
          <TouchableOpacity onPress={() => setAddModal(true)} style={styles.addBtn}>
            <Ionicons name="add" size={20} color="#000" />
            <Text style={{ color: '#000', fontWeight: '700', fontSize: 13 }}>Add</Text>
          </TouchableOpacity>
        </View>

        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="alarm-outline" size={40} color={COLORS.glassBorder} />
            <Text style={{ color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' }}>
              No custom reminders yet. Tap "Add" to create one.
            </Text>
          </View>
        ) : reminders.map(r => (
          <View key={r.id} style={styles.customRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 }}>{r.title}</Text>
              <View style={globalStyles.row}>
                <Ionicons name="time-outline" size={12} color={COLORS.gold} />
                <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginLeft: 4 }}>{r.time}</Text>
              </View>
              {r.message ? <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{r.message}</Text> : null}
            </View>
            <Switch
              value={!!r.enabled}
              onValueChange={v => toggleCustom(r.id, v)}
              trackColor={{ false: COLORS.glassBorder, true: `${COLORS.gold}80` }}
              thumbColor={r.enabled ? COLORS.gold : '#cbd5e1'}
            />
            <TouchableOpacity onPress={() => deleteReminder(r.id)} style={{ marginLeft: 10 }}>
              <Ionicons name="trash-outline" size={18} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={[globalStyles.label, { color: COLORS.emerald, marginBottom: 8 }]}>TIPS</Text>
          {[
            'Prayer reminders will notify you approximately at prayer time.',
            'Custom reminders schedule a test notification 10 seconds after creation.',
            'For accurate prayer time notifications, grant location permission.',
          ].map((tip, i) => (
            <View key={i} style={[globalStyles.row, { alignItems: 'flex-start', marginBottom: 8, gap: 8 }]}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.emerald} style={{ marginTop: 2 }} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, flex: 1, lineHeight: 20 }}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => setAddModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={{ backgroundColor: COLORS.bgSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 20 }]}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '900', fontSize: 20 }}>New Reminder</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={globalStyles.label}>TITLE</Text>
            <View style={[globalStyles.input, { marginBottom: 14 }]}>
              <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15, marginLeft: 8 }}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Quran reading"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <Text style={globalStyles.label}>TIME (e.g. 07:30 AM)</Text>
            <View style={[globalStyles.input, { marginBottom: 14 }]}>
              <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15, marginLeft: 8 }}
                value={newTime}
                onChangeText={setNewTime}
                placeholder="07:30 AM"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <Text style={globalStyles.label}>MESSAGE (OPTIONAL)</Text>
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
              <Ionicons name="notifications-outline" size={18} color="#000" />
              <Text style={globalStyles.btnPrimaryText}>Create Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.3)',
    marginBottom: 20,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 10,
  },
  prayerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderStyle: 'dashed',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 10,
    gap: 10,
  },
  tipsCard: {
    marginTop: 20,
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.2)',
  },
});
