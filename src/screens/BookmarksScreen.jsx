import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getItem, setItem } from '../firebase/syncedStorage';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, globalStyles } from '../theme';
import { DUA_TITLES } from '../data/duas';
import { backend } from '../services/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  seedLibraryIfEmpty, removeLibrarySamples, isSample,
} from '../data/librarySamples';

// ─── Tabs & colors ────────────────────────────────────────────────────────
const TABS = [
  { id: 'all', label: 'All', icon: 'layers-outline' },
  { id: 'quran', label: 'Quran', icon: 'book-outline' },
  { id: 'hadith', label: 'Hadith', icon: 'shield-checkmark-outline' },
  { id: 'duas', label: 'Duas', icon: 'star-outline' },
  { id: 'notes', label: 'Notes', icon: 'document-text-outline' },
];

const TYPE_COLORS = { quran: COLORS.gold, hadith: COLORS.emerald, duas: '#ff4444', notes: '#ffffff' };
const TYPE_ICONS = { quran: 'book-outline', hadith: 'shield-checkmark-outline', duas: 'heart-outline', notes: 'document-text-outline' };

export default function BookmarksScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);

  const [seeded, setSeeded] = useState(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        // A brand-new library is empty, which shows nothing of what the screen
        // is for. Seed real starter content once — never over the user's own.
        await seedLibraryIfEmpty({ getItem, setItem });
        const raw = await getItem('qitab_library_samples');
        setSeeded(raw ? JSON.parse(raw) : null);
        loadAll();
      })();
    }, [])
  );

  const clearSamples = async () => {
    await removeLibrarySamples({ getItem, setItem });
    setSeeded(null);
    loadAll();
  };

  const loadAll = async () => {
    try {
      const hasToken = await AsyncStorage.getItem('qitab_auth_token');

      // Try backend API first
      if (hasToken) {
        try {
          const [apiBookmarks, apiNotes, apiFavorites] = await Promise.all([
            backend.getBookmarks(),
            backend.getNotes(),
            backend.getFavorites(),
          ]);

          const all = [];

          // Backend bookmarks
          (apiBookmarks || []).forEach(b => {
            all.push({
              id: `bk_${b.id}`,
              type: 'quran',
              title: `Surah ${b.surah_name || b.surah_number} — Verse ${b.ayah_number}`,
              subtitle: b.note || 'Quran Bookmark',
              timestamp: new Date(b.created_at).getTime(),
              key: `${b.surah_number}:${b.ayah_number}`,
              backendId: b.id,
            });
          });

          // Backend notes
          (apiNotes || []).forEach(n => {
            all.push({
              id: `note_${n.id}`,
              type: 'notes',
              title: n.title || 'Untitled Note',
              subtitle: n.content,
              timestamp: new Date(n.created_at).getTime(),
              key: n.id,
              backendId: n.id,
            });
          });

          // Backend favorites
          (apiFavorites || []).forEach(f => {
            all.push({
              id: `fav_${f.id}`,
              type: 'duas',
              title: f.dua_title || `Dua #${f.dua_id}`,
              subtitle: 'Saved to Favorites',
              timestamp: new Date(f.created_at).getTime(),
              key: f.dua_id,
              backendId: f.id,
            });
          });

          setItems(all.sort((a, b) => b.timestamp - a.timestamp));
          return;
        } catch (e) {
          // Backend failed, fall through to local storage
        }
      }

      // Fallback to local storage
      const [bkRaw, notesRaw, favDuasRaw] = await Promise.all([
        getItem('qitab_bookmarks'),
        getItem('qitab_notes'),
        getItem('qitab_fav_duas'),
      ]);

      const bookmarks = bkRaw ? JSON.parse(bkRaw) : {};
      const notes = notesRaw ? JSON.parse(notesRaw) : {};
      const favDuas = favDuasRaw ? JSON.parse(favDuasRaw) : [];

      const all = [];

      Object.keys(bookmarks).forEach(key => {
        if (bookmarks[key]) {
          const [ch, v] = key.split(':');
          all.push({
            id: `quran_${key}`,
            type: 'quran',
            title: `Surah ${ch} — Verse ${v}`,
            subtitle: 'Quran Bookmark',
            timestamp: Date.now(),
            key,
          });
        }
      });

      Object.keys(notes).forEach(key => {
        if (notes[key]) {
          const [ch, v] = key.split(':');
          all.push({
            id: `note_${key}`,
            type: 'notes',
            title: `Note on Surah ${ch}:${v}`,
            subtitle: notes[key],
            timestamp: Date.now(),
            key,
          });
        }
      });

      favDuas.forEach(id => {
        all.push({
          id: `dua_${id}`,
          type: 'duas',
          title: DUA_TITLES[id] || `Dua #${id}`,
          subtitle: 'Saved to Favorites',
          timestamp: Date.now(),
          key: id.toString(),
        });
      });

      setItems(all.reverse());
    } catch (e) { setItems([]); }
  };

  const removeItem = async (item) => {
    Alert.alert('Remove', `Remove "${item.title}" from saved items?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const hasToken = await AsyncStorage.getItem('qitab_auth_token');

          // Try backend API first
          if (hasToken && item.backendId) {
            try {
              if (item.type === 'quran') {
                await backend.deleteBookmark(item.backendId);
              } else if (item.type === 'notes') {
                await backend.deleteNote(item.backendId);
              } else if (item.type === 'duas') {
                await backend.deleteFavorite(item.backendId);
              }
              await loadAll();
              return;
            } catch (e) {
              // Backend failed, fall through to local storage
            }
          }

          // Fallback to local storage
          if (item.type === 'quran') {
            const raw = await getItem('qitab_bookmarks');
            const bk = raw ? JSON.parse(raw) : {};
            delete bk[item.key];
            await setItem('qitab_bookmarks', JSON.stringify(bk));
          } else if (item.type === 'notes') {
            const raw = await getItem('qitab_notes');
            const n = raw ? JSON.parse(raw) : {};
            delete n[item.key];
            await setItem('qitab_notes', JSON.stringify(n));
          } else if (item.type === 'duas') {
            const raw = await getItem('qitab_fav_duas');
            const favs = raw ? JSON.parse(raw) : [];
            const next = favs.filter(id => id.toString() !== item.key);
            await setItem('qitab_fav_duas', JSON.stringify(next));
          }
          await loadAll();
        }
      }
    ]);
  };

  const filtered = items.filter(item => {
    const tabOk = activeTab === 'all' || item.type === activeTab;
    const searchOk = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.subtitle?.toLowerCase().includes(search.toLowerCase());
    return tabOk && searchOk;
  });

  const counts = TABS.reduce((acc, t) => {
    acc[t.id] = t.id === 'all' ? items.length : items.filter(i => i.type === t.id).length;
    return acc;
  }, {});

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search saved items..."
          placeholderTextColor={COLORS.textSecondary}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setActiveTab(t.id)}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
          >
            <Ionicons name={t.icon} size={14} color={activeTab === t.id ? '#fff' : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === t.id && { color: '#fff' }]}>{t.label}</Text>
            {counts[t.id] > 0 && (
              <View style={[styles.badge, activeTab === t.id && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[styles.badgeText, activeTab === t.id && { color: '#fff' }]}>{counts[t.id]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Says plainly that the starter items are samples, and removes only
          those — anything saved since stays. */}
      {seeded && items.length > 0 ? (
        <View style={styles.sampleBar}>
          <Ionicons name="sparkles-outline" size={14} color={COLORS.cyan} />
          <Text style={styles.sampleBarText}>
            Some items here are starter samples to show you around.
          </Text>
          <TouchableOpacity
            onPress={clearSamples}
            accessibilityRole="button"
            accessibilityLabel="Remove sample items"
          >
            <Text style={styles.sampleBarBtn}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {filtered.length === 0 ? (
        <View style={{ flex: 1, ...globalStyles.center }}>
          <Ionicons name="bookmark-outline" size={52} color={COLORS.glassBorder} />
          <Text style={{ color: COLORS.textSecondary, marginTop: 14, textAlign: 'center', paddingHorizontal: 40 }}>
            {items.length === 0
              ? 'No saved items yet. Bookmark verses, save duas, or add notes in the Quran screen.'
              : 'No items match your search.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const color = TYPE_COLORS[item.type] || COLORS.textSecondary;
            return (
              <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }]}>
                <View style={globalStyles.spaceBetween}>
                  <View style={[globalStyles.row, { gap: 8 }]}>
                    <View style={[styles.typeIcon, { backgroundColor: `${color}18` }]}>
                      <Ionicons name={TYPE_ICONS[item.type] || 'bookmark-outline'} size={16} color={color} />
                    </View>
                    <View style={[globalStyles.chip, { borderColor: `${color}40` }]}>
                      <Text style={[globalStyles.chipText, { color }]}>{item.type.toUpperCase()}</Text>
                    </View>
                    {isSample(seeded, item) ? (
                      <View style={styles.sampleTag}>
                        <Text style={styles.sampleTagText}>SAMPLE</Text>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => removeItem(item)}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={styles.cardSubtitle} numberOfLines={2}>{item.subtitle}</Text>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sampleBar: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    marginHorizontal: 12, marginBottom: 8, padding: 10, borderRadius: 10,
    backgroundColor: COLORS.cyan + '12',
    borderWidth: 1, borderColor: COLORS.cyan + '2E',
  },
  sampleBarText: { color: COLORS.textSecondary, fontSize: 11.5, flex: 1, lineHeight: 16 },
  sampleBarBtn: { color: COLORS.cyan, fontSize: 12, fontWeight: '800' },
  sampleTag: {
    borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2,
    backgroundColor: COLORS.cyan + '1F',
  },
  sampleTagText: { color: COLORS.cyan, fontSize: 8.5, fontWeight: '800', letterSpacing: 0.6 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: COLORS.glass,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 10 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '900' },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 14,
  },
  typeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 15, marginTop: 10, marginBottom: 6 },
  cardSubtitle: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
});
