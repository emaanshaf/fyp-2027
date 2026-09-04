import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, Animated, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import Svg, { Circle, Line, Polygon, G, Text as SvgText, Defs, RadialGradient, Stop, Path } from 'react-native-svg';
import { COLORS, globalStyles } from '../theme';
import {
  FIQH_METHODS, DEFAULT_FIQH, fiqhByKey, fiqhQuery, fiqhCacheSuffix,
} from '../data/prayerMethods';

// ─── Constants ────────────────────────────────────────────────────────────────
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;
const PRAYER_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Midnight'];
const PRAYER_ICONS = { Fajr: 'partly-sunny-outline', Sunrise: 'sunny-outline', Dhuhr: 'sunny', Asr: 'partly-sunny', Maghrib: 'cloudy-night-outline', Isha: 'moon-outline', Midnight: 'moon' };
const PRAYER_COLORS = { Fajr: '#ffffff', Sunrise: '#ffffff', Dhuhr: '#ffffff', Asr: '#ffffff', Maghrib: '#ff4444', Isha: '#ffffff', Midnight: '#aaaaaa' };
const DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt12 = (t) => {
  if (!t) return '--:--';
  const [h, m] = t.split(':');
  const hour = +h % 12 || 12;
  return `${hour}:${m} ${+h < 12 ? 'AM' : 'PM'}`;
};

const getCompassLabel = (deg) => DIRS[Math.round(deg / 22.5) % 16];

// Great-circle bearing from (lat1, lng1) to Kaaba
const calcQibla = (lat, lng) => {
  const φ1 = lat * Math.PI / 180;
  const φ2 = KAABA_LAT * Math.PI / 180;
  const Δλ = (KAABA_LNG - lng) * Math.PI / 180;
  const x = Math.sin(Δλ) * Math.cos(φ2);
  const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(x, y) * 180 / Math.PI) + 360) % 360;
};

// Haversine distance in km
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Short-path delta to avoid 360° spinning
const shortDelta = (from, to) => {
  let d = ((to - from) % 360 + 540) % 360 - 180;
  return d;
};

// ─── Live Qibla Compass ───────────────────────────────────────────────────────
const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 138;
const R_FACE  = 118;
const R_INNER = 22;

function LiveQiblaCompass({ qiblaAngle, heading, accuracy, distanceKm, location }) {
  const compassAnim = useRef(new Animated.Value(0)).current;
  const needleAnim  = useRef(new Animated.Value(0)).current;
  const compassAccum = useRef(0);
  const needleAccum  = useRef(0);

  useEffect(() => {
    // Rotate compass rose counterclockwise so geographic N stays up
    const targetCompass = -heading;
    const delta = shortDelta(compassAccum.current % 360, targetCompass);
    compassAccum.current += delta;
    Animated.spring(compassAnim, {
      toValue: compassAccum.current,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [heading]);

  useEffect(() => {
    // Needle angle on screen = qibla bearing – device heading
    const targetNeedle = qiblaAngle - heading;
    const delta = shortDelta(needleAccum.current % 360, targetNeedle);
    needleAccum.current += delta;
    Animated.spring(needleAnim, {
      toValue: needleAccum.current,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [qiblaAngle, heading]);

  const compassRotate = compassAnim.interpolate({
    inputRange: [-720, 720],
    outputRange: ['-720deg', '720deg'],
    extrapolate: 'extend',
  });
  const needleRotate = needleAnim.interpolate({
    inputRange: [-720, 720],
    outputRange: ['-720deg', '720deg'],
    extrapolate: 'extend',
  });

  // Accuracy ring color
  const accColor = accuracy > 20 ? COLORS.red : accuracy > 10 ? COLORS.amber : COLORS.emerald;
  const accLabel = accuracy > 20 ? 'Low' : accuracy > 10 ? 'Medium' : 'High';

  return (
    <View style={styles.compassWrap}>
      {/* Outer glow ring */}
      <View style={styles.compassGlow} />

      {/* Compass Rose — rotates with device heading */}
      <Animated.View style={[styles.compassLayer, { transform: [{ rotate: compassRotate }] }]}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <RadialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="rgba(30,22,6,1)" />
              <Stop offset="100%" stopColor="rgba(10,8,2,1)" />
            </RadialGradient>
          </Defs>

          {/* Face background */}
          <Circle cx={CX} cy={CY} r={R_FACE} fill="url(#bgGrad)" stroke="rgba(255, 255, 255,0.25)" strokeWidth={1.5} />

          {/* Outer border ring */}
          <Circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="rgba(255, 255, 255,0.15)" strokeWidth={1} />

          {/* Degree ticks */}
          {Array.from({ length: 72 }, (_, i) => {
            const angle = i * 5;
            const rad = (angle - 90) * Math.PI / 180;
            const isMajor = angle % 45 === 0;
            const isMinor = angle % 10 === 0;
            const inner = R_FACE - (isMajor ? 14 : isMinor ? 9 : 5);
            const outer = R_FACE - 1;
            return (
              <Line key={i}
                x1={CX + inner * Math.cos(rad)} y1={CY + inner * Math.sin(rad)}
                x2={CX + outer * Math.cos(rad)} y2={CY + outer * Math.sin(rad)}
                stroke={isMajor ? 'rgba(255, 255, 255,0.7)' : isMinor ? 'rgba(255, 255, 255,0.3)' : 'rgba(255,255,255,0.08)'}
                strokeWidth={isMajor ? 2 : 1}
              />
            );
          })}

          {/* Cardinal labels */}
          {[
            ['N', 0,   COLORS.gold, '800', 15],
            ['S', 180, '#ff4444',   '700', 13],
            ['E', 90,  '#aaaaaa',   '700', 12],
            ['W', 270, '#aaaaaa',   '700', 12],
          ].map(([label, angle, color, weight, size]) => {
            const rad = (angle - 90) * Math.PI / 180;
            const r = R_FACE - 26;
            return (
              <SvgText key={label}
                x={CX + r * Math.cos(rad)}
                y={CY + r * Math.sin(rad)}
                fill={color} fontSize={size} fontWeight={weight}
                textAnchor="middle" alignmentBaseline="middle"
              >{label}</SvgText>
            );
          })}

          {/* Intercardinal labels */}
          {[['NE', 45], ['SE', 135], ['SW', 225], ['NW', 315]].map(([label, angle]) => {
            const rad = (angle - 90) * Math.PI / 180;
            const r = R_FACE - 28;
            return (
              <SvgText key={label}
                x={CX + r * Math.cos(rad)} y={CY + r * Math.sin(rad)}
                fill="rgba(148,163,184,0.5)" fontSize={9} fontWeight="600"
                textAnchor="middle" alignmentBaseline="middle"
              >{label}</SvgText>
            );
          })}

          {/* Center circle */}
          <Circle cx={CX} cy={CY} r={R_INNER} fill="rgba(255, 255, 255,0.08)" stroke="rgba(255, 255, 255,0.3)" strokeWidth={1} />
          <Circle cx={CX} cy={CY} r={5} fill={COLORS.gold} />
        </Svg>
      </Animated.View>

      {/* Qibla Needle — rotates to always point to Mecca */}
      <Animated.View style={[styles.compassLayer, { transform: [{ rotate: needleRotate }] }]}>
        <Svg width={SIZE} height={SIZE}>
          {/* Needle shadow/glow line */}
          <Line
            x1={CX} y1={CY + R_INNER}
            x2={CX} y2={CY - R_FACE + 4}
            stroke="rgba(255, 255, 255,0.12)" strokeWidth={10} strokeLinecap="round"
          />
          {/* Main needle */}
          <Line
            x1={CX} y1={CY + R_INNER - 2}
            x2={CX} y2={CY - R_FACE + 22}
            stroke={COLORS.gold} strokeWidth={3} strokeLinecap="round"
          />
          {/* Arrowhead (triangle pointing up) */}
          <Polygon
            points={`${CX},${CY - R_FACE + 6} ${CX - 8},${CY - R_FACE + 26} ${CX + 8},${CY - R_FACE + 26}`}
            fill={COLORS.gold}
          />
          {/* Kaaba symbol at tip */}
          <SvgText
            x={CX} y={CY - R_FACE + 50}
            fill={COLORS.gold} fontSize={22}
            textAnchor="middle" alignmentBaseline="middle"
          >🕋</SvgText>
          {/* Counter-needle (south, red) */}
          <Line
            x1={CX} y1={CY + R_INNER + 2}
            x2={CX} y2={CY + R_FACE - 10}
            stroke="#f43f5e" strokeWidth={2} strokeLinecap="round"
          />
          <Polygon
            points={`${CX},${CY + R_FACE - 2} ${CX - 5},${CY + R_FACE - 14} ${CX + 5},${CY + R_FACE - 14}`}
            fill="#f43f5e"
          />
        </Svg>
      </Animated.View>

      {/* Center cap (always on top) */}
      <View style={styles.centerCap} />

      {/* Info overlay */}
      <View style={styles.compassInfoOverlay}>
        {/* Accuracy badge */}
        <View style={[styles.accuracyBadge, { borderColor: accColor + '50', backgroundColor: accColor + '12' }]}>
          <View style={[styles.accDot, { backgroundColor: accColor }]} />
          <Text style={[styles.accText, { color: accColor }]}>{accLabel} Accuracy</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PrayerTimesScreen() {
  const [timings, setTimings]   = useState(null);
  const [fiqh, setFiqh]         = useState(DEFAULT_FIQH);
  const [loading, setLoading]   = useState(false);
  const [city, setCity]         = useState('Islamabad');
  const [country, setCountry]   = useState('Pakistan');
  const [tempCity, setTempCity] = useState('');
  const [tempCountry, setTempCountry] = useState('');
  const [modal, setModal]       = useState(false);
  const [nextPrayer, setNextPrayer] = useState('');
  const [tab, setTab]           = useState('times');

  // Qibla state
  const [location, setLocation]     = useState(null);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [distanceKm, setDistanceKm] = useState(null);
  const [heading, setHeading]       = useState(0);
  const [magAccuracy, setMagAccuracy] = useState(30);
  const [locStatus, setLocStatus]   = useState('idle'); // idle|loading|ok|error
  const [sensorSub, setSensorSub]   = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    loadData();
    return () => {
      clearInterval(timerRef.current);
      sensorSub && sensorSub.remove();
    };
  }, []);

  // Start/stop sensors when Qibla tab is active
  useEffect(() => {
    if (tab === 'qibla') {
      startQibla();
    } else {
      sensorSub && sensorSub.remove();
      setSensorSub(null);
    }
    return () => {
      if (tab !== 'qibla') {
        sensorSub && sensorSub.remove();
      }
    };
  }, [tab]);

  // ── Prayer times ────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const cachedCity    = await AsyncStorage.getItem('qitab_prayer_city');
      const cachedCountry = await AsyncStorage.getItem('qitab_prayer_country');
      const savedFiqh     = await AsyncStorage.getItem('qitab_prayer_fiqh');
      if (savedFiqh) setFiqh(savedFiqh);
      if (cachedCity)    setCity(cachedCity);
      if (cachedCountry) setCountry(cachedCountry);
      await fetchTimings(
        cachedCity || 'Islamabad',
        cachedCountry || 'Pakistan',
        (await AsyncStorage.getItem('qitab_prayer_fiqh')) || DEFAULT_FIQH
      );
    } catch {} finally { setLoading(false); }
  };

  const fetchTimings = async (c, co, school = fiqh) => {
    try {
      // The cache is keyed by school as well as place: Hanafi and Ja'fari Asr
      // are nearly an hour apart, so sharing one cache would show the wrong
      // school's times after a switch.
      const suffix   = fiqhCacheSuffix(school);
      const cacheKey = `qitab_timings_${c}_${co}${suffix}`;
      const tsKey    = `qitab_timings_ts_${c}_${co}${suffix}`;
      const cached   = await AsyncStorage.getItem(cacheKey);
      const ts       = await AsyncStorage.getItem(tsKey);
      if (cached && ts && Date.now() - parseInt(ts) < 3600000) {
        setTimings(JSON.parse(cached));
        return;
      }
      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(c)}`
        + `&country=${encodeURIComponent(co)}&${fiqhQuery(school)}`
      );
      const data = await res.json();
      const t    = data.data.timings;
      setTimings(t);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(t));
      await AsyncStorage.setItem(tsKey, Date.now().toString());
      // The dashboard and the prayer lock read this unsuffixed key, so keep it
      // pointing at whichever school the user is actually following.
      await AsyncStorage.setItem(`qitab_timings_${c}_${co}`, JSON.stringify(t));
    } catch {}
  };

  useEffect(() => {
    if (!timings) return;
    timerRef.current = setInterval(findNext, 1000);
    findNext();
    return () => clearInterval(timerRef.current);
  }, [timings]);

  const findNext = () => {
    if (!timings) return;
    const now = new Date();
    for (const p of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
      const [h, m] = (timings[p] || '').split(':');
      const t = new Date(); t.setHours(+h, +m, 0, 0);
      if (t > now) { setNextPrayer(p); return; }
    }
    setNextPrayer('Fajr');
  };

  const handleLocationSubmit = async () => {
    const c  = tempCity.trim() || city;
    const co = tempCountry.trim() || country;
    setCity(c); setCountry(co); setModal(false);
    await AsyncStorage.setItem('qitab_prayer_city', c);
    await AsyncStorage.setItem('qitab_prayer_country', co);
    setLoading(true);
    await fetchTimings(c, co);
    setLoading(false);
  };

  // ── Qibla Compass ───────────────────────────────────────────────────────────
  const startQibla = async () => {
    if (Platform.OS === 'web') {
      // Web: use browser Geolocation API
      if ('geolocation' in navigator) {
        setLocStatus('loading');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setLocation({ latitude, longitude });
            const angle = calcQibla(latitude, longitude);
            const dist  = haversine(latitude, longitude, KAABA_LAT, KAABA_LNG);
            setQiblaAngle(angle);
            setDistanceKm(dist);
            setLocStatus('ok');
          },
          () => setLocStatus('error')
        );
      }
      return;
    }

    // Mobile: expo-location + Magnetometer
    setLocStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocStatus('error'); return; }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;
      setLocation({ latitude, longitude });
      const angle = calcQibla(latitude, longitude);
      const dist  = haversine(latitude, longitude, KAABA_LAT, KAABA_LNG);
      setQiblaAngle(angle);
      setDistanceKm(dist);
      setLocStatus('ok');

      // Start magnetometer
      Magnetometer.setUpdateInterval(100);
      const sub = Magnetometer.addListener(({ x, y, z }) => {
        // Standard compass heading formula (device held flat, screen up)
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        let h = (angle >= 0 ? angle : angle + 360);
        h = (90 - h + 360) % 360;
        setHeading(h);
        // Use z magnitude as rough accuracy proxy (lower = more accurate near equator)
        const mag = Math.sqrt(x * x + y * y + z * z);
        const acc = Math.abs(mag - 50); // μT deviation from typical Earth field
        setMagAccuracy(Math.min(acc, 50));
      });
      setSensorSub(sub);
    } catch { setLocStatus('error'); }
  };

  const retryLocation = () => {
    sensorSub && sensorSub.remove();
    setSensorSub(null);
    setLocStatus('idle');
    startQibla();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      {/* Header — solid emerald banner, matching the dashboard hero. */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Prayer Times</Text>
          <View style={globalStyles.row}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.headerLocation}>{city}, {country}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => { setTempCity(city); setTempCountry(country); setModal(true); }}
          style={styles.locBtn}
        >
          <Ionicons name="location" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          ['times', 'Prayer Times', 'time-outline'],
          ['qibla', 'Qibla Compass', 'compass-outline'],
        ].map(([k, label, icon]) => (
          <TouchableOpacity
            key={k}
            onPress={() => setTab(k)}
            style={[styles.tab, tab === k && styles.tabActive]}
          >
            <Ionicons name={icon} size={16} color={tab === k ? '#fff' : COLORS.textSecondary} />
            <Text style={[styles.tabText, tab === k && { color: '#fff' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TAB: Prayer Times ── */}
      {tab === 'times' && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {loading && !timings ? (
            <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 32 }}>Loading prayer times…</Text>
          ) : timings ? (
            PRAYER_ORDER.map(prayer => {
              const time  = timings[prayer];
              if (!time) return null;
              const isNext = prayer === nextPrayer;
              const color  = PRAYER_COLORS[prayer] || COLORS.textSecondary;
              return (
                <View key={prayer} style={[styles.prayerRow, isNext && { borderColor: color, backgroundColor: `${color}10` }]}>
                  <View style={[styles.prayerIcon, { backgroundColor: `${color}18` }]}>
                    <Ionicons name={PRAYER_ICONS[prayer] || 'time-outline'} size={22} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={globalStyles.row}>
                      <Text style={[styles.prayerName, isNext && { color }]}>{prayer}</Text>
                      {isNext && (
                        <View style={[styles.nextBadge, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
                          <Text style={[styles.nextBadgeText, { color }]}>NEXT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                      {prayer === 'Fajr' ? 'Pre-dawn prayer' : prayer === 'Sunrise' ? 'Sunrise time' : prayer === 'Dhuhr' ? 'Midday prayer' : prayer === 'Asr' ? 'Afternoon prayer' : prayer === 'Maghrib' ? 'Sunset prayer' : prayer === 'Isha' ? 'Night prayer' : 'Midnight'}
                    </Text>
                  </View>
                  <Text style={[styles.prayerTime, isNext && { color }]}>{fmt12(time)}</Text>
                </View>
              );
            })
          ) : (
            <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 32 }}>
              Could not load prayer times. Check your connection.
            </Text>
          )}

          {/* School of fiqh. This is not cosmetic: the Hanafi Asr is nearly an
              hour after the single-shadow reckoning, and the Ja'fari Maghrib
              is about fifteen minutes after sunset. */}
          <Text style={styles.fiqhHeading}>Calculation school</Text>
          <View style={styles.fiqhRow}>
            {FIQH_METHODS.map(m => (
              <TouchableOpacity
                key={m.key}
                onPress={async () => {
                  setFiqh(m.key);
                  await AsyncStorage.setItem('qitab_prayer_fiqh', m.key);
                  await fetchTimings(city, country, m.key);
                }}
                style={[styles.fiqhChip, fiqh === m.key && styles.fiqhChipActive]}
                accessibilityRole="button"
                accessibilityLabel={`${m.name} calculation`}
              >
                <Text style={[styles.fiqhArabic, fiqh === m.key && { color: COLORS.gold }]}>
                  {m.arabic}
                </Text>
                <Text style={[styles.fiqhName, fiqh === m.key && { color: COLORS.gold }]}>
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.methodCard}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700' }}>
                {fiqhByKey(fiqh).summary}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17, marginTop: 3 }}>
                {fiqhByKey(fiqh).detail}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── TAB: Qibla ── */}
      {tab === 'qibla' && (
        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Location loading/error states */}
          {locStatus === 'idle' && (
            <View style={styles.qiblaPrompt}>
              <Ionicons name="location-outline" size={48} color={COLORS.gold} />
              <Text style={styles.qiblaPromptTitle}>Locate Me for Qibla</Text>
              <Text style={styles.qiblaPromptSub}>
                Your GPS location is used to calculate the exact Qibla direction and animate a live compass.
              </Text>
              <TouchableOpacity style={[globalStyles.btnPrimary, { marginTop: 20 }]} onPress={startQibla}>
                <Ionicons name="navigate" size={18} color="#000" />
                <Text style={globalStyles.btnPrimaryText}>Find My Qibla</Text>
              </TouchableOpacity>
            </View>
          )}

          {locStatus === 'loading' && (
            <View style={styles.qiblaPrompt}>
              <Ionicons name="compass-outline" size={48} color={COLORS.gold} />
              <Text style={styles.qiblaPromptTitle}>Detecting location…</Text>
              <Text style={styles.qiblaPromptSub}>Please allow location access when prompted.</Text>
            </View>
          )}

          {locStatus === 'error' && (
            <View style={styles.qiblaPrompt}>
              <Ionicons name="warning-outline" size={48} color={COLORS.red} />
              <Text style={[styles.qiblaPromptTitle, { color: COLORS.red }]}>Location Unavailable</Text>
              <Text style={styles.qiblaPromptSub}>
                Please grant location permission and ensure GPS is enabled.
              </Text>
              <TouchableOpacity style={[globalStyles.btnPrimary, { marginTop: 16 }]} onPress={retryLocation}>
                <Ionicons name="refresh" size={18} color="#000" />
                <Text style={globalStyles.btnPrimaryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {locStatus === 'ok' && (
            <>
              {/* Header info */}
              <View style={styles.qiblaHeader}>
                <View style={styles.qiblaHeadCard}>
                  <Ionicons name="navigate" size={18} color={COLORS.gold} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 11, letterSpacing: 1 }}>QIBLA DIRECTION</Text>
                    <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 24 }}>
                      {qiblaAngle.toFixed(1)}° <Text style={{ fontSize: 16 }}>{getCompassLabel(qiblaAngle)}</Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.qiblaHeadCard}>
                  <Ionicons name="airplane-outline" size={18} color={COLORS.blue} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 11, letterSpacing: 1 }}>DISTANCE TO MECCA</Text>
                    <Text style={{ color: COLORS.blue, fontWeight: '900', fontSize: 20 }}>
                      {distanceKm ? `${Math.round(distanceKm).toLocaleString()} km` : '—'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── Live Compass ── */}
              <LiveQiblaCompass
                qiblaAngle={qiblaAngle}
                heading={heading}
                accuracy={magAccuracy}
                distanceKm={distanceKm}
                location={location}
              />

              {/* How to use */}
              <View style={styles.howToCard}>
                <View style={[globalStyles.row, { gap: 8, marginBottom: 12 }]}>
                  <Text style={{ fontSize: 20 }}>🕋</Text>
                  <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 16 }}>How to use</Text>
                </View>
                {[
                  'Hold your phone flat and steady.',
                  'Slowly rotate until the golden arrow points straight up.',
                  'That direction is the Qibla — face it to pray.',
                  'If the compass spins, calibrate by moving your phone in a figure-8.',
                ].map((step, i) => (
                  <View key={i} style={[globalStyles.row, { alignItems: 'flex-start', gap: 10, marginBottom: 8 }]}>
                    <View style={styles.stepNum}>
                      <Text style={{ color: '#000', fontSize: 11, fontWeight: '900' }}>{i + 1}</Text>
                    </View>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 13, flex: 1, lineHeight: 20 }}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Location coordinates */}
              {location && (
                <View style={styles.coordCard}>
                  <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginLeft: 6 }}>
                    Your location: {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
                  </Text>
                  <TouchableOpacity onPress={retryLocation} style={{ marginLeft: 'auto' }}>
                    <Ionicons name="refresh-outline" size={16} color={COLORS.gold} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Calibration tip */}
              <View style={styles.calibrationCard}>
                <Ionicons name="sync-outline" size={16} color={COLORS.amber} />
                <Text style={{ color: COLORS.amber, fontSize: 12, flex: 1, marginLeft: 8, lineHeight: 18 }}>
                  <Text style={{ fontWeight: '700' }}>Calibration tip:</Text> Move your phone in a figure-8 motion a few times to improve compass accuracy.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Location Modal */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={styles.locationSheet}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 20 }]}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '900', fontSize: 20 }}>Set Location</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={globalStyles.label}>CITY</Text>
            <View style={[globalStyles.input, { marginBottom: 14 }]}>
              <Ionicons name="business-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15, marginLeft: 8 }}
                value={tempCity}
                onChangeText={setTempCity}
                placeholder="e.g. Karachi"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <Text style={globalStyles.label}>COUNTRY</Text>
            <View style={[globalStyles.input, { marginBottom: 24 }]}>
              <Ionicons name="globe-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15, marginLeft: 8 }}
                value={tempCountry}
                onChangeText={setTempCountry}
                placeholder="e.g. Pakistan"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <TouchableOpacity style={globalStyles.btnPrimary} onPress={handleLocationSubmit}>
              <Ionicons name="location" size={18} color="#000" />
              <Text style={globalStyles.btnPrimaryText}>Update Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 8, marginBottom: 4,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 20 },
  headerLocation: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginLeft: 4 },
  locBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255, 255, 255,0.16)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255,0.3)',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 4,
    backgroundColor: COLORS.glass, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  tabActive:  { backgroundColor: COLORS.primary },
  tabText:    { color: COLORS.textSecondary, fontWeight: '700', fontSize: 13 },
  prayerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    marginBottom: 10, backgroundColor: COLORS.glass,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  prayerIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  prayerName: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 15 },
  prayerTime: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 16 },
  nextBadge: {
    marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1,
  },
  nextBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  fiqhHeading: {
    color: COLORS.textPrimary, fontSize: 13, fontWeight: '800',
    marginTop: 18, marginBottom: 8, paddingHorizontal: 4,
  },
  fiqhRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  fiqhChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.bgSecondary,
  },
  fiqhChipActive: { borderColor: COLORS.gold, backgroundColor: COLORS.gold + '10' },
  fiqhArabic: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 26, writingDirection: 'rtl' },
  fiqhName: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 1 },
  methodCard: {
    flexDirection: 'row', gap: 10, padding: 14,
    backgroundColor: COLORS.glass, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    marginTop: 8, alignItems: 'flex-start',
  },

  // ── Qibla ──────────────────────────────────────────────────────────────────
  qiblaPrompt: { alignItems: 'center', padding: 32, paddingTop: 40 },
  qiblaPromptTitle: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 22, marginTop: 20, marginBottom: 10 },
  qiblaPromptSub: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 280 },

  qiblaHeader: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16,
    paddingTop: 16, paddingBottom: 8, width: '100%',
  },
  qiblaHeadCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.glass, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.glassBorder, padding: 14,
  },

  // Compass
  compassWrap: {
    width: SIZE + 40,
    height: SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  compassGlow: {
    position: 'absolute',
    width: SIZE + 20,
    height: SIZE + 20,
    borderRadius: (SIZE + 20) / 2,
    backgroundColor: 'rgba(255, 255, 255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255,0.1)',
  },
  compassLayer: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
  centerCap: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    borderWidth: 2,
    borderColor: '#000',
  },
  compassInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  accuracyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  accDot: { width: 7, height: 7, borderRadius: 3.5 },
  accText: { fontSize: 11, fontWeight: '700' },

  howToCard: {
    marginHorizontal: 16, marginBottom: 12, padding: 18,
    backgroundColor: 'rgba(255, 255, 255,0.05)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255,0.15)', width: '90%',
  },
  stepNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  coordCard: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: COLORS.glass, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    width: '90%', marginBottom: 10,
  },
  calibrationCard: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 14,
    backgroundColor: 'rgba(255, 255, 255,0.06)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255,0.2)',
    width: '90%', marginBottom: 24,
  },
  locationSheet: {
    backgroundColor: COLORS.bgSecondary, borderTopLeftRadius: 28,
    borderTopRightRadius: 28, padding: 24,
    borderTopWidth: 1, borderColor: COLORS.glassBorder,
  },
});
