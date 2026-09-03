import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, TextInput, Share, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../theme';
import { quranService, TRANSLATIONS as QURAN_TRANSLATIONS } from '../services/quranApi';
import { fetchTafsir, sourcesForLanguage, htmlToText } from '../services/tafsirApi';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferences } from '../hooks/usePreferences';

const TRANSLATIONS = Object.fromEntries(
  Object.entries(QURAN_TRANSLATIONS).map(([lang, t]) => [lang, t.id])
);

// Colours cycle per source so the picker stays readable however many
// commentaries the selected language offers.
const SOURCE_COLORS = [COLORS.gold, COLORS.emerald, COLORS.cyan, COLORS.purple];

// Sentinel for "fetched, but this commentary genuinely isn't available".
const UNAVAILABLE = '__UNAVAILABLE__';

export default function TafsirScreen({ navigation }) {
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [selectedTafsir, setSelectedTafsir] = useState('ibnKathir');
  const [tafsirTexts, setTafsirTexts] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('en');
  const [langReady, setLangReady] = useState(false);
  const [expandedVerse, setExpandedVerse] = useState(null);
  const [playingKey, setPlayingKey] = useState(null);
  const [notes, setNotes] = useState({});
  const [noteFor, setNoteFor] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const soundRef = useRef(null);
  const [prefs, setPrefs] = usePreferences();

  // Commentaries available in the chosen reading language. Arabic and Urdu
  // have their own; every other language falls back to the English set.
  const sources = useMemo(() => {
    const forLang = sourcesForLanguage(language);
    const list = forLang.length ? forLang : sourcesForLanguage('en');
    return list.map((s, i) => ({ ...s, color: SOURCE_COLORS[i % SOURCE_COLORS.length] }));
  }, [language]);

  useEffect(() => { loadSurahs(); }, []);

  // Adopt the reading language chosen in the Quran reader once, so the two
  // screens agree instead of each keeping their own idea of "the language".
  useEffect(() => {
    if (!langReady && prefs.translationLanguage) {
      setLanguage(prefs.translationLanguage);
      setLangReady(true);
    }
  }, [prefs.translationLanguage, langReady]);

  // The language picker previously existed only as state — nothing called
  // setLanguage, so the five translations were unreachable. Changing it now
  // refetches the surah in that language.
  const languageRef = useRef(language);
  useEffect(() => {
    if (languageRef.current === language) return;
    languageRef.current = language;
    if (selectedSurah) loadVerses(selectedSurah.id);
  }, [language, selectedSurah]);

  // Keep the selected commentary valid when the language changes.
  useEffect(() => {
    if (sources.length && !sources.some(s => s.key === selectedTafsir)) {
      setSelectedTafsir(sources[0].key);
      setTafsirTexts({});
    }
  }, [sources, selectedTafsir]);

  // Notes are per-ayah and shared with the Quran reader's note store, so a
  // note written here shows up there too rather than living in a second place.
  useEffect(() => {
    AsyncStorage.getItem('qitab_notes').then(v => v && setNotes(JSON.parse(v)));
  }, []);

  const saveNote = async () => {
    const next = { ...notes };
    if (noteDraft.trim()) next[noteFor] = noteDraft.trim();
    else delete next[noteFor];
    setNotes(next);
    await AsyncStorage.setItem('qitab_notes', JSON.stringify(next));
    setNoteFor(null);
    setNoteDraft('');
  };

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch { /* already gone */ }
      soundRef.current = null;
    }
    setPlayingKey(null);
  }, []);

  // Recitation stops when the screen is left; otherwise it keeps playing with
  // nothing on screen to stop it.
  useEffect(() => stopAudio, [stopAudio]);

  /** Plays one ayah with the qari chosen in the Quran reader's settings. */
  const playVerse = async (verse) => {
    if (playingKey === verse.verse_key) { await stopAudio(); return; }
    await stopAudio();
    setPlayingKey(verse.verse_key);

    const [chapter, num] = verse.verse_key.split(':').map(Number);
    const url = await quranService.getVerseAudioUrl(
      prefs.reciterId, chapter, num, verse.id
    );
    if (!url) { setPlayingKey(null); return; }

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(st => {
        if (st.didJustFinish || st.error) {
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) soundRef.current = null;
          setPlayingKey(null);
        }
      });
    } catch {
      setPlayingKey(null);
    }
  };

  const loadSurahs = async () => {
    setLoading(true);
    try {
      setSurahs(await quranService.getChapters());
    } finally {
      setLoading(false);
    }
  };

  const loadVerses = async (surah) => {
    setLoadingVerses(true);
    try {
      setVerses(await quranService.getVersesByChapter(surah, TRANSLATIONS[language]));
    } finally { setLoadingVerses(false); }
  };

  const loadTafsir = async (verseKey, sourceKey) => {
    const { text, available } = await fetchTafsir(verseKey, sourceKey);
    setTafsirTexts(prev => ({
      ...prev,
      // Commentary is scripture-adjacent: when it genuinely cannot be
      // fetched, say so rather than substituting invented text.
      [`${verseKey}_${sourceKey}`]: available ? text : UNAVAILABLE,
    }));
  };

  const onSelectSurah = (surah) => {
    setSelectedSurah(surah);
    setVerses([]);
    setTafsirTexts({});
    setExpandedVerse(null);
    loadVerses(surah.id);
  };

  const toggleVerse = (verseKey) => {
    const isOpen = expandedVerse === verseKey;
    setExpandedVerse(isOpen ? null : verseKey);
    if (!isOpen && !tafsirTexts[`${verseKey}_${selectedTafsir}`]) {
      loadTafsir(verseKey, selectedTafsir);
    }
  };

  const shareTafsir = async (verseKey) => {
    const t = tafsirTexts[`${verseKey}_${selectedTafsir}`];
    if (!t || t === UNAVAILABLE) return;
    const text = `--- ${activeSource?.name} ---\n${t}`;
    try { await Share.share({ message: `${verseKey}\n\n${text}\n\n— Tafsir | Qitab-e-Noor` }); } catch {}
  };

  const activeSource = sources.find(s => s.key === selectedTafsir);

  const filteredSurahs = surahs.filter(s =>
    !search || s.name_simple?.toLowerCase().includes(search.toLowerCase()) ||
    s.id?.toString() === search
  );

  if (!selectedSurah) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <View style={styles.searchBar}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={COLORS.textSecondary} />
            <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
              placeholder="Search surah..." placeholderTextColor={COLORS.textSecondary} />
          </View>
        </View>
        <FlatList
          data={filteredSurahs}
          keyExtractor={s => s.id.toString()}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          renderItem={({ item: s }) => (
            <TouchableOpacity style={styles.surahCard} onPress={() => onSelectSurah(s)}>
              <View style={styles.surahNum}><Text style={styles.surahNumText}>{s.id}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.surahName}>{s.name_arabic || s.name_simple}</Text>
                <Text style={styles.surahInfo}>{s.name_simple} • {s.verses_count} verses</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setSelectedSurah(null); setVerses([]); }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>{selectedSurah.name_arabic || ''} {selectedSurah.name_simple}</Text>
          <Text style={styles.headerSub}>{selectedSurah.verses_count} verses • Tafsir</Text>
        </View>
      </View>

      {/* The five reading languages. This picker did not exist — `language`
          was state nothing could change, so only English was ever shown. */}
      <View style={styles.langPicker}>
        {Object.entries(QURAN_TRANSLATIONS).map(([key, t]) => (
          <TouchableOpacity
            key={key}
            onPress={() => { setLanguage(key); setPrefs({ translationLanguage: key }); }}
            style={[styles.langChip, language === key && styles.langChipActive]}
            accessibilityRole="button"
            accessibilityLabel={`Read translation in ${t.name}`}
          >
            <Text style={[styles.langChipText, language === key && { color: '#000' }]}>
              {t.native}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tafsirPicker}>
        {sources.map(s => (
          <TouchableOpacity key={s.key} onPress={() => setSelectedTafsir(s.key)}
            style={[styles.tafsirBtn, selectedTafsir === s.key && { backgroundColor: s.color + '20', borderColor: s.color }]}>
            <Text style={[styles.tafsirBtnText, selectedTafsir === s.key && { color: s.color }]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingVerses ? (
        <View style={{ flex: 1, ...globalStyles.center }}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={v => v.verse_key}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          renderItem={({ item: v }) => {
            const isOpen = expandedVerse === v.verse_key;
            const tafsirText = tafsirTexts[`${v.verse_key}_${selectedTafsir}`];
            return (
              <TouchableOpacity style={[styles.verseCard, isOpen && styles.verseCardOpen]}
                onPress={() => toggleVerse(v.verse_key)} activeOpacity={0.8}>
                <View style={globalStyles.spaceBetween}>
                  <View style={styles.verseNumBadge}>
                    <Text style={styles.verseNumText}>{v.verse_key}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => playVerse(v)}
                      style={{ padding: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Play ayah ${v.verse_key}`}
                    >
                      <Ionicons
                        name={playingKey === v.verse_key ? 'pause-circle' : 'play-circle-outline'}
                        size={18}
                        color={playingKey === v.verse_key ? COLORS.gold : COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { setNoteFor(v.verse_key); setNoteDraft(notes[v.verse_key] || ''); }}
                      style={{ padding: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Note on ayah ${v.verse_key}`}
                    >
                      <Ionicons
                        name={notes[v.verse_key] ? 'document-text' : 'create-outline'}
                        size={16}
                        color={notes[v.verse_key] ? COLORS.emerald : COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => shareTafsir(v.verse_key)} style={{ padding: 4 }}>
                      <Ionicons name="share-outline" size={14} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textSecondary} />
                  </View>
                </View>

                {v.text_uthmani ? (
                  <Text style={styles.arabicText}>{v.text_uthmani}</Text>
                ) : null}

                {v.translations?.[0]?.text ? (
                  <>
                    <Text style={styles.translationText}>
                      {htmlToText(v.translations[0].text)}
                    </Text>
                    <Text style={styles.translationBy}>
                      {QURAN_TRANSLATIONS[language]?.author}
                    </Text>
                  </>
                ) : null}

                {notes[v.verse_key] ? (
                  <View style={styles.noteBox}>
                    <Ionicons name="document-text-outline" size={12} color={COLORS.emerald} />
                    <Text style={styles.noteText}>{notes[v.verse_key]}</Text>
                  </View>
                ) : null}

                {isOpen && (
                  <View style={styles.tafsirBox}>
                    <View style={[styles.tafsirLabel, { backgroundColor: activeSource?.color + '15' }]}>
                      <Ionicons name="book" size={12} color={activeSource?.color} />
                      <Text style={[styles.tafsirLabelText, { color: activeSource?.color }]}>
                        {activeSource?.name}
                      </Text>
                    </View>
                    {!tafsirText ? (
                      <ActivityIndicator color={COLORS.gold} size="small" style={{ marginVertical: 12 }} />
                    ) : tafsirText === UNAVAILABLE ? (
                      <View style={styles.tafsirEmpty}>
                        <Ionicons name="cloud-offline-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.tafsirEmptyText}>
                          This commentary hasn't been saved yet. Connect once and it stays available offline.
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.tafsirText}>{tafsirText}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
      {/* Note editor. Writes to the same store the Quran reader uses. */}
      <Modal visible={!!noteFor} transparent animationType="slide"
        onRequestClose={() => setNoteFor(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.noteModal}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 14 }]}>
              <Text style={styles.noteModalTitle}>Note on {noteFor}</Text>
              <TouchableOpacity onPress={() => setNoteFor(null)}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.noteInput}
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="What stood out to you in this ayah?"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Note text"
            />
            <TouchableOpacity
              style={styles.noteSave}
              onPress={saveNote}
              accessibilityRole="button"
              accessibilityLabel="Save note"
            >
              <Text style={styles.noteSaveText}>
                {noteDraft.trim() ? 'Save note' : 'Delete note'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  langPicker: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 12, paddingBottom: 8,
  },
  langChip: {
    borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 999,
    paddingHorizontal: 11, paddingVertical: 5,
  },
  langChipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  langChipText: { color: COLORS.textSecondary, fontSize: 11.5, fontWeight: '700' },
  translationBy: {
    color: COLORS.textSecondary, fontSize: 10.5, marginTop: 5, opacity: 0.8,
  },
  noteBox: {
    flexDirection: 'row', gap: 7, marginTop: 10, padding: 10, borderRadius: 9,
    backgroundColor: COLORS.emerald + '12',
    borderWidth: 1, borderColor: COLORS.emerald + '2E',
  },
  noteText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, flex: 1 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  noteModal: {
    backgroundColor: COLORS.bgSecondary, borderTopLeftRadius: 22,
    borderTopRightRadius: 22, padding: 20, paddingBottom: 34,
  },
  noteModalTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  noteInput: {
    minHeight: 110, color: COLORS.textPrimary, fontSize: 14, lineHeight: 21,
    borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 12, padding: 12,
  },
  noteSave: {
    marginTop: 14, height: 46, borderRadius: 12, backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  noteSaveText: { color: '#000', fontSize: 14, fontWeight: '800' },
  tafsirEmpty: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 10,
  },
  tafsirEmptyText: {
    flex: 1, color: COLORS.textSecondary, fontSize: 13, lineHeight: 19,
  },
  searchBar: { padding: 12, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.glass, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.glassBorder, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  surahCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    backgroundColor: COLORS.glass, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.glassBorder, marginBottom: 8,
  },
  surahNum: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  surahNumText: { color: COLORS.gold, fontWeight: '800', fontSize: 13 },
  surahName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  surahInfo: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder, backgroundColor: COLORS.bgSecondary,
  },
  headerTitle: { color: COLORS.gold, fontSize: 18, fontWeight: '800' },
  headerSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  tafsirPicker: {
    flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 6,
  },
  tafsirBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.glassBorder, alignItems: 'center', backgroundColor: COLORS.glass,
  },
  tafsirBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  verseCard: {
    padding: 16, backgroundColor: COLORS.glass, borderRadius: 18, borderWidth: 1,
    borderColor: COLORS.glassBorder, marginBottom: 10,
  },
  verseCardOpen: { borderColor: COLORS.gold },
  verseNumBadge: {
    backgroundColor: 'rgba(255, 255, 255,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  verseNumText: { color: COLORS.gold, fontWeight: '800', fontSize: 11 },
  arabicText: {
    color: COLORS.textPrimary, fontSize: 22, marginTop: 12, textAlign: 'right',
    lineHeight: 36, writingDirection: 'rtl',
  },
  translationText: {
    color: COLORS.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 20,
    fontStyle: 'italic',
  },
  tafsirBox: {
    marginTop: 14, padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  tafsirLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  tafsirLabelText: { fontSize: 11, fontWeight: '800' },
  tafsirText: { color: '#e2e8f0', fontSize: 13, lineHeight: 22 },
});
