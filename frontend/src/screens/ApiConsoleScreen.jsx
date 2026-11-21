// Developer Console: the backend's own API catalogue, rendered in the app.
//
// This screen exists so "what does the backend expose?" is answerable without
// opening the server source or remembering curl flags. It shows the live
// catalogue, probes latency, and can invoke only the public GET routes that
// the server marks `testable` — never a write.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Linking, Platform, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { apiUrl } from '../config/appConfig';
import { hasAuthToken } from '../services/authToken';
import {
  fetchApiCatalog, getEndpointUrl, readCachedApiCatalog, testApiEndpoint,
} from '../services/apiCatalog';

const METHOD_COLORS = {
  GET: 'emerald',
  POST: 'blue',
  PUT: 'amber',
  PATCH: 'amber',
  DELETE: 'red',
};

function formatUptime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

function formatWhen(timestamp) {
  if (!timestamp) return '—';
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return '—';
  }
}

export default function ApiConsoleScreen() {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [catalog, setCatalog] = useState(null);
  const [source, setSource] = useState('none'); // 'live' | 'cache' | 'none'
  const [latencyMs, setLatencyMs] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});
  const [hasSession, setHasSession] = useState(null);

  const [testingPath, setTestingPath] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [openError, setOpenError] = useState(null);

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const load = useCallback(async ({ manual = false } = {}) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await fetchApiCatalog();
      setCatalog(result.catalog);
      setSource('live');
      setLatencyMs(result.latencyMs);
      setRequestId(result.requestId);
      setFetchedAt(result.fetchedAt);
      setExpanded(previous => (
        Object.keys(previous).length
          ? previous
          : { [result.catalog.groups[0]?.id]: true }
      ));
    } catch (liveError) {
      const cached = await readCachedApiCatalog();
      if (cached) {
        setCatalog(cached.catalog);
        setSource('cache');
        setLatencyMs(cached.latencyMs);
        setRequestId(cached.requestId);
        setFetchedAt(cached.fetchedAt);
        setExpanded(previous => (
          Object.keys(previous).length
            ? previous
            : { [cached.catalog.groups[0]?.id]: true }
        ));
        setError(`${liveError.message} Showing the last saved catalogue.`);
      } else {
        setCatalog(null);
        setSource('none');
        setError(liveError.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let active = true;
    hasAuthToken().then(present => { if (active) setHasSession(present); });
    return () => { active = false; };
  }, []);

  const groups = useMemo(() => {
    if (!catalog) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return catalog.groups;

    return catalog.groups
      .map(group => {
        const groupText = `${group.title} ${group.description || ''}`.toLowerCase();
        const endpoints = groupText.includes(needle)
          ? group.endpoints
          : group.endpoints.filter(endpoint => (
            `${endpoint.method} ${endpoint.path} ${endpoint.fullPath} ${endpoint.summary}`
              .toLowerCase()
              .includes(needle)
          ));
        return { ...group, endpoints };
      })
      .filter(group => group.endpoints.length > 0);
  }, [catalog, query]);

  const runTest = async endpoint => {
    setTestingPath(endpoint.fullPath);
    setTestResult({ endpoint, pending: true });
    try {
      const result = await testApiEndpoint(endpoint);
      setTestResult({ endpoint, ...result });
    } catch (testError) {
      setTestResult({ endpoint, error: testError.message });
    } finally {
      setTestingPath(null);
    }
  };

  const openEndpoint = endpoint => {
    const url = getEndpointUrl(endpoint);
    if (!url) {
      setOpenError('This catalogue entry does not have a usable address.');
      return;
    }
    const failed = () => setOpenError(
      `Could not open a browser for ${url}. Copy the address into one instead.`
    );

    setOpenError(null);

    // On the web preview a new tab keeps the console open; on a phone
    // Linking hands the address to the system browser (or a browser app).
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.open === 'function') {
      try {
        // Some embedded browsers ignore the target and reuse the tab, so a
        // null return is not treated as a failure.
        const opened = window.open(url, '_blank');
        if (opened) opened.opener = null;
      } catch {
        failed();
      }
      return;
    }

    Linking.openURL(url).catch(failed);
  };

  const renderEndpoint = endpoint => {
    const methodColor = COLORS[METHOD_COLORS[endpoint.method] || 'textSecondary'];
    const testing = testingPath === endpoint.fullPath;
    const endpointUrl = getEndpointUrl(endpoint);

    return (
      <View key={`${endpoint.method}-${endpoint.path}`} style={styles.endpointRow}>
        <TouchableOpacity
          style={styles.endpointLink}
          onPress={() => openEndpoint(endpoint)}
          accessibilityRole="link"
          accessibilityLabel={`Open ${endpoint.method} ${endpoint.path} in your browser`}
          accessibilityHint={endpointUrl ? `Opens ${endpointUrl}` : 'Opens the API address in a browser'}
        >
          <View style={styles.endpointTop}>
            <View style={[styles.methodBadge, { backgroundColor: `${methodColor}1F`, borderColor: `${methodColor}55` }]}>
              <Text style={[styles.methodText, { color: methodColor }]}>{endpoint.method}</Text>
            </View>
            <Text style={styles.endpointPath} numberOfLines={2}>{endpoint.path}</Text>
            {endpoint.auth !== 'public' ? (
              <Ionicons
                name={endpoint.auth === 'admin' ? 'shield-checkmark-outline' : 'lock-closed-outline'}
                size={14}
                color={COLORS.textSecondary}
                accessibilityLabel={endpoint.auth === 'admin' ? 'Admin only' : 'Session required'}
              />
            ) : null}
            <Ionicons name="open-outline" size={14} color={COLORS.gold} />
          </View>
          <Text style={styles.endpointSummary}>{endpoint.summary}</Text>
        </TouchableOpacity>

        {endpoint.testable ? (
          <TouchableOpacity
            style={[styles.testButton, testing && { opacity: 0.6 }]}
            onPress={() => runTest(endpoint)}
            disabled={testing}
            accessibilityRole="button"
            accessibilityLabel={`Test ${endpoint.method} ${endpoint.path}`}
          >
            {testing
              ? <ActivityIndicator size="small" color={COLORS.gold} />
              : <Text style={styles.testButtonText}>Test</Text>}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderStatus = () => {
    if (loading && !catalog) {
      return (
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator color={COLORS.gold} />
          <Text style={styles.loadingText}>Reading backend catalogue…</Text>
        </View>
      );
    }

    const reachable = source === 'live';
    const statusColor = reachable ? COLORS.emerald : source === 'cache' ? COLORS.amber : COLORS.red;
    const statusLabel = reachable ? 'API reachable' : source === 'cache' ? 'Showing saved catalogue' : 'API unreachable';

    return (
      <View style={styles.card}>
        <View style={[globalStyles.row, { gap: 9 }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusLabel}>{statusLabel}</Text>
          {latencyMs != null ? (
            <Text style={styles.latency}>{latencyMs} ms</Text>
          ) : null}
        </View>

        <Text style={styles.baseUrl} selectable>{apiUrl}</Text>

        <View style={styles.factGrid}>
          <Fact styles={styles} label="API version" value={catalog?.version || '—'} />
          <Fact styles={styles} label="Uptime" value={formatUptime(catalog?.uptimeSeconds)} />
          <Fact styles={styles} label="Platform" value={`${Platform.OS} · app ${appVersion}`} />
          <Fact styles={styles} label="Session" value={hasSession === null ? 'Checking…' : hasSession ? 'Signed in' : 'Anonymous'} />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => load({ manual: true })}
            disabled={refreshing}
            accessibilityRole="button"
            accessibilityLabel="Refresh API catalogue"
          >
            {refreshing
              ? <ActivityIndicator size="small" color={COLORS.gold} />
              : <Ionicons name="refresh" size={15} color={COLORS.gold} />}
            <Text style={styles.refreshText}>{refreshing ? 'Refreshing' : 'Refresh'}</Text>
          </TouchableOpacity>
          <Text style={styles.fetchedAt}>Read {formatWhen(fetchedAt)}</Text>
        </View>

        {requestId ? (
          <Text style={styles.requestId} selectable>Request {requestId}</Text>
        ) : null}

        {catalog?.counts ? (
          <View style={styles.countRow}>
            <Text style={styles.count}>{catalog.counts.endpoints} endpoints</Text>
            <Text style={styles.count}>{catalog.counts.groups} groups</Text>
            <Text style={styles.count}>{catalog.counts.testable} testable</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>DEVELOPER TOOLS</Text>
        <Text style={styles.title}>Backend API</Text>
        <Text style={styles.intro}>
          Every endpoint the server exposes, read live from the backend. Tap any
          endpoint to open its address in a browser. Locked routes need a
          signed-in session; shield routes need an administrator. Only public
          GET routes can be invoked here.
        </Text>

        {renderStatus()}

        {error ? (
          <View style={styles.notice}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.amber} />
            <Text style={styles.noticeText}>{error}</Text>
            {!catalog ? (
              <TouchableOpacity
                onPress={() => load({ manual: true })}
                accessibilityRole="button"
                accessibilityLabel="Try API again"
              >
                <Text style={styles.noticeAction}>Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {openError ? (
          <View style={styles.notice}>
            <Ionicons name="open-outline" size={18} color={COLORS.amber} />
            <Text style={styles.noticeText}>{openError}</Text>
            <TouchableOpacity
              onPress={() => setOpenError(null)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss browser error"
            >
              <Ionicons name="close" size={17} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {catalog ? (
          <>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={17} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search endpoints, methods or groups"
                placeholderTextColor={COLORS.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Search API endpoints"
              />
              {query ? (
                <TouchableOpacity
                  onPress={() => setQuery('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {testResult ? (
              <View style={[styles.card, styles.resultCard]}>
                <View style={[globalStyles.row, { gap: 8 }]}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {testResult.endpoint.method} {testResult.endpoint.path}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setTestResult(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss test result"
                  >
                    <Ionicons name="close" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                {testResult.pending ? (
                  <View style={[globalStyles.row, { gap: 8, marginTop: 10 }]}>
                    <ActivityIndicator size="small" color={COLORS.gold} />
                    <Text style={styles.metaText}>Calling the endpoint…</Text>
                  </View>
                ) : testResult.error ? (
                  <Text style={styles.testError}>{testResult.error}</Text>
                ) : (
                  <>
                    <View style={[globalStyles.row, { gap: 12, marginTop: 8 }]}>
                      <View style={[
                        styles.statusChip,
                        {
                          backgroundColor: testResult.ok ? `${COLORS.emerald}1F` : `${COLORS.red}1F`,
                          borderColor: testResult.ok ? `${COLORS.emerald}55` : `${COLORS.red}55`,
                        },
                      ]}>
                        <Text style={[styles.statusChipText, { color: testResult.ok ? COLORS.emerald : COLORS.red }]}>
                          HTTP {testResult.status}
                        </Text>
                      </View>
                      <Text style={styles.metaText}>{testResult.latencyMs} ms</Text>
                      {testResult.requestId ? (
                        <Text style={styles.metaText} numberOfLines={1}>
                          id {testResult.requestId.slice(0, 8)}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.responseLabel}>RESPONSE</Text>
                    <Text style={styles.response} selectable>{testResult.preview}</Text>
                  </>
                )}
              </View>
            ) : null}

            {groups.length === 0 ? (
              <Text style={styles.empty}>No endpoint matches “{query.trim()}”.</Text>
            ) : null}

            {groups.map(group => {
              const open = query.trim() ? true : Boolean(expanded[group.id]);
              return (
                <View key={group.id} style={styles.groupCard}>
                  <TouchableOpacity
                    style={styles.groupHeader}
                    onPress={() => setExpanded(previous => ({ ...previous, [group.id]: !open }))}
                    accessibilityRole="button"
                    accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${group.title}`}
                    accessibilityState={{ expanded: open }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupTitle}>{group.title}</Text>
                      {group.description ? (
                        <Text style={styles.groupDescription}>{group.description}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.groupCount}>{group.endpoints.length}</Text>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={17}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                  {open ? group.endpoints.map(renderEndpoint) : null}
                </View>
              );
            })}
          </>
        ) : null}

        <Text style={styles.footnote}>
          Links open the live API in your browser. Browsers only send GET
          requests, so write routes answer “Endpoint not found” there. Session
          and admin routes answer with an auth error because your token never
          leaves the app, and routes with :params need real values. Opening a
          link never changes data.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Fact({ styles, label, value }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const makeStyles = (COLORS) => ({
  content: { padding: 16, paddingBottom: 44 },

  eyebrow: {
    color: COLORS.gold, fontSize: 11, fontWeight: '800',
    letterSpacing: 1.8, marginBottom: 4,
  },
  title: { color: COLORS.textPrimary, fontSize: 27, fontWeight: '900' },
  intro: {
    color: COLORS.textSecondary, fontSize: 13, lineHeight: 20,
    marginTop: 8, marginBottom: 16,
  },

  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
    marginBottom: 14,
  },
  loadingCard: { alignItems: 'center', gap: 12, paddingVertical: 26 },
  loadingText: { color: COLORS.textSecondary, fontSize: 13 },

  dot: { width: 9, height: 9, borderRadius: 5 },
  statusLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  latency: {
    marginLeft: 'auto', color: COLORS.textSecondary,
    fontSize: 12, fontVariant: ['tabular-nums'],
  },
  baseUrl: {
    color: COLORS.gold, fontSize: 12, marginTop: 8,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },

  factGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginTop: 14, rowGap: 12,
  },
  fact: { width: '50%', paddingRight: 8 },
  factLabel: {
    color: COLORS.textSecondary, fontSize: 10, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  factValue: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600', marginTop: 3 },

  actionsRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginTop: 16,
    borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: 12,
  },
  refreshButton: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: `${COLORS.gold}55`,
  },
  refreshText: { color: COLORS.gold, fontSize: 12.5, fontWeight: '700' },
  fetchedAt: { color: COLORS.textSecondary, fontSize: 10.5, flexShrink: 1 },
  requestId: {
    color: COLORS.textSecondary, fontSize: 10, marginTop: 8,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  countRow: { flexDirection: 'row', gap: 14, marginTop: 10 },
  count: { color: COLORS.textSecondary, fontSize: 11.5, fontWeight: '600' },

  notice: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: `${COLORS.amber}14`,
    borderWidth: 1, borderColor: `${COLORS.amber}40`,
    borderRadius: 14, padding: 12, marginBottom: 14,
  },
  noticeText: { flex: 1, color: COLORS.textSecondary, fontSize: 12, lineHeight: 17 },
  noticeAction: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: 14, paddingHorizontal: 12, marginBottom: 14,
  },
  searchInput: {
    flex: 1, color: COLORS.textPrimary, fontSize: 14,
    paddingVertical: 11,
  },

  resultCard: { borderColor: `${COLORS.gold}44` },
  resultTitle: {
    flex: 1, color: COLORS.textPrimary, fontSize: 13, fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  statusChip: {
    borderRadius: 7, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  statusChipText: { fontSize: 11, fontWeight: '800' },
  metaText: { color: COLORS.textSecondary, fontSize: 11 },
  testError: { color: COLORS.red, fontSize: 12, lineHeight: 18, marginTop: 8 },
  responseLabel: {
    color: COLORS.textSecondary, fontSize: 9.5, fontWeight: '800',
    letterSpacing: 1.2, marginTop: 14, marginBottom: 5,
  },
  response: {
    color: COLORS.textPrimary, fontSize: 11.5, lineHeight: 17,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },

  empty: {
    color: COLORS.textSecondary, fontSize: 13,
    textAlign: 'center', paddingVertical: 24,
  },

  groupCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.glassBorder,
    marginBottom: 10, overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  groupTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  groupDescription: { color: COLORS.textSecondary, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  groupCount: {
    color: COLORS.gold, fontSize: 11, fontWeight: '800',
    backgroundColor: `${COLORS.gold}18`, borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden',
  },

  endpointRow: {
    borderTopWidth: 1, borderTopColor: COLORS.divider,
    paddingHorizontal: 14, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  endpointLink: { flex: 1 },
  endpointTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  methodBadge: {
    borderRadius: 6, borderWidth: 1,
    paddingHorizontal: 6, paddingVertical: 2, minWidth: 42,
    alignItems: 'center',
  },
  methodText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },
  endpointPath: {
    flex: 1, color: COLORS.textPrimary, fontSize: 12, fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  endpointSummary: {
    color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 5,
  },
  testButton: {
    minWidth: 46, height: 25, borderRadius: 8,
    borderWidth: 1, borderColor: `${COLORS.gold}55`,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 8, alignSelf: 'flex-start',
  },
  testButtonText: { color: COLORS.gold, fontSize: 10.5, fontWeight: '800' },

  footnote: {
    color: COLORS.textSecondary, fontSize: 10.5, lineHeight: 16,
    opacity: 0.75, marginTop: 8,
  },
});
