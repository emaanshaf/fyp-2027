// Where the zakat figure came from.
//
// A zakat total is a number the user is asked to act on financially, so the
// composition behind it matters as much as the result. This shows which assets
// carry the wealth, what each contributes at today's metal prices, and how the
// net wealth sits against the nisab threshold.
//
// Form: horizontal bars, not a pie. The job is comparing magnitudes across a
// handful of named categories, and a bar's length is read far more accurately
// than a wedge's angle — especially at phone width with four slices.
//
// Palette: validated with the dataviz validator against the app's dark chart
// surface (#121826) — all six checks pass, worst adjacent CVD ΔE 13.7 (deutan)
// and 21.9 normal-vision. Do not substitute hues here without re-running it;
// the app's brighter theme colours FAIL the CVD check (its blue and purple are
// ΔE 0.3 apart under deuteranopia — indistinguishable).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme';

/** Fixed order — a category keeps its colour whatever the values are. */
export const ASSET_SERIES = [
  { key: 'cash', label: 'Cash & bank', color: '#0EA57A' },
  { key: 'gold', label: 'Gold', color: '#2F7DE0' },
  { key: 'silver', label: 'Silver', color: '#B08A35' },
  { key: 'investments', label: 'Investments', color: '#D4459B' },
];

const money = n =>
  `PKR ${Math.round(n).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

export default function ZakatBreakdown({ result, parts }) {
  const COLORS = useColors();
  const styles = useThemedStyles(makeStyles);
  const rows = ASSET_SERIES
    .map(s => ({ ...s, value: Math.max(0, parts[s.key] || 0) }))
    .filter(r => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalAssets = rows.reduce((sum, r) => sum + r.value, 0);
  if (totalAssets <= 0) return null;

  const max = rows[0].value;

  // Where net wealth sits relative to nisab, capped so a very large estate
  // does not flatten the threshold marker to nothing.
  const nisabRatio = result.nisab > 0
    ? Math.min(result.netWealth / result.nisab, 4)
    : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Where your zakat comes from</Text>
      <Text style={styles.sub}>
        Asset mix at today's market rates · {rows.length} categor
        {rows.length === 1 ? 'y' : 'ies'}
      </Text>

      {/* Composition: one stacked bar, 2px surface gaps between segments. */}
      <View style={styles.stack}>
        {rows.map((r, i) => (
          <View
            key={r.key}
            style={{
              flex: r.value,
              backgroundColor: r.color,
              marginRight: i < rows.length - 1 ? 2 : 0,
              borderTopLeftRadius: i === 0 ? 4 : 0,
              borderBottomLeftRadius: i === 0 ? 4 : 0,
              borderTopRightRadius: i === rows.length - 1 ? 4 : 0,
              borderBottomRightRadius: i === rows.length - 1 ? 4 : 0,
            }}
          />
        ))}
      </View>

      {/* Per-category bars. Every row is directly labelled, so identity never
          rests on colour alone. */}
      <View style={styles.rows}>
        {rows.map(r => {
          const pct = (r.value / totalAssets) * 100;
          return (
            <View key={r.key} style={styles.row}>
              <View style={styles.rowHead}>
                <View style={[styles.swatch, { backgroundColor: r.color }]} />
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowPct}>{pct.toFixed(0)}%</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    { width: `${Math.max(2, (r.value / max) * 100)}%`, backgroundColor: r.color },
                  ]}
                />
              </View>
              <View style={styles.rowFoot}>
                <Text style={styles.rowValue}>{money(r.value)}</Text>
                <Text style={styles.rowZakat}>zakat {money(r.value * 0.025)}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Nisab gauge — the threshold that decides whether zakat is owed. */}
      <View style={styles.nisabBlock}>
        <View style={styles.nisabHead}>
          <Text style={styles.nisabLabel}>Net wealth vs nisab</Text>
          <Text style={[
            styles.nisabState,
            { color: result.zakatDue ? COLORS.emerald : COLORS.textSecondary },
          ]}>
            {result.zakatDue ? 'Above threshold' : 'Below threshold'}
          </Text>
        </View>

        <View style={styles.nisabTrack}>
          <View
            style={[
              styles.nisabFill,
              {
                width: `${Math.min(100, (nisabRatio / 4) * 100)}%`,
                backgroundColor: result.zakatDue ? COLORS.emerald : COLORS.textSecondary,
              },
            ]}
          />
          {/* The threshold sits at 1x on a 0-4x scale. */}
          <View style={styles.nisabMark} />
        </View>

        <View style={styles.nisabFoot}>
          <Text style={styles.nisabFootText}>
            Nisab {money(result.nisab)}
          </Text>
          <Text style={styles.nisabFootText}>
            {nisabRatio >= 4 ? '4×+' : `${nisabRatio.toFixed(1)}×`} nisab
          </Text>
        </View>
      </View>

      {/* Deductions are shown apart from the mix: they reduce the base rather
          than forming part of it, and colouring them as a fifth category would
          imply they are an asset. */}
      {result.totalLiabilities > 0 ? (
        <View style={styles.deduct}>
          <Ionicons name="remove-circle-outline" size={14} color={COLORS.red} />
          <Text style={styles.deductText}>
            Liabilities of {money(result.totalLiabilities)} deducted before the
            2.5% was applied.
          </Text>
        </View>
      ) : null}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total zakat at 2.5%</Text>
        <Text style={styles.totalValue}>{money(result.zakatAmount)}</Text>
      </View>
    </View>
  );
}

const makeStyles = COLORS => StyleSheet.create({
  card: {
    marginTop: 18, padding: 16, borderRadius: 16,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  title: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  sub: { color: COLORS.textSecondary, fontSize: 11.5, marginTop: 3 },

  stack: { flexDirection: 'row', height: 10, marginTop: 16 },

  rows: { marginTop: 18, gap: 15 },
  row: {},
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 9, height: 9, borderRadius: 2.5 },
  rowLabel: { color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700', flex: 1 },
  rowPct: { color: COLORS.textSecondary, fontSize: 11.5, fontWeight: '700' },
  track: {
    height: 7, borderRadius: 4, backgroundColor: COLORS.divider,
    marginTop: 7, overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: 4 },
  rowFoot: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 5,
  },
  rowValue: { color: COLORS.textSecondary, fontSize: 11 },
  rowZakat: { color: COLORS.textSecondary, fontSize: 11, opacity: 0.85 },

  nisabBlock: {
    marginTop: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  nisabHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nisabLabel: { color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700' },
  nisabState: { fontSize: 11.5, fontWeight: '800' },
  nisabTrack: {
    height: 8, borderRadius: 4, backgroundColor: COLORS.divider,
    marginTop: 9, overflow: 'hidden', position: 'relative',
  },
  nisabFill: { height: '100%', borderRadius: 4 },
  nisabMark: {
    position: 'absolute', left: '25%', top: -2, bottom: -2,
    width: 2, backgroundColor: COLORS.gold,
  },
  nisabFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  nisabFootText: { color: COLORS.textSecondary, fontSize: 10.5 },

  deduct: {
    flexDirection: 'row', gap: 7, marginTop: 16, padding: 10,
    borderRadius: 9, backgroundColor: COLORS.red + '10',
  },
  deductText: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17, flex: 1 },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  totalLabel: { color: COLORS.textSecondary, fontSize: 12.5, fontWeight: '700' },
  totalValue: { color: COLORS.gold, fontSize: 17, fontWeight: '900' },
});
