import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  Modal, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';

const API = 'https://api.quran.com/api/v4';

const RECITERS = [
  { id: 7, name: 'Mishary Alafasy' },
  { id: 1, name: 'Abdul Basit Mujawwad' },
  { id: 10, name: 'Saud al-Shuraim' },
];

const LANGS = [
  { id: 20, name: 'English' },
  { id: 158, name: 'Urdu' },
];

export default function QuranScreen() {
  const [chapters, setChapters] = useState([]);
  const [search, setSearch] = useState('');
  const [activeChapter, setActiveChapter] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [langId, setLangId] = useState(20);
  const [reciterId, setReciterId] = useState(7);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState({});
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    loadChapters();
    AsyncStorage.getItem('qitab_bookmarks').then(v => v && setBookmarks(JSON.parse(v)));
    AsyncStorage.getItem('qitab_notes').then(v => v && setNotes(JSON.parse(v)));
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  useEffect(() => {
    if (activeChapter) loadVerses(activeChapter.id);
  }, [activeChapter, langId]);

  useEffect(() => {
    if (activeChapter) loadAudio(activeChapter.id);
  }, [reciterId]);

  const loadChapters = async () => {
    try {
      const res = await fetch(`${API}/chapters?language=en`);
      const data = await res.json();
      setChapters(data.chapters);
    } catch { Alert.alert('Error', 'Could not load chapters. Check internet.'); }
    finally { setLoadingChapters(false); }
  };

  const loadVerses = async (chId) => {
    setLoading(true);
    setVerses([]);
    try {
      let all = [], page = 1, total = 1;
      while (page <= total) {
        const res = await fetch(
          `${API}/verses/by_chapter/${chId}?language=en&words=true&word_fields=text_uthmani,translation&translations=${langId}&fields=translations&page=${page}&per_page=50`
        );
        const data = await res.json();
        all = [...all, ...data.verses];
        total = data.pagination?.total_pages || 1;
        page++;
      }
      setVerses(all);
    } catch {}
    finally { setLoading(false); }
    loadAudio(chId);
  };

  const loadAudio = async (chId) => {
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); setIsPlaying(false); }
      const res = await fetch(`${API}/chapter_recitations/${reciterId}/${chId}`);
      const data = await res.json();
      const url = data.audio_file.audio_url;
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(s => { if (s.didJustFinish) setIsPlaying(false); });
    } catch {}
  };

  const toggleAudio = async () => {
    if (!soundRef.current) return;
    if (isPlaying) { await soundRef.current.pauseAsync(); setIsPlaying(false); }
    else { await soundRef.current.playAsync(); setIsPlaying(true); }
  };

  const toggleBookmark = async (key) => {
    const next = bookmarks.includes(key) ? bookmarks.filter(b => b !== key) : [...bookmarks, key];
    setBookmarks(next);
    await AsyncStorage.setItem('qitab_bookmarks', JSON.stringify(next));
  };

  const filteredChapters = chapters.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name_simple.toLowerCase().includes(q) ||
      c.translated_name?.name?.toLowerCase().includes(q) ||
      c.id.toString() === q.trim();
  });

  // Chapter list view
  if (!activeChapter) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search Surah by name or number..."
            placeholderTextColor={COLORS.textSecondary}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {loadingChapters ? (
          <View style={globalStyles.center}>
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Loading chapters...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredChapters}
            keyExtractor={c => c.id.toString()}
            contentContainerStyle={{ padding: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
                    {ch.translated_name?.name} • {ch.verses_count} verses
                  </Text>
                </View>
                <Text style={{ color: COLORS.gold, fontSize: 20 }}>{ch.name_arabic}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // Verse reader view
  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      {/* Header */}
      <View style={styles.readerHeader}>
        <TouchableOpacity onPress={() => { setActiveChapter(null); soundRef.current?.stopAsync(); setIsPlaying(false); }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 16 }}>{activeChapter.name_simple}</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{activeChapter.translated_name?.name} • {activeChapter.verses_count} verses</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={{ marginRight: 8 }}>
          <Ionicons name="settings-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleAudio}
          style={[styles.playBtn, { backgroundColor: isPlaying ? 'rgba(212,175,55,0.15)' : COLORS.gold }]}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={isPlaying ? COLORS.gold : '#000'} />
        </TouchableOpacity>
      </View>

      {/* Basmalah */}
      {activeChapter.id !== 9 && (
        <View style={styles.basmalah}>
          <Text style={styles.basmalahText}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</Text>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, ...globalStyles.center }}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Loading verses...</Text>
        </View>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={v => v.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={styles.verseDivider} />}
          renderItem={({ item: verse, index }) => {
            const key = `${activeChapter.id}:${index + 1}`;
            const isBm = bookmarks.includes(key);
            const translation = verse.translations?.[0]?.text?.replace(/<[^>]*>/g, '') || '';
            return (
              <View>
                <View style={styles.verseHeader}>
                  <View style={styles.verseNum}>
                    <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '800' }}>{key}</Text>
                  </View>
                  <View style={[globalStyles.row, { gap: 16 }]}>
                    <TouchableOpacity onPress={() => toggleBookmark(key)}>
                      <Ionicons name={isBm ? 'bookmark' : 'bookmark-outline'} size={18} color={isBm ? COLORS.gold : COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedVerse({ key, note: notes[key] || '' })}>
                      <Ionicons name="pencil-outline" size={18} color={notes[key] ? COLORS.emerald : COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Arabic */}
                <Text style={styles.arabicVerse}>{verse.words?.map(w => w.text_uthmani).join(' ')}</Text>
                {/* Translation */}
                <View style={styles.translationBox}>
                  <Text style={styles.translationText}>{translation}</Text>
                </View>
                {/* Note */}
                {notes[key] ? (
                  <View style={styles.noteBox}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontStyle: 'italic' }}>"{notes[key]}"</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
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
                  await AsyncStorage.setItem('qitab_notes', JSON.stringify(next));
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
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.noteModal}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 20 }]}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 18 }}>Reader Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={globalStyles.label}>TRANSLATION</Text>
            {LANGS.map(l => (
              <TouchableOpacity
                key={l.id}
                onPress={() => { setLangId(l.id); setShowSettings(false); }}
                style={[styles.settingRow, langId === l.id && { borderColor: COLORS.gold, backgroundColor: 'rgba(212,175,55,0.06)' }]}
              >
                <Text style={{ color: langId === l.id ? COLORS.gold : COLORS.textPrimary, fontWeight: '700' }}>{l.name}</Text>
                {langId === l.id && <Ionicons name="checkmark-circle" size={18} color={COLORS.gold} />}
              </TouchableOpacity>
            ))}
            <View style={globalStyles.divider} />
            <Text style={globalStyles.label}>RECITER</Text>
            {RECITERS.map(r => (
              <TouchableOpacity
                key={r.id}
                onPress={() => { setReciterId(r.id); setShowSettings(false); }}
                style={[styles.settingRow, reciterId === r.id && { borderColor: COLORS.gold, backgroundColor: 'rgba(212,175,55,0.06)' }]}
              >
                <Text style={{ color: reciterId === r.id ? COLORS.gold : COLORS.textPrimary, fontWeight: '700' }}>{r.name}</Text>
                {reciterId === r.id && <Ionicons name="checkmark-circle" size={18} color={COLORS.gold} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
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
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    backgroundColor: COLORS.bgSecondary,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basmalah: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  basmalahText: {
    color: COLORS.gold,
    fontSize: 22,
    writingDirection: 'rtl',
    textAlign: 'center',
    lineHeight: 40,
  },
  verseDivider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: 20,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  verseNum: {
    width: 44,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicVerse: {
    textAlign: 'right',
    writingDirection: 'rtl',
    color: COLORS.textPrimary,
    fontSize: 26,
    lineHeight: 46,
    marginBottom: 16,
    fontWeight: '400',
  },
  translationBox: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    paddingLeft: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: 12,
  },
  translationText: {
    color: '#f1f5f9',
    fontSize: 15,
    lineHeight: 24,
  },
  noteBox: {
    marginTop: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.emerald,
    paddingLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  noteModal: {
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginTop: 8,
  },
});
