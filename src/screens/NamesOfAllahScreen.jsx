import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { COLORS, globalStyles } from '../theme';
import * as Speech from 'expo-speech';
import { ASMA_UL_HUSNA } from '../data/names';

// Real recitation, not device TTS: one mp3 per name (1.mp3 .. 99.mp3),
// matching ASMA_UL_HUSNA's id field exactly. Source: soachishti/Asma-ul-Husna
// (BSD-style licence, redistribution permitted), streamed from GitHub's raw
// CDN rather than bundled — 99 files would otherwise bloat the app binary.
const NAME_AUDIO_BASE = 'https://raw.githubusercontent.com/soachishti/Asma-ul-Husna/master/audio';
const nameAudioUrl = (id) => `${NAME_AUDIO_BASE}/${id}.mp3`;

export default function NamesOfAllahScreen() {
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [speakingId, setSpeakingId] = useState(null);
  const [playingAll, setPlayingAll] = useState(false);
  // Recitation of the names alone is the default; the meaning is an
  // optional addition rather than half of every utterance.
  const [withMeaning, setWithMeaning] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);
  // Set when the user stops playback, so an in-flight utterance's onDone does
  // not advance the sequence after the user has asked it to stop.
  const cancelledRef = useRef(false);
  const soundRef = useRef(null);

  /** Speaks one string and resolves when the device finishes or fails. */
  const speak = (text, locale) =>
    new Promise(resolve => {
      if (!text) return resolve();
      Speech.speak(text, {
        language: locale,
        rate: 0.82,
        onDone: resolve,
        onStopped: resolve,
        onError: resolve,
      });
    });

  /**
   * Plays the real recitation for one name. Falls back to the device Arabic
   * voice on any failure (no network, CDN hiccup) so "Listen" still does
   * something rather than silently doing nothing.
   */
  const playRecitation = (item) =>
    new Promise(resolve => {
      Audio.Sound.createAsync({ uri: nameAudioUrl(item.id) }, { shouldPlay: true })
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
        .catch(async () => {
          soundRef.current = null;
          await speak(item.arabic, 'ar-SA');
          resolve();
        });
    });

  const stopSpeech = useCallback(() => {
    cancelledRef.current = true;
    try { Speech.stop(); } catch { /* nothing was speaking */ }
    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setSpeakingId(null);
    setPlayingAll(false);
  }, []);

  // Speech outlives the screen otherwise — leaving the module would keep the
  // device reciting with nothing on screen to stop it.
  useEffect(() => stopSpeech, [stopSpeech]);

  /**
   * Recites one name: the real Arabic recitation, then its meaning in
   * English if asked for. Falls back to device text-to-speech only if the
   * recitation audio can't be reached (see playRecitation).
   */
  const playName = async (item) => {
    if (speakingId === item.id) { stopSpeech(); return; }
    stopSpeech();
    cancelledRef.current = false;
    setSpeakingId(item.id);
    await playRecitation(item);
    if (cancelledRef.current) return;
    if (withMeaning) await speak(item.meaning, 'en-US');
    if (!cancelledRef.current) setSpeakingId(null);
  };

  /** Recites all 99 in order, scrolling each into view as it goes. */
  const playAll = async () => {
    if (playingAll) { stopSpeech(); return; }
    stopSpeech();
    cancelledRef.current = false;
    setPlayingAll(true);

    for (const item of ASMA_UL_HUSNA) {
      if (cancelledRef.current) break;
      setSpeakingId(item.id);
      listRef.current?.scrollToIndex({
        index: Math.floor((item.id - 1) / 3), animated: true, viewPosition: 0.4,
      });
      await playRecitation(item);
      if (cancelledRef.current) break;
      if (withMeaning) await speak(item.meaning, 'en-US');
    }

    if (!cancelledRef.current) {
      setSpeakingId(null);
      setPlayingAll(false);
    }
  };

  const toggleFav = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const shareName = async (item) => {
    try {
      await Share.share({
        message: `${item.arabic}\n${item.name} — ${item.meaning}\n\n${item.desc}\n\n— 99 Names of Allah | Qitab-e-Noor`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Asma ul Husna</Text>
          <Text style={styles.headerSub}>The 99 Names of Allah ﷺ</Text>
        </View>
        <View style={[globalStyles.row, { gap: 10 }]}>
          <TouchableOpacity
            onPress={playAll}
            style={[styles.playAllBtn, playingAll && styles.playAllBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={playingAll ? 'Stop reciting all names' : 'Recite all 99 names'}
          >
            <Ionicons
              name={playingAll ? 'stop' : 'play'}
              size={13}
              color={playingAll ? '#000' : '#fff'}
            />
            <Text style={[styles.playAllText, playingAll && { color: '#000' }]}>
              {playingAll ? 'Stop' : 'Play all'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setWithMeaning(v => !v)}
            style={[styles.meaningBtn, withMeaning && styles.meaningBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={withMeaning ? 'Recite names only' : 'Also read the meaning'}
          >
            <Ionicons
              name={withMeaning ? 'language' : 'language-outline'}
              size={13}
              color={withMeaning ? '#000' : 'rgba(255,255,255,0.85)'}
            />
            <Text style={[styles.meaningBtnText, withMeaning && { color: '#000' }]}>
              Meaning
            </Text>
          </TouchableOpacity>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{favorites.length}</Text>
            <Ionicons name="heart" size={12} color={COLORS.red} />
          </View>
        </View>
      </View>

      {/* Selected Name Detail */}
      {selected && (
        <View style={styles.detailCard}>
          <View style={globalStyles.spaceBetween}>
            <Text style={styles.detailArabic}>{selected.arabic}</Text>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.detailName}>{selected.name}</Text>
          <Text style={styles.detailMeaning}>{selected.meaning}</Text>
          <Text style={styles.detailDesc}>{selected.desc}</Text>
          <View style={[globalStyles.row, { gap: 12, marginTop: 14 }]}>
            <TouchableOpacity
              onPress={() => playName(selected)}
              style={styles.detailBtn}
              accessibilityRole="button"
              accessibilityLabel={speakingId === selected.id ? 'Stop' : `Listen to ${selected.name}`}
            >
              <Ionicons
                name={speakingId === selected.id ? 'stop-circle' : 'volume-high-outline'}
                size={18}
                color={speakingId === selected.id ? COLORS.emerald : COLORS.cyan}
              />
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                {speakingId === selected.id ? 'Stop' : 'Listen'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFav(selected.id)} style={styles.detailBtn}>
              <Ionicons name={favorites.includes(selected.id) ? 'heart' : 'heart-outline'} size={18} color={COLORS.red} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{favorites.includes(selected.id) ? 'Favorited' : 'Favorite'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => shareName(selected)} style={styles.detailBtn}>
              <Ionicons name="share-outline" size={18} color={COLORS.gold} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Names Grid */}
      <FlatList
        ref={listRef}
        data={ASMA_UL_HUSNA}
        keyExtractor={item => item.id.toString()}
        numColumns={3}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        columnWrapperStyle={{ gap: 8 }}
        onScrollToIndexFailed={() => { /* row not measured yet; recitation continues */ }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelected(item)}
            activeOpacity={0.7}
            style={[
              styles.nameCard,
              selected?.id === item.id && styles.nameCardActive,
              speakingId === item.id && styles.nameCardSpeaking,
            ]}
          >
            <Text style={styles.nameNum}>{item.id}</Text>
            <Text style={styles.nameArabic}>{item.arabic}</Text>
            <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.nameMeaning} numberOfLines={1}>{item.meaning}</Text>

            <TouchableOpacity
              onPress={() => playName(item)}
              style={styles.tilePlay}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Listen to ${item.name}`}
            >
              <Ionicons
                name={speakingId === item.id ? 'volume-high' : 'play-circle-outline'}
                size={15}
                color={speakingId === item.id ? COLORS.emerald : COLORS.textSecondary}
              />
            </TouchableOpacity>

            {favorites.includes(item.id) && (
              <Ionicons name="heart" size={10} color={COLORS.red} style={{ position: 'absolute', top: 8, right: 8 }} />
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  countText: { color: COLORS.red, fontWeight: '800', fontSize: 12 },
  detailCard: {
    margin: 12, padding: 20,
    backgroundColor: COLORS.glass,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  detailArabic: { color: COLORS.gold, fontSize: 28, fontWeight: '400', textAlign: 'right', writingDirection: 'rtl' },
  detailName: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 8 },
  detailMeaning: { color: COLORS.emerald, fontSize: 15, fontWeight: '600', marginTop: 4 },
  detailDesc: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 8 },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  nameCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.glassBorder,
    padding: 12, minHeight: 110, position: 'relative',
  },
  meaningBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
  },
  meaningBtnActive: { backgroundColor: COLORS.cyan, borderColor: COLORS.cyan },
  meaningBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  playAllBtnActive: { backgroundColor: '#fff', borderColor: '#fff' },
  playAllText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tilePlay: { position: 'absolute', bottom: 6, right: 6 },
  nameCardSpeaking: { borderColor: COLORS.emerald, borderWidth: 1.5 },
  nameCardActive: { borderColor: COLORS.gold, backgroundColor: 'rgba(255, 255, 255,0.08)' },
  nameNum: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  nameArabic: { color: COLORS.gold, fontSize: 18, marginBottom: 6, textAlign: 'center' },
  nameText: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  nameMeaning: { color: COLORS.textSecondary, fontSize: 9, textAlign: 'center', marginTop: 2 },
});
