import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { PROPHETS as PROPHET_DATA, refLabel } from '../data/prophets';
import { localiseProphet, STORY_UI } from '../data/prophetsI18n';
import { quranService, TRANSLATIONS, LANGUAGE_KEYS } from '../services/quranApi';
import { usePreferences } from '../hooks/usePreferences';
import { navigationTarget } from '../config/routes';

/** Verse translations arrive as HTML; the reader shows plain text. */
const stripHtml = text =>
  String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const verseNumber = verse =>
  Number(verse.verse_number) || Number(String(verse.verse_key || '').split(':')[1]);

export default function ProphetsStoriesScreen({ route, navigation }) {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);
  const [prefs, setPrefs] = usePreferences();

  // The stories read in the same five languages as the Quran reader, and the
  // choice is shared: switching here also changes the reader's translation.
  const langKey = TRANSLATIONS[prefs.translationLanguage] ? prefs.translationLanguage : 'en';
  const ui = STORY_UI[langKey] || STORY_UI.en;
  const rtl = Boolean(TRANSLATIONS[langKey]?.rtl);

  const PROPHETS = useMemo(
    () => PROPHET_DATA.map(p => ({ ...localiseProphet(p, langKey), color: COLORS[p.color] || COLORS.gold })),
    [langKey, COLORS]
  );

  const [selected, setSelected] = useState(null);
  const [storyId, setStoryId] = useState(null);
  const [versesBySurah, setVersesBySurah] = useState({});
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyFailed, setStoryFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const listRef = React.useRef(null);

  // Search hits pass `{ id }`; expand that prophet and bring the card into
  // view instead of leaving the user at the top of a long list.
  useEffect(() => {
    const id = route?.params?.id;
    if (!id) return undefined;
    const index = PROPHETS.findIndex(p => String(p.id) === String(id));
    if (index < 0) return undefined;
    setSelected(PROPHETS[index].id);
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
    }, 250);
    return () => clearTimeout(timer);
  }, [route?.params?.id]);

  // Load every distinct surah the open story refers to, once per language.
  useEffect(() => {
    if (!storyId) return undefined;
    let alive = true;
    const prophet = PROPHET_DATA.find(p => p.id === storyId);
    if (!prophet) return undefined;
    const surahs = [...new Set(prophet.refs.map(r => r.surah))];

    setStoryLoading(true);
    setStoryFailed(false);
    Promise.all(
      surahs.map(surah =>
        quranService
          .getVersesByChapter(surah, TRANSLATIONS[langKey].id)
          .then(verses => [surah, verses])
          .catch(() => [surah, []])
      )
    ).then(entries => {
      if (!alive) return;
      const map = Object.fromEntries(entries);
      setVersesBySurah(map);
      setStoryLoading(false);
      // The cache resolves with an empty list when offline and uncached, so
      // "nothing loaded" is an offline state rather than an empty story.
      setStoryFailed(surahs.every(s => !(map[s] || []).length));
    });

    return () => { alive = false; };
  }, [storyId, langKey, reloadToken]);

  const story = storyId ? PROPHETS.find(p => p.id === storyId) || null : null;

  const closeStory = () => setStoryId(null);

  const openInQuran = ref => {
    setStoryId(null);
    // Quran is a tab inside MainTabs, not a drawer sibling — a bare
    // navigate('Quran') from this drawer screen silently does nothing.
    const target = navigationTarget('Quran', { surah: ref.surah, ayah: ref.from });
    navigation?.navigate(target.name, target.params);
  };

  const renderStoryBody = () => {
    if (storyLoading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.gold} />
          <Text style={styles.loadingText}>{ui.loading}</Text>
        </View>
      );
    }

    if (storyFailed) {
      return (
        <View style={styles.failedBox}>
          <Ionicons name="cloud-offline-outline" size={22} color={COLORS.textSecondary} />
          <Text style={[styles.failedText, rtl && styles.rtl]}>{ui.loadFailed}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setReloadToken(n => n + 1)}>
            <Text style={styles.retryText}>{ui.retry}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return story.refs.map(ref => {
      const verses = (versesBySurah[ref.surah] || [])
        .filter(v => {
          const n = verseNumber(v);
          return n >= ref.from && n <= ref.to;
        });
      if (!verses.length) return null;

      return (
        <View key={`${ref.surah}-${ref.from}`} style={styles.refSection}>
          <View style={styles.refHeader}>
            <Text style={styles.refLabel}>{refLabel(ref)}</Text>
            <TouchableOpacity
              style={styles.openBtn}
              onPress={() => openInQuran(ref)}
              accessibilityRole="button"
              accessibilityLabel={`${ui.openInQuran} ${refLabel(ref)}`}
            >
              <Ionicons name="book-outline" size={13} color={COLORS.gold} />
              <Text style={styles.openBtnText}>{ui.openInQuran}</Text>
            </TouchableOpacity>
          </View>

          {verses.map(verse => (
            <View key={verse.verse_key} style={styles.verseBlock}>
              <Text style={styles.verseNumber}>{verse.verse_key}</Text>
              <Text style={styles.verseArabic}>
                {verse.words?.length
                  ? verse.words.map(w => w.text_uthmani).join(' ')
                  : verse.text_uthmani}
              </Text>
              <Text style={[styles.verseTranslation, rtl && styles.rtl]}>
                {stripHtml(verse.translations?.[0]?.text)}
              </Text>
            </View>
          ))}
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <FlatList
        ref={listRef}
        data={PROPHETS}
        keyExtractor={p => p.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        onScrollToIndexFailed={info => {
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
        ListHeaderComponent={() => (
          <>
            <View style={styles.headerCard}>
              <Ionicons name="people" size={32} color="#fff" />
              <Text style={styles.headerTitle}>Stories of the Prophets</Text>
              <Text style={styles.headerSub}>
                {PROPHETS.length} prophets named in the Quran
              </Text>
            </View>

            <View style={styles.languageRow}>
              <Text style={styles.langLabel}>{ui.language}</Text>
              {LANGUAGE_KEYS.map(key => {
                const active = key === langKey;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setPrefs({ translationLanguage: key })}
                    style={[styles.langChip, active && styles.langChipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={TRANSLATIONS[key].native}
                  >
                    <Text style={[styles.langChipText, active && styles.langChipTextOn]}>
                      {TRANSLATIONS[key].native}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.note, rtl && styles.rtl]}>{ui.note}</Text>
          </>
        )}
        renderItem={({ item: prophet }) => {
          const open = selected === prophet.id;
          return (
            <TouchableOpacity
              style={[styles.prophetCard, open && { borderColor: prophet.color }]}
              onPress={() => setSelected(open ? null : prophet.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={[styles.prophetIcon, { backgroundColor: prophet.color + '18' }]}>
                  <Ionicons name={prophet.icon} size={24} color={prophet.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prophetName}>{prophet.name}</Text>
                  <Text style={styles.prophetTitle}>{prophet.title}</Text>
                </View>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </View>

              <View style={styles.metaRow}>
                <View style={styles.inQuranBadge}>
                  <Ionicons name="book" size={10} color={COLORS.gold} />
                  <Text style={styles.inQuranText}>{ui.inQuran}</Text>
                </View>
                <Text style={styles.refsPreview} numberOfLines={1}>
                  {prophet.refs.map(refLabel).join(' · ')}
                </Text>
              </View>

              {open && (
                <View style={styles.prophetDetail}>
                  <Text style={[styles.prophetDesc, rtl && styles.rtl]}>{prophet.desc}</Text>
                  <View style={styles.lessonBox}>
                    <Ionicons name="bulb" size={14} color={COLORS.gold} />
                    <Text style={[styles.lessonText, rtl && styles.rtl]}>{prophet.lesson}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.readBtn}
                    onPress={() => setStoryId(prophet.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${ui.readFull} — ${prophet.name}`}
                  >
                    <Ionicons name="book-outline" size={15} color={COLORS.gold} />
                    <Text style={styles.readBtnText}>{ui.readFull}</Text>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.gold} />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        visible={!!story}
        transparent
        animationType="slide"
        onRequestClose={closeStory}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.storyModal}>
            {story && (
              <>
                <View style={styles.storyHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.storyName}>{story.name}</Text>
                    <Text style={[styles.storySubtitle, rtl && styles.rtl]}>{story.title}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={closeStory}
                    style={styles.closeBtn}
                    accessibilityRole="button"
                    accessibilityLabel={ui.close}
                  >
                    <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.storyBody}>
                  <Text style={[styles.storyIntro, rtl && styles.rtl]}>{story.desc}</Text>

                  <View style={styles.lessonBox}>
                    <Ionicons name="bulb" size={14} color={COLORS.gold} />
                    <Text style={[styles.lessonText, rtl && styles.rtl]}>
                      <Text style={{ fontWeight: '800' }}>{ui.lesson}: </Text>
                      {story.lesson}
                    </Text>
                  </View>

                  <Text style={[styles.sectionLabel, rtl && styles.rtl]}>{ui.storyTitle}</Text>
                  {renderStoryBody()}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  headerCard: {
    padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 16,
    backgroundColor: COLORS.primary, borderWidth: 1, borderColor: COLORS.primary,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 12 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },

  languageRow: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    gap: 8, paddingHorizontal: 4, marginBottom: 12,
  },
  langLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '800', marginRight: 2 },
  langChip: {
    borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glass,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  langChipOn: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  langChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  langChipTextOn: { color: '#111' },

  note: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17, paddingHorizontal: 4, marginBottom: 14 },

  prophetCard: {
    padding: 16, marginBottom: 10,
    borderRadius: 18, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  prophetIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  prophetName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  prophetTitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  inQuranBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.gold + '1F', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  inQuranText: { color: COLORS.gold, fontSize: 10, fontWeight: '800' },
  refsPreview: { flex: 1, color: COLORS.textSecondary, fontSize: 10.5 },

  prophetDetail: { marginTop: 12 },
  prophetDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  lessonBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10, padding: 12,
    borderRadius: 12, backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  lessonText: { flex: 1, color: COLORS.gold, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  readBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginTop: 12, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.gold,
  },
  readBtnText: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },

  rtl: { textAlign: 'right', writingDirection: 'rtl' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  storyModal: {
    maxHeight: '92%', width: '100%',
    backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  storyHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 18,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  storyName: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900' },
  storySubtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 6 },
  storyBody: { padding: 18, paddingBottom: 40 },
  storyIntro: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  sectionLabel: {
    color: COLORS.textPrimary, fontSize: 15, fontWeight: '900',
    marginTop: 20, marginBottom: 10,
  },

  refSection: { marginBottom: 18 },
  refHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  refLabel: { color: COLORS.gold, fontSize: 13, fontWeight: '800' },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  openBtnText: { color: COLORS.gold, fontSize: 11, fontWeight: '700' },

  verseBlock: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  verseNumber: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  verseArabic: {
    color: COLORS.textPrimary, fontSize: 20, lineHeight: 34,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: 6,
  },
  verseTranslation: { color: COLORS.textSecondary, fontSize: 13.5, lineHeight: 21 },

  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  loadingText: { color: COLORS.textSecondary, fontSize: 13 },
  failedBox: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  failedText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.gold,
  },
  retryText: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },
});
