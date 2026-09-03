import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform, Switch
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
import { cacheStats, clearAllCaches, isOnline, onConnectivityChange } from '../services/cache';
import { usePreferences } from '../hooks/usePreferences';
import { TRANSLATIONS, RECITERS, quranService } from '../services/quranApi';
import { notificationService } from '../services/notifications';
import { usePrayerLock } from '../context/PrayerLockContext';

const THEME_OPTIONS = [
  { name: 'default', label: 'Islamic Dark', icon: 'moon-outline' },
  { name: 'light', label: 'Light', icon: 'sunny-outline' },
  { name: 'highContrast', label: 'High Contrast', icon: 'contrast-outline' },
];

export default function SettingsScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const prayerLock = usePrayerLock();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [storage, setStorage] = useState(null);
  const [online, setOnline] = useState(isOnline());
  const [prefs, setPrefs] = usePreferences();
  // Shadow the frozen module-level imports with the active theme. Everything
  // below this line already says COLORS/globalStyles/styles, so switching
  // themes now repaints the screen without touching those call sites.
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [claudeState, setClaudeState] = useState(claudeStatus());
  const claudeOn = claudeState.ok;
  const firebaseUser = isFirebaseConfigured() ? auth.currentUser : null;

  // The key lives on the server now, so whether live AI is available has to
  // be asked for rather than read from the bundle.
  useEffect(() => {
    let active = true;
    refreshClaudeStatus().then(s => { if (active) setClaudeState(s); });
    return () => { active = false; };
  }, []);

  const currentTheme = useThemeName();
  const setTheme = useSetTheme();

  useEffect(() => {
    loadProfile();
    checkBackend();
    cacheStats().then(setStorage);
    return onConnectivityChange(setOnline);
  }, []);

  const loadProfile = async () => {
    try {
      const hasToken = await AsyncStorage.getItem('qitab_auth_token');
      if (hasToken) {
        try {
          const data = await backend.getMe();
          if (data?.user) {
            setUserName(data.user.name);
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
      const hasToken = await AsyncStorage.getItem('qitab_auth_token');
      if (hasToken) {
        await backend.getMe();
        setBackendStatus('connected');
      } else {
        setBackendStatus('guest');
      }
    } catch (e) {
      setBackendStatus('disconnected');
    }
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await AsyncStorage.setItem('qitab_user_name', trimmed);
    setUserName(trimmed);
    setEditingName(false);

    // Also save to backend if logged in
    const hasToken = await AsyncStorage.getItem('qitab_auth_token');
    if (hasToken) {
      try { await backend.updateSettings({}); } catch (e) { /* backend unavailable */ }
    }
  };

  const clearCache = () => {
    Alert.alert(
      'Clear downloaded content',
      'Removes saved Quran, Hadith, tafsir and prayer-time data. They will be ' +
      're-downloaded next time you open them, so you will need a connection. ' +
      'Your bookmarks, notes, favourites, learning progress and history are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive',
          onPress: async () => {
            await clearAllCaches();
            // Legacy prayer-time keys predate the cache layer.
            const keys = await AsyncStorage.getAllKeys();
            await AsyncStorage.multiRemove(
              keys.filter(k => k.includes('timings') || k.endsWith('_ts'))
            );
            setStorage(await cacheStats());
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
            const keys = await AsyncStorage.getAllKeys();
            const mine = keys.filter(k => /^(qitab_|prayer_log_|salawat_|bookmark|journal_|hifz_)/.test(k));
            await AsyncStorage.multiRemove(mine);
            setUserName('');
            Alert.alert('Done', 'Your data on this device has been reset.');
          },
        },
      ]
    );
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
                : backendStatus === 'guest' ? COLORS.amber : COLORS.red
            }]} />
            <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 15 }}>
              {backendStatus === 'connected' ? 'Backend connected (PostgreSQL)'
                : backendStatus === 'guest' ? 'Signed in anonymously — synced to this device'
                : 'Backend unavailable — using local storage'}
            </Text>
          </View>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}>
            {backendStatus === 'connected'
              ? 'Your bookmarks, notes and settings are synced to the server automatically. No account or password needed.'
              : 'Working from local storage. Your data is safe on this device and syncs automatically once the server is reachable.'}
          </Text>
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
        </View>

        {/* Theme */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Appearance</Text>
        <View style={styles.card}>
          {THEME_OPTIONS.map((theme) => (
            <TouchableOpacity
              key={theme.name}
              style={[styles.themeRow, currentTheme === theme.name && styles.themeRowActive]}
              onPress={() => {
                setTheme(theme.name);
                // Also save to backend if logged in
                AsyncStorage.getItem('qitab_auth_token').then(hasToken => {
                  if (hasToken) backend.updateSettings({ theme: theme.name }).catch(() => {});
                });
              }}
            >
              <Ionicons name={theme.icon} size={20} color={currentTheme === theme.name ? COLORS.gold : COLORS.textSecondary} />
              <Text style={[styles.themeLabel, { color: currentTheme === theme.name ? COLORS.gold : COLORS.textPrimary }]}>
                {theme.label}
              </Text>
              {currentTheme === theme.name && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
              )}
            </TouchableOpacity>
          ))}
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

        {/* Offline & storage */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Offline & Storage</Text>
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
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Downloaded content</Text>
            <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>
              {storage ? storage.readable : '—'}
            </Text>
          </View>
          <Text style={styles.hintText}>
            Anything you have opened once — surahs, hadith collections, tafsir,
            prayer times — stays readable without a connection.
          </Text>
        </View>

        {/* Data & Session */}
        <Text style={[globalStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Data & Session</Text>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={async () => {
            Alert.alert('Downloading', 'Saving the most-read surahs for offline use.');
            await quranService.warmUp(TRANSLATIONS[prefs.translationLanguage].id);
            setStorage(await cacheStats());
            Alert.alert('Done', 'Saved for offline reading.');
          }}
        >
          <Ionicons name="cloud-download-outline" size={20} color={COLORS.emerald} />
          <Text style={styles.actionText}>Download for Offline</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
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
      </ScrollView>
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
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
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
});
