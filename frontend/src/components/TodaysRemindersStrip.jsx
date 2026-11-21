import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme';
import {
  dueReminderRows,
  dismissReminderKeys,
  formatReminderTime,
  loadDismissedKeys,
  loadTodaysReminders,
  remainingReminderRows,
} from '../services/todaysReminders';

const REFRESH_MS = 60 * 1000;

/**
 * The dashboard's own reminder status.
 *
 * The five-minute popup can only appear once a reminder is due, which used to
 * leave Home looking as if reminders were not part of the app at all. This
 * card always shows what today holds: the reminder that is due right now (with
 * a Done action), the next one, "no more today", or an invitation to add one.
 * It reads the same local data as the popup, so the two can never disagree.
 */
export default function TodaysRemindersStrip({ onOpen }) {
  const COLORS = useColors();
  const styles = useThemedStyles(makeStyles);

  const [rows, setRows] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set());
  const [now, setNow] = useState(() => new Date());
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [loadedRows, dismissedKeys] = await Promise.all([
        loadTodaysReminders(),
        loadDismissedKeys(),
      ]);
      setRows(loadedRows);
      setDismissed(dismissedKeys);
      setNow(new Date());
      setFailed(false);
    } catch {
      // Storage unavailable — hide the card rather than claim there are no
      // reminders when the truth is unknown.
      setFailed(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription?.remove?.();
    };
  }, [refresh]);

  const due = useMemo(
    () => dueReminderRows(rows, now).filter(row => !dismissed.has(row.key)),
    [rows, dismissed, now],
  );
  const upcoming = useMemo(
    () => remainingReminderRows(rows, dismissed, now),
    [rows, dismissed, now],
  );

  const open = () => {
    try {
      onOpen?.();
    } catch {
      // The drawer may not be mounted (e.g. a web deep link); the card is
      // still readable.
    }
  };

  const markDone = async row => {
    try {
      setDismissed(await dismissReminderKeys([row.key]));
    } catch {
      setDismissed(prev => new Set([...prev, row.key]));
    }
  };

  if (!loaded || failed) return null;

  const active = due[0] || null;
  const next = upcoming[0] || null;
  const isDue = !!active;

  const headline = isDue
    ? active.title
    : next
      ? next.title
      : rows.length === 0
        ? 'No reminders set for today'
        : 'No more reminders today';

  const detail = isDue
    ? active.message
    : next
      ? upcoming.length > 1
        ? `${upcoming.length - 1} more later today`
        : 'Tap to view or edit'
      : rows.length === 0
        ? 'In-app popups appear while the app is open'
        : 'All of today\u2019s reminders are handled';

  const timeLabel = isDue
    ? formatReminderTime(active.time)
    : next
      ? formatReminderTime(next.time)
      : null;

  return (
    <View style={[styles.card, isDue && styles.cardDue]}>
      <View style={styles.topRow}>
        <View style={[
          styles.iconPlate,
          { backgroundColor: isDue ? COLORS.amber + '22' : COLORS.primary + '1A' },
        ]}>
          <Ionicons
            name={isDue ? 'notifications' : 'notifications-outline'}
            size={15}
            color={isDue ? COLORS.amber : COLORS.primaryTint}
          />
        </View>
        <Text style={[styles.kicker, isDue && { color: COLORS.amber }]}>
          {isDue ? 'DUE NOW' : "TODAY'S REMINDERS"}
        </Text>
        <View style={{ flex: 1 }} />
        {isDue && due.length > 1 ? (
          <Text style={styles.moreDue}>+{due.length - 1} due</Text>
        ) : null}
        {timeLabel ? <Text style={styles.time}>{timeLabel}</Text> : null}
      </View>

      <View style={styles.bodyRow}>
        <TouchableOpacity
          style={styles.bodyText}
          onPress={open}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            isDue
              ? `Reminder due now: ${headline} at ${timeLabel}. Open reminders.`
              : next
                ? `Today's reminders: ${headline} at ${timeLabel}. Open reminders.`
                : rows.length === 0
                  ? 'No reminders set for today. Add a reminder.'
                  : 'No more reminders today. Open reminders.'
          }
        >
          <Text style={styles.headline} numberOfLines={1}>{headline}</Text>
          <Text style={styles.detail} numberOfLines={1}>{detail}</Text>
        </TouchableOpacity>

        {isDue ? (
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => markDone(active)}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${headline} done for today`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="checkmark" size={15} color="#000" />
          </TouchableOpacity>
        ) : rows.length === 0 ? (
          <View style={styles.addPill}>
            <Text style={styles.addText}>Add one</Text>
            <Ionicons name="add" size={13} color={COLORS.gold} />
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={15} color={COLORS.textSecondary} />
        )}
      </View>
    </View>
  );
}

const makeStyles = COLORS => StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardDue: {
    backgroundColor: COLORS.amber + '10',
    borderColor: COLORS.amber + '38',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  iconPlate: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  moreDue: { color: COLORS.amber, fontSize: 11, fontWeight: '800' },
  time: { color: COLORS.gold, fontSize: 11.5, fontWeight: '800' },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  bodyText: { flex: 1 },
  headline: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  detail: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  doneBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.amber,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.gold + '55',
    backgroundColor: COLORS.gold + '14',
  },
  addText: { color: COLORS.gold, fontSize: 11, fontWeight: '800' },
});
