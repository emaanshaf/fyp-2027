// Qibla finder.
//
// The previous version could not work: it hardcoded the device position to
// Islamabad ("simulated location"), never subscribed to any sensor — the
// heading state existed but nothing wrote to it — and ignored magnetic
// declination. It rendered a fixed picture that was wrong for everyone outside
// one city and never responded to turning the phone.
//
// This version:
//   - reads the real GPS position, with permission handling and a manual
//     fallback when permission is refused;
//   - subscribes to expo-location's heading stream, which reports TRUE north
//     (declination already applied by the OS) rather than magnetic north;
//   - degrades honestly where there is no compass (most browsers), showing the
//     bearing as a number and a cardinal point instead of a dial that lies.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
  ActivityIndicator, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Path, G, Text as SvgText } from 'react-native-svg';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { COLORS, globalStyles } from '../theme';
import {
  qiblaBearing, distanceToKaaba, relativeAngle, compassPoint, alignment,
} from '../utils/qibla';

const DIAL = 260;

/** The compass rose: ticks, cardinals, and the Qibla marker. */
function Dial({ heading, bearing, aligned }) {
  const c = DIAL / 2;
  const r = c - 14;
  const ticks = [];
  for (let deg = 0; deg < 360; deg += 15) {
    const major = deg % 45 === 0;
    const a = ((deg - heading) * Math.PI) / 180;
    const outer = r;
    const inner = r - (major ? 14 : 7);
    ticks.push(
      <Line
        key={deg}
        x1={c + outer * Math.sin(a)} y1={c - outer * Math.cos(a)}
        x2={c + inner * Math.sin(a)} y2={c - inner * Math.cos(a)}
        stroke={major ? COLORS.textSecondary : COLORS.divider}
        strokeWidth={major ? 1.6 : 1}
      />
    );
  }

  const cardinals = [['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([label, deg]) => {
    const a = ((deg - heading) * Math.PI) / 180;
    const rr = r - 30;
    return (
      <SvgText
        key={label}
        x={c + rr * Math.sin(a)} y={c - rr * Math.cos(a) + 5}
        fontSize="14" fontWeight="800" textAnchor="middle"
        fill={label === 'N' ? COLORS.red : COLORS.textSecondary}
      >
        {label}
      </SvgText>
    );
  });

  // The Kaaba marker sits on the rim at the qibla bearing, rotating with the
  // rose so it stays pinned to a real-world direction as the phone turns.
  const qa = ((bearing - heading) * Math.PI) / 180;
  const qx = c + (r - 4) * Math.sin(qa);
  const qy = c - (r - 4) * Math.cos(qa);
  const accent = aligned ? COLORS.emerald : COLORS.gold;

  return (
    <Svg width={DIAL} height={DIAL}>
      <Circle cx={c} cy={c} r={r} stroke={COLORS.glassBorder} strokeWidth="1.5" fill="none" />
      <Circle cx={c} cy={c} r={r - 44} stroke={COLORS.divider} strokeWidth="1" fill="none" />
      <G>{ticks}</G>
      <G>{cardinals}</G>

      {/* Qibla ray + marker */}
      <Line x1={c} y1={c} x2={qx} y2={qy} stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx={qx} cy={qy} r="15" fill={accent} />
      <Path
        d={`M ${qx - 6} ${qy + 5} L ${qx - 6} ${qy - 3} L ${qx} ${qy - 7} L ${qx + 6} ${qy - 3} L ${qx + 6} ${qy + 5} Z`}
        fill={COLORS.bg}
      />

      {/* The device's own heading — a fixed needle at the top of the dial. */}
      <Line x1={c} y1={c - r + 6} x2={c} y2={c - r + 22} stroke={COLORS.cyan} strokeWidth="3" strokeLinecap="round" />
      <Circle cx={c} cy={c} r="5" fill={accent} />
    </Svg>
  );
}

export default function QiblaFinderScreen() {
  const [coords, setCoords] = useState(null);
  const [heading, setHeading] = useState(null);   // null = no compass available
  const [accuracy, setAccuracy] = useState(null);
  const [status, setStatus] = useState('locating'); // locating | ready | denied | error
  const [message, setMessage] = useState(null);

  const wasAligned = useRef(false);
  const pulse = useRef(new Animated.Value(0)).current;

  const bearing = coords ? qiblaBearing(coords.latitude, coords.longitude) : null;
  const distance = coords ? distanceToKaaba(coords.latitude, coords.longitude) : null;
  const offset = bearing !== null && heading !== null ? relativeAngle(bearing, heading) : null;
  const align = offset !== null ? alignment(offset) : null;
  const isAligned = align?.state === 'aligned';

  const locate = useCallback(async () => {
    setStatus('locating');
    setMessage(null);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        setMessage('Location permission is needed to work out the Qibla from where you are.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords(pos.coords);
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      setMessage(e?.message || 'Could not read your location.');
    }
  }, []);

  useEffect(() => { locate(); }, [locate]);

  // Heading stream. `trueHeading` is corrected for magnetic declination by the
  // OS; `magHeading` is the raw magnetic reading and is only used when the
  // device cannot supply a true heading (trueHeading is -1 then).
  useEffect(() => {
    let sub = null;
    let cancelled = false;

    (async () => {
      try {
        sub = await Location.watchHeadingAsync(h => {
          if (cancelled) return;
          const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (typeof deg === 'number' && deg >= 0) setHeading(deg);
          if (typeof h.accuracy === 'number') setAccuracy(h.accuracy);
        });
      } catch {
        // No compass (most browsers, some tablets). The bearing is still
        // shown numerically — see the no-compass note below.
        if (!cancelled) setHeading(null);
      }
    })();

    return () => { cancelled = true; sub?.remove?.(); };
  }, []);

  // A short buzz the moment the user lines up, so the phone can be held at
  // prayer height without watching the screen.
  useEffect(() => {
    if (isAligned && !wasAligned.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    }
    wasAligned.current = isAligned;
  }, [isAligned, pulse]);

  const accent = isAligned ? COLORS.emerald : COLORS.gold;
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  if (status === 'locating') {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <View style={styles.centre}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={styles.muted}>Finding your location…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status !== 'ready') {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <View style={styles.centre}>
          <Ionicons name="location-outline" size={44} color={COLORS.textSecondary} />
          <Text style={styles.errTitle}>
            {status === 'denied' ? 'Location permission needed' : 'Could not find you'}
          </Text>
          <Text style={styles.muted}>{message}</Text>
          <TouchableOpacity
            onPress={locate}
            style={styles.retryBtn}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Ionicons name="refresh" size={16} color="#000" />
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
          {/* Never invent a direction: without a position there is no honest
              bearing to show, so none is shown. */}
          <Text style={styles.note}>
            The Qibla depends on where you are, so it cannot be shown without
            your location.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <View style={styles.container}>
        <Animated.View style={[styles.dialWrap, { transform: [{ scale }] }]}>
          <Dial
            heading={heading ?? 0}
            bearing={bearing}
            aligned={isAligned}
          />
          <View style={styles.dialCentre} pointerEvents="none">
            <Text style={[styles.bearingBig, { color: accent }]}>
              {Math.round(bearing)}°
            </Text>
            <Text style={styles.bearingPoint}>{compassPoint(bearing)}</Text>
          </View>
        </Animated.View>

        {/* Guidance */}
        {heading === null ? (
          <View style={styles.noCompass}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.amber} />
            <Text style={styles.noCompassText}>
              No compass on this device, so the dial cannot track which way you
              are facing. The Qibla is {Math.round(bearing)}°
              {' '}({compassPoint(bearing)}) from true north.
            </Text>
          </View>
        ) : (
          <View style={[styles.status, isAligned && { borderColor: COLORS.emerald }]}>
            <Ionicons
              name={isAligned ? 'checkmark-circle' : offset > 0 ? 'arrow-forward-circle' : 'arrow-back-circle'}
              size={20}
              color={accent}
            />
            <Text style={[styles.statusText, { color: accent }]}>{align.label}</Text>
            {!isAligned ? (
              <Text style={styles.statusOff}>{Math.abs(Math.round(offset))}° off</Text>
            ) : null}
          </View>
        )}

        {/* Facts */}
        <View style={styles.facts}>
          <View style={styles.fact}>
            <Text style={styles.factValue}>{Math.round(bearing)}°</Text>
            <Text style={styles.factLabel}>Qibla bearing</Text>
          </View>
          <View style={styles.factDivider} />
          <View style={styles.fact}>
            <Text style={styles.factValue}>{Math.round(distance).toLocaleString()}</Text>
            <Text style={styles.factLabel}>km to Kaaba</Text>
          </View>
          <View style={styles.factDivider} />
          <View style={styles.fact}>
            <Text style={styles.factValue}>
              {heading === null ? '—' : `${Math.round(heading)}°`}
            </Text>
            <Text style={styles.factLabel}>Facing</Text>
          </View>
        </View>

        <Text style={styles.coords}>
          {coords.latitude.toFixed(4)}°, {coords.longitude.toFixed(4)}°
          {coords.accuracy ? `  ·  ±${Math.round(coords.accuracy)} m` : ''}
        </Text>

        {/* Calibration matters more than the app admits on most devices. */}
        {heading !== null && accuracy !== null && accuracy < 2 ? (
          <View style={styles.calibrate}>
            <Ionicons name="sync-outline" size={14} color={COLORS.amber} />
            <Text style={styles.calibrateText}>
              Compass accuracy is low. Move the phone in a figure-of-eight, away
              from metal and electronics.
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={locate}
          style={styles.refresh}
          accessibilityRole="button"
          accessibilityLabel="Update my location"
        >
          <Ionicons name="locate-outline" size={15} color={COLORS.cyan} />
          <Text style={styles.refreshText}>Update location</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Direction is the great-circle bearing to the Kaaba in Masjid al-Haram.
          A phone compass is accurate to a few degrees at best — if in doubt,
          confirm with your local mosque.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  muted: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  errTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4,
    backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
  },
  retryText: { color: '#000', fontWeight: '800', fontSize: 13 },

  dialWrap: { width: DIAL, height: DIAL, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  dialCentre: { position: 'absolute', alignItems: 'center' },
  bearingBig: { fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  bearingPoint: {
    color: COLORS.textSecondary, fontSize: 12, fontWeight: '700',
    letterSpacing: 2, marginTop: 2,
  },

  status: {
    flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 22,
    borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  statusText: { fontSize: 14, fontWeight: '800' },
  statusOff: { color: COLORS.textSecondary, fontSize: 12 },

  noCompass: {
    flexDirection: 'row', gap: 8, marginTop: 22, padding: 13, borderRadius: 12,
    backgroundColor: COLORS.amber + '12', borderWidth: 1, borderColor: COLORS.amber + '30',
  },
  noCompassText: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 19, flex: 1 },

  facts: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch',
    marginTop: 24, paddingVertical: 16, borderRadius: 16,
    backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  fact: { flex: 1, alignItems: 'center', gap: 3 },
  factValue: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '900' },
  factLabel: { color: COLORS.textSecondary, fontSize: 10.5 },
  factDivider: { width: 1, height: 28, backgroundColor: COLORS.divider },

  coords: { color: COLORS.textSecondary, fontSize: 11.5, marginTop: 12 },

  calibrate: {
    flexDirection: 'row', gap: 7, marginTop: 14, padding: 11, borderRadius: 10,
    backgroundColor: COLORS.amber + '10', borderWidth: 1, borderColor: COLORS.amber + '2E',
  },
  calibrateText: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17, flex: 1 },

  refresh: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  refreshText: { color: COLORS.cyan, fontSize: 12.5, fontWeight: '700' },

  note: {
    color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18,
    textAlign: 'center', marginTop: 18, opacity: 0.9,
  },
});
