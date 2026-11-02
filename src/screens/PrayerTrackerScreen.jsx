import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';

export const PRAYERS = [
  // Drawn icons rather than emoji: emoji render differently on every platform,
  // cannot take the theme's colour, and scale badly against the type. Each
  // glyph tracks the sun through the day, so the column reads as a timeline.
  // Every name is verified against the Ionicons glyph map.
  { key: 'fajr', name: 'Fajr', icon: 'partly-sunny-outline', tint: 'blue', time: 'Dawn' },
  { key: 'dhuhr', name: 'Dhuhr', icon: 'sunny-outline', tint: 'amber', time: 'Noon' },
  { key: 'asr', name: 'Asr', icon: 'cloudy-outline', tint: 'cyan', time: 'Afternoon' },
  { key: 'maghrib', name: 'Maghrib', icon: 'contrast-outline', tint: 'purple', time: 'Sunset' },
  { key: 'isha', name: 'Isha', icon: 'moon-outline', tint: 'gold', time: 'Night' },
  { key: 'jummah', name: 'Jummah', icon: 'people-outline', tint: 'emerald', time: 'Friday' },
];

function getTodayKey() {
  const d = new Date();
  return `prayer_log_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

function getWeekKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + offset);
  return `prayer_log_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

export default function PrayerTrackerScreen() {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [log, setLog] = useState({});
  const [streak, setStreak] = useState(0);
  const [weekData, setWeekData] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, weekAvg: 0 });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const todayKey = getTodayKey();
      const raw = await AsyncStorage.getItem(todayKey);
      setLog(raw ? JSON.parse(raw) : {});

      // Calculate streak
      let currentStreak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `prayer_log_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
        const data = await AsyncStorage.getItem(key);
        const parsed = data ? JSON.parse(data) : {};
        const prayed = Object.values(parsed).filter(Boolean).length;
        if (prayed >= 3) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }
      }
      setStreak(currentStreak);

      // Week data
      const week = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + i);
        const key = `prayer_log_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
        const data = await AsyncStorage.getItem(key);
        const parsed = data ? JSON.parse(data) : {};
        const count = Object.values(parsed).filter(Boolean).length;
        week.push({
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          count,
          isToday: i === d.getDay(),
        });
      }
      setWeekData(week);

      // Stats
      const todayCount = Object.values(log).filter(Boolean).length;
      const weekAvg = week.reduce((s, d) => s + d.count, 0) / 7;
      setStats({ total: currentStreak * 5 + todayCount, today: todayCount, weekAvg: weekAvg.toFixed(1) });
    } catch {}
  };

  const togglePrayer = async (prayerKey) => {
    const updated = { ...log, [prayerKey]: !log[prayerKey] };
    setLog(updated);
    await AsyncStorage.setItem(getTodayKey(), JSON.stringify(updated));
    loadAll();
  };

  const getPrayedCount = () => Object.values(log).filter(Boolean).length;

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakGlow} />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
            <Text style={styles.streakSub}>Keep it up! Pray 3+ daily prayers</Text>
          </View>
          <View style={styles.streakBadgeRow}>
            <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 255, 255,0.15)' }]}>
              <Ionicons name="flame" size={14} color={COLORS.emerald} />
              <Text style={[styles.streakBadgeText, { color: COLORS.emerald }]}>{getPrayedCount()}/5 Today</Text>
            </View>
            <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 255, 255,0.15)' }]}>
              <Ionicons name="star" size={14} color={COLORS.gold} />
              <Text style={[styles.streakBadgeText, { color: COLORS.gold }]}>{stats.weekAvg} avg/day</Text>
            </View>
          </View>
        </View>

        {/* Week Progress */}
        <View style={styles.weekSection}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekRow}>
            {weekData.map((d, i) => (
              <View key={i} style={styles.weekCol}>
                <View style={[styles.weekBar, d.isToday && styles.weekBarToday]}>
                  <View style={[styles.weekFill, { height: `${(d.count / 5) * 100}%` }]} />
                </View>
                <Text style={[styles.weekDayText, d.isToday && styles.weekDayActive]}>{d.day}</Text>
                <Text style={styles.weekCount}>{d.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Prayer Checklist */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Today's Prayers</Text>
          {PRAYERS.map((p) => {
            const prayed = log[p.key] || false;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => togglePrayer(p.key)}
                style={[styles.prayerCard, prayed && styles.prayerCardDone]}
                activeOpacity={0.7}
              >
                {/* The plate carries the prayer's tint so the list can be
                    scanned by colour, matching the module grid elsewhere. */}
                <View style={[
                  styles.prayerIconWrap,
                  {
                    backgroundColor: (COLORS[p.tint] || COLORS.gold) + '1F',
                    borderColor: (COLORS[p.tint] || COLORS.gold) + '3D',
                  },
                ]}>
                  <Ionicons
                    name={prayed ? p.icon.replace('-outline', '') : p.icon}
                    size={21}
                    color={COLORS[p.tint] || COLORS.gold}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prayerName, prayed && styles.prayerNameDone]}>{p.name}</Text>
                  <Text style={styles.prayerTime}>{p.time}</Text>
                </View>
                <View style={[styles.checkCircle, prayed && styles.checkCircleDone]}>
                  {prayed && <Ionicons name="checkmark" size={18} color="#000" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Motivation */}
        {getPrayedCount() === 5 && (
          <View style={styles.completeCard}>
            <Text style={{ fontSize: 48 }}>🎉</Text>
            <Text style={styles.completeText}>All 5 Prayers Completed!</Text>
            <Text style={styles.completeSub}>May Allah accept your prayers. Ameen.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  streakCard: {
    margin: 16, borderRadius: 24, padding: 24, overflow: 'hidden',
    backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  streakGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255,0.06)',
  },
  streakNum: { color: COLORS.emerald, fontSize: 56, fontWeight: '900' },
  streakLabel: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginTop: -4 },
  streakSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  streakBadgeRow: {
    flexDirection: 'row', gap: 10, marginTop: 16, justifyContent: 'center',
  },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  streakBadgeText: { fontSize: 12, fontWeight: '700' },
  weekSection: {
    paddingHorizontal: 16, marginTop: 8,
  },
  sectionTitle: {
    color: COLORS.gold, fontSize: 17, fontWeight: '800',
    marginBottom: 12,
  },
  weekRow: {
    flexDirection: 'row', gap: 6,
    backgroundColor: COLORS.glass,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder,
    padding: 16, justifyContent: 'space-between',
  },
  weekCol: { alignItems: 'center', gap: 6 },
  weekBar: {
    width: 28, height: 80, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  weekBarToday: { borderWidth: 1, borderColor: COLORS.gold },
  weekFill: {
    backgroundColor: COLORS.emerald,
    borderRadius: 14,
    minHeight: 4,
  },
  weekDayText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  weekDayActive: { color: COLORS.gold, fontWeight: '800' },
  weekCount: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '800' },
  prayerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.glass,
    borderRadius: 18, borderWidth: 1, borderColor: COLORS.glassBorder,
    padding: 16, marginBottom: 10,
  },
  prayerCardDone: {
    borderColor: COLORS.emerald,
    backgroundColor: 'rgba(255, 255, 255,0.06)',
  },
  prayerIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  prayerName: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  prayerNameDone: { color: COLORS.emerald },
  prayerTime: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  checkCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: COLORS.textSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleDone: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
  },
  completeCard: {
    margin: 16, padding: 24, borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255,0.3)',
    alignItems: 'center',
  },
  completeText: { color: COLORS.emerald, fontSize: 20, fontWeight: '900', marginTop: 12 },
  completeSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
});
