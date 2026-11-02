// Islamic News — a reader for headlines from trusted Muslim-world publishers.
//
// The server aggregates and sanitises the feeds. This screen adds what a
// phone actually needs: every story opens at the original publisher, the last
// snapshot remains readable offline, and any story can be bookmarked locally.
// Headline content stays in its published language (English); the feature name
// and chrome follow the app's English navigation policy.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { useShare } from '../context/ShareContext';
import { isOnline, onConnectivityChange } from '../services/cache';
import {
  NEWS_SOURCES,
  fetchIslamicNews,
  getSavedNews,
  newsAccent,
  newsTimeAgo,
  toggleSavedNews,
} from '../services/islamicNews';

const EMPTY_FEED = {
  items: [],
  sources: [],
  trending: [],
  fetchedAt: null,
  partial: false,
  stale: false,
};

function NewsCard({ item, styles, COLORS, t, saved, onOpen, onShare, onSave }) {
  const [imageFailed, setImageFailed] = useState(false);
  const accent = COLORS[newsAccent(item.source.id)] || COLORS.gold;
  const published = newsTimeAgo(item.publishedAt);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => onOpen(item)}
        activeOpacity={0.86}
        accessibilityRole="link"
        accessibilityLabel={`${item.title}. ${item.source.name}`}
      >
        {item.image && !imageFailed ? (
          <Image
            source={{ uri: item.image }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            accessible={false}
          />
        ) : (
          <LinearGradient
            colors={[accent + '24', COLORS.bgSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.imageFallback}
          >
            <Ionicons name="newspaper-outline" size={26} color={accent} />
          </LinearGradient>
        )}

        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <View style={[styles.sourceDot, { backgroundColor: accent }]} />
            <Text style={[styles.sourceName, { color: accent }]} numberOfLines={1}>
              {item.source.name}
            </Text>
            {published ? (
              <>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.metaTime}>{published}</Text>
              </>
            ) : null}
            {saved ? (
              <View style={styles.savedTag}>
                <Ionicons name="bookmark" size={9} color={COLORS.gold} />
                <Text style={styles.savedTagText}>{t('news.saved', 'Saved')}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
          {item.summary ? (
            <Text style={styles.cardSummary} numberOfLines={3}>{item.summary}</Text>
          ) : null}
          {item.keywords?.length ? (
            <View style={styles.tagRow}>
              {item.keywords.slice(0, 3).map(keyword => (
                <View key={keyword} style={styles.tag}>
                  <Text style={styles.tagText}>{keyword}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.readAction}
          onPress={() => onOpen(item)}
          accessibilityRole="button"
          accessibilityLabel={`${t('news.read', 'Read full story')}: ${item.title}`}
        >
          <Text style={styles.readText}>{t('news.read', 'Read full story')}</Text>
          <Ionicons name="arrow-forward" size={13} color={COLORS.cyan} />
        </TouchableOpacity>

        <View style={styles.iconActions}>
          <TouchableOpacity
            onPress={() => onSave(item)}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityState={{ selected: saved }}
            accessibilityLabel={
              `${saved
                ? t('news.unsave', 'Remove saved story')
                : t('news.save', 'Save story')}: ${item.title}`
            }
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={saved ? COLORS.gold : COLORS.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onShare(item)}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={`${t('news.share', 'Share story')}: ${item.title}`}
          >
            <Ionicons name="share-social-outline" size={17} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function IslamicNewsScreen() {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);
  const { t } = useLanguage();
  const { share } = useShare();

  const [feed, setFeed] = useState(EMPTY_FEED);
  const [saved, setSaved] = useState([]);
  const [tab, setTab] = useState('latest');
  const [source, setSource] = useState('all');
  const [trend, setTrend] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const mounted = useRef(true);

  const load = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    try {
      const data = await fetchIslamicNews({ forceRefresh: refresh });
      if (!mounted.current) return;
      setFeed(data);
      setFailed(false);
    } catch (error) {
      console.warn('News request failed:', error?.message);
      if (mounted.current) setFailed(true);
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    getSavedNews().then(items => {
      if (mounted.current) setSaved(items);
    });

    load();
    const unsubscribe = onConnectivityChange(next => {
      if (mounted.current) setOnline(next);
    });

    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [load]);

  const saveStory = useCallback(async item => {
    try {
      const result = await toggleSavedNews(item);
      if (mounted.current) setSaved(result.items);
    } catch (error) {
      console.warn('Saving a news story failed:', error?.message);
    }
  }, []);

  const openStory = useCallback(async item => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(item.url, '_blank', 'noopener,noreferrer');
        return;
      }
      await Linking.openURL(item.url);
    } catch {
      Alert.alert(
        'Could not open article',
        'The publisher link could not be opened. Please try again.'
      );
    }
  }, []);

  const shareStory = useCallback(
    item => {
      share({
        title: item.title,
        message: `${item.title}\n\n${item.summary}\n\n— ${item.source.name}`,
        url: item.url,
      });
    },
    [share]
  );

  const sourceOptions = useMemo(() => {
    const map = new Map();
    NEWS_SOURCES.forEach(item => map.set(item.id, { ...item, accent: newsAccent(item.id) }));
    feed.sources.forEach(item => map.set(item.id, { ...item, accent: newsAccent(item.id) }));
    saved.forEach(item => {
      if (!map.has(item.source.id)) {
        map.set(item.source.id, { ...item.source, accent: newsAccent(item.source.id) });
      }
    });
    return [{ id: 'all', name: t('news.allSources', 'All sources') }, ...map.values()];
  }, [feed.sources, saved, t]);

  const savedIds = useMemo(() => new Set(saved.map(item => item.id)), [saved]);
  const normalizedQuery = query.trim().toLowerCase();

  const visible = useMemo(() => {
    const pool = tab === 'saved' ? saved : feed.items;
    const trendNeedle = trend?.toLowerCase() || '';
    return pool.filter(item => {
      if (source !== 'all' && item.source.id !== source) return false;
      if (trendNeedle) {
        // Trends come from the server's deterministic mining pass; match the
        // label against the story's own mined topics and keywords.
        const mined = `${(item.topics || []).join(' ')} ${(item.keywords || []).join(' ')}`
          .toLowerCase();
        if (!mined.includes(trendNeedle)) return false;
      }
      if (!normalizedQuery) return true;
      return `${item.title} ${item.summary} ${item.source.name}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [tab, saved, feed.items, source, trend, normalizedQuery]);

  const clearFilters = () => {
    setQuery('');
    setSource('all');
    setTrend(null);
  };

  const updated = feed.fetchedAt
    ? `${t('news.updated', 'Updated')} ${newsTimeAgo(feed.fetchedAt)}`
    : t('news.notUpdated', 'Not updated yet');

  let statusText = updated;
  let statusColor = online ? COLORS.emerald : COLORS.amber;

  if (!online) {
    statusText = feed.items.length
      ? t('news.offline', 'Offline — showing saved headlines')
      : t('news.offlineEmpty', 'Offline — connect to load headlines');
  } else if (failed || feed.stale) {
    statusText = feed.items.length
      ? t('news.stale', 'Could not refresh — showing earlier headlines')
      : t('news.loadErrorBody', 'Check your connection, then try again.');
  } else if (feed.partial) {
    statusText = t('news.partial', 'Some sources are unavailable right now');
    statusColor = COLORS.cyan;
  }

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <Text style={[styles.emptyTitle, { marginTop: 14 }]}>
            {t('news.loading', 'Loading headlines…')}
          </Text>
        </View>
      );
    }

    if (tab === 'saved' && !saved.length) {
      return (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bookmark-outline" size={26} color={COLORS.gold} />
          </View>
          <Text style={styles.emptyTitle}>{t('news.savedEmpty', 'No saved stories')}</Text>
          <Text style={styles.emptyBody}>
            {t('news.savedEmptyBody', 'Tap the bookmark on a story to keep it here for later.')}
          </Text>
        </View>
      );
    }

    if (failed && !feed.items.length) {
      return (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cloud-offline-outline" size={27} color={COLORS.amber} />
          </View>
          <Text style={styles.emptyTitle}>{t('news.loadError', 'Could not load headlines')}</Text>
          <Text style={styles.emptyBody}>
            {t('news.loadErrorBody', 'Check your connection, then try again.')}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => load({ refresh: true })}
            accessibilityRole="button"
            accessibilityLabel={t('news.retry', 'Try again')}
          >
            <Text style={styles.retryText}>{t('news.retry', 'Try again')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (normalizedQuery || source !== 'all' || trend) {
      return (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="search-outline" size={26} color={COLORS.cyan} />
          </View>
          <Text style={styles.emptyTitle}>
            {t('news.noMatches', 'No stories match your filters')}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={clearFilters}
            accessibilityRole="button"
            accessibilityLabel={t('news.clearFilters', 'Clear filters')}
          >
            <Text style={styles.retryText}>{t('news.clearFilters', 'Clear filters')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="newspaper-outline" size={26} color={COLORS.cyan} />
        </View>
        <Text style={styles.emptyTitle}>{t('news.empty', 'No headlines yet')}</Text>
        <Text style={styles.emptyBody}>
          {t('news.emptyBody', 'Pull down to refresh, or try again in a moment.')}
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => load({ refresh: true })}
          accessibilityRole="button"
          accessibilityLabel={t('news.retry', 'Try again')}
        >
          <Text style={styles.retryText}>{t('news.retry', 'Try again')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const header = (
    <View>
      <LinearGradient
        colors={[COLORS.cyan + '24', COLORS.bgSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="newspaper" size={23} color={COLORS.cyan} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>{t('news.kicker', 'MUSLIM WORLD · LIVE')}</Text>
            <Text style={styles.title}>{t('news.title', 'Islamic News')}</Text>
            <Text style={styles.subtitle}>
              {t('news.subtitle', 'Headlines from trusted publishers, in one place.')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => load({ refresh: true })}
            style={styles.refreshButton}
            disabled={refreshing}
            accessibilityRole="button"
            accessibilityLabel={t('news.refresh', 'Refresh headlines')}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={COLORS.cyan} />
            ) : (
              <Ionicons name="refresh" size={18} color={COLORS.cyan} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText} numberOfLines={2}>{statusText}</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'latest' && styles.tabActive]}
          onPress={() => setTab('latest')}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'latest' }}
          accessibilityLabel={t('news.latest', 'Latest')}
        >
          <Ionicons
            name="newspaper-outline"
            size={14}
            color={tab === 'latest' ? COLORS.bg : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, tab === 'latest' && styles.tabTextActive]}>
            {t('news.latest', 'Latest')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'saved' && styles.tabActive]}
          onPress={() => setTab('saved')}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'saved' }}
          accessibilityLabel={`${t('news.saved', 'Saved')} (${saved.length})`}
        >
          <Ionicons
            name={tab === 'saved' ? 'bookmark' : 'bookmark-outline'}
            size={14}
            color={tab === 'saved' ? COLORS.bg : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, tab === 'saved' && styles.tabTextActive]}>
            {t('news.saved', 'Saved')}{saved.length ? ` (${saved.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={15} color={COLORS.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('news.search', 'Search headlines')}
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          accessibilityLabel={t('news.search', 'Search headlines')}
        />
        {query ? (
          <TouchableOpacity
            onPress={() => setQuery('')}
            accessibilityRole="button"
            accessibilityLabel={t('news.clearSearch', 'Clear search')}
          >
            <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {tab === 'latest' && (feed.trending || []).length ? (
        <View style={styles.trendBlock}>
          <View style={styles.trendHead}>
            <Ionicons name="trending-up" size={13} color={COLORS.gold} />
            <Text style={styles.trendTitle}>
              {t('news.trending', 'TRENDING IN THE HEADLINES')}
            </Text>
            {trend ? (
              <TouchableOpacity
                onPress={() => setTrend(null)}
                accessibilityRole="button"
                accessibilityLabel={t('news.clearTrend', 'Clear trending filter')}
              >
                <Text style={styles.trendClear}>{t('news.clear', 'Clear')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendRow}
          >
            {(feed.trending || []).map(entry => {
              const active = trend === entry.label;
              return (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => setTrend(active ? null : entry.label)}
                  style={[styles.trendChip, active && styles.trendChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Trending topic: ${entry.label}, ${entry.count} stories`}
                >
                  <Text style={[styles.trendChipText, active && styles.trendChipTextActive]}>
                    {entry.label}
                  </Text>
                  <Text style={[styles.trendCount, active && styles.trendCountActive]}>
                    {entry.count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={styles.trendHint}>
            {t(
              'news.trendingHint',
              'Keyword analysis of the latest headlines — no AI model involved.'
            )}
          </Text>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sourceRow}
      >
        {sourceOptions.map(option => {
          const active = source === option.id;
          const accent = option.id === 'all'
            ? COLORS.gold
            : (COLORS[option.accent] || COLORS.gold);
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => setSource(option.id)}
              style={[
                styles.sourceChip,
                active && { borderColor: accent, backgroundColor: accent + '18' },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.name}
            >
              {option.id === 'all' ? (
                <Ionicons
                  name="layers-outline"
                  size={12}
                  color={active ? accent : COLORS.textSecondary}
                />
              ) : (
                <View style={[styles.sourceDotSmall, { backgroundColor: accent }]} />
              )}
              <Text style={[styles.sourceChipText, active && { color: accent }]}>
                {option.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <FlatList
        data={visible}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NewsCard
            item={item}
            styles={styles}
            COLORS={COLORS}
            t={t}
            saved={savedIds.has(item.id)}
            onOpen={openStory}
            onShare={shareStory}
            onSave={saveStory}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={
          visible.length ? (
            <Text style={styles.footer}>
              {t(
                'news.footer',
                'Headlines are published in English by the original outlets. Tap a story to read it at the source.'
              )}
            </Text>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({ refresh: true })}
            tintColor={COLORS.gold}
            colors={[COLORS.gold]}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraData={saved}
      />
    </SafeAreaView>
  );
}

const makeStyles = COLORS => StyleSheet.create({
  content: { paddingBottom: 44 },
  hero: {
    margin: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cyan + '30',
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cyan + '16',
    borderWidth: 1,
    borderColor: COLORS.cyan + '3D',
  },
  heroCopy: { flex: 1 },
  kicker: {
    color: COLORS.cyan,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cyan + '14',
    borderWidth: 1,
    borderColor: COLORS.cyan + '38',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cyan + '1F',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabActive: { backgroundColor: COLORS.gold },
  tabText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: COLORS.bg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13.5,
    paddingVertical: 2,
  },
  sourceRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgSecondary,
  },
  sourceChipText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  sourceDotSmall: { width: 5, height: 5, borderRadius: 3 },
  trendBlock: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.gold + '26',
  },
  trendHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 9,
  },
  trendTitle: {
    flex: 1,
    color: COLORS.gold,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  trendClear: {
    color: COLORS.cyan,
    fontSize: 10.5,
    fontWeight: '800',
  },
  trendRow: { gap: 7, paddingRight: 4 },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  trendChipActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.gold + '18',
  },
  trendChipText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  trendChipTextActive: { color: COLORS.gold },
  trendCount: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontWeight: '800',
    minWidth: 10,
    textAlign: 'center',
  },
  trendCountActive: { color: COLORS.gold },
  trendHint: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.cyan + '12',
    borderWidth: 1,
    borderColor: COLORS.cyan + '22',
  },
  tagText: {
    color: COLORS.cyan,
    fontSize: 9.5,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImage: { width: '100%', height: 152, backgroundColor: COLORS.bg },
  imageFallback: {
    width: '100%',
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 14 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },
  sourceDot: { width: 6, height: 6, borderRadius: 3 },
  sourceName: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  metaSep: { color: COLORS.textMuted, fontSize: 10 },
  metaTime: { color: COLORS.textMuted, fontSize: 10.5, fontWeight: '600' },
  savedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.gold + '18',
  },
  savedTagText: { color: COLORS.gold, fontSize: 9, fontWeight: '800' },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15.5,
    fontWeight: '800',
    lineHeight: 21,
  },
  cardSummary: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 6,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  readAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  readText: { color: COLORS.cyan, fontSize: 11.5, fontWeight: '800' },
  iconActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: {
    width: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cyan + '12',
    borderWidth: 1,
    borderColor: COLORS.cyan + '30',
    marginBottom: 14,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyBody: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.gold,
  },
  retryText: { color: COLORS.bg, fontSize: 12.5, fontWeight: '800' },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 10,
    color: COLORS.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
  },
});
