import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, globalStyles } from '../theme';

const CORRECT_PIN = '12345';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email.'); return; }
    if (!/^\d{5}$/.test(pin)) { Alert.alert('Error', 'PIN must be exactly 5 digits.'); return; }

    if (pin === CORRECT_PIN) {
      const name = email.split('@')[0].replace(/[._]/g, ' ');
      const formatted = name.charAt(0).toUpperCase() + name.slice(1);
      await AsyncStorage.setItem('qitab_user_name', formatted);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 3) {
        setLocked(true);
      } else {
        Alert.alert('Incorrect PIN', `${3 - next} attempt${3 - next === 1 ? '' : 's'} remaining.`);
      }
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('qitab_user_name', 'Guest');
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <LinearGradient colors={['#05070a', '#0a0e14', '#05070a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            {/* Logo */}
            <View style={styles.logoWrap}>
              <View style={styles.logoGlow} />
              <View style={styles.logoBox}>
                <Ionicons name="moon" size={48} color={COLORS.gold} />
              </View>
            </View>

            <Text style={styles.appName}>Qitab-e-Noor</Text>
            <Text style={styles.tagline}>Your Ultimate Spiritual Companion</Text>

            {locked ? (
              <View style={styles.card}>
                <Ionicons name="warning" size={48} color={COLORS.red} style={{ alignSelf: 'center', marginBottom: 16 }} />
                <Text style={[styles.heading, { color: COLORS.red, textAlign: 'center' }]}>Account Locked</Text>
                <Text style={styles.subText}>Too many failed attempts.</Text>
                <TouchableOpacity
                  style={[globalStyles.btnPrimary, { marginTop: 20 }]}
                  onPress={() => { setLocked(false); setAttempts(0); setPin(''); }}
                >
                  <Ionicons name="person-add-outline" size={18} color="#000" />
                  <Text style={globalStyles.btnPrimaryText}>Reset & Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.heading}>Welcome Back</Text>
                <Text style={styles.subText}>Enter your credentials to continue</Text>

                {/* Email */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="admin@qitab.noor"
                      placeholderTextColor={COLORS.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* PIN */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>5-DIGIT PIN</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={[styles.textInput, { letterSpacing: 8, flex: 1 }]}
                      value={pin}
                      onChangeText={t => setPin(t.replace(/\D/g, '').slice(0, 5))}
                      placeholder="•••••"
                      placeholderTextColor={COLORS.textSecondary}
                      secureTextEntry={!showPin}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                    <TouchableOpacity onPress={() => setShowPin(v => !v)}>
                      <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={[globalStyles.btnPrimary, { marginTop: 8 }]} onPress={handleLogin}>
                  <Text style={globalStyles.btnPrimaryText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#000" />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                  <Text style={{ color: COLORS.gold, fontSize: 13, opacity: 0.7 }}>
                    Skip (Demo Mode)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.secureRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.emerald} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginLeft: 6 }}>
                Secure PIN Protection Active
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 40,
  },
  logoWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 35,
    backgroundColor: COLORS.gold,
    opacity: 0.1,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: COLORS.gold,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 36,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 28,
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  subText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  fieldWrap: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  skipBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
});
