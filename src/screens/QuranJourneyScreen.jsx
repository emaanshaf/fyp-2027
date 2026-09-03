import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';

export const LEVELS = [
  // 'seedling' and 'book-stars' are not Ionicons glyphs — both rendered as an
  // empty box. Every name here is checked against the Ionicons glyph map.
  { id: 'beginner', name: 'Beginner', desc: 'Just starting your Quran journey', icon: 'leaf', color: COLORS.emerald, req: 0 },
  { id: 'reader', name: 'Regular Reader', desc: 'Read Quran consistently', icon: 'book', color: COLORS.blue, req: 30 },
  { id: 'devoted', name: 'Devoted Reader', desc: 'Deep engagement with the Quran', icon: 'library', color: COLORS.purple, req: 100 },
  { id: 'memorizer', name: 'Hafiz/Hafiza', desc: ' memorizing the Quran', icon: 'school', color: COLORS.gold, req: 300 },
  { id: 'scholar', name: 'Quran Scholar', desc: 'Complete mastery', icon: 'ribbon', color: COLORS.pink, req: 604 },
];

const SURAH_MILESTONES = [
  { surah: 1, name: 'Al-Fatiha', milestone: 'The Opening' },
  { surah: 36, name: 'Ya-Sin', milestone: 'Heart of the Quran' },
  { surah: 55, name: 'Ar-Rahman', milestone: 'The Beneficent' },
  { surah: 67, name: 'Al-Mulk', milestone: 'The Sovereignty' },
  { surah: 112, name: 'Al-Ikhlas', milestone: 'Sincerity' },
  { surah: 114, name: 'An-Nas', milestone: 'Mankind' },
];

export default function QuranJourneyScreen() {
  const [totalPages, setTotalPages] = useState(0);
  const [streak, setStreak] = useState(0);
  const [khatmCount, setKhatmCount] = useState(0);
  const [todayRead, setTodayRead] = useState(false);

  useEffect(() => { loadProgress(); }, []);

  const loadProgress = async () => {
    const raw = await AsyncStorage.getItem('quran_journey');
    if (raw) {
      const d = JSON.parse(raw);
      setTotalPages(d.totalPages || 0);
      setStreak(d.streak || 0);
      setKhatmCount(d.khatmCount || 0);
      setTodayRead(d.todayRead || false);
    }
  };

  const saveProgress = async (updates) => {
    const state = { totalPages, streak, khatmCount, todayRead, ...updates };
    await AsyncStorage.setItem('quran_journey', JSON.stringify(state));
  };

  const readPage = () => {
    const newTotal = totalPages + 1;
    const newToday = true;
    let newKhatm = khatmCount;
    let newStreak = streak;
    if (newTotal % 604 === 0) newKhatm++;
    if (!todayRead) newStreak++;
    setTotalPages(newTotal);
    setTodayRead(newToday);
    setKhatmCount(newKhatm);
    setStreak(newStreak);
    saveProgress({ totalPages: newTotal, todayRead: newToday, khatmCount: newKhatm, streak: newStreak });
  };

  const getLevel = () => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalPages >= LEVELS[i].req) return LEVELS[i];
    }
    return LEVELS[0];
  };

  const getNextLevel = () => {
    const current = getLevel();
    const idx = LEVELS.findIndex(l => l.id === current.id);
    return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  };

  const level = getLevel();
  const nextLevel = getNextLevel();
  const progress = nextLevel ? ((totalPages - level.req) / (nextLevel.req - level.req)) * 100 : 100;

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Level Card */}
        <View style={[styles.levelCard, { borderColor: level.color + '30' }]}>
          <View style={[styles.levelIcon, { backgroundColor: level.color + '18' }]}>
            <Ionicons name={level.icon} size={32} color={level.color} />
          </View>
          <Text style={styles.levelName}>{level.name}</Text>
          <Text style={styles.levelDesc}>{level.desc}</Text>
          {nextLevel && (
            <>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(100, progress)}%`, backgroundColor: level.color }]} />
              </View>
              <Text style={styles.progressText}>{totalPages}/{nextLevel.req} pages to {nextLevel.name}</Text>
            </>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={20} color={COLORS.gold} />
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book" size={20} color={COLORS.blue} />
            <Text style={styles.statNum}>{totalPages}</Text>
            <Text style={styles.statLabel}>Pages Read</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={20} color={COLORS.emerald} />
            <Text style={styles.statNum}>{khatmCount}</Text>
            <Text style={styles.statLabel}>Khatm</Text>
          </View>
        </View>

        {/* Read Button */}
        <TouchableOpacity style={[styles.readBtn, todayRead && styles.readBtnDone]}
          onPress={readPage} activeOpacity={0.7}>
          <Ionicons name={todayRead ? 'checkmark-circle' : 'book-outline'} size={24}
            color={todayRead ? '#fff' : '#000'} />
          <Text style={[styles.readBtnText, todayRead && { color: '#fff' }]}>
            {todayRead ? 'Read More Today' : 'I Read a Page'}
          </Text>
        </TouchableOpacity>

        {/* Milestones */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Surah Milestones</Text>
          {SURAH_MILESTONES.map((s, i) => {
            const completed = totalPages >= (s.surah * 20);
            return (
              <View key={i} style={[styles.milestoneCard, completed && styles.milestoneDone]}>
                <View style={[styles.milestoneNum, completed && { backgroundColor: COLORS.emerald + '20' }]}>
                  <Text style={[styles.milestoneNumText, completed && { color: COLORS.emerald }]}>{s.surah}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.milestoneName}>{s.name}</Text>
                  <Text style={styles.milestoneDesc}>{s.milestone}</Text>
                </View>
                {completed && <Ionicons name="checkmark-circle" size={18} color={COLORS.emerald} />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  levelCard: {
    margin: 16, padding: 24, borderRadius: 24, alignItems: 'center',
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  levelIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  levelName: { color: COLORS.gold, fontSize: 22, fontWeight: '900' },
  levelDesc: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  progressBar: {
    width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 16, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { color: COLORS.textSecondary, fontSize: 11, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  statCard: {
    flex: 1, alignItems: 'center', padding: 14, borderRadius: 16,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, gap: 4,
  },
  statNum: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900' },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  readBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    margin: 16, padding: 16, borderRadius: 16, backgroundColor: COLORS.gold,
  },
  readBtnDone: { backgroundColor: COLORS.emerald },
  readBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  sectionTitle: { color: COLORS.gold, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  milestoneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 8,
    borderRadius: 14, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  milestoneDone: { borderColor: COLORS.emerald + '30', backgroundColor: 'rgba(255, 255, 255,0.04)' },
  milestoneNum: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  milestoneNumText: { color: COLORS.gold, fontWeight: '800', fontSize: 13 },
  milestoneName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  milestoneDesc: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
});
