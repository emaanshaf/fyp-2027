import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '../theme';

/**
 * A circular countdown for the next prayer.
 *
 * The ring fills from the previous prayer towards the next one, and the
 * remaining time ticks every second. It is driven by an absolute target
 * instant (`nextPrayer.at`) rather than by re-reading storage each second —
 * the dashboard's minute tick still refreshes the timings themselves, so the
 * ring and the prayer strip can never disagree for long.
 *
 * `onComplete` fires once when the target is reached, so the caller can fetch
 * the new next prayer immediately instead of waiting for the minute tick.
 */

const pad = n => String(n).padStart(2, '0');

/** "1:04:09" while an hour or more remains, "04:09" under an hour. */
export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Elapsed fraction of the interval, clamped so a stale target cannot overflow. */
export function ringProgress(remainingMs, windowMs) {
  if (!Number.isFinite(windowMs) || windowMs <= 0) return 0;
  const elapsed = windowMs - remainingMs;
  return Math.min(1, Math.max(0, elapsed / windowMs));
}

export default function PrayerCountdownRing({
  target,
  windowMinutes = 60,
  size = 80,
  strokeWidth = 6,
  color,
  trackColor,
  textColor,
  label,
  doneLabel = 'Now',
  onComplete,
}) {
  const COLORS = useColors();
  const targetMs = target instanceof Date ? target.getTime() : Number(target);
  const windowMs = windowMinutes * 60 * 1000;

  const [now, setNow] = useState(() => Date.now());
  const completedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // A new target (next prayer arrived, or timings refreshed) re-arms the
  // completion callback.
  useEffect(() => {
    completedRef.current = false;
  }, [targetMs]);

  const remaining = Math.max(0, targetMs - now);
  const done = remaining <= 0;

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [done, onComplete]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = ringProgress(remaining, windowMs);
  const centre = size / 2;

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size}>
        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={trackColor || COLORS.glassBorder}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={color || COLORS.primaryTint}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          fill="none"
          rotation={-90}
          originX={centre}
          originY={centre}
        />
      </Svg>
      <View style={styles.centre}>
        <Text
          style={[styles.time, { color: textColor || COLORS.textPrimary, fontSize: done ? 14 : 16 }]}
          numberOfLines={1}
        >
          {done ? doneLabel : formatCountdown(remaining)}
        </Text>
        {!done && label ? (
          <Text style={[styles.label, { color: COLORS.textSecondary }]} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  centre: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: { fontWeight: '900', letterSpacing: 0.2 },
  label: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
});
