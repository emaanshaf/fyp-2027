// A drawn moon that shows the actual lunar phase for a day of the Hijri month.
//
// This replaces a static `moon` glyph, which showed the same full moon on the
// 1st as on the 29th and so told the reader nothing.
//
// Construction: the classic three-shape terminator. A dark disc, the lit half
// on the illuminated side, then an ellipse whose width is |cos(phase angle)| —
// filled dark for a crescent (less than half lit) and light for a gibbous
// (more than half lit). That yields a correct terminator at every phase
// without clip paths or masks, which react-native-svg renders inconsistently
// across platforms.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Ellipse, G } from 'react-native-svg';
import { useColors } from '../theme';

/** Mean synodic month — the moon's actual cycle, not the calendar's 29/30. */
const SYNODIC = 29.53059;

/** @returns 0 at new moon, 0.5 at full, approaching 1 back at new. */
export const phaseFromHijriDay = day => ((day - 1) % SYNODIC) / SYNODIC;

/** Fraction of the disc lit, 0-1. */
export const illumination = phase => (1 - Math.cos(2 * Math.PI * phase)) / 2;

export function phaseName(phase) {
  const p = phase % 1;
  if (p < 0.03 || p > 0.97) return 'New Moon';
  if (p < 0.22) return 'Waxing Crescent';
  if (p < 0.28) return 'First Quarter';
  if (p < 0.47) return 'Waxing Gibbous';
  if (p < 0.53) return 'Full Moon';
  if (p < 0.72) return 'Waning Gibbous';
  if (p < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

export default function MoonPhase({
  day = 1, size = 76, lit, dark, onPress,
}) {
  const COLORS = useColors();
  const litColor = lit || COLORS.gold;
  const darkColor = dark || COLORS.bgSecondary;
  const phase = phaseFromHijriDay(day);
  const r = size / 2 - 2;
  const c = size / 2;

  const k = Math.cos(2 * Math.PI * phase); // +1 new, -1 full
  const waxing = phase < 0.5;
  const ellipseFill = k > 0 ? darkColor : litColor;

  // The lit half: right while waxing, left while waning.
  const halfPath = waxing
    ? `M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} Z`
    : `M ${c} ${c - r} A ${r} ${r} 0 0 0 ${c} ${c + r} Z`;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={`${phaseName(phase)}, ${Math.round(illumination(phase) * 100)}% illuminated`}
      style={styles.wrap}
    >
      <Svg width={size} height={size}>
        <G>
          <Circle cx={c} cy={c} r={r} fill={darkColor} stroke={litColor} strokeWidth="1" strokeOpacity="0.4" />
          <Path d={halfPath} fill={litColor} />
          <Ellipse cx={c} cy={c} rx={Math.abs(k) * r} ry={r} fill={ellipseFill} />
          {/* Rim last so the terminator never bleeds past the disc edge. */}
          <Circle cx={c} cy={c} r={r} fill="none" stroke={litColor} strokeWidth="1" strokeOpacity="0.55" />
        </G>
      </Svg>
      <Text style={[styles.caption, { color: COLORS.textPrimary }]}>{phaseName(phase)}</Text>
      <Text style={[styles.sub, { color: COLORS.textSecondary }]}>
        {Math.round(illumination(phase) * 100)}% illuminated
      </Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 2 },
  caption: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  sub: { fontSize: 10.5 },
});
