/**
 * QuranReminderBanner
 * ─────────────────────────────────────────────────────────────────────────────
 * A gorgeous animated in-app "toast" overlay that appears when it's time to
 * recite Quran. Features:
 *   • Slides in from the top with a spring animation
 *   • Pulsing emerald glow halo on the Quran icon
 *   • Rotating motivational messages (Hadith / Ayah)
 *   • "Open Quran", "Snooze 15 min", "Dismiss" actions
 *   • Auto-dismiss after 30 seconds
 *   • Works on both native and web (Animated API only)
 */
import { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../theme';
import notificationService from '../services/notifications';
import { playReminderChime } from '../services/reminderSound';

const AUTO_DISMISS_MS = 30000;

export default function QuranReminderBanner({ visible, message, onOpenQuran, onSnooze, onDismiss }) {
  const COLORS = useColors();
  const translateY = useRef(new Animated.Value(-220)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const pulse      = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const autoTimer  = useRef(null);

  // ── Pulse loop on the halo ──────────────────────────────────────────────
  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse,        { toValue: 1.35, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0,    duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulse,        { toValue: 1,    duration: 0,   useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6,  duration: 0,   useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [pulse, pulseOpacity]);

  // ── Slide-in / slide-out ────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0,   useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity,   { toValue: 1,   duration: 300, useNativeDriver: true }),
      ]).start();
      startPulse();
      // Audible chime alongside the visual popup. Best-effort: browser autoplay
      // policies and silent-mode overrides must never break the banner.
      playReminderChime().catch(() => {});
      autoTimer.current = setTimeout(() => onDismiss?.(), AUTO_DISMISS_MS);
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -220, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,    duration: 250, useNativeDriver: true }),
      ]).start();
      if (autoTimer.current) clearTimeout(autoTimer.current);
    }
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [visible]);

  if (!visible) return null;

  const msg = message || notificationService.getRandomQuranMessage();

  const handleSnooze = () => {
    notificationService.scheduleQuranSnooze(15);
    onSnooze?.();
  };

  return (
    <Animated.View
      style={[styles.wrapper, { opacity, transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      {/* Backdrop blur tint (native only) */}
      <View style={styles.backdrop} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={[styles.card, {
          backgroundColor: COLORS.bgSecondary,
          borderColor: `${COLORS.primary}55`,
        }]}>

          {/* ── Top accent bar ───────────────────────────────────────────── */}
          <View style={[styles.accentBar, { backgroundColor: COLORS.primary }]} />

          {/* ── Header row ──────────────────────────────────────────────── */}
          <View style={styles.header}>
            {/* Quran icon with pulsing halo */}
            <View style={styles.iconWrap}>
              <Animated.View style={[styles.halo, {
                backgroundColor: `${COLORS.primary}`,
                transform: [{ scale: pulse }],
                opacity: pulseOpacity,
              }]} />
              <View style={[styles.iconCircle, { backgroundColor: `${COLORS.primary}22`, borderColor: `${COLORS.primary}55` }]}>
                <Ionicons name="book" size={26} color={COLORS.primary} />
              </View>
            </View>

            {/* Title & badge */}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: `${COLORS.primary}22` }]}>
                  <Ionicons name="notifications" size={10} color={COLORS.primary} />
                  <Text style={[styles.badgeText, { color: COLORS.primary }]}>QURAN REMINDER</Text>
                </View>
              </View>
              <Text style={[styles.title, { color: COLORS.textPrimary }]} numberOfLines={1}>
                {msg.title.replace(/^[\p{Emoji}\s]+/u, '').trim()}
              </Text>
            </View>

            {/* Dismiss X */}
            <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Message body ─────────────────────────────────────────────── */}
          <Text style={[styles.body, { color: COLORS.textSecondary }]}>
            {msg.body}
          </Text>

          {/* ── Decorative divider with Arabic bismillah ─────────────────── */}
          <View style={[styles.divider, { borderColor: `${COLORS.primary}25` }]}>
            <View style={[styles.dividerLine, { backgroundColor: `${COLORS.primary}25` }]} />
            <Text style={[styles.dividerText, { color: `${COLORS.primary}99` }]}>بِسْمِ اللَّهِ</Text>
            <View style={[styles.dividerLine, { backgroundColor: `${COLORS.primary}25` }]} />
          </View>

          {/* ── Action buttons ───────────────────────────────────────────── */}
          <View style={styles.actions}>
            {/* Snooze */}
            <TouchableOpacity
              onPress={handleSnooze}
              style={[styles.btnSecondary, { borderColor: `${COLORS.primary}40`, backgroundColor: `${COLORS.primary}0F` }]}
            >
              <Ionicons name="time-outline" size={15} color={COLORS.primary} />
              <Text style={[styles.btnSecondaryText, { color: COLORS.primary }]}>Snooze 15 min</Text>
            </TouchableOpacity>

            {/* Open Quran */}
            <TouchableOpacity
              onPress={onOpenQuran}
              style={[styles.btnPrimary, { backgroundColor: COLORS.primary }]}
            >
              <Ionicons name="book-outline" size={15} color="#fff" />
              <Text style={styles.btnPrimaryText}>Open Quran</Text>
            </TouchableOpacity>
          </View>

          {/* ── Auto-dismiss progress bar ────────────────────────────────── */}
          <AutoDismissBar durationMs={AUTO_DISMISS_MS} color={COLORS.primary} />
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

// Mini progress bar that empties over AUTO_DISMISS_MS
function AutoDismissBar({ durationMs, color }) {
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    progress.setValue(1);
    Animated.timing(progress, { toValue: 0, duration: durationMs, useNativeDriver: false }).start();
  }, []);
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressBar, {
        backgroundColor: color,
        width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
      }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  safeArea: {
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeRow: { flexDirection: 'row', marginBottom: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  title: { fontSize: 16, fontWeight: '800', lineHeight: 20 },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  body: {
    fontSize: 13.5,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 8,
    borderTopWidth: 0,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  btnSecondaryText: { fontSize: 13, fontWeight: '700' },
  btnPrimary: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
  },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
  },
});
