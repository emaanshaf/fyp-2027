import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useThemedStyles } from '../theme';
import { useNavigationUrl } from '../hooks/useNavigationUrl';
import { moduleByName, accentFor, hasAccess } from '../config/routes';
import { useRole } from '../context/RoleContext';
import { usePrayerLock } from '../context/PrayerLockContext';
import { useLanguage } from '../context/LanguageContext';
import { useShare } from '../context/ShareContext';
import { formatHijri, resolveHijriDate } from '../utils/hijri';
import { getNextPrayer, getTodayTimings } from '../utils/nextPrayer';
import SkyBackdrop from '../components/SkyBackdrop';
import PrayerCountdownRing from '../components/PrayerCountdownRing';
import HomeWeather from '../components/HomeWeather';
import TodaysRemindersStrip from '../components/TodaysRemindersStrip';
import { skyState } from '../utils/sky';
import { APP_CONFIG } from '../config/appConfig';

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
  Pillars: 'Five Foundations',
  Hajj: 'Step by Step',
  Istikhara: 'Seek Guidance',
  ELearning: 'Structured Courses',
  Communities: 'Learn Together',
  News: 'Muslim World',
};

const DASHBOARD_MODULES = [
  'Quran', 'Hadith', 'Prayer', 'PrayerTracker', 'Tasbih', 'Duas',
  'NamesOfAllah', 'Calendar', 'Zakat', 'Reminders', 'Pillars', 'Hajj',
  'Istikhara', 'ELearning', 'Communities', 'News', 'AIChat', 'Learning', 'Generator',
];

// Built per-role rather than once at module scope: the grid used to include
// every entry unconditionally, so a plain user saw the moderator-only Content
// Creator tile and tapping it did nothing (the route is never registered for
// them). The drawer and tab bar already filtered on the same rule.
const modulesForRole = (role, COLORS) =>
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
  { text: 'Do not lose hope, nor be sad. You will surely be victorious if you are true believers.', surah: 'Al-Imran 3:139' },
  { text: 'And whoever puts their trust in Allah, then He will suffice him.', surah: 'At-Talaq 65:3' },
  { text: 'He is with you wherever you are.', surah: 'Al-Hadid 57:4' },
  { text: 'My mercy encompasses all things.', surah: "Al-A'raf 7:156" },
  { text: 'So flee to Allah. Indeed, I am to you from Him a clear warner.', surah: 'Adh-Dhariyat 51:50' },
  { text: 'And We have certainly made the Quran easy for remembrance, so is there any who will remember?', surah: 'Al-Qamar 54:17' },
  { text: 'Indeed, the most noble of you in the sight of Allah is the most righteous of you.', surah: 'Al-Hujurat 49:13' },
  { text: 'And speak to people good words.', surah: 'Al-Baqarah 2:83' },
  { text: 'Allah does not change the condition of a people until they change what is in themselves.', surah: "Ar-Ra'd 13:11" },
  { text: 'And He found you poor and made you self-sufficient.', surah: 'Ad-Duha 93:8' },
  { text: 'And be patient. Indeed, Allah does not allow to be lost the reward of those who do good.', surah: 'Hud 11:115' },
  { text: 'And your Lord is going to give you, and you will be satisfied.', surah: 'Ad-Duha 93:5' },
  { text: 'He who created death and life to test you as to which of you is best in deed.', surah: 'Al-Mulk 67:2' },
  { text: 'So which of the favors of your Lord would you deny?', surah: 'Ar-Rahman 55:13' },
  { text: 'Indeed, to Allah we belong, and indeed to Him we will return.', surah: 'Al-Baqarah 2:156' },
  { text: 'And if Allah should touch you with adversity, there is no remover of it except Him.', surah: "Al-An'am 6:17" },
  { text: 'Say, "O My servants who have transgressed against themselves, do not despair of the mercy of Allah."', surah: 'Az-Zumar 39:53' },
  { text: 'And whoever is grateful — his gratitude is only for the benefit of himself.', surah: 'Luqman 31:12' },
  { text: 'And it may be that you dislike a thing which is good for you.', surah: 'Al-Baqarah 2:216' },
  { text: 'Verily, the promise of Allah is truth.', surah: 'Luqman 31:33' },
  { text: 'And whoever fears Allah — He will make for him a way out.', surah: 'At-Talaq 65:2' },
  { text: 'Allah is sufficient for us, and He is the best Disposer of affairs.', surah: 'Al-Imran 3:173' },
  { text: 'This is the Book about which there is no doubt, a guidance for those conscious of Allah.', surah: 'Al-Baqarah 2:2' },
  { text: 'And whoever holds firmly to Allah has indeed been guided to a straight path.', surah: 'Al-Imran 3:101' },
  { text: 'Indeed, He is to His servants Aware and Seeing.', surah: 'Al-Isra 17:30' },
  { text: 'And we will surely test you with something of fear and hunger and a loss of wealth and lives, but give good tidings to the patient.', surah: 'Al-Baqarah 2:155' },
  { text: 'Indeed, prayer prohibits immorality and wrongdoing, and the remembrance of Allah is greater.', surah: 'Al-Ankabut 29:45' },
  { text: 'And your Lord is forgiving, full of mercy.', surah: 'Al-Kahf 18:58' },
  { text: 'And hasten to forgiveness from your Lord and a garden as wide as the heavens and earth, prepared for the righteous.', surah: 'Al-Imran 3:133' },
  { text: 'Indeed, it is not the eyes that are blind, but blind are the hearts which are within the chests.', surah: 'Al-Hajj 22:46' },
  { text: 'And He is the Forgiving, the Loving.', surah: 'Al-Buruj 85:14' },
  { text: 'And it is not for a soul to die except by permission of Allah at a decree determined.', surah: 'Al-Imran 3:145' },
  { text: 'And He gave you of all you asked of Him. And if you should count the favor of Allah, you could not enumerate them.', surah: 'Ibrahim 14:34' },
  { text: 'Unquestionably, to Allah belongs whatever is in the heavens and the earth.', surah: 'Yunus 10:55' },
  { text: 'And whoever is guided is only guided for his own soul.', surah: 'Al-Isra 17:15' },
  { text: 'And He is with you wherever you are. And Allah, of what you do, is Seeing.', surah: 'Al-Hadid 57:4' },
  { text: 'And We created you in pairs.', surah: 'An-Naba 78:8' },
  { text: 'So, verily, with every difficulty, there is relief.', surah: 'Ash-Sharh 94:5' },
  { text: 'Our Lord, give us good in this world and good in the Hereafter, and save us from the torment of the Fire.', surah: 'Al-Baqarah 2:201' },
  { text: 'And Allah is the best of planners.', surah: 'Al-Imran 3:54' },
  { text: 'Indeed, the mercy of Allah is near to the doers of good.', surah: "Al-A'raf 7:56" },
  { text: 'Whoever does righteous deeds — it is for his own soul, and whoever does evil — it is against it.', surah: 'Fussilat 41:46' },
  { text: 'And We have not sent you except as a mercy to the worlds.', surah: 'Al-Anbiya 21:107' },
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
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const styles = useThemedStyles(makeStyles);

  const role = useRole();
  const { enabled: lockEnabled, pendingPrayer, delayMin, confirmPrayed } = usePrayerLock();
  const { t, isUrdu, moduleTitle } = useLanguage();
  const { share } = useShare();
  const modules = React.useMemo(
    () => modulesForRole(role, COLORS),
    [role, COLORS]
  );
  const [userName, setUserName] = useState('');
  const [ayah, setAyah] = useState(null);
  const [prayerCount, setPrayerCount] = useState(0);
  const [salawatCount, setSalawatCount] = useState(0);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [todayTimings, setTodayTimings] = useState(null);
  const [streak, setStreak] = useState(0);
  const [hijriDate, setHijriDate] = useState(null);
  const hijri = hijriDate ? formatHijri(hijriDate) : formatHijri();
  // Recomputed on each render; the one-minute prayer tick re-renders the
  // screen, so the chip follows sunrise and Maghrib without its own timer.
  const sky = skyState({ prayers: todayTimings?.prayers });
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

  // Called when the ring reaches zero, so the card switches to the next
  // prayer immediately instead of waiting for the minute tick.
  const refreshPrayerTimings = () => {
    getNextPrayer().then(p => { if (p) setNextPrayer(p); }).catch(() => {});
    getTodayTimings().then(t => { if (t) setTodayTimings(t); }).catch(() => {});
  };

  // The countdown re-reads once a minute rather than once a second: the card
  // shows the next prayer, while the ring ticks locally against `at`. This
  // keeps storage work off the second-by-second path.
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
    // Cycle by day-of-year so each ayah shows for a full day and repeats only every 50 days
    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = new Date() - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const idx = dayOfYear % DAILY_AYAH.length;
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

  const shareDailyAyah = () => {
    if (!ayah) return;
    const reference = String(ayah.surah).match(/(\d+):(\d+(?:-\d+)?)/)?.[0];
    share({
      title: t('home.ayahOfDay', 'Ayah of the Day'),
      message: `"${ayah.text}"\n— ${ayah.surah}`,
      url: reference ? APP_CONFIG.shareVerse(reference) : APP_CONFIG.appUrl,
    });
  };

  const getGreeting = () => t('home.greeting');

  // Urdu runs right-to-left. Applying this only to the Urdu strings keeps the
  // numeric stat row aligned; Nastaliq supplies its own tall line metrics.
  const urduText = isUrdu ? {
    fontFamily: 'NotoNastaliqUrdu',
    writingDirection: 'rtl',
  } : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Animated.View style={{ opacity: fadeAnim }}>

        {/* Hero Header — solid emerald banner with location/date up top and
            the greeting below, the way Islam 360 opens its dashboard rather
            than the glass card this used to be. */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryPressed || COLORS.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Sun or moon for the current hour, drawn behind the name and
              Hijri chip. Uses cached prayer times for its windows and falls
              back to the clock before they load. */}
          <SkyBackdrop
            now={new Date()}
            prayers={todayTimings?.prayers}
            hijriDay={hijriDate?.day}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.locationText}>
                  {todayTimings?.city || nextPrayer?.city || 'Set location'}
                </Text>
              </View>
              <View style={styles.heroRight}>
                <TouchableOpacity
                  onPress={() => navigateTo('Search')}
                  style={styles.heroSearchBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.search')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="search" size={15} color="#fff" />
                </TouchableOpacity>
                <View style={styles.hijriChip}>
                  <Ionicons
                    name={sky.body === 'sun' ? 'sunny' : 'moon'}
                    size={11}
                    color={COLORS.gold}
                  />
                  <Text style={[styles.hijriChipText, urduText]}>{hijri}</Text>
                </View>
              </View>
            </View>

            <View style={styles.heroGreetingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.greeting, urduText]}>{getGreeting()}</Text>
                {userName ? (
                  <Text style={[styles.userName, urduText]}>{userName}</Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => navigateTo('Settings')}
                    activeOpacity={0.7}
                    style={styles.namePrompt}
                    accessibilityRole="button"
                    accessibilityLabel={t('home.addName')}
                  >
                    <Text style={[styles.namePromptText, urduText]}>{t('home.addName')}</Text>
                    <Ionicons name="arrow-forward" size={13} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Current conditions for the city the prayer screen saved, the
                way Islam 360 places weather beside the Hijri date. Hidden
                until a city exists or the first request succeeds. */}
            <HomeWeather city={todayTimings?.city || nextPrayer?.city} />
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
              <Text style={styles.statLabel}>{t('home.today')}</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flame" size={16} color={COLORS.gold} />
              <Text style={styles.statNum}>{streak}</Text>
              <Text style={styles.statLabel}>{t('home.streak')}</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={addSalawat} activeOpacity={0.7}>
              <Ionicons name="heart" size={16} color="#fff" />
              <Text style={styles.statNum}>{salawatCount}</Text>
              <Text style={styles.statLabel}>{t('home.salawat')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

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

        {/* Reminder status, always on the dashboard. The five-minute popup can
            only speak once a reminder is due, so without this card an empty
            reminder list looked like a broken feature. */}
        <TodaysRemindersStrip onOpen={() => navigateTo('Reminders')} />

        {/* The reminder that precedes the lock. It states the deadline rather
            than appearing without warning when the app locks. */}
        {lockEnabled && pendingPrayer ? (
          <View style={styles.lockNotice}>
            <View style={styles.lockNoticeIcon}>
              <Ionicons name="notifications" size={17} color={COLORS.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lockNoticeTitle}>
                {t('home.timeFor')} {pendingPrayer}
              </Text>
              <Text style={styles.lockNoticeBody}>
                {isUrdu
                  ? `اذان کے بعد ${delayMin} منٹ تک ایپ روکی جائے گی جب تک آپ نماز کی تصدیق نہ کریں۔`
                  : `The app will pause ${delayMin} minutes ${t('home.lockBody')}.`}
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
            ? `${t('home.nextPrayer')} ${nextPrayer.name} ${nextPrayer.time}, ${nextPrayer.countdown}`
            : t('home.setLocation')}
        >
          <View style={[styles.prayerIcon, {
            backgroundColor: COLORS.primary + '1F', borderColor: COLORS.primary + '38',
          }]}>
            <Ionicons name="time" size={22} color={COLORS.primaryTint} />
          </View>
          <View style={{ flex: 1 }}>
            {nextPrayer ? (
              <>
                <Text style={[styles.prayerLabel, urduText]}>
                  {t('home.nextPrayer')}{nextPrayer.tomorrow ? ` · ${t('home.tomorrow')}` : ''}
                </Text>
                <Text style={styles.prayerName}>
                  {nextPrayer.name}{' '}
                  <Text style={[styles.prayerTime, { color: COLORS.primaryTint }]}>{nextPrayer.time}</Text>
                </Text>
                <Text style={[styles.prayerMeta, urduText]}>{nextPrayer.city}</Text>
              </>
            ) : (
              <>
                <Text style={[styles.prayerLabel, urduText]}>{t('home.prayerTimes')}</Text>
                <Text style={[styles.prayerName, urduText]}>{t('home.setLocation')}</Text>
                <Text style={[styles.prayerMeta, urduText]}>{t('home.tapChooseCity')}</Text>
              </>
            )}
          </View>
          {nextPrayer && (
            <PrayerCountdownRing
              target={nextPrayer.at}
              windowMinutes={nextPrayer.windowMinutes}
              color={COLORS.primaryTint}
              trackColor={COLORS.primary + '26'}
              textColor={COLORS.textPrimary}
              label={t('home.toGo')}
              doneLabel={isUrdu ? 'اب' : 'Now'}
              onComplete={refreshPrayerTimings}
            />
          )}
        </TouchableOpacity>

        {/* Daily Ayah. Tapping the card opens the full reflection; the share
            icon opens the same WhatsApp/Instagram sheet used by every module. */}
        {ayah && (
          <View style={styles.ayahCard}>
            <View style={styles.ayahGlow} />
            <View style={styles.ayahTopRow}>
              <View style={styles.ayahIcon}>
                <Ionicons name="book-outline" size={20} color={COLORS.gold} />
              </View>
              <TouchableOpacity
                onPress={shareDailyAyah}
                style={[styles.ayahShareBtn, { backgroundColor: COLORS.gold + '18', borderColor: COLORS.gold + '3A' }]}
                accessibilityRole="button"
                accessibilityLabel={t('common.share')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-social-outline" size={16} color={COLORS.gold} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('AyahOfDay')}
              accessibilityRole="button"
              accessibilityLabel={t('home.ayahOfDay', 'Ayah of the Day')}
            >
              <Text style={styles.ayahText}>"{ayah.text}"</Text>
              <Text style={styles.ayahRef}>— {ayah.surah}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* A direct invitation to the assistant. The tile in the grid is easy
            to miss; this makes "ask anything" a first-class action. */}
        <TouchableOpacity
          style={styles.aiCta}
          activeOpacity={0.85}
          onPress={() => navigateTo('AIChat')}
          accessibilityRole="button"
          accessibilityLabel={t('home.askAi', 'Ask the Islamic AI Assistant')}
        >
          <LinearGradient
            colors={[COLORS.cyan + '26', COLORS.primary + '1F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.aiCtaIcon, { backgroundColor: COLORS.cyan + '22', borderColor: COLORS.cyan + '45' }]}>
            <Ionicons name="sparkles" size={20} color={COLORS.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiCtaTitle}>{t('home.askAi', 'Ask the Islamic AI Assistant')}</Text>
            <Text style={styles.aiCtaBody}>
              {t('home.askAiBody', 'Any question about Islam — Quran, fiqh, worship or daily life.')}
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={26} color={COLORS.cyan} />
        </TouchableOpacity>

        {/* Salawat Banner */}
        <TouchableOpacity style={styles.salawatBanner} onPress={addSalawat} activeOpacity={0.7}>
          <Text style={styles.salawatBannerText}>{SALAWAT_TEXT}</Text>
          <View style={styles.salawatCounter}>
            <Text style={styles.salawatCounterNum}>{salawatCount}</Text>
          </View>
        </TouchableOpacity>

        {/* Modules Grid */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleBar} />
            <Text style={styles.sectionTitle}>{t('home.explore')}</Text>
          </View>
        </View>
        <View style={styles.grid}>
          {modules.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={styles.moduleCard}
              activeOpacity={0.72}
              onPress={() => handleModulePress(mod)}
              accessibilityRole="button"
              accessibilityLabel={`${moduleTitle(mod.id, mod.label)}. ${mod.sublabel}`}
            >
              <View
                style={[
                  styles.moduleIconWrap,
                  { backgroundColor: mod.accent + '1F', borderColor: mod.accent + '38' },
                  mod.featured && styles.moduleIconFeatured,
                  mod.featured && { borderColor: mod.accent + '80', shadowColor: mod.accent },
                ]}
              >
                {mod.featured && (
                  <View style={[styles.moduleHalo, { backgroundColor: mod.accent }]} />
                )}
                <Ionicons
                  name={mod.featured ? 'heart' : mod.icon}
                  size={mod.featured ? 26 : 22}
                  color={mod.accent}
                />
                {mod.featured && (
                  <>
                    <Ionicons name="sparkles" size={10} color={mod.accent} style={styles.moduleSparkTop} />
                    <Ionicons name="sparkles" size={7}  color={mod.accent} style={styles.moduleSparkBottom} />
                  </>
                )}
              </View>
              <Text style={[styles.moduleLabel, mod.featured && { color: mod.accent }]} numberOfLines={1}>
                {moduleTitle(mod.id, mod.label)}
              </Text>
              {mod.sublabel ? (
                <Text style={styles.moduleSublabel} numberOfLines={1}>{mod.sublabel}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 20 }} />
      </Animated.View>
    </ScrollView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  // Solid emerald banner, not a glass card — this is the Islam 360 signature:
  // location + Hijri date pinned to the top, greeting below, stats along the
  // bottom edge, all on one brand-coloured surface.
  hero: {
    margin: 16, marginBottom: 12, borderRadius: 24, overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },
  heroContent: { padding: 20, paddingBottom: 18 },
  heroTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 10,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },
  heroRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroSearchBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
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
  ayahTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  ayahShareBtn: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  ayahGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255,0.04)' },
  ayahIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  ayahText: {
    color: COLORS.textPrimary, fontSize: 16, fontWeight: '600',
    fontStyle: 'italic', lineHeight: 24,
  },
  ayahRef: { color: COLORS.gold, fontSize: 12, fontWeight: '700', marginTop: 8 },
  aiCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 14, padding: 16, borderRadius: 18,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1, borderColor: COLORS.cyan + '30',
    overflow: 'hidden',
  },
  aiCtaIcon: {
    width: 44, height: 44, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  aiCtaTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  aiCtaBody: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 2 },
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
  sectionHeader: { paddingHorizontal: 16, marginBottom: 14, marginTop: 4 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitleBar: { width: 3, height: 18, backgroundColor: COLORS.gold, borderRadius: 2 },
  sectionTitle: { color: COLORS.gold, fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6, gap: 0,
  },
  moduleCard: {
    width: '25%', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4,
  },
  moduleIconWrap: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  moduleIconFeatured: {
    borderWidth: 1.5,
    shadowOpacity: 0.55, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  moduleHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 29, opacity: 0.13,
  },
  moduleSparkTop: { position: 'absolute', top: 5, right: 6, opacity: 0.95 },
  moduleSparkBottom: { position: 'absolute', bottom: 6, left: 7, opacity: 0.6 },
  moduleLabel: {
    color: COLORS.textPrimary, fontSize: 11, fontWeight: '700',
    lineHeight: 14, marginTop: 8, textAlign: 'center', letterSpacing: 0.1,
  },
  moduleSublabel: {
    color: COLORS.textSecondary, fontSize: 9.5, fontWeight: '600',
    marginTop: 2, textAlign: 'center', letterSpacing: 0.1, opacity: 0.75,
  },
});
