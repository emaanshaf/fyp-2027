// Five pillars, six articles of faith, and how they were established.
//
// The screen is a study guide rather than a reference list: each entry opens
// into what it is, why it matters, how to practise it, its history and the
// evidence behind it. Progress is kept locally, so marking a pillar as learned
// survives a restart without an account.

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
  PILLARS, ARTICLES, PILLAR_TIMELINE, PILLARS_INTRO, FIVE_PILLARS_NOTE,
} from '../data/pillars';

const PROGRESS_KEY = 'qitab_pillars_learned';

const TABS = [
  { key: 'pillars', label: 'Five Pillars', icon: 'business-outline' },
  { key: 'articles', label: 'Six Articles', icon: 'heart-outline' },
  { key: 'history', label: 'History', icon: 'time-outline' },
];

const SECTION_LABELS = {
  en: {
    what: 'What it is',
    why: 'Why it matters',
    practice: 'How to practise',
    history: 'How it began',
    evidence: 'Evidence',
    misread: 'Common misunderstandings',
    rakats: 'Daily rakats',
    fard: 'Fard',
    sunnah: 'Sunnah',
    learned: 'Mark as learned',
    learnedDone: 'Learned',
    progress: 'Your progress',
    read: 'of 5 pillars marked as learned',
    note: 'A note on the two lists',
    articles: 'Articles of faith',
    years: 'Year',
  },
  ur: {
    what: 'یہ کیا ہے',
    why: 'اس کی اہمیت',
    practice: 'اس پر عمل کیسے کریں',
    history: 'آغاز کیسے ہوا',
    evidence: 'دلائل',
    misread: 'عام غلط فہمیاں',
    rakats: 'روزانہ رکعات',
    fard: 'فرض',
    sunnah: 'سنت',
    learned: 'سیکھ لیا',
    learnedDone: 'سیکھ لیا گیا',
    progress: 'آپ کی پیش رفت',
    read: 'پانچ ارکان میں سے سیکھے گئے',
    note: 'دو فہرستوں پر ایک نوٹ',
    articles: 'ارکانِ ایمان',
    years: 'سال',
  },
};

function EvidenceList({ items, COLORS }) {
  return (
    <View style={{ gap: 8 }}>
      {items.map(item => (
        <View key={item.ref} style={{ gap: 3 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}>
            {item.text}
          </Text>
          <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700' }}>
            {item.ref}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function PillarsScreen() {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);
  const { isUrdu, t } = useLanguage();
  const { share } = useShare();
  const L = isUrdu ? SECTION_LABELS.ur : SECTION_LABELS.en;

  const [tab, setTab] = useState('pillars');
  const [openId, setOpenId] = useState('shahada');
  const [learned, setLearned] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PROGRESS_KEY)
      .then(raw => {
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setLearned(parsed);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const toggleLearned = async (id) => {
    const next = learned.includes(id)
      ? learned.filter(x => x !== id)
      : [...learned, id];
    setLearned(next);
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  };

  const percent = useMemo(
    () => Math.round((PILLARS.filter(p => learned.includes(p.id)).length / PILLARS.length) * 100),
    [learned]
  );

  const sharePillar = async (pillar) => {
    await share({
      title: `${pillar.name} — ${pillar.tagline}`,
      message: `${pillar.name} (${pillar.arabicName})\n${pillar.translation}\n\n${pillar.summary}\n\n${pillar.evidence[0]?.text || ''}\n— ${pillar.evidence[0]?.ref || ''}`,
      url: APP_CONFIG.shareUrl('/pillars'),
    });
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 44 }}>

        {/* Hero */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.bgSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="business" size={13} color={COLORS.gold} />
            <Text style={styles.heroBadgeText}>ARKAN AL-ISLAM</Text>
          </View>
          <Text style={styles.heroTitle}>The Five Pillars</Text>
          <Text style={[styles.heroSub, isUrdu && styles.urdu]}>
            {isUrdu
              ? 'وہ بنیادی عبادات جن پر مسلمان کی زندگی کھڑی ہے۔'
              : 'The load-bearing acts of a Muslim life — and the beliefs beneath them.'}
          </Text>

          <View style={styles.hadith}>
            <Text style={styles.hadithArabic}>{PILLARS_INTRO.hadithArabic}</Text>
            <Text style={styles.hadithTranslation}>{PILLARS_INTRO.hadithTranslation}</Text>
            <Text style={styles.hadithSource}>{PILLARS_INTRO.hadithSource}</Text>
          </View>
        </LinearGradient>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHead}>
            <View>
              <Text style={styles.progressTitle}>{L.progress}</Text>
              <Text style={styles.progressSub}>
                {PILLARS.filter(p => learned.includes(p.id)).length}/5 {L.read}
              </Text>
            </View>
            <Text style={styles.progressPercent}>{loaded ? `${percent}%` : '—'}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
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
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={active ? COLORS.bg : COLORS.textSecondary}
                />
                <Text style={[styles.tabText, active && { color: COLORS.bg }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Five pillars ─────────────────────────────────────────────── */}
        {tab === 'pillars' ? PILLARS.map(pillar => {
          const accent = COLORS[pillar.accent] || COLORS.gold;
          const open = openId === pillar.id;
          const done = learned.includes(pillar.id);
          return (
            <View key={pillar.id} style={[styles.card, open && { borderColor: accent + '55' }]}>
              <TouchableOpacity
                onPress={() => setOpenId(open ? null : pillar.id)}
                style={styles.cardHead}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={`${pillar.name}. ${pillar.tagline}`}
              >
                <View style={[styles.numPlate, { backgroundColor: accent + '20', borderColor: accent + '55' }]}>
                  <Text style={[styles.numText, { color: accent }]}>{pillar.number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text style={styles.cardTitle}>{isUrdu ? pillar.nameUr : pillar.name}</Text>
                    {done ? (
                      <Ionicons name="checkmark-circle" size={15} color={COLORS.emerald} />
                    ) : null}
                  </View>
                  <Text style={styles.cardSub}>{isUrdu ? pillar.taglineUr : pillar.tagline}</Text>
                </View>
                <Text style={[styles.cardArabic, { color: accent }]}>{pillar.arabicName}</Text>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              {open ? (
                <View style={styles.cardBody}>
                  <Text style={[styles.summary, isUrdu && styles.urdu]}>
                    {isUrdu ? pillar.summaryUr : pillar.summary}
                  </Text>

                  <View style={[styles.verseBox, { borderLeftColor: accent }]}>
                    <Text style={styles.verseArabic}>{pillar.arabic}</Text>
                    <Text style={styles.verseTranslit}>{pillar.transliteration}</Text>
                    <Text style={styles.verseTranslation}>{pillar.translation}</Text>
                  </View>

                  <Text style={styles.blockTitle}>{L.what}</Text>
                  <Text style={styles.blockText}>{pillar.what}</Text>

                  <Text style={styles.blockTitle}>{L.why}</Text>
                  <Text style={styles.blockText}>{pillar.why}</Text>

                  <Text style={styles.blockTitle}>{L.practice}</Text>
                  {pillar.practice.map(line => (
                    <View key={line} style={styles.bullet}>
                      <View style={[styles.bulletDot, { backgroundColor: accent }]} />
                      <Text style={styles.bulletText}>{line}</Text>
                    </View>
                  ))}

                  {pillar.rakats ? (
                    <>
                      <Text style={styles.blockTitle}>{L.rakats}</Text>
                      <View style={styles.rakaTable}>
                        <View style={[styles.rakaRow, styles.rakaHead]}>
                          <Text style={[styles.rakaCell, styles.rakaCellName]}> </Text>
                          <Text style={styles.rakaCell}>{L.fard}</Text>
                          <Text style={styles.rakaCell}>{L.sunnah}</Text>
                        </View>
                        {pillar.rakats.map(raka => (
                          <View key={raka.name} style={styles.rakaRow}>
                            <View style={styles.rakaCellName}>
                              <Text style={styles.rakaName}>{raka.name}</Text>
                              <Text style={styles.rakaNote}>{raka.note}</Text>
                            </View>
                            <Text style={styles.rakaValue}>{raka.fard}</Text>
                            <Text style={styles.rakaValue}>{raka.sunnah}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : null}

                  <Text style={styles.blockTitle}>{L.history}</Text>
                  <Text style={styles.blockText}>{pillar.history}</Text>

                  <Text style={styles.blockTitle}>{L.evidence}</Text>
                  <EvidenceList items={pillar.evidence} COLORS={COLORS} />

                  <Text style={styles.blockTitle}>{L.misread}</Text>
                  {pillar.misconceptions.map(line => (
                    <Text key={line} style={styles.misread}>• {line}</Text>
                  ))}

                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => toggleLearned(pillar.id)}
                      style={[styles.action, done && { backgroundColor: COLORS.emerald + '1A', borderColor: COLORS.emerald + '55' }]}
                      accessibilityRole="button"
                      accessibilityLabel={`${done ? L.learnedDone : L.learned}: ${pillar.name}`}
                    >
                      <Ionicons
                        name={done ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={done ? COLORS.emerald : COLORS.textSecondary}
                      />
                      <Text style={[styles.actionText, done && { color: COLORS.emerald }]}>
                        {done ? L.learnedDone : L.learned}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => sharePillar(pillar)}
                      style={styles.action}
                      accessibilityRole="button"
                      accessibilityLabel={`Share ${pillar.name}`}
                    >
                      <Ionicons name="share-social-outline" size={16} color={COLORS.gold} />
                      <Text style={styles.actionText}>{t('common.share', 'Share')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>
          );
        }) : null}

        {/* ── Six articles ─────────────────────────────────────────────── */}
        {tab === 'articles' ? (
          <>
            <Text style={styles.sectionIntro}>
              {isUrdu
                ? 'ایمان کے چھ ارکان وہ عقائد ہیں جن پر دین کی عمارت قائم ہے۔'
                : 'The six articles of faith are the beliefs the pillars are built on. The hadith of Jibril lists them alongside the five acts of worship.'}
            </Text>
            {ARTICLES.map(article => {
              const accent = COLORS[article.accent] || COLORS.gold;
              const open = openId === article.id;
              return (
                <View key={article.id} style={[styles.card, open && { borderColor: accent + '55' }]}>
                  <TouchableOpacity
                    onPress={() => setOpenId(open ? null : article.id)}
                    style={styles.cardHead}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={article.name}
                  >
                    <View style={[styles.articleIcon, { backgroundColor: accent + '1C', borderColor: accent + '45' }]}>
                      <Ionicons name={article.icon} size={18} color={accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{isUrdu ? article.nameUr : article.name}</Text>
                      <Text style={styles.cardSub} numberOfLines={open ? 3 : 2}>
                        {article.summary}
                      </Text>
                    </View>
                    <Text style={[styles.articleArabic, { color: accent }]}>{article.arabicName}</Text>
                  </TouchableOpacity>
                  {open ? (
                    <View style={styles.cardBody}>
                      <Text style={styles.blockText}>{article.detail}</Text>
                      <Text style={styles.blockTitle}>{L.evidence}</Text>
                      <EvidenceList items={article.evidence} COLORS={COLORS} />
                      <TouchableOpacity
                        onPress={() => share({
                          title: article.name,
                          message: `${article.name}\n\n${article.summary}\n\n${article.detail}`,
                          url: APP_CONFIG.shareUrl('/pillars'),
                        })}
                        style={[styles.action, { marginTop: 14, alignSelf: 'flex-start' }]}
                        accessibilityRole="button"
                        accessibilityLabel={`Share ${article.name}`}
                      >
                        <Ionicons name="share-social-outline" size={16} color={COLORS.gold} />
                        <Text style={styles.actionText}>{t('common.share', 'Share')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        ) : null}

        {/* ── History ──────────────────────────────────────────────────── */}
        {tab === 'history' ? (
          <>
            <Text style={styles.sectionIntro}>
              {isUrdu
                ? 'یہ ستون ایک ساتھ نازل نہیں ہوئے۔ ہر ایک اپنے وقت پر آیا، جیسے جیسے دعوت پھیلتی گئی۔'
                : 'The pillars were not revealed all at once. Each came at its own stage as the community grew.'}
            </Text>
            <View style={styles.timeline}>
              {PILLAR_TIMELINE.map((item, index) => (
                <View key={item.year} style={styles.timelineRow}>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot} />
                    {index < PILLAR_TIMELINE.length - 1 ? (
                      <View style={styles.timelineLine} />
                    ) : null}
                  </View>
                  <View style={styles.timelineBody}>
                    <View style={styles.timelineMeta}>
                      <Text style={styles.timelineYear}>{item.year}</Text>
                      <Text style={styles.timelineHijri}>{item.hijri}</Text>
                    </View>
                    <Text style={styles.timelineTitle}>{item.title}</Text>
                    <Text style={styles.timelineText}>{item.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Closing note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={17} color={COLORS.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noteTitle}>{L.note}</Text>
            <Text style={styles.noteText}>{FIVE_PILLARS_NOTE}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = COLORS => StyleSheet.create({
  hero: {
    borderRadius: 22, padding: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: 14,
  },
  heroBadgeText: { color: COLORS.gold, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.6 },
  heroTitle: { color: '#fff', fontSize: 25, fontWeight: '900', letterSpacing: -0.6 },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 20, marginTop: 6 },
  urdu: { fontFamily: 'NotoNastaliqUrdu', fontSize: 14, lineHeight: 30, textAlign: 'right' },
  hadith: {
    marginTop: 18, backgroundColor: 'rgba(0,0,0,0.24)', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  hadithArabic: {
    fontFamily: 'AmiriQuran', color: '#fff', fontSize: 20, lineHeight: 38,
    textAlign: 'right', writingDirection: 'rtl',
  },
  hadithTranslation: { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 19, marginTop: 9 },
  hadithSource: { color: COLORS.gold, fontSize: 10.5, fontWeight: '700', marginTop: 8 },

  progressCard: {
    marginTop: 14, backgroundColor: COLORS.glass, borderRadius: 16, padding: 15,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  progressHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTitle: { color: COLORS.textPrimary, fontSize: 13.5, fontWeight: '800' },
  progressSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  progressPercent: { color: COLORS.gold, fontSize: 18, fontWeight: '900' },
  progressTrack: {
    height: 7, borderRadius: 4, backgroundColor: COLORS.divider,
    overflow: 'hidden', marginTop: 12,
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.gold },

  tabs: { flexDirection: 'row', gap: 7, marginTop: 16, marginBottom: 14 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  tabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabText: { color: COLORS.textSecondary, fontSize: 11.5, fontWeight: '800' },
  tabTextUrdu: {},

  card: {
    backgroundColor: COLORS.glass, borderRadius: 18, borderWidth: 1,
    borderColor: COLORS.glassBorder, marginBottom: 10, overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  numPlate: {
    width: 40, height: 40, borderRadius: 13, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
  },
  numText: { fontSize: 16, fontWeight: '900' },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  cardSub: { color: COLORS.textSecondary, fontSize: 11.5, marginTop: 2, lineHeight: 16 },
  cardArabic: { fontSize: 16, fontWeight: '700', marginRight: 2 },
  cardBody: {
    paddingHorizontal: 15, paddingBottom: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  summary: { color: COLORS.textPrimary, fontSize: 13.5, lineHeight: 21, fontWeight: '600' },
  verseBox: {
    borderLeftWidth: 3, backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: 10, padding: 13, marginTop: 14,
  },
  verseArabic: {
    fontFamily: 'AmiriQuran', color: COLORS.textPrimary, fontSize: 21,
    lineHeight: 40, textAlign: 'right', writingDirection: 'rtl',
  },
  verseTranslit: { color: COLORS.textSecondary, fontSize: 11, fontStyle: 'italic', marginTop: 6 },
  verseTranslation: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 19, marginTop: 5 },

  blockTitle: {
    color: COLORS.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1,
    textTransform: 'uppercase', marginTop: 18, marginBottom: 7,
  },
  blockText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 21 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 7 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 8 },
  bulletText: { flex: 1, color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  misread: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 20, marginBottom: 5 },

  rakaTable: {
    borderRadius: 11, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  rakaRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 9,
    paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
    gap: 6,
  },
  rakaHead: { backgroundColor: 'rgba(255,255,255,0.04)' },
  rakaCell: {
    width: 48, textAlign: 'center', color: COLORS.textSecondary,
    fontSize: 10.5, fontWeight: '800', textTransform: 'uppercase',
  },
  rakaCellName: { flex: 1 },
  rakaName: { color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700' },
  rakaNote: { color: COLORS.textSecondary, fontSize: 10, marginTop: 2, lineHeight: 14 },
  rakaValue: { width: 48, textAlign: 'center', color: COLORS.gold, fontSize: 13, fontWeight: '800' },

  actions: { flexDirection: 'row', gap: 8, marginTop: 18 },
  action: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 10, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  actionText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },

  sectionIntro: {
    color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 20, marginBottom: 14,
  },
  articleIcon: {
    width: 40, height: 40, borderRadius: 13, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
  },
  articleArabic: { fontSize: 14, fontWeight: '700', marginLeft: 4 },

  timeline: { marginTop: 4 },
  timelineRow: { flexDirection: 'row', gap: 14 },
  timelineRail: { width: 14, alignItems: 'center' },
  timelineDot: {
    width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.gold,
    marginTop: 4, borderWidth: 2, borderColor: COLORS.bg,
  },
  timelineLine: { width: 1.5, flex: 1, backgroundColor: COLORS.gold + '35', marginTop: 3 },
  timelineBody: { flex: 1, paddingBottom: 24 },
  timelineMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineYear: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },
  timelineHijri: {
    color: COLORS.textSecondary, fontSize: 9.5, fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  timelineTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 5 },
  timelineText: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 20, marginTop: 5 },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 18,
    backgroundColor: COLORS.gold + '10', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.gold + '30',
  },
  noteTitle: { color: COLORS.gold, fontSize: 12, fontWeight: '800', marginBottom: 3 },
  noteText: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18 },
});
