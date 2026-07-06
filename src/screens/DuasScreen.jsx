import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';
import { DUAS, CATEGORIES, CAT_ICONS, getContextualDua } from '../data/duas';

export default function DuasScreen() {
  const [category, setCategory] = useState('Morning');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [selected, setSelected] = useState(null);
  const [recommended] = useState(() => getContextualDua());

  useEffect(() => {
    AsyncStorage.getItem('qitab_fav_duas').then(v => v && setFavorites(JSON.parse(v)));
  }, []);

  const saveFav = async (id) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    await AsyncStorage.setItem('qitab_fav_duas', JSON.stringify(next));
  };

  const filtered = DUAS.filter(d => {
    if (category === 'Favorites') return favorites.includes(d.id);
    return d.category === category && (!search || d.title.toLowerCase().includes(search.toLowerCase()) || d.translation.toLowerCase().includes(search.toLowerCase()));
  });

  const speak = (text) => Speech.speak(text, { language: 'ar-SA', rate: 0.75 });

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      {/* Contextual recommendation */}
      {recommended?.dua && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSelected(recommended.dua)}
          style={styles.recommendCard}
        >
          <View style={[globalStyles.row, { gap: 8, marginBottom: 8 }]}>
            <Ionicons name="sparkles" size={16} color={COLORS.gold} />
            <Text style={styles.recommendReason}>{recommended.reason}</Text>
          </View>
          <Text style={styles.recommendTitle}>{recommended.dua.title}</Text>
          <Text style={styles.recommendArabic} numberOfLines={1}>{recommended.dua.arabic}</Text>
          <View style={[globalStyles.row, { marginTop: 10, gap: 4 }]}>
            <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>READ NOW</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.gold} />
          </View>
        </TouchableOpacity>
      )}

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search duas..."
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={[styles.catChip, category === c && styles.catChipActive]}
          >
            <Ionicons name={CAT_ICONS[c]} size={14} color={category === c ? COLORS.gold : COLORS.textSecondary} />
            <Text style={[styles.catText, category === c && { color: COLORS.gold }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={{ flex: 1, ...globalStyles.center }}>
          <Ionicons name="heart-outline" size={48} color={COLORS.glassBorder} />
          <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>No duas found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={d => d.id.toString()}
          contentContainerStyle={{ padding: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item: dua }) => (
            <TouchableOpacity
              onPress={() => setSelected(dua)}
              activeOpacity={0.8}
              style={styles.duaCard}
            >
              <View style={globalStyles.spaceBetween}>
                <View style={globalStyles.chip}>
                  <Text style={globalStyles.chipText}>{dua.category}</Text>
                </View>
                <TouchableOpacity onPress={() => saveFav(dua.id)}>
                  <Ionicons name={favorites.includes(dua.id) ? 'star' : 'star-outline'} size={18} color={favorites.includes(dua.id) ? COLORS.gold : COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.duaTitle}>{dua.title}</Text>
              <Text style={styles.arabicPreview} numberOfLines={2}>{dua.arabic}</Text>
              <Text style={styles.translationPreview} numberOfLines={2}>{dua.translation}</Text>
              <View style={[globalStyles.row, { marginTop: 12, gap: 16, justifyContent: 'flex-end' }]}>
                <TouchableOpacity onPress={() => speak(dua.arabic)}>
                  <Ionicons name="volume-high-outline" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.75)' }}>
          <View style={styles.detailModal}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 20 }]}>
              <View style={globalStyles.chip}>
                <Text style={globalStyles.chipText}>{selected?.category}</Text>
              </View>
              <View style={[globalStyles.row, { gap: 16 }]}>
                <TouchableOpacity onPress={() => saveFav(selected?.id)}>
                  <Ionicons name={favorites.includes(selected?.id) ? 'star' : 'star-outline'} size={20} color={COLORS.gold} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.detailTitle}>{selected?.title}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.arabicFull}>{selected?.arabic}</Text>

              <Text style={globalStyles.label}>TRANSLITERATION</Text>
              <Text style={styles.translitText}>{selected?.transliteration}</Text>

              <View style={globalStyles.divider} />
              <Text style={globalStyles.label}>TRANSLATION</Text>
              <Text style={styles.translationFull}>{selected?.translation}</Text>

              <View style={styles.benefitBox}>
                <Text style={[globalStyles.label, { color: COLORS.emerald }]}>BENEFIT & VIRTUE</Text>
                <Text style={{ color: COLORS.textPrimary, marginTop: 6, lineHeight: 22 }}>{selected?.benefit}</Text>
              </View>

              <View style={[globalStyles.row, { gap: 12, marginTop: 20 }]}>
                <TouchableOpacity style={[globalStyles.btnPrimary, { flex: 1 }]} onPress={() => selected && speak(selected.arabic)}>
                  <Ionicons name="volume-high-outline" size={18} color="#000" />
                  <Text style={globalStyles.btnPrimaryText}>Listen Arabic</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.btnPrimary, { flex: 1, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder }]}
                  onPress={() => setSelected(null)}
                >
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  recommendCard: {
    margin: 12,
    marginBottom: 4,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  recommendReason: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', flex: 1 },
  recommendTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  recommendArabic: { textAlign: 'right', writingDirection: 'rtl', color: COLORS.gold, fontSize: 17 },
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
  catRow: { maxHeight: 52, marginBottom: 4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
  },
  catChipActive: { borderColor: COLORS.gold, backgroundColor: 'rgba(212,175,55,0.1)' },
  catText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  duaCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
  },
  duaTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 10, marginBottom: 8 },
  arabicPreview: {
    textAlign: 'right',
    writingDirection: 'rtl',
    color: COLORS.gold,
    fontSize: 18,
    lineHeight: 34,
    marginBottom: 8,
  },
  translationPreview: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  detailModal: {
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  detailTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', marginBottom: 20 },
  arabicFull: {
    textAlign: 'right',
    writingDirection: 'rtl',
    color: COLORS.gold,
    fontSize: 24,
    lineHeight: 46,
    marginBottom: 24,
  },
  translitText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 15, lineHeight: 24, marginTop: 6, marginBottom: 16 },
  translationFull: { color: COLORS.textPrimary, fontSize: 16, lineHeight: 26, marginTop: 6 },
  benefitBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(16,185,129,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
});
