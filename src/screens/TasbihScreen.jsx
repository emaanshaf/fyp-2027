import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
const hapticImpact = (style) => Platform.OS !== 'web' && Haptics.impactAsync(style);
const hapticNotify = (type) => Platform.OS !== 'web' && Haptics.notificationAsync(type);
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, globalStyles } from '../theme';

const DHIKR_PRESETS = [
  { id: 1, arabic: 'سُبْحَانَ اللَّه', text: 'Subhan Allah', translation: 'Glory be to Allah', target: 33 },
  { id: 2, arabic: 'الْحَمْدُ لِلَّه', text: 'Alhamdulillah', translation: 'All praise is for Allah', target: 33 },
  { id: 3, arabic: 'اللَّهُ أَكْبَر', text: 'Allahu Akbar', translation: 'Allah is the Greatest', target: 34 },
  { id: 4, arabic: 'لَا إِلَهَ إِلَّا اللَّه', text: 'La ilaha illallah', translation: 'There is no god but Allah', target: 100 },
  { id: 5, arabic: 'أَسْتَغْفِرُ اللَّه', text: 'Astaghfirullah', translation: 'I seek forgiveness from Allah', target: 100 },
  { id: 6, arabic: 'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ', text: 'Salawat on the Prophet', translation: 'May Allah bless him and grant him peace', target: 100 },
];

const SIZE = 260;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function RingProgress({ count, target }) {
  const progress = Math.min(count / target, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  return (
    <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={CX} cy={CY} r={RADIUS} stroke={COLORS.glassBorder} strokeWidth={8} fill="none" />
      <Circle
        cx={CX} cy={CY} r={RADIUS}
        stroke={COLORS.gold}
        strokeWidth={8}
        fill="none"
        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function TasbihScreen() {
  const [preset, setPreset] = useState(DHIKR_PRESETS[0]);
  const [count, setCount] = useState(0);
  const [laps, setLaps] = useState(0);
  const [history, setHistory] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    AsyncStorage.getItem('qitab_tasbih_history').then(v => v && setHistory(JSON.parse(v)));
  }, []);

  const tap = async () => {
    await hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    const newCount = count + 1;
    if (newCount >= preset.target) {
      setCount(0);
      setLaps(l => l + 1);
      await hapticNotify(Haptics.NotificationFeedbackType.Success);
    } else {
      setCount(newCount);
    }
  };

  const reset = async () => {
    if (count === 0 && laps === 0) return;
    const entry = {
      id: Date.now(),
      dhikr: preset.text,
      laps,
      lastCount: count,
      totalCount: laps * preset.target + count,
      duration: Math.floor((Date.now() - sessionStart.current) / 60000),
      date: new Date().toLocaleDateString('en-PK'),
    };
    const next = [entry, ...history].slice(0, 15);
    setHistory(next);
    await AsyncStorage.setItem('qitab_tasbih_history', JSON.stringify(next));
    setCount(0);
    setLaps(0);
    sessionStart.current = Date.now();
    await hapticNotify(Haptics.NotificationFeedbackType.Warning);
  };

  const selectPreset = (p) => {
    if (count > 0 || laps > 0) reset();
    setPreset(p);
    setPickerOpen(false);
  };

  const totalCount = laps * preset.target + count;

  return (
    <SafeAreaView style={[globalStyles.screen, { alignItems: 'center' }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Top buttons */}
        <View style={[globalStyles.spaceBetween, { width: '100%', paddingHorizontal: 16, paddingTop: 8, marginBottom: 16 }]}>
          <TouchableOpacity onPress={() => setPickerOpen(true)} style={styles.dhikrBtn}>
            <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{preset.text}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.gold} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setHistOpen(true)} style={styles.iconBtn}>
            <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Ring + Counter */}
        <View style={styles.ringWrap}>
          <RingProgress count={count} target={preset.target} />
          <View style={styles.ringCenter}>
            <Text style={styles.countText}>{count}</Text>
            <Text style={styles.targetText}>/ {preset.target}</Text>
            {laps > 0 && (
              <View style={styles.lapBadge}>
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>{laps}x</Text>
              </View>
            )}
          </View>
        </View>

        {/* Arabic dhikr */}
        <Text style={styles.arabicText}>{preset.arabic}</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 6 }}>{preset.translation}</Text>

        {/* Total */}
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 12 }}>
          Total: <Text style={{ color: COLORS.gold, fontWeight: '700' }}>{totalCount}</Text>
        </Text>

        {/* Tap Button */}
        <TouchableOpacity
          onPress={tap}
          activeOpacity={0.8}
          style={styles.tapBtn}
        >
          <View style={styles.tapInner}>
            <Text style={styles.tapIcon}>☾</Text>
          </View>
        </TouchableOpacity>

        {/* Reset */}
        <TouchableOpacity onPress={reset} style={styles.resetBtn}>
          <Ionicons name="refresh-outline" size={18} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textSecondary, fontWeight: '700', marginLeft: 6 }}>Reset Session</Text>
        </TouchableOpacity>

        {/* Virtue */}
        <View style={styles.virtueCard}>
          <Text style={{ color: COLORS.gold, fontWeight: '800', marginBottom: 8 }}>Virtue of this Dhikr</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}>
            {preset.id === 1 ? 'Whoever says "SubhanAllah" 100 times will have 1000 good deeds recorded and 1000 sins wiped away. (Muslim)' : preset.id === 2 ? '"Alhamdulillah" fills the scales. (Muslim)' : preset.id === 3 ? '"Allahu Akbar" fills what is between heaven and earth. (Muslim)' : preset.id === 4 ? '"La ilaha illallah" is the best of dhikr. (Tirmidhi)' : preset.id === 5 ? 'Whoever says "Astaghfirullah" frequently, Allah will relieve every distress. (Abu Dawud)' : 'Whoever sends Salawat on me once, Allah will send blessings on him tenfold. (Muslim)'}
          </Text>
        </View>
      </ScrollView>

      {/* Dhikr Picker */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={{ backgroundColor: COLORS.bgSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 16 }]}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '900', fontSize: 18 }}>Choose Dhikr</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {DHIKR_PRESETS.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => selectPreset(p)}
                style={[styles.presetRow, preset.id === p.id && { borderColor: COLORS.gold, backgroundColor: 'rgba(212,175,55,0.06)' }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: preset.id === p.id ? COLORS.gold : COLORS.textPrimary, fontWeight: '700', fontSize: 15 }}>{p.text}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{p.translation} — Target: {p.target}</Text>
                </View>
                {preset.id === p.id && <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={histOpen} transparent animationType="slide" onRequestClose={() => setHistOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={{ backgroundColor: COLORS.bgSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '75%' }}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 16 }]}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '900', fontSize: 18 }}>Session History</Text>
              <TouchableOpacity onPress={() => setHistOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {history.length === 0 ? (
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 20 }}>No sessions recorded yet.</Text>
              ) : history.map(h => (
                <View key={h.id} style={styles.histItem}>
                  <View style={[globalStyles.spaceBetween, { marginBottom: 6 }]}>
                    <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 }}>{h.dhikr}</Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{h.date}</Text>
                  </View>
                  <View style={globalStyles.row}>
                    <View style={styles.histStat}>
                      <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 18 }}>{h.totalCount}</Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>Total</Text>
                    </View>
                    <View style={styles.histStat}>
                      <Text style={{ color: COLORS.emerald, fontWeight: '900', fontSize: 18 }}>{h.laps}</Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>Rounds</Text>
                    </View>
                    {h.duration > 0 && (
                      <View style={styles.histStat}>
                        <Text style={{ color: COLORS.blue, fontWeight: '900', fontSize: 18 }}>{h.duration}m</Text>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>Duration</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dhikrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 200,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  countText: {
    color: COLORS.textPrimary,
    fontSize: 72,
    fontWeight: '900',
    lineHeight: 80,
  },
  targetText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  lapBadge: {
    marginTop: 8,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  arabicText: {
    textAlign: 'center',
    writingDirection: 'rtl',
    color: COLORS.gold,
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 50,
    marginTop: 8,
  },
  tapBtn: {
    marginTop: 32,
    marginBottom: 20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  tapInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  tapIcon: {
    fontSize: 52,
    color: COLORS.gold,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
  },
  virtueCard: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 18,
    backgroundColor: 'rgba(212,175,55,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
    width: '90%',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 8,
  },
  histItem: {
    padding: 16,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 10,
  },
  histStat: {
    flex: 1,
    alignItems: 'center',
  },
});
