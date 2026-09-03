import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';

const PLANS_KEY = 'hifz_plans';
const PROGRESS_KEY = 'hifz_progress';

const PLAN_TEMPLATES = [
  { id: 'juz1', name: 'Juz 1 (Al-Fatiha - Al-Baqarah 141)', juz: 1, totalAyahs: 150, days: 30 },
  { id: 'juz2', name: 'Juz 2 (Al-Baqarah 142-252)', juz: 2, totalAyahs: 111, days: 30 },
  { id: 'juz3', name: 'Juz 3 (Al-Baqarah 253-286)', juz: 3, totalAyahs: 34, days: 15 },
  { id: 'ramadan', name: 'Ramadan Special (Juz Amma)', juz: 30, totalAyahs: 564, days: 30 },
  { id: 'short', name: 'Short Surahs (After Juz Amma)', juz: 30, totalAyahs: 120, days: 14 },
  { id: 'custom', name: 'Custom Plan', juz: 0, totalAyahs: 0, days: 0 },
];

const TIPS = [
  'Repeat each ayah 3-5 times before moving to the next.',
  'Review yesterday\'s memorization before starting new.',
  'Listen to recitation while memorizing for better retention.',
  'Revise old memorization every week.',
  'Best times: after Fajr and after Asr.',
  'Short, consistent sessions beat long, irregular ones.',
  'Write the ayah from memory to test yourself.',
];

export default function HifzScreen() {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customDays, setCustomDays] = useState('30');
  const [currentAyah, setCurrentAyah] = useState('');
  const [repeatCount, setRepeatCount] = useState(3);
  const [todayCount, setTodayCount] = useState(0);
  const [showArabic, setShowArabic] = useState(true);
  const [todayAyahs, setTodayAyahs] = useState([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadPlans(); loadToday(); }, []);
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [activePlan]);

  const loadPlans = async () => {
    const raw = await AsyncStorage.getItem(PLANS_KEY);
    setPlans(raw ? JSON.parse(raw) : []);
  };

  const loadToday = async () => {
    const key = `hifz_today_${new Date().toISOString().split('T')[0]}`;
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const data = JSON.parse(raw);
      setTodayCount(data.count || 0);
      setTodayAyahs(data.ayahs || []);
    }
  };

  const savePlans = async (newPlans) => {
    setPlans(newPlans);
    await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(newPlans));
  };

  const createPlan = () => {
    if (!selectedTemplate) return;
    const template = PLAN_TEMPLATES.find(t => t.id === selectedTemplate);
    const days = selectedTemplate === 'custom' ? parseInt(customDays) || 30 : template.days;
    const newPlan = {
      id: Date.now().toString(),
      template: selectedTemplate,
      name: template.name,
      totalAyahs: template.totalAyahs || 100,
      targetDays: days,
      ayahsMemorized: 0,
      startDate: new Date().toISOString(),
      completed: false,
    };
    const updated = [...plans, newPlan];
    savePlans(updated);
    setActivePlan(newPlan);
    setShowNewPlan(false);
    setSelectedTemplate(null);
  };

  const memorizeAyah = async () => {
    if (!currentAyah.trim()) return;
    const newCount = todayCount + 1;
    setTodayCount(newCount);
    const newAyahs = [...todayAyahs, { text: currentAyah, time: new Date().toLocaleTimeString() }];
    setTodayAyahs(newAyahs);
    setCurrentAyah('');

    const key = `hifz_today_${new Date().toISOString().split('T')[0]}`;
    await AsyncStorage.setItem(key, JSON.stringify({ count: newCount, ayahs: newAyahs }));

    if (activePlan) {
      const updatedPlan = { ...activePlan, ayahsMemorized: activePlan.ayahsMemorized + 1 };
      if (updatedPlan.ayahsMemorized >= updatedPlan.totalAyahs) updatedPlan.completed = true;
      setActivePlan(updatedPlan);
      const updated = plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
      savePlans(updated);
    }
  };

  const getProgress = () => {
    if (!activePlan) return 0;
    return Math.min(100, Math.round((activePlan.ayahsMemorized / activePlan.totalAyahs) * 100));
  };

  const getStreak = () => {
    return Math.min(todayCount, 10);
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Header Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderColor: COLORS.gold + '30' }]}>
              <Ionicons name="flame" size={20} color={COLORS.gold} />
              <Text style={styles.statNum}>{getStreak()}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={[styles.statCard, { borderColor: COLORS.emerald + '30' }]}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.emerald} />
              <Text style={styles.statNum}>{activePlan?.ayahsMemorized || 0}</Text>
              <Text style={styles.statLabel}>Memorized</Text>
            </View>
            <View style={[styles.statCard, { borderColor: COLORS.blue + '30' }]}>
              <Ionicons name="calendar" size={20} color={COLORS.blue} />
              <Text style={styles.statNum}>{plans.filter(p => p.completed).length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          {/* Active Plan */}
          {activePlan ? (
            <View style={styles.planCard}>
              <View style={globalStyles.spaceBetween}>
                <Text style={styles.planName}>{activePlan.name}</Text>
                <View style={[styles.progressBadge, getProgress() === 100 && { backgroundColor: COLORS.emerald + '20' }]}>
                  <Text style={[styles.progressText, getProgress() === 100 && { color: COLORS.emerald }]}>
                    {getProgress()}%
                  </Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getProgress()}%`,
                  backgroundColor: getProgress() === 100 ? COLORS.emerald : COLORS.gold }]} />
              </View>
              <Text style={styles.progressDetail}>
                {activePlan.ayahsMemorized}/{activePlan.totalAyahs} ayahs • {activePlan.targetDays} day plan
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowNewPlan(true)}>
              <Ionicons name="add-circle" size={24} color={COLORS.gold} />
              <Text style={styles.createBtnText}>Create Memorization Plan</Text>
            </TouchableOpacity>
          )}

          {/* Memorization Input */}
          {activePlan && (
            <View style={styles.memSection}>
              <Text style={styles.sectionTitle}>Memorize</Text>

              <View style={styles.optionsRow}>
                <TouchableOpacity onPress={() => setShowArabic(!showArabic)} style={styles.optionBtn}>
                  <Ionicons name={showArabic ? 'eye' : 'eye-off'} size={16} color={COLORS.textSecondary} />
                  <Text style={styles.optionText}>{showArabic ? 'Hide Arabic' : 'Show Arabic'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRepeatCount(r => r >= 10 ? 1 : r + 1)} style={styles.optionBtn}>
                  <Ionicons name="repeat" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.optionText}>Repeat {repeatCount}x</Text>
                </TouchableOpacity>
              </View>

              <TextInput style={styles.ayahInput} value={currentAyah} onChangeText={setCurrentAyah}
                placeholder="Type or paste the ayah to memorize..."
                placeholderTextColor={COLORS.placeholder} multiline numberOfLines={3} />

              <TouchableOpacity style={styles.memorizeBtn} onPress={memorizeAyah} activeOpacity={0.7}>
                <Ionicons name="checkmark-circle" size={20} color="#000" />
                <Text style={styles.memorizeBtnText}>Memorized ({repeatCount}x repetition)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Today's Session */}
          {todayAyahs.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
              <Text style={styles.sectionTitle}>Today's Session ({todayCount} ayahs)</Text>
              {todayAyahs.map((a, i) => (
                <View key={i} style={styles.sessionItem}>
                  <View style={styles.sessionDot} />
                  <Text style={styles.sessionText} numberOfLines={2}>{a.text}</Text>
                  <Text style={styles.sessionTime}>{a.time}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tips */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Memorization Tips</Text>
            {TIPS.map((tip, i) => (
              <View key={i} style={styles.tipItem}>
                <Ionicons name="bulb" size={14} color={COLORS.gold} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* New Plan Modal */}
      {showNewPlan && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={globalStyles.spaceBetween}>
              <Text style={styles.modalTitle}>New Plan</Text>
              <TouchableOpacity onPress={() => setShowNewPlan(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {PLAN_TEMPLATES.map(t => (
                <TouchableOpacity key={t.id} onPress={() => setSelectedTemplate(t.id)}
                  style={[styles.templateCard, selectedTemplate === t.id && styles.templateActive]}>
                  <Text style={styles.templateName}>{t.name}</Text>
                  {t.days > 0 && <Text style={styles.templateInfo}>{t.days} days • {t.totalAyahs} ayahs</Text>}
                </TouchableOpacity>
              ))}
              {selectedTemplate === 'custom' && (
                <TextInput style={styles.customInput} value={customDays} onChangeText={setCustomDays}
                  placeholder="Target days" placeholderTextColor={COLORS.placeholder} keyboardType="numeric" />
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.createBtn, { marginTop: 12 }]} onPress={createPlan}>
              <Text style={styles.createBtnText}>Start Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8,
  },
  statCard: {
    flex: 1, alignItems: 'center', padding: 14, borderRadius: 16,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, gap: 4,
  },
  statNum: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900' },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  planCard: {
    margin: 16, padding: 18, borderRadius: 20,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.gold + '30',
  },
  planName: { color: COLORS.gold, fontSize: 16, fontWeight: '800' },
  progressBadge: {
    backgroundColor: 'rgba(255, 255, 255,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  progressText: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },
  progressBar: {
    height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 12, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressDetail: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    margin: 16, padding: 16, borderRadius: 16,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.gold + '30',
  },
  createBtnText: { color: COLORS.gold, fontSize: 15, fontWeight: '800' },
  memSection: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { color: COLORS.gold, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  optionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  optionText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  ayahInput: {
    backgroundColor: COLORS.glass, borderRadius: 14, borderWidth: 1, borderColor: COLORS.glassBorder,
    color: COLORS.textPrimary, fontSize: 15, padding: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 12,
  },
  memorizeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 14, backgroundColor: COLORS.gold,
  },
  memorizeBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  sessionItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 6,
    backgroundColor: COLORS.glass, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  sessionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.emerald },
  sessionText: { flex: 1, color: COLORS.textPrimary, fontSize: 13 },
  sessionTime: { color: COLORS.textSecondary, fontSize: 10 },
  tipItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, marginBottom: 6,
    backgroundColor: COLORS.glass, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  tipText: { flex: 1, color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', padding: 20, zIndex: 999,
  },
  modal: {
    backgroundColor: COLORS.bgSecondary, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  modalTitle: { color: COLORS.gold, fontSize: 20, fontWeight: '900', marginBottom: 16 },
  templateCard: {
    padding: 14, borderRadius: 14, marginBottom: 8,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  templateActive: { borderColor: COLORS.gold, backgroundColor: 'rgba(255, 255, 255,0.08)' },
  templateName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  templateInfo: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  customInput: {
    backgroundColor: COLORS.glass, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder,
    color: COLORS.textPrimary, fontSize: 14, padding: 12, marginTop: 8,
  },
});
