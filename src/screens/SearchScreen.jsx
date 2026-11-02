import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, SectionList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { useNavigationUrl } from '../hooks/useNavigationUrl';
import { useRole } from '../context/RoleContext';
import {
  searchContent, mapQuranSearchResults, SEARCH_GROUPS,
  loadRecentSearches, saveRecentSearch, clearRecentSearches,
} from '../services/globalSearch';
import { quranService } from '../services/quranApi';

// Order decides which group appears first when the filter is "All". App
// navigation comes last on purpose: a search for "mercy" should surface
// content about mercy before a screen that merely mentions it.
const GROUP_ORDER = ['quran', 'duas', 'names', 'hadith', 'seerah', 'prophets', 'modules'];

const FILTERS = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'quran', label: 'Quran', icon: 'book-outline' },
  { key: 'duas', label: 'Duas', icon: 'heart-outline' },
  { key: 'names', label: 'Names', icon: 'sparkles-outline' },
  { key: 'hadith', label: 'Hadith', icon: 'shield-checkmark-outline' },
  { key: 'learn', label: 'Learn', icon: 'school-outline' },
  { key: 'app', label: 'App', icon: 'grid-outline' },
];

const FILTER_GROUPS = {
  all: GROUP_ORDER,
  quran: ['quran'],
  duas: ['duas'],
  names: ['names'],
  hadith: ['hadith'],
  learn: ['seerah', 'prophets'],
  app: ['modules'],
};

const SUGGESTIONS = ['mercy', 'patience', 'Yusuf', 'Maryam', 'الرحمن', 'forgiveness', 'zakat', 'fajr'];

// Two letters is enough for the bundled index but too noisy for a full-text
// Quran search; three is the shortest useful translation query.
const QURAN_MIN_LENGTH = 3;

export default function SearchScreen() {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const { navigateTo } = useNavigationUrl();
  const role = useRole();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState('all');
  const [recent, setRecent] = useState([]);
  const [quranResults, setQuranResults] = useState([]);
  const [searchingQuran, setSearchingQuran] = useState(false);
  const [quranOffline, setQuranOffline] = useState(false);

  // Only the newest in-flight Quran request may write results. Without this,
  // typing "me" then "mercy" could let the slower first response overwrite
  // the better second one.
  const requestRef = useRef(0);

  useEffect(() => {
    loadRecentSearches().then(setRecent);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 220);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmed = debounced.trim();
  const wantsQuran = filter === 'all' || filter === 'quran';

  const localResults = useMemo(
    () => searchContent(trimmed, { role, limit: 80 }),
    [trimmed, role],
  );

  useEffect(() => {
    if (trimmed.length < QURAN_MIN_LENGTH || !wantsQuran) {
      requestRef.current += 1;
      setQuranResults([]);
      setSearchingQuran(false);
      setQuranOffline(false);
      return undefined;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setSearchingQuran(true);
    setQuranOffline(false);

    quranService.search(trimmed, { size: 8 })
      .then(rows => {
        if (requestRef.current !== requestId) return;
        setQuranResults(mapQuranSearchResults(rows));
      })
      .catch(() => {
        if (requestRef.current !== requestId) return;
        setQuranResults([]);
        setQuranOffline(true);
      })
      .finally(() => {
        if (requestRef.current === requestId) setSearchingQuran(false);
      });

    return undefined;
  }, [trimmed, wantsQuran]);

  const sections = useMemo(() => {
    const allowed = FILTER_GROUPS[filter] || GROUP_ORDER;
    const buckets = {};

    for (const item of localResults) {
      if (!allowed.includes(item.group)) continue;
      (buckets[item.group] = buckets[item.group] || []).push(item);
    }

    if (allowed.includes('quran')) {
      buckets.quran = quranResults;
    }

    return GROUP_ORDER
      .filter(group => allowed.includes(group) && (buckets[group] || []).length)
      .map(group => ({
        key: group,
        title: SEARCH_GROUPS[group].label,
        icon: SEARCH_GROUPS[group].icon,
        accent: SEARCH_GROUPS[group].accent,
        data: buckets[group],
      }));
  }, [localResults, quranResults, filter]);

  const totalResults = sections.reduce((sum, section) => sum + section.data.length, 0);
  const hasQuery = trimmed.length >= 2;

  const remember = useCallback(term => {
    saveRecentSearch(term).then(setRecent);
  }, []);

  const openResult = useCallback(item => {
    const term = (query.trim() || item.title).slice(0, 80);
    remember(term);
    Keyboard.dismiss();
    navigateTo(item.route, item.params);
  }, [navigateTo, query, remember]);

  const applySuggestion = term => {
    setQuery(term);
    setDebounced(term);
  };

  const clearRecent = async () => {
    await clearRecentSearches();
    setRecent([]);
  };

  const renderHeader = () => (
    <>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => {
            if (query.trim().length >= 2) remember(query.trim());
            Keyboard.dismiss();
          }}
          returnKeyType="search"
          placeholder="Search Quran, duas, names, hadith..."
          placeholderTextColor={COLORS.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search all Islamic content"
        />
        {query ? (
          <TouchableOpacity
            onPress={() => setQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter chips stay visible in every state so switching from "All" to
          "Quran" does not require clearing the query. */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterChip, active && styles.filterChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filter by ${f.label}`}
            >
              <Ionicons name={f.icon} size={13} color={active ? COLORS.gold : COLORS.textSecondary} />
              <Text style={[styles.filterText, active && { color: COLORS.gold }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!hasQuery ? (
        <View>
          {recent.length > 0 ? (
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>RECENT SEARCHES</Text>
                <TouchableOpacity onPress={clearRecent} accessibilityRole="button" accessibilityLabel="Clear recent searches">
                  <Text style={styles.blockAction}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipWrap}>
                {recent.map(term => (
                  <TouchableOpacity
                    key={term}
                    onPress={() => applySuggestion(term)}
                    style={styles.recentChip}
                    accessibilityRole="button"
                    accessibilityLabel={`Search again for ${term}`}
                  >
                    <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.recentText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.block}>
            <Text style={styles.blockTitle}>TRY SEARCHING FOR</Text>
            <View style={styles.chipWrap}>
              {SUGGESTIONS.map(term => (
                <TouchableOpacity
                  key={term}
                  onPress={() => applySuggestion(term)}
                  style={styles.suggestionChip}
                  accessibilityRole="button"
                  accessibilityLabel={`Search for ${term}`}
                >
                  <Text style={styles.suggestionText}>{term}</Text>
                  <Ionicons name="arrow-forward" size={12} color={COLORS.gold} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="flash-outline" size={18} color={COLORS.emerald} />
            <Text style={styles.infoText}>
              Duas, 99 Names, hadith, seerah and app sections are searched on
              your device and work offline. Quran verses are matched online in
              English translation.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {totalResults === 1 ? '1 result' : `${totalResults} results`} for "{trimmed}"
          </Text>
          {searchingQuran ? (
            <View style={styles.searchingChip}>
              <ActivityIndicator size="small" color={COLORS.gold} />
              <Text style={styles.searchingText}>Quran</Text>
            </View>
          ) : null}
        </View>
      )}

      {quranOffline ? (
        <View style={styles.offlineNotice}>
          <Ionicons name="cloud-offline-outline" size={15} color={COLORS.amber} />
          <Text style={styles.offlineText}>
            Quran search is unreachable right now. Everything stored on your device is still listed.
          </Text>
        </View>
      ) : null}
    </>
  );

  const renderEmpty = () => {
    if (!hasQuery) return null;
    if (searchingQuran && totalResults === 0) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={styles.emptyTitle}>Searching Quran translations...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={46} color={COLORS.glassBorder} />
        <Text style={styles.emptyTitle}>No matches for "{trimmed}"</Text>
        <Text style={styles.emptyBody}>
          Try a shorter word, an English meaning, or the Arabic name without diacritics.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: (COLORS[section.accent] || COLORS.gold) + '1F' }]}>
              <Ionicons name={section.icon} size={14} color={COLORS[section.accent] || COLORS.gold} />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
            {section.key === 'quran' && searchingQuran ? (
              <ActivityIndicator size="small" color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
            ) : null}
          </View>
        )}
        renderItem={({ item }) => {
          const accent = COLORS[item.accent] || COLORS.gold;
          return (
            <TouchableOpacity
              onPress={() => openResult(item)}
              activeOpacity={0.78}
              style={styles.resultCard}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.subtitle}`}
            >
              <View style={[styles.resultIcon, { backgroundColor: accent + '1F' }]}>
                <Ionicons name={item.icon || 'document-text-outline'} size={18} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.resultSubtitle} numberOfLines={2}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={COLORS.textSecondary} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const makeStyles = COLORS => StyleSheet.create({
  listContent: { padding: 16, paddingTop: 8, paddingBottom: 40, flexGrow: 1 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14, height: 48, marginTop: 8,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 15, paddingVertical: 0 },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { borderColor: COLORS.gold + '80', backgroundColor: COLORS.gold + '18' },
  filterText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },

  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 16, marginBottom: 4, gap: 10,
  },
  statusText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', flex: 1 },
  searchingChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchingText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },

  offlineNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.amber + '14', borderRadius: 12, padding: 11,
    borderWidth: 1, borderColor: COLORS.amber + '38', marginTop: 10,
  },
  offlineText: { flex: 1, color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 17 },

  block: { marginTop: 22 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  blockTitle: { color: COLORS.textSecondary, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6 },
  blockAction: { color: COLORS.gold, fontSize: 12, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  recentText: { color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '600' },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: COLORS.gold + '12', borderWidth: 1, borderColor: COLORS.gold + '30',
  },
  suggestionText: { color: COLORS.gold, fontSize: 12.5, fontWeight: '700' },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.emerald + '10', borderWidth: 1, borderColor: COLORS.emerald + '26',
    borderRadius: 14, padding: 14, marginTop: 24,
  },
  infoText: { flex: 1, color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 8 },
  sectionIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 13.5, fontWeight: '800' },
  sectionCount: {
    color: COLORS.textSecondary, fontSize: 10.5, fontWeight: '700',
    backgroundColor: COLORS.surfaceRaised, borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 1, overflow: 'hidden',
  },

  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 8,
  },
  resultIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  resultSubtitle: { color: COLORS.textSecondary, fontSize: 11.5, lineHeight: 16, marginTop: 3 },

  emptyState: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  emptyBody: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
});
