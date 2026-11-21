import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { hadithService, HADITH_COLLECTIONS } from '../services/hadithApi';
import { useShare } from '../context/ShareContext';
import { APP_CONFIG } from '../config/appConfig';
import { hadithOfDay } from '../data/daily';

/**
 * The daily hadith is curated in `src/data/daily.js` with its printed
 * reference. This maps that reference to the CDN collection id so the card can
 * open the same hadith in the verification screen rather than asking to be
 * taken on trust.
 */
function referenceToCollection(reference = '') {
  if (/bukhari/i.test(reference)) return 'eng-bukhari';
  if (/muslim/i.test(reference)) return 'eng-muslim';
  if (/abu ?dawud/i.test(reference)) return 'eng-abudawud';
  if (/tirmidhi/i.test(reference)) return 'eng-tirmidhi';
  if (/ibn ?majah/i.test(reference)) return 'eng-ibnmajah';
  if (/nasa/i.test(reference)) return 'eng-nasai';
  return null;
}

export default function HadithScreen({ navigation, route }) {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);
  const { share } = useShare();

  const [selectedCollection, setSelectedCollection] = useState(null);
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Set when a shared link names one hadith, so the list can show just it.
  const [focusedNumber, setFocusedNumber] = useState(null);
  const pendingNumber = useRef(null);

  // Deep links (and the daily card) can open a specific collection directly.
  useEffect(() => {
    const id = route?.params?.collection;
    if (!id || !HADITH_COLLECTIONS.some(c => c.id === id)) return;
    if (route?.params?.number != null) {
      pendingNumber.current = Number(route.params.number);
    }
    setSelectedCollection(id);
  }, [route?.params?.collection, route?.params?.number]);

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
      if (data.error) {
        setError(
          pageNum === 1
            ? `Could not download ${hadithService.getCollectionMeta(selectedCollection)?.name}. Check your connection and try again.`
            : 'Could not load more hadiths. Check your connection.'
        );
        return;
      }

      // A link like /hadith/eng-bukhari/1 should land on that hadith, not on
      // page one of the collection with the number ignored.
      const target = pageNum === 1 ? pendingNumber.current : null;
      if (target != null) {
        pendingNumber.current = null;
        const one = await hadithService.getByNumber(selectedCollection, target);
        if (one) {
          setHadiths([one]);
          setHasMore(false);
          setFocusedNumber(one.hadithnumber);
          return;
        }
      }

      if (pageNum === 1) {
        setHadiths(data.hadiths);
      } else {
        setHadiths(prev => [...prev, ...data.hadiths]);
      }
      setHasMore(pageNum < data.totalPages);
    } catch {
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
    setFocusedNumber(null);
    try {
      const results = await hadithService.search(selectedCollection, search.trim());
      setHadiths(results);
      setHasMore(false);
    } catch {
      setError('Search failed.');
    } finally { setLoading(false); }
  };

  const onClearSearch = () => {
    setSearch('');
    setPage(1);
    loadHadiths(1);
  };

  const showAllHadiths = () => {
    setFocusedNumber(null);
    setPage(1);
    loadHadiths(1);
  };

  const shareHadith = async (h) => {
    const meta = hadithService.getCollectionMeta(selectedCollection);
    share({
      title: meta?.name || 'Hadith',
      message: `${h.text}\n\n— ${meta?.name || ''} #${h.hadithnumber}`,
      url: APP_CONFIG.shareHadith(selectedCollection, h.hadithnumber),
    });
  };

  // Curated, referenced, and deterministic per day — the card is real content
  // on a screen that otherwise opens with six empty collection cards.
  const daily = hadithOfDay();
  const dailyCollection = referenceToCollection(daily.reference);
  const dailyNumber = Number((daily.reference.match(/(\d+)\s*$/) || [])[1]) || null;

  const shareDaily = () => {
    share({
      title: 'Hadith of the Day',
      message: `${daily.text}\n\n— ${daily.reference}`,
      url:
        dailyCollection && dailyNumber
          ? APP_CONFIG.shareHadith(dailyCollection, dailyNumber)
          : undefined,
    });
  };

  const openDaily = () => {
    if (!dailyCollection || !dailyNumber) return;
    navigation?.navigate?.('HadithVerify', {
      collection: dailyCollection,
      number: dailyNumber,
    });
  };

  const dailyCard = (
    <View style={styles.dailyCard}>
      <View style={styles.dailyHeader}>
        <Ionicons name="sunny-outline" size={14} color={COLORS.gold} />
        <Text style={styles.dailyLabel}>Hadith of the Day</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={shareDaily} accessibilityLabel="Share hadith of the day">
          <Ionicons name="share-outline" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.dailyText}>{daily.text}</Text>
      <Text style={styles.dailySource}>
        {daily.narrator ? `${daily.narrator}  ·  ` : ''}
        {daily.reference}
        {daily.grade ? `  ·  ${daily.grade}` : ''}
      </Text>
      {dailyCollection && dailyNumber ? (
        <TouchableOpacity
          style={styles.dailyVerify}
          onPress={openDaily}
          accessibilityRole="button"
          accessibilityLabel="Open hadith of the day in verification"
        >
          <Ionicons name="shield-checkmark-outline" size={13} color={COLORS.gold} />
          <Text style={styles.dailyVerifyText}>Open in verification</Text>
          <Ionicons name="chevron-forward" size={12} color={COLORS.gold} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

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
          ListHeaderComponent={dailyCard}
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
        <TouchableOpacity onPress={() => { setSelectedCollection(null); setHadiths([]); setSearch(''); setFocusedNumber(null); pendingNumber.current = null; }}>
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
          ListHeaderComponent={focusedNumber != null ? (
            <View style={styles.focusedBar}>
              <Ionicons name="locate-outline" size={14} color={COLORS.gold} />
              <Text style={styles.focusedText}>Showing hadith #{focusedNumber}</Text>
              <TouchableOpacity onPress={showAllHadiths} accessibilityRole="button" accessibilityLabel="Show all hadiths">
                <Text style={styles.focusedAction}>Show all</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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

const makeStyles = (COLORS) => StyleSheet.create({
  dailyCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.gold + '55',
    padding: 16,
    marginBottom: 14,
  },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  dailyLabel: {
    color: COLORS.gold, fontSize: 11, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  dailyText: { color: COLORS.textPrimary, fontSize: 14.5, lineHeight: 23 },
  dailySource: { color: COLORS.textSecondary, fontSize: 11.5, marginTop: 10, fontWeight: '600' },
  dailyVerify: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.glassBorder,
  },
  dailyVerifyText: { color: COLORS.gold, fontSize: 12, fontWeight: '700', flex: 1 },
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
    color: COLORS.textPrimary, fontSize: 14,
    lineHeight: 22, marginTop: 12,
  },
  focusedBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12,
    backgroundColor: COLORS.gold + '14', borderWidth: 1, borderColor: COLORS.gold + '40',
  },
  focusedText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 },
  focusedAction: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },
});
