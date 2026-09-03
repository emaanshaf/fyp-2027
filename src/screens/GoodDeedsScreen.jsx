import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';

const DEED_TYPES = [
  { id: 'salah', name: 'Salah', icon: 'hand-left', color: COLORS.gold, points: 5 },
  { id: 'quran', name: 'Quran Reading', icon: 'book', color: COLORS.emerald, points: 5 },
  { id: 'sadaqah', name: 'Sadaqah', icon: 'heart', color: COLORS.pink, points: 10 },
  { id: 'dhikr', name: 'Dhikr', icon: 'repeat', color: COLORS.purple, points: 3 },
  { id: 'help', name: 'Helping Others', icon: 'people', color: COLORS.blue, points: 8 },
  { id: 'fast', name: 'Fasting', icon: 'moon', color: COLORS.amber, points: 10 },
  { id: 'istighfar', name: 'Istighfar', icon: 'water', color: COLORS.cyan, points: 2 },
  { id: 'dua', name: 'Dua for Others', icon: 'hand-left-outline', color: COLORS.red, points: 4 },
  { id: 'custom', name: 'Custom Deed', icon: 'add-circle', color: COLORS.textSecondary, points: 1 },
];

export default function GoodDeedsScreen() {
  const [deeds, setDeeds] = useState([]);
  const [streak, setStreak] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [todayDeeds, setTodayDeeds] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [customDeed, setCustomDeed] = useState('');

  useEffect(() => { loadDeeds(); }, []);

  const loadDeeds = async () => {
    const raw = await AsyncStorage.getItem('good_deeds');
    if (raw) {
      const all = JSON.parse(raw);
      setDeeds(all);
      const today = new Date().toISOString().split('T')[0];
      const todayAll = all.filter(d => d.date === today);
      setTodayDeeds(todayAll);
      setTotalPoints(all.reduce((s, d) => s + (d.points || 0), 0));
      // Calculate streak
      let streakCount = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        if (all.some(deed => deed.date === key)) streakCount++;
        else if (i > 0) break;
      }
      setStreak(streakCount);
    }
  };

  const addDeed = async (type) => {
    const deedType = DEED_TYPES.find(d => d.id === type);
    const points = type === 'custom' ? 1 : (deedType?.points || 1);
    const newDeed = {
      id: Date.now().toString(),
      type,
      name: type === 'custom' ? customDeed || 'Custom Deed' : deedType.name,
      points,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
    };
    const updated = [...deeds, newDeed];
    setDeeds(updated);
    await AsyncStorage.setItem('good_deeds', JSON.stringify(updated));
    loadDeeds();
    setShowAdd(false);
    setCustomDeed('');
  };

  const getDeedByType = (typeId) => todayDeeds.filter(d => d.type === typeId).length;

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: COLORS.gold + '30' }]}>
            <Ionicons name="flame" size={22} color={COLORS.gold} />
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.emerald + '30' }]}>
            <Ionicons name="star" size={22} color={COLORS.emerald} />
            <Text style={styles.statNum}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.blue + '30' }]}>
            <Ionicons name="checkmark-done" size={22} color={COLORS.blue} />
            <Text style={styles.statNum}>{todayDeeds.length}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {/* Deed Types */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>Log a Good Deed</Text>
          <View style={styles.deedGrid}>
            {DEED_TYPES.map(deed => (
              <TouchableOpacity key={deed.id} style={styles.deedBtn}
                onPress={() => deed.id === 'custom' ? setShowAdd(true) : addDeed(deed.id)}>
                <View style={[styles.deedIcon, { backgroundColor: deed.color + '18' }]}>
                  <Ionicons name={deed.icon} size={20} color={deed.color} />
                </View>
                <Text style={styles.deedName}>{deed.name}</Text>
                <Text style={styles.deedCount}>{getDeedByType(deed.id)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Log */}
        {todayDeeds.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Today's Deeds</Text>
            {todayDeeds.map(deed => {
              const dt = DEED_TYPES.find(d => d.id === deed.type);
              return (
                <View key={deed.id} style={styles.logCard}>
                  <View style={[styles.logIcon, { backgroundColor: (dt?.color || COLORS.textSecondary) + '18' }]}>
                    <Ionicons name={dt?.icon || 'checkmark'} size={16} color={dt?.color || COLORS.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logName}>{deed.name}</Text>
                    <Text style={styles.logTime}>{deed.time}</Text>
                  </View>
                  <Text style={styles.logPoints}>+{deed.points}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <Text style={{ fontSize: 32 }}>🌟</Text>
          <Text style={styles.motivationText}>
            {totalPoints < 50 ? 'Keep going! Every good deed counts.' :
             totalPoints < 200 ? 'MashaAllah! You are building great habits.' :
             'SubhanAllah! You are a true servant of Allah.'}
          </Text>
        </View>
      </ScrollView>

      {showAdd && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={globalStyles.spaceBetween}>
              <Text style={styles.modalTitle}>Custom Deed</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.modalInput} value={customDeed} onChangeText={setCustomDeed}
              placeholder="Describe your deed..." placeholderTextColor={COLORS.placeholder} />
            <TouchableOpacity style={styles.addBtn} onPress={() => addDeed('custom')}>
              <Text style={{ color: '#000', fontWeight: '800' }}>Add Deed</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  statCard: {
    flex: 1, alignItems: 'center', padding: 14, borderRadius: 16,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, gap: 4,
  },
  statNum: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900' },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  sectionTitle: { color: COLORS.gold, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  deedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  deedBtn: {
    width: '30%', alignItems: 'center', padding: 12, borderRadius: 16,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  deedIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  deedName: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  deedCount: { color: COLORS.textSecondary, fontSize: 10, marginTop: 2 },
  logCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 6,
    borderRadius: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  logIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  logTime: { color: COLORS.textSecondary, fontSize: 10 },
  logPoints: { color: COLORS.gold, fontSize: 14, fontWeight: '900' },
  motivationCard: {
    margin: 16, padding: 20, borderRadius: 20, alignItems: 'center',
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.gold + '20',
  },
  motivationText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 21 },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', padding: 20, zIndex: 999,
  },
  modal: {
    backgroundColor: COLORS.bgSecondary, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  modalTitle: { color: COLORS.gold, fontSize: 18, fontWeight: '900', marginBottom: 16 },
  modalInput: {
    backgroundColor: COLORS.glass, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder,
    color: COLORS.textPrimary, fontSize: 14, padding: 12, marginBottom: 10,
  },
  addBtn: {
    padding: 14, borderRadius: 14, backgroundColor: COLORS.gold, alignItems: 'center',
  },
});
