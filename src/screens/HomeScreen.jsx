import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Platform, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';
import { getModulePath, openModuleInApp } from '../utils/deepLinking';
import { useNavigationUrl } from '../hooks/useNavigationUrl';
import { moduleByName, accentFor, hasAccess } from '../config/routes';
import { useRole } from '../context/RoleContext';
import { usePrayerLock } from '../context/PrayerLockContext';
import { formatHijri, resolveHijriDate } from '../utils/hijri';
import { getNextPrayer, getTodayTimings } from '../utils/nextPrayer';

// The dashboard grid, drawn from the shared route table so labels, icons,
// accents and permissions cannot drift from the drawer and navigator.
// `sublabel` is the only thing that lives here — it is dashboard copy.
const SUBLABELS = {
  Quran: 'Read & Listen',
  Hadith: '6 Authentic Books',
  Prayer: 'Adhan & Tracker',
  PrayerTracker: 'Track Daily',
  Tasbih: 'Counter',
  Duas: 'Daily Supplications',
  NamesOfAllah: 'Asma ul Husna',
  Calendar: 'Islamic Dates',
  Zakat: 'Calculator',
  Reminders: 'Never Miss',
  Generator: 'Creator',
  AIChat: 'Ask Anything',
  Learning: 'Guided & Adaptive',
};

const DASHBOARD_MODULES = [
  'Quran', 'Hadith', 'Prayer', 'PrayerTracker', 'Tasbih', 'Duas',
  'NamesOfAllah', 'Calendar', 'Zakat', 'Reminders', 'Generator',
  'AIChat', 'Learning',
];

// Built per-role rather than once at module scope: the grid used to include
// every entry unconditionally, so a plain user saw the moderator-only Content
// Creator tile and tapping it did nothing (the route is never registered for
// them). The drawer and tab bar already filtered on the same rule.
const modulesForRole = role =>
  DASHBOARD_MODULES.filter(name => hasAccess(role, name)).map(name => {
    const mod = moduleByName(name);
    return {
      id: name,
      label: mod.title,
      sublabel: SUBLABELS[name] || '',
      icon: mod.icon,
      accent: accentFor(COLORS, name),
      featured: name === 'Duas',
    };
  });

const DAILY_AYAH = [
  { text: 'Indeed, with hardship comes ease.', surah: 'Ash-Sharh 94:6' },
  { text: 'And He found you lost and guided you.', surah: 'Ad-Duha 93:7' },
  { text: 'So remember Me; I will remember you.', surah: 'Al-Baqarah 2:152' },
  { text: 'Allah does not burden a soul beyond that it can bear.', surah: 'Al-Baqarah 2:286' },
  { text: 'And rely upon Allah. And sufficient is Allah as Disposer of affairs.', surah: 'Al-Ahzab 33:3' },
  { text: 'Verily, with every difficulty there is relief.', surah: 'Ash-Sharh 94:5' },
  { text: 'And your Lord says, "Call upon Me; I will respond to you."', surah: 'Ghafir 40:60' },
  { text: 'Indeed, Allah is with the patient.', surah: 'Al-Baqarah 2:153' },
];

const SALAWAT_TEXT = 'Allahumma salli ala Muhammad wa aali Muhammad';

// Islam 360's dashboard puts all five prayers in one strip rather than only
// the next one, so the whole day's schedule is visible at a glance.
const PRAYER_ICONS = {
  Fajr: 'partly-sunny-outline',
  Dhuhr: 'sunny-outline',
  Asr: 'sunny',
  Maghrib: 'moon-outline',
  Isha: 'moon',
};

export default function HomeScreen({ navigation }) {
  const role = useRole();
  const { enabled: lockEnabled, pendingPrayer, delayMin, confirmPrayed } = usePrayerLock();
  const modules = React.useMemo(() => modulesForRole(role), [role]);
  const [userName, setUserName] = useState('');
  const [ayah, setAyah] = useState(null);
  const [prayerCount, setPrayerCount] = useState(0);
  const [salawatCount, setSalawatCount] = useState(0);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [todayTimings, setTodayTimings] = useState(null);
  const [streak, setStreak] = useState(0);
  const [hijriDate, setHijriDate] = useState(null);
  const hijri = hijriDate ? formatHijri(hijriDate) : formatHijri();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { navigateTo } = useNavigationUrl();

  useEffect(() => {
    loadUserInfo();
    pickDailyAyah();
    loadPrayerCount();
    loadSalawatCount();
    loadStreak();
    resolveHijriDate().then(setHijriDate);
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  // The countdown re-reads once a minute rather than once a second: the card
  // shows whole minutes, so a per-second timer would just burn battery.
  useEffect(() => {
    let alive = true;
    const tick = () => {
      getNextPrayer().then(p => { if (alive) setNextPrayer(p); });
      getTodayTimings().then(t => { if (alive) setTodayTimings(t); });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // No placeholder identity. An unset name renders a "Add your name" prompt
  // that opens Settings, rather than calling the user "Guest".
  const loadUserInfo = async () => {
    setUserName((await AsyncStorage.getItem('qitab_user_name')) || '');
  };

  /** Consecutive days ending today with at least one prayer logged. */
  const loadStreak = async () => {
    const keyFor = d => `prayer_log_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
    let count = 0;
    for (let back = 0; back < 60; back++) {
      const d = new Date();
      d.setDate(d.getDate() - back);
      const raw = await AsyncStorage.getItem(keyFor(d));
      const logged = raw ? Object.values(JSON.parse(raw)).filter(Boolean).length : 0;
      if (logged > 0) count++;
      // Today not being logged yet must not zero a real streak, so day 0 is
      // allowed to be empty; any earlier gap ends the run.
      else if (back > 0) break;
    }
    setStreak(count);
  };

  const pickDailyAyah = () => {
    const idx = new Date().getDate() % DAILY_AYAH.length;
    setAyah(DAILY_AYAH[idx]);
  };

  const loadPrayerCount = async () => {
    const key = `prayer_log_${new Date().getFullYear()}_${new Date().getMonth()}_${new Date().getDate()}`;
    const raw = await AsyncStorage.getItem(key);
    const log = raw ? JSON.parse(raw) : {};
    setPrayerCount(Object.values(log).filter(Boolean).length);
  };

  const loadSalawatCount = async () => {
    const raw = await AsyncStorage.getItem('salawat_total');
    setSalawatCount(parseInt(raw || '0'));
  };

  const addSalawat = async () => {
    const newCount = salawatCount + 1;
    setSalawatCount(newCount);
    await AsyncStorage.setItem('salawat_total', newCount.toString());
  };

  const handleModulePress = (module) => {
    // Use URL-based navigation
    navigateTo(module.id, { fromHome: true });
  };


  const getGreeting = () => 'Assalamu Alaikum';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Animated.View style={{ opacity: fadeAnim }}>

        {/* Hero Header — solid emerald banner with location/date up top and
            the greeting below, the way Islam 360 opens its dashboard rather
            than the glass card this used to be. */}
        <View style={styles.hero}>
          <View style={styles.heroPattern} pointerEvents="none">
            <Ionicons name="moon" size={120} color="rgba(255,255,255,0.06)" style={styles.heroPatternMoon} />
          </View>
          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.locationText}>
                  {todayTimings?.city || nextPrayer?.city || 'Set location'}
                </Text>
              </View>
              <View style={styles.hijriChip}>
                <Ionicons name="moon-outline" size={11} color={COLORS.gold} />
                <Text style={styles.hijriChipText}>{hijri}</Text>
              </View>
            </View>

            <View style={styles.heroGreetingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                {userName ? (
                  <Text style={styles.userName}>{userName}</Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => navigateTo('Settings')}
                    activeOpacity={0.7}
                    style={styles.namePrompt}
                    accessibilityRole="button"
                    accessibilityLabel="Add your name"
                  >
                    <Text style={styles.namePromptText}>Add your name</Text>
                    <Ionicons name="arrow-forward" size={13} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigateTo('PrayerTracker')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${prayerCount} of 5 prayers logged today`}
            >
              <Ionicons name="checkmark-done" size={16} color="#fff" />
              <Text style={styles.statNum}>{prayerCount}/5</Text>
              <Text style={styles.statLabel}>Today</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flame" size={16} color={COLORS.gold} />
              <Text style={styles.statNum}>{streak}</Text>
              <Text style={styles.statLabel}>Day streak</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={addSalawat} activeOpacity={0.7}>
              <Ionicons name="heart" size={16} color="#fff" />
              <Text style={styles.statNum}>{salawatCount}</Text>
              <Text style={styles.statLabel}>Salawat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Prayer strip — all five prayers at once with the next one picked
            out, the signature Islam 360 dashboard element. Only the next-
            prayer countdown card below it exists without cached timings. */}
        {todayTimings && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.prayerStrip}
            contentContainerStyle={styles.prayerStripContent}
          >
            {todayTimings.prayers.map(p => (
              <View
                key={p.name}
                style={[styles.prayerPill, p.isNext && styles.prayerPillActive]}
              >
                <Ionicons
                  name={PRAYER_ICONS[p.name] || 'time-outline'}
                  size={16}
                  color={p.isNext ? '#fff' : COLORS.primaryTint}
                />
                <Text style={[styles.prayerPillName, p.isNext && styles.prayerPillNameActive]}>
                  {p.name}
                </Text>
                <Text style={[styles.prayerPillTime, p.isNext && styles.prayerPillTimeActive]}>
                  {p.time}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* The reminder that precedes the lock. It states the deadline rather
            than appearing without warning when the app locks. */}
        {lockEnabled && pendingPrayer ? (
          <View style={styles.lockNotice}>
            <View style={styles.lockNoticeIcon}>
              <Ionicons name="notifications" size={17} color={COLORS.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lockNoticeTitle}>
                It is time for {pendingPrayer}
              </Text>
              <Text style={styles.lockNoticeBody}>
                The app will pause {delayMin} minutes after the adhan until you
                confirm you have prayed.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => confirmPrayed(pendingPrayer)}
              style={styles.lockNoticeBtn}
              accessibilityRole="button"
              accessibilityLabel={`Mark ${pendingPrayer} as prayed`}
            >
              <Ionicons name="checkmark" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Next prayer. Reads the timings the prayer screen cached, so this
            adds no second call to the prayer API and can never disagree with
            it. With nothing cached it invites the user to set a location
            rather than showing a plausible-looking wrong time. */}
        <TouchableOpacity
          style={styles.prayerCard}
          activeOpacity={0.85}
          onPress={() => navigateTo('Prayer')}
          accessibilityRole="button"
          accessibilityLabel={nextPrayer
            ? `Next prayer ${nextPrayer.name} at ${nextPrayer.time}, in ${nextPrayer.countdown}`
            : 'Set your prayer location'}
        >
          <View style={[styles.prayerIcon, {
            backgroundColor: COLORS.primary + '1F', borderColor: COLORS.primary + '38',
          }]}>
            <Ionicons name="time" size={22} color={COLORS.primaryTint} />
          </View>
          <View style={{ flex: 1 }}>
            {nextPrayer ? (
              <>
                <Text style={styles.prayerLabel}>
                  Next prayer{nextPrayer.tomorrow ? ' · tomorrow' : ''}
                </Text>
                <Text style={styles.prayerName}>
                  {nextPrayer.name}{' '}
                  <Text style={[styles.prayerTime, { color: COLORS.primaryTint }]}>{nextPrayer.time}</Text>
                </Text>
                <Text style={styles.prayerMeta}>{nextPrayer.city}</Text>
              </>
            ) : (
              <>
                <Text style={styles.prayerLabel}>Prayer times</Text>
                <Text style={styles.prayerName}>Set your location</Text>
                <Text style={styles.prayerMeta}>Tap to choose your city</Text>
              </>
            )}
          </View>
          {nextPrayer && (
            <View style={[styles.countdownPill, {
              backgroundColor: COLORS.primary + '14', borderColor: COLORS.primary + '30',
            }]}>
              <Text style={[styles.countdownNum, { color: COLORS.primaryTint }]}>{nextPrayer.countdown}</Text>
              <Text style={styles.countdownLabel}>to go</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Daily Ayah */}
        {ayah && (
          <TouchableOpacity style={styles.ayahCard} activeOpacity={0.8}>
            <View style={styles.ayahGlow} />
            <View style={styles.ayahIcon}>
              <Ionicons name="book-outline" size={20} color={COLORS.gold} />
            </View>
            <Text style={styles.ayahText}>"{ayah.text}"</Text>
            <Text style={styles.ayahRef}>— {ayah.surah}</Text>
          </TouchableOpacity>
        )}

        {/* Salawat Banner */}
        <TouchableOpacity style={styles.salawatBanner} onPress={addSalawat} activeOpacity={0.7}>
          <Text style={styles.salawatBannerText}>{SALAWAT_TEXT}</Text>
          <View style={styles.salawatCounter}>
            <Text style={styles.salawatCounterNum}>{salawatCount}</Text>
          </View>
        </TouchableOpacity>

        {/* Modules Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore</Text>
        </View>
        <View style={styles.grid}>
          {modules.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={styles.moduleCard}
              activeOpacity={0.75}
              onPress={() => handleModulePress(mod)}
              accessibilityRole="button"
              accessibilityLabel={`${mod.label}. ${mod.sublabel}`}
            >
              {/* The icon plate carries the module's accent at low opacity,
                  with the glyph at full strength. Every tile used to be the
                  same white-on-grey, which gave the grid no scanability. */}
              <View
                style={[
                  styles.moduleIconWrap,
                  { backgroundColor: mod.accent + '1F', borderColor: mod.accent + '38' },
                  mod.featured && styles.moduleIconFeatured,
                  mod.featured && { borderColor: mod.accent + '80', shadowColor: mod.accent },
                ]}
              >
                {/* Duas is the module people open most and had no visual
                    priority in a flat grid of identical plates. It gets a
                    filled glyph, a halo and a pair of small ornaments so the
                    eye lands on it without a second row of chrome. */}
                {mod.featured && (
                  <View style={[styles.moduleHalo, { backgroundColor: mod.accent }]} />
                )}
                <Ionicons
                  name={mod.featured ? 'heart' : mod.icon}
                  size={mod.featured ? 26 : 23}
                  color={mod.accent}
                />
                {mod.featured && (
                  <>
                    <Ionicons
                      name="sparkles" size={10} color={mod.accent}
                      style={styles.moduleSparkTop}
                    />
                    <Ionicons
                      name="sparkles" size={7} color={mod.accent}
                      style={styles.moduleSparkBottom}
                    />
                  </>
                )}
              </View>
              <Text
                style={[styles.moduleLabel, mod.featured && { color: mod.accent }]}
                numberOfLines={2}
              >
                {mod.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 20 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  // Solid emerald banner, not a glass card — this is the Islam 360 signature:
  // location + Hijri date pinned to the top, greeting below, stats along the
  // bottom edge, all on one brand-coloured surface.
  hero: {
    margin: 16, marginBottom: 12, borderRadius: 24, overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },
  heroPattern: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  heroPatternMoon: { position: 'absolute', top: -30, right: -30 },
  heroContent: { padding: 20, paddingBottom: 18 },
  heroTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 10,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },
  greeting: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600' },
  hijriChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.18)', borderColor: COLORS.gold + '55',
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4,
  },
  hijriChipText: { color: COLORS.gold, fontSize: 10.5, fontWeight: '700' },
  heroGreetingRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 14 },
  userName: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 2 },
  namePrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6,
    alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 5,
    paddingHorizontal: 12, borderWidth: 1, borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  namePromptText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6 },

  lockNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 14, padding: 14, borderRadius: 16,
    backgroundColor: COLORS.amber + '12',
    borderWidth: 1, borderColor: COLORS.amber + '38',
  },
  lockNoticeIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.amber + '1F',
  },
  lockNoticeTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  lockNoticeBody: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17, marginTop: 2 },
  lockNoticeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.amber,
  },
  prayerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 20,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  prayerIcon: {
    width: 46, height: 46, borderRadius: 15, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  prayerLabel: {
    color: COLORS.textSecondary, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  prayerName: { color: COLORS.textPrimary, fontSize: 19, fontWeight: '800', marginTop: 3 },
  prayerTime: { color: COLORS.cyan, fontSize: 16, fontWeight: '700' },
  prayerMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  countdownPill: {
    alignItems: 'center', borderRadius: 14, paddingVertical: 8,
    paddingHorizontal: 12, backgroundColor: COLORS.cyan + '14',
    borderWidth: 1, borderColor: COLORS.cyan + '30',
  },
  countdownNum: { color: COLORS.cyan, fontSize: 15, fontWeight: '900' },
  countdownLabel: { color: COLORS.textSecondary, fontSize: 9.5, marginTop: 1 },
  quickStats: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 14, paddingHorizontal: 8,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { color: '#fff', fontSize: 16, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.14)' },
  prayerStrip: { marginBottom: 14 },
  prayerStripContent: { paddingHorizontal: 16, gap: 10 },
  prayerPill: {
    alignItems: 'center', justifyContent: 'center', gap: 3,
    width: 74, paddingVertical: 12, borderRadius: 16,
    backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  prayerPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  prayerPillName: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  prayerPillNameActive: { color: 'rgba(255,255,255,0.85)' },
  prayerPillTime: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '800' },
  prayerPillTimeActive: { color: '#fff' },
  ayahCard: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 20,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  ayahGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255,0.04)' },
  ayahIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  ayahText: {
    color: COLORS.textPrimary, fontSize: 16, fontWeight: '600',
    fontStyle: 'italic', lineHeight: 24,
  },
  ayahRef: { color: COLORS.gold, fontSize: 12, fontWeight: '700', marginTop: 8 },
  salawatBanner: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 14,
    backgroundColor: 'rgba(255, 255, 255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255,0.25)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  salawatBannerText: { color: COLORS.pink, fontSize: 13, fontWeight: '600', flex: 1, marginRight: 10 },
  salawatCounter: {
    backgroundColor: 'rgba(255, 255, 255,0.2)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255,0.4)',
  },
  salawatCounterNum: { color: COLORS.pink, fontSize: 16, fontWeight: '900' },
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { color: COLORS.gold, fontSize: 18, fontWeight: '900' },
  // Four per row of circular plates — Islam 360's grid, rather than the
  // three-per-row rounded squares this used to be.
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, gap: 0,
  },
  moduleCard: {
    width: '25%', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4,
  },
  moduleIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  moduleIconFeatured: {
    borderWidth: 1.5,
    shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  moduleHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28, opacity: 0.13,
  },
  moduleSparkTop: { position: 'absolute', top: 5, right: 6, opacity: 0.95 },
  moduleSparkBottom: { position: 'absolute', bottom: 6, left: 7, opacity: 0.6 },
  moduleLabel: {
    color: COLORS.textPrimary, fontSize: 11, fontWeight: '700',
    lineHeight: 14, marginTop: 8, textAlign: 'center', letterSpacing: 0.1,
  },
});
