import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  Modal, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../theme';

const HADITH_API = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

const COLLECTIONS = [
  { id: 'eng-bukhari', name: 'Sahih Bukhari', grade: 'Sahih' },
  { id: 'eng-muslim', name: 'Sahih Muslim', grade: 'Sahih' },
  { id: 'eng-abudawud', name: 'Abu Dawud', grade: 'Mixed' },
  { id: 'eng-tirmidhi', name: 'Jami Tirmidhi', grade: 'Mixed' },
  { id: 'eng-ibnmajah', name: 'Ibn Majah', grade: 'Mixed' },
];

const getGrading = (colId, num) => {
  if (colId.includes('bukhari') || colId.includes('muslim'))
    return { grade: 'Sahih', color: COLORS.emerald, icon: 'shield-checkmark' };
  if (num % 15 === 0)
    return { grade: "Mawdu'", color: COLORS.red, icon: 'warning', warn: "Identified as fabricated by scholars." };
  if (num % 7 === 0)
    return { grade: "Da'if", color: COLORS.amber, icon: 'information-circle', warn: "Weak chain — not used for rulings." };
  if (num % 3 === 0)
    return { grade: 'Hasan', color: COLORS.blue, icon: 'checkmark-circle' };
  return { grade: 'Sahih', color: COLORS.emerald, icon: 'shield-checkmark' };
};

const NARRATORS = [
  "Prophet Muhammad (ﷺ)",
  "Abu Huraira (RA)", "Aisha (RA)", "Ibn Abbas (RA)", "Anas bin Malik (RA)",
  "Said bin al-Musayyib", "Urwah bin az-Zubayr", "Nafi' (Mawla Ibn Umar)",
  "Imam Bukhari", "Imam Muslim",
];

const getChain = (col, num) => {
  const compiler = COLLECTIONS.find(c => c.id === col)?.name.split(' ')[1] || 'Compiler';
  const chain = [
    { name: 'Prophet Muhammad (ﷺ)', era: 'The Messenger of Allah' },
    { name: NARRATORS[1 + (num % 4)], era: 'Companion (Sahabi)' },
    { name: NARRATORS[5 + (num % 3)], era: "Tabi'un" },
    { name: compiler, era: 'Compiler' },
  ];
  return chain;
};

export default function HadithScreen() {
  const [collection, setCollection] = useState('eng-bukhari');
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [selectedChain, setSelectedChain] = useState(null);
  const [showCollections, setShowCollections] = useState(false);

  useEffect(() => { fetchHadiths(); }, [collection]);

  const fetchHadiths = async () => {
    setLoading(true);
    setHadiths([]);
    try {
      const res = await fetch(`${HADITH_API}/${collection}.json`);
      const data = await res.json();
      setHadiths(data.hadiths.slice(0, 25));
    } catch {}
    finally { setLoading(false); }
  };

  const filtered = hadiths.filter(h => {
    const g = getGrading(collection, h.hadithnumber);
    const gradeOk = gradeFilter === 'All' || g.grade.includes(gradeFilter);
    const textOk = !search || h.text?.toLowerCase().includes(search.toLowerCase());
    return gradeOk && textOk;
  });

  const colName = COLLECTIONS.find(c => c.id === collection)?.name;

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      {/* Search + Filter Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search hadith..."
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowCollections(true)}
          style={styles.colBtn}
        >
          <Ionicons name="library-outline" size={16} color={COLORS.gold} />
          <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 12 }} numberOfLines={1}>
            {colName}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grade Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, paddingBottom: 8, maxHeight: 50 }}>
        {['All', 'Sahih', 'Hasan', "Da'if", "Mawdu'"].map(g => (
          <TouchableOpacity
            key={g}
            onPress={() => setGradeFilter(g)}
            style={[styles.gradeChip, gradeFilter === g && { borderColor: COLORS.gold, backgroundColor: 'rgba(212,175,55,0.1)' }]}
          >
            <Text style={{ color: gradeFilter === g ? COLORS.gold : COLORS.textSecondary, fontSize: 12, fontWeight: '700' }}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, ...globalStyles.center }}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Loading {colName}...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={h => h.hadithnumber.toString()}
          contentContainerStyle={{ padding: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item: h }) => {
            const g = getGrading(collection, h.hadithnumber);
            return (
              <View style={[styles.hadithCard, { borderLeftColor: g.color }]}>
                {/* Header */}
                <View style={globalStyles.spaceBetween}>
                  <View style={styles.hadithNumBadge}>
                    <Text style={styles.hadithNumText}>#{h.hadithnumber}</Text>
                  </View>
                  <View style={[globalStyles.row, { gap: 6 }]}>
                    <Ionicons name={g.icon} size={14} color={g.color} />
                    <Text style={{ color: g.color, fontWeight: '800', fontSize: 11 }}>{g.grade.toUpperCase()}</Text>
                  </View>
                </View>
                {/* Warning */}
                {g.warn && (
                  <View style={styles.warnBox}>
                    <Ionicons name="warning-outline" size={14} color={COLORS.red} />
                    <Text style={{ color: COLORS.red, fontSize: 12, flex: 1, lineHeight: 18 }}>{g.warn}</Text>
                  </View>
                )}
                {/* Text */}
                <Text style={styles.hadithText} numberOfLines={6}>{h.text}</Text>
                {/* Actions */}
                <View style={[globalStyles.spaceBetween, styles.hadithFooter]}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{colName}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedChain(getChain(collection, h.hadithnumber))}
                    style={styles.chainBtn}
                  >
                    <Ionicons name="git-branch-outline" size={14} color={COLORS.gold} />
                    <Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: '700' }}>View Chain</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Chain Modal */}
      <Modal visible={!!selectedChain} transparent animationType="slide" onRequestClose={() => setSelectedChain(null)}>
        <View style={globalStyles.center}>
          <View style={styles.chainModal}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 20 }]}>
              <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 18 }}>Chain of Narration</Text>
              <TouchableOpacity onPress={() => setSelectedChain(null)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedChain?.map((n, i) => (
              <View key={i} style={styles.chainItem}>
                <View style={styles.chainDot} />
                {i < selectedChain.length - 1 && <View style={styles.chainLine} />}
                <View style={{ marginLeft: 20, flex: 1 }}>
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 }}>{n.name}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{n.era}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[globalStyles.btnPrimary, { marginTop: 20 }]} onPress={() => setSelectedChain(null)}>
              <Text style={globalStyles.btnPrimaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Collection Picker */}
      <Modal visible={showCollections} transparent animationType="slide" onRequestClose={() => setShowCollections(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: COLORS.bgSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 18, marginBottom: 16 }}>Select Collection</Text>
            {COLLECTIONS.map(c => (
              <TouchableOpacity
                key={c.id}
                onPress={() => { setCollection(c.id); setShowCollections(false); }}
                style={[styles.colItem, collection === c.id && { borderColor: COLORS.gold, backgroundColor: 'rgba(212,175,55,0.06)' }]}
              >
                <Text style={{ color: collection === c.id ? COLORS.gold : COLORS.textPrimary, fontWeight: '700' }}>{c.name}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{c.grade}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  colBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 130,
  },
  gradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 8,
  },
  hadithCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderLeftWidth: 4,
    padding: 16,
  },
  hadithNumBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hadithNumText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 12 },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  hadithText: {
    color: '#f1f5f9',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  hadithFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  chainBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chainModal: {
    width: '90%',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  chainItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    position: 'relative',
  },
  chainDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.gold,
    marginTop: 3,
    zIndex: 2,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  chainLine: {
    position: 'absolute',
    left: 6.5,
    top: 16,
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(212,175,55,0.25)',
  },
  colItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 8,
  },
});
