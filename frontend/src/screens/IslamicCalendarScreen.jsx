import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import {
  getHijriDate, resolveHijriDate, HIJRI_MONTHS, HIJRI_MONTHS_AR,
  formatHijriArabic,
} from '../utils/hijri';
import { monthInfo } from '../data/hijriMonths';
import MoonPhase from '../components/MoonPhase';


const IMPORTANT_DAYS = [
  { month: 1, day: 1, name: 'Islamic New Year', emoji: '🌙', desc: 'Beginning of the Hijri calendar year.' },
  { month: 1, day: 10, name: 'Day of Ashura', emoji: '📿', desc: 'Fasting recommended — Allah saved Musa (AS).' },
  { month: 3, day: 12, name: 'Mawlid an-Nabi', emoji: '🕌', desc: 'Birthday of Prophet Muhammad ﷺ.' },
  { month: 7, day: 27, name: "Isra & Mi'raj", emoji: '✨', desc: 'Night Journey of Prophet Muhammad ﷺ.' },
  { month: 8, day: 15, name: 'Shab-e-Barat', emoji: '⭐', desc: 'Night of forgiveness and blessings.' },
  { month: 9, day: 1, name: 'Start of Ramadan', emoji: '🌙', desc: 'The holy month of fasting begins.' },
  { month: 9, day: 27, name: 'Laylat al-Qadr', emoji: '💎', desc: 'The Night of Power — better than 1,000 months.' },
  { month: 10, day: 1, name: 'Eid al-Fitr', emoji: '🎉', desc: 'Festival marking the end of Ramadan.' },
  { month: 12, day: 9, name: 'Day of Arafah', emoji: '🤲', desc: 'Best day of the year — Hajj pilgrimage.' },
  { month: 12, day: 10, name: 'Eid al-Adha', emoji: '🐑', desc: 'Festival of Sacrifice — commemorates Ibrahim (AS).' },
];



export default function IslamicCalendarScreen() {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  // Start from the arithmetic date so the screen paints immediately, then
  // replace it with the Umm al-Qura date once that resolves. The arithmetic
  // value can be a day out, so `approximate` drives a visible caveat.
  const [hijri, setHijri] = useState(() => getHijriDate());
  const [showAllDays, setShowAllDays] = useState(false);

  useEffect(() => {
    let alive = true;
    resolveHijriDate().then(h => { if (alive) setHijri(h); });
    return () => { alive = false; };
  }, []);

  const todayImportant = useMemo(
    () => IMPORTANT_DAYS.filter(
      d => d.month === hijri.month && Math.abs(d.day - hijri.day) <= 3
    ),
    [hijri]
  );
  const info = useMemo(() => monthInfo(hijri.month), [hijri.month]);

  const daysInMonth = hijri.month === 2 || hijri.month === 4 || hijri.month === 6 ||
                      hijri.month === 8 || hijri.month === 10 || hijri.month === 12 ? 29 : 30;
  // Dhul Hijjah can be 29 or 30
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Current Date Card */}
        <View style={styles.dateCard}>
          <View style={styles.dateCardGlow} />
          <View style={styles.dateCardContent}>
            {/* The date in Arabic, with Arabic-Indic numerals, is the headline —
                the transliteration reads as the secondary line beneath it. */}
            <Text style={styles.hijriArabic}>{formatHijriArabic(hijri)}</Text>
            <Text style={styles.hijriDate}>
              {hijri.day} {HIJRI_MONTHS[hijri.month - 1]} {hijri.year} AH
            </Text>
            <Text style={styles.gregDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>

            <View style={styles.moonRow}>
              <MoonPhase day={hijri.day} size={78} />
            </View>

            {hijri.approximate ? (
              <View style={styles.approxChip}>
                <Ionicons name="information-circle-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.approxText}>
                  Calculated offline — may differ by a day
                </Text>
              </View>
            ) : (
              <View style={styles.approxChip}>
                <Ionicons name="checkmark-circle-outline" size={12} color={COLORS.emerald} />
                <Text style={[styles.approxText, { color: COLORS.emerald }]}>
                  Umm al-Qura
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* This month in Islam. Content and its provenance markers come from
            src/data/hijriMonths.js — a disputed date renders its dispute
            rather than being asserted as settled. */}
        {info ? (
          <View style={styles.monthCard}>
            <View style={styles.monthHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.monthArabicName}>{HIJRI_MONTHS_AR[hijri.month - 1]}</Text>
                <Text style={styles.monthName}>{info.name}</Text>
                <Text style={styles.monthMeaning}>{info.meaning}</Text>
              </View>
              {info.sacred ? (
                <View style={styles.sacredChip}>
                  <Ionicons name="shield-checkmark" size={12} color={COLORS.gold} />
                  <Text style={styles.sacredText}>Sacred month</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.monthSummary}>{info.summary}</Text>

            {info.highlights.length ? info.highlights.map(h => (
              <View key={h.title} style={styles.story}>
                <View style={styles.storyHead}>
                  <Ionicons name="bookmark" size={13} color={COLORS.gold} />
                  <Text style={styles.storyTitle}>{h.title}</Text>
                  {h.when ? <Text style={styles.storyWhen}>{h.when}</Text> : null}
                </View>
                <Text style={styles.storyBody}>{h.detail}</Text>
                {h.reference ? <Text style={styles.storyRef}>{h.reference}</Text> : null}
                {h.disputed ? (
                  <View style={styles.disputed}>
                    <Ionicons name="alert-circle-outline" size={12} color={COLORS.amber} />
                    <Text style={styles.disputedText}>{h.disputed}</Text>
                  </View>
                ) : h.established ? (
                  <Text style={styles.establishedText}>{h.established}</Text>
                ) : null}
              </View>
            )) : (
              <Text style={styles.noStory}>
                No specific observances are legislated for this month.
              </Text>
            )}
          </View>
        ) : null}


        {/* Quick Nav */}
        <View style={styles.quickNav}>
          {['Muharram', 'Ramadan', 'Shawwal', 'Dhul Hijjah'].map(m => (
            <TouchableOpacity key={m} style={styles.quickBtn}>
              <Text style={styles.quickBtnText}>{m.slice(0, 4)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Events */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {todayImportant.length > 0 ? todayImportant.map((evt, i) => (
            <View key={i} style={styles.eventCard}>
              <Text style={styles.eventEmoji}>{evt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventName}>{evt.name}</Text>
                <Text style={styles.eventDesc}>{evt.desc}</Text>
              </View>
              <Text style={styles.eventDay}>{evt.day} {HIJRI_MONTHS[evt.month - 1].slice(0, 3)}</Text>
            </View>
          )) : (
            <View style={styles.noEvent}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>No major events within 3 days</Text>
            </View>
          )}
        </View>

        {/* All Important Days */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <TouchableOpacity onPress={() => setShowAllDays(!showAllDays)} style={globalStyles.spaceBetween}>
            <Text style={styles.sectionTitle}>All Important Islamic Days</Text>
            <Ionicons name={showAllDays ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {showAllDays && IMPORTANT_DAYS.map((evt, i) => (
            <View key={i} style={styles.eventCard}>
              <Text style={styles.eventEmoji}>{evt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventName}>{evt.name}</Text>
                <Text style={styles.eventDesc}>{evt.desc}</Text>
              </View>
              <View style={styles.eventDayWrap}>
                <Text style={styles.eventDayNum}>{evt.day}</Text>
                <Text style={styles.eventDayMonth}>{HIJRI_MONTHS[evt.month - 1].slice(0, 3)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Month Calendar Grid */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Text style={styles.sectionTitle}>{HIJRI_MONTHS[hijri.month - 1]} {hijri.year} AH</Text>
          <View style={styles.calGrid}>
            {days.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.calDay, d === hijri.day && styles.calDayActive]}
              >
                <Text style={[styles.calDayText, d === hijri.day && styles.calDayTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  dateCard: {
    margin: 16, borderRadius: 24, overflow: 'hidden',
    backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  dateCardGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255,0.06)',
  },
  dateCardContent: {
    padding: 24, alignItems: 'center',
  },
  hijriDate: {
    color: COLORS.gold, fontSize: 26, fontWeight: '900',
    marginTop: 12, textAlign: 'center',
  },
  gregDate: {
    color: COLORS.textSecondary, fontSize: 13, marginTop: 4,
  },
  moonPhase: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255,0.1)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255,0.2)',
  },
  moonText: { color: COLORS.gold, fontSize: 12, fontWeight: '600' },
  hijriArabic: {
    color: COLORS.gold, fontSize: 28, lineHeight: 46,
    fontWeight: '700', textAlign: 'center', writingDirection: 'rtl',
  },
  moonRow: { marginTop: 14, marginBottom: 6 },
  approxChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8,
  },
  approxText: { color: COLORS.textSecondary, fontSize: 10.5, fontWeight: '600' },

  monthCard: {
    marginHorizontal: 16, marginTop: 18, padding: 18, borderRadius: 18,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  monthHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  monthArabicName: {
    color: COLORS.textPrimary, fontSize: 26, lineHeight: 44, writingDirection: 'rtl',
  },
  monthName: { color: COLORS.gold, fontSize: 17, fontWeight: '800', marginTop: 2 },
  monthMeaning: { color: COLORS.textSecondary, fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  sacredChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: COLORS.gold + '55', backgroundColor: COLORS.gold + '14',
    borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5,
  },
  sacredText: { color: COLORS.gold, fontSize: 10.5, fontWeight: '700' },
  monthSummary: {
    color: COLORS.textPrimary, fontSize: 13.5, lineHeight: 21, marginTop: 14,
  },
  story: {
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  storyHead: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  storyTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800', flexShrink: 1 },
  storyWhen: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  storyBody: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
  storyRef: { color: COLORS.gold, fontSize: 11.5, fontWeight: '700', marginTop: 6 },
  disputed: {
    flexDirection: 'row', gap: 6, marginTop: 9, padding: 10,
    borderRadius: 9, backgroundColor: COLORS.amber + '12',
    borderWidth: 1, borderColor: COLORS.amber + '2E',
  },
  disputedText: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17, flex: 1 },
  establishedText: {
    color: COLORS.textSecondary, fontSize: 11, marginTop: 7,
    fontStyle: 'italic', opacity: 0.85,
  },
  noStory: { color: COLORS.textSecondary, fontSize: 12.5, marginTop: 14, fontStyle: 'italic' },

  quickNav: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, marginTop: 8,
  },
  quickBtn: {
    flex: 1, paddingVertical: 10,
    backgroundColor: COLORS.glass,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  quickBtnText: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '700' },
  sectionTitle: {
    color: COLORS.gold, fontSize: 17, fontWeight: '800',
    marginBottom: 12,
  },
  eventCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.glass,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.glassBorder,
    padding: 14, marginBottom: 10,
  },
  eventEmoji: { fontSize: 28 },
  eventName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  eventDesc: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  eventDay: { color: COLORS.gold, fontSize: 12, fontWeight: '700' },
  eventDayWrap: { alignItems: 'center' },
  eventDayNum: { color: COLORS.gold, fontSize: 18, fontWeight: '900' },
  eventDayMonth: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  noEvent: {
    padding: 20, backgroundColor: COLORS.glass,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  calGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  calDay: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  calDayActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  calDayText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  calDayTextActive: { color: '#000', fontWeight: '900' },
});
