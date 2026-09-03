import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';

const PLANS = [
  { id: '7', days: 7, label: '7 Days', daily: 87, desc: 'Intensive — 87 pages/day' },
  { id: '15', days: 15, label: '15 Days', daily: 41, desc: 'Fast — 41 pages/day' },
  { id: '30', days: 30, label: '30 Days', daily: 20, desc: 'Balanced — 20 pages/day' },
  { id: '60', days: 60, label: '60 Days', daily: 10, desc: 'Comfortable — 10 pages/day' },
  { id: '90', days: 90, label: '90 Days', daily: 7, desc: 'Easy — 7 pages/day' },
  { id: '365', days: 365, label: '1 Year', daily: 2, desc: 'Gentle — 2 pages/day' },
];

const TOTAL_PAGES = 604;

export default function KhatmPlannerScreen() {
  const [activePlan, setActivePlan] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => { loadPlan(); }, []);

  const loadPlan = async () => {
    const raw = await AsyncStorage.getItem('khatm_plan');
    if (raw) {
      const d = JSON.parse(raw);
      setActivePlan(d.plan);
      setCurrentPage(d.currentPage || 0);
      setStartDate(d.startDate);
      setStreak(d.streak || 0);
    }
  };

  const savePlan = async (updates) => {
    const state = { plan: activePlan, currentPage, startDate, streak, ...updates };
    await AsyncStorage.setItem('khatm_plan', JSON.stringify(state));
  };

  const startPlan = (plan) => {
    setActivePlan(plan);
    setCurrentPage(0);
    setStartDate(new Date().toISOString());
    setStreak(0);
    savePlan({ plan, currentPage: 0, startDate: new Date().toISOString(), streak: 0 });
  };

  const readPages = (n) => {
    const newPage = Math.min(TOTAL_PAGES, currentPage + n);
    setCurrentPage(newPage);
    if (!startDate) setStartDate(new Date().toISOString());
    const newStreak = streak + 1;
    setStreak(newStreak);
    savePlan({ currentPage: newPage, streak: newStreak });
  };

  const getProgress = () => Math.round((currentPage / TOTAL_PAGES) * 100);
  const getRemaining = () => TOTAL_PAGES - currentPage;
  const getDailyTarget = () => activePlan ? Math.ceil(getRemaining() / Math.max(1, activePlan.days - Math.floor(streak / activePlan.days))) : 0;

  if (!activePlan) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={styles.headerCard}>
            <Ionicons name="book" size={32} color={COLORS.gold} />
            <Text style={styles.headerTitle}>Khatm Planner</Text>
            <Text style={styles.headerSub}>Plan your complete Quran reading journey</Text>
          </View>

          {PLANS.map(plan => (
            <TouchableOpacity key={plan.id} style={styles.planCard} onPress={() => startPlan(plan)}>
              <View style={[styles.planIcon, { backgroundColor: COLORS.gold + '18' }]}>
                <Ionicons name="calendar" size={22} color={COLORS.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planLabel}>{plan.label}</Text>
                <Text style={styles.planDesc}>{plan.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.planTitle}>{activePlan.label} Khatm</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{currentPage}/{TOTAL_PAGES} pages</Text>
            <Text style={styles.progressPercent}>{getProgress()}%</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={20} color={COLORS.gold} />
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book" size={20} color={COLORS.blue} />
            <Text style={styles.statNum}>{getRemaining()}</Text>
            <Text style={styles.statLabel}>Pages Left</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color={COLORS.emerald} />
            <Text style={styles.statNum}>{getDailyTarget()}</Text>
            <Text style={styles.statLabel}>Daily Target</Text>
          </View>
        </View>

        {/* Read Buttons */}
        <Text style={styles.sectionTitle}>Log Pages Read</Text>
        <View style={styles.readBtns}>
          {[1, 2, 4, 5, 10, 20].map(n => (
            <TouchableOpacity key={n} style={styles.readBtn} onPress={() => readPages(n)}>
              <Text style={styles.readBtnText}>+{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {currentPage >= TOTAL_PAGES && (
          <View style={styles.completeCard}>
            <Text style={{ fontSize: 48 }}>🎉</Text>
            <Text style={styles.completeTitle}>MashaAllah! Khatm Complete!</Text>
            <Text style={styles.completeSub}>May Allah accept your reading. Ameen.</Text>
            <TouchableOpacity style={styles.restartBtn} onPress={() => startPlan(activePlan)}>
              <Text style={{ color: '#000', fontWeight: '800' }}>Start New Khatm</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => {
          setActivePlan(null); setCurrentPage(0); setStartDate(null);
          AsyncStorage.removeItem('khatm_plan');
        }}>
          <Text style={{ color: COLORS.red, fontSize: 13, fontWeight: '600' }}>Change Plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 20,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.gold + '30',
  },
  headerTitle: { color: COLORS.gold, fontSize: 20, fontWeight: '900', marginTop: 12 },
  headerSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center' },
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 10,
    borderRadius: 18, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  planIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  planLabel: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  planDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  progressCard: {
    padding: 20, borderRadius: 20, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.gold + '30', marginBottom: 16,
  },
  planTitle: { color: COLORS.gold, fontSize: 18, fontWeight: '900', marginBottom: 14 },
  progressBar: {
    height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.gold },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressText: { color: COLORS.textSecondary, fontSize: 12 },
  progressPercent: { color: COLORS.gold, fontSize: 14, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, alignItems: 'center', padding: 14, borderRadius: 16,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, gap: 4,
  },
  statNum: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900' },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  sectionTitle: { color: COLORS.gold, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  readBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  readBtn: {
    width: '30%', paddingVertical: 16, borderRadius: 14, backgroundColor: COLORS.gold + '15',
    borderWidth: 1, borderColor: COLORS.gold + '30', alignItems: 'center',
  },
  readBtnText: { color: COLORS.gold, fontSize: 18, fontWeight: '900' },
  completeCard: {
    padding: 24, borderRadius: 24, alignItems: 'center', marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255,0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255,0.3)',
  },
  completeTitle: { color: COLORS.emerald, fontSize: 20, fontWeight: '900', marginTop: 12 },
  completeSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  restartBtn: {
    padding: 14, borderRadius: 14, backgroundColor: COLORS.gold, alignItems: 'center', marginTop: 16, width: '100%',
  },
  cancelBtn: { alignItems: 'center', marginTop: 20, padding: 12 },
});
