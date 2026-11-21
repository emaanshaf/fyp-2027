import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { backend } from '../services/backend';

export default function LoginScreen({ onSuccess, onSkip }) {
  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async () => {
    setError('');
    setMessage('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (mode === 'register') {
      if (!name) {
        setError('Please enter your name');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await backend.login(email, password);
        onSuccess?.();
      } else {
        await backend.register(name, email, password);
        onSuccess?.();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError('');
    setMessage('');
    
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setLoading(true);
    try {
      if (backend.forgotPassword) {
        await backend.forgotPassword(email);
        setMessage('Password reset instructions sent to your email.');
      } else {
        setMessage('Password reset functionality not available.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[globalStyles.container, { backgroundColor: COLORS.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.iconContainer}>
            <Ionicons name="book" size={48} color={COLORS.gold} />
          </View>
          <Text style={styles.appTitle}>Qitab-e-Noor</Text>
          <Text style={styles.appSubtitle}>Light of Knowledge</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {mode !== 'forgot' && (
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, mode === 'login' && styles.activeTab]}
                onPress={() => { setMode('login'); setError(''); setMessage(''); }}
              >
                <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, mode === 'register' && styles.activeTab]}
                onPress={() => { setMode('register'); setError(''); setMessage(''); }}
              >
                <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'forgot' && (
            <View style={styles.forgotHeader}>
              <TouchableOpacity onPress={() => setMode('login')} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.forgotTitle}>Reset Password</Text>
              <View style={{ width: 24 }} />
            </View>
          )}

          <View style={styles.formContainer}>
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={20} color={COLORS.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.placeholder}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={20} color={COLORS.placeholder} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={COLORS.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {mode !== 'forgot' && (
              <View style={styles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={COLORS.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            )}

            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={COLORS.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {message ? <Text style={styles.successText}>{message}</Text> : null}

            {mode === 'login' && (
              <TouchableOpacity onPress={() => setMode('forgot')} style={styles.forgotLink}>
                <Text style={styles.forgotLinkText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={mode === 'forgot' ? handleForgot : handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Sign Up' : 'Send Reset Link'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
              <Text style={styles.secondaryButtonText}>Continue without account</Text>
            </TouchableOpacity>

          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerBanner: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: COLORS.gold,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.emerald,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.emerald,
  },
  forgotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  forgotTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  formContainer: {
    padding: 24,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    height: '100%',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotLinkText: {
    color: COLORS.gold,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.glassBorder,
  },
  dividerText: {
    color: COLORS.placeholder,
    marginHorizontal: 16,
    fontSize: 12,
  },
  secondaryButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.red,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    color: COLORS.emerald,
    marginBottom: 16,
    textAlign: 'center',
  },
});
