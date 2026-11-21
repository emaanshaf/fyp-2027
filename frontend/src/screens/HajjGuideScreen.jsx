// Hajj and Umrah companion: types, a day-by-day rite guide, duas, ihram
// rules and a checklist that remembers what the pilgrim has completed.
//
// It is deliberately a study aid, not a substitute for a qualified teacher or
// the instructions of an authorised Hajj group.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useShare } from '../context/ShareContext';
import { APP_CONFIG } from '../config/appConfig';
import {
  HAJJ_INTRO, HAJJ_TYPES, HAJJ_DAYS, UMRAH_STEPS, IHRAAM_PROHIBITIONS,
  HAJJ_DUAS, HAJJ_MISTAKES, HAJJ_CHECKLIST, HAJJ_HISTORY,
} from '../data/hajj';

const CHECK_KEY = 'qitab_hajj_checklist';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'compass-outline' },
  { key: 'days', label: 'Day by Day', icon: 'calendar-outline' },
  { key: 'umrah', label: 'Umrah', icon: 'walk-outline' },
  { key: 'duas', label: 'Duas', icon: 'heart-outline' },
  { key: 'checklist', label: 'Checklist', icon: 'checkbox-outline' },
];

export default function HajjGuideScreen() {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);
  const { isUrdu, t } = useLanguage();
  const { share } = useShare();

  const [tab, setTab] = useState('overview');
  const [openDay, setOpenDay] = useState('day8');
  const [checked, setChecked] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CHECK_KEY)
      .then(raw => {
        const parsed = raw ? JSON.parse(raw) : {};
        if (parsed && typeof parsed === 'object') setChecked(parsed);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const toggleCheck = async (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    await AsyncStorage.setItem(CHECK_KEY, JSON.stringify(next));
  };

  const checklistItems = useMemo(
    () => HAJJ_CHECKLIST.flatMap(group => group.items),
    []
  );
  const doneCount = checklistItems.filter(item => checked[item.id]).length;
  const donePercent = Math.round((doneCount / checklistItems.length) * 100);

  const shareDay = async (day) => {
    await share({
      title: `${day.day} — ${day.title}`,
      message: `${day.day}\n${day.title}\n\n${day.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      url: APP_CONFIG.shareUrl('/hajj'),
    });
  };

  const shareDua = async (dua) => {
    await share({
      title: dua.title,
      message: `${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}\n\n— ${dua.source}`,
      url: APP_CONFIG.shareUrl('/hajj'),
    });
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 44 }}>

        {/* Hero */}
        <LinearGradient
          colors={[COLORS.primary, '#0C2A1F', COLORS.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="airplane" size={22} color={COLORS.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>THE JOURNEY OF A LIFETIME</Text>
              <Text style={styles.heroTitle}>{HAJJ_INTRO.title}</Text>
            </View>
          </View>
          <Text style={styles.heroArabic}>{HAJJ_INTRO.arabic}</Text>
          <Text style={styles.heroTranslation}>{HAJJ_INTRO.translation}</Text>
          <Text style={styles.heroSource}>{HAJJ_INTRO.source}</Text>
          <Text style={[styles.heroIntro, isUrdu && styles.urdu]}>{HAJJ_INTRO.intro}</Text>
        </LinearGradient>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {TABS.map(item => {
            const active = tab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setTab(item.key)}
                style={[styles.tab, active && styles.tabActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
              >
                <Ionicons name={item.icon} size={14} color={active ? COLORS.bg : COLORS.textSecondary} />
                <Text style={[styles.tabText, active && { color: COLORS.bg }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Overview ─────────────────────────────────────────────────── */}
        {tab === 'overview' ? (
          <>
            <Text style={styles.sectionTitle}>Three ways to perform Hajj</Text>
            <Text style={styles.sectionIntro}>
              The rite that suits you depends on when you arrive and whether you
              intend Umrah before Hajj.
            </Text>
            {HAJJ_TYPES.map(type => (
              <View key={type.id} style={styles.typeCard}>
                <View style={styles.typeHead}>
                  <Text style={styles.typeName}>{type.name}</Text>
                  <Text style={styles.typeArabic}>{type.arabic}</Text>
                </View>
                <Text style={styles.typeSummary}>{type.summary}</Text>
                <Text style={styles.typeDetail}>{type.detail}</Text>
                <View style={styles.typeBest}>
                  <Ionicons name="checkmark-circle-outline" size={13} color={COLORS.emerald} />
                  <Text style={styles.typeBestText}>{type.bestFor}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.sectionTitle}>What ihram asks of you</Text>
            <View style={styles.ruleCard}>
              {IHRAAM_PROHIBITIONS.map(rule => (
                <View key={rule} style={styles.bullet}>
                  <Ionicons name="close-circle-outline" size={14} color={COLORS.red} />
                  <Text style={styles.bulletText}>{rule}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>How Hajj began</Text>
            <View style={styles.historyCard}>
              <Text style={styles.historyText}>{HAJJ_HISTORY}</Text>
            </View>

            <Text style={styles.sectionTitle}>Mistakes to avoid</Text>
            {HAJJ_MISTAKES.map(item => (
              <View key={item.title} style={styles.mistake}>
                <View style={styles.mistakeHead}>
                  <Ionicons name="warning-outline" size={15} color={COLORS.amber} />
                  <Text style={styles.mistakeTitle}>{item.title}</Text>
                </View>
                <Text style={styles.mistakeFix}>{item.fix}</Text>
              </View>
            ))}
          </>
        ) : null}

        {/* ── Day by day ───────────────────────────────────────────────── */}
        {tab === 'days' ? (
          <>
            <Text style={styles.sectionIntro}>
              The order below follows the Prophet’s farewell Hajj. Your group may
              move you between sites at different hours to manage the crowd; the
              rites themselves do not change.
            </Text>
            {HAJJ_DAYS.map((day, index) => {
              const open = openDay === day.id;
              return (
                <View key={day.id} style={[styles.dayCard, open && { borderColor: COLORS.gold + '55' }]}>
                  <TouchableOpacity
                    onPress={() => setOpenDay(open ? null : day.id)}
                    style={styles.dayHead}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={`${day.day}. ${day.title}`}
                  >
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dayDate}>{day.day}</Text>
                      <Text style={styles.dayTitle}>{day.title}</Text>
                    </View>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>

                  {open ? (
                    <View style={styles.dayBody}>
                      <Text style={styles.daySummary}>{day.summary}</Text>
                      {day.steps.map((step, i) => (
                        <View key={step} style={styles.step}>
                          <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                      <View style={styles.tip}>
                        <Ionicons name="bulb-outline" size={14} color={COLORS.gold} />
                        <Text style={styles.tipText}>{day.tip}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => shareDay(day)}
                        style={styles.shareBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Share ${day.day} guide`}
                      >
                        <Ionicons name="share-social-outline" size={15} color={COLORS.gold} />
                        <Text style={styles.shareBtnText}>{t('common.share', 'Share')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        ) : null}

        {/* ── Umrah ────────────────────────────────────────────────────── */}
        {tab === 'umrah' ? (
          <>
            <Text style={styles.sectionIntro}>
              Umrah can be performed at any time of year. It takes a few hours but
              is physically demanding in the heat and crowd.
            </Text>
            {UMRAH_STEPS.map((step, index) => (
              <View key={step.title} style={styles.umrahStep}>
                <View style={styles.umrahRail}>
                  <View style={styles.umrahNum}><Text style={styles.umrahNumText}>{index + 1}</Text></View>
                  {index < UMRAH_STEPS.length - 1 ? <View style={styles.umrahLine} /> : null}
                </View>
                <View style={styles.umrahBody}>
                  <Text style={styles.umrahTitle}>{step.title}</Text>
                  <Text style={styles.umrahText}>{step.detail}</Text>
                </View>
              </View>
            ))}
            <View style={styles.noteCard}>
              <Ionicons name="information-circle-outline" size={17} color={COLORS.gold} />
              <Text style={styles.noteText}>
                Tawaf begins and ends at the Black Stone. Sa‘i begins at Safa and
                ends at Marwah on the seventh lap — not the reverse.
              </Text>
            </View>
          </>
        ) : null}

        {/* ── Duas ─────────────────────────────────────────────────────── */}
        {tab === 'duas' ? HAJJ_DUAS.map(dua => (
          <View key={dua.id} style={styles.duaCard}>
            <View style={styles.duaHead}>
              <Text style={styles.duaTitle}>{dua.title}</Text>
              <TouchableOpacity
                onPress={() => shareDua(dua)}
                style={{ padding: 4 }}
                accessibilityRole="button"
                accessibilityLabel={`Share ${dua.title}`}
              >
                <Ionicons name="share-social-outline" size={16} color={COLORS.gold} />
              </TouchableOpacity>
            </View>
            <Text style={styles.duaWhen}>{dua.when}</Text>
            <Text style={styles.duaArabic}>{dua.arabic}</Text>
            <Text style={styles.duaTranslit}>{dua.transliteration}</Text>
            <Text style={styles.duaTranslation}>{dua.translation}</Text>
            <Text style={styles.duaSource}>{dua.source}</Text>
          </View>
        )) : null}

        {/* ── Checklist ────────────────────────────────────────────────── */}
        {tab === 'checklist' ? (
          <>
            <View style={styles.progressCard}>
              <View style={styles.progressTop}>
                <View>
                  <Text style={styles.progressTitle}>Pilgrim checklist</Text>
                  <Text style={styles.progressSub}>
                    {ready ? `${doneCount} of ${checklistItems.length} complete` : 'Loading…'}
                  </Text>
                </View>
                <Text style={styles.progressPercent}>{ready ? `${donePercent}%` : '—'}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${donePercent}%` }]} />
              </View>
            </View>

            {HAJJ_CHECKLIST.map(group => (
              <View key={group.group} style={{ marginTop: 16 }}>
                <Text style={styles.checkGroup}>{group.group}</Text>
                <View style={styles.checkCard}>
                  {group.items.map(item => {
                    const done = !!checked[item.id];
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => toggleCheck(item.id)}
                        style={styles.checkRow}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: done }}
                        accessibilityLabel={item.label}
                      >
                        <Ionicons
                          name={done ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={done ? COLORS.emerald : COLORS.textSecondary}
                        />
                        <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <Text style={styles.checkNote}>
              Saved on this device. Completing a row does not replace performing
              the rite — it is only a memory aid.
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = COLORS => StyleSheet.create({
  hero: {
    borderRadius: 22, padding: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 1, borderColor: COLORS.gold + '55',
  },
  heroEyebrow: { color: COLORS.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: '#fff', fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 3 },
  heroArabic: {
    fontFamily: 'AmiriQuran', color: '#fff', fontSize: 20, lineHeight: 38,
    textAlign: 'right', writingDirection: 'rtl', marginTop: 18,
  },
  heroTranslation: { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 19, marginTop: 6 },
  heroSource: { color: COLORS.gold, fontSize: 10.5, fontWeight: '700', marginTop: 5 },
  heroIntro: {
    color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 19,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)',
  },
  urdu: { fontFamily: 'NotoNastaliqUrdu', lineHeight: 28, textAlign: 'right' },

  tabRow: { gap: 7, paddingVertical: 16 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  tabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabText: { color: COLORS.textSecondary, fontSize: 11.5, fontWeight: '800' },

  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  sectionIntro: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 19, marginBottom: 12 },

  typeCard: {
    backgroundColor: COLORS.glass, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.glassBorder, padding: 15, marginBottom: 10,
  },
  typeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeName: { color: COLORS.textPrimary, fontSize: 15.5, fontWeight: '800' },
  typeArabic: { color: COLORS.gold, fontSize: 16, fontWeight: '700' },
  typeSummary: { color: COLORS.textPrimary, fontSize: 12.5, lineHeight: 19, marginTop: 7 },
  typeDetail: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 7 },
  typeBest: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10 },
  typeBestText: { flex: 1, color: COLORS.emerald, fontSize: 11, lineHeight: 16, fontWeight: '600' },

  ruleCard: {
    backgroundColor: COLORS.red + '0C', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.red + '28', marginBottom: 8,
  },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  bulletText: { flex: 1, color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 19 },

  historyCard: {
    backgroundColor: COLORS.glass, borderRadius: 16, padding: 15,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  historyText: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 21 },

  mistake: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  mistakeHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mistakeTitle: { flex: 1, color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  mistakeFix: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 5, marginLeft: 23 },

  dayCard: {
    backgroundColor: COLORS.glass, borderRadius: 18, borderWidth: 1,
    borderColor: COLORS.glassBorder, marginBottom: 10, overflow: 'hidden',
  },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  dayBadge: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.gold + '18',
    borderWidth: 1, borderColor: COLORS.gold + '44', alignItems: 'center', justifyContent: 'center',
  },
  dayBadgeText: { color: COLORS.gold, fontSize: 15, fontWeight: '900' },
  dayDate: { color: COLORS.gold, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4 },
  dayTitle: { color: COLORS.textPrimary, fontSize: 14.5, fontWeight: '800', marginTop: 2 },
  dayBody: { paddingHorizontal: 15, paddingBottom: 16, borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: 13 },
  daySummary: { color: COLORS.textPrimary, fontSize: 12.5, lineHeight: 19, marginBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 10 },
  stepNum: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  stepNumText: { color: COLORS.gold, fontSize: 10, fontWeight: '800' },
  stepText: { flex: 1, color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 20 },
  tip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4,
    backgroundColor: COLORS.gold + '0E', borderRadius: 10, padding: 11,
    borderWidth: 1, borderColor: COLORS.gold + '26',
  },
  tipText: { flex: 1, color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.gold + '35', backgroundColor: COLORS.gold + '0D',
  },
  shareBtnText: { color: COLORS.gold, fontSize: 11.5, fontWeight: '700' },

  umrahStep: { flexDirection: 'row', gap: 13 },
  umrahRail: { width: 30, alignItems: 'center' },
  umrahNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.emerald + '18',
    borderWidth: 1, borderColor: COLORS.emerald + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  umrahNumText: { color: COLORS.emerald, fontSize: 12, fontWeight: '900' },
  umrahLine: { width: 1.5, flex: 1, backgroundColor: COLORS.emerald + '30', marginVertical: 4 },
  umrahBody: { flex: 1, paddingBottom: 20 },
  umrahTitle: { color: COLORS.textPrimary, fontSize: 14.5, fontWeight: '800' },
  umrahText: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 20, marginTop: 4 },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4,
    backgroundColor: COLORS.gold + '0D', borderRadius: 13, padding: 13,
    borderWidth: 1, borderColor: COLORS.gold + '28',
  },
  noteText: { flex: 1, color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18 },

  duaCard: {
    backgroundColor: COLORS.glass, borderRadius: 18, borderWidth: 1,
    borderColor: COLORS.glassBorder, padding: 15, marginBottom: 11,
  },
  duaHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  duaTitle: { flex: 1, color: COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  duaWhen: { color: COLORS.gold, fontSize: 10.5, fontWeight: '700', marginTop: 3, lineHeight: 15 },
  duaArabic: {
    fontFamily: 'AmiriQuran', color: COLORS.textPrimary, fontSize: 22,
    lineHeight: 44, textAlign: 'right', writingDirection: 'rtl', marginTop: 12,
  },
  duaTranslit: { color: COLORS.textSecondary, fontSize: 11, fontStyle: 'italic', marginTop: 8, lineHeight: 17 },
  duaTranslation: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 19, marginTop: 6 },
  duaSource: { color: COLORS.textSecondary, fontSize: 10, marginTop: 9, opacity: 0.8 },

  progressCard: {
    backgroundColor: COLORS.glass, borderRadius: 16, padding: 15,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  progressSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  progressPercent: { color: COLORS.emerald, fontSize: 19, fontWeight: '900' },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: COLORS.divider, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.emerald },

  checkGroup: {
    color: COLORS.gold, fontSize: 10.5, fontWeight: '800', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 7, marginLeft: 2,
  },
  checkCard: {
    backgroundColor: COLORS.glass, borderRadius: 15, borderWidth: 1,
    borderColor: COLORS.glassBorder, overflow: 'hidden',
  },
  checkRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 12, paddingHorizontal: 13,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  checkLabel: { flex: 1, color: COLORS.textPrimary, fontSize: 12.5, lineHeight: 18 },
  checkLabelDone: { color: COLORS.textSecondary, textDecorationLine: 'line-through' },
  checkNote: { color: COLORS.textSecondary, fontSize: 10.5, lineHeight: 16, marginTop: 14, opacity: 0.8 },
});
