import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../theme';
import { hadithService, HADITH_COLLECTIONS } from '../services/hadithApi';

export default function HadithScreen() {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (selectedCollection) {
      setPage(1);
      loadHadiths(1);
    }
  }, [selectedCollection]);

  const loadHadiths = async (pageNum) => {
    if (!selectedCollection) return;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const data = await hadithService.getCollection(selectedCollection, pageNum, 50);
      if (pageNum === 1) {
        setHadiths(data.hadiths);
      } else {
        setHadiths(prev => [...prev, ...data.hadiths]);
      }
      setHasMore(pageNum < data.totalPages);
    } catch (e) {
      setError('Failed to load hadiths. Check your connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadHadiths(nextPage);
    }
  };

  const onSearch = async () => {
    if (!search.trim() || !selectedCollection) return;
    setLoading(true);
    try {
      const results = await hadithService.search(selectedCollection, search.trim());
      setHadiths(results);
      setHasMore(false);
    } catch (e) {
      setError('Search failed.');
    } finally { setLoading(false); }
  };

  const onClearSearch = () => {
    setSearch('');
    setPage(1);
    loadHadiths(1);
  };

  const shareHadith = async (h) => {
    try {
      const meta = hadithService.getCollectionMeta(selectedCollection);
      await Share.share({
        message: `${h.text}\n\n— ${meta?.name || ''} #${h.hadithnumber}`,
      });
    } catch {}
  };

  // Collection selector view
  if (!selectedCollection) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <View style={{ padding: 20 }}>
          <Text style={[globalStyles.sectionTitle, { marginBottom: 4 }]}>Hadith Collections</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 20 }}>
            All 6 authentic Sunni hadith collections
          </Text>
        </View>

        <FlatList
          data={HADITH_COLLECTIONS}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item: col }) => (
            <TouchableOpacity
              onPress={() => setSelectedCollection(col.id)}
              activeOpacity={0.75}
              style={[styles.collectionCard, { borderLeftColor: col.color }]}
            >
              <View style={[styles.collectionIcon, { backgroundColor: col.color + '18' }]}>
                <Ionicons name="book-outline" size={24} color={col.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 17 }}>{col.name}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>{col.author}</Text>
                <View style={[globalStyles.row, { marginTop: 8, gap: 12 }]}>
                  <View style={[globalStyles.row, { gap: 4 }]}>
                    <Ionicons name="document-text-outline" size={12} color={col.color} />
                    <Text style={{ color: col.color, fontSize: 11, fontWeight: '700' }}>{col.total.toLocaleString()} hadiths</Text>
                  </View>
                  <View style={[globalStyles.row, { gap: 4 }]}>
                    <Ionicons name="shield-checkmark-outline" size={12} color={col.color} />
                    <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{col.grade}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  const meta = hadithService.getCollectionMeta(selectedCollection);

  // Hadith list view
  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      {/* Header — solid emerald banner, matching the dashboard hero. */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setSelectedCollection(null); setHadiths([]); setSearch(''); }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{meta?.name}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{meta?.author} • {meta?.total.toLocaleString()} hadiths</Text>
        </View>
        <View style={[styles.gradeBadge, { backgroundColor: meta?.color + '20' }]}>
          <Text style={{ color: meta?.color, fontSize: 11, fontWeight: '800' }}>{meta?.grade}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${meta?.name}...`}
            placeholderTextColor={COLORS.textSecondary}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={onClearSearch}>
              <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        {search ? (
          <TouchableOpacity onPress={onSearch} style={styles.searchBtn}>
            <Text style={{ color: '#000', fontWeight: '700', fontSize: 13 }}>Search</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={{ flex: 1, ...globalStyles.center }}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Loading {meta?.name}...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, ...globalStyles.center }}>
          <Ionicons name="cloud-offline-outline" size={48} color={COLORS.red} />
          <Text style={{ color: COLORS.textSecondary, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }}>{error}</Text>
          <TouchableOpacity onPress={() => { setError(null); loadHadiths(1); }} style={{ marginTop: 16, backgroundColor: COLORS.gold, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}>
            <Text style={{ color: '#000', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={hadiths}
          keyExtractor={h => h.hadithnumber.toString()}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator color={COLORS.gold} size="small" />
            </View>
          ) : null}
          renderItem={({ item: h }) => (
            <View style={[styles.hadithCard, { borderLeftColor: meta?.color }]}>
              <View style={globalStyles.spaceBetween}>
                <View style={styles.hadithNumBadge}>
                  <Text style={styles.hadithNumText}>#{h.hadithnumber}</Text>
                </View>
                <TouchableOpacity onPress={() => shareHadith(h)} style={{ padding: 4 }}>
                  <Ionicons name="share-outline" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.hadithText}>{h.text}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderLeftWidth: 4,
    padding: 16,
    gap: 14,
  },
  collectionIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  gradeBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  searchBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12, paddingBottom: 6,
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
  searchBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  hadithText: {
    color: '#f1f5f9', fontSize: 14,
    lineHeight: 22, marginTop: 12,
  },
});
