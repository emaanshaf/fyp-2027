// The full-screen cover shown while the prayer lock is active.
//
// Rendered above the navigator, so it covers every screen rather than being
// something the user can navigate around.

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme';
import { usePrayerLock, SNOOZE_MIN } from '../context/PrayerLockContext';

const PRAYER_ARABIC = {
  Fajr: 'ٱلْفَجْر',
  Dhuhr: 'ٱلظُّهْر',
  Asr: 'ٱلْعَصْر',
  Maghrib: 'ٱلْمَغْرِب',
  Isha: 'ٱلْعِشَاء',
};

export default function PrayerLockOverlay() {
  const COLORS = useColors();
  const styles = useThemedStyles(makeStyles);
  const { locked, lockedPrayer, confirmPrayed, snooze } = usePrayerLock();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: locked ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [locked, fade]);

  if (!locked) return null;

  return (
    <Modal
      visible
      animationType="fade"
      transparent={false}
      // Android back must not dismiss the lock; the buttons are the only way
      // out, so the choice is always recorded.
      onRequestClose={() => {}}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.inner, { opacity: fade }]}>
          <View style={styles.mark}>
            <Ionicons name="moon" size={38} color={COLORS.gold} />
          </View>

          <Text style={styles.eyebrow}>It is time for</Text>
          <Text style={styles.arabic}>{PRAYER_ARABIC[lockedPrayer] || ''}</Text>
          <Text style={styles.prayer}>{lockedPrayer}</Text>

          <Text style={styles.body}>
            Qitab-e-Noor is paused so it does not compete with the prayer it
            just reminded you about. It will open again once you confirm.
          </Text>

          <TouchableOpacity
            style={styles.primary}
            onPress={() => confirmPrayed(lockedPrayer)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`I have prayed ${lockedPrayer}`}
          >
            <Ionicons name="checkmark-circle" size={19} color="#000" />
            <Text style={styles.primaryText}>I have prayed {lockedPrayer}</Text>
          </TouchableOpacity>

          {/* An escape that does not claim the prayer was offered. Removing it
              would trap anyone travelling, unwell, or otherwise excused. */}
          <TouchableOpacity
            style={styles.secondary}
            onPress={() => snooze(lockedPrayer)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Not yet, remind me later"
          >
            <Text style={styles.secondaryText}>
              Not yet — remind me in {SNOOZE_MIN} minutes
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Confirming records {lockedPrayer} in your prayer tracker.
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = COLORS => StyleSheet.create({
  root: {
    flex: 1, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  inner: { alignItems: 'center', maxWidth: 380 },
  mark: {
    width: 84, height: 84, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.gold + '1A',
    borderWidth: 1, borderColor: COLORS.gold + '3D',
  },
  eyebrow: {
    color: COLORS.textSecondary, fontSize: 12, marginTop: 24,
    letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700',
  },
  arabic: { color: COLORS.gold, fontSize: 40, lineHeight: 66, writingDirection: 'rtl' },
  prayer: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', marginTop: 2 },
  body: {
    color: COLORS.textSecondary, fontSize: 14, lineHeight: 22,
    textAlign: 'center', marginTop: 18, marginBottom: 30,
  },
  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    alignSelf: 'stretch', backgroundColor: COLORS.gold, height: 54, borderRadius: 15,
  },
  primaryText: { color: '#000', fontSize: 15.5, fontWeight: '800' },
  secondary: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 16 },
  secondaryText: { color: COLORS.textSecondary, fontSize: 13.5, fontWeight: '600' },
  note: {
    color: COLORS.textSecondary, fontSize: 11.5, marginTop: 18,
    textAlign: 'center', opacity: 0.8,
  },
});
