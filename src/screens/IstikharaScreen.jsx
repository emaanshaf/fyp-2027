// Istikhara guide and a private decision journal.
//
// The journal is stored only on this device. A decision is often sensitive,
// so there is no account requirement and no server call.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
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
  ISTIKHARA_INTRO, ISTIKHARA_WHEN, ISTIKHARA_STEPS, ISTIKHARA_DUA,
  ISTIKHARA_SIGNS, ISTIKHARA_MISTAKES, ISTIKHARA_FAQ,
} from '../data/istikhara';

const JOURNAL_KEY = 'qitab_istikhara_journal';

const TABS = [
  { key: 'guide', label: 'Guide', icon: 'book-outline' },
  { key: 'dua', label: 'The Dua', icon: 'heart-outline' },
  { key: 'journal', label: 'Journal', icon: 'create-outline' },
];

export default function IstikharaScreen() {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);
  const { isUrdu } = useLanguage();
  const { share } = useShare();

  const [tab, setTab] = useState('guide');
  const [openFaq, setOpenFaq] = useState(0);
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [decision, setDecision] = useState('');
  const [detail, setDetail] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(JOURNAL_KEY)
      .then(raw => {
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setEntries(parsed);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = async (next) => {
    setEntries(next);
    await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(next));
  };

  const addEntry = async () => {
    const text = decision.trim();
    if (!text) return;
    const entry = {
      id: `istikhara-${Date.now()}`,
      decision: text,
      detail: detail.trim(),
      createdAt: new Date().toISOString(),
      answered: false,
    };
    await persist([entry, ...entries]);
    setDecision('');
    setDetail('');
  };

  const toggleAnswered = async (id) => {
    await persist(entries.map(entry => (
      entry.id === id ? { ...entry, answered: !entry.answered } : entry
    )));
  };

  const removeEntry = async (id) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    await persist(entries.filter(entry => entry.id !== id));
    setConfirmId(null);
  };

  const shareDua = async () => {
    await share({
      title: 'Dua of Istikhara',
      message: `${ISTIKHARA_DUA.arabic}\n\n${ISTIKHARA_DUA.transliteration}\n\n${ISTIKHARA_DUA.translation}\n\n— ${ISTIKHARA_DUA.source}`,
      url: APP_CONFIG.shareUrl('/istikhara'),
    });
  };

  const openCount = useMemo(
    () => entries.filter(entry => !entry.answered).length,
    [entries]
  );

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 44 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <LinearGradient
          colors={[COLORS.primary, '#152A22', COLORS.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="compass" size={24} color={COLORS.gold} />
          </View>
          <Text style={styles.heroEyebrow}>SEEK THE BETTER CHOICE</Text>
          <Text style={styles.heroTitle}>{ISTIKHARA_INTRO.title}</Text>
          <Text style={styles.heroArabic}>{ISTIKHARA_INTRO.arabicTitle}</Text>
          <Text style={[styles.heroTagline, isUrdu && styles.urdu]}>
            {isUrdu ? ISTIKHARA_INTRO.taglineUr : ISTIKHARA_INTRO.tagline}
          </Text>
          <Text style={[styles.heroSummary, isUrdu && styles.urdu]}>
            {isUrdu ? ISTIKHARA_INTRO.summaryUr : ISTIKHARA_INTRO.summary}
          </Text>
          <Text style={styles.heroSource}>{ISTIKHARA_INTRO.source}</Text>
        </LinearGradient>

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
                <Ionicons name={item.icon} size={15} color={active ? COLORS.bg : COLORS.textSecondary} />
                <Text style={[styles.tabText, active && { color: COLORS.bg }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Guide ────────────────────────────────────────────────────── */}
        {tab === 'guide' ? (
          <>
            <Text style={styles.sectionTitle}>When it applies</Text>
            {ISTIKHARA_WHEN.map(item => (
              <View key={item.title} style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Ionicons name={item.icon} size={17} color={COLORS.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>{item.title}</Text>
                  <Text style={styles.infoText}>{item.text}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.sectionTitle}>How to pray it</Text>
            <View style={styles.stepsCard}>
              {ISTIKHARA_STEPS.map((step, index) => (
                <View key={step.title} style={styles.step}>
                  <View style={styles.stepRail}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>{index + 1}</Text></View>
                    {index < ISTIKHARA_STEPS.length - 1 ? <View style={styles.stepLine} /> : null}
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepText}>{step.detail}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>How guidance may appear</Text>
            {ISTIKHARA_SIGNS.map(sign => (
              <View key={sign.title} style={styles.signCard}>
                <View style={styles.signHead}>
                  <Ionicons name="sparkles-outline" size={14} color={COLORS.emerald} />
                  <Text style={styles.signTitle}>{sign.title}</Text>
                </View>
                <Text style={styles.signText}>{sign.text}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Mistakes to avoid</Text>
            {ISTIKHARA_MISTAKES.map(item => (
              <View key={item.title} style={styles.mistake}>
                <View style={styles.mistakeHead}>
                  <Ionicons name="warning-outline" size={14} color={COLORS.amber} />
                  <Text style={styles.mistakeTitle}>{item.title}</Text>
                </View>
                <Text style={styles.mistakeFix}>{item.fix}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Common questions</Text>
            {ISTIKHARA_FAQ.map((item, index) => {
              const open = openFaq === index;
              return (
                <TouchableOpacity
                  key={item.q}
                  onPress={() => setOpenFaq(open ? null : index)}
                  style={styles.faq}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={item.q}
                >
                  <View style={styles.faqHead}>
                    <Text style={styles.faqQ}>{item.q}</Text>
                    <Ionicons
                      name={open ? 'remove' : 'add'}
                      size={17}
                      color={COLORS.gold}
                    />
                  </View>
                  {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </>
        ) : null}

        {/* ── Dua ──────────────────────────────────────────────────────── */}
        {tab === 'dua' ? (
          <>
            <View style={styles.duaCard}>
              <View style={styles.duaTop}>
                <Text style={styles.duaLabel}>THE DUA TAUGHT BY THE PROPHET ﷺ</Text>
                <TouchableOpacity
                  onPress={shareDua}
                  style={{ padding: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel="Share the istikhara dua"
                >
                  <Ionicons name="share-social-outline" size={17} color={COLORS.gold} />
                </TouchableOpacity>
              </View>
              <Text style={styles.duaArabic}>{ISTIKHARA_DUA.arabic}</Text>
              <View style={styles.divider} />
              <Text style={styles.translit}>{ISTIKHARA_DUA.transliteration}</Text>
              <Text style={styles.translation}>{ISTIKHARA_DUA.translation}</Text>
              <Text style={styles.duaSource}>{ISTIKHARA_DUA.source}</Text>
            </View>

            <View style={styles.noteCard}>
              <Ionicons name="information-circle-outline" size={17} color={COLORS.gold} />
              <Text style={styles.noteText}>{ISTIKHARA_DUA.note}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setTab('journal')}
              style={styles.primaryBtn}
              accessibilityRole="button"
              accessibilityLabel="Open the decision journal"
            >
              <Ionicons name="create-outline" size={17} color={COLORS.bg} />
              <Text style={styles.primaryBtnText}>Record this decision</Text>
            </TouchableOpacity>
            <Text style={styles.helper}>
              The journal keeps your question and notes on this device only.
            </Text>
          </>
        ) : null}

        {/* ── Journal ──────────────────────────────────────────────────── */}
        {tab === 'journal' ? (
          <>
            <View style={styles.journalHead}>
              <View>
                <Text style={styles.sectionTitle}>Decision journal</Text>
                <Text style={styles.journalSub}>
                  {loaded
                    ? `${entries.length} saved · ${openCount} seeking guidance`
                    : 'Loading your entries…'}
                </Text>
              </View>
              <Ionicons name="lock-closed-outline" size={16} color={COLORS.textSecondary} />
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formLabel}>What are you deciding?</Text>
              <TextInput
                style={styles.input}
                value={decision}
                onChangeText={setDecision}
                placeholder="e.g. Accept the job offer in another city"
                placeholderTextColor={COLORS.textSecondary}
                accessibilityLabel="Decision"
              />
              <Text style={[styles.formLabel, { marginTop: 12 }]}>Options and notes</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={detail}
                onChangeText={setDetail}
                placeholder="Option A… Option B… What matters most to you?"
                placeholderTextColor={COLORS.textSecondary}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Decision notes"
              />
              <TouchableOpacity
                onPress={addEntry}
                style={[styles.primaryBtn, !decision.trim() && styles.primaryBtnDisabled]}
                disabled={!decision.trim()}
                accessibilityRole="button"
                accessibilityLabel="Save decision"
              >
                <Ionicons name="add-circle-outline" size={17} color={COLORS.bg} />
                <Text style={styles.primaryBtnText}>Save and make dua</Text>
              </TouchableOpacity>
            </View>

            {entries.length === 0 && loaded ? (
              <View style={styles.empty}>
                <Ionicons name="compass-outline" size={30} color={COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>No decisions yet</Text>
                <Text style={styles.emptyText}>
                  Write the choice you are facing, pray two rakats, then make the
                  dua. Return here to record how it unfolds.
                </Text>
              </View>
            ) : null}

            {entries.map(entry => (
              <View key={entry.id} style={styles.entry}>
                <View style={styles.entryTop}>
                  <View style={[styles.statusDot, {
                    backgroundColor: entry.answered ? COLORS.emerald : COLORS.gold,
                  }]} />
                  <Text style={styles.entryDate}>
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <Text style={[styles.status, {
                    color: entry.answered ? COLORS.emerald : COLORS.gold,
                  }]}>
                    {entry.answered ? 'Answered' : 'Seeking'}
                  </Text>
                </View>
                <Text style={styles.entryDecision}>{entry.decision}</Text>
                {entry.detail ? <Text style={styles.entryDetail}>{entry.detail}</Text> : null}
                <View style={styles.entryActions}>
                  <TouchableOpacity
                    onPress={() => toggleAnswered(entry.id)}
                    style={styles.entryBtn}
                    accessibilityRole="button"
                    accessibilityLabel={entry.answered ? 'Mark as still seeking' : 'Mark as answered'}
                  >
                    <Ionicons
                      name={entry.answered ? 'refresh-outline' : 'checkmark-circle-outline'}
                      size={14}
                      color={entry.answered ? COLORS.textSecondary : COLORS.emerald}
                    />
                    <Text style={styles.entryBtnText}>
                      {entry.answered ? 'Still seeking' : 'Mark answered'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeEntry(entry.id)}
                    style={styles.entryBtn}
                    accessibilityRole="button"
                    accessibilityLabel={confirmId === entry.id ? 'Confirm delete' : 'Delete entry'}
                  >
                    <Ionicons
                      name={confirmId === entry.id ? 'alert-circle-outline' : 'trash-outline'}
                      size={14}
                      color={COLORS.red}
                    />
                    <Text style={[styles.entryBtnText, { color: COLORS.red }]}>
                      {confirmId === entry.id ? 'Tap to delete' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={styles.helper}>
              Entries are stored with AsyncStorage on this device. They are not
              sent to the server and are removed if you clear app data.
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
  heroIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.26)', borderWidth: 1, borderColor: COLORS.gold + '55',
    marginBottom: 14,
  },
  heroEyebrow: { color: COLORS.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.6, marginTop: 3 },
  heroArabic: { fontFamily: 'AmiriQuran', color: COLORS.gold, fontSize: 20, marginTop: 2 },
  heroTagline: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 8 },
  heroSummary: { color: 'rgba(255,255,255,0.76)', fontSize: 12, lineHeight: 19, marginTop: 8 },
  heroSource: { color: COLORS.gold, fontSize: 10.5, fontWeight: '700', marginTop: 10 },
  urdu: { fontFamily: 'NotoNastaliqUrdu', lineHeight: 29, textAlign: 'right' },

  tabs: { flexDirection: 'row', gap: 7, marginTop: 16, marginBottom: 14 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  tabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabText: { color: COLORS.textSecondary, fontSize: 11.5, fontWeight: '800' },

  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 10 },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 14,
    backgroundColor: COLORS.glass, borderRadius: 15, borderWidth: 1,
    borderColor: COLORS.glassBorder, marginBottom: 9,
  },
  infoIcon: {
    width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.gold + '15',
  },
  infoTitle: { color: COLORS.textPrimary, fontSize: 13.5, fontWeight: '800' },
  infoText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 4 },

  stepsCard: {
    backgroundColor: COLORS.glass, borderRadius: 17, borderWidth: 1,
    borderColor: COLORS.glassBorder, padding: 15,
  },
  step: { flexDirection: 'row', gap: 12 },
  stepRail: { width: 26, alignItems: 'center' },
  stepNum: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.gold + '18',
    borderWidth: 1, borderColor: COLORS.gold + '45',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: COLORS.gold, fontSize: 11, fontWeight: '900' },
  stepLine: { width: 1.5, flex: 1, backgroundColor: COLORS.gold + '28', marginVertical: 4 },
  stepBody: { flex: 1, paddingBottom: 18 },
  stepTitle: { color: COLORS.textPrimary, fontSize: 13.5, fontWeight: '800' },
  stepText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 4 },

  signCard: {
    backgroundColor: COLORS.emerald + '0A', borderRadius: 14, padding: 13,
    borderWidth: 1, borderColor: COLORS.emerald + '26', marginBottom: 8,
  },
  signHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  signTitle: { flex: 1, color: COLORS.emerald, fontSize: 12.5, fontWeight: '800' },
  signText: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18, marginTop: 5 },

  mistake: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  mistakeHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  mistakeTitle: { flex: 1, color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700' },
  mistakeFix: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18, marginTop: 4, marginLeft: 21 },

  faq: {
    backgroundColor: COLORS.glass, borderRadius: 13, borderWidth: 1,
    borderColor: COLORS.glassBorder, padding: 13, marginBottom: 8,
  },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  faqQ: { flex: 1, color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700', lineHeight: 18 },
  faqA: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18, marginTop: 8 },

  duaCard: {
    backgroundColor: COLORS.glass, borderRadius: 20, padding: 17,
    borderWidth: 1, borderColor: COLORS.gold + '35',
  },
  duaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  duaLabel: { color: COLORS.gold, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.2 },
  duaArabic: {
    fontFamily: 'AmiriQuran', color: COLORS.textPrimary, fontSize: 22,
    lineHeight: 45, textAlign: 'right', writingDirection: 'rtl', marginTop: 14,
  },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 14 },
  translit: { color: COLORS.textSecondary, fontSize: 11.5, fontStyle: 'italic', lineHeight: 18 },
  translation: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 20, marginTop: 10 },
  duaSource: { color: COLORS.gold, fontSize: 10.5, fontWeight: '700', marginTop: 12 },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12,
    backgroundColor: COLORS.gold + '0D', borderRadius: 13, padding: 13,
    borderWidth: 1, borderColor: COLORS.gold + '28',
  },
  noteText: { flex: 1, color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 13, marginTop: 14,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: COLORS.bg, fontSize: 13, fontWeight: '800' },
  helper: { color: COLORS.textSecondary, fontSize: 10.5, lineHeight: 16, marginTop: 9, opacity: 0.8 },

  journalHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  journalSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: -4, marginBottom: 10 },

  formCard: {
    backgroundColor: COLORS.glass, borderRadius: 17, padding: 15,
    borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 14,
  },
  formLabel: {
    color: COLORS.textSecondary, fontSize: 10.5, fontWeight: '800',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10,
    color: COLORS.textPrimary, fontSize: 13,
  },
  textarea: { minHeight: 84, lineHeight: 19 },

  empty: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 10 },
  emptyText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 6 },

  entry: {
    backgroundColor: COLORS.glass, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 10,
  },
  entryTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  entryDate: { color: COLORS.textSecondary, fontSize: 10.5, fontWeight: '600' },
  status: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  entryDecision: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 8 },
  entryDetail: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 5 },
  entryActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  entryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: COLORS.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  entryBtnText: { color: COLORS.textSecondary, fontSize: 10.5, fontWeight: '700' },
});
