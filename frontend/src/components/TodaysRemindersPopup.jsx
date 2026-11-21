import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, AppState, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import {
  REMINDER_POPUP_INTERVAL_MS,
  dismissReminderKeys,
  dueReminderRows,
  formatReminderTime,
  loadDismissedKeys,
  loadTodaysReminders,
} from '../services/todaysReminders';
import { playReminderChime } from '../services/reminderSound';

/**
 * A reminder card in the bottom-right corner of the main tabs.
 *
 * It used to be a bottom sheet with a dimmed backdrop. As a corner card it
 * leaves the dashboard readable, stays put until the user acts on it, and can
 * still be dismissed by tapping the close button or "5 min". The chosen chime
 * plays once whenever a new reminder arrives; it re-arms after a snooze, so a
 * reminder that returns after five minutes is audible again.
 *
 * It is not an OS notification: it can only appear while the app is open, and
 * it re-reads today's reminders every five minutes. A reminder that has passed
 * stays due for the rest of the day, so the card keeps returning until the
 * user marks it done or switches it off in Reminders. "Done for today" is
 * remembered per day; "5 min" and the close button only hide it locally, and
 * the card comes back when that timer runs out.
 */
export default function TodaysRemindersPopup({ navigation }) {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [rows, setRows] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set());
  const [snoozedUntil, setSnoozedUntil] = useState({});
  const [now, setNow] = useState(() => new Date());

  const enter = useRef(new Animated.Value(0)).current;
  const playedKey = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [loadedRows, dismissedKeys] = await Promise.all([
        loadTodaysReminders(),
        loadDismissedKeys(),
      ]);
      setRows(loadedRows);
      setDismissed(dismissedKeys);
      setNow(new Date());
    } catch {
      // Storage unavailable (first run, cleared data) — there is simply nothing
      // to show; the rest of the app must keep working.
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REMINDER_POPUP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => subscription?.remove?.();
  }, [refresh]);

  const due = useMemo(
    () => dueReminderRows(rows, now).filter(row => (
      !dismissed.has(row.key) && !(snoozedUntil[row.key] > now.getTime())
    )),
    [rows, dismissed, snoozedUntil, now],
  );

  // The five-minute hide must end on its own schedule, not whenever the next
  // storage refresh happens to run — otherwise "5 min" could return almost
  // immediately. Wake up at the earliest snooze expiry and re-evaluate.
  const snoozeExpiry = useMemo(() => {
    const pending = Object.values(snoozedUntil).filter(at => at > now.getTime());
    return pending.length ? Math.min(...pending) : null;
  }, [snoozedUntil, now]);

  useEffect(() => {
    if (!snoozeExpiry) return;
    const timer = setTimeout(() => setNow(new Date()), Math.max(0, snoozeExpiry - Date.now()) + 50);
    return () => clearTimeout(timer);
  }, [snoozeExpiry]);

  const active = due[0] || null;
  const activeKey = active?.key || null;

  // Slide in each time a new reminder takes the card. The card then stays
  // exactly where it is until the user presses Done, 5 min or close.
  useEffect(() => {
    if (!activeKey) return;
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [activeKey, enter]);

  // One chime per reminder appearance. Snoozing clears activeKey, which re-arms
  // this so the returning reminder is heard again.
  useEffect(() => {
    if (!activeKey) {
      playedKey.current = null;
      return;
    }
    if (playedKey.current === activeKey) return;
    playedKey.current = activeKey;
    playReminderChime().catch(() => {});
  }, [activeKey]);

  const closeForNow = () => {
    if (!active) return;
    setSnoozedUntil(prev => ({
      ...prev,
      [active.key]: Date.now() + REMINDER_POPUP_INTERVAL_MS,
    }));
  };

  const markDone = async () => {
    if (!active) return;
    try {
      const keys = await dismissReminderKeys([active.key]);
      setDismissed(keys);
    } catch {
      // Keep the card usable even if persistence fails.
      setDismissed(prev => new Set([...prev, active.key]));
    }
  };

  const openReminders = () => {
    closeForNow();
    try {
      navigation?.navigate?.('Reminders');
    } catch {
      // Drawer/tab may not be mounted (e.g. web deep link); closing the card
      // is still a valid outcome.
    }
  };

  if (!active) return null;

  const translateY = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });

  return (
    // box-none keeps every pixel outside the card interactive, so the corner
    // notice never locks the dashboard the way the old modal did.
    <View style={styles.overlay}>
      <Animated.View
        style={[styles.card, { opacity: enter, transform: [{ translateY }] }]}
        accessibilityRole="alert"
        accessibilityLabel={`Reminder: ${active.title}`}
      >
        <View style={styles.headerRow}>
          <View style={[styles.iconPlate, { backgroundColor: `${COLORS.amber}22` }]}>
            <Ionicons name="notifications" size={17} color={COLORS.amber} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.kicker}>TODAY'S REMINDER</Text>
            <Text style={styles.time}>{formatReminderTime(active.time)}</Text>
          </View>
          <TouchableOpacity
            onPress={closeForNow}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close this reminder for five minutes"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title} numberOfLines={2}>{active.title}</Text>
        {active.message ? (
          <Text style={styles.message} numberOfLines={2}>{active.message}</Text>
        ) : null}

        {due.length > 1 ? (
          <Text style={styles.moreDue}>
            +{due.length - 1} more due now
          </Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={markDone}
            style={[globalStyles.btnPrimary, styles.doneBtn]}
            accessibilityRole="button"
            accessibilityLabel="Mark this reminder done for today"
          >
            <Ionicons name="checkmark" size={17} color="#000" />
            <Text style={globalStyles.btnPrimaryText}>Done for today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={closeForNow}
            style={styles.secondaryBtn}
            accessibilityRole="button"
            accessibilityLabel="Remind me again in five minutes"
          >
            <Ionicons name="time-outline" size={15} color={COLORS.textPrimary} />
            <Text style={styles.secondaryText}>5 min</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={openReminders}
          style={styles.linkRow}
          accessibilityRole="button"
          accessibilityLabel="Open the Reminders screen"
        >
          <Ionicons name="settings-outline" size={13} color={COLORS.gold} />
          <Text style={styles.linkText}>Manage reminders</Text>
          <Ionicons name="chevron-forward" size={12} color={COLORS.gold} />
          <View style={{ flex: 1 }} />
          <Text style={styles.footnote}>In-app only</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const makeStyles = COLORS => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 24,
    pointerEvents: 'box-none',
  },
  card: {
    position: 'absolute',
    right: 12,
    bottom: 92,
    width: '86%',
    maxWidth: 330,
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.amber + '55',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconPlate: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  time: { color: COLORS.gold, fontSize: 12, fontWeight: '800', marginTop: 1 },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 5,
  },
  moreDue: { color: COLORS.amber, fontSize: 11, fontWeight: '700', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  doneBtn: { flex: 1, paddingVertical: 10 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
  },
  secondaryText: { color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
  },
  linkText: { color: COLORS.gold, fontSize: 11.5, fontWeight: '800' },
  footnote: { color: COLORS.textSecondary, fontSize: 9.5, fontWeight: '600' },
});
