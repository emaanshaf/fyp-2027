import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';

const SUHOOR_DUA = 'وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ';
const IFTAR_DUA = 'اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ';

export default function RamadanModeScreen() {
  const [fasting, setFasting] = useState(false);
  const [fastStarted, setFastStarted] = useState(null);
  const [quranPages, setQuranPages] = useState(0);
  const [taraweeh, setTaraweeh] = useState(false);
  const [daysFasted, setDaysFasted] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [khatmProgress, setKhatmProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadState(); }, []);
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const loadState = async () => {
    const raw = await AsyncStorage.getItem('ramadan_state');
    if (raw) {
      const s = JSON.parse(raw);
      setFasting(s.fasting || false);
      setFastStarted(s.fastStarted);
      setQuranPages(s.quranPages || 0);
      setTaraweeh(s.taraweeh || false);
      setDaysFasted(s.daysFasted || 0);
      setTotalPages(s.totalPages || 0);
    }
  };

  const saveState = async (updates) => {
    const state = { fasting, fastStarted, quranPages, taraweeh, daysFasted, totalPages, ...updates };
    await AsyncStorage.setItem('ramadan_state', JSON.stringify(state));
  };

  const toggleFast = () => {
    if (!fasting) {
      setFasting(true);
      setFastStarted(new Date().toISOString());
      saveState({ fasting: true, fastStarted: new Date().toISOString() });
    } else {
      setFasting(false);
      setDaysFasted(d => d + 1);
      saveState({ fasting: false, daysFasted: daysFasted + 1 });
    }
  };

  const addPages = (n) => {
    const newPages = quranPages + n;
    setQuranPages(newPages);
    setTotalPages(t => t + n);
    setKhatmProgress(Math.min(100, Math.round((totalPages + n) / 604 * 100)));
    saveState({ quranPages: newPages, totalPages: totalPages + n });
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Header */}
          <View style={styles.headerCard}>
            <View style={styles.headerGlow} />
            <Text style={styles.headerEmoji}>🌙</Text>
            <Text style={styles.headerTitle}>Ramadan Mubarak</Text>
            <Text style={styles.headerSub}>Make the most of this blessed month</Text>
          </View>

          {/* Fasting Toggle */}
          <TouchableOpacity style={[styles.fastCard, fasting && styles.fastActive]}
            onPress={toggleFast} activeOpacity={0.7}>
            <Ionicons name={fasting ? 'checkmark-circle' : 'moon-outline'} size={36}
              color={fasting ? COLORS.emerald : COLORS.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fastTitle}>{fasting ? 'Fasting Today' : 'Start Fasting'}</Text>
              <Text style={styles.fastSub}>{fasting ? 'Ramadan Mubarak!' : 'Tap to begin your fast'}</Text>
            </View>
            <Text style={styles.fastCount}>{daysFasted}</Text>
            <Text style={styles.fastLabel}>days</Text>
          </TouchableOpacity>

          {/* Duas */}
          <View style={styles.duaRow}>
            <View style={styles.duaCard}>
              <Text style={styles.duaLabel}>Suhoor Dua</Text>
              <Text style={styles.duaArabic}>{SUHOOR_DUA}</Text>
              <Text style={styles.duaTrans}>I intend to fast tomorrow in Ramadan</Text>
            </View>
            <View style={styles.duaCard}>
              <Text style={styles.duaLabel}>Iftar Dua</Text>
              <Text style={styles.duaArabic}>{IFTAR_DUA}</Text>
              <Text style={styles.duaTrans}>O Allah, I fasted for You and I break fast with Your sustenance</Text>
            </View>
          </View>

          {/* Quran Progress */}
          <View style={styles.progressCard}>
            <View style={globalStyles.spaceBetween}>
              <Text style={styles.sectionTitle}>Quran Khatm</Text>
              <Text style={[styles.khatmPercent, khatmProgress >= 100 && { color: COLORS.emerald }]}>
                {khatmProgress}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, khatmProgress)}%`,
                backgroundColor: khatmProgress >= 100 ? COLORS.emerald : COLORS.gold }]} />
            </View>
            <Text style={styles.progressDetail}>{totalPages}/604 pages read</Text>

            <View style={styles.pageBtns}>
              {[1, 2, 5, 10, 20].map(n => (
                <TouchableOpacity key={n} style={styles.pageBtn} onPress={() => addPages(n)}>
                  <Text style={styles.pageBtnText}>+{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Taraweeh */}
          <TouchableOpacity style={styles.taraweehCard} onPress={() => {
            setTaraweeh(!taraweeh);
            saveState({ taraweeh: !taraweeh });
          }}>
            <Ionicons name={taraweeh ? 'checkmark-circle' : 'moon-outline'} size={24}
              color={taraweeh ? COLORS.emerald : COLORS.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.taraweehTitle}>Taraweeh Prayer</Text>
              <Text style={styles.taraweehSub}>20 rakaat night prayer during Ramadan</Text>
            </View>
          </TouchableOpacity>

          {/* Goals */}
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Daily Ramadan Goals</Text>
            {[
              { label: 'Pray Fajr on time', icon: 'sunny' },
              { label: 'Read 4 pages of Quran', icon: 'book' },
              { label: 'Give Sadaqah', icon: 'heart' },
              { label: 'Make Dua for others', icon: 'hand-left' },
              { label: 'Avoid gossip/sin', icon: 'shield-checkmark' },
              { label: 'Pray Taraweeh', icon: 'moon' },
            ].map((goal, i) => (
              <GoalItem key={i} goal={goal} />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalItem({ goal }) {
  const [done, setDone] = useState(false);
  return (
    <TouchableOpacity style={[styles.goalCard, done && styles.goalDone]}
      onPress={() => setDone(!done)}>
      <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={20}
        color={done ? COLORS.emerald : COLORS.textSecondary} />
      <Text style={[styles.goalText, done && styles.goalTextDone]}>{goal.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    margin: 16, borderRadius: 24, padding: 28, alignItems: 'center', overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },
  headerGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255,0.05)' },
  headerEmoji: { fontSize: 48 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 12 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  fastCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, margin: 16, padding: 20,
    borderRadius: 20, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  fastActive: { borderColor: COLORS.emerald, backgroundColor: 'rgba(255, 255, 255,0.06)' },
  fastTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  fastSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  fastCount: { color: COLORS.gold, fontSize: 28, fontWeight: '900' },
  fastLabel: { color: COLORS.textSecondary, fontSize: 10 },
  duaRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  duaCard: {
    flex: 1, padding: 14, borderRadius: 16, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  duaLabel: { color: COLORS.gold, fontSize: 11, fontWeight: '800', marginBottom: 6 },
  duaArabic: { color: COLORS.textPrimary, fontSize: 14, textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 },
  duaTrans: { color: COLORS.textSecondary, fontSize: 10, marginTop: 6, lineHeight: 15 },
  progressCard: {
    margin: 16, padding: 18, borderRadius: 20, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  sectionTitle: { color: COLORS.gold, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  khatmPercent: { color: COLORS.gold, fontSize: 16, fontWeight: '900' },
  progressBar: {
    height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressDetail: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
  pageBtns: { flexDirection: 'row', gap: 8, marginTop: 14 },
  pageBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.gold + '15',
    borderWidth: 1, borderColor: COLORS.gold + '30', alignItems: 'center',
  },
  pageBtnText: { color: COLORS.gold, fontSize: 13, fontWeight: '800' },
  taraweehCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, margin: 16, marginTop: 0, padding: 16,
    borderRadius: 16, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  taraweehTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  taraweehSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  goalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 8,
    borderRadius: 14, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  goalDone: { borderColor: COLORS.emerald + '40', backgroundColor: 'rgba(255, 255, 255,0.04)' },
  goalText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  goalTextDone: { color: COLORS.emerald, textDecorationLine: 'line-through' },
});
