import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../hooks/useTheme';
import { useAppLock } from '../context/AppLockContext';
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '../services/appLock';

/**
 * Keeps the app hidden until the lock configuration has been read, then
 * renders the navigator with the unlock sheet above it when locked.
 *
 * Only boot is blocked: once the navigator is mounted it stays mounted while
 * locked, so unlocking returns the user to the screen they left rather than
 * restarting the app.
 */
export function AppLockGate({ children }) {
  const { ready, locked } = useAppLock();
  const COLORS = useColors();
  const styles = useThemedStyles(makeStyles);

  if (!ready) {
    return (
      <View style={styles.boot} accessibilityLabel="Checking app lock">
        <View style={styles.bootMark}>
          <Ionicons name="book" size={38} color={COLORS.gold} />
        </View>
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 20 }} />
        <Text style={styles.bootText}>Qitab-e-Noor</Text>
      </View>
    );
  }

  return (
    <>
      {children}
      {locked ? <AppLockScreen /> : null}
    </>
  );
}

function AppLockScreen() {
  const {
    state, biometric, unlockWithPin, unlockWithBiometrics,
  } = useAppLock();
  const COLORS = useColors();
  const styles = useThemedStyles(makeStyles);

  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const autoPrompted = useRef(false);

  useEffect(() => {
    setPin('');
    setError(null);
    setBusy(false);
    setBioBusy(false);
    setCooldown(Math.ceil((state.retryAfterMs || 0) / 1000));
  }, [state.retryAfterMs]);

  // One tick per second rather than an interval that has to be torn down on
  // every change. When it reaches zero the PIN form becomes usable again.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const unlock = useCallback(async () => {
    if (busy || cooldown > 0) return;
    if (pin.length < PIN_MIN_LENGTH) {
      setError(`Enter your ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digit PIN.`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await unlockWithPin(pin);
      if (result.ok) {
        setPin('');
        return;
      }

      setPin('');
      if (result.reason === 'locked') {
        setCooldown(Math.ceil((result.retryAfterMs || 0) / 1000));
        setError('Too many incorrect attempts. Try again shortly.');
      } else {
        setError(result.message || 'Incorrect PIN.');
      }
    } catch (e) {
      setError(e?.message || 'Could not check your PIN. Try again.');
    } finally {
      setBusy(false);
    }
  }, [busy, cooldown, pin, unlockWithPin]);

  const tryBiometrics = useCallback(async () => {
    if (busy || bioBusy) return;
    setBioBusy(true);
    setError(null);
    try {
      const result = await unlockWithBiometrics('Unlock Qitab-e-Noor');
      if (!result.ok && result.reason !== 'user_cancel' && result.reason !== 'system_cancel') {
        setError(result.message || 'Biometric unlock failed.');
      }
    } catch (e) {
      setError(e?.message || 'Biometric unlock failed.');
    } finally {
      setBioBusy(false);
    }
  }, [bioBusy, busy, unlockWithBiometrics]);

  // Ask for biometrics once each time the lock is shown. If it is cancelled
  // or fails, the PIN field is still right there.
  useEffect(() => {
    if (!(state.biometricsEnabled && biometric.available)) return undefined;
    if (autoPrompted.current) return undefined;
    autoPrompted.current = true;

    const timer = setTimeout(() => { tryBiometrics(); }, 420);
    return () => clearTimeout(timer);
  }, [state.biometricsEnabled, biometric.available, tryBiometrics]);

  const biometricIcon = /face/i.test(biometric.label)
    ? 'scan-outline'
    : /finger|touch/i.test(biometric.label)
      ? 'finger-print-outline'
      : 'accessibility-outline';

  return (
    <Modal
      visible
      animationType="fade"
      onRequestClose={() => {}}
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={styles.center}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.mark}>
            <Ionicons name="shield-checkmark" size={34} color={COLORS.gold} />
          </View>

          <Text style={styles.eyebrow}>Qitab-e-Noor</Text>
          <Text style={styles.title}>App locked</Text>
          <Text style={styles.subtitle}>
            {state.biometricsEnabled && biometric.available
              ? `Unlock with ${biometric.label} or enter your PIN.`
              : 'Enter your PIN to continue where you left off.'}
          </Text>

          <View style={[styles.inputWrap, error && { borderColor: COLORS.red }]}>
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={t => {
                setPin(t.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH));
                if (error && cooldown <= 0) setError(null);
              }}
              placeholder="••••"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={PIN_MAX_LENGTH}
              autoFocus={!(state.biometricsEnabled && biometric.available)}
              autoComplete="off"
              textContentType="none"
              editable={!busy && cooldown <= 0}
              accessibilityLabel="App PIN"
            />
            <Ionicons name="lock-closed" size={18} color={COLORS.textSecondary} />
          </View>

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>
          ) : cooldown > 0 ? (
            <Text style={styles.error}>Try again in {cooldown}s</Text>
          ) : (
            <Text style={styles.hint}>Your PIN is checked on this device only.</Text>
          )}

          <TouchableOpacity
            style={[styles.primary, (busy || cooldown > 0) && { opacity: 0.6 }]}
            onPress={unlock}
            disabled={busy || cooldown > 0 || pin.length < PIN_MIN_LENGTH}
            accessibilityRole="button"
            accessibilityLabel="Unlock app"
          >
            {busy ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="lock-open-outline" size={19} color="#000" />
                <Text style={styles.primaryText}>Unlock</Text>
              </>
            )}
          </TouchableOpacity>

          {state.biometricsEnabled && biometric.available ? (
            <TouchableOpacity
              style={styles.bioButton}
              onPress={tryBiometrics}
              disabled={busy || bioBusy || cooldown > 0}
              accessibilityRole="button"
              accessibilityLabel={`Unlock with ${biometric.label}`}
            >
              {bioBusy ? (
                <ActivityIndicator color={COLORS.gold} />
              ) : (
                <>
                  <Ionicons name={biometricIcon} size={20} color={COLORS.gold} />
                  <Text style={styles.bioText}>Use {biometric.label}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          <Text style={styles.footnote}>
            Your saved content stays on this device while the app is locked.
          </Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (COLORS) => ({
  boot: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootMark: {
    width: 84, height: 84, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.gold + '1A',
    borderWidth: 1, borderColor: COLORS.gold + '3D',
  },
  bootText: {
    color: COLORS.textSecondary,
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  mark: {
    width: 80, height: 80, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.gold + '1A',
    borderWidth: 1, borderColor: COLORS.gold + '3D',
  },
  eyebrow: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: 22,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 22,
    maxWidth: 320,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    maxWidth: 340,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 15,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 24,
    letterSpacing: 9,
    paddingVertical: 14,
  },
  hint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 9,
    alignSelf: 'stretch',
    maxWidth: 340,
  },
  error: {
    color: COLORS.red,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 9,
    alignSelf: 'stretch',
    maxWidth: 340,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    alignSelf: 'stretch',
    maxWidth: 340,
    backgroundColor: COLORS.gold,
    height: 52,
    borderRadius: 15,
    marginTop: 18,
  },
  primaryText: { color: '#000', fontSize: 15, fontWeight: '800' },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    maxWidth: 340,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gold + '66',
    marginTop: 12,
  },
  bioText: { color: COLORS.gold, fontSize: 14, fontWeight: '700' },
  footnote: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 26,
    opacity: 0.75,
    maxWidth: 320,
  },
});
