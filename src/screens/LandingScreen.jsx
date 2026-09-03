// The landing page — the first thing a user sees, before the app itself.
//
// This is deliberately NOT a dashboard. It answers one question — "what is
// today, in the Islamic world?" — and then offers a single door into the app.
// Modules, counters and controls belong on the dashboard behind that door.
//
// It carries its own light palette (ivory / deep green / antique gold) rather
// than the app's dark navy. That is intentional: the landing page is a calm
// threshold, and the shift in ground is what makes entering the app feel like
// entering somewhere. Colours are local to this file for that reason.
//
// Content rules, enforced by the data layer rather than by this component:
//   - Quran text is fetched live by verse key; the app ships no transcription.
//   - Hadith carry their collection, reference and narrator, always rendered.
//   - Contested dates render their dispute rather than asserting a date.
// See src/data/daily.js and src/data/hijriMonths.js.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Easing,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Share,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Pattern, Path, Rect, G } from 'react-native-svg';
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

export const LANDING_SEEN_KEY = 'qitab_landing_seen';

// ── Palette ────────────────────────────────────────────────────────────────
// Deep green + ivory + antique gold, charcoal text. Flat fills only: no
// gradients or glows, so the page reads as printed rather than lit.
const C = {
  ivory: '#FBF8F1',
  ivoryDeep: '#F3EEE2',
  card: '#FFFFFF',
  green: '#1B4D3E',
  greenSoft: '#2F6B57',
  gold: '#A98A45',
  goldSoft: '#C4A868',
  charcoal: '#232323',
  muted: '#6B6B63',
  line: '#E4DED0',
};

const strip = html => String(html || '').replace(/<[^>]*>/g, '').trim();

/**
 * The background. An eight-point Islamic star tiled as an SVG pattern at very
 * low opacity — architectural rather than decorative, and drawn rather than a
 * photograph so it stays crisp at any size and costs nothing to ship.
 */
function GeometricBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="khatam" width="64" height="64" patternUnits="userSpaceOnUse">
            <G stroke={C.green} strokeWidth="1" fill="none" opacity="0.5">
              {/* Two overlaid squares — the khatam star. */}
              <Path d="M32 4 L60 32 L32 60 L4 32 Z" />
              <Path d="M12 12 L52 12 L52 52 L12 52 Z" />
              <Path d="M32 4 L32 60 M4 32 L60 32" opacity="0.35" />
            </G>
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={C.ivory} />
        <Rect width="100%" height="100%" fill="url(#khatam)" opacity="0.07" />
      </Svg>
    </View>
  );
}

/** Section heading: a small gold rule, a label, then the title. */
function SectionHeading({ label, title }) {
  return (
    <View style={s.headingWrap}>
      <View style={s.headingRule} />
      <Text style={s.headingLabel}>{label}</Text>
      {title ? <Text style={s.headingTitle}>{title}</Text> : null}
    </View>
  );
}

function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

/** A quiet, bordered action. Used for Read / Listen / Save / Share rows. */
function CardAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={s.action}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={15} color={C.green} />
      <Text style={s.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function LandingScreen({ onDone, onNavigate }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const [name, setName] = useState('');
  const [verse, setVerse] = useState(null);
  const [verseState, setVerseState] = useState('loading'); // loading | ready | offline
  const [nextPrayer, setNextPrayer] = useState(null);
  const [saved, setSaved] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(20)).current;

  const today = React.useMemo(() => new Date(), []);
  // Paint immediately with the arithmetic date, then correct it to the
  // Umm al-Qura date once that resolves.
  const [hijri, setHijri] = useState(() => getHijriDate(today));
  const month = React.useMemo(() => monthInfo(hijri.month), [hijri.month]);
  const hadith = React.useMemo(() => hadithOfDay(today), [today]);
  const reflection = React.useMemo(() => reflectionOfDay(today), [today]);
  const focus = React.useMemo(() => focusOfDay(today), [today]);
  const divineName = React.useMemo(
    () => ASMA_UL_HUSNA[dayIndex(ASMA_UL_HUSNA.length, today)], [today]
  );
  const verseKey = React.useMemo(() => verseKeyOfDay(today), [today]);

  const gregorian = today.toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(rise, {
        toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise]);

  // The verse is fetched, never bundled — the app must not ship its own copy
  // of the Quran's text. An unreachable network degrades to the reference
  // alone rather than to a blank card or a stale hardcoded verse.
  const loadVerse = useCallback(async () => {
    setVerseState('loading');
    try {
      const v = await quranService.getVerseByKey(verseKey);
      if (v) {
        setVerse(v);
        setVerseState('ready');
      } else {
        setVerseState('offline');
      }
    } catch {
      setVerseState('offline');
    }
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

  const enter = async () => {
    const trimmed = name.trim();
    if (trimmed) await AsyncStorage.setItem('qitab_user_name', trimmed);
    await AsyncStorage.setItem(LANDING_SEEN_KEY, '1');
    onDone();
  };

  // Jumping to a module means leaving the landing page for good, so the
  // first-run flag is set here too — otherwise the user would be returned to
  // this page the next time they open the app.
  const go = async route => {
    await AsyncStorage.setItem(LANDING_SEEN_KEY, '1');
    onDone(route);
  };

  const shareVerse = async () => {
    const body = verse
      ? `"${strip(verse.translations?.[0]?.text)}"\n— Quran ${verseKey}`
      : `Quran ${verseKey}`;
    try {
      await Share.share({ message: `${body}\n\nvia Qitab-e-Noor` });
    } catch { /* user dismissed the sheet */ }
  };

  const shareHadith = async () => {
    try {
      await Share.share({
        message: `"${hadith.text}"\n— ${hadith.reference}\n\nvia Qitab-e-Noor`,
      });
    } catch { /* user dismissed the sheet */ }
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

  const surahName = verse?.verse_key ? `Quran ${verse.verse_key}` : `Quran ${verseKey}`;
  const translation = strip(verse?.translations?.[0]?.text);

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
          <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>

            {/* ── Wordmark ─────────────────────────────────────────────── */}
            <View style={s.brandRow}>
              <View style={s.brandMark}>
                <Ionicons name="book" size={17} color={C.gold} />
              </View>
              <Text style={s.brandName}>QITAB-E-NOOR</Text>
            </View>

            {/* ── Hero: the Hijri date is the headline ─────────────────── */}
            <View style={s.hero}>
              <Text style={s.heroEyebrow}>Today in the Islamic world</Text>

              <Text style={s.hijriArabicDate}>{formatHijriArabic(hijri)}</Text>
              <Text style={s.hijriDay}>
                {hijri.day} {HIJRI_MONTHS[hijri.month - 1]}
              </Text>
              <Text style={s.hijriYear}>{hijri.year} AH</Text>

              <View style={s.heroDivider} />

              <Text style={s.monthArabic}>{month?.arabic}</Text>
              <Text style={s.monthLatin}>{month?.name}</Text>
              {month?.meaning ? (
                <Text style={s.monthMeaning}>{month.meaning}</Text>
              ) : null}

              {month?.sacred ? (
                <View style={s.sacredChip}>
                  <Ionicons name="shield-checkmark-outline" size={12} color={C.gold} />
                  <Text style={s.sacredChipText}>One of the four sacred months</Text>
                </View>
              ) : null}

              <Text style={s.gregorian}>{gregorian}</Text>
            </View>

            {/* ── This month in Islam ──────────────────────────────────── */}
            <SectionHeading label="✦ Significance of the month" />
            <Card>
              <Text style={s.body}>{month?.summary}</Text>

              {(month?.highlights || []).map(h => (
                <View key={h.title} style={s.highlight}>
                  <View style={s.highlightHead}>
                    <Text style={s.highlightTitle}>{h.title}</Text>
                    {h.when ? <Text style={s.highlightWhen}>{h.when}</Text> : null}
                  </View>
                  <Text style={s.body}>{h.detail}</Text>
                  {h.reference ? (
                    <Text style={s.reference}>{h.reference}</Text>
                  ) : null}
                  {/* A contested date is shown as contested. Presenting a
                      disputed day as settled fact would be the single most
                      damaging thing this page could do. */}
                  {h.disputed ? (
                    <View style={s.caveat}>
                      <Ionicons name="information-circle-outline" size={13} color={C.muted} />
                      <Text style={s.caveatText}>{h.disputed}</Text>
                    </View>
                  ) : h.established ? (
                    <Text style={s.established}>{h.established}</Text>
                  ) : null}
                </View>
              ))}

              {!month?.highlights?.length ? (
                <Text style={s.muted}>
                  No specific observances are legislated for this month. It is an
                  ordinary month of the year.
                </Text>
              ) : null}

              <View style={s.actionRow}>
                <CardAction icon="calendar-outline" label="Explore the month"
                  onPress={() => go('Calendar')} />
              </View>
            </Card>

            {/* ── Verse of the day ─────────────────────────────────────── */}
            <SectionHeading label="✦ Verse of the day" />
            <Card style={s.verseCard}>
              {verseState === 'loading' ? (
                <View style={s.stateBox}>
                  <ActivityIndicator color={C.green} />
                  <Text style={s.muted}>Loading today's verse…</Text>
                </View>
              ) : verseState === 'offline' ? (
                <View style={s.stateBox}>
                  <Ionicons name="cloud-offline-outline" size={22} color={C.muted} />
                  <Text style={s.muted}>
                    Today's verse is {surahName}. Connect to load its text.
                  </Text>
                  <CardAction icon="refresh-outline" label="Retry" onPress={loadVerse} />
                </View>
              ) : (
                <>
                  <Text style={s.verseArabic}>
                    {verse.text_uthmani || verse.text_imlaei}
                  </Text>
                  <View style={s.verseRule} />
                  <Text style={s.verseTranslation}>“{translation}”</Text>
                  <Text style={s.verseRef}>— {surahName}</Text>
                </>
              )}

              <View style={s.actionRow}>
                <CardAction icon="book-outline" label="Read in Quran"
                  onPress={() => go('Quran')} />
                <CardAction icon="headset-outline" label="Listen"
                  onPress={() => go('Quran')} />
                <CardAction
                  icon={saved ? 'bookmark' : 'bookmark-outline'}
                  label={saved ? 'Saved' : 'Save'}
                  onPress={saveVerse}
                />
                <CardAction icon="share-outline" label="Share" onPress={shareVerse} />
              </View>
            </Card>

            {/* ── Hadith of the day ────────────────────────────────────── */}
            <SectionHeading label="✦ Hadith of the day" />
            <Card>
              <Text style={s.hadithText}>“{hadith.text}”</Text>

              {/* Provenance is not an afterthought here — collection, book,
                  narrator, grade and reference all render, every time. */}
              <View style={s.provenance}>
                <View style={s.provRow}>
                  <Text style={s.provKey}>Collection</Text>
                  <Text style={s.provVal}>{hadith.collection}</Text>
                </View>
                {hadith.book ? (
                  <View style={s.provRow}>
                    <Text style={s.provKey}>Book</Text>
                    <Text style={s.provVal}>{hadith.book}</Text>
                  </View>
                ) : null}
                {hadith.narrator ? (
                  <View style={s.provRow}>
                    <Text style={s.provKey}>Narrator</Text>
                    <Text style={s.provVal}>{hadith.narrator}</Text>
                  </View>
                ) : null}
                <View style={s.provRow}>
                  <Text style={s.provKey}>Reference</Text>
                  <Text style={[s.provVal, s.provRef]}>{hadith.reference}</Text>
                </View>
                {hadith.grade ? (
                  <View style={s.gradeChip}>
                    <Ionicons name="checkmark-circle" size={12} color={C.green} />
                    <Text style={s.gradeText}>{hadith.grade}</Text>
                  </View>
                ) : null}
              </View>

              <View style={s.actionRow}>
                <CardAction icon="library-outline" label="Read hadith"
                  onPress={() => go('Hadith')} />
                <CardAction icon="search-outline" label="Verify"
                  onPress={() => go('HadithVerify')} />
                <CardAction icon="share-outline" label="Share" onPress={shareHadith} />
              </View>
            </Card>

            {/* ── Name / reflection / focus ────────────────────────────── */}
            <SectionHeading label="✦ Daily guidance" />
            <View style={[s.trio, wide && s.trioWide]}>
              <Card style={[s.trioCard, wide && s.trioCardWide]}>
                <Text style={s.trioLabel}>Name of the day</Text>
                <Text style={s.nameArabic}>{divineName.arabic}</Text>
                <Text style={s.nameLatin}>{divineName.name}</Text>
                <Text style={s.nameMeaning}>{divineName.meaning}</Text>
                <Text style={s.muted}>{divineName.desc}</Text>
                <View style={s.actionRow}>
                  <CardAction icon="sparkles-outline" label="All 99 names"
                    onPress={() => go('NamesOfAllah')} />
                </View>
              </Card>

              <Card style={[s.trioCard, wide && s.trioCardWide]}>
                <Text style={s.trioLabel}>A moment to reflect</Text>
                <Text style={s.reflection}>{reflection}</Text>
                <View style={s.actionRow}>
                  <CardAction icon="create-outline" label="Open journal"
                    onPress={() => go('Journal')} />
                </View>
              </Card>

              <Card style={[s.trioCard, wide && s.trioCardWide]}>
                <Text style={s.trioLabel}>Today's focus</Text>
                <Text style={s.focusTitle}>{focus.title}</Text>
                <Text style={s.muted}>{focus.detail}</Text>
                <View style={s.actionRow}>
                  <CardAction icon="rose-outline" label="Find a dua"
                    onPress={() => go('Duas')} />
                </View>
              </Card>
            </View>

            {/* ── Next prayer (preview only) ───────────────────────────── */}
            <SectionHeading label="✦ Your next prayer" />
            <Card>
              {nextPrayer ? (
                <>
                  <View style={s.prayerRow}>
                    <View>
                      <Text style={s.prayerName}>{nextPrayer.name}</Text>
                      <Text style={s.prayerTime}>{nextPrayer.time}</Text>
                    </View>
                    <View style={s.prayerRight}>
                      <Text style={s.prayerRemaining}>{nextPrayer.countdown}</Text>
                      <Text style={s.muted}>remaining</Text>
                    </View>
                  </View>
                  {/* Progress through the current interval, capped at a
                      six-hour window so the bar stays meaningful. */}
                  <View style={s.progressTrack}>
                    <View
                      style={[s.progressFill, {
                        width: `${Math.max(2, Math.min(100,
                          100 - (nextPrayer.minutesAway / 360) * 100))}%`,
                      }]}
                    />
                  </View>
                  <Text style={s.muted}>{nextPrayer.city}</Text>
                </>
              ) : (
                <Text style={s.muted}>
                  Set your city to see prayer times for your location.
                </Text>
              )}
              <View style={s.actionRow}>
                <CardAction icon="time-outline" label="View prayer times"
                  onPress={() => go('Prayer')} />
                <CardAction icon="compass-outline" label="Qibla"
                  onPress={() => go('Qibla')} />
              </View>
            </Card>

            {/* ── The door ─────────────────────────────────────────────── */}
            <View style={s.enterBlock}>
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

              <TouchableOpacity
                style={s.cta}
                onPress={enter}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Enter Qitab-e-Noor"
              >
                <Text style={s.ctaText}>Enter Qitab-e-Noor</Text>
                <Ionicons name="arrow-forward" size={17} color={C.ivory} />
              </TouchableOpacity>

              <Text style={s.footnote}>
                No account, no password. Everything works offline.
              </Text>
              <Text style={s.disclaimer}>
                Hijri dates are calculated arithmetically and may differ from a
                local moon sighting by a day.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ivory },
  scroll: { padding: 20, paddingTop: 52, paddingBottom: 56 },
  scrollWide: { maxWidth: 780, width: '100%', alignSelf: 'center', paddingHorizontal: 32 },

  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  brandMark: {
    width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.gold + '66', backgroundColor: C.gold + '12',
  },
  brandName: {
    color: C.green, fontSize: 12, fontWeight: '800', letterSpacing: 3.4,
  },

  hero: { alignItems: 'center', paddingVertical: 36 },
  heroEyebrow: {
    color: C.muted, fontSize: 11, letterSpacing: 2.4,
    textTransform: 'uppercase', fontWeight: '700',
  },
  hijriArabicDate: {
    color: C.gold, fontSize: 21, lineHeight: 38, fontWeight: '600',
    textAlign: 'center', marginTop: 14, writingDirection: 'rtl',
  },
  hijriDay: {
    color: C.green, fontSize: 38, fontWeight: '800',
    marginTop: 4, textAlign: 'center', letterSpacing: -0.4,
  },
  hijriYear: {
    color: C.gold, fontSize: 15, fontWeight: '700', letterSpacing: 3, marginTop: 4,
  },
  heroDivider: {
    width: 54, height: 1, backgroundColor: C.gold, opacity: 0.55, marginVertical: 26,
  },
  // Arabic is given real size and line height — it must never read as UI text.
  monthArabic: {
    color: C.charcoal, fontSize: 42, lineHeight: 66, textAlign: 'center',
    writingDirection: 'rtl',
  },
  monthLatin: { color: C.green, fontSize: 19, fontWeight: '700', marginTop: 6 },
  monthMeaning: { color: C.muted, fontSize: 13, marginTop: 3, fontStyle: 'italic' },
  sacredChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    borderWidth: 1, borderColor: C.gold + '55', backgroundColor: C.gold + '10',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  sacredChipText: { color: C.gold, fontSize: 11.5, fontWeight: '700' },
  gregorian: { color: C.muted, fontSize: 12.5, marginTop: 20 },

  headingWrap: { marginTop: 34, marginBottom: 12 },
  headingRule: { width: 28, height: 2, backgroundColor: C.gold, marginBottom: 10 },
  headingLabel: {
    color: C.green, fontSize: 11, fontWeight: '800',
    letterSpacing: 2, textTransform: 'uppercase',
  },
  headingTitle: { color: C.charcoal, fontSize: 20, fontWeight: '700', marginTop: 4 },

  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: C.line,
  },
  body: { color: C.charcoal, fontSize: 14.5, lineHeight: 23 },
  muted: { color: C.muted, fontSize: 13, lineHeight: 20 },
  reference: {
    color: C.gold, fontSize: 12, fontWeight: '700', marginTop: 7, letterSpacing: 0.2,
  },

  highlight: { marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: C.line },
  highlightHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 10, marginBottom: 6,
  },
  highlightTitle: { color: C.green, fontSize: 15, fontWeight: '800', flexShrink: 1 },
  highlightWhen: { color: C.muted, fontSize: 11.5, fontWeight: '600' },
  caveat: {
    flexDirection: 'row', gap: 7, marginTop: 10, padding: 11,
    backgroundColor: C.ivoryDeep, borderRadius: 9,
  },
  caveatText: { color: C.muted, fontSize: 12, lineHeight: 18, flex: 1 },
  established: { color: C.muted, fontSize: 11.5, marginTop: 7, fontStyle: 'italic' },

  actionRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.line,
  },
  action: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: C.line, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  actionText: { color: C.green, fontSize: 12.5, fontWeight: '700' },

  verseCard: { paddingVertical: 26 },
  verseArabic: {
    color: C.charcoal, fontSize: 27, lineHeight: 52,
    textAlign: 'right', writingDirection: 'rtl',
  },
  verseRule: {
    width: 40, height: 1, backgroundColor: C.gold,
    opacity: 0.5, alignSelf: 'center', marginVertical: 20,
  },
  verseTranslation: {
    color: C.charcoal, fontSize: 16.5, lineHeight: 27, textAlign: 'center',
  },
  verseRef: {
    color: C.gold, fontSize: 13, fontWeight: '700',
    textAlign: 'center', marginTop: 12,
  },
  stateBox: { alignItems: 'center', gap: 12, paddingVertical: 22 },

  hadithText: { color: C.charcoal, fontSize: 16, lineHeight: 27 },
  provenance: {
    marginTop: 18, padding: 14, borderRadius: 10,
    backgroundColor: C.ivoryDeep, gap: 7,
  },
  provRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  provKey: {
    color: C.muted, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  provVal: { color: C.charcoal, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  provRef: { color: C.gold, fontWeight: '800' },
  gradeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    marginTop: 3, borderWidth: 1, borderColor: C.green + '3D',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  gradeText: { color: C.green, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },

  trio: { gap: 14 },
  trioWide: { flexDirection: 'row' },
  trioCard: {},
  trioCardWide: { flex: 1 },
  trioLabel: {
    color: C.muted, fontSize: 10.5, fontWeight: '800',
    letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 12,
  },
  nameArabic: { color: C.charcoal, fontSize: 34, lineHeight: 56, writingDirection: 'rtl' },
  nameLatin: { color: C.green, fontSize: 18, fontWeight: '800', marginTop: 2 },
  nameMeaning: { color: C.gold, fontSize: 13.5, fontWeight: '700', marginTop: 3, marginBottom: 8 },
  reflection: { color: C.charcoal, fontSize: 15.5, lineHeight: 26 },
  focusTitle: { color: C.green, fontSize: 17, fontWeight: '800', marginBottom: 6 },

  prayerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  prayerName: { color: C.green, fontSize: 24, fontWeight: '800' },
  prayerTime: { color: C.charcoal, fontSize: 15, marginTop: 2 },
  prayerRight: { alignItems: 'flex-end' },
  prayerRemaining: { color: C.gold, fontSize: 19, fontWeight: '800' },
  progressTrack: {
    height: 3, backgroundColor: C.ivoryDeep, borderRadius: 2,
    marginTop: 16, marginBottom: 10, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.gold, borderRadius: 2 },

  enterBlock: { marginTop: 40, alignItems: 'center' },
  nameField: {
    flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch',
    borderWidth: 1, borderColor: C.line, borderRadius: 10,
    paddingHorizontal: 14, height: 50, backgroundColor: C.card, marginBottom: 12,
  },
  nameInput: { flex: 1, color: C.charcoal, fontSize: 15, height: '100%' },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    alignSelf: 'stretch', backgroundColor: C.green, height: 56, borderRadius: 12,
  },
  ctaText: { color: C.ivory, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  footnote: { color: C.muted, fontSize: 12.5, marginTop: 16, textAlign: 'center' },
  disclaimer: {
    color: C.muted, fontSize: 11, marginTop: 8,
    textAlign: 'center', opacity: 0.8, lineHeight: 17,
  },
});
