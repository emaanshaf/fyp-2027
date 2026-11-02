import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  RefreshControl, Share, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { collectDiagnostics } from '../services/diagnostics';
import {
  assessHealth, buildReportText, formatDuration,
} from '../services/diagnosticsFormat';

const LEVEL_COLOR = { ok: 'emerald', offline: 'amber', attention: 'red' };
const LEVEL_ICON = { ok: 'checkmark-circle', offline: 'cloud-offline', attention: 'warning' };

/**
 * Copy text in a browser, tolerating restrictions.
 *
 * The async Clipboard API needs a permission that embedded browsers and some
 * privacy modes deny. execCommand still works in those, and it also covers
 * older browsers where navigator.clipboard is absent.
 */
async function copyTextOnWeb(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied — try the legacy path.
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    if (copied) return true;
  } catch {
    // Fall through to the manual prompt.
  }
  return false;
}

function InfoRow({ label, value, hint, tone, styles, COLORS, last }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text
          style={[styles.rowValue, tone && { color: COLORS[tone] || COLORS.textPrimary }]}
          numberOfLines={3}
        >
          {value}
        </Text>
        {hint ? <Text style={styles.rowHint} numberOfLines={2}>{hint}</Text> : null}
      </View>
    </View>
  );
}

export default function DiagnosticsScreen({ navigation }) {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);

  const load = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    try {
      setReport(await collectDiagnostics());
    } catch (e) {
      // collectDiagnostics already catches each subsystem; this is only for
      // an unexpected failure in the collector itself.
      setReport({
        generatedAt: new Date().toISOString(),
        runtime: {},
        backend: { ok: false, reachable: false, error: e?.message, url: '' },
        storage: { malformed: [], error: e?.message },
        offline: {},
        cache: {},
        notifications: { status: 'unknown' },
        appLock: {},
        preferences: {},
        ai: { ok: false },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const shareReport = async () => {
    if (!report || sharing) return;
    setSharing(true);
    const text = buildReportText(report);
    try {
      if (Platform.OS === 'web') {
        const copied = await copyTextOnWeb(text);
        if (copied) {
          Alert.alert('Report copied', 'The system report is on your clipboard. It contains no token or PIN.');
        } else {
          // The embedded browser and some privacy modes refuse both the
          // async clipboard and execCommand. A prefilled prompt still lets
          // the user select and copy the report by hand.
          window.prompt('Copy the system report', text);
        }
      } else {
        await Share.share({
          title: 'Qitab-e-Noor system report',
          message: text,
        });
      }
    } catch (e) {
      Alert.alert('Could not share report', e?.message || 'Try again.');
    } finally {
      setSharing(false);
    }
  };

  if (loading && !report) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Checking backend, storage and permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const health = assessHealth(report);
  const levelColor = COLORS[LEVEL_COLOR[health.level]] || COLORS.emerald;
  const runtime = report?.runtime || {};
  const backend = report?.backend || {};
  const storage = report?.storage || {};
  const offline = report?.offline || {};
  const cache = report?.cache || {};
  const notifications = report?.notifications || {};
  const appLock = report?.appLock || {};
  const prefs = report?.preferences || {};
  const ai = report?.ai || {};

  const generatedLabel = report?.generatedAt
    ? new Date(report.generatedAt).toLocaleString()
    : '—';

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            tintColor={COLORS.gold}
            colors={[COLORS.gold]}
          />
        }
      >
        <Text style={styles.eyebrow}>DEVELOPER TOOLS</Text>
        <Text style={styles.title}>System Health</Text>
        <Text style={styles.intro}>
          A read-only snapshot of this installation. Nothing here changes your
          data or asks for permissions. Pull down to check again.
        </Text>

        <View style={[styles.hero, { borderColor: levelColor + '55', backgroundColor: levelColor + '12' }]}>
          <View style={[styles.heroIcon, { backgroundColor: levelColor + '22' }]}>
            <Ionicons name={LEVEL_ICON[health.level]} size={26} color={levelColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: levelColor }]}>{health.title}</Text>
            <Text style={styles.heroDetail}>{health.detail}</Text>
            <Text style={styles.heroTime}>Checked {generatedLabel}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => load('refresh')}
            disabled={refreshing}
            accessibilityRole="button"
            accessibilityLabel="Run health checks again"
          >
            {refreshing
              ? <ActivityIndicator size="small" color={COLORS.bg} />
              : <Ionicons name="refresh" size={16} color={COLORS.bg} />}
            <Text style={styles.primaryBtnText}>Run checks again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={shareReport}
            disabled={sharing}
            accessibilityRole="button"
            accessibilityLabel="Copy or share the system report"
          >
            {sharing
              ? <ActivityIndicator size="small" color={COLORS.gold} />
              : <Ionicons name={Platform.OS === 'web' ? 'copy-outline' : 'share-outline'} size={16} color={COLORS.gold} />}
            <Text style={styles.secondaryBtnText}>
              {Platform.OS === 'web' ? 'Copy report' : 'Share report'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>RUNTIME</Text>
        <View style={styles.card}>
          <InfoRow styles={styles} COLORS={COLORS} label="App version" value={runtime.appVersion || 'unknown'} hint={`Expo SDK ${runtime.sdkVersion || 'unknown'}`} />
          <InfoRow styles={styles} COLORS={COLORS} label="Platform" value={`${runtime.platform || 'unknown'} · ${runtime.osName || ''} ${runtime.osVersion || ''}`.trim()} hint={runtime.physical ? 'Physical device' : 'Simulator or browser'} />
          <InfoRow styles={styles} COLORS={COLORS} label="Device" value={runtime.deviceName || 'unknown'} />
          <InfoRow styles={styles} COLORS={COLORS} label="JS engine" value={runtime.engine || 'unknown'} last />
        </View>

        <Text style={styles.sectionTitle}>CONNECTIVITY</Text>
        <View style={styles.card}>
          <InfoRow
            styles={styles}
            COLORS={COLORS}
            label="Backend"
            value={backend.ok
              ? `Online · ${formatDuration(backend.latencyMs)}`
              : backend.reachable
                ? `HTTP ${backend.status ?? 'error'}`
                : backend.timedOut ? 'Timed out' : 'Unreachable'}
            hint={backend.error || backend.url}
            tone={backend.ok ? 'emerald' : backend.reachable ? 'amber' : 'red'}
          />
          <InfoRow
            styles={styles}
            COLORS={COLORS}
            label="AI assistant"
            value={ai.ok ? 'Live' : 'Offline knowledge base'}
            hint={ai.message || 'No key configured on the server yet'}
            tone={ai.ok ? 'emerald' : 'amber'}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>LOCAL DATA</Text>
        <View style={styles.card}>
          <InfoRow
            styles={styles}
            COLORS={COLORS}
            label="Saved keys"
            value={storage.error ? 'Unavailable' : `${storage.totalKeys ?? 0} keys · ${storage.readable || '0 B'}`}
            hint={storage.error
              ? storage.error
              : storage.malformed?.length
                ? `Malformed: ${storage.malformed.join(', ')}`
                : 'All expected JSON parses cleanly'}
            tone={storage.error || storage.malformed?.length ? 'red' : 'emerald'}
          />
          <InfoRow
            styles={styles}
            COLORS={COLORS}
            label="Offline Quran"
            value={offline.bytes ? `${offline.chapters || 0} surahs · ${offline.readable}` : 'Not downloaded'}
            hint={offline.packages ? `${offline.packages} translation package(s) · ${offline.verses || 0} verses` : 'Download it from Settings'}
            tone={offline.bytes ? 'emerald' : undefined}
          />
          <InfoRow
            styles={styles}
            COLORS={COLORS}
            label="Cached content"
            value={`${cache.entries ?? 0} entries · ${cache.readable || '0 B'}`}
            hint="Can be cleared safely; re-downloaded on demand"
          />
          <InfoRow
            styles={styles}
            COLORS={COLORS}
            label="Last account sync"
            value={report?.lastSyncAt ? new Date(report.lastSyncAt).toLocaleString() : 'Never / guest mode'}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>PERMISSIONS & SECURITY</Text>
        <View style={styles.card}>
          <InfoRow
            styles={styles}
            COLORS={COLORS}
            label="Notifications"
            value={notifications.status || 'unknown'}
            tone={notifications.status === 'granted' ? 'emerald' : 'amber'}
          />
          <InfoRow
            styles={styles}
            COLORS={COLORS}
            label="App lock"
            value={appLock.enabled ? 'Enabled' : 'Disabled'}
            hint={appLock.enabled
              ? [appLock.hasPin && 'PIN', appLock.biometrics && 'biometrics'].filter(Boolean).join(' + ')
              : 'Optional — enable it in Settings'}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>READING</Text>
        <View style={styles.card}>
          <InfoRow styles={styles} COLORS={COLORS} label="Translation" value={String(prefs.translationLanguage || 'en').toUpperCase()} />
          <InfoRow styles={styles} COLORS={COLORS} label="Reciter" value={prefs.reciterId ? `#${prefs.reciterId}` : 'unknown'} />
          <InfoRow styles={styles} COLORS={COLORS} label="Quran font" value={prefs.quranFontSize ? `${prefs.quranFontSize} px` : 'unknown'} last />
        </View>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('ApiConsole')}
          accessibilityRole="button"
          accessibilityLabel="Open the API console"
        >
          <Ionicons name="terminal-outline" size={18} color={COLORS.gold} />
          <Text style={styles.linkText}>Open the API console to test individual endpoints</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.footnote}>
          This report never includes your auth token, app-lock PIN or hash.
          Backups and downloaded files are not part of it.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = COLORS => StyleSheet.create({
  content: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { color: COLORS.textSecondary, fontSize: 12.5, textAlign: 'center' },

  eyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 6 },
  intro: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 18, marginTop: 6, marginBottom: 16 },

  hero: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 18, borderWidth: 1, padding: 16,
  },
  heroIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 16, fontWeight: '800' },
  heroDetail: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 4 },
  heroTime: { color: COLORS.textSecondary, fontSize: 10.5, marginTop: 8, opacity: 0.75 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 4 },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 11,
  },
  primaryBtnText: { color: COLORS.bg, fontSize: 12.5, fontWeight: '800' },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: COLORS.gold + '12', borderWidth: 1, borderColor: COLORS.gold + '40',
    borderRadius: 12, paddingVertical: 11,
  },
  secondaryBtnText: { color: COLORS.gold, fontSize: 12.5, fontWeight: '800' },

  sectionTitle: {
    color: COLORS.textSecondary, fontSize: 10.5, fontWeight: '800',
    letterSpacing: 1.6, marginTop: 24, marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  rowLabel: { color: COLORS.textSecondary, fontSize: 12.5, paddingTop: 1, width: 118 },
  rowValue: { color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '700', textAlign: 'right' },
  rowHint: { color: COLORS.textSecondary, fontSize: 10.5, lineHeight: 15, textAlign: 'right', marginTop: 2 },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20,
    backgroundColor: COLORS.glass, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  linkText: { flex: 1, color: COLORS.textPrimary, fontSize: 12.5, fontWeight: '600' },
  footnote: { color: COLORS.textSecondary, fontSize: 10.5, lineHeight: 16, marginTop: 18, opacity: 0.8 },
});
