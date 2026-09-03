// Kalimas, wudhu and salah — with the Hanafi and Ja'fari methods side by side.
//
// The school picker is the first control on the screen rather than buried in
// settings: which school a reader follows changes the content materially, and
// presenting one method as the default would quietly take a position.

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { COLORS, globalStyles } from '../theme';
import { KALIMAS, KALIMAS_NOTE } from '../data/kalimas';
import {
  SCHOOLS, WUDHU, SALAH, WUDHU_DIFFERENCES, SALAH_DIFFERENCES, FIQH_DISCLAIMER,
} from '../data/fiqh';

const TABS = [
  { key: 'kalimas', label: 'Kalimas', icon: 'sparkles-outline' },
  { key: 'wudhu', label: 'Wudhu', icon: 'water-outline' },
  { key: 'salah', label: 'Salah', icon: 'body-outline' },
];

const KIND_LABEL = { fard: 'Obligatory', sunnah: 'Sunnah' };

export default function LearnWorshipScreen() {
  const [tab, setTab] = useState('kalimas');
  const [school, setSchool] = useState('hanafi');
  const [openKalima, setOpenKalima] = useState(1);
  const [speakingId, setSpeakingId] = useState(null);

  const speak = (id, arabic) => {
    if (speakingId === id) {
      try { Speech.stop(); } catch { /* nothing speaking */ }
      setSpeakingId(null);
      return;
    }
    try { Speech.stop(); } catch { /* nothing speaking */ }
    setSpeakingId(id);
    Speech.speak(arabic, {
      language: 'ar-SA',
      rate: 0.8,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  React.useEffect(() => () => {
    try { Speech.stop(); } catch { /* nothing speaking */ }
  }, []);

  const wudhu = WUDHU[school];
  const salah = SALAH[school];

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Section tabs */}
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              accessibilityRole="button"
              accessibilityLabel={t.label}
            >
              <Ionicons
                name={t.icon} size={15}
                color={tab === t.key ? '#000' : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, tab === t.key && { color: '#000' }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* School picker — only relevant to the practice guides. */}
        {tab !== 'kalimas' ? (
          <View style={styles.schools}>
            {SCHOOLS.map(sc => (
              <TouchableOpacity
                key={sc.key}
                onPress={() => setSchool(sc.key)}
                style={[styles.school, school === sc.key && styles.schoolActive]}
                accessibilityRole="button"
                accessibilityLabel={`${sc.name} school`}
              >
                <Text style={[styles.schoolArabic, school === sc.key && { color: COLORS.gold }]}>
                  {sc.arabic}
                </Text>
                <Text style={[styles.schoolName, school === sc.key && { color: COLORS.gold }]}>
                  {sc.name}
                </Text>
                <Text style={styles.schoolDetail}>{sc.detail}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* ── Kalimas ──────────────────────────────────────────────────── */}
        {tab === 'kalimas' ? (
          <>
            <View style={styles.note}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.noteText}>{KALIMAS_NOTE}</Text>
            </View>

            {KALIMAS.map(k => {
              const open = openKalima === k.id;
              return (
                <View key={k.id} style={styles.card}>
                  <TouchableOpacity
                    onPress={() => setOpenKalima(open ? null : k.id)}
                    style={styles.cardHead}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`${k.name}, ${k.meaning}`}
                  >
                    <View style={styles.num}><Text style={styles.numText}>{k.id}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{k.name}</Text>
                      <Text style={styles.cardSub}>{k.meaning}</Text>
                    </View>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={16} color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>

                  {open ? (
                    <View style={styles.cardBody}>
                      <Text style={styles.arabic}>{k.arabic}</Text>
                      <Text style={styles.translit}>{k.transliteration}</Text>
                      <Text style={styles.translation}>{k.translation}</Text>
                      {k.note ? <Text style={styles.kalimaNote}>{k.note}</Text> : null}

                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={styles.action}
                          onPress={() => speak(k.id, k.arabic)}
                          accessibilityRole="button"
                          accessibilityLabel={`Listen to ${k.name}`}
                        >
                          <Ionicons
                            name={speakingId === k.id ? 'stop-circle' : 'volume-high-outline'}
                            size={15}
                            color={speakingId === k.id ? COLORS.emerald : COLORS.cyan}
                          />
                          <Text style={styles.actionText}>
                            {speakingId === k.id ? 'Stop' : 'Listen'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.action}
                          onPress={() => Share.share({
                            message: `${k.arabic}\n\n${k.transliteration}\n\n${k.translation}\n\n— ${k.name} | Qitab-e-Noor`,
                          }).catch(() => {})}
                          accessibilityRole="button"
                          accessibilityLabel={`Share ${k.name}`}
                        >
                          <Ionicons name="share-outline" size={15} color={COLORS.gold} />
                          <Text style={styles.actionText}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        ) : null}

        {/* ── Wudhu ────────────────────────────────────────────────────── */}
        {tab === 'wudhu' ? (
          <>
            <Text style={styles.intro}>{wudhu.intro}</Text>

            {wudhu.steps.map((step, i) => (
              <View key={step.title} style={styles.step}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.stepHead}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    {step.kind ? (
                      <Text style={[
                        styles.kind,
                        step.kind === 'fard' ? styles.kindFard : styles.kindSunnah,
                      ]}>
                        {KIND_LABEL[step.kind]}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.stepBody}>{step.detail}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.sectionTitle}>What breaks wudhu</Text>
            {wudhu.nullifiers.map(n => (
              <View key={n} style={styles.bullet}>
                <Ionicons name="close-circle-outline" size={14} color={COLORS.red} />
                <Text style={styles.bulletText}>{n}</Text>
              </View>
            ))}

            <DiffTable rows={WUDHU_DIFFERENCES} />
          </>
        ) : null}

        {/* ── Salah ────────────────────────────────────────────────────── */}
        {tab === 'salah' ? (
          <>
            <Text style={styles.intro}>{salah.intro}</Text>

            {salah.steps.map((step, i) => (
              <View key={step.title} style={styles.step}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepBody}>{step.detail}</Text>
                </View>
              </View>
            ))}

            <DiffTable rows={SALAH_DIFFERENCES} />
          </>
        ) : null}

        {tab !== 'kalimas' ? (
          <View style={styles.disclaimer}>
            <Ionicons name="alert-circle-outline" size={15} color={COLORS.amber} />
            <Text style={styles.disclaimerText}>{FIQH_DISCLAIMER}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Side-by-side comparison, so neither school is presented as the footnote. */
function DiffTable({ rows }) {
  return (
    <View style={styles.diff}>
      <Text style={styles.sectionTitle}>Where the schools differ</Text>
      <View style={styles.diffHead}>
        <Text style={[styles.diffCell, styles.diffPoint]} />
        <Text style={[styles.diffCell, styles.diffHeadText]}>Hanafi</Text>
        <Text style={[styles.diffCell, styles.diffHeadText]}>Ja'fari</Text>
      </View>
      {rows.map(r => (
        <View key={r.point} style={styles.diffRow}>
          <Text style={[styles.diffCell, styles.diffPoint]}>{r.point}</Text>
          <Text style={styles.diffCell}>{r.hanafi}</Text>
          <Text style={styles.diffCell}>{r.jafari}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  tabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabText: { color: COLORS.textSecondary, fontSize: 12.5, fontWeight: '700' },

  schools: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  school: {
    flex: 1, padding: 12, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.bgSecondary,
  },
  schoolActive: { borderColor: COLORS.gold, backgroundColor: COLORS.gold + '10' },
  schoolArabic: { color: COLORS.textPrimary, fontSize: 17, lineHeight: 30, writingDirection: 'rtl' },
  schoolName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 1 },
  schoolDetail: { color: COLORS.textSecondary, fontSize: 10.5, lineHeight: 15, marginTop: 4 },

  note: {
    flexDirection: 'row', gap: 8, padding: 12, borderRadius: 11, marginBottom: 14,
    backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  noteText: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17, flex: 1 },

  card: {
    borderRadius: 14, marginBottom: 10, backgroundColor: COLORS.bgSecondary,
    borderWidth: 1, borderColor: COLORS.glassBorder, overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  num: {
    width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.gold + '1F', borderWidth: 1, borderColor: COLORS.gold + '3D',
  },
  numText: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },
  cardTitle: { color: COLORS.textPrimary, fontSize: 14.5, fontWeight: '800' },
  cardSub: { color: COLORS.textSecondary, fontSize: 11.5, marginTop: 1 },
  cardBody: {
    paddingHorizontal: 14, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: 14,
  },
  arabic: {
    color: COLORS.gold, fontSize: 21, lineHeight: 44,
    textAlign: 'right', writingDirection: 'rtl',
  },
  translit: { color: COLORS.textPrimary, fontSize: 13, lineHeight: 20, marginTop: 10, fontStyle: 'italic' },
  translation: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
  kalimaNote: { color: COLORS.cyan, fontSize: 11.5, lineHeight: 17, marginTop: 8 },

  actions: {
    flexDirection: 'row', gap: 8, marginTop: 14,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  action: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 9,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  actionText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },

  intro: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  step: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.gold + '1F',
  },
  stepNumText: { color: COLORS.gold, fontSize: 11, fontWeight: '800' },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stepTitle: { color: COLORS.textPrimary, fontSize: 13.5, fontWeight: '800' },
  stepBody: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 19, marginTop: 3 },
  kind: {
    fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 999, overflow: 'hidden',
  },
  kindFard: { color: COLORS.emerald, backgroundColor: COLORS.emerald + '1A' },
  kindSunnah: { color: COLORS.blue, backgroundColor: COLORS.blue + '1A' },

  sectionTitle: {
    color: COLORS.textPrimary, fontSize: 14, fontWeight: '800',
    marginTop: 18, marginBottom: 10,
  },
  bullet: { flexDirection: 'row', gap: 8, marginBottom: 7, alignItems: 'flex-start' },
  bulletText: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 19, flex: 1 },

  diff: { marginTop: 8 },
  diffHead: { flexDirection: 'row', gap: 8, paddingBottom: 6 },
  diffHeadText: { color: COLORS.gold, fontWeight: '800', fontSize: 11 },
  diffRow: {
    flexDirection: 'row', gap: 8, paddingVertical: 9,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  diffCell: { flex: 1, color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17 },
  diffPoint: { flex: 0.7, color: COLORS.textPrimary, fontWeight: '700' },

  disclaimer: {
    flexDirection: 'row', gap: 8, marginTop: 22, padding: 13, borderRadius: 11,
    backgroundColor: COLORS.amber + '10', borderWidth: 1, borderColor: COLORS.amber + '2E',
  },
  disclaimerText: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 18, flex: 1 },
});
