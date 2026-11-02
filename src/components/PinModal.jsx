import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../hooks/useTheme';
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '../services/appLock';

/**
 * Collects a PIN for app-lock setup or verification.
 *
 * `onSubmit` receives the PIN and must resolve to { ok, message }. A failed
 * result stays on screen with the message, which is how wrong PINs and
 * lockouts are reported without dismissing the sheet.
 */
export default function PinModal({
  visible,
  mode = 'setup',
  title,
  subtitle,
  submitLabel,
  onSubmit,
  onClose,
}) {
  const COLORS = useColors();
  const styles = useThemedStyles(makeStyles);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('enter');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState(false);
  const confirmRef = useRef(null);

  const isSetup = mode === 'setup';
  const isConfirmStep = isSetup && step === 'confirm';
  const value = isConfirmStep ? confirmPin : pin;
  const setValue = isConfirmStep ? setConfirmPin : setPin;

  useEffect(() => {
    if (!visible) return;
    setPin('');
    setConfirmPin('');
    setStep('enter');
    setError(null);
    setBusy(false);
    setReveal(false);
  }, [visible, mode]);

  useEffect(() => {
    if (isConfirmStep) {
      const timer = setTimeout(() => confirmRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [isConfirmStep]);

  const close = () => {
    if (busy) return;
    setPin('');
    setConfirmPin('');
    setError(null);
    onClose?.();
  };

  const submit = async finalPin => {
    setBusy(true);
    setError(null);
    try {
      const result = await onSubmit(finalPin);
      if (result?.ok === false) {
        setError(result.message || 'Could not unlock.');
        setPin('');
        setConfirmPin('');
        setStep('enter');
        return;
      }
      setPin('');
      setConfirmPin('');
      onClose?.();
    } catch (e) {
      setError(e?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const advance = () => {
    if (busy) return;
    setError(null);

    if (value.length < PIN_MIN_LENGTH) {
      setError(`Use at least ${PIN_MIN_LENGTH} digits.`);
      return;
    }

    if (isSetup && step === 'enter') {
      setStep('confirm');
      return;
    }

    if (isSetup && pin !== confirmPin) {
      setError('The PINs do not match. Try again.');
      setConfirmPin('');
      return;
    }

    submit(value);
  };

  const heading = title || (isSetup ? 'Set an app PIN' : 'Enter your PIN');
  const helper = subtitle || (isSetup
    ? `Choose ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digits. You will need this PIN to open the app.`
    : 'Enter your app PIN to continue.');
  const actionLabel = busy
    ? null
    : isConfirmStep
      ? (submitLabel || 'Save PIN')
      : isSetup
        ? 'Continue'
        : (submitLabel || 'Unlock');

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />

        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.headerRow}>
            <View style={styles.iconPlate}>
              <Ionicons
                name={isSetup ? 'lock-closed-outline' : 'keypad-outline'}
                size={22}
                color={COLORS.gold}
              />
            </View>
            <TouchableOpacity
              onPress={close}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{heading}</Text>
          <Text style={styles.helper}>{helper}</Text>

          {isConfirmStep ? (
            <Text style={styles.stepLabel}>Re-enter your PIN</Text>
          ) : null}

          <View style={[styles.inputWrap, error && { borderColor: COLORS.red }]}>
            <TextInput
              ref={isConfirmStep ? confirmRef : undefined}
              style={styles.input}
              value={value}
              onChangeText={t => setValue(t.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH))}
              placeholder="••••"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="number-pad"
              secureTextEntry={!reveal}
              maxLength={PIN_MAX_LENGTH}
              autoFocus={isSetup ? step === 'enter' : true}
              autoComplete="off"
              textContentType="none"
              editable={!busy}
              accessibilityLabel={isConfirmStep ? 'Confirm PIN' : 'PIN'}
            />
            <TouchableOpacity
              onPress={() => setReveal(r => !r)}
              accessibilityRole="button"
              accessibilityLabel={reveal ? 'Hide PIN' : 'Show PIN'}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={reveal ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>
          ) : (
            <Text style={styles.counter}>{value.length}/{PIN_MAX_LENGTH} digits</Text>
          )}

          <TouchableOpacity
            style={[styles.primary, busy && { opacity: 0.7 }]}
            onPress={advance}
            disabled={busy || value.length < PIN_MIN_LENGTH}
            accessibilityRole="button"
            accessibilityLabel={actionLabel || 'Working'}
          >
            {busy ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryText}>{actionLabel}</Text>
            )}
          </TouchableOpacity>

          {isSetup ? (
            <Text style={styles.warning}>
              There is no PIN recovery. If you forget it, you will need to
              reinstall the app or clear its data.
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (COLORS) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconPlate: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.gold + '1F',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
  },
  helper: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  stepLabel: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 18,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 22,
    letterSpacing: 8,
    paddingVertical: 13,
  },
  counter: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'right',
  },
  error: {
    color: COLORS.red,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
  },
  primary: {
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryText: { color: '#000', fontSize: 15, fontWeight: '800' },
  warning: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
    opacity: 0.8,
  },
});
