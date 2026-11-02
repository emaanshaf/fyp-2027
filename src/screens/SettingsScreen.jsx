import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform, Switch, ActivityIndicator,
  Modal, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { claudeStatus, refreshClaudeStatus } from '../ai/claudeClient';
import { KNOWLEDGE_BASE } from '../ai/islamicKnowledge';
import { auth, isFirebaseConfigured } from '../firebase/config';
import {
  useThemeName, useSetTheme, useColors, useGlobalStyles, useThemedStyles,
} from '../hooks/useTheme';
import { backend } from '../services/backend';
import { hasAuthToken } from '../services/authToken';
import { cacheStats, clearAllCaches, isOnline, onConnectivityChange } from '../services/cache';
import { usePreferences } from '../hooks/usePreferences';
import { TRANSLATIONS, RECITERS } from '../services/quranApi';
import {
  downloadQuranPackage, getOfflinePackage, getOfflineStats,
  removeOfflineQuran, formatBytes,
} from '../services/offlineLibrary';
import {
  exportBackup, inspectBackupFile, restoreBackupText, loadLastBackupAt,
} from '../services/backup';
import { notificationService } from '../services/notifications';
import { getAIUsage, resetAIUsage } from '../services/aiUsage';
import { usePrayerLock } from '../context/PrayerLockContext';
import { useAppLock } from '../context/AppLockContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import PinModal from '../components/PinModal';

// ── Theme / palette options ─────────────────────────────────────────────────
const BASE_THEMES = [
  { name: 'default',      label: 'Islamic Dark',  icon: 'moon-outline',     colors: ['#111312', '#C9A44C', '#0F7A55', '#34D399'] },
  { name: 'light',        label: 'Light',         icon: 'sunny-outline',    colors: ['#FBFAF7', '#9A6F14', '#046C4E', '#047857'] },
  { name: 'highContrast', label: 'High Contrast', icon: 'contrast-outline', colors: ['#000000', '#FFD700', '#00FF88', '#FFFFFF'] },
];

const COLOR_PALETTES = [
  { name: 'oceanBlue',    label: 'Ocean Blue',    colors: ['#1565C0', '#42A5F5', '#26A69A', '#90CAF9'] },
  { name: 'royalPurple',  label: 'Royal Purple',  colors: ['#6A1B9A', '#AB47BC', '#CE93D8', '#E1BEE7'] },
  { name: 'desertRose',   label: 'Desert Rose',   colors: ['#AD1457', '#F06292', '#F48FB1', '#F8BBD0'] },
  { name: 'midnightTeal', label: 'Midnight Teal', colors: ['#00695C', '#26A69A', '#4DB6AC', '#80CBC4'] },
  { name: 'sunsetAmber',  label: 'Sunset Amber',  colors: ['#C2410C', '#FF9800', '#FFB74D', '#FFE0B2'] },
];

export default function SettingsScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const prayerLock = usePrayerLock();
  const appLock = useAppLock();
  // 'setup' | 'disable' | null. The switch itself only flips once the modal
  // has actually enabled or removed the lock.
  const [pinDialog, setPinDialog] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  // 'checking' | 'connected' | 'guest' | 'expired' | 'disconnected'
  const [backendStatus, setBackendStatus] = useState('checking');
  const [userRole, setUserRole] = useState('user');
  const [storage, setStorage] = useState(null);
  const [offlinePkg, setOfflinePkg] = useState(null);
  const [offlineStats, setOfflineStats] = useState(null);
  const [download, setDownload] = useState(null);
  const downloadController = useRef(null);
  const [backupBusy, setBackupBusy] = useState(null);
  const [lastBackupAt, setLastBackupAt] = useState(null);
  const mountedRef = useRef(true);
  const [online, setOnline] = useState(isOnline());
  const [prefs, setPrefs] = usePreferences();
  // Shadow the frozen module-level imports with the active theme. Everything
  // below this line already says COLORS/globalStyles/styles, so switching
  // themes now repaints the screen without touching those call sites.
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);
  const { t, language, setLanguage } = useLanguage();

  const [claudeState, setClaudeState] = useState(claudeStatus());
  const [aiUsage, setAiUsage] = useState(null);
  const claudeOn = claudeState.ok;
  const firebaseUser = isFirebaseConfigured() ? auth.currentUser : null;

  // The key lives on the server now, so whether live AI is available has to
  // be asked for rather than read from the bundle.
  useEffect(() => {
    let active = true;
    refreshClaudeStatus().then(s => { if (active) setClaudeState(s); });
    return () => { active = false; };
  }, []);

  // Usage counts live on the device. Reload them on focus so a question asked
  // in the assistant is reflected when the user comes back to Settings.
  useEffect(() => {
    let active = true;
    const load = () => {
      getAIUsage()
        .then(usage => { if (active) setAiUsage(usage); })
        .catch(() => {});
    };
    load();
    const unsubscribe = navigation?.addListener?.('focus', load);
    return () => {
      active = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [navigation]);

  const handleResetAIUsage = async () => {
    const usage = await resetAIUsage();
    if (mountedRef.current) setAiUsage(usage);
  };

  const currentTheme = useThemeName();
  const setTheme = useSetTheme();

  useEffect(() => {
    loadProfile();
    checkBackend();
    cacheStats().then(setStorage);
    loadLastBackupAt().then(v => { if (mountedRef.current) setLastBackupAt(v); });
    return onConnectivityChange(setOnline);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadOfflineState();
    return () => { mountedRef.current = false; };
  }, [prefs.translationLanguage]);

  // A stale session is repaired by signing in and coming back. Re-check on
  // focus so the card does not keep claiming the backend is unavailable.
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', checkBackend);
    return typeof unsubscribe === 'function' ? unsubscribe : undefined;
  }, [navigation]);

  const loadProfile = async () => {
    try {
      const hasToken = await hasAuthToken();
      if (hasToken) {
        try {
          const data = await backend.getMe();
          if (data?.user) {
            setUserName(data.user.name);
            if (data.user.role) setUserRole(data.user.role);
            return;
          }
        } catch (e) { /* fall through to local */ }
      }
      AsyncStorage.getItem('qitab_user_name').then(n => setUserName(n || ''));
    } catch (e) {
      AsyncStorage.getItem('qitab_user_name').then(n => setUserName(n || ''));
    }
  };

  const checkBackend = async () => {
    try {
      const hasToken = await hasAuthToken();
      if (!hasToken) {
        setBackendStatus('guest');
        return;
      }
      try {
        await backend.getMe();
        setBackendStatus('connected');
      } catch (error) {
        // A 401 means the server answered but this saved session is stale
        // (the dev API rotates JWT_SECRET on restart). That is not the same
        // as an unreachable backend, and telling the user it is sent them
        // looking for a network fault that did not exist.
        setBackendStatus(error?.status === 401 ? 'expired' : 'disconnected');
      }
    } catch (e) {
      setBackendStatus('disconnected');
    }
  };

  const loadOfflineState = async () => {
    const translation = TRANSLATIONS[prefs.translationLanguage] || TRANSLATIONS.en;
    try {
      const [pkg, stats] = await Promise.all([
        getOfflinePackage(translation.id),
        getOfflineStats(),
      ]);
      if (!mountedRef.current) return;
      setOfflinePkg(pkg);
      setOfflineStats(stats);
    } catch (e) {
      // Offline storage is optional; a read failure must not break Settings.
      if (mountedRef.current) {
        setOfflinePkg(null);
        setOfflineStats(null);
      }
    }
  };

  const runOfflineDownload = async (refresh = false) => {
    if (downloadController.current) return;

    const translation = TRANSLATIONS[prefs.translationLanguage] || TRANSLATIONS.en;
    if (!isOnline()) {
      Alert.alert(
        'You are offline',
        'Connect to the internet to download the Quran. Any surahs already saved are kept.'
      );
      return;
    }

    const controller = new AbortController();
    downloadController.current = controller;
    setDownload({
      phase: 'downloading',
      completed: offlinePkg?.chapterCount || 0,
      total: 114,
      percent: Math.round(((offlinePkg?.chapterCount || 0) / 114) * 100),
      bytes: offlinePkg?.bytes || 0,
      bytesReadable: formatBytes(offlinePkg?.bytes || 0),
    });

    try {
      const result = await downloadQuranPackage({
        translationId: translation.id,
        translation,
        refresh,
        signal: controller.signal,
        onProgress: p => {
          // The download keeps running if Settings is left, but there is no
          // mounted component left to repaint.
          if (mountedRef.current) setDownload(p);
        },
      });
      if (!mountedRef.current) return;
      await loadOfflineState();
      Alert.alert(
        'Quran saved offline',
        `${result.versesSaved} verses from all ${result.chapterCount} surahs are now ` +
        `stored on this device in ${result.translationName}. Reading will work with no connection.`
      );
    } catch (e) {
      if (!mountedRef.current) return;
      await loadOfflineState();
      if (e?.cancelled || e?.name === 'AbortError') {
        Alert.alert(
          'Download paused',
          'Surahs already saved are kept. Tap Download for Offline again to resume.'
        );
      } else {
        Alert.alert(
          'Download failed',
          `${e?.message || 'Check your connection and try again.'}\n\n` +
          'Surahs already saved are kept, so you can resume rather than start over.'
        );
      }
    } finally {
      downloadController.current = null;
      if (mountedRef.current) setDownload(null);
    }
  };

  const handleDownloadPress = () => {
    if (downloadController.current) return;
    if (offlinePkg?.complete) {
      Alert.alert(
        'Offline Quran already saved',
        `${offlinePkg.versesSaved} verses · ${formatBytes(offlinePkg.bytes)} · ` +
        `${offlinePkg.translationName}. Download it again to replace the saved copy.`,
        [
          { text: 'Keep current', style: 'cancel' },
          { text: 'Download again', onPress: () => runOfflineDownload(true) },
        ]
      );
      return;
    }
    runOfflineDownload(false);
  };

  const cancelOfflineDownload = () => {
    setDownload(d => (d ? { ...d, phase: 'pausing' } : d));
    downloadController.current?.abort();
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await AsyncStorage.setItem('qitab_user_name', trimmed);
    setUserName(trimmed);
    setEditingName(false);

    // Also save to backend if logged in
    const hasToken = await hasAuthToken();
    if (hasToken) {
      try { await backend.updateSettings({}); } catch (e) { /* backend unavailable */ }
    }
  };

  const formatBackupTime = iso => {
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
  };

  const handleExportBackup = async () => {
    if (backupBusy) return;
    setBackupBusy('export');
    try {
      const result = await exportBackup();
      if (mountedRef.current) setLastBackupAt(result.createdAt);
      const delivery = result.method === 'share'
        ? `was handed to the share sheet as ${result.filename}`
        : `was downloaded as ${result.filename}`;
      Alert.alert(
        'Backup ready',
        `A backup of ${result.keyCount} saved items ${delivery}.\n\nKeep the file somewhere you can find it. It contains your personal data, so treat it like a diary rather than a public document.`,
      );
    } catch (e) {
      Alert.alert('Backup failed', e?.message || 'The backup could not be created.');
    } finally {
      if (mountedRef.current) setBackupBusy(null);
    }
  };

  // A backup deliberately does not include the theme name inside prefs alone;
  // the theme provider keeps its own key and reads it at startup. Re-read the
  // restored values that live outside the preferences hook so the screen
  // reflects them immediately.
  const applyRestoredProfileAndTheme = async () => {
    try {
      const [restoredName, restoredTheme] = await Promise.all([
        AsyncStorage.getItem('qitab_user_name'),
        AsyncStorage.getItem('qitab_theme_preference'),
      ]);
      if (restoredName != null) setUserName(restoredName);
      if (['default', 'light', 'highContrast'].includes(restoredTheme)) {
        setTheme(restoredTheme);
      }
    } catch {
      // The restore already succeeded; a failed cosmetic refresh is not an error.
    }
  };

  const handleRestoreBackup = async () => {
    if (backupBusy) return;
    setBackupBusy('inspect');
    let picked = null;
    try {
      picked = await inspectBackupFile();
    } catch (e) {
      setBackupBusy(null);
      Alert.alert('Cannot open backup', e?.message || 'The file could not be read.');
      return;
    }
    setBackupBusy(null);

    if (!picked) return; // The user closed the file picker.
    if (picked.error) {
      Alert.alert('Cannot restore', picked.error);
      return;
    }

    const { summary, text } = picked;
    const when = formatBackupTime(summary.createdAt) || 'an unknown date';
    const notes = [
      `Created ${when} · app ${summary.appVersion} on ${summary.platform}`,
      `${summary.restorable} saved items${summary.skipped ? ` · ${summary.skipped} unknown entries will be skipped` : ''}`,
      'Restoring merges the file: data created after the backup is kept.',
      'Auth tokens, app lock and downloaded Quran files are not part of a backup.',
    ].join('\n');

    Alert.alert(
      'Restore this backup?',
      notes,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            setBackupBusy('restore');
            try {
              const result = await restoreBackupText(text);
              await applyRestoredProfileAndTheme();
              setLastBackupAt(await loadLastBackupAt());
              Alert.alert(
                'Restored',
                `${result.restored} items were restored. Bookmarks, preferences and profile values now reflect the backup.\n\nReminders are not rescheduled automatically — open Reminders once and save them to re-arm notification popups.`,
              );
            } catch (e) {
              Alert.alert('Restore failed', e?.message || 'The backup could not be restored.');
            } finally {
              if (mountedRef.current) setBackupBusy(null);
            }
          },
        },
      ],
    );
  };

  const clearCache = () => {
    Alert.alert(
      'Clear downloaded content',
      'Removes the offline Quran download, saved Hadith, tafsir, prayer-time ' +
      'data and cached pages. They will be downloaded again when you next ' +
      'open them, so you will need a connection. Your bookmarks, notes, ' +
      'favourites, learning progress and history are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive',
          onPress: async () => {
            await clearAllCaches();
            await removeOfflineQuran();
            // Legacy prayer-time keys predate the cache layer.
            const keys = await AsyncStorage.getAllKeys();
            await AsyncStorage.multiRemove(
              keys.filter(k => k.includes('timings') || k.endsWith('_ts'))
            );
            setStorage(await cacheStats());
            await loadOfflineState();
            Alert.alert('Done', 'Downloaded content cleared.');
          }
        }
      ]
    );
  };

  /**
   * Flips a preference and applies its side effect.
   *
   * Turning notifications off has to cancel what is already scheduled —
   * a stored boolean alone would leave the adhan firing anyway.
   */
  const toggle = async (key, value) => {
    await setPrefs({ [key]: value });

    if (key === 'notificationsEnabled') {
      try {
        // Real method names: the service exposes cancelAllNotifications and
        // initialize (which requests permission). Optional-chaining a wrong
        // name would silently no-op and leave the adhan firing.
        if (value) await notificationService.initialize();
        else await notificationService.cancelAllNotifications();
      } catch (e) {
        console.warn('Notification toggle failed:', e?.message);
      }
    }
    if (key === 'prayerNotifications' && !value) {
      try {
        await notificationService.cancelPrayerNotifications();
      } catch (e) {
        console.warn('Could not cancel prayer notifications:', e?.message);
      }
    }
  };

  /**
   * Removes the keys that hold personal content. Downloaded public content
   * (Quran text, hadith) is deliberately not part of this list.
   */
  const clearPersonalKeys = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter(k => /^(qitab_|prayer_log_|salawat_|bookmark|journal_|hifz_)/.test(k));
    await AsyncStorage.multiRemove(mine);
  };

  // There is no sign-in screen any more, so "logout" would have nowhere to go.
  // What a user actually wants here is to wipe their personal data off the
  // device; the anonymous session is left intact so sync keeps working.
  const handleResetData = async () => {
    Alert.alert(
      'Reset personal data?',
      'Clears your name, prayer log, salawat count, bookmarks and journal entries on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearPersonalKeys();
            setUserName('');
            Alert.alert('Done', 'Your data on this device has been reset.');
          },
        },
      ]
    );
  };

  const openDeleteAccount = () => {
    setDeletePassword('');
    setDeleteError('');
    setDeleteOpen(true);
  };

  /**
   * Deletes the server account after the password is re-entered. The server
   * cascades all synced rows; the local copy is cleared here so another user
   * of the device cannot read it.
   */
  const handleDeleteAccount = async () => {
    const password = deletePassword.trim();
    if (!password) {
      setDeleteError('Enter your password to confirm.');
      return;
    }

    setDeleteBusy(true);
    setDeleteError('');
    try {
      await backend.deleteAccount(password);
      await clearPersonalKeys();
      await backend.logout();
      setUserName('');
      setBackendStatus('guest');
      setDeleteOpen(false);
      setDeletePassword('');
      Alert.alert(
        'Account deleted',
        'Your account and synced data have been removed. Local personal data on this device was cleared too.'
      );
      navigation.navigate('Login');
    } catch (e) {
      setDeleteError(e?.message || 'Could not delete your account. Please try again.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <Text style={[globalStyles.sectionTitle, { marginBottom: 12 }]}>Profile</Text>
        <View style={styles.card}>
          {editingName ? (
            <View style={{ gap: 12 }}>
              <View style={globalStyles.input}>
                <TextInput
                  style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15 }}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.textSecondary}
                  autoFocus
                />
              </View>
              <View style={[globalStyles.row, { gap: 10 }]}>
                <TouchableOpacity style={[globalStyles.btnPrimary, { flex: 1 }]} onPress={saveName}>
                  <Text style={globalStyles.btnPrimaryText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.btnPrimary, { flex: 1, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder }]}
                  onPress={() => setEditingName(false)}
                >
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={globalStyles.spaceBetween}>
              <View style={[globalStyles.row, { gap: 12 }]}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={COLORS.gold} />
                </View>
                <View>
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 16 }}>
                    {userName || 'Add your name'}
                  </Text>
                  {firebaseUser ? (
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>{firebaseUser.email}</Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity onPress={() => { setNameInput(userName); setEditingName(true); }}>
                <Ionicons name="pencil-outline" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Backend API Status */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Backend API</Text>
        <View style={styles.card}>
          <View style={[globalStyles.row, { gap: 10, marginBottom: 10 }]}>
            <View style={[styles.statusDot, {
              backgroundColor: backendStatus === 'connected' ? COLORS.emerald
                : backendStatus === 'disconnected' ? COLORS.red : COLORS.amber
            }]} />
            <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 15 }}>
              {backendStatus === 'connected' ? 'Backend connected (PostgreSQL)'
                : backendStatus === 'checking' ? 'Checking the backend…'
                : backendStatus === 'guest' ? 'Signed in anonymously — synced to this device'
                : backendStatus === 'expired' ? 'Session expired — sign in again to sync'
                : 'Backend unavailable — using local storage'}
            </Text>
          </View>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}>
            {backendStatus === 'connected'
              ? 'Your bookmarks, notes and settings are synced to the server automatically. No account or password needed.'
              : backendStatus === 'checking'
                ? 'Asking the server whether this device has a live session.'
                : backendStatus === 'expired'
                  ? 'The server is reachable, but this device\'s saved session is no longer valid. Your local data is safe; sign in to resume syncing.'
                  : 'Working from local storage. Your data is safe on this device and syncs automatically once the server is reachable.'}
          </Text>

          <TouchableOpacity
            style={[styles.securityAction, { marginTop: 12 }]}
            onPress={() => navigation.navigate('ApiConsole')}
            accessibilityRole="button"
            accessibilityLabel="Open API console"
          >
            <Ionicons name="terminal-outline" size={18} color={COLORS.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.securityActionText}>API console</Text>
              <Text style={styles.securityHint}>
                Browse every endpoint, check latency and test public routes.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.securityAction}
            onPress={() => navigation.navigate('Diagnostics')}
            accessibilityRole="button"
            accessibilityLabel="Open system health"
          >
            <Ionicons name="pulse-outline" size={18} color={COLORS.emerald} />
            <View style={{ flex: 1 }}>
              <Text style={styles.securityActionText}>System health</Text>
              <Text style={styles.securityHint}>
                Runtime, storage integrity, offline downloads, permissions and
                backend latency in one shareable report.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* AI Assistant status */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Islamic AI Assistant</Text>
        <View style={styles.card}>
          <View style={[globalStyles.row, { gap: 10, marginBottom: 10 }]}>
            <View style={[styles.statusDot, { backgroundColor: claudeOn ? COLORS.emerald : COLORS.amber }]} />
            <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 15 }}>
              {claudeOn ? 'Live AI connected (Claude)' : 'Offline knowledge base only'}
            </Text>
          </View>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}>
            {claudeOn
              ? `Questions are answered live by Anthropic's Claude model, with the ${KNOWLEDGE_BASE.length}-topic offline knowledge base as a backup if the connection fails.`
              : `${claudeState.message} This is not a custom-trained model, just a pretrained model the server can optionally connect to. Answers currently come from the built-in ${KNOWLEDGE_BASE.length}-topic offline knowledge base.`}
          </Text>

          <View style={styles.usageGrid}>
            {[
              [aiUsage ? aiUsage.total : '—', 'Questions'],
              [aiUsage ? aiUsage.live : '—', 'Live AI'],
              [aiUsage ? aiUsage.offline : '—', 'Offline'],
              [aiUsage ? aiUsage.last7Days : '—', 'Last 7 days'],
            ].map(([value, label]) => (
              <View key={label} style={styles.usageCell}>
                <Text style={styles.usageNumber}>{value}</Text>
                <Text style={styles.usageLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.usageHint}>
            Counted on this device only — no question text is stored, and these
            numbers are never sent anywhere. When live AI is on, only the
            question and up to three retrieved topics leave the phone.
          </Text>
          {aiUsage?.total ? (
            <TouchableOpacity
              onPress={handleResetAIUsage}
              accessibilityRole="button"
              accessibilityLabel="Reset AI usage statistics"
            >
              <Text style={styles.usageReset}>Reset usage stats</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Theme & Color Palette */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Appearance</Text>

        {/* Base themes */}
        <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 2 }}>
          Base Theme
        </Text>
        <View style={styles.card}>
          {BASE_THEMES.map((theme) => (
            <TouchableOpacity
              key={theme.name}
              style={[styles.themeRow, currentTheme === theme.name && styles.themeRowActive]}
              onPress={() => {
                setTheme(theme.name);
                hasAuthToken().then(hasToken => {
                  if (hasToken) backend.updateSettings({ theme: theme.name }).catch(() => {});
                });
              }}
            >
              <Ionicons name={theme.icon} size={20} color={currentTheme === theme.name ? COLORS.gold : COLORS.textSecondary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.themeLabel, { color: currentTheme === theme.name ? COLORS.gold : COLORS.textPrimary }]}>
                  {theme.label}
                </Text>
              </View>
              {/* Color swatch preview */}
              <View style={{ flexDirection: 'row', gap: 4, marginRight: 10 }}>
                {theme.colors.map((c, i) => (
                  <View key={i} style={{
                    width: 16, height: 16, borderRadius: 8, backgroundColor: c,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                  }} />
                ))}
              </View>
              {currentTheme === theme.name && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Color palettes */}
        <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 20, marginBottom: 10, marginLeft: 2 }}>
          Color Palette
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {COLOR_PALETTES.map((palette) => {
            const isActive = currentTheme === palette.name;
            return (
              <TouchableOpacity
                key={palette.name}
                style={[{
                  width: '47%', borderRadius: 16, padding: 14,
                  backgroundColor: COLORS.glass,
                  borderWidth: isActive ? 2 : 1,
                  borderColor: isActive ? palette.colors[1] : COLORS.glassBorder,
                }, isActive && { shadowColor: palette.colors[1], shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 }]}
                onPress={() => {
                  setTheme(palette.name);
                  hasAuthToken().then(hasToken => {
                    if (hasToken) backend.updateSettings({ theme: palette.name }).catch(() => {});
                  });
                }}
                activeOpacity={0.75}
              >
                {/* Swatch row */}
                <View style={{ flexDirection: 'row', gap: 5, marginBottom: 10 }}>
                  {palette.colors.map((c, i) => (
                    <View key={i} style={{
                      flex: 1, height: 22, borderRadius: 6, backgroundColor: c,
                    }} />
                  ))}
                </View>
                {/* Label + check */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{
                    color: isActive ? palette.colors[1] : COLORS.textPrimary,
                    fontSize: 13, fontWeight: '700',
                  }}>
                    {palette.label}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={18} color={palette.colors[1]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* App language. The drawer has a one-tap toggle; this is the
            discoverable version with an explanation of what changes. */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>
          {t('settings.language', 'App Language')}
        </Text>
        <View style={styles.card}>
          <View style={styles.chipRow}>
            {LANGUAGES.map(option => {
              const active = language === option.code;
              return (
                <TouchableOpacity
                  key={option.code}
                  onPress={() => {
                    setLanguage(option.code);
                    hasAuthToken().then(hasToken => {
                      if (hasToken) backend.updateSettings({ language: option.code }).catch(() => {});
                    });
                  }}
                  style={[styles.chip, active && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.native}
                >
                  <Text
                    style={[
                      styles.chipText,
                      option.code === 'ur' && styles.chipTextUrdu,
                      active && { color: COLORS.bg },
                    ]}
                  >
                    {option.native}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.hintText, { marginTop: 10 }]}>
            {t('settings.languageHint')}
          </Text>
        </View>

        {/* App info */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>About</Text>
        <View style={styles.card}>
          <View style={[globalStyles.spaceBetween, { marginBottom: 10 }]}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Version</Text>
            <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>
              {Constants.expoConfig?.version || '1.0.0'}
            </Text>
          </View>
          <View style={globalStyles.spaceBetween}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Platform</Text>
            <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>{Platform.OS}</Text>
          </View>
        </View>

        {/* Reading */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Reading</Text>
        <View style={styles.card}>
          <Text style={styles.prefLabel}>Default translation</Text>
          <View style={styles.chipRow}>
            {Object.entries(TRANSLATIONS).map(([key, t]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setPrefs({ translationLanguage: key })}
                style={[styles.chip, prefs.translationLanguage === key && styles.chipOn]}
              >
                <Text style={[styles.chipText, prefs.translationLanguage === key && { color: COLORS.bg }]}>
                  {t.native}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.prefDivider} />

          <Text style={styles.prefLabel}>Default reciter</Text>
          <View style={styles.chipRow}>
            {RECITERS.slice(0, 6).map(r => (
              <TouchableOpacity
                key={r.id}
                onPress={() => setPrefs({ reciterId: r.id })}
                style={[styles.chip, prefs.reciterId === r.id && styles.chipOn]}
              >
                <Text
                  style={[styles.chipText, prefs.reciterId === r.id && { color: COLORS.bg }]}
                  numberOfLines={1}
                >
                  {r.name.split(' ').slice(-1)[0]}
                  {r.style ? ` (${r.style[0]})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.prefDivider} />

          <View style={globalStyles.spaceBetween}>
            <Text style={styles.prefLabel}>Arabic size</Text>
            <Text style={styles.prefValue}>{prefs.quranFontSize}px</Text>
          </View>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setPrefs({ quranFontSize: Math.max(18, prefs.quranFontSize - 2) })}
            >
              <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.arabicPreview, { fontSize: prefs.quranFontSize }]}>
              بِسْمِ ٱللَّٰهِ
            </Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setPrefs({ quranFontSize: Math.min(48, prefs.quranFontSize + 2) })}
            >
              <Ionicons name="add" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ToggleRow
            label="Show transliteration"
            value={prefs.showTransliteration}
            onChange={v => setPrefs({ showTransliteration: v })}
          />
          <ToggleRow
            label="Play translation after each verse"
            hint="Tarjama"
            value={prefs.autoPlayTarjama}
            onChange={v => setPrefs({ autoPlayTarjama: v })}
          />
          <ToggleRow
            label="Continue to the next verse"
            value={prefs.continuousPlay}
            onChange={v => setPrefs({ continuousPlay: v })}
          />
        </View>

        {/* Notifications */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Notifications</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Enable notifications"
            hint="Turning this off cancels everything scheduled"
            value={prefs.notificationsEnabled}
            onChange={v => toggle('notificationsEnabled', v)}
          />
          <ToggleRow
            label="Prayer times (adhan)"
            value={prefs.prayerNotifications}
            disabled={!prefs.notificationsEnabled}
            onChange={v => toggle('prayerNotifications', v)}
          />
          {/* Prayer lock. Its scope is stated plainly — an app cannot disable
              other apps, and implying otherwise would be a lie. */}
          <ToggleRow
            label="Prayer lock"
            hint={`Pauses Qitab-e-Noor ${prayerLock.delayMin} minutes after each adhan until you confirm you have prayed. Affects this app only.`}
            value={prayerLock.enabled}
            onChange={prayerLock.setLockEnabled}
          />
          {prayerLock.enabled ? (
            <View style={styles.delayRow}>
              <Text style={styles.delayLabel}>Lock after</Text>
              <View style={styles.delayChips}>
                {[5, 10, 15, 20].map(m => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => prayerLock.setLockDelay(m)}
                    style={[
                      styles.delayChip,
                      prayerLock.delayMin === m && styles.delayChipActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Lock ${m} minutes after the adhan`}
                  >
                    <Text style={[
                      styles.delayChipText,
                      prayerLock.delayMin === m && { color: '#000' },
                    ]}>
                      {m}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
          <ToggleRow
            label="Ayah of the day"
            value={prefs.dailyAyahNotification}
            disabled={!prefs.notificationsEnabled}
            onChange={v => toggle('dailyAyahNotification', v)}
          />
          <ToggleRow
            label="Review reminder"
            hint="When spaced-repetition cards fall due"
            value={prefs.reviewReminder}
            disabled={!prefs.notificationsEnabled}
            onChange={v => toggle('reviewReminder', v)}
          />
        </View>

        {/* Privacy & Security */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Privacy & Security</Text>
        <View style={styles.card}>
          <ToggleRow
            label="App lock"
            hint={appLock.state.enabled
              ? `Asks for your PIN when the app opens, and after ${appLock.graceSeconds}s in the background.`
              : 'Require a PIN to open Qitab-e-Noor.'}
            value={appLock.state.enabled}
            onChange={v => setPinDialog(v ? 'setup' : 'disable')}
          />

          {appLock.state.enabled ? (
            <>
              <ToggleRow
                label={`Unlock with ${appLock.biometric.label}`}
                hint={appLock.biometric.available
                  ? 'Use your device sensor instead of typing the PIN.'
                  : `${appLock.biometric.label} is not set up on this device. Your PIN still works.`}
                value={appLock.state.biometricsEnabled}
                disabled={!appLock.biometric.available}
                onChange={async v => {
                  const result = await appLock.setBiometrics(v);
                  if (!result.ok && v) {
                    Alert.alert(appLock.biometric.label, result.message || 'Could not enable biometric unlock.');
                  }
                }}
              />
              <TouchableOpacity
                style={styles.securityAction}
                onPress={appLock.lockNow}
                accessibilityRole="button"
                accessibilityLabel="Lock the app now"
              >
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.gold} />
                <Text style={styles.securityActionText}>Lock now</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </>
          ) : null}

          <Text style={styles.securityNote}>
            {Platform.OS === 'web'
              ? 'This browser has no OS keychain. The PIN hash and session token therefore use browser storage, which is less protected than a phone.'
              : 'Your PIN is stored only as a salted hash in this device\'s secure keystore, alongside your session token. It never leaves the device.'}
          </Text>
        </View>

        {/* Tasbih */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Tasbih</Text>
        <View style={styles.card}>
          <Text style={styles.prefLabel}>Target per round</Text>
          <View style={styles.chipRow}>
            {[33, 34, 99, 100, 500, 1000].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => setPrefs({ tasbihTarget: n })}
                style={[styles.chip, prefs.tasbihTarget === n && styles.chipOn]}
              >
                <Text style={[styles.chipText, prefs.tasbihTarget === n && { color: COLORS.bg }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ToggleRow
            label="Vibrate on each count"
            value={prefs.tasbihHaptics}
            onChange={v => setPrefs({ tasbihHaptics: v })}
          />
          <ToggleRow
            label="Keep count when leaving the screen"
            value={prefs.tasbihKeepCount}
            onChange={v => setPrefs({ tasbihKeepCount: v })}
          />
        </View>

        {/* Offline & local storage */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Offline & Local Storage</Text>
        <View style={styles.card}>
          <View style={[globalStyles.spaceBetween, { marginBottom: 10 }]}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Connection</Text>
            <View style={globalStyles.row}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: online ? COLORS.emerald : COLORS.amber, marginRight: 6 },
                ]}
              />
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>
                {online ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          <View style={[globalStyles.spaceBetween, { marginBottom: 10 }]}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Offline Quran</Text>
            <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>
              {offlinePkg?.complete
                ? `114 surahs · ${formatBytes(offlinePkg.bytes)}`
                : offlinePkg?.chapterCount
                  ? `Partial · ${offlinePkg.chapterCount}/114`
                  : 'Not saved'}
            </Text>
          </View>

          {offlinePkg?.complete ? (
            <Text style={styles.hintText}>
              Saved in {offlinePkg.translationName} · {offlinePkg.author} ·{' '}
              {offlinePkg.versesSaved} verses.{' '}
              {Platform.OS === 'web'
                ? 'Kept in this browser\'s offline storage, so it survives reloads and works without a connection.'
                : 'Stored in this device\'s private documents folder, so it survives restarts and works in airplane mode.'}
            </Text>
          ) : (
            <Text style={styles.hintText}>
              Save all 114 surahs — Arabic text plus your selected translation —
              to this device. Audio is streamed and is not part of the download.
            </Text>
          )}

          <View style={[globalStyles.spaceBetween, { marginTop: 12, marginBottom: 10 }]}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Cached content</Text>
            <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>
              {storage ? storage.readable : '—'}
            </Text>
          </View>
          <View style={[globalStyles.spaceBetween, { marginBottom: 10 }]}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Total on this device</Text>
            <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 13 }}>
              {formatBytes((storage?.bytes || 0) + (offlineStats?.bytes || 0))}
            </Text>
          </View>

          <Text style={styles.hintText}>
            Cached content is what you have already opened — surahs, hadith,
            tafsir and prayer times. It may be cleaned up automatically; the
            downloaded Quran above is kept until you remove it.
          </Text>

          <TouchableOpacity
            style={styles.securityAction}
            onPress={handleDownloadPress}
            disabled={Boolean(download)}
            accessibilityRole="button"
            accessibilityLabel="Download the Quran for offline use"
          >
            <Ionicons name="cloud-download-outline" size={18} color={COLORS.emerald} />
            <View style={{ flex: 1 }}>
              <Text style={styles.securityActionText}>
                {download
                  ? 'Downloading…'
                  : offlinePkg?.complete
                    ? 'Download Again'
                    : offlinePkg?.chapterCount
                      ? 'Resume Offline Download'
                      : 'Download for Offline'}
              </Text>
              <Text style={styles.securityHint}>
                {offlinePkg?.complete
                  ? `${offlinePkg.translationName} · ${offlinePkg.chapterCount} surahs saved`
                  : 'Quran text and translation — about 3–5 MB'}
              </Text>
            </View>
            {download
              ? <ActivityIndicator size="small" color={COLORS.emerald} />
              : <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />}
          </TouchableOpacity>

          {download ? (
            <View style={styles.downloadProgress}>
              <View style={globalStyles.spaceBetween}>
                <Text style={styles.downloadLabel} numberOfLines={1}>
                  {download.phase === 'pausing'
                    ? 'Stopping…'
                    : download.chapterName
                      ? `Saving ${download.chapterName}`
                      : 'Preparing download…'}
                </Text>
                <Text style={styles.downloadPercent}>{download.percent || 0}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, download.percent || 0))}%` },
                  ]}
                />
              </View>
              <View style={globalStyles.spaceBetween}>
                <Text style={styles.downloadMeta}>
                  {download.completed || 0} of {download.total || 114} surahs ·{' '}
                  {download.bytesReadable || formatBytes(download.bytes || 0)}
                </Text>
                <TouchableOpacity
                  onPress={cancelOfflineDownload}
                  disabled={download.phase === 'pausing'}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel download"
                >
                  <Text style={styles.downloadCancel}>
                    {download.phase === 'pausing' ? 'Stopping…' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>

        {/* Backup & Restore */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Backup & Restore</Text>
        <View style={styles.card}>
          <Text style={styles.hintText}>
            Save bookmarks, notes, duas, reading and prayer history, reminders
            and preferences to a JSON file you own. Works offline and needs no
            account, so it is also how you move your data to a new phone.
          </Text>
          <Text style={styles.securityNote}>
            Integrity-checked with SHA-256. Auth tokens, the app-lock PIN and
            downloaded Quran files are excluded on purpose.
          </Text>

          <TouchableOpacity
            style={styles.securityAction}
            onPress={handleExportBackup}
            disabled={Boolean(backupBusy)}
            accessibilityRole="button"
            accessibilityLabel="Export a backup file"
          >
            <Ionicons name="cloud-upload-outline" size={18} color={COLORS.emerald} />
            <View style={{ flex: 1 }}>
              <Text style={styles.securityActionText}>Export Backup</Text>
              <Text style={styles.securityHint}>
                {lastBackupAt
                  ? `Last export ${formatBackupTime(lastBackupAt) || 'recently'}`
                  : 'Creates a .json file you can store anywhere'}
              </Text>
            </View>
            {backupBusy === 'export'
              ? <ActivityIndicator size="small" color={COLORS.emerald} />
              : <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.securityAction}
            onPress={handleRestoreBackup}
            disabled={Boolean(backupBusy)}
            accessibilityRole="button"
            accessibilityLabel="Restore data from a backup file"
          >
            <Ionicons name="document-attach-outline" size={18} color={COLORS.blue} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.securityActionText, { color: COLORS.blue }]}>
                Restore from File
              </Text>
              <Text style={styles.securityHint}>
                Validated before writing · merges, never deletes newer data
              </Text>
            </View>
            {backupBusy === 'inspect' || backupBusy === 'restore'
              ? <ActivityIndicator size="small" color={COLORS.blue} />
              : <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />}
          </TouchableOpacity>
        </View>

        {/* Data & Session */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Data & Session</Text>
        
        {(backendStatus === 'guest'
          || backendStatus === 'expired'
          || backendStatus === 'disconnected') && (
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Login')}>
            <Ionicons name="log-in-outline" size={20} color={COLORS.emerald} />
            <Text style={styles.actionText}>Sign In / Create Account</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        {backendStatus === 'connected' && (
          <>
            <TouchableOpacity style={styles.actionRow} onPress={async () => {
              // backend.logout() clears both the in-memory cache and the token
              // in the OS keystore; the old extra AsyncStorage removal here was
              // deleting a key that no longer holds the session.
              await backend.logout();
              setBackendStatus('guest');
              navigation.navigate('Login');
            }}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
              <Text style={[styles.actionText, { color: COLORS.red }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={openDeleteAccount}
              accessibilityRole="button"
              accessibilityLabel="Delete your account permanently"
            >
              <Ionicons name="person-remove-outline" size={20} color={COLORS.red} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionText, { color: COLORS.red, flex: 0 }]}>Delete Account</Text>
                <Text style={styles.securityHint}>
                  Permanently removes your account and synced data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </>
        )}

        {userRole === 'admin' && (
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('AdminPanel')}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.cyan} />
            <Text style={[styles.actionText, { color: COLORS.cyan }]}>Admin Panel</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionRow} onPress={clearCache}>
          <Ionicons name="trash-bin-outline" size={20} color={COLORS.amber} />
          <Text style={styles.actionText}>Clear Downloaded Content</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={handleResetData}>
          <Ionicons name="refresh-circle-outline" size={20} color={COLORS.red} />
          <Text style={[styles.actionText, { color: COLORS.red }]}>Reset My Data</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Legal — required by both app stores and linked from the listing. */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Legal & Privacy</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('Legal', { document: 'privacy' })}
          accessibilityRole="button"
          accessibilityLabel="Read the privacy policy"
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.emerald} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionText}>Privacy Policy</Text>
            <Text style={styles.securityHint}>What the app stores and where</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('Legal', { document: 'terms' })}
          accessibilityRole="button"
          accessibilityLabel="Read the terms of use"
        >
          <Ionicons name="document-text-outline" size={20} color={COLORS.blue} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionText}>Terms of Use</Text>
            <Text style={styles.securityHint}>Conditions for using Qitab-e-Noor</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </ScrollView>

      <PinModal
        visible={pinDialog === 'setup'}
        mode="setup"
        onSubmit={pin => appLock.enable(pin)}
        onClose={() => setPinDialog(null)}
      />
      <PinModal
        visible={pinDialog === 'disable'}
        mode="verify"
        title="Turn off app lock"
        subtitle="Enter your current PIN to remove the lock. Your saved content is not affected."
        submitLabel="Turn off"
        onSubmit={pin => appLock.disable(pin)}
        onClose={() => setPinDialog(null)}
      />

      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!deleteBusy) setDeleteOpen(false); }}
      >
        <KeyboardAvoidingView
          style={styles.deleteBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.deleteCard}>
            <View style={[globalStyles.row, { gap: 8, marginBottom: 10 }]}>
              <Ionicons name="warning-outline" size={20} color={COLORS.red} />
              <Text style={styles.deleteTitle}>Delete your account?</Text>
            </View>
            <Text style={styles.deleteBody}>
              This permanently removes your account and all synced bookmarks, notes, reminders and progress from the server.
              Local personal data on this device will also be cleared. This cannot be undone.
            </Text>
            <TextInput
              style={styles.deleteInput}
              value={deletePassword}
              onChangeText={text => {
                setDeletePassword(text);
                if (deleteError) setDeleteError('');
              }}
              placeholder="Current password"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!deleteBusy}
              accessibilityLabel="Current password"
            />
            {deleteError ? <Text style={styles.deleteError}>{deleteError}</Text> : null}
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancel}
                onPress={() => setDeleteOpen(false)}
                disabled={deleteBusy}
                accessibilityRole="button"
                accessibilityLabel="Cancel account deletion"
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirm, deleteBusy && { opacity: 0.6 }]}
                onPress={handleDeleteAccount}
                disabled={deleteBusy}
                accessibilityRole="button"
                accessibilityLabel="Confirm account deletion"
              >
                {deleteBusy
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.deleteConfirmText}>Delete permanently</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/** A labelled switch. Disabled rows dim rather than disappear, so the
 *  dependency on the master notification toggle stays visible. */
function ToggleRow({ label, hint, value, onChange, disabled }) {
  // Its own component, so it needs its own subscription to the theme rather
  // than the module-level bindings it used to close over.
  const COLORS = useColors();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.toggleRow, disabled && { opacity: 0.45 }]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: COLORS.glassBorder, true: COLORS.gold + '88' }}
        thumbColor={value ? COLORS.gold : COLORS.textSecondary}
        ios_backgroundColor={COLORS.glassBorder}
      />
    </View>
  );
}

// A factory, not a frozen StyleSheet: built from whichever theme is active and
// rebuilt when it changes. The parameter is named COLORS so the rules below
// read exactly as they did when they closed over the frozen import.
const makeStyles = (COLORS) => ({
  prefLabel: {
    color: COLORS.textSecondary, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
  },
  prefValue: { color: COLORS.gold, fontSize: 13, fontWeight: '800' },
  prefDivider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  chipOn: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  chipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  // Nastaliq sits on a much taller line than Latin at the same point size.
  chipTextUrdu: { fontFamily: 'NotoNastaliqUrdu', fontSize: 13, lineHeight: 26 },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, gap: 12,
  },
  stepBtn: {
    width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  arabicPreview: { color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  toggleLabel: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  toggleHint: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  hintText: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, opacity: 0.8 },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  usageGrid: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  usageCell: { flex: 1, alignItems: 'center' },
  usageNumber: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  usageLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  usageHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
  usageReset: {
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  themeRowActive: {
    backgroundColor: 'rgba(255, 255, 255,0.1)',
  },
  themeLabel: {
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
  },
  delayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, paddingVertical: 10, paddingHorizontal: 2,
  },
  delayLabel: { color: COLORS.textSecondary, fontSize: 13 },
  delayChips: { flexDirection: 'row', gap: 7 },
  delayChip: {
    borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  delayChipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  delayChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, backgroundColor: COLORS.glass, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 10,
  },
  actionText: { flex: 1, color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  securityAction: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  securityActionText: {
    flex: 1, color: COLORS.gold, fontSize: 14, fontWeight: '700',
  },
  securityHint: {
    color: COLORS.textSecondary, fontSize: 10.5, lineHeight: 15, marginTop: 2,
  },
  securityNote: {
    color: COLORS.textSecondary, fontSize: 11, lineHeight: 16,
    marginTop: 4, opacity: 0.8,
  },
  downloadProgress: {
    marginTop: 4, padding: 12, borderRadius: 12,
    backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  downloadLabel: {
    flex: 1, marginRight: 10, color: COLORS.textPrimary,
    fontSize: 12.5, fontWeight: '700',
  },
  downloadPercent: { color: COLORS.emerald, fontSize: 12, fontWeight: '800' },
  progressTrack: {
    height: 7, borderRadius: 4, backgroundColor: COLORS.divider,
    overflow: 'hidden', marginTop: 8, marginBottom: 8,
  },
  progressFill: {
    height: '100%', borderRadius: 4, backgroundColor: COLORS.emerald,
  },
  downloadMeta: { color: COLORS.textSecondary, fontSize: 10.5, flex: 1 },
  downloadCancel: { color: COLORS.amber, fontSize: 11.5, fontWeight: '800' },

  deleteBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center', padding: 24,
  },
  deleteCard: {
    backgroundColor: COLORS.bg, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  deleteTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', flexShrink: 1 },
  deleteBody: {
    color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16,
  },
  deleteInput: {
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: 12, color: COLORS.textPrimary, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  deleteError: { color: COLORS.red, fontSize: 12, marginBottom: 8 },
  deleteActions: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    gap: 10, marginTop: 8,
  },
  deleteCancel: { paddingHorizontal: 14, paddingVertical: 10 },
  deleteCancelText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
  deleteConfirm: {
    backgroundColor: COLORS.red, borderRadius: 10, paddingHorizontal: 16,
    paddingVertical: 10, minWidth: 150, alignItems: 'center',
  },
  deleteConfirmText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
