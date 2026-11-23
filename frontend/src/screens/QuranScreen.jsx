import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  Modal, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { getItem, setItem } from '../firebase/syncedStorage';
import { usePreferences } from '../hooks/usePreferences';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { backend } from '../services/backend';
import { hasAuthToken } from '../services/authToken';
import { useShare } from '../context/ShareContext';
import { APP_CONFIG } from '../config/appConfig';
import * as Speech from 'expo-speech';
import {
  quranService, TRANSLATIONS, RECITERS, TARJAMA_AUDIO, hasRecitedTranslation,
  isPerVerseOnly,
} from '../services/quranApi';

/** Translations arrive with footnote markup (<sup>, <a>) that must not render. */
const stripHtml = t => (t || '').replace(/<[^>]*>/g, '').trim();

/**
 * Bookmarks are stored as an array of "surah:ayah" keys, but older builds and
 * the sample library stored a `{ "surah:ayah": true }` map. Reading the map as
 * an array crashed the reader on `bookmarks.includes`.
 */
const bookmarkKeys = raw => {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed.filter(k => typeof k === 'string');
    if (parsed && typeof parsed === 'object') return Object.keys(parsed).filter(k => parsed[k]);
  } catch { /* corrupt value — treat as no bookmarks */ }
  return [];
};

/**
 * Reader settings (translation language + reciter).
 *
 * Extracted because it used to live only in the reader branch of the render,
 * below `if (!activeChapter) return ...`. The surah list has its own settings
 * button, so pressing it set the flag but mounted no modal — the language
 * picker was unreachable until you had opened a surah. Both branches now
 * render this one component.
 */
function ReaderSettingsModal({
  visible, onClose, langKey, reciterId, onSelectLanguage, onSelectReciter,
}) {
  const [qariQuery, setQariQuery] = useState('');

  // 22 qaris is past the point where scrolling alone is usable, so the list
  // is filterable by English name, Arabic name or style.
  const filteredQaris = React.useMemo(() => {
    const q = qariQuery.trim().toLowerCase();
    if (!q) return RECITERS;
    return RECITERS.filter(r =>
      `${r.name} ${r.arabic || ''} ${r.style || ''}`.toLowerCase().includes(q)
    );
  }, [qariQuery]);

  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  return (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={() => onClose()}>
    <View style={styles.modalOverlay}>
      <View style={styles.noteModal}>
        <View style={[globalStyles.spaceBetween, { marginBottom: 20 }]}>
          <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 18 }}>Reader Settings</Text>
          <TouchableOpacity onPress={() => onClose()}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* The language list and qari list together are taller than a phone
            screen. The modal had no height bound, so it grew past the top edge
            and the languages — the first thing in the body — were the part
            that got cut off. Bound the sheet and scroll its body. */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flexGrow: 0, flexShrink: 1 }}
        >
          <Text style={globalStyles.label}>TRANSLATION LANGUAGE</Text>
          {Object.entries(TRANSLATIONS).map(([key, t]) => (
            <TouchableOpacity
              key={key}
              onPress={() => { onSelectLanguage(key); }}
              style={[styles.settingRow, langKey === key && { borderColor: COLORS.gold, backgroundColor: COLORS.glass }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: langKey === key ? COLORS.gold : COLORS.textPrimary, fontWeight: '700' }}>
                  {t.native} <Text style={{ color: COLORS.textSecondary, fontWeight: '500' }}>· {t.name}</Text>
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{t.author}</Text>
                {/* Says up front whether Tarjama will be a recitation or the
                    device voice, rather than surprising the user on play. */}
                <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 2, opacity: 0.8 }}>
                  {hasRecitedTranslation(key)
                    ? `Tarjama recited by ${TARJAMA_AUDIO[key].reciter}`
                    : 'Tarjama read by device voice'}
                </Text>
              </View>
              {langKey === key && <Ionicons name="checkmark-circle" size={18} color={COLORS.gold} />}
            </TouchableOpacity>
          ))}

          <View style={{ height: 1, backgroundColor: COLORS.glassBorder, marginVertical: 16 }} />

          <Text style={globalStyles.label}>QARI · {RECITERS.length} RECITERS</Text>
          <Text style={styles.qariHint}>
            Search by name, or scroll. Qaris marked “verse by verse” are stitched
            ayah by ayah — the reader follows along as they recite.
          </Text>

          <View style={styles.qariSearch}>
            <Ionicons name="search" size={14} color={COLORS.textSecondary} />
            <TextInput
              style={styles.qariSearchInput}
              value={qariQuery}
              onChangeText={setQariQuery}
              placeholder="Search qari"
              placeholderTextColor={COLORS.textSecondary}
              accessibilityLabel="Search qari"
            />
            {qariQuery ? (
              <TouchableOpacity onPress={() => setQariQuery('')}>
                <Ionicons name="close-circle" size={15} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {filteredQaris.length === 0 ? (
            <Text style={styles.qariEmpty}>No qari matches “{qariQuery}”.</Text>
          ) : filteredQaris.map(r => {
            const active = String(reciterId) === String(r.id);
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => { onSelectReciter(r.id); }}
                style={[styles.settingRow, active && { borderColor: COLORS.emerald, backgroundColor: COLORS.glass }]}
                accessibilityRole="button"
                accessibilityLabel={`${r.name}${r.style ? ', ' + r.style : ''}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: active ? COLORS.emerald : COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>
                    {r.name}
                  </Text>
                  {r.arabic ? (
                    <Text style={styles.qariArabic}>{r.arabic}</Text>
                  ) : null}
                  <View style={styles.qariTags}>
                    {r.style ? (
                      <Text style={[styles.qariTag, { color: COLORS.amber }]}>{r.style}</Text>
                    ) : null}
                    <Text style={styles.qariTag}>
                      {r.perVerseOnly ? 'verse by verse' : 'full surah + verse'}
                    </Text>
                  </View>
                </View>
                {active && <Ionicons name="checkmark-circle" size={18} color={COLORS.emerald} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  </Modal>
  );
}

export default function QuranScreen({ route }) {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);
  const { share } = useShare();

  const [chapters, setChapters] = useState([]);
  const [search, setSearch] = useState('');
  const [activeChapter, setActiveChapter] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Seeded from Settings, then adjustable per-session from the reader's own
  // controls. `prefsReady` gates the seed so the defaults do not overwrite a
  // choice the user just made here.
  const [prefs, setPrefs, prefsReady] = usePreferences();
  const [langKey, setLangKey] = useState('en');
  const [reciterId, setReciterId] = useState(7);
  const seeded = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerseAudio, setCurrentVerseAudio] = useState(null);
  // Recitation followed by its translation, advancing through the surah.
  const [playTarjama, setPlayTarjama] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [speakingKey, setSpeakingKey] = useState(null);

  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState({});
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const soundRef = useRef(null);
  // Cancellation is a ref, not state: the playback loop and the expo-av
  // status callback both need the current value, and state captured in those
  // closures would be stale by the time the user hits stop.
  const cancelledRef = useRef(false);
  // Search results and deep links land here with `{ surah, ayah }`. The ayah
  // is applied only once its verses have loaded, then cleared so a later
  // manual scroll is not undone.
  const readerListRef = useRef(null);
  // Caps estimate-then-retry loops when a far-off index still has no rows.
  const jumpRetryRef = useRef(0);
  const [pendingAyah, setPendingAyah] = useState(null);
  // The ayah a deep link asked to land on. Unlike `pendingAyah` (cleared after
  // the scroll), this stays set so the list keeps mounting enough rows for the
  // jump to be measurable — ScrollToIndex cannot target an unrendered row.
  const [readAnchor, setReadAnchor] = useState(null);
  // Which surah `verses` currently belongs to. A deep link switches the
  // chapter first and the fetch resolves later; without this the scroll
  // effect saw the *previous* surah's verses, decided the ayah was out of
  // range and threw the pending request away.
  const [versesChapterId, setVersesChapterId] = useState(null);

  useEffect(() => {
    loadChapters();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const hasToken = await hasAuthToken();
      if (hasToken) {
        try {
          const [apiBookmarks, apiNotes] = await Promise.all([
            backend.getBookmarks(), backend.getNotes(),
          ]);
          const bmKeys = (apiBookmarks || []).map(b => `${b.surah_number}:${b.ayah_number}`);
          setBookmarks(bmKeys);
          const notesMap = {};
          (apiNotes || []).forEach(n => {
            if (n.surah_number && n.ayah_number) notesMap[`${n.surah_number}:${n.ayah_number}`] = n.content;
          });
          setNotes(notesMap);
          return;
        } catch { /* fall through */ }
      }
      getItem('qitab_bookmarks').then(v => v && setBookmarks(bookmarkKeys(v))).catch(() => {});
      getItem('qitab_notes').then(v => v && setNotes(JSON.parse(v))).catch(() => {});
    } catch {
      getItem('qitab_bookmarks').then(v => v && setBookmarks(bookmarkKeys(v))).catch(() => {});
      getItem('qitab_notes').then(v => v && setNotes(JSON.parse(v))).catch(() => {});
    }
  };

  useEffect(() => {
    if (!prefsReady || seeded.current) return;
    seeded.current = true;
    setLangKey(prefs.translationLanguage);
    setReciterId(prefs.reciterId);
    setPlayTarjama(prefs.autoPlayTarjama);
    setContinuous(prefs.continuousPlay);
  }, [prefsReady, prefs]);

  // The app language can change while this reader is already mounted (drawer
  // toggle, Settings tab), and Settings can change the default translation.
  // Follow the preference after the first seed so the verses are refetched in
  // the newly chosen language instead of staying in English until a remount.
  useEffect(() => {
    if (!prefsReady || !seeded.current) return;
    setLangKey(prev => (
      prefs.translationLanguage === prev ? prev : prefs.translationLanguage
    ));
  }, [prefsReady, prefs.translationLanguage]);

  useEffect(() => {
    if (activeChapter) loadVerses(activeChapter.id);
  }, [activeChapter, langKey]);

  // Open the surah named by a deep link or search result. Waits for the
  // chapter list because `/quran/2` can arrive before it has downloaded.
  useEffect(() => {
    const surah = Number(route?.params?.surah);
    if (!surah || !chapters.length) return;
    const chapter = chapters.find(c => Number(c.id) === surah);
    if (chapter) setActiveChapter(prev => (prev?.id === surah ? prev : chapter));
  }, [chapters, route?.params?.surah]);

  useEffect(() => {
    const surah = Number(route?.params?.surah);
    const ayah = Number(route?.params?.ayah);
    if (!surah || !ayah) return;
    setPendingAyah({ surah, ayah });
    setReadAnchor(ayah - 1);
  }, [route?.params?.surah, route?.params?.ayah]);

  // Picking a different surah clears the anchor so the list starts from the
  // top; the deep link that set it is exempt.
  useEffect(() => {
    if (pendingAyah?.surah === activeChapter?.id) return;
    setReadAnchor(null);
  }, [activeChapter?.id]);

  useEffect(() => {
    if (!pendingAyah || !verses.length) return;
    if (activeChapter?.id !== pendingAyah.surah) return;
    // The array can still hold the chapter we just navigated away from.
    if (versesChapterId !== pendingAyah.surah) return;
    const index = pendingAyah.ayah - 1;
    // Some modes page verses in; never scroll to a position the loaded page
    // does not contain.
    if (index < 0 || index >= verses.length) {
      setPendingAyah(null);
      return undefined;
    }
    jumpRetryRef.current = 0;
    const timer = setTimeout(() => {
      readerListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.05 });
      setPendingAyah(null);
    }, 320);
    return () => clearTimeout(timer);
  }, [pendingAyah, verses, versesChapterId, activeChapter]);

  const loadChapters = async () => {
    setLoadingChapters(true);
    setError(null);
    try {
      const data = await quranService.getChapters();
      setChapters(data);
    } catch {
      setError('Could not load chapters. Check your internet connection.');
    } finally { setLoadingChapters(false); }
  };

  const loadVerses = async (chId) => {
    setLoading(true);
    setVerses([]);
    setVersesChapterId(null);
    try {
      const data = await quranService.getVersesByChapter(chId, TRANSLATIONS[langKey].id);
      setVerses(data);
      setVersesChapterId(chId);
    } catch (e) {
      console.warn('Failed to load verses:', e);
    } finally { setLoading(false); }
  };


  /**
   * The surah-level play button. With tarjama or continuous mode on it walks
   * the verse list; otherwise it streams the single whole-surah recording,
   * which is one request instead of hundreds.
   */
  const toggleAudio = async () => {
    if (isPlaying) { await stopAll(); return; }

    if (playTarjama || continuous) {
      await playFrom(0);
      return;
    }
    // islamic.network qaris publish per-ayah audio only. Rather than leaving
    // the play button inert for them, stitch the surah together verse by verse.
    if (isPerVerseOnly(reciterId)) {
      await playFrom(0, { forceContinuous: true });
      return;
    }

    await stopAll();
    cancelledRef.current = false;
    const url = await quranService.getAudioUrl(activeChapter.id, reciterId);
    if (!url) {
      // No surah file and not a known per-verse qari: fall back rather than
      // silently doing nothing.
      await playFrom(0, { forceContinuous: true });
      return;
    }
    setIsPlaying(true);
    await playUrl(url);
    if (!cancelledRef.current) setIsPlaying(false);
  };

  /** Stops every audio source — the player, and any in-flight speech. */
  const stopAll = useCallback(async () => {
    cancelledRef.current = true;
    try { Speech.stop(); } catch { /* no speech in progress */ }
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch { /* already gone */ }
      soundRef.current = null;
    }
    setIsPlaying(false);
    setCurrentVerseAudio(null);
    setSpeakingKey(null);
  }, []);

  /** Plays one URL and resolves when it finishes (or fails). */
  const playUrl = (uri) =>
    new Promise(resolve => {
      Audio.Sound.createAsync({ uri }, { shouldPlay: true })
        .then(({ sound }) => {
          soundRef.current = sound;
          sound.setOnPlaybackStatusUpdate(st => {
            if (st.didJustFinish || st.error) {
              sound.unloadAsync().catch(() => {});
              if (soundRef.current === sound) soundRef.current = null;
              resolve();
            }
          });
        })
        .catch(err => {
          console.warn('Audio failed:', err?.message);
          resolve();
        });
    });

  /**
   * Speaks text with the device voice. Used for Malay and Indonesian, which
   * have no recited translation published on the CDN.
   */
  const speakText = (text, locale) =>
    new Promise(resolve => {
      if (!text) return resolve();
      Speech.speak(text, {
        language: locale,
        onDone: resolve,
        onStopped: resolve,
        onError: resolve,
      });
    });

  /** Plays the translation of one verse — recited where available, else TTS. */
  const playTranslation = async (verse) => {
    const key = `${activeChapter.id}:${verse.verse_number}`;
    const url = quranService.getTarjamaAudioUrl(langKey, verse.id);
    if (url) {
      await playUrl(url);
      return;
    }
    setSpeakingKey(key);
    const text = stripHtml(verse.translations?.[0]?.text || '');
    await speakText(text, TRANSLATIONS[langKey]?.locale);
    setSpeakingKey(null);
  };

  /**
   * Plays from `startIndex` to the end of the surah.
   *
   * Each verse is recitation first, then translation if tarjama is on. The
   * loop checks `cancelledRef` between every step so stopping is immediate
   * rather than waiting out the current clip.
   */
  const playFrom = async (startIndex, { forceContinuous = false } = {}) => {
    await stopAll();
    cancelledRef.current = false;
    setIsPlaying(true);

    const list = (continuous || forceContinuous)
      ? verses.slice(startIndex)
      : [verses[startIndex]];
    for (const verse of list) {
      if (cancelledRef.current || !verse) break;
      const key = `${activeChapter.id}:${verse.verse_number}`;
      setCurrentVerseAudio(key);

      const recitation = await quranService.getVerseAudioUrl(
        reciterId, activeChapter.id, verse.verse_number, verse.id
      );
      if (cancelledRef.current) break;
      if (recitation) await playUrl(recitation);

      if (cancelledRef.current) break;
      if (playTarjama) await playTranslation(verse);
    }

    if (!cancelledRef.current) {
      setIsPlaying(false);
      setCurrentVerseAudio(null);
    }
  };

  // These live below stopAll deliberately: a dependency array is evaluated
  // during render, so referencing the callback before its `const` is
  // initialised would throw on every mount.
  //
  // Audio is fetched at play time rather than preloaded, so changing reciter
  // or language mid-surah simply stops what is playing.
  useEffect(() => { stopAll(); }, [reciterId, langKey, activeChapter, stopAll]);

  // Leaving the reader must silence both the player and any speech.
  useEffect(() => () => { stopAll(); }, [stopAll]);

  /** Plays just the translation of one verse. */
  const playTranslationOnly = async (verse) => {
    await stopAll();
    cancelledRef.current = false;
    setIsPlaying(true);
    await playTranslation(verse);
    if (!cancelledRef.current) setIsPlaying(false);
  };

  const playVerseAudio = async (chapterId, verseNum) => {
    const index = verses.findIndex(v => v.verse_number === verseNum);
    if (index === -1) return;
    // Tapping the verse that is already playing pauses it.
    if (currentVerseAudio === `${chapterId}:${verseNum}` && isPlaying) {
      await stopAll();
      return;
    }
    await playFrom(index);
  };

  const toggleBookmark = async (key) => {
    const next = bookmarks.includes(key) ? bookmarks.filter(b => b !== key) : [...bookmarks, key];
    setBookmarks(next);
    await setItem('qitab_bookmarks', JSON.stringify(next));
    const hasToken = await hasAuthToken();
    if (hasToken) {
      try {
        const [surah, ayah] = key.split(':');
        if (next.includes(key)) {
          await backend.addBookmark({
            surah_number: parseInt(surah), ayah_number: parseInt(ayah),
            surah_name: activeChapter?.name_simple,
          });
        }
      } catch { /* backend unavailable */ }
    }
  };

  const shareVerse = (verse, index) => {
    const ayah = index + 1;
    const ref = `${activeChapter?.name_simple || 'Quran'} ${activeChapter?.id}:${ayah}`;
    const arabic = verse.text_uthmani
      || (verse.words || []).map(w => w.text_uthmani).join(' ');
    const translation = stripHtml(verse.translations?.[0]?.text);
    share({
      title: ref,
      message: `${arabic}\n\n"${translation}"\n— ${ref}`,
      url: APP_CONFIG.shareVerse(`${activeChapter?.id}:${ayah}`),
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChapters();
    await loadData();
    setRefreshing(false);
  };

  const filteredChapters = chapters.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name_simple.toLowerCase().includes(q) ||
      c.translated_name?.name?.toLowerCase().includes(q) ||
      c.id.toString() === q.trim();
  });

  const translationLabel = TRANSLATIONS[langKey]?.name || 'English';

  // Both the surah list and the reader render the same settings modal.
  const settingsModalProps = {
    visible: showSettings,
    onClose: () => setShowSettings(false),
    langKey,
    reciterId,
    onSelectLanguage: key => {
      setLangKey(key);
      setPrefs({ translationLanguage: key });
      setShowSettings(false);
    },
    onSelectReciter: id => {
      setReciterId(id);
      setPrefs({ reciterId: id });
      setShowSettings(false);
    },
  };
  const reciterLabel = RECITERS.find(r => r.id === reciterId)?.name || 'Al-Afasy';

  // Chapter list view
  if (!activeChapter) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <View style={styles.topBar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search 114 Surahs..."
              placeholderTextColor={COLORS.textSecondary}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={styles.settingsBtn}
            accessibilityRole="button"
            accessibilityLabel="Translation language and reciter"
          >
            <Ionicons name="options-outline" size={18} color={COLORS.gold} />
          </TouchableOpacity>
        </View>

        {/* Active language/reciter indicator */}
        <View style={styles.indicatorRow}>
          <View style={styles.indicatorChip}>
            <Ionicons name="language-outline" size={12} color={COLORS.gold} />
            <Text style={styles.indicatorText}>{translationLabel}</Text>
          </View>
          <View style={styles.indicatorChip}>
            <Ionicons name="mic-outline" size={12} color={COLORS.emerald} />
            <Text style={styles.indicatorText}>{reciterLabel}</Text>
          </View>
        </View>

        {error ? (
          <View style={{ flex: 1, ...globalStyles.center }}>
            <Ionicons name="cloud-offline-outline" size={48} color={COLORS.red} />
            <Text style={{ color: COLORS.textSecondary, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }}>{error}</Text>
            <TouchableOpacity onPress={loadChapters} style={{ marginTop: 16, backgroundColor: COLORS.gold, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}>
              <Text style={{ color: '#000', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loadingChapters ? (
          <View style={{ flex: 1, ...globalStyles.center }}>
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Loading all 114 Surahs...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredChapters}
            keyExtractor={c => c.id.toString()}
            contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item: ch }) => (
              <TouchableOpacity
                onPress={() => setActiveChapter(ch)}
                activeOpacity={0.75}
                style={styles.chapterRow}
              >
                <View style={styles.chapterNum}>
                  <Text style={{ color: COLORS.gold, fontSize: 13, fontWeight: '800' }}>{ch.id}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 }}>{ch.name_simple}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                    {ch.translated_name?.name} • {ch.verses_count} verses • {ch.revelation_place}
                  </Text>
                </View>
                <Text style={{ color: COLORS.gold, fontSize: 20 }}>{ch.name_arabic}</Text>
              </TouchableOpacity>
            )}
          />
        )}
        <ReaderSettingsModal {...settingsModalProps} />
      </SafeAreaView>
    );
  }

  // Verse reader view
  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <View style={styles.readerHeader}>
        <TouchableOpacity onPress={() => { setActiveChapter(null); soundRef.current?.stopAsync(); setIsPlaying(false); setCurrentVerseAudio(null); }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{activeChapter.name_simple}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
            {activeChapter.translated_name?.name} • {activeChapter.verses_count} verses • {translationLabel}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={{ marginRight: 8 }}>
          <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleAudio}
          style={[styles.playBtn, { backgroundColor: isPlaying ? 'rgba(255,255,255,0.16)' : '#fff' }]}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={isPlaying ? '#fff' : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {activeChapter.id !== 9 && (
        <View style={styles.basmalah}>
          <Text style={styles.basmalahText}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</Text>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, ...globalStyles.center }}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Loading verses in {translationLabel}...</Text>
        </View>
      ) : (
        <>
        {/* Playback options. Tarjama plays each verse's translation after its
            recitation — recited where an edition exists, spoken by the device
            voice for Malay and Indonesian, which have none. */}
        <View style={styles.audioBar}>
          <TouchableOpacity
            style={[styles.audioChip, playTarjama && styles.audioChipOn]}
            onPress={() => { setPlayTarjama(v => !v); stopAll(); }}
          >
            <Ionicons
              name={playTarjama ? 'language' : 'language-outline'}
              size={14}
              color={playTarjama ? COLORS.bg : COLORS.textSecondary}
            />
            <Text style={[styles.audioChipText, playTarjama && { color: COLORS.bg }]}>
              Tarjama
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.audioChip, continuous && styles.audioChipOn]}
            onPress={() => { setContinuous(v => !v); stopAll(); }}
          >
            <Ionicons
              name={continuous ? 'repeat' : 'repeat-outline'}
              size={14}
              color={continuous ? COLORS.bg : COLORS.textSecondary}
            />
            <Text style={[styles.audioChipText, continuous && { color: COLORS.bg }]}>
              Continuous
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <Text style={styles.audioSource} numberOfLines={1}>
            {playTarjama
              ? hasRecitedTranslation(langKey)
                ? TARJAMA_AUDIO[langKey].reciter
                : 'Device voice'
              : reciterLabel}
          </Text>
        </View>

        <FlatList
          // Re-mount when a deep link sets an anchor so the target row is in
          // the initial render window and therefore measurable.
          key={`reader-${activeChapter?.id ?? 0}-${readAnchor ?? 'top'}`}
          ref={readerListRef}
          initialNumToRender={readAnchor != null ? Math.min(verses.length, readAnchor + 5) : 10}
          data={verses}
          keyExtractor={v => v.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={styles.verseDivider} />}
          // Variable-height verse cards cannot be measured ahead of time, so
          // an exact jump can fail. Scroll to an estimated offset first, then
          // retry the exact index once the rows around it have rendered —
          // otherwise the estimate alone lands several verses short.
          onScrollToIndexFailed={info => {
            if (jumpRetryRef.current >= 8) return;
            jumpRetryRef.current += 1;
            const estimate = info.averageItemLength * info.index;
            setTimeout(() => {
              // While the first rows are still being measured the average is
              // 0; scrolling to that estimate would yank the list to the top.
              if (Number.isFinite(estimate) && estimate > 0) {
                readerListRef.current?.scrollToOffset({ offset: estimate, animated: false });
              }
              setTimeout(() => {
                readerListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.05,
                });
              }, 350);
            }, 120);
          }}
          renderItem={({ item: verse, index }) => {
            const key = `${activeChapter.id}:${index + 1}`;
            const isBm = bookmarks.includes(key);
            const translation = stripHtml(verse.translations?.[0]?.text);
            const isCurrentAudio = currentVerseAudio === key;
            const isSpeaking = speakingKey === key;
            return (
              <View>
                <View style={styles.verseHeader}>
                  <View style={[styles.verseNum, isCurrentAudio && { backgroundColor: COLORS.gold, borderColor: COLORS.gold }]}>
                    <Text style={{ color: isCurrentAudio ? '#000' : COLORS.gold, fontSize: 11, fontWeight: '800' }}>{index + 1}</Text>
                  </View>
                  <View style={[globalStyles.row, { gap: 14 }]}>
                    <TouchableOpacity onPress={() => playVerseAudio(activeChapter.id, index + 1)}>
                      <Ionicons
                        name={isCurrentAudio && isPlaying ? 'pause-circle' : 'play-circle-outline'}
                        size={20}
                        color={isCurrentAudio ? COLORS.gold : COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                    {/* Translation on its own, without the recitation. */}
                    <TouchableOpacity onPress={() => playTranslationOnly(verse)}>
                      <Ionicons
                        name={isSpeaking ? 'volume-high' : 'language-outline'}
                        size={18}
                        color={isSpeaking ? COLORS.emerald : COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleBookmark(key)}>
                      <Ionicons name={isBm ? 'bookmark' : 'bookmark-outline'} size={18} color={isBm ? COLORS.gold : COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => shareVerse(verse, index)}
                      accessibilityRole="button"
                      accessibilityLabel={`Share verse ${index + 1}`}
                    >
                      <Ionicons name="share-outline" size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedVerse({ key, note: notes[key] || '' })}>
                      <Ionicons name="pencil-outline" size={18} color={notes[key] ? COLORS.emerald : COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.arabicVerse, { fontSize: prefs.quranFontSize, lineHeight: prefs.quranFontSize * 1.9 }]}>
                  {verse.words?.length
                    ? verse.words.map(w => w.text_uthmani).join(' ')
                    : verse.text_uthmani}
                </Text>
                <View style={styles.translationBox}>
                  <Text style={styles.translationText}>{translation}</Text>
                  <Text style={styles.translationLabel}>{TRANSLATIONS[langKey]?.author}</Text>
                </View>
                {notes[key] ? (
                  <View style={styles.noteBox}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontStyle: 'italic' }}>"{notes[key]}"</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
        </>
      )}

      {/* Note Modal */}
      <Modal visible={!!selectedVerse} transparent animationType="slide" onRequestClose={() => setSelectedVerse(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.noteModal}>
            <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 18, marginBottom: 12 }}>
              Note for {selectedVerse?.key}
            </Text>
            <TextInput
              style={[globalStyles.input, { minHeight: 100, textAlignVertical: 'top' }]}
              multiline
              defaultValue={selectedVerse?.note}
              onChangeText={t => setSelectedVerse(v => ({ ...v, note: t }))}
              placeholder="Your reflections..."
              placeholderTextColor={COLORS.textSecondary}
            />
            <View style={[globalStyles.row, { gap: 12, marginTop: 16 }]}>
              <TouchableOpacity
                style={[globalStyles.btnPrimary, { flex: 1, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder }]}
                onPress={() => setSelectedVerse(null)}
              >
                <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.btnPrimary, { flex: 1 }]}
                onPress={async () => {
                  const next = { ...notes };
                  if (selectedVerse.note?.trim()) next[selectedVerse.key] = selectedVerse.note;
                  else delete next[selectedVerse.key];
                  setNotes(next);
                  await setItem('qitab_notes', JSON.stringify(next));
                  const hasToken = await hasAuthToken();
                  if (hasToken) {
                    try {
                      const [surah, ayah] = selectedVerse.key.split(':');
                      await backend.addNote({
                        title: `Note on ${activeChapter?.name_simple || 'Surah'} ${surah}:${ayah}`,
                        content: selectedVerse.note, category: 'quran',
                        surah_number: parseInt(surah), ayah_number: parseInt(ayah),
                      });
                    } catch { /* backend unavailable */ }
                  }
                  setSelectedVerse(null);
                }}
              >
                <Text style={globalStyles.btnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <ReaderSettingsModal {...settingsModalProps} />
    </SafeAreaView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  audioBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder,
  },
  audioChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  audioChipOn: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  audioChipText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  audioSource: {
    color: COLORS.textSecondary, fontSize: 10, maxWidth: 120, textAlign: 'right',
  },
  topBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    paddingBottom: 6,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  indicatorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.glass,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  indicatorText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 14,
    gap: 14,
  },
  chapterNum: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.glass,
    alignItems: 'center', justifyContent: 'center',
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  playBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  basmalah: {
    alignItems: 'center', paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder,
  },
  basmalahText: {
    color: COLORS.gold, fontSize: 22,
    writingDirection: 'rtl', textAlign: 'center', lineHeight: 40,
  },
  verseDivider: {
    height: 1, backgroundColor: COLORS.glassBorder, marginVertical: 20,
  },
  verseHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  verseNum: {
    width: 44, height: 28, borderRadius: 8,
    backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  arabicVerse: {
    textAlign: 'right', writingDirection: 'rtl',
    color: COLORS.textPrimary, fontSize: 26,
    lineHeight: 46, marginBottom: 16, fontWeight: '400',
  },
  qariHint: {
    color: COLORS.textSecondary, fontSize: 11, lineHeight: 16,
    marginTop: 4, marginBottom: 10,
  },
  qariSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 10,
    paddingHorizontal: 10, height: 38, marginBottom: 10,
  },
  qariSearchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 13, height: '100%' },
  qariArabic: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  qariTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 3 },
  qariTag: { color: COLORS.textSecondary, fontSize: 10, opacity: 0.85 },
  qariEmpty: {
    color: COLORS.textSecondary, fontSize: 12,
    textAlign: 'center', paddingVertical: 18,
  },
  translationBox: {
    borderLeftWidth: 3, borderLeftColor: COLORS.gold,
    paddingLeft: 14, backgroundColor: COLORS.glass,
    borderRadius: 8, padding: 12,
  },
  translationText: {
    color: COLORS.textPrimary, fontSize: 15, lineHeight: 24,
  },
  translationLabel: {
    color: COLORS.textSecondary, fontSize: 10,
    marginTop: 6, fontStyle: 'italic',
  },
  noteBox: {
    marginTop: 10, borderLeftWidth: 2,
    borderLeftColor: COLORS.emerald, paddingLeft: 12,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  noteModal: {
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderTopWidth: 1, borderColor: COLORS.glassBorder,
    maxHeight: '88%',
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.glassBorder, marginTop: 8,
  },
});
