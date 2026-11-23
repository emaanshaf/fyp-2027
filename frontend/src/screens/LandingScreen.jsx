// LandingScreen — the first thing a user sees, before the app.
// Redesigned with a premium dark-emerald aesthetic: animated star-geometry
// hero, glassmorphism cards, staggered entrance animation, and a polished
// "Enter" CTA. Everything else (data rules, offline fallback, first-run flag)
// is preserved from the original.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Easing,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Pattern, Path, Rect, G, Circle, Line } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getHijriDate, resolveHijriDate, HIJRI_MONTHS, formatHijriArabic,
} from '../utils/hijri';
import { getNextPrayer } from '../utils/nextPrayer';
import { monthInfo } from '../data/hijriMonths';
import {
  verseKeyOfDay, hadithOfDay, reflectionOfDay, focusOfDay, dayIndex,
} from '../data/daily';
import { ASMA_UL_HUSNA } from '../data/names';
import { quranService } from '../services/quranApi';
import { useShare } from '../context/ShareContext';
import APP_CONFIG from '../config/appConfig';

export const LANDING_SEEN_KEY = 'qitab_landing_seen';

// ── Palette ─────────────────────────────────────────────────────────────────
// Deep emerald night theme — rich, luxurious, calm.
const C = {
  // Backgrounds
  bg:          '#0A1A14',
  bgCard:      '#0F2318',
  bgCardAlt:   '#132A1E',
  bgGlass:     'rgba(255,255,255,0.04)',
  // Borders
  border:      'rgba(255,255,255,0.08)',
  borderGold:  'rgba(191,155,75,0.35)',
  // Text
  white:       '#FFFFFF',
  offWhite:    'rgba(255,255,255,0.87)',
  muted:       'rgba(255,255,255,0.45)',
  // Accent
  emerald:     '#1B5E40',
  emeraldBright:'#2ECC71',
  emeraldSoft: '#1A4A30',
  gold:        '#BF9B4B',
  goldBright:  '#D4AF6A',
  goldGlow:    'rgba(191,155,75,0.18)',
  amber:       '#E8A020',
  // Semantic
  red:         '#E05252',
};

const strip = html => String(html || '').replace(/<[^>]*>/g, '').trim();

// ── Geometric SVG background ───────────────────────────────────────────────
function GeometricBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {/* 8-pointed Islamic star lattice */}
          <Pattern id="star" width="80" height="80" patternUnits="userSpaceOnUse">
            <G stroke={C.emeraldBright} strokeWidth="0.6" fill="none" opacity="0.18">
              {/* Outer diamond */}
              <Path d="M40 5 L75 40 L40 75 L5 40 Z" />
              {/* Inner square rotated */}
              <Path d="M15 15 L65 15 L65 65 L15 65 Z" />
              {/* Cross lines */}
              <Line x1="40" y1="5" x2="40" y2="75" opacity="0.5" />
              <Line x1="5" y1="40" x2="75" y2="40" opacity="0.5" />
              {/* Diagonal lines */}
              <Line x1="15" y1="15" x2="65" y2="65" opacity="0.3" />
              <Line x1="65" y1="15" x2="15" y2="65" opacity="0.3" />
              {/* Center circle */}
              <Circle cx="40" cy="40" r="8" opacity="0.4" />
              <Circle cx="40" cy="40" r="3" opacity="0.6" />
            </G>
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={C.bg} />
        <Rect width="100%" height="100%" fill="url(#star)" />
        {/* Radial glow top-center */}
        <Rect width="100%" height="100%"
          fill="url(#star)"
          opacity="0"
        />
      </Svg>
    </View>
  );
}

// ── Animated hero arc (top decorative element) ─────────────────────────────
function HeroArc() {
  return (
    <View style={s.heroArcWrap} pointerEvents="none">
      <Svg width="100%" height="320" viewBox="0 0 400 320">
        {/* Deep glow disc */}
        <Circle cx="200" cy="0" r="220" fill={C.emerald} opacity="0.18" />
        <Circle cx="200" cy="0" r="160" fill={C.emerald} opacity="0.14" />
        <Circle cx="200" cy="0" r="100" fill={C.emerald} opacity="0.12" />
        {/* Gold star ring */}
        <G stroke={C.gold} strokeWidth="0.8" fill="none" opacity="0.5">
          <Circle cx="200" cy="0" r="130" strokeDasharray="4 8" />
          <Circle cx="200" cy="0" r="170" strokeDasharray="2 12" opacity="0.3" />
        </G>
        {/* Decorative arc connectors */}
        <Path d="M80 0 Q200 180 320 0" stroke={C.goldBright} strokeWidth="0.6" fill="none" opacity="0.4" />
        <Path d="M50 0 Q200 220 350 0" stroke={C.gold} strokeWidth="0.4" fill="none" opacity="0.25" />
      </Svg>
    </View>
  );
}

// ── Small reusable components ──────────────────────────────────────────────
function GoldRule() {
  return <View style={s.goldRule} />;
}

function SectionHeading({ label, title }) {
  return (
    <View style={s.headingWrap}>
      <GoldRule />
      <Text style={s.headingLabel}>{label}</Text>
      {title ? <Text style={s.headingTitle}>{title}</Text> : null}
    </View>
  );
}

function GlassCard({ children, style, accent }) {
  return (
    <View style={[s.card, accent && { borderColor: C.borderGold }, style]}>
      {children}
    </View>
  );
}

function ActionBtn({ icon, label, onPress, gold }) {
  return (
    <TouchableOpacity
      style={[s.actionBtn, gold && s.actionBtnGold]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={14} color={gold ? C.bg : C.gold} />
      <Text style={[s.actionBtnText, gold && { color: C.bg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function LandingScreen({ onDone }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const { share } = useShare();

  const [name, setName] = useState('');
  const [verse, setVerse] = useState(null);
  const [verseState, setVerseState] = useState('loading');
  const [nextPrayer, setNextPrayer] = useState(null);
  const [saved, setSaved] = useState(false);

  // Staggered entrance animations
  const heroFade  = useRef(new Animated.Value(0)).current;
  const heroRise  = useRef(new Animated.Value(30)).current;
  const cardFade  = useRef(new Animated.Value(0)).current;
  const cardRise  = useRef(new Animated.Value(20)).current;
  const ctaScale  = useRef(new Animated.Value(0.94)).current;
  // Subtle pulsing glow on the enter button
  const glowPulse = useRef(new Animated.Value(0.7)).current;

  const today = React.useMemo(() => new Date(), []);
  const [hijri, setHijri] = useState(() => getHijriDate(today));
  const month      = React.useMemo(() => monthInfo(hijri.month), [hijri.month]);
  const hadith     = React.useMemo(() => hadithOfDay(today), [today]);
  const reflection = React.useMemo(() => reflectionOfDay(today), [today]);
  const focus      = React.useMemo(() => focusOfDay(today), [today]);
  const divineName = React.useMemo(
    () => ASMA_UL_HUSNA[dayIndex(ASMA_UL_HUSNA.length, today)], [today]
  );
  const verseKey = React.useMemo(() => verseKeyOfDay(today), [today]);

  const gregorian = today.toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ── Animations ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    let cardAnimation = null;
    let pulseAnimation = null;
    let cardEntrance = null;

    // Hero enters immediately
    const heroAnimation = Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(heroRise, {
        toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]);
    heroAnimation.start();

    // Cards enter 300ms later
    cardEntrance = setTimeout(() => {
      if (!mounted) return;
      cardAnimation = Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(cardRise, {
          toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.spring(ctaScale, {
          toValue: 1, friction: 6, tension: 80, useNativeDriver: true,
        }),
      ]);
      cardAnimation.start();
    }, 300);

    // Perpetual glow pulse on CTA. The loop is stopped on unmount; otherwise a
    // finished animation re-arms itself after the screen is gone.
    const pulse = () => {
      if (!mounted) return;
      pulseAnimation = Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.6, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]);
      pulseAnimation.start(({ finished }) => {
        if (finished && mounted) pulse();
      });
    };
    pulse();

    return () => {
      mounted = false;
      clearTimeout(cardEntrance);
      heroAnimation.stop();
      cardAnimation?.stop();
      pulseAnimation?.stop();
    };
  }, []);

  // ── Data loading ─────────────────────────────────────────────────────────
  const loadVerse = useCallback(async () => {
    setVerseState('loading');
    try {
      const v = await quranService.getVerseByKey(verseKey);
      if (v) { setVerse(v); setVerseState('ready'); }
      else setVerseState('offline');
    } catch { setVerseState('offline'); }
  }, [verseKey]);

  useEffect(() => { loadVerse(); }, [loadVerse]);

  useEffect(() => {
    let alive = true;
    resolveHijriDate(today).then(h => { if (alive) setHijri(h); });
    return () => { alive = false; };
  }, [today]);

  useEffect(() => {
    let alive = true;
    const tick = () => getNextPrayer().then(p => { if (alive) setNextPrayer(p); });
    tick();
    const id = setInterval(tick, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const enter = async () => {
    const trimmed = name.trim();
    if (trimmed) await AsyncStorage.setItem('qitab_user_name', trimmed);
    await AsyncStorage.setItem(LANDING_SEEN_KEY, '1');
    onDone();
  };

  const go = async route => {
    await AsyncStorage.setItem(LANDING_SEEN_KEY, '1');
    onDone(route);
  };

  const shareVerse = async () => {
    const body = verse
      ? `"${strip(verse.translations?.[0]?.text)}"\n— Quran ${verseKey}`
      : `Quran ${verseKey}`;
    await share({
      title: `Quran ${verseKey}`,
      message: body,
      url: APP_CONFIG.shareVerse(verseKey),
    });
  };

  const shareHadith = async () => {
    await share({
      title: hadith.reference || 'Hadith of the Day',
      message: `"${hadith.text}"\n— ${hadith.reference}`,
      url: APP_CONFIG.appUrl,
    });
  };

  const saveVerse = async () => {
    const raw = await AsyncStorage.getItem('qitab_bookmarks_ayah');
    const list = raw ? JSON.parse(raw) : [];
    if (!list.some(b => b.key === verseKey)) {
      list.push({ key: verseKey, savedAt: Date.now() });
      await AsyncStorage.setItem('qitab_bookmarks_ayah', JSON.stringify(list));
    }
    setSaved(true);
  };

  const surahName  = verse?.verse_key ? `Quran ${verse.verse_key}` : `Quran ${verseKey}`;
  const translation = strip(verse?.translations?.[0]?.text);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <GeometricBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, wide && s.scrollWide]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── HERO ──────────────────────────────────────────────────── */}
          <HeroArc />
          <Animated.View style={{ opacity: heroFade, transform: [{ translateY: heroRise }] }}>

            {/* Wordmark */}
            <View style={s.brandRow}>
              <View style={s.brandMark}>
                <Ionicons name="book" size={16} color={C.gold} />
              </View>
              <Text style={s.brandName}>QITAB-E-NOOR</Text>
              <View style={s.brandDot} />
              <Text style={s.brandTagline}>Book of Light</Text>
            </View>

            {/* Hero date block */}
            <View style={s.hero}>
              {/* Bismillah-style decorative text */}
              <Text style={s.heroSmallLabel}>✦ Today in the Islamic World ✦</Text>

              <Text style={s.hijriArabic}>{formatHijriArabic(hijri)}</Text>

              <Text style={s.hijriDay}>
                {hijri.day} {HIJRI_MONTHS[hijri.month - 1]}
              </Text>
              <Text style={s.hijriYear}>{hijri.year} AH</Text>

              <View style={s.heroDivider}>
                <View style={s.heroDividerLine} />
                <Ionicons name="diamond" size={10} color={C.gold} />
                <View style={s.heroDividerLine} />
              </View>

              <Text style={s.monthArabic}>{month?.arabic}</Text>
              <Text style={s.monthName}>{month?.name}</Text>
              {month?.meaning ? (
                <Text style={s.monthMeaning}>"{month.meaning}"</Text>
              ) : null}

              {month?.sacred ? (
                <View style={s.sacredBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={C.gold} />
                  <Text style={s.sacredBadgeText}>Sacred Month</Text>
                </View>
              ) : null}

              <Text style={s.gregorian}>{gregorian}</Text>

              {/* Next prayer preview inside hero */}
              {nextPrayer ? (
                <View style={s.heroPrayerRow}>
                  <View style={s.heroPrayerLeft}>
                    <Ionicons name="time-outline" size={13} color={C.gold} />
                    <Text style={s.heroPrayerLabel}>Next Prayer</Text>
                  </View>
                  <Text style={s.heroPrayerName}>{nextPrayer.name}</Text>
                  <View style={s.heroPrayerRight}>
                    <Text style={s.heroPrayerTime}>{nextPrayer.time}</Text>
                    <Text style={s.heroPrayerCountdown}>{nextPrayer.countdown}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* ── CONTENT CARDS (staggered in) ──────────────────────────── */}
          <Animated.View style={{ opacity: cardFade, transform: [{ translateY: cardRise }] }}>

            {/* Month significance */}
            <SectionHeading label="✦ Significance of the Month" />
            <GlassCard accent>
              <Text style={s.bodyText}>{month?.summary}</Text>
              {(month?.highlights || []).map(h => (
                <View key={h.title} style={s.highlight}>
                  <View style={s.highlightHead}>
                    <View style={s.highlightDot} />
                    <Text style={s.highlightTitle}>{h.title}</Text>
                    {h.when ? <Text style={s.highlightWhen}>{h.when}</Text> : null}
                  </View>
                  <Text style={s.bodyText}>{h.detail}</Text>
                  {h.reference ? <Text style={s.refText}>{h.reference}</Text> : null}
                  {h.disputed ? (
                    <View style={s.caveat}>
                      <Ionicons name="information-circle-outline" size={13} color={C.muted} />
                      <Text style={s.caveatText}>{h.disputed}</Text>
                    </View>
                  ) : h.established ? (
                    <Text style={s.establishedText}>{h.established}</Text>
                  ) : null}
                </View>
              ))}
              {!month?.highlights?.length ? (
                <Text style={s.mutedText}>
                  No specific observances legislated for this month. It is an ordinary month.
                </Text>
              ) : null}
              <View style={s.actionRow}>
                <ActionBtn icon="calendar-outline" label="Islamic Calendar" onPress={() => go('Calendar')} />
              </View>
            </GlassCard>

            {/* Verse of the day */}
            <SectionHeading label="✦ Verse of the Day" />
            <GlassCard accent style={s.verseCard}>
              {verseState === 'loading' ? (
                <View style={s.stateBox}>
                  <ActivityIndicator color={C.gold} />
                  <Text style={s.mutedText}>Loading today's verse…</Text>
                </View>
              ) : verseState === 'offline' ? (
                <View style={s.stateBox}>
                  <Ionicons name="cloud-offline-outline" size={26} color={C.muted} />
                  <Text style={s.mutedText}>
                    Today's verse is {surahName}. Connect to load its text.
                  </Text>
                  <ActionBtn icon="refresh-outline" label="Retry" onPress={loadVerse} />
                </View>
              ) : (
                <>
                  <View style={s.verseArabicWrap}>
                    <Text style={s.verseArabic}>{verse.text_uthmani || verse.text_imlaei}</Text>
                  </View>
                  <View style={s.verseDivider}>
                    <View style={s.verseDividerLine} />
                    <Ionicons name="star" size={8} color={C.gold} />
                    <View style={s.verseDividerLine} />
                  </View>
                  <Text style={s.verseTranslation}>"{translation}"</Text>
                  <Text style={s.verseRef}>— {surahName}</Text>
                </>
              )}
              <View style={s.actionRow}>
                <ActionBtn icon="book-outline" label="Read" onPress={() => go('Quran')} />
                <ActionBtn icon="headset-outline" label="Listen" onPress={() => go('Quran')} />
                <ActionBtn
                  icon={saved ? 'bookmark' : 'bookmark-outline'}
                  label={saved ? 'Saved ✓' : 'Save'}
                  onPress={saveVerse}
                  gold={saved}
                />
                <ActionBtn icon="share-outline" label="Share" onPress={shareVerse} />
              </View>
            </GlassCard>

            {/* Hadith of the day */}
            <SectionHeading label="✦ Hadith of the Day" />
            <GlassCard>
              <View style={s.hadithQuoteBar} />
              <Text style={s.hadithText}>"{hadith.text}"</Text>
              <View style={s.provenance}>
                {[
                  ['Collection', hadith.collection],
                  hadith.book    && ['Book',      hadith.book],
                  hadith.narrator && ['Narrator', hadith.narrator],
                  ['Reference',  hadith.reference],
                ].filter(Boolean).map(([k, v]) => (
                  <View key={k} style={s.provRow}>
                    <Text style={s.provKey}>{k}</Text>
                    <Text style={s.provVal}>{v}</Text>
                  </View>
                ))}
                {hadith.grade ? (
                  <View style={s.gradeChip}>
                    <Ionicons name="checkmark-circle" size={11} color={C.emeraldBright} />
                    <Text style={s.gradeText}>{hadith.grade}</Text>
                  </View>
                ) : null}
              </View>
              <View style={s.actionRow}>
                <ActionBtn icon="library-outline" label="Hadith Library" onPress={() => go('Hadith')} />
                <ActionBtn icon="search-outline" label="Verify"          onPress={() => go('HadithVerify')} />
                <ActionBtn icon="share-outline"  label="Share"           onPress={shareHadith} />
              </View>
            </GlassCard>

            {/* Daily guidance trio */}
            <SectionHeading label="✦ Daily Guidance" />
            <View style={[s.trio, wide && s.trioWide]}>

              {/* Name of Allah */}
              <GlassCard style={[s.trioCard, wide && s.trioCardWide]}>
                <Text style={s.trioLabel}>Name of the Day</Text>
                <Text style={s.nameArabic}>{divineName.arabic}</Text>
                <Text style={s.nameLatin}>{divineName.name}</Text>
                <Text style={s.nameMeaning}>{divineName.meaning}</Text>
                <Text style={s.mutedText}>{divineName.desc}</Text>
                <View style={s.actionRow}>
                  <ActionBtn icon="sparkles-outline" label="All 99 Names" onPress={() => go('NamesOfAllah')} />
                </View>
              </GlassCard>

              {/* Reflection */}
              <GlassCard style={[s.trioCard, wide && s.trioCardWide]}>
                <Text style={s.trioLabel}>A Moment to Reflect</Text>
                <Text style={s.reflectionText}>{reflection}</Text>
                <View style={s.actionRow}>
                  <ActionBtn icon="create-outline" label="Open Journal" onPress={() => go('Journal')} />
                </View>
              </GlassCard>

              {/* Focus */}
              <GlassCard style={[s.trioCard, wide && s.trioCardWide]}>
                <Text style={s.trioLabel}>Today's Focus</Text>
                <Text style={s.focusTitle}>{focus.title}</Text>
                <Text style={s.mutedText}>{focus.detail}</Text>
                <View style={s.actionRow}>
                  <ActionBtn icon="rose-outline" label="Find a Dua" onPress={() => go('Duas')} />
                </View>
              </GlassCard>
            </View>

            {/* Prayer times full card */}
            <SectionHeading label="✦ Your Next Prayer" />
            <GlassCard>
              {nextPrayer ? (
                <>
                  <View style={s.prayerMain}>
                    <View>
                      <Text style={s.prayerName}>{nextPrayer.name}</Text>
                      <Text style={s.prayerTime}>{nextPrayer.time}</Text>
                      {nextPrayer.city ? (
                        <Text style={s.prayerCity}>{nextPrayer.city}</Text>
                      ) : null}
                    </View>
                    <View style={s.countdownBubble}>
                      <Text style={s.countdownNum}>{nextPrayer.countdown}</Text>
                      <Text style={s.countdownLabel}>remaining</Text>
                    </View>
                  </View>
                  {/* Progress bar */}
                  <View style={s.progressTrack}>
                    <Animated.View
                      style={[s.progressFill, {
                        width: `${Math.max(2, Math.min(100,
                          100 - (nextPrayer.minutesAway / 360) * 100))}%`,
                      }]}
                    />
                  </View>
                </>
              ) : (
                <Text style={s.mutedText}>Set your city in Settings to see prayer times.</Text>
              )}
              <View style={s.actionRow}>
                <ActionBtn icon="time-outline"    label="Prayer Times" onPress={() => go('Prayer')} />
                <ActionBtn icon="compass-outline" label="Qibla"        onPress={() => go('Qibla')} />
              </View>
            </GlassCard>

            {/* ── ENTER CTA ─────────────────────────────────────────────── */}
            <View style={s.enterBlock}>

              {/* Name input */}
              <View style={s.nameField}>
                <Ionicons name="person-outline" size={17} color={C.muted} />
                <TextInput
                  style={s.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name (optional)"
                  placeholderTextColor={C.muted}
                  returnKeyType="go"
                  onSubmitEditing={enter}
                  maxLength={40}
                  accessibilityLabel="Your name"
                />
              </View>

              {/* Enter button with glow */}
              <Animated.View style={[s.ctaWrap, { transform: [{ scale: ctaScale }] }]}>
                <Animated.View style={[s.ctaGlow, { opacity: glowPulse }]} />
                <TouchableOpacity
                  style={s.cta}
                  onPress={enter}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Enter Qitab-e-Noor"
                >
                  <Ionicons name="book" size={20} color={C.bg} />
                  <Text style={s.ctaText}>Enter Qitab-e-Noor</Text>
                  <Ionicons name="arrow-forward" size={18} color={C.bg} />
                </TouchableOpacity>
              </Animated.View>

              <Text style={s.footnote}>No account needed · Works offline</Text>
              <Text style={s.disclaimer}>
                Hijri dates are calculated arithmetically and may differ from a local moon sighting by one day.
              </Text>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 60 },
  scrollWide: { maxWidth: 800, width: '100%', alignSelf: 'center', paddingHorizontal: 36 },

  // Hero arc overlay
  heroArcWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 320,
    pointerEvents: 'none',
  },

  // Wordmark
  brandRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 4,
  },
  brandMark: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.goldGlow, borderWidth: 1, borderColor: C.borderGold,
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: {
    color: C.gold, fontSize: 13, fontWeight: '900', letterSpacing: 3.5,
  },
  brandDot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, opacity: 0.6,
  },
  brandTagline: {
    color: C.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.5,
  },

  // Hero section
  hero: {
    alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16,
    marginBottom: 8,
  },
  heroSmallLabel: {
    color: C.gold, fontSize: 10, fontWeight: '800', letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 24, opacity: 0.85,
  },
  hijriArabic: {
    color: C.goldBright, fontSize: 22, lineHeight: 42, fontWeight: '700',
    textAlign: 'center', writingDirection: 'rtl', marginBottom: 4,
  },
  hijriDay: {
    color: C.white, fontSize: 42, fontWeight: '900',
    textAlign: 'center', letterSpacing: -1, marginTop: 2,
  },
  hijriYear: {
    color: C.gold, fontSize: 16, fontWeight: '700', letterSpacing: 4, marginTop: 4,
  },
  heroDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginVertical: 24, width: 80,
  },
  heroDividerLine: { flex: 1, height: 1, backgroundColor: C.gold, opacity: 0.4 },
  monthArabic: {
    color: C.offWhite, fontSize: 44, lineHeight: 68,
    textAlign: 'center', writingDirection: 'rtl',
  },
  monthName: {
    color: C.emeraldBright, fontSize: 20, fontWeight: '800', marginTop: 4,
  },
  monthMeaning: {
    color: C.gold, fontSize: 13.5, fontStyle: 'italic', marginTop: 4,
  },
  sacredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
    backgroundColor: C.goldGlow, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: C.borderGold,
  },
  sacredBadgeText: { color: C.gold, fontSize: 11.5, fontWeight: '800' },
  gregorian: {
    color: C.muted, fontSize: 12.5, marginTop: 18,
  },
  heroPrayerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 24, backgroundColor: C.bgGlass, borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.border,
    alignSelf: 'stretch',
  },
  heroPrayerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  heroPrayerLabel: { color: C.muted, fontSize: 11, fontWeight: '700' },
  heroPrayerName: { color: C.white, fontSize: 16, fontWeight: '800' },
  heroPrayerRight: { alignItems: 'flex-end' },
  heroPrayerTime: { color: C.offWhite, fontSize: 13, fontWeight: '700' },
  heroPrayerCountdown: { color: C.gold, fontSize: 11, fontWeight: '800', marginTop: 1 },

  // Section headings
  headingWrap: { marginTop: 30, marginBottom: 12 },
  goldRule: { width: 32, height: 2.5, backgroundColor: C.gold, marginBottom: 10, borderRadius: 2 },
  headingLabel: {
    color: C.gold, fontSize: 10.5, fontWeight: '900',
    letterSpacing: 2.5, textTransform: 'uppercase',
  },
  headingTitle: { color: C.white, fontSize: 21, fontWeight: '800', marginTop: 4 },

  // Glass card
  card: {
    backgroundColor: C.bgCard, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: C.border, marginBottom: 2,
  },

  // Body text
  bodyText: { color: C.offWhite, fontSize: 14.5, lineHeight: 23 },
  mutedText: { color: C.muted, fontSize: 13, lineHeight: 20 },
  refText: { color: C.gold, fontSize: 12, fontWeight: '700', marginTop: 6 },

  // Highlight block
  highlight: {
    marginTop: 18, paddingTop: 18,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  highlightHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6,
  },
  highlightDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold,
  },
  highlightTitle: { color: C.emeraldBright, fontSize: 15, fontWeight: '800', flex: 1 },
  highlightWhen: { color: C.muted, fontSize: 11.5, fontWeight: '600' },
  caveat: {
    flexDirection: 'row', gap: 7, marginTop: 10,
    padding: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10,
  },
  caveatText: { color: C.muted, fontSize: 12, lineHeight: 18, flex: 1 },
  establishedText: { color: C.muted, fontSize: 11.5, marginTop: 6, fontStyle: 'italic' },

  // Action buttons
  actionRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: C.borderGold, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: C.goldGlow,
  },
  actionBtnGold: {
    backgroundColor: C.gold, borderColor: C.gold,
  },
  actionBtnText: { color: C.gold, fontSize: 12.5, fontWeight: '700' },

  // Verse card
  verseCard: {},
  verseArabicWrap: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12,
    padding: 16, marginBottom: 4,
  },
  verseArabic: {
    color: C.offWhite, fontSize: 26, lineHeight: 50,
    textAlign: 'right', writingDirection: 'rtl',
  },
  verseDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'center', marginVertical: 16, width: 60,
  },
  verseDividerLine: { flex: 1, height: 1, backgroundColor: C.gold, opacity: 0.4 },
  verseTranslation: {
    color: C.offWhite, fontSize: 16.5, lineHeight: 27, textAlign: 'center',
    fontStyle: 'italic',
  },
  verseRef: {
    color: C.gold, fontSize: 13, fontWeight: '700',
    textAlign: 'center', marginTop: 10,
  },
  stateBox: { alignItems: 'center', gap: 14, paddingVertical: 20 },

  // Hadith
  hadithQuoteBar: {
    width: 3, height: 40, backgroundColor: C.gold, borderRadius: 2,
    position: 'absolute', left: 14, top: 20,
  },
  hadithText: {
    color: C.offWhite, fontSize: 15.5, lineHeight: 26,
    paddingLeft: 16,
  },
  provenance: {
    marginTop: 18, padding: 14, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 8,
  },
  provRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12,
  },
  provKey: {
    color: C.muted, fontSize: 10.5, fontWeight: '800',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  provVal: {
    color: C.offWhite, fontSize: 12.5, fontWeight: '600',
    flex: 1, textAlign: 'right',
  },
  gradeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: 'rgba(46,204,113,0.12)',
    borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  gradeText: { color: C.emeraldBright, fontSize: 11, fontWeight: '800' },

  // Trio cards
  trio: { gap: 12 },
  trioWide: { flexDirection: 'row' },
  trioCard: { marginBottom: 0 },
  trioCardWide: { flex: 1 },
  trioLabel: {
    color: C.muted, fontSize: 10, fontWeight: '900',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10,
  },
  nameArabic: {
    color: C.offWhite, fontSize: 36, lineHeight: 58, writingDirection: 'rtl',
  },
  nameLatin: { color: C.emeraldBright, fontSize: 18, fontWeight: '900', marginTop: 2 },
  nameMeaning: { color: C.gold, fontSize: 13.5, fontWeight: '700', marginTop: 3, marginBottom: 6 },
  reflectionText: { color: C.offWhite, fontSize: 15.5, lineHeight: 26 },
  focusTitle: { color: C.emeraldBright, fontSize: 17, fontWeight: '800', marginBottom: 6 },

  // Prayer card
  prayerMain: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  prayerName: { color: C.white, fontSize: 26, fontWeight: '900' },
  prayerTime: { color: C.emeraldBright, fontSize: 16, fontWeight: '700', marginTop: 2 },
  prayerCity: { color: C.muted, fontSize: 12, marginTop: 2 },
  countdownBubble: {
    backgroundColor: C.goldGlow, borderRadius: 16,
    paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.borderGold,
    alignItems: 'center',
  },
  countdownNum: { color: C.gold, fontSize: 20, fontWeight: '900' },
  countdownLabel: { color: C.muted, fontSize: 10, marginTop: 2 },
  progressTrack: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, marginTop: 16, marginBottom: 4, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: C.gold, borderRadius: 2,
  },

  // Enter CTA block
  enterBlock: { marginTop: 40, alignItems: 'center' },
  nameField: {
    flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch',
    backgroundColor: C.bgCardAlt, borderWidth: 1, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 16, height: 52, marginBottom: 14,
  },
  nameInput: {
    flex: 1, color: C.white, fontSize: 15, height: '100%',
  },
  ctaWrap: { alignSelf: 'stretch', position: 'relative' },
  ctaGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.gold, borderRadius: 16,
    shadowColor: C.gold, shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 0 },
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.gold, height: 58, borderRadius: 16,
    shadowColor: C.gold, shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaText: {
    color: C.bg, fontSize: 17, fontWeight: '900', letterSpacing: 0.3,
  },
  footnote: {
    color: C.muted, fontSize: 12.5, marginTop: 18, textAlign: 'center',
  },
  disclaimer: {
    color: C.muted, fontSize: 11, marginTop: 6,
    textAlign: 'center', opacity: 0.7, lineHeight: 17,
  },
});
